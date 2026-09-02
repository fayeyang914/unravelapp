import type { Entry, EntryMode } from "./types";

export const MOOD_LABELS = ["Heavy", "Low", "Even", "Light", "Bright"];
export const ENERGY_LABELS = ["Drained", "Slow", "Steady", "Awake", "Buzzing"];

/**
 * Each journaling format asks its own questions before you start. `field` binds a
 * slider to the entry's stored mood/energy only when the question really is about
 * mood or energy — everything else just shapes the session that follows.
 */
export interface SliderSpec {
  id: string;
  field?: "mood" | "energy";
  question: string;
  left: string;
  right: string;
  /** Five short labels, one per step, shown under the thumb. */
  steps: string[];
}

export const MODE_SLIDERS: Record<EntryMode, SliderSpec[]> = {
  longform: [
    {
      id: "depth",
      question: "How much do you want to get into right now?",
      left: "Keep it surface-level",
      right: "I want to unpack it",
      steps: ["Just the surface", "A little", "Somewhere in between", "Fairly deep", "All the way in"],
    },
    {
      id: "clarity",
      question: "How clear are your thoughts?",
      left: "All over the place",
      right: "Pretty clear",
      steps: ["All over the place", "Pretty scattered", "Half sorted", "Mostly clear", "Pretty clear"],
    },
  ],
  voice: [
    {
      id: "ease",
      question: "How easy does it feel to talk about this?",
      left: "Hard to say",
      right: "Ready to talk",
      steps: ["Hard to say", "Takes effort", "Somewhere in between", "Mostly ready", "Ready to talk"],
    },
  ],
  bullets: [
    {
      id: "crowded",
      question: "How crowded does your head feel?",
      left: "Mostly clear",
      right: "A lot going on",
      steps: ["Mostly clear", "A few things", "A steady hum", "Pretty full", "A lot going on"],
    },
  ],
  mood: [
    {
      id: "mood",
      field: "mood",
      question: "How are you feeling overall right now?",
      left: "Really rough",
      right: "Really good",
      steps: ["Really rough", "Not great", "Okay", "Pretty good", "Really good"],
    },
    {
      id: "energy",
      field: "energy",
      question: "How much energy do you have?",
      left: "Drained",
      right: "Energized",
      steps: ["Drained", "Running low", "Enough to get by", "Pretty good", "Energized"],
    },
  ],
  prompt: [
    {
      id: "stuck",
      question: "How stuck are you on what to say?",
      left: "I know what I want to say",
      right: "No idea where to start",
      steps: [
        "I know what I want to say",
        "Roughly know",
        "Some idea",
        "Not much of an idea",
        "No idea where to start",
      ],
    },
    {
      id: "prompt-depth",
      question: "How deep do you want the questions to go?",
      left: "Keep it light",
      right: "Let's go deeper",
      steps: ["Keep it light", "Fairly light", "In between", "A bit deeper", "Let's go deeper"],
    },
  ],
  short: [
    {
      id: "today",
      field: "mood",
      question: "How has today felt overall?",
      left: "Rough",
      right: "Good",
      steps: ["Rough", "Kind of rough", "Fine", "Pretty good", "Good"],
    },
    {
      id: "onmind",
      question: "How much is on your mind right now?",
      left: "Not much",
      right: "A lot",
      steps: ["Not much", "A little", "Some", "Quite a bit", "A lot"],
    },
  ],
  gratitude: [],
};


export const FEELINGS = [
  "tired",
  "anxious",
  "calm",
  "overwhelmed",
  "hopeful",
  "lonely",
  "content",
  "frustrated",
  "grateful",
  "numb",
  "restless",
  "proud",
  "sad",
  "focused",
  "embarrassed",
  "relieved",
];

export const PROMPTS = [
  "What took up the most space in your head today?",
  "What is something you handled better than you expected?",
  "If today had a weather report, what would it say?",
  "What do you wish someone had asked you today?",
  "Name one thing you are carrying that isn't yours to carry.",
  "What would make tomorrow 5% easier?",
  "What did your body feel like today?",
  "Who or what felt safe today?",
];

