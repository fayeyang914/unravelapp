// Hand-verified fallback shelf. Used when live search is rate-limited or unavailable,
// so the Reading tab is never empty. Every URL was checked to resolve.
export type LibraryItem = {
  category: string;
  title: string;
  url: string;
  source: string;
  summary: string;
  minutes: number;
  tags: string[];
};

export const LIBRARY: LibraryItem[] = [
  {
    category: "Stress & overwhelm",
    title: "Stress: what it is and how to handle it",
    url: "https://kidshealth.org/en/teens/stress.html",
    source: "Nemours KidsHealth",
    summary: "Plain explanation of what stress does in your body and small ways to bring it down.",
    minutes: 6,
    tags: ["stress", "overwhelmed", "tense", "pressure", "anxious"],
  },
  {
    category: "Stress & overwhelm",
    title: "Healthy ways to handle life's stressors",
    url: "https://www.apa.org/topics/stress/tips",
    source: "American Psychological Association",
    summary: "Research-backed habits that actually lower stress, without any hustle talk.",
    minutes: 8,
    tags: ["stress", "overwhelmed", "burnout", "coping"],
  },
  {
    category: "Stress & overwhelm",
    title: "Breathing exercises for stress",
    url: "https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/breathing-exercises-for-stress/",
    source: "NHS",
    summary: "One short breathing practice you can do sitting anywhere, in a few minutes.",
    minutes: 3,
    tags: ["stress", "panic", "anxious", "calm", "breathing"],
  },
  {
    category: "Sleep & energy",
    title: "Teens and sleep",
    url: "https://www.sleepfoundation.org/teens-and-sleep",
    source: "Sleep Foundation",
    summary: "Why sleep gets harder in high school and what genuinely helps.",
    minutes: 9,
    tags: ["tired", "drained", "sleep", "exhausted", "insomnia"],
  },
  {
    category: "Sleep & energy",
    title: "How to get a better night's sleep",
    url: "https://www.helpguide.org/articles/sleep/getting-better-sleep.htm",
    source: "HelpGuide",
    summary: "Practical changes for falling asleep faster and waking less at night.",
    minutes: 10,
    tags: ["sleep", "tired", "restless", "night"],
  },
  {
    category: "Sleep & energy",
    title: "Sleep tips for teens",
    url: "https://kidshealth.org/en/teens/tips-sleep.html",
    source: "Nemours KidsHealth",
    summary: "A short list of habits that make sleep easier on school nights.",
    minutes: 4,
    tags: ["sleep", "tired", "school"],
  },
  {
    category: "Anxious thoughts",
    title: "Anxiety, explained without alarm",
    url: "https://kidshealth.org/en/teens/anxiety.html",
    source: "Nemours KidsHealth",
    summary: "What anxiety is, how it shows up physically, and when it helps to ask for support.",
    minutes: 7,
    tags: ["anxious", "worried", "nervous", "panic", "scared"],
  },
  {
    category: "Anxious thoughts",
    title: "Every Mind Matters: anxiety",
    url: "https://www.nhs.uk/every-mind-matters/mental-health-issues/anxiety/",
    source: "NHS",
    summary: "Calm, concrete steps for anxious spirals, plus signs it's worth talking to someone.",
    minutes: 6,
    tags: ["anxious", "worried", "overthinking", "spiral"],
  },
  {
    category: "Anxious thoughts",
    title: "Mindfulness, defined",
    url: "https://greatergood.berkeley.edu/topic/mindfulness/definition",
    source: "Greater Good, UC Berkeley",
    summary: "What mindfulness actually is, and what it does and doesn't fix.",
    minutes: 5,
    tags: ["anxious", "overthinking", "restless", "mindfulness"],
  },
  {
    category: "School & focus",
    title: "Homework and focus without the spiral",
    url: "https://kidshealth.org/en/teens/homework.html",
    source: "Nemours KidsHealth",
    summary: "Ways to start work when starting is the hardest part.",
    minutes: 5,
    tags: ["school", "homework", "focus", "procrastinating", "grades", "busy"],
  },
  {
    category: "School & focus",
    title: "Do I need help? Recognising when to reach out",
    url: "https://www.nimh.nih.gov/health/publications/my-mental-health-do-i-need-help",
    source: "National Institute of Mental Health",
    summary: "A short guide for telling ordinary hard weeks from something worth support.",
    minutes: 5,
    tags: ["overwhelmed", "help", "heavy", "school", "hopeless"],
  },
  {
    category: "Friends & family",
    title: "When you feel lonely",
    url: "https://kidshealth.org/en/teens/lonely.html",
    source: "Nemours KidsHealth",
    summary: "Loneliness as a signal rather than a flaw, and small ways back toward people.",
    minutes: 5,
    tags: ["lonely", "left out", "alone", "isolated", "friends"],
  },
  {
    category: "Friends & family",
    title: "Getting through a fight with a friend",
    url: "https://kidshealth.org/en/teens/fight.html",
    source: "Nemours KidsHealth",
    summary: "How to say the hard thing, and what to do when an apology doesn't land.",
    minutes: 5,
    tags: ["fight", "argument", "friends", "family", "angry", "hurt"],
  },
  {
    category: "Friends & family",
    title: "Making and keeping good friends",
    url: "https://www.helpguide.org/articles/relationships-communication/making-good-friends.htm",
    source: "HelpGuide",
    summary: "Where real friendships come from when the usual advice feels useless.",
    minutes: 9,
    tags: ["lonely", "friends", "new", "connection"],
  },
  {
    category: "Mood & motivation",
    title: "Feeling low, and what depression looks like",
    url: "https://kidshealth.org/en/teens/depression.html",
    source: "Nemours KidsHealth",
    summary: "The difference between a heavy stretch and depression, in plain words.",
    minutes: 7,
    tags: ["low", "heavy", "sad", "numb", "empty", "hopeless", "unmotivated"],
  },
  {
    category: "Mood & motivation",
    title: "What gratitude actually does",
    url: "https://greatergood.berkeley.edu/topic/gratitude/definition",
    source: "Greater Good, UC Berkeley",
    summary: "The evidence behind noticing good things — no forced positivity.",
    minutes: 6,
    tags: ["gratitude", "low", "flat", "mood"],
  },
  {
    category: "Self & identity",
    title: "Self-esteem, honestly",
    url: "https://kidshealth.org/en/teens/self-esteem.html",
    source: "Nemours KidsHealth",
    summary: "Where harsh self-talk comes from and how it loosens over time.",
    minutes: 6,
    tags: ["self", "insecure", "not enough", "comparison", "ashamed", "identity"],
  },
  {
    category: "Self & identity",
    title: "Self-compassion and why it isn't softness",
    url: "https://greatergood.berkeley.edu/topic/compassion/definition",
    source: "Greater Good, UC Berkeley",
    summary: "Treating yourself the way you'd treat a friend, and the research behind it.",
    minutes: 6,
    tags: ["self", "guilt", "harsh", "perfectionism", "ashamed"],
  },
  {
    category: "Body & movement",
    title: "Moving your body when stress is stuck in it",
    url: "https://www.apa.org/topics/exercise-fitness/stress",
    source: "American Psychological Association",
    summary: "Why even small movement changes how stress feels physically.",
    minutes: 6,
    tags: ["restless", "tense", "stress", "movement", "body"],
  },
  {
    category: "Body & movement",
    title: "Exercise, without the fitness pressure",
    url: "https://kidshealth.org/en/teens/exercise-wise.html",
    source: "Nemours KidsHealth",
    summary: "Gentle ways to move that don't turn into another thing to fail at.",
    minutes: 5,
    tags: ["movement", "body", "energy", "drained"],
  },
  {
    category: "Body & movement",
    title: "Meditation and mindful movement",
    url: "https://www.apa.org/topics/mindfulness/meditation",
    source: "American Psychological Association",
    summary: "What meditation does to a busy nervous system, according to research.",
    minutes: 7,
    tags: ["meditation", "anxious", "calm", "mindfulness"],
  },
];

/** Pick a categorized shelf from the verified library based on the words in a summary. */
export function libraryShelf(concerns: string, limitPerCategory = 3) {
  const text = concerns.toLowerCase();
  const scored = LIBRARY.map((item) => ({
    item,
    score: item.tags.reduce((s, tag) => (text.includes(tag) ? s + 1 : s), 0),
  }));

  const categories = [...new Set(LIBRARY.map((i) => i.category))]
    .map((category) => ({
      category,
      score: scored.filter((s) => s.item.category === category).reduce((s, x) => s + x.score, 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  return categories.map(({ category }) => ({
    category,
    note: null as string | null,
    articles: scored
      .filter((s) => s.item.category === category)
      .sort((a, b) => b.score - a.score)
      .slice(0, limitPerCategory)
      .map(({ item }) => ({
        title: item.title,
        url: item.url,
        source: item.source,
        summary: item.summary,
        why: null as string | null,
        minutes: item.minutes,
      })),
  }));
}
