import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

/**
 * Live song recommendations from Spotify.
 *
 * Spotify retired /recommendations and /audio-features for apps created after
 * Nov 2024, so picks are built from the catalog endpoints that still work:
 *   - search (artists / tracks, newest releases included)
 *   - artists/{id}/top-tracks
 *   - artists/{id}/albums  (so brand-new singles show up)
 * Mood/energy shaping is done here, from the entry, not from audio features.
 */

type Pick = {
  id: string;
  title: string;
  artist: string;
  genre: string;
  reason: string;
  url: string;
  previewUrl: string | null;
  albumArt: string | null;
  releasedAt: string | null;
};

type SpotifyTrack = {
  id: string;
  name: string;
  popularity?: number;
  preview_url: string | null;
  external_urls?: { spotify?: string };
  artists?: { name: string }[];
  album?: { release_date?: string; images?: { url: string }[] };
};

const MOOD_LABELS = ["heavy", "low", "even", "light", "bright"];

// Genre buckets used to shape picks against mood + energy.
const CALM = ["ambient", "classical", "lo-fi", "bedroom pop", "jazz"];
const LIFT = ["hyperpop", "rap", "pop", "afrobeats", "rock"];

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getToken(id: string, secret: string): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.value;

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${id}:${secret}`)}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const details = await res.text();
    console.error(`Spotify token failed [${res.status}]: ${details}`);
    throw Object.assign(new Error("Spotify rejected the app credentials."), { status: 502 });
  }

  const data = await res.json();
  cachedToken = { value: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 };
  return cachedToken.value;
}

async function spotify<T>(token: string, path: string): Promise<T | null> {
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 429) {
    throw Object.assign(new Error("Spotify is rate limiting right now — try again shortly."), {
      status: 429,
    });
  }
  if (!res.ok) {
    console.error(`Spotify ${path} failed [${res.status}]: ${await res.text()}`);
    return null;
  }
  return (await res.json()) as T;
}

const nowYear = new Date().getFullYear();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const clientId = Deno.env.get("SPOTIFY_CLIENT_ID");
    const clientSecret = Deno.env.get("SPOTIFY_CLIENT_SECRET");
    if (!clientId || !clientSecret) return json({ error: "Spotify is not configured." }, 500);

    const body = await req.json().catch(() => null);
    const mood = Math.min(5, Math.max(1, Number(body?.mood) || 3));
    const energy = Math.min(5, Math.max(1, Number(body?.energy) || 3));
    const seed = Number.isFinite(body?.seed) ? Math.abs(Number(body.seed)) : 0;
    const count = Math.min(6, Math.max(1, Number(body?.count) || 3));
    const toList = (v: unknown, max: number) =>
      Array.isArray(v)
        ? v
            .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
            .map((x) => x.trim().slice(0, 60))
            .slice(0, max)
        : [];
    const artists = toList(body?.artists, 8);
    const genres = toList(body?.genres, 8);
    const themeGenres = toList(body?.themeGenres, 4);
    const feelings = toList(body?.feelings, 6);

    const token = await getToken(clientId, clientSecret);

    // Rotate which preferences lead, so repeat entries on the same day differ.
    const rotate = <T,>(list: T[], by: number) =>
      list.length ? list.map((_, i) => list[(i + by) % list.length]) : list;

    const candidates: (Pick & { score: number; src: "artist" | "genre" })[] = [];
    const seen = new Set<string>();

    const push = (
      track: SpotifyTrack,
      genre: string,
      reason: string,
      bonus: number,
      src: "artist" | "genre" = "artist",
    ) => {
      if (!track?.id || seen.has(track.id)) return;
      seen.add(track.id);
      const released = track.album?.release_date ?? null;
      const freshness = released && Number(released.slice(0, 4)) >= nowYear - 1 ? 2 : 0;
      const bucketFit =
        (energy <= 2 || mood <= 2) && CALM.includes(genre)
          ? 3
          : energy >= 4 && LIFT.includes(genre)
            ? 3
            : 1;
      candidates.push({
        id: track.id,
        title: track.name,
        artist: track.artists?.map((a) => a.name).join(", ") ?? "Unknown",
        genre,
        reason,
        url: track.external_urls?.spotify ?? `https://open.spotify.com/track/${track.id}`,
        previewUrl: track.preview_url ?? null,
        albumArt: track.album?.images?.[1]?.url ?? track.album?.images?.[0]?.url ?? null,
        releasedAt: released,
        src,
        score: bonus + bucketFit + freshness + (track.popularity ?? 0) / 100,
      });
    };

    // 1) Artists the user listed. Track search is used rather than
    // /artists/{id}/top-tracks, which returns 403 for apps created after the
    // Nov 2024 Spotify API changes.
    for (const name of rotate(artists, seed).slice(0, 4)) {
      const found = await spotify<{ artists?: { items?: { id: string; name: string; genres?: string[] }[] } }>(
        token,
        `/search?type=artist&limit=1&q=${encodeURIComponent(name)}`,
      );
      const artist = found?.artists?.items?.[0];
      const label = artist?.name ?? name;
      const genre = artist?.genres?.[0] ?? genres[0] ?? "your taste";

      // Their catalog, rotating through the results so repeats differ.
      const catalog = await spotify<{ tracks?: { items?: SpotifyTrack[] } }>(
        token,
        `/search?type=track&limit=10&offset=${(seed * 3) % 30}&market=US&q=${encodeURIComponent(
          `artist:"${label}"`,
        )}`,
      );
      for (const track of catalog?.tracks?.items ?? []) {
        if (!track.artists?.some((a) => a.name.toLowerCase() === label.toLowerCase())) continue;
        push(track, genre, `${label} — an artist you listed`, 14);
      }

      // Anything they've put out recently, so the pool grows with new releases.
      const recent = await spotify<{ tracks?: { items?: SpotifyTrack[] } }>(
        token,
        `/search?type=track&limit=6&market=US&q=${encodeURIComponent(
          `artist:"${label}" year:${nowYear - 1}-${nowYear}`,
        )}`,
      );
      for (const track of recent?.tracks?.items ?? []) {
        if (!track.artists?.some((a) => a.name.toLowerCase() === label.toLowerCase())) continue;
        push(track, genre, `new from ${label}`, 16);
      }
    }


    // 2) Genres the user picked, plus genres the entry's theme suggests.
    const genrePool = [...rotate(genres, seed), ...themeGenres].slice(0, 6);
    for (const genre of genrePool) {
      const fromTheme = themeGenres.includes(genre) && !genres.includes(genre);
      const query = `genre:"${genre}"${seed % 2 === 0 ? ` year:${nowYear - 2}-${nowYear}` : ""}`;
      const offset = (seed * 5) % 40;
      const res = await spotify<{ tracks?: { items?: SpotifyTrack[] } }>(
        token,
        `/search?type=track&limit=8&offset=${offset}&market=US&q=${encodeURIComponent(query)}`,
      );
      for (const track of res?.tracks?.items ?? []) {
        push(
          track,
          genre,
          fromTheme ? `${genre}, for what this entry is about` : `${genre} is your taste`,
          fromTheme ? 4 : 6,
          "genre",
        );
      }
    }

    if (candidates.length === 0) {
      return json({ error: "Spotify returned nothing for those preferences." }, 502);
    }

    // Best matches first, then rotate within each source using the seed so two
    // entries on the same day get different picks.
    const ranked = candidates.sort((a, b) => b.score - a.score);
    const byArtist = ranked.filter((c) => c.src === "artist").slice(0, count * 4);
    const byGenre = ranked.filter((c) => c.src === "genre").slice(0, count * 4);

    const picks: Pick[] = [];
    const names = (artist: string) => artist.split(",").map((n) => n.trim().toLowerCase());
    const take = (item: (typeof ranked)[number] | undefined, dedupeArtists = true) => {
      if (!item) return false;
      if (picks.some((p) => p.id === item.id)) return false;
      if (dedupeArtists) {
        const taken = new Set(picks.flatMap((p) => names(p.artist)));
        if (names(item.artist).some((n) => taken.has(n))) return false;
      }
      const { score: _score, src: _src, ...pick } = item;
      picks.push(pick);
      return true;
    };
    const drawFrom = (source: typeof ranked, wanted: number) => {
      if (!source.length) return;
      let added = 0;
      for (let i = 0; i < source.length && added < wanted && picks.length < count; i++) {
        if (take(source[(seed + i) % source.length])) added += 1;
      }
    };

    // Saved artists always get at least one slot; saved genres keep the rest so
    // neither preference crowds the other out.
    const artistSlots = artists.length ? (byGenre.length ? Math.max(1, count - 1) : count) : 0;
    drawFrom(byArtist, artistSlots);
    drawFrom(byGenre, count - picks.length);
    drawFrom(byArtist, count - picks.length);
    for (let i = 0; i < ranked.length && picks.length < count; i++) {
      take(ranked[(seed + i) % ranked.length], false);
    }


    const basis = [
      artists.length ? "your artists" : null,
      genres.length ? "your genres" : null,
      `${MOOD_LABELS[mood - 1]} mood`,
      feelings.length ? `"${feelings[0]}"` : null,
    ]
      .filter(Boolean)
      .join(" · ");

    return json({ picks, basis, source: "spotify" });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error("spotify-songs error:", err);
    return json({ error: err instanceof Error ? err.message : "Unexpected error", status }, status);
  }
});
