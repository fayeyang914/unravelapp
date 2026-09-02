import { useMemo } from "react";
import { Link } from "react-router-dom";
import AppShell from "@/components/AppShell";
import { Switch } from "@/components/ui/switch";
import { ENERGY_LABELS } from "@/lib/content";
import { useEntries, useSettings } from "@/lib/store";

const Insights = () => {
  const { entries } = useEntries();
  const { settings, update } = useSettings();

  const stats = useMemo(() => {
    if (!entries.length) return null;
    const avgEnergy = entries.reduce((s, e) => s + e.energy, 0) / entries.length;

    const feelingCounts = new Map<string, number>();
    entries.forEach((e) => e.feelings.forEach((f) => feelingCounts.set(f, (feelingCounts.get(f) ?? 0) + 1)));
    const topFeelings = [...feelingCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

    const byWeekday = new Map<number, number[]>();
    entries.forEach((e) => {
      const d = new Date(e.createdAt).getDay();
      byWeekday.set(d, [...(byWeekday.get(d) ?? []), e.energy]);
    });
    const weekdays: { day: number; avg: number; n: number }[] = [...byWeekday.entries()]
      .map(([day, energies]) => ({ day, avg: energies.reduce((a, b) => a + b, 0) / energies.length, n: energies.length }))
      .sort((a, b) => a.avg - b.avg);

    const recent = entries.slice(0, 14).reverse();
    return { avgEnergy, topFeelings, weekdays, recent };
  }, [entries]);

  const dayName = (d: number) =>
    ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d];

  return (
    <AppShell>
      <header className="animate-fade">
        <h1 className="page-title">Patterns</h1>
        <div className="page-underline mt-3" />
        <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
          Calculated on this device, only from moods and tags you chose.{" "}
          <span className="mark">Your writing is never analyzed.</span>
        </p>
      </header>

      <div className="surface mt-8 flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-base font-semibold">Show patterns</p>
          <p className="mt-1 text-sm text-muted-foreground">Turn off if you'd rather not see any of this.</p>
        </div>
        <Switch
          checked={settings.insightsEnabled}
          onCheckedChange={(v) => update({ insightsEnabled: v })}
          aria-label="Show patterns"
        />
      </div>

      {!settings.insightsEnabled ? (
        <p className="mt-10 text-sm text-muted-foreground">Patterns are off. Your entries are still saved.</p>
      ) : !stats ? (
        <p className="mt-10 text-sm text-muted-foreground">
          A few entries and something will show up here.{" "}
          <Link to="/" className="underline underline-offset-4">
            Check in
          </Link>
          .
        </p>
      ) : (
        <div className="mt-10 space-y-10">
          <section className="surface p-5 sm:p-6">
            <h2 className="section-label">Recent energy</h2>
            <div className="mt-5 flex items-baseline gap-2">
              <span className="font-display text-4xl font-bold leading-none text-foreground">
                {Math.round(stats.avgEnergy * 10) / 10}
              </span>
              <span className="text-sm text-muted-foreground">/ 5 average</span>
              <span className="ml-auto rounded-full border border-accent/50 bg-accent/12 px-3 py-1 text-xs font-semibold">
                {ENERGY_LABELS[Math.round(stats.avgEnergy) - 1]}
              </span>
            </div>
            <div className="mt-6 flex h-32 items-end gap-2">
              {stats.recent.map((e) => (
                <div
                  key={e.id}
                  className="bar-fill min-h-[6px] flex-1 rounded-t-md transition-all duration-500"
                  style={{ height: `${(e.energy / 5) * 100}%` }}
                  title={`${ENERGY_LABELS[e.energy - 1]}`}
                />
              ))}
            </div>
            <div className="hairline mt-2" />
            <div className="mt-2 flex justify-between text-xs uppercase tracking-[0.16em] text-muted-foreground">
              <span>Low energy</span>
              <span>High energy</span>
            </div>
          </section>

          {stats.topFeelings.length > 0 && (
            <section>
              <h2 className="section-label">Recurring words</h2>
              <ul className="mt-4 space-y-2.5">
                {stats.topFeelings.map(([feeling, count]) => (
                  <li key={feeling} className="flex items-center gap-3 text-sm">
                    <span className="w-28 font-medium">{feeling}</span>
                    <span
                      className="bar-fill-h h-2 rounded-full"
                      style={{ width: `${count * 22}px` }}
                    />
                    <span className="text-xs font-semibold text-muted-foreground">{count}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}


          {stats.weekdays.length > 1 && (
            <section>
              <h2 className="section-label">One thing to notice</h2>
              <p className="mt-4 text-base leading-relaxed">
                Your energy tends to run lowest on{" "}
                <span className="mark">{dayName(stats.weekdays[0].day)}s</span>
                {stats.weekdays.length > 1 ? (
                  <>
                    {" "}
                    and highest on{" "}
                    <span className="mark">{dayName(stats.weekdays[stats.weekdays.length - 1].day)}s</span>
                  </>
                ) : null}
                . Not a rule — just something to keep an eye on.
              </p>
            </section>
          )}

        </div>
      )}
    </AppShell>
  );
};

export default Insights;
