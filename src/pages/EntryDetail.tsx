import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Loader2, Trash2 } from "lucide-react";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import Aftercare from "@/components/Aftercare";
import { ENERGY_LABELS, MODE_META, MOOD_LABELS } from "@/lib/content";
import { signedAudioUrl, useEntries } from "@/lib/store";
import { transcribeVoiceMemo } from "@/lib/advice";

const LONG_MEMO_SECONDS = 300;

const EntryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { entries, loading, removeEntry, updateEntry } = useEntries();
  const entry = entries.find((e) => e.id === id);

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);
  const [showFull, setShowFull] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (entry?.audioPath) {
      signedAudioUrl(entry.audioPath).then((url) => {
        if (!cancelled) setAudioUrl(url);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [entry?.audioPath]);

  if (loading && !entry) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">Opening…</p>
      </AppShell>
    );
  }

  if (!entry) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">
          This entry no longer exists.{" "}
          <Link to="/history" className="underline underline-offset-4">
            Back to timeline
          </Link>
          .
        </p>
      </AppShell>
    );
  }

  const isLong = (entry.audioSeconds ?? 0) > LONG_MEMO_SECONDS;

  const transcribe = async () => {
    setTranscribing(true);
    setTranscribeError(null);
    try {
      const result = await transcribeVoiceMemo(entry.id);
      await updateEntry(entry.id, {
        transcript: result.transcript,
        transcriptSummary: result.summary ?? undefined,
        transcriptStatus: "done",
      });
    } catch (err) {
      setTranscribeError(err instanceof Error ? err.message : "That didn't work just now.");
    } finally {
      setTranscribing(false);
    }
  };

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <Link
          to="/history"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Timeline
        </Link>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Delete entry"
          onClick={() => {
            void removeEntry(entry.id);
            navigate("/history");
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <p className="mt-8 eyebrow text-accent">
        {new Date(entry.createdAt).toLocaleString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })}
      </p>

      <h1 className="page-title mt-3">{entry.title ?? MODE_META[entry.mode].label}</h1>
      <div className="page-underline mt-3" />

      <div className="mt-5 flex flex-wrap gap-2 text-sm">
        <span className="rounded-full border border-border/70 bg-gradient-to-b from-secondary to-muted px-3 py-1 font-medium">
          {MOOD_LABELS[entry.mood - 1]}
        </span>
        <span className="rounded-full border border-border/70 bg-gradient-to-b from-secondary to-muted px-3 py-1 font-medium">
          {ENERGY_LABELS[entry.energy - 1]}
        </span>
        {entry.feelings.map((f) => (
          <span key={f} className="rounded-full border border-accent/40 bg-accent/12 px-3 py-1 font-medium">
            {f}
          </span>
        ))}
      </div>


      <div className="mt-8 space-y-5">
        {entry.prompt && (
          <p className="border-l-2 border-accent/50 pl-4 font-display text-lg italic text-muted-foreground">
            {entry.prompt}
          </p>
        )}
        {entry.text && <p className="whitespace-pre-wrap text-base leading-loose">{entry.text}</p>}
        {entry.bullets?.length ? (
          <ul className="space-y-2">
            {entry.bullets.map((b, i) => (
              <li key={i} className="flex gap-3 leading-relaxed">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/70" />
                {b}
              </li>
            ))}
          </ul>
        ) : null}
        {entry.gratitude?.length ? (
          <ul className="space-y-2">
            {entry.gratitude.map((g, i) => (
              <li key={i} className="flex gap-3 leading-relaxed">
                <span className="font-display font-bold text-accent">{i + 1}</span>
                {g}
              </li>
            ))}
          </ul>
        ) : null}


        {entry.audioPath && (
          <div className="space-y-4">
            {audioUrl ? (
              <audio controls src={audioUrl} className="w-full max-w-sm" />
            ) : (
              <p className="text-sm text-muted-foreground">Loading the recording…</p>
            )}

            {!entry.transcript && (
              <div>
                <Button
                  variant="secondary"
                  onClick={transcribe}
                  disabled={transcribing}
                  className="rounded-full"
                >
                  {transcribing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="mr-2 h-4 w-4" />
                  )}
                  {isLong ? "Read it instead (with a recap)" : "Read it instead"}
                </Button>
                <p className="mt-2 text-xs text-muted-foreground">
                  {isLong
                    ? "Over five minutes, so you'll get a short recap plus the full text."
                    : "Turns this memo into text you can skim later."}
                </p>
              </div>
            )}

            {transcribeError && <p className="text-sm text-destructive">{transcribeError}</p>}

            {entry.transcript && (
              <div className="surface p-5">
                {entry.transcriptSummary ? (
                  <>
                    <p className="eyebrow">
                      Short recap
                    </p>
                    <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed">
                      {entry.transcriptSummary}
                    </p>
                    <button
                      onClick={() => setShowFull((v) => !v)}
                      className="mt-4 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                    >
                      {showFull ? "Hide the full transcript" : "Read the full transcript"}
                    </button>
                    {showFull && (
                      <p className="mt-4 whitespace-pre-wrap border-t pt-4 text-sm leading-loose">
                        {entry.transcript}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="eyebrow">Transcript</p>
                    <p className="mt-3 whitespace-pre-wrap text-base leading-loose">{entry.transcript}</p>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-12 border-t pt-10">
        <Aftercare entry={entry} revisit />
      </div>
    </AppShell>
  );
};

export default EntryDetail;