export const MODE_META: Record<EntryMode, { label: string; blurb: string; minutes: string }> = {
  short: { label: "Quick Check-In", blurb: "A line or two, that's plenty.", minutes: "1 min" },
  mood: { label: "Mood tracking", blurb: "Two sliders, no words needed.", minutes: "30 sec" },
  voice: { label: "Talk", blurb: "Say it out loud, stays on device.", minutes: "1–5 min" },
  bullets: { label: "Bullet Dump", blurb: "Fragments instead of sentences.", minutes: "2 min" },
  prompt: { label: "Guided", blurb: "A question to start you off.", minutes: "3 min" },
  longform: { label: "Write", blurb: "Room to go as deep as you want.", minutes: "10+ min" },
  gratitude: { label: "Gratitude", blurb: "Three small things.", minutes: "2 min" },
};

export const GENRES = [
  "indie",
  "hyperpop",
  "r&b",
  "rap",
  "bedroom pop",
  "classical",
  "lo-fi",
  "rock",
  "jazz",
  "ambient",
  "pop",
  "afrobeats",
];

export interface Song {
  id: string;
  title: string;
  artist: string;
  genre: string;
  /** 1 = heavy, 5 = bright */
  moodFit: number[];
  note: string;
}

export const SONGS: Song[] = [
  { id: "s1", title: "Motion Sickness", artist: "Phoebe Bridgers", genre: "indie", moodFit: [1, 2], note: "for when it stings and you want company in it" },
  { id: "s2", title: "Nikes", artist: "Frank Ocean", genre: "r&b", moodFit: [1, 2, 3], note: "slow, hazy, no pressure to feel better yet" },
  { id: "s3", title: "Weightless", artist: "Marconi Union", genre: "ambient", moodFit: [1, 2, 3], note: "built to slow a racing chest" },
  { id: "s4", title: "Gymnopédie No.1", artist: "Erik Satie", genre: "classical", moodFit: [1, 2, 3], note: "quiet room, nothing asked of you" },
  { id: "s5", title: "Coffee", artist: "Beabadoobee", genre: "bedroom pop", moodFit: [2, 3, 4], note: "soft landing after a long day" },
  { id: "s6", title: "Blue Train", artist: "John Coltrane", genre: "jazz", moodFit: [3, 4], note: "steady momentum without noise" },
  { id: "s7", title: "Lofi Study Rain", artist: "Idealism", genre: "lo-fi", moodFit: [2, 3, 4], note: "background for getting one thing done" },
  { id: "s8", title: "Sunflower", artist: "Rex Orange County", genre: "indie", moodFit: [3, 4, 5], note: "small warmth, easy to sit with" },
  { id: "s9", title: "Kiss Me More", artist: "Doja Cat", genre: "pop", moodFit: [4, 5], note: "light and a little playful" },
  { id: "s10", title: "Essence", artist: "Wizkid", genre: "afrobeats", moodFit: [4, 5], note: "for when your shoulders drop on their own" },
  { id: "s11", title: "goldwing", artist: "Billie Eilish", genre: "pop", moodFit: [2, 3], note: "delicate, then bigger than expected" },
  { id: "s12", title: "money machine", artist: "100 gecs", genre: "hyperpop", moodFit: [4, 5], note: "for restless energy that needs somewhere to go" },
  { id: "s13", title: "DNA.", artist: "Kendrick Lamar", genre: "rap", moodFit: [3, 4, 5], note: "borrow some certainty for four minutes" },
  { id: "s14", title: "Everlong (Acoustic)", artist: "Foo Fighters", genre: "rock", moodFit: [2, 3, 4], note: "ache and lift at the same time" },
  { id: "s15", title: "An Ending (Ascent)", artist: "Brian Eno", genre: "ambient", moodFit: [1, 2, 3, 4, 5], note: "space to breathe between thoughts" },
  { id: "s16", title: "Ivy", artist: "Frank Ocean", genre: "r&b", moodFit: [2, 3], note: "for the things you didn't say" },
  { id: "s17", title: "Cellophane", artist: "FKA twigs", genre: "r&b", moodFit: [1, 2], note: "aching and very honest" },
  { id: "s18", title: "Snooze", artist: "SZA", genre: "r&b", moodFit: [2, 3, 4], note: "warm, close, easy to loop" },
  { id: "s19", title: "Scott Street", artist: "Phoebe Bridgers", genre: "indie", moodFit: [1, 2, 3], note: "for walking home in your head" },
  { id: "s20", title: "Space Song", artist: "Beach House", genre: "indie", moodFit: [2, 3], note: "wide and floaty, no sharp edges" },
  { id: "s21", title: "Somebody Else", artist: "The 1975", genre: "indie", moodFit: [1, 2, 3], note: "the loop you're already stuck in" },
  { id: "s22", title: "Glue Song", artist: "beabadoobee", genre: "bedroom pop", moodFit: [3, 4, 5], note: "small and fond" },
  { id: "s23", title: "Telepatía", artist: "Kali Uchis", genre: "bedroom pop", moodFit: [3, 4], note: "soft sway, low effort" },
  { id: "s24", title: "hand crushed by a mallet", artist: "100 gecs", genre: "hyperpop", moodFit: [3, 4, 5], note: "chaos with somewhere to put it" },
  { id: "s25", title: "kitchen fork", artist: "underscores", genre: "hyperpop", moodFit: [2, 3, 4], note: "loud but weirdly tender" },
  { id: "s26", title: "Alright", artist: "Kendrick Lamar", genre: "rap", moodFit: [2, 3, 4], note: "for holding the line today" },
  { id: "s27", title: "Sun Bleached Flies", artist: "MJ Lenderman", genre: "rock", moodFit: [2, 3], note: "slow guitars, dry humor" },
  { id: "s28", title: "Naima", artist: "John Coltrane", genre: "jazz", moodFit: [1, 2, 3], note: "tenderness with no words" },
  { id: "s29", title: "Nuvole Bianche", artist: "Ludovico Einaudi", genre: "classical", moodFit: [1, 2, 3], note: "lets the crying happen if it needs to" },
  { id: "s30", title: "Music For Airports 1/1", artist: "Brian Eno", genre: "ambient", moodFit: [1, 2, 3], note: "a room that doesn't ask questions" },
  { id: "s31", title: "affection", artist: "BOYPABLO", genre: "lo-fi", moodFit: [3, 4], note: "background hum, gentle" },
  { id: "s32", title: "Peru", artist: "Fireboy DML", genre: "afrobeats", moodFit: [4, 5], note: "for when you want to move" },
  { id: "s33", title: "Good Days", artist: "SZA", genre: "r&b", moodFit: [3, 4], note: "hopeful without pretending" },
  { id: "s34", title: "Sweet", artist: "Cigarettes After Sex", genre: "indie", moodFit: [1, 2, 3], note: "dim light, slow breathing" },
  { id: "s35", title: "As It Was", artist: "Harry Styles", genre: "pop", moodFit: [3, 4, 5], note: "sad underneath, still moves" },
];


