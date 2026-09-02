import { useEffect, useState } from "react";
import { X } from "lucide-react";
import AppShell from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { GENRES } from "@/lib/content";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { importLegacyLocalData, legacyLocalEntryCount } from "@/lib/store";
import type { ThemeName } from "@/lib/types";
import { useEntries, useSettings } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const THEMES: { id: ThemeName; label: string; swatch: string[] }[] = [
  { id: "linen", label: "Linen", swatch: ["#f4efe6", "#e6ded1", "#c48c6e"] },
  { id: "blush", label: "Blush", swatch: ["#fbeaee", "#f4d5dd", "#d97e9c"] },
  { id: "mist", label: "Mist", swatch: ["#e4f0f8", "#cfe3f0", "#4a95bf"] },
  { id: "sage", label: "Sage", swatch: ["#e8f6ec", "#d3ebd9", "#49a179"] },
  { id: "lilac", label: "Lilac", swatch: ["#f0e9f9", "#e2d6f3", "#a077d1"] },
  { id: "dusk", label: "Dusk", swatch: ["#181a26", "#262a3b", "#a58ad6"] },
  { id: "ink", label: "Ink", swatch: ["#141312", "#242220", "#c99a63"] },
];


const FONTS = [
  { display: "Fraunces", body: "Karla", label: "Soft serif" },
  { display: "Karla", body: "Karla", label: "All sans" },
  { display: "Fraunces", body: "Fraunces", label: "All serif" },
];

