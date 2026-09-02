import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Music, Wind, Compass, Check, Shuffle, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import BreathingSession from "@/components/BreathingSession";
import { supportPlan, type SupportPlan } from "@/lib/content";
import { fetchEntryAdvice } from "@/lib/advice";
import { fetchSongSuggestions, type SongSuggestions } from "@/lib/music";
import type { Entry } from "@/lib/types";
import { useEntries, useSettings } from "@/lib/store";
import { cn } from "@/lib/utils";

type Panel = "music" | "breathe" | "plan" | null;

const Aftercare = ({ entry, revisit }: { entry: Entry; revisit?: boolean }) => {
  const { settings } = useSettings();
  const { updateEntry } = useEntries();

  const [panel, setPanel] = useState<Panel>(null);
  const [songSeed, setSongSeed] = useState(() => Math.floor(Math.random() * 997));
  const [planSeed, setPlanSeed] = useState(0);
  const [songs, setSongs] = useState<SongSuggestions | null>(null);
  const [songsLoading, setSongsLoading] = useState(false);

  useEffect(() => {
    if (panel !== "music") return;
    let cancelled = false;
    setSongsLoading(true);
    fetchSongSuggestions(entry, settings, songSeed)
      .then((res) => {
        if (!cancelled) setSongs(res);
      })
      .finally(() => {
        if (!cancelled) setSongsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [panel, entry, settings, songSeed]);

  const [plan, setPlan] = useState<SupportPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  const needsTranscript = entry.mode === "voice" && !entry.transcript && !!entry.audioPath;

  useEffect(() => {
    if (panel !== "plan") return;
    let cancelled = false;
    setPlanLoading(true);
    setPlanError(null);
    fetchEntryAdvice(entry, planSeed, (result) =>
      updateEntry(entry.id, {
        transcript: result.transcript,
        transcriptSummary: result.summary ?? undefined,
        transcriptStatus: "done",
      }),
    )
      .then((p) => {
        if (!cancelled) setPlan(p);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setPlanError(err.message);
        const local = supportPlan(entry, planSeed);
        setPlan({ ...local, basis: `Written on-device from this entry (${local.basis})` });
      })

      .finally(() => {
        if (!cancelled) setPlanLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panel, entry.id, planSeed]);


  const options = [
    { key: "music" as const, label: "Song options", icon: Music },
    { key: "breathe" as const, label: "Meditation", icon: Wind },
    { key: "plan" as const, label: "AI advice & encouragement", icon: Compass },
  ];


  return (
    <div className="animate-rise">
      {!revisit && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Check className="h-4 w-4" /> Saved, privately.
        </div>
      )}
      <h1 className="mt-4 text-3xl">{revisit ? "Anything for this entry?" : "What would help right now?"}</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        All optional. Nothing is a complete answer — this check-in is already finished.
      </p>

      <div className="mt-8 space-y-3">
        {options.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setPanel(panel === key ? null : key)}
            className={cn(
              "flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors",
              panel === key ? "border-accent bg-accent/10" : "hover:border-foreground/25",
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={1.5} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {panel === "music" && (
        <div className="surface mt-6 p-5">
          <p className="text-sm text-muted-foreground">
            {settings.musicArtists.length || settings.musicTastes.length
              ? `Pulled live from Spotify inside your taste — ${[...settings.musicTastes, ...settings.musicArtists].slice(0, 4).join(", ")}${[...settings.musicTastes, ...settings.musicArtists].length > 4 ? "…" : ""} — and matched to this entry.`
              : "Pulled live from Spotify, matched to this entry."}
          </p>

          {songsLoading && !songs && (
            <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Looking for something that fits…
            </p>
          )}

          {songs && (
            <>
              <ul className="mt-4 divide-y">
                {songs.picks.map((song) => (
                  <li key={song.id} className="flex gap-4 py-3">
                    {song.albumArt && (
                      <img
                        src={song.albumArt}
                        alt={`Album art for ${song.title} by ${song.artist}`}
                        loading="lazy"
                        className="h-14 w-14 shrink-0 rounded-lg object-cover"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-display text-lg">
                        {song.url ? (
                          <a
                            href={song.url}
                            target="_blank"
                            rel="noreferrer"
                            className="underline-offset-4 hover:underline"
                          >
                            {song.title}
                          </a>
                        ) : (
                          song.title
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {song.artist}
                        {song.genre ? ` · ${song.genre}` : ""}
                      </p>
                      {song.note && <p className="mt-1 text-sm">{song.note}</p>}
                      <p className="mt-1 text-xs text-muted-foreground">Why this: {song.reason}</p>
                      {song.previewUrl && (
                        <audio controls src={song.previewUrl} className="mt-2 h-8 w-full max-w-[240px]" />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">
                {songs.source === "spotify"
                  ? `From Spotify · ${songs.basis}`
                  : "Spotify couldn't answer just now, so these come from the built-in list."}
              </p>
            </>
          )}

          <div className="mt-4 flex items-center gap-4">
            <button
              onClick={() => setSongSeed((s) => s + 3)}
              disabled={songsLoading}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              <Shuffle className="h-3.5 w-3.5" /> Different songs
            </button>
            {settings.musicArtists.length === 0 && (
              <Link to="/settings" className="text-sm underline underline-offset-4">
                Add your most-listened artists
              </Link>
            )}
          </div>
        </div>
      )}

      {panel === "breathe" && (
        <div className="surface mt-6 p-5">
          <BreathingSession />
        </div>
      )}

      {panel === "plan" && (
        <div className="surface mt-6 p-5">
          {planLoading && !plan && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {needsTranscript ? "Listening to your memo, then reading it…" : "Reading your entry…"}
            </p>
          )}


          {planError && (
            <p className="mb-4 text-sm text-muted-foreground">
              {planError} Here's something written on-device instead.
            </p>
          )}

          {plan && (
            <div className={cn(planLoading && "opacity-50 transition-opacity")}>
              <p className="font-display text-xl">{plan.headline}</p>
              <p className="mt-3 text-sm leading-relaxed">{plan.encouragement}</p>
              <ol className="mt-5 space-y-3">
                {plan.steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-relaxed">
                    <span className="text-muted-foreground">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
              <button
                onClick={() => setPlanSeed((s) => s + 1)}
                disabled={planLoading}
                className="mt-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", planLoading && "animate-spin")} /> Different advice
              </button>
              <p className="mt-4 text-xs text-muted-foreground">
                {plan.basis}. Only this entry's text is sent, never your name or other entries. Turn this off any time
                in Settings.
              </p>
            </div>
          )}
        </div>
      )}


      <div className="mt-10 flex gap-3">
        <Button asChild className="rounded-full px-6">
          <Link to="/">Nothing, I'm done</Link>
        </Button>
        <Button asChild variant="ghost" className="rounded-full">
          <Link to={`/entry/${entry.id}`}>See the entry</Link>
        </Button>
      </div>
    </div>
  );
};

export default Aftercare;
