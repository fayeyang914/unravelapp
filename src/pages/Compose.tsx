import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2, Plus, Shuffle, X } from "lucide-react";
import AppShell from "@/components/AppShell";
import CheckInSliders from "@/components/CheckInSliders";
import VoiceRecorder, { type Recording } from "@/components/VoiceRecorder";
import Aftercare from "@/components/Aftercare";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MODE_META, MODE_SLIDERS, PROMPTS } from "@/lib/content";
import type { Entry, EntryMode, NewEntry } from "@/lib/types";
import { uploadVoiceMemo, useEntries } from "@/lib/store";
import { useAuth } from "@/lib/auth";


const isMode = (v: string | null): v is EntryMode =>
  !!v && Object.prototype.hasOwnProperty.call(MODE_META, v);

const Compose = () => {
  const [params] = useSearchParams();
  const mode: EntryMode = isMode(params.get("mode")) ? (params.get("mode") as EntryMode) : "short";
  const meta = MODE_META[mode];
  const { addEntry } = useEntries();
  const { user } = useAuth();

  const specs = MODE_SLIDERS[mode] ?? [];
  const [sliders, setSliders] = useState<Record<string, number>>(() =>
    Object.fromEntries(specs.map((s) => [s.id, 3])),
  );

  const [feelings, setFeelings] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [bullets, setBullets] = useState<string[]>([""]);
  const [gratitude, setGratitude] = useState<string[]>(["", "", ""]);
  const [audio, setAudio] = useState<{ recording?: Recording; seconds: number }>({ seconds: 0 });
  const [promptIndex, setPromptIndex] = useState(() => Math.floor(Math.random() * PROMPTS.length));
  const [saved, setSaved] = useState<Entry | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const prompt = PROMPTS[promptIndex];

  const canSave = useMemo(() => {
    if (mode === "mood") return true;
    if (mode === "voice") return !!audio.recording;
    if (mode === "bullets") return bullets.some((b) => b.trim());
    if (mode === "gratitude") return gratitude.some((g) => g.trim());
    return text.trim().length > 0;
  }, [mode, audio.recording, bullets, gratitude, text]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    setSaveError(null);
    try {
      let audioPath: string | undefined;
      if (mode === "voice" && audio.recording) {
        audioPath = await uploadVoiceMemo(user.id, audio.recording.blob, audio.recording.mimeType);
      }

      const bound = (field: "mood" | "energy") => {
        const spec = specs.find((s) => s.field === field);
        return spec ? sliders[spec.id] ?? 3 : 3;
      };

      const draft: NewEntry = {
        mode,
        mood: bound("mood"),
        energy: bound("energy"),
        feelings,

        title: title.trim() || undefined,
        text: text.trim() || undefined,
        bullets: mode === "bullets" ? bullets.map((b) => b.trim()).filter(Boolean) : undefined,
        gratitude: mode === "gratitude" ? gratitude.map((g) => g.trim()).filter(Boolean) : undefined,
        prompt: mode === "prompt" ? prompt : undefined,
        audioPath,
        audioSeconds: audioPath ? audio.seconds : undefined,
      };

      const intent = specs.map((s) => `${s.question} → ${s.steps[(sliders[s.id] ?? 3) - 1]}`);
      const entry = await addEntry(draft);
      setSaved(intent.length ? { ...entry, intent } : entry);

    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "This couldn't be saved just now.");
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <AppShell>
        <Aftercare entry={saved} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <span className="rounded-full border border-accent/40 bg-accent/12 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]">
          {meta.label}
        </span>
      </div>

      <h1 className="page-title mt-8">
        {mode === "prompt"
          ? prompt
          : mode === "gratitude"
            ? "Three small things"
            : mode === "mood"
              ? "How are you, really?"
              : mode === "voice"
                ? "Say it out loud"
                : mode === "bullets"
                  ? "Dump it out"
                  : mode === "longform"
                    ? "Room to write"
                    : "Quick check-in"}
      </h1>
      <div className="page-underline mt-3" />

      {mode === "prompt" && (
        <button
          onClick={() => setPromptIndex((i) => (i + 1) % PROMPTS.length)}
          className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <Shuffle className="h-3.5 w-3.5" /> Different question
        </button>
      )}

      <div className="mt-10 space-y-10">
        <CheckInSliders
          mode={mode}
          values={sliders}
          onValue={(id, v) => setSliders((prev) => ({ ...prev, [id]: v }))}
          feelings={feelings}
          onFeelings={setFeelings}
          showFeelings={mode !== "voice" && mode !== "gratitude"}
        />



        {mode === "longform" && (
          <div className="space-y-4">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (optional)"
              className="h-12 rounded-xl border-0 bg-transparent px-0 font-display text-xl shadow-none focus-visible:ring-0"
            />
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Start anywhere. Sentences don't have to connect."
              className="min-h-[320px] resize-none rounded-2xl border-0 bg-card p-5 text-base leading-loose shadow-none focus-visible:ring-1 focus-visible:ring-ring/40"
            />
          </div>
        )}

        {(mode === "short" || mode === "prompt") && (
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={mode === "prompt" ? "A sentence is enough." : "One or two lines about right now."}
            className="min-h-[140px] resize-none rounded-2xl border-0 bg-card p-5 text-base leading-relaxed shadow-none focus-visible:ring-1 focus-visible:ring-ring/40"
          />
        )}

        {mode === "bullets" && (
          <div className="space-y-3">
            {bullets.map((b, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-muted-foreground">—</span>
                <Input
                  value={b}
                  autoFocus={i === bullets.length - 1 && bullets.length > 1}
                  onChange={(e) => setBullets(bullets.map((x, j) => (j === i ? e.target.value : x)))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setBullets([...bullets, ""]);
                    }
                  }}
                  placeholder="a fragment"
                  className="h-11 rounded-xl border-0 bg-card"
                />
                {bullets.length > 1 && (
                  <button
                    onClick={() => setBullets(bullets.filter((_, j) => j !== i))}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Remove line"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => setBullets([...bullets, ""])}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" /> Add line
            </button>
          </div>
        )}

        {mode === "gratitude" && (
          <div className="space-y-3">
            {gratitude.map((g, i) => (
              <Input
                key={i}
                value={g}
                onChange={(e) => setGratitude(gratitude.map((x, j) => (j === i ? e.target.value : x)))}
                placeholder={["something small", "someone", "something about you"][i] ?? "something"}
                className="h-12 rounded-xl border-0 bg-card"
              />
            ))}
            <p className="text-xs text-muted-foreground">One is fine. This isn't a checklist.</p>
          </div>
        )}

        {mode === "voice" && (
          <VoiceRecorder
            recording={audio.recording}
            seconds={audio.seconds}
            onChange={(recording, seconds) => setAudio({ recording, seconds })}
          />
        )}
      </div>

      {saveError && <p className="mt-6 text-sm text-destructive">{saveError}</p>}

      <div className="mt-12 flex items-center gap-4">
        <Button onClick={save} disabled={!canSave || saving} className="rounded-full px-7">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save privately
        </Button>
        <Button asChild variant="ghost" className="rounded-full text-muted-foreground">
          <Link to="/">Leave without saving</Link>
        </Button>
      </div>
    </AppShell>
  );
};

export default Compose;