const REMINDERS = [
  { id: "manual", label: "Only when I open it" },
  { id: "daily", label: "Daily" },
  { id: "days", label: "Certain days" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
] as const;

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

const Row = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-center justify-between gap-6 py-5">
    <div>
      <p className="text-base">{title}</p>
      {description && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

const Settings = () => {
  const { settings, update } = useSettings();
  const { entries, clearAll } = useEntries();
  const { user, signOut } = useAuth();
  const [artistDraft, setArtistDraft] = useState("");
  const [legacyCount, setLegacyCount] = useState(() => legacyLocalEntryCount());
  const [importing, setImporting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setIsAdmin(!!data);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);



  const toggleTaste = (g: string) =>
    update({
      musicTastes: settings.musicTastes.includes(g)
        ? settings.musicTastes.filter((x) => x !== g)
        : [...settings.musicTastes, g],
    });

  const exportData = () => {
    const fmt = (iso: string) =>
      new Date(iso).toLocaleString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    const MODE_LABEL: Record<string, string> = {
      longform: "Long-form writing",
      short: "Short note",
      bullets: "Bullet dump",
      voice: "Voice memo",
      mood: "Mood check-in",
      prompt: "Guided prompt",
      gratitude: "Gratitude",
    };
    const L = ["1 (lowest)", "2", "3", "4", "5 (highest)"];
    const lines: string[] = [];

    lines.push("UNRAVEL — YOUR JOURNAL EXPORT");
    lines.push("=".repeat(60));
    lines.push(`Exported: ${fmt(new Date().toISOString())}`);
    lines.push(`Account: ${user?.email ?? "—"}`);
    lines.push(`Total entries: ${entries.length}`);
    lines.push("");
    lines.push("This file is yours. Nothing here is shared with anyone.");
    lines.push("");
    lines.push("-".repeat(60));
    lines.push("PART 1 — YOUR PREFERENCES");
    lines.push("-".repeat(60));
    lines.push(`Name: ${settings.name || "(not set)"}`);
    lines.push(`Theme: ${settings.theme}`);
    lines.push(`Fonts: ${settings.displayFont} (headings) / ${settings.bodyFont} (body)`);
    lines.push(`Check-in rhythm: ${settings.reminderMode}`);
    lines.push(`Reminder time: ${settings.reminderTime} (${settings.timezone})`);
    lines.push(`Email reminders: ${settings.reminderEmails ? "on" : "off"}`);
    lines.push(`Music genres: ${settings.musicTastes.join(", ") || "(none)"}`);
    lines.push(`Favourite artists: ${settings.musicArtists.join(", ") || "(none)"}`);
    lines.push(`Passcode lock: ${settings.lockEnabled ? "on" : "off"}`);
    lines.push("");
    lines.push("-".repeat(60));
    lines.push(`PART 2 — YOUR ENTRIES (newest first)`);
    lines.push("-".repeat(60));

    const sorted = [...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (sorted.length === 0) lines.push("", "No entries yet.");

    sorted.forEach((e, i) => {
      lines.push("");
      lines.push(`ENTRY ${i + 1} of ${sorted.length} — ${fmt(e.createdAt)}`);
      lines.push(`Format: ${MODE_LABEL[e.mode] ?? e.mode}`);
      if (e.title) lines.push(`Title: ${e.title}`);
      lines.push(`Mood: ${L[e.mood - 1] ?? e.mood}   Energy: ${L[e.energy - 1] ?? e.energy}`);
      if (e.feelings?.length) lines.push(`Feelings: ${e.feelings.join(", ")}`);
      if (e.prompt) lines.push(`Prompt: ${e.prompt}`);
      if (e.text) {
        lines.push("");
        lines.push("What you wrote:");
        e.text.split("\n").forEach((l) => lines.push(`  ${l}`));
      }
      if (e.bullets?.length) {
        lines.push("");
        lines.push("Bullets:");
        e.bullets.forEach((b) => lines.push(`  • ${b}`));
      }
      if (e.gratitude?.length) {
        lines.push("");
        lines.push("Grateful for:");
        e.gratitude.forEach((g) => lines.push(`  • ${g}`));
      }
      if (e.audioPath) {
        lines.push("");
        lines.push(
          `Voice memo: ${e.audioSeconds ? `${Math.round(e.audioSeconds / 60)} min ${e.audioSeconds % 60}s` : "recorded"} (audio stays in the app)`,
        );
        if (e.transcriptSummary) {
          lines.push("Summary:");
          e.transcriptSummary.split("\n").forEach((l) => lines.push(`  ${l}`));
        }
        if (e.transcript) {
          lines.push("Transcript:");
          e.transcript.split("\n").forEach((l) => lines.push(`  ${l}`));
        }
      }
      lines.push("");
      lines.push("-".repeat(60));
    });

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `unravel-journal-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };


  return (
    <AppShell>
      <header className="animate-fade">
        <h1 className="page-title">Settings</h1>
        <div className="page-underline mt-3" />
      </header>

      <section className="mt-10">
        <h2 className="section-label">Appearance</h2>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => update({ theme: t.id })}
              className={cn(
                "surface surface-hover p-4 text-left",
                settings.theme === t.id && "border-accent/60 ring-1 ring-accent/30",
              )}
            >
              <span className="flex gap-1.5">
                {t.swatch.map((c) => (
                  <span
                    key={c}
                    className="h-5 w-5 rounded-full border shadow-sm"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </span>
              <span
                className={cn(
                  "mt-3 block text-sm",
                  settings.theme === t.id ? "font-semibold text-foreground" : "text-muted-foreground",
                )}
              >
                {t.label}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {FONTS.map((f) => (
            <button
              key={f.label}
              onClick={() => update({ displayFont: f.display, bodyFont: f.body })}
              className={cn(
                "chip px-4 py-2 text-sm",
                settings.displayFont === f.display && settings.bodyFont === f.body && "chip-active",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

      </section>

      <section className="mt-10">
        <h2 className="section-label">You</h2>
        <div className="mt-4 divide-y">
          <Row title="Name or nickname" description="Only used in greetings. Leave blank if you'd rather not.">
            <Input
              value={settings.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="optional"
              className="h-11 w-36 rounded-xl bg-card"
            />
          </Row>
        </div>
        <p className="mt-5 text-sm font-semibold">Music you actually listen to</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {GENRES.map((g) => (
            <button
              key={g}
              onClick={() => toggleTaste(g)}
              className={cn("chip text-sm", settings.musicTastes.includes(g) && "chip-active")}
            >
              {g}
            </button>
          ))}
        </div>

        <p className="mt-6 text-sm font-semibold">Your most listened-to artists</p>

        <p className="mt-1 text-xs text-muted-foreground">
          Type a name and press enter. Song picks lean toward these when they fit the entry.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const name = artistDraft.trim();
            if (!name) return;
            if (!settings.musicArtists.some((a) => a.toLowerCase() === name.toLowerCase())) {
              update({ musicArtists: [...settings.musicArtists, name] });
            }
            setArtistDraft("");
          }}
          className="mt-3 flex gap-2"
        >
          <Input
            value={artistDraft}
            onChange={(e) => setArtistDraft(e.target.value)}
            placeholder="e.g. Frank Ocean"
            className="h-11 flex-1 rounded-xl bg-card"
          />
          <Button type="submit" variant="secondary" className="h-11 rounded-full px-5">
            Add
          </Button>
        </form>
        {settings.musicArtists.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {settings.musicArtists.map((a) => (
              <button
                key={a}
                onClick={() => update({ musicArtists: settings.musicArtists.filter((x) => x !== a) })}
                className="chip chip-active inline-flex items-center gap-2 text-sm"
                aria-label={`Remove ${a}`}
              >
                {a}
                <X className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        )}
      </section>


      <section className="mt-10">
        <h2 className="section-label">Check-in rhythm</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {REMINDERS.map((r) => (
            <button
              key={r.id}
              onClick={() => update({ reminderMode: r.id })}
              className={cn("chip px-4 py-2 text-sm", settings.reminderMode === r.id && "chip-active")}
            >
              {r.label}
            </button>
          ))}
        </div>

        {settings.reminderMode === "days" && (
          <div className="mt-4 flex gap-2">
            {DAYS.map((d, i) => (
              <button
                key={i}
                onClick={() =>
                  update({
                    reminderDays: settings.reminderDays.includes(i)
                      ? settings.reminderDays.filter((x) => x !== i)
                      : [...settings.reminderDays, i],
                  })
                }
                className={cn(
                  "chip h-10 w-10 px-0 text-sm",
                  settings.reminderDays.includes(i) && "chip-active",
                )}
              >
                {d}
              </button>
            ))}
          </div>
        )}


        {settings.reminderMode !== "manual" && (
          <div className="mt-4 divide-y">
            <Row title="Time" description={`Sent around this time, in your local time zone (${settings.timezone}).`}>
              <Input
                type="time"
                value={settings.reminderTime}
                onChange={(e) => update({ reminderTime: e.target.value })}
                className="h-11 w-32 rounded-xl bg-card"
              />
            </Row>
            <Row
              title="Email reminders"
              description={`A short, quiet nudge to ${user?.email ?? "your email"}. Turn it off any time.`}
            >
              <Switch
                checked={settings.reminderEmails}
                onCheckedChange={(v) => update({ reminderEmails: v })}
              />
            </Row>
            <Row title="Discreet wording" description='Emails read "A moment for you" — never the app name or your mood.'>
              <Switch
                checked={settings.discreetNotifications}
                onCheckedChange={(v) => update({ discreetNotifications: v })}
              />
            </Row>
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="section-label">Account</h2>
        <div className="mt-2 divide-y">
          <Row title="Signed in as" description="Entries, recordings and these preferences are saved to this account only.">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
          </Row>
          {legacyCount > 0 && (
            <Row
              title="Entries saved in this browser"
              description={`${legacyCount} older ${legacyCount === 1 ? "entry" : "entries"} from before you had an account. Move them into it?`}
            >
              <Button
                variant="secondary"
                className="rounded-full"
                disabled={importing}
                onClick={async () => {
                  setImporting(true);
                  try {
                    const n = await importLegacyLocalData();
                    setLegacyCount(0);
                    toast(`Moved ${n} ${n === 1 ? "entry" : "entries"} into your account.`);
                  } catch {
                    toast("That import didn't finish. Try again.");
                  } finally {
                    setImporting(false);
                  }
                }}
              >
                {importing ? "Moving…" : "Move them"}
              </Button>
            </Row>
          )}
          {isAdmin && (
            <Row title="Impact metrics" description="Aggregate mood and energy across all accounts. No entry text, ever.">
              <Button asChild variant="ghost" className="rounded-full">
                <Link to="/impact">Open</Link>
              </Button>
            </Row>
          )}
          <Row title="Sign out" description="You'll need your email and password to get back in.">
            <Button variant="ghost" className="rounded-full" onClick={() => void signOut()}>
              Sign out
            </Button>
          </Row>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="section-label">Privacy &amp; data</h2>
        <div className="mt-2 divide-y">
          <Row title="Passcode lock" description="Ask for a 4-digit code when the app opens, on top of your password.">
            <Switch
              checked={settings.lockEnabled}
              onCheckedChange={(v) => update({ lockEnabled: v, passcode: v ? settings.passcode : "" })}
            />
          </Row>
          {settings.lockEnabled && (
            <Row title="Code" description="A quick second lock — not a replacement for your password.">
              <Input
                value={settings.passcode}
                inputMode="numeric"
                maxLength={4}
                onChange={(e) => update({ passcode: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                placeholder="4 digits"
                className="h-11 w-28 rounded-xl bg-card tracking-[0.3em]"
              />
            </Row>
          )}
          <Row title="Export a copy" description="A clearly labelled text file with your preferences and every entry, newest first.">
            <Button variant="secondary" onClick={exportData} className="rounded-full">
              Export
            </Button>
          </Row>
          <Row title="Delete all entries" description="Immediate and permanent, including voice recordings.">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="rounded-full text-destructive hover:text-destructive">
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete every entry?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {entries.length} {entries.length === 1 ? "entry" : "entries"} and every voice recording will be
                    erased from your account. This can't be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep them</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      void clearAll();
                      toast("Everything deleted.");
                    }}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Row>
        </div>
      </section>

      <p className="mt-12 text-xs leading-relaxed text-muted-foreground">
        Your entries, voice recordings and preferences are stored in your own account and readable only by you.
      </p>
    </AppShell>
  );
};

export default Settings;
