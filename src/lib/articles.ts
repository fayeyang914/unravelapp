import { supabase } from "@/integrations/supabase/client";
import { ENERGY_LABELS, MOOD_LABELS, entryText } from "@/lib/content";
import type { Entry } from "@/lib/types";

export interface ArticleRec {
  id: string;
  category: string;
  note: string | null;
  title: string;
  url: string;
  source: string | null;
  summary: string | null;
  why: string | null;
  minutes: number | null;
  created_at: string;
}

export const ARTICLE_CATEGORIES = [
  "Stress & overwhelm",
  "Sleep & energy",
  "Anxious thoughts",
  "School & focus",
  "Friends & family",
  "Mood & motivation",
  "Self & identity",
  "Body & movement",
];

/** A compact, non-verbatim picture of the last couple of weeks. */
export function recentConcerns(entries: Entry[]): string {
  const recent = entries.slice(0, 12);
  if (!recent.length) return "";

  const avg = (nums: number[]) => nums.reduce((a, b) => a + b, 0) / nums.length;
  const mood = MOOD_LABELS[Math.round(avg(recent.map((e) => e.mood))) - 1];
  const energy = ENERGY_LABELS[Math.round(avg(recent.map((e) => e.energy))) - 1];

  const counts = new Map<string, number>();
  recent.forEach((e) => e.feelings.forEach((f) => counts.set(f, (counts.get(f) ?? 0) + 1)));
  const feelings = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([f]) => f);

  const excerpts = recent
    .map((e) => (e.transcriptSummary || entryText(e) || "").trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .slice(0, 5)
    .map((t) => `- ${t.slice(0, 280)}`);

  return [
    `Entries in the last stretch: ${recent.length}`,
    `Mood usually: ${mood}. Energy usually: ${energy}.`,
    feelings.length ? `Feelings they named most: ${feelings.join(", ")}` : "",
    excerpts.length ? `Snippets of what they wrote:\n${excerpts.join("\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function fetchArticleRecs(
  entries: Entry[],
  refresh = false,
): Promise<{ items: ArticleRec[]; generatedAt: string | null; stale?: boolean }> {
  const { data, error } = await supabase.functions.invoke("article-recs", {
    body: { concerns: recentConcerns(entries), refresh },
  });

  if (error) {
    const err = error as { message: string; context?: Response };
    let message = err.message;
    if (err.context && typeof err.context.text === "function") {
      try {
        const parsed = JSON.parse(await err.context.text());
        if (parsed?.error) message = parsed.error;
      } catch {
        /* keep original */
      }
    }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);

  return {
    items: (data?.items ?? []) as ArticleRec[],
    generatedAt: (data?.generatedAt ?? null) as string | null,
    stale: Boolean(data?.stale),
  };
}
