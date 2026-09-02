import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import AppShell from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { entryPreview, MODE_META, MOOD_LABELS } from "@/lib/content";
import { useEntries } from "@/lib/store";
import { cn } from "@/lib/utils";

const moodTone = (mood: number) => ["bg-accent/70", "bg-accent/55", "bg-accent/40", "bg-accent/25", "bg-accent/15"][5 - mood];

const History = () => {
  const { entries, loading } = useEntries();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (mode !== "all" && e.mode !== mode) return false;
      if (!q) return true;
      return `${e.title ?? ""} ${entryPreview(e)} ${e.transcript ?? ""} ${e.transcriptSummary ?? ""} ${e.feelings.join(" ")}`
        .toLowerCase()
        .includes(q);
    });
  }, [entries, query, mode]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    filtered.forEach((e) => {
      const key = new Date(e.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" });
      map.set(key, [...(map.get(key) ?? []), e]);
    });
    return [...map.entries()];
  }, [filtered]);

  return (
    <AppShell>
      <header className="animate-fade">
        <h1 className="page-title">Timeline</h1>
        <div className="page-underline mt-3" />
        <p className="mt-4 text-sm text-muted-foreground">
          {loading ? (
            "Loading your entries…"
          ) : (
            <>
              <span className="mark">
                {entries.length} {entries.length === 1 ? "entry" : "entries"}
              </span>{" "}
              so far. Gaps are not failures.
            </>
          )}
        </p>
      </header>

      <div className="surface mt-8 flex items-center gap-3 px-4">
        <Search className="h-4 w-4 text-accent" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search words, feelings, transcripts…"
          className="h-12 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {["all", ...Object.keys(MODE_META)].map((m) => (
          <button key={m} onClick={() => setMode(m)} className={cn("chip", mode === m && "chip-active")}>
            {m === "all" ? "Everything" : MODE_META[m as keyof typeof MODE_META].label}
          </button>
        ))}
      </div>


      {filtered.length === 0 ? (
        !loading && (
          <p className="mt-16 text-sm text-muted-foreground">
            Nothing here yet.{" "}
            <Link to="/" className="underline underline-offset-4">
              Start with thirty seconds
            </Link>
            .
          </p>
        )
      ) : (
        <div className="mt-10 space-y-10">
          {grouped.map(([month, items]) => (
            <section key={month}>
              <h2 className="section-label">{month}</h2>
              <ul className="mt-4 space-y-2">
                {items.map((entry) => (
                  <li key={entry.id}>
                    <Link
                      to={`/entry/${entry.id}`}
                      className="surface-hover group flex gap-4 rounded-2xl border border-transparent p-4 hover:border-border/70 hover:bg-card"
                    >
                      <span
                        className={cn(
                          "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-accent/10 transition-transform duration-300 group-hover:scale-125",
                          moodTone(entry.mood),
                        )}
                      />
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-baseline gap-x-3 text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">
                            {new Date(entry.createdAt).toLocaleDateString(undefined, {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                          <span className="uppercase tracking-[0.14em]">{MODE_META[entry.mode].label}</span>
                          <span className="text-accent">{MOOD_LABELS[entry.mood - 1]}</span>
                        </span>
                        {entry.title && (
                          <span className="mt-1 block font-display text-lg font-semibold">{entry.title}</span>
                        )}
                        <span className="mt-1 line-clamp-2 block text-sm leading-relaxed">
                          {entryPreview(entry)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

      )}
    </AppShell>
  );
};

export default History;
