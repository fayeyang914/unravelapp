import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUMMARY_THRESHOLD_SECONDS = 300; // 5 minutes

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

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) return json({ error: "Transcription is not configured." }, 500);

    const body = await req.json().catch(() => null);
    const entryId = typeof body?.entryId === "string" ? body.entryId : "";
    if (!/^[0-9a-f-]{36}$/i.test(entryId)) return json({ error: "Which entry?" }, 400);

    // The user's own token: row-level security decides what they can reach.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) return json({ error: "Not signed in." }, 401);

    const { data: entry, error: entryError } = await supabase
      .from("entries")
      .select("id, audio_path, audio_seconds, transcript")
      .eq("id", entryId)
      .maybeSingle();

    if (entryError) return json({ error: entryError.message }, 400);
    if (!entry?.audio_path) return json({ error: "This entry has no recording." }, 400);

    const { data: file, error: downloadError } = await supabase.storage
      .from("voice-memos")
      .download(entry.audio_path);
    if (downloadError || !file) return json({ error: "The recording could not be read." }, 400);
    if (file.size < 2048) return json({ error: "That recording is too short to transcribe." }, 400);

    const ext = entry.audio_path.split(".").pop()?.toLowerCase() || "webm";
    const form = new FormData();
    form.append("model", "openai/gpt-4o-transcribe");
    form.append("file", file, `memo.${ext}`);

    const sttRes = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableKey}` },
      body: form,
    });

    if (!sttRes.ok) {
      const detail = await sttRes.text().catch(() => "");
      console.error(`Transcription failed [${sttRes.status}]: ${detail}`);
      const message =
        sttRes.status === 429
          ? "Too many requests right now — try again in a moment."
          : sttRes.status === 402
            ? "Transcription credits have run out."
            : "The recording couldn't be transcribed just now.";
      return json({ error: message }, sttRes.status);
    }

    const sttData = await sttRes.json();
    const transcript = typeof sttData?.text === "string" ? sttData.text.trim() : "";
    if (!transcript) return json({ error: "No words were found in that recording." }, 422);

    // Long memos also get a short readable summary.
    let summary: string | null = null;
    const seconds = Number(entry.audio_seconds ?? 0);
    if (seconds > SUMMARY_THRESHOLD_SECONDS || transcript.length > 3000) {
      const chatRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3.7-flash",
          messages: [
            {
              role: "system",
              content:
                "You condense a person's private voice journal into a short readable recap. " +
                "Use their own words and second person ('you'). 3-5 short sentences or bullets. " +
                "No advice, no diagnosis, no encouragement, no judgement — just what they talked about and how they sounded.",
            },
            { role: "user", content: transcript.slice(0, 24000) },
          ],
        }),
      });

      if (chatRes.ok) {
        const chatData = await chatRes.json();
        const text = chatData?.choices?.[0]?.message?.content;
        if (typeof text === "string" && text.trim()) summary = text.trim();
      } else {
        console.error(`Summary failed [${chatRes.status}]: ${await chatRes.text().catch(() => "")}`);
      }
    }

    const { error: updateError } = await supabase
      .from("entries")
      .update({
        transcript,
        transcript_summary: summary,
        transcript_status: "done",
      })
      .eq("id", entryId);

    if (updateError) return json({ error: updateError.message }, 400);

    return json({ transcript, summary });
  } catch (err) {
    console.error("transcribe-voice error:", err);
    return json({ error: err instanceof Error ? err.message : "Unexpected error" }, 500);
  }
});
