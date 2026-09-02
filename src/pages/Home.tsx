import { Link, useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import logoMark from "@/assets/logo-unravel.png";
import AppShell from "@/components/AppShell";

import { entryPreview, MODE_META } from "@/lib/content";
import type { EntryMode } from "@/lib/types";
import { useEntries, useSettings } from "@/lib/store";

const WAYS: EntryMode[] = ["longform", "voice", "bullets", "mood", "prompt", "short"];
const MORE: EntryMode[] = ["gratitude"];

const greeting = () => {
  const h = new Date().getHours();
  if (h < 5) return "Still up";
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  if (h < 22) return "Evening";
  return "Late tonight";
};

const Home = () => {
  const { settings } = useSettings();
  const { entries } = useEntries();
  const navigate = useNavigate();
  const recent = entries.slice(0, 3);

  return (
    <AppShell>
      <header className="animate-fade">
        <div className="flex items-start gap-3.5">
          <div
            role="img"
            aria-label="Unravel logo: a ball of yarn with one thread unraveling"
            className="mt-0.5 h-11 w-auto shrink-0 bg-primary sm:h-14"
            style={{
              aspectRatio: "459 / 651",
              WebkitMaskImage: `url(${logoMark})`,
              maskImage: `url(${logoMark})`,
              WebkitMaskSize: "contain",
              maskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskPosition: "center",
            }}
          />

          <h2 className="text-gradient mt-1 font-display text-[1.9rem] font-bold leading-none tracking-[-0.015em] sm:text-[2.2rem]">
            Unravel
          </h2>

        </div>

        

        <p className="mt-6 text-sm text-muted-foreground">
          {greeting()}
          {settings.name ? `, ${settings.name}` : ""}
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold leading-tight tracking-[-0.02em] sm:text-4xl">
          How do you want to check in?
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          <span className="mark">Thirty seconds is a real check-in.</span> So is thirty minutes. Nothing here
          counts days or keeps score.
        </p>

      </header>

      <section className="mt-10 grid gap-3 animate-rise sm:grid-cols-2">
        {WAYS.map((mode) => {
          const meta = MODE_META[mode];
          return (
            <button
              key={mode}
              onClick={() => navigate(`/write?mode=${mode}`)}
              className="surface surface-hover group flex w-full items-center justify-between gap-4 p-5 text-left hover:-translate-y-0.5"
            >
              <span>
                <span className="font-display text-xl font-semibold">{meta.label}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{meta.blurb}</span>
              </span>
              <span className="whitespace-nowrap rounded-full border border-border/60 bg-gradient-to-b from-secondary to-muted px-3 py-1 text-xs font-medium text-secondary-foreground">
                {meta.minutes}
              </span>
            </button>
          );
        })}
      </section>

      <section className="mt-8">
        <h2 className="section-label">Something softer</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {MORE.map((mode) => {
            const meta = MODE_META[mode];
            return (
              <button
                key={mode}
                onClick={() => navigate(`/write?mode=${mode}`)}
                className="surface-hover rounded-2xl border border-border/70 bg-gradient-to-br from-secondary/80 via-muted/60 to-card/40 p-4 text-left"
              >
                <span className="block text-base font-medium">{meta.label}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{meta.minutes}</span>
              </button>
            );
          })}
        </div>
      </section>


      <section className="mt-8 grid grid-cols-2 gap-3">
        <Link
          to="/breathe"
          className="surface-hover rounded-2xl border border-border/70 bg-gradient-to-br from-secondary/80 via-muted/60 to-card/40 p-4"
        >
          <span className="block text-base font-medium">Just breathe</span>
          <span className="mt-1 block text-xs text-muted-foreground">No entry needed</span>
        </Link>
        <Link
          to="/history"
          className="surface-hover rounded-2xl border border-border/70 bg-gradient-to-br from-secondary/80 via-muted/60 to-card/40 p-4"
        >
          <span className="block text-base font-medium">Read something old</span>
          <span className="mt-1 block text-xs text-muted-foreground">{entries.length} saved</span>
        </Link>
      </section>

      {recent.length > 0 && (
        <section className="mt-12">
          <h2 className="section-label">Recent</h2>

          <ul className="mt-4 divide-y">
            {recent.map((entry) => (
              <li key={entry.id}>
                <Link to={`/entry/${entry.id}`} className="block py-4 transition-opacity hover:opacity-70">
                  <p className="text-xs text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm leading-relaxed">{entryPreview(entry)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-14 flex items-center gap-2 text-xs text-muted-foreground">
        <Lock className="h-3 w-3" /> Saved to your account only. Nobody else can read it.
      </p>
    </AppShell>
  );
};

export default Home;