const THEME_RULES: { key: string; test: RegExp; genres: string[]; label: string }[] = [
  { key: "stress", test: /(anx|panic|spiral|stress|exam|test|grade|deadline|homework)/, genres: ["ambient", "classical", "lo-fi"], label: "the pressure in this entry" },
  { key: "lonely", test: /(alone|lonely|left out|ignored|no one)/, genres: ["indie", "r&b", "bedroom pop"], label: "feeling unseen today" },
  { key: "heartache", test: /(crush|breakup|broke up|love|miss(ed|ing)? (him|her|them)|ex)/, genres: ["r&b", "indie", "bedroom pop"], label: "what you wrote about someone" },
  { key: "anger", test: /(angry|mad|furious|fight|argu|annoyed|hate)/, genres: ["rock", "rap", "hyperpop"], label: "the heat in this entry" },
  { key: "tired", test: /(tired|exhausted|sleep|drained|burnt out|can't get up)/, genres: ["ambient", "lo-fi", "classical"], label: "how tired today sounded" },
  { key: "good", test: /(proud|good day|happy|excited|won|passed|finally)/, genres: ["pop", "afrobeats", "indie"], label: "the good part of today" },
];

export interface SongPick extends Song {
  reason: string;
}

const norm = (v: string) => v.trim().toLowerCase();

export function entryText(entry: Entry): string {
  return [
    entry.title,
    entry.text,
    entry.prompt,
    entry.transcript,
    ...(entry.bullets ?? []),
    ...(entry.gratitude ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/** Genres the entry's own wording points at — used to shape Spotify picks. */
export function entryThemeGenres(entry: Entry): string[] {
  const text = entryText(entry);
  const matched = THEME_RULES.filter((r) => r.test.test(text)).flatMap((r) => r.genres);
  return [...new Set(matched)].slice(0, 4);
}

export function recommendSongs(
  entry: Entry,
  tastes: string[],
  artists: string[] = [],
  count = 3,
  seed = 0,
): SongPick[] {
  const text = entryText(entry);
  const themes = THEME_RULES.filter((r) => r.test.test(text));
  const likedArtists = artists.map(norm).filter(Boolean);

  const scored = SONGS.map((song) => {
    let score = 0;
    const reasons: string[] = [];

    if (song.moodFit.includes(entry.mood)) {
      score += 3;
      reasons.push(`sits with ${MOOD_LABELS[entry.mood - 1].toLowerCase()} mood`);
    }
    if (entry.energy <= 2 && ["ambient", "classical", "lo-fi", "bedroom pop"].includes(song.genre)) {
      score += 2;
      reasons.push("gentle on low energy");
    }
    if (entry.energy >= 4 && ["hyperpop", "rap", "pop", "afrobeats", "rock"].includes(song.genre)) {
      score += 2;
      reasons.push("somewhere for restless energy");
    }
    for (const theme of themes) {
      if (theme.genres.includes(song.genre)) {
        score += 3;
        reasons.push(`picked for ${theme.label}`);
      }
    }
    for (const feeling of entry.feelings) {
      if (
        (feeling === "restless" && song.genre === "hyperpop") ||
        (feeling === "lonely" && ["indie", "r&b"].includes(song.genre)) ||
        (feeling === "anxious" && ["ambient", "classical"].includes(song.genre)) ||
        (feeling === "tired" && ["lo-fi", "ambient"].includes(song.genre)) ||
        (feeling === "proud" && ["pop", "rap", "afrobeats"].includes(song.genre))
      ) {
        score += 2;
        reasons.push(`you marked "${feeling}"`);
      }
    }
    if (likedArtists.some((a) => norm(song.artist).includes(a) || a.includes(norm(song.artist)))) {
      score += 4;
      reasons.push("an artist you listed");
    }
    if (tastes.includes(song.genre)) {
      score += 2;
      reasons.push(`${song.genre} is your taste`);
    }
    if (entry.mode === "voice" && song.genre === "ambient") score += 1;

    return { song, score, reason: reasons.slice(0, 2).join(" · ") || "a quiet default" };
  });

  // Preferences are a hard filter, not a tiebreaker: if you listed artists or
  // genres, every pick comes from those. Rotation happens inside that set.
  const matchesTaste = (song: Song) =>
    likedArtists.some((a) => norm(song.artist).includes(a) || a.includes(norm(song.artist))) ||
    tastes.includes(song.genre);

  const sorted = scored.sort(
    (a, b) => b.score - a.score || a.song.title.localeCompare(b.song.title),
  );
  const preferred = sorted.filter((s) => matchesTaste(s.song));
  const hasPreferences = likedArtists.length > 0 || tastes.length > 0;

  let pool = hasPreferences && preferred.length >= count ? preferred : sorted;
  pool = pool.slice(0, Math.min(pool.length, Math.max(count * 3, count + 3)));

  const offset = ((seed % pool.length) + pool.length) % pool.length;

  return Array.from({ length: Math.min(count, pool.length) }, (_, i) => {
    const { song, reason } = pool[(offset + i) % pool.length];
    return { ...song, reason };
  });
}



export interface SupportPlan {
  headline: string;
  encouragement: string;
  steps: string[];
  basis: string;
}

const THEME_ADVICE: Record<
  string,
  { headlines: string[]; steps: string[][]; encouragement: string[] }
> = {
  stress: {
    headlines: [
      "There's a deadline-shaped weight in this entry.",
      "This reads like too many things due at once.",
    ],
    steps: [
      [
        "Write the list out fully, then circle only what is due in the next 24 hours.",
        "Give the circled thing 20 minutes with your phone in another room.",
        "Decide now what you're allowing to be done badly this week.",
      ],
      [
        "Split the biggest task into its first physical step (open the doc, print the sheet).",
        "Set a timer for 15 minutes; stopping when it rings counts as finishing.",
        "Ask one person for the one piece of information that would unblock you.",
      ],
    ],
    encouragement: [
      "Pressure like this isn't proof you're behind — it's proof you're carrying a lot at once.",
      "You showed up here in the middle of it. That's not nothing.",
    ],
  },
  lonely: {
    headlines: [
      "This entry sounds like being around people and still unseen.",
      "You wrote from a distance today.",
    ],
    steps: [
      [
        "Send a low-stakes message to one person — a meme, a question, no explaining.",
        "Put yourself somewhere with other humans for 20 minutes, no talking required.",
        "Write the sentence you wish someone would say to you, then read it back.",
      ],
      [
        "Name one person who has been glad to hear from you before, and text them first.",
        "Do one thing that's yours alone and enjoyable, not productive.",
        "Note the time of day this hit hardest — it's usually a pattern, not a fact about you.",
      ],
    ],
    encouragement: [
      "Feeling unseen is not evidence that you're unwanted.",
      "You put it into words instead of swallowing it. That's the harder option.",
    ],
  },
  heartache: {
    headlines: [
      "Someone is taking up most of this entry.",
      "This one is about a person, not a task.",
    ],
    steps: [
      [
        "Write the message you want to send, and leave it unsent tonight.",
        "Decide one thing you won't check for the next 12 hours.",
        "Tell one friend the short version so you're not carrying it silently.",
      ],
      [
        "List what you actually miss — the person, or the way you felt around them.",
        "Plan one thing tomorrow that has nothing to do with them.",
        "Let yourself feel it for ten minutes on purpose instead of all day by accident.",
      ],
    ],
    encouragement: [
      "Missing someone isn't a mistake to correct. It just takes longer than you'd like.",
      "You're allowed to still care and still choose yourself.",
    ],
  },
  anger: {
    headlines: [
      "There's real heat in what you wrote.",
      "This entry is angry, and it's allowed to be.",
    ],
    steps: [
      [
        "Move hard for four minutes before you say anything to anyone.",
        "Write what you actually wanted from that person — that's usually the real thing.",
        "Hold any reply until tomorrow morning; the point will still be valid then.",
      ],
      [
        "Separate what happened from what you told yourself it meant.",
        "Pick the one boundary worth saying out loud, and drop the rest.",
        "Do something loud and physical — music, stairs, a run.",
      ],
    ],
    encouragement: [
      "Anger usually means something you value got stepped on. That's information, not a flaw.",
      "You brought it here instead of at someone. That took control.",
    ],
  },
  tired: {
    headlines: [
      "This entry is mostly tiredness.",
      "You wrote from empty today.",
    ],
    steps: [
      [
        "Do the single smallest task that makes tomorrow quieter, then stop.",
        "Water, food, or lying flat for ten minutes — whichever you've skipped longest.",
        "Move one thing off tomorrow's list before it becomes a failure.",
      ],
      [
        "Set a bedtime that's 30 minutes earlier and let tonight be unproductive.",
        "Say no to one optional thing this week, in writing, today.",
        "Nothing you decide while this tired needs to be final.",
      ],
    ],
    encouragement: [
      "Being tired isn't laziness. You've been running on less than you needed.",
      "Resting counts as handling it.",
    ],
  },
  good: {
    headlines: [
      "There's something good in this entry worth keeping.",
      "This one reads lighter, and that's worth marking.",
    ],
    steps: [
      [
        "Write down exactly what made today work, in specifics.",
        "Do one small thing now that makes tomorrow easier while you have room.",
        "Tell someone the good part out loud.",
      ],
      [
        "Save this entry so a harder day has proof this happens.",
        "Repeat one concrete thing from today tomorrow.",
        "Let it be good without waiting for the catch.",
      ],
    ],
    encouragement: [
      "You're allowed to notice this without bracing for it to end.",
      "Days like this are part of your pattern too, not a fluke.",
    ],
  },
};

const MOOD_ADVICE: { test: (e: Entry) => boolean; key: string }[] = [
  { test: (e) => e.mood <= 2 && e.energy <= 2, key: "tired" },
  { test: (e) => e.mood <= 2 && e.energy >= 4, key: "anger" },
  { test: (e) => e.mood <= 2, key: "lonely" },
  { test: (e) => e.mood >= 4, key: "good" },
];

function quotedFragment(entry: Entry): string | null {
  const raw = [entry.text, ...(entry.bullets ?? []), ...(entry.gratitude ?? [])]
    .filter(Boolean)
    .join(". ");
  if (!raw) return null;
  const parts = raw
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12);
  const pick = parts.sort((a, b) => b.length - a.length)[0];
  if (!pick) return null;
  return pick.length > 90 ? `${pick.slice(0, 88).trimEnd()}…` : pick;
}

export function supportPlan(entry: Entry, seed = 0): SupportPlan {
  const text = entryText(entry);
  const themes = THEME_RULES.filter((r) => r.test.test(text)).map((r) => r.key);

  const feelingThemes = entry.feelings
    .map<string | null>((f) => {
      if (["anxious", "overwhelmed"].includes(f)) return "stress";
      if (["lonely", "sad", "numb", "embarrassed"].includes(f)) return "lonely";
      if (["frustrated", "restless"].includes(f)) return "anger";
      if (["tired"].includes(f)) return "tired";
      if (["proud", "grateful", "content", "hopeful", "relieved"].includes(f)) return "good";
      return null;
    })
    .filter((k): k is string => Boolean(k));

  const candidates = [...new Set([...themes, ...feelingThemes])];
  const key =
    candidates.length > 0
      ? candidates[Math.abs(seed) % candidates.length]
      : (MOOD_ADVICE.find((m) => m.test(entry))?.key ?? "good");

  const advice = THEME_ADVICE[key] ?? THEME_ADVICE.good;
  const i = Math.abs(seed);
  const steps = [...advice.steps[i % advice.steps.length]];
  const quote = quotedFragment(entry);

  if (quote) {
    steps.push(`Come back to this line later and see if it still feels true: “${quote}”`);
  }
  if (entry.mode === "voice") {
    steps.push("Play your memo back once. Hearing your own voice usually lands differently.");
  }

  const basisParts = [
    `${MOOD_LABELS[entry.mood - 1].toLowerCase()} mood`,
    `${ENERGY_LABELS[entry.energy - 1].toLowerCase()} energy`,
    ...(entry.feelings.length ? [entry.feelings.slice(0, 3).join(", ")] : []),
    ...(themes.length ? ["what you wrote about"] : []),
  ];

  return {
    headline: advice.headlines[i % advice.headlines.length],
    encouragement: advice.encouragement[i % advice.encouragement.length],
    steps,
    basis: basisParts.join(" · "),
  };
}


export function entryPreview(entry: Entry): string {
  if (entry.mode === "voice")
    return entry.transcriptSummary || entry.transcript || `Voice memo · ${entry.audioSeconds ?? 0}s`;
  if (entry.bullets?.length) return entry.bullets.join(" · ");
  if (entry.gratitude?.length) return entry.gratitude.filter(Boolean).join(" · ");
  if (entry.text) return entry.text;
  return entry.feelings.length ? entry.feelings.join(", ") : "Mood check-in";
}
