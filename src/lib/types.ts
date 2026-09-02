export type EntryMode = "longform" | "short" | "bullets" | "voice" | "mood" | "prompt" | "gratitude";

export interface Entry {
  id: string;
  createdAt: string; // ISO
  mode: EntryMode;
  mood: number; // 1..5
  energy: number; // 1..5
  feelings: string[];
  title?: string;
  text?: string;
  bullets?: string[];
  prompt?: string;
  gratitude?: string[];
  audioPath?: string;
  audioSeconds?: number;
  transcript?: string;
  transcriptSummary?: string;
  transcriptStatus?: "none" | "done";
  songId?: string;
  breathed?: boolean;
  /** Answers to this format's pre-writing sliders — session context, not stored. */
  intent?: string[];

}

export type NewEntry = Omit<Entry, "id" | "createdAt"> & { createdAt?: string };

export type ThemeName = "linen" | "blush" | "mist" | "sage" | "lilac" | "dusk" | "ink";

export interface Settings {
  name: string;
  theme: ThemeName;
  displayFont: string;
  bodyFont: string;
  reminderMode: "manual" | "daily" | "days" | "weekly" | "monthly";
  reminderDays: number[]; // 0..6
  reminderTime: string;
  reminderEmails: boolean;
  timezone: string;
  discreetNotifications: boolean;
  insightsEnabled: boolean;
  aiSuggestionsEnabled: boolean;
  lockEnabled: boolean;
  passcode: string;
  musicTastes: string[];
  musicArtists: string[];
  showMoodInHistory: boolean;
}
