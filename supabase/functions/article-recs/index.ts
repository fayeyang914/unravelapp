import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { libraryShelf } from "./library.ts";


const MODEL = "google/gemini-3.7-flash";
const FRESH_HOURS = 72;

const CATEGORIES = [
  "Stress & overwhelm",
  "Sleep & energy",
  "Anxious thoughts",
  "School & focus",
  "Friends & family",
  "Mood & motivation",
  "Self & identity",
  "Body & movement",
];

const SYSTEM = `You curate a small reading shelf inside a private journal app used by high school students.

You use web search to find REAL, currently-published articles (no invented links, no paywalled PDFs, no clickbait).
Prefer trustworthy, teen-appropriate sources: youth mental-health organisations, university and hospital health pages,
Child Mind Institute, Greater Good Science Center, Jed Foundation, Headspace/Calm blogs, ReachOut, NHS, APA, Verywell Mind,
respected journalism. Never recommend anything selling a product, diagnosing, or fear-mongering.

Tone of your own writing: calm, plain, human. No motivational-poster language, no "you should journal more",
no streaks or productivity pressure, no diagnosing. Never imply the reader is broken or behind.

Respond with JSON only, no code fences:
{"sections":[{"category": one of the allowed categories, "note": string (one short sentence on why this shelf is here),
"articles":[{"title": string, "url": string (real, working, https), "source": string (publication name),
"summary": string (1 sentence on what it covers), "why": string (1 sentence tying it to what they've been carrying, second person),
"minutes": number (estimated read time)}]}]}

Give 3 to 4 sections, each with 2 to 3 articles. Never repeat a URL.

CRITICAL about URLs: only use a URL you literally saw in a web search result during this request.
Never construct, guess, shorten or "fix" a URL from a title or a site's usual pattern — guessed links 404.
If you cannot confirm a link from search results, leave that article out. Prefer a landing page you actually
saw over a deep article path you inferred. Every link is opened and checked afterwards, so invented links are discarded.`;

