import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const MODEL = "gemini-3.6-flash";

type Plan = { headline: string; encouragement: string; steps: string[] };

const SYSTEM = `You are a warm, grounded companion inside a private journal app used by high school students.
You write short, specific advice about ONE journal entry.

Rules:
- Never diagnose, never moralize, never use motivational-poster language.
- No streaks, no productivity pressure, no "you should journal more".
- Reference concrete details the person actually wrote, in their own vocabulary.
- Tone: calm, plain, human. Never clinical, never bubbly.
- Steps must be small and doable in the next hour.
- If the entry mentions self-harm or crisis, gently name it and suggest telling one trusted person or a crisis line, without alarm.

Respond with JSON only: {"headline": string (max 8 words), "encouragement": string (2-3 sentences), "steps": string[] (3 items, each one sentence)}.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) return json({ error: "AI is not configured." }, 500);

    const body = await req.json().catch(() => null);
    const summary = typeof body?.summary === "string" ? body.summary.slice(0, 6000) : "";
    if (!summary.trim()) return json({ error: "Nothing to read in this entry." }, 400);
    const variation = Number.isFinite(body?.variation) ? Number(body.variation) : 0;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM }] },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Journal entry:\n${summary}\n\nWrite advice and encouragement as JSON.${
                    variation > 0
                      ? ` Take a different angle than a previous attempt (variation ${variation}).`
                      : ""
                  }`,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: variation > 0 ? 1.1 : 0.9,
            thinkingConfig: { thinkingLevel: "low" },
          },
        }),
      },
    );

    if (!res.ok) {
      const details = await res.text();
      console.error(`Gemini API failed [${res.status}]: ${details}`);
      const message =
        res.status === 429
          ? "Too many requests right now — try again in a moment."
          : res.status === 401 || res.status === 403
            ? "The Gemini API key was rejected."
            : "The AI couldn't answer just now.";
      return json({ error: message, status: res.status }, res.status);
    }

    const data = await res.json();
    const raw =
      data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p?.text ?? "").join("") ?? "";
    let parsed: Partial<Plan> = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.error("Unparseable model output:", raw.slice(0, 500));
      return json({ error: "The AI reply came back malformed." }, 502);
    }

    const steps = Array.isArray(parsed.steps)
      ? parsed.steps.filter((s): s is string => typeof s === "string" && s.trim().length > 0).slice(0, 4)
      : [];

    if (!parsed.encouragement || steps.length === 0) {
      return json({ error: "The AI reply came back empty." }, 502);
    }

    return json({
      headline: (parsed.headline ?? "For right now").toString().slice(0, 120),
      encouragement: parsed.encouragement.toString(),
      steps,
    });
  } catch (err) {
    console.error("entry-advice error:", err);
    return json({ error: err instanceof Error ? err.message : "Unexpected error" }, 500);
  }
});