type Article = {
  title: string;
  url: string;
  source: string;
  summary: string;
  why: string;
  minutes: number;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Not signed in." }, 401);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "Reading suggestions are not configured." }, 500);


    const body = await req.json().catch(() => null);
    const concerns = typeof body?.concerns === "string" ? body.concerns.slice(0, 4000) : "";
    const refresh = body?.refresh === true;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return json({ error: "Not signed in." }, 401);

    // Serve the cached shelf unless it's stale or a refresh was asked for.
    const { data: cached } = await supabase
      .from("article_recs")
      .select("id, category, note, title, url, source, summary, why, minutes, created_at")
      .order("created_at", { ascending: false })
      .limit(60);

    const newest = cached?.[0]?.created_at ? new Date(cached[0].created_at).getTime() : 0;
    const fresh = newest && Date.now() - newest < FRESH_HOURS * 60 * 60 * 1000;
    if (cached?.length && fresh && !refresh) {
      return json({ items: cached, generatedAt: cached[0].created_at, cached: true });
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.8,
        tools: [{ type: "google_search" }],
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: `Allowed categories: ${CATEGORIES.join(" | ")}

What this person has been carrying lately (from their own check-ins):
${concerns || "Nothing specific — they are new here. Choose broadly useful shelves."}

Search the web for current articles that would genuinely help with this, then return the JSON only.`,
          },
        ],
      }),
    });

    type Section = { category?: string; note?: string | null; articles?: Article[] };

    const toRows = (sections: Section[]) => {
      const seen = new Set<string>();
      return sections.flatMap((section) => {
        const category = CATEGORIES.includes(String(section.category))
          ? String(section.category)
          : CATEGORIES[0];
        const note = typeof section.note === "string" ? section.note.slice(0, 240) : null;
        return (section.articles ?? [])
          .filter((a) => a && typeof a.url === "string" && /^https:\/\//.test(a.url) && a.title)
          .filter((a) => !seen.has(a.url) && (seen.add(a.url), true))
          .slice(0, 3)
          .map((a) => ({
            user_id: user.id,
            category,
            note,
            title: String(a.title).slice(0, 240),
            url: a.url.slice(0, 1000),
            source: a.source ? String(a.source).slice(0, 120) : null,
            summary: a.summary ? String(a.summary).slice(0, 500) : null,
            why: a.why ? String(a.why).slice(0, 500) : null,
            minutes: Number.isFinite(Number(a.minutes))
              ? Math.min(90, Math.max(1, Number(a.minutes)))
              : null,
          }));
      });
    };

    // Models can hallucinate plausible-looking URLs, so every link is opened
    // before it is saved. Anything that 404s / errors is dropped.
    const verify = async <T extends { url: string }>(rows: T[]): Promise<T[]> => {
      const checks = await Promise.all(
        rows.map(async (row) => {
          try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 12000);
            const res = await fetch(row.url, {
              method: "GET",
              redirect: "follow",
              signal: controller.signal,
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
                Accept: "text/html,application/xhtml+xml",
              },
            });
            clearTimeout(timer);
            if (res.ok) {
              const html = (await res.text().catch(() => "")).slice(0, 4000).toLowerCase();
              const looksMissing =
                /<title>[^<]*(page not found|404|not found|error)/.test(html);
              if (!looksMissing) return row;
              console.error(`article-recs dropping soft-404: ${row.url}`);
              return null;
            }
            // 403/429 = bot protection on a page that may still be fine for a human.
            if (res.status === 403 || res.status === 429) return row;
            console.error(`article-recs dropping dead link [${res.status}]: ${row.url}`);
            return null;
          } catch (err) {
            console.error(`article-recs dropping unreachable link: ${row.url}`, err);
            return null;
          }
        }),
      );
      return checks.filter((r): r is T => r !== null);
    };


    const save = async (rows: ReturnType<typeof toRows>, curated: boolean) => {
      await supabase.from("article_recs").delete().eq("user_id", user.id);
      const { data: inserted, error: insertError } = await supabase
        .from("article_recs")
        .insert(rows)
        .select("id, category, note, title, url, source, summary, why, minutes, created_at");
      if (insertError) return json({ error: insertError.message }, 400);
      return json({
        items: inserted,
        generatedAt: inserted?.[0]?.created_at ?? new Date().toISOString(),
        cached: false,
        curated,
      });
    };

    // Live search unavailable or unusable → last shelf, else the verified library.
    const fallback = async (reason: string) => {
      console.error(`article-recs falling back: ${reason}`);
      if (cached?.length)
        return json({ items: cached, generatedAt: cached[0].created_at, cached: true, stale: true });
      return save(toRows(libraryShelf(concerns)), true);
    };

    if (!res.ok) {
      const details = await res.text().catch(() => "");
      if (res.status === 402 || res.status === 403) {
        if (cached?.length)
          return json({ items: cached, generatedAt: cached[0].created_at, cached: true, stale: true });
        return fallback(`gateway blocked [${res.status}]: ${details.slice(0, 200)}`);
      }
      return fallback(`web search failed [${res.status}]: ${details.slice(0, 300)}`);
    }

    const data = await res.json();
    const raw: string = data?.choices?.[0]?.message?.content ?? "";

    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    let parsed: { sections?: Section[] } = {};
    try {
      parsed = JSON.parse(raw.slice(start, end + 1));
    } catch {
      return fallback(`unparseable model output: ${raw.slice(0, 300)}`);
    }

    const rows = toRows(parsed.sections ?? []);
    if (!rows.length) return fallback("model returned no usable articles");

    const live = await verify(rows);
    if (live.length < 4) {
      // Too few links survived — top up with the hand-checked library so the shelf stays useful.
      const seen = new Set(live.map((r) => r.url));
      const topUp = toRows(libraryShelf(concerns)).filter((r) => !seen.has(r.url));
      if (!live.length) return fallback("every model link was dead");
      return save([...live, ...topUp], true);
    }

    return save(live, false);


  } catch (err) {
    console.error("article-recs error:", err);
    return json({ error: err instanceof Error ? err.message : "Unexpected error" }, 500);
  }
});
