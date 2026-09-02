import { useCallback, useEffect, useReducer } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { Entry, NewEntry, Settings, ThemeName } from "./types";

type EntryInsert = Database["public"]["Tables"]["entries"]["Insert"];
type EntryUpdate = Database["public"]["Tables"]["entries"]["Update"];
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

const LEGACY_ENTRIES_KEY = "quiet.entries.v1";
const LEGACY_SETTINGS_KEY = "quiet.settings.v1";
const AUDIO_BUCKET = "voice-memos";

export const defaultSettings: Settings = {
  name: "",
  theme: "linen",
  displayFont: "Fraunces",
  bodyFont: "Karla",
  reminderMode: "days",
  reminderDays: [1, 3, 5],
  reminderTime: "21:00",
  reminderEmails: true,
  timezone: "UTC",
  discreetNotifications: true,
  insightsEnabled: true,
  aiSuggestionsEnabled: true,
  lockEnabled: false,
  passcode: "",
  musicTastes: [],
  musicArtists: [],
  showMoodInHistory: true,
};

const THEMES: ThemeName[] = ["linen", "blush", "mist", "sage", "lilac", "dusk", "ink"];

/* ---------- row mapping ---------- */

type EntryRow = {
  id: string;
  created_at: string;
  mode: string;
  mood: number;
  energy: number;
  feelings: string[] | null;
  title: string | null;
  body: string | null;
  bullets: string[] | null;
  prompt: string | null;
  gratitude: string[] | null;
  audio_path: string | null;
  audio_seconds: number | null;
  transcript: string | null;
  transcript_summary: string | null;
  transcript_status: string | null;
  song_id: string | null;
  breathed: boolean | null;
};

const toEntry = (row: EntryRow): Entry => ({
  id: row.id,
  createdAt: row.created_at,
  mode: row.mode as Entry["mode"],
  mood: row.mood,
  energy: row.energy,
  feelings: row.feelings ?? [],
  title: row.title ?? undefined,
  text: row.body ?? undefined,
  bullets: row.bullets ?? undefined,
  prompt: row.prompt ?? undefined,
  gratitude: row.gratitude ?? undefined,
  audioPath: row.audio_path ?? undefined,
  audioSeconds: row.audio_seconds ?? undefined,
  transcript: row.transcript ?? undefined,
  transcriptSummary: row.transcript_summary ?? undefined,
  transcriptStatus: (row.transcript_status as Entry["transcriptStatus"]) ?? "none",
  songId: row.song_id ?? undefined,
  breathed: row.breathed ?? false,
});

const toEntryRow = (patch: Partial<Entry>): EntryUpdate => {
  const row: EntryUpdate = {};
  if ("createdAt" in patch) row.created_at = patch.createdAt;
  if ("mode" in patch) row.mode = patch.mode;
  if ("mood" in patch) row.mood = patch.mood;
  if ("energy" in patch) row.energy = patch.energy;
  if ("feelings" in patch) row.feelings = patch.feelings ?? [];
  if ("title" in patch) row.title = patch.title ?? null;
  if ("text" in patch) row.body = patch.text ?? null;
  if ("bullets" in patch) row.bullets = patch.bullets ?? null;
  if ("prompt" in patch) row.prompt = patch.prompt ?? null;
  if ("gratitude" in patch) row.gratitude = patch.gratitude ?? null;
  if ("audioPath" in patch) row.audio_path = patch.audioPath ?? null;
  if ("audioSeconds" in patch) row.audio_seconds = patch.audioSeconds ?? null;
  if ("transcript" in patch) row.transcript = patch.transcript ?? null;
  if ("transcriptSummary" in patch) row.transcript_summary = patch.transcriptSummary ?? null;
  if ("transcriptStatus" in patch) row.transcript_status = patch.transcriptStatus ?? "none";
  if ("songId" in patch) row.song_id = patch.songId ?? null;
  if ("breathed" in patch) row.breathed = patch.breathed ?? false;
  return row;
};

type ProfileRow = {
  name: string | null;
  theme: string | null;
  display_font: string | null;
  body_font: string | null;
  reminder_mode: string | null;
  reminder_days: number[] | null;
  reminder_time: string | null;
  reminder_email_enabled: boolean | null;
  timezone: string | null;
  discreet_notifications: boolean | null;
  insights_enabled: boolean | null;
  ai_suggestions_enabled: boolean | null;
  lock_enabled: boolean | null;
  passcode: string | null;
  music_tastes: string[] | null;
  music_artists: string[] | null;
  show_mood_in_history: boolean | null;
};

const toSettings = (row: ProfileRow): Settings => ({
  name: row.name ?? "",
  theme: THEMES.includes(row.theme as ThemeName) ? (row.theme as ThemeName) : "linen",
  displayFont: row.display_font || "Fraunces",
  bodyFont: row.body_font || "Karla",
  reminderMode: (row.reminder_mode as Settings["reminderMode"]) ?? "days",
  reminderDays: row.reminder_days ?? [1, 3, 5],
  reminderTime: row.reminder_time || "21:00",
  reminderEmails: row.reminder_email_enabled ?? true,
  timezone: row.timezone || "UTC",
  discreetNotifications: row.discreet_notifications ?? true,
  insightsEnabled: row.insights_enabled ?? true,
  aiSuggestionsEnabled: row.ai_suggestions_enabled ?? true,
  lockEnabled: row.lock_enabled ?? false,
  passcode: row.passcode ?? "",
  musicTastes: row.music_tastes ?? [],
  musicArtists: row.music_artists ?? [],
  showMoodInHistory: row.show_mood_in_history ?? true,
});

const toProfileRow = (patch: Partial<Settings>): ProfileUpdate => {
  const row: ProfileUpdate = {};
  if ("name" in patch) row.name = patch.name ?? "";
  if ("theme" in patch) row.theme = patch.theme;
  if ("displayFont" in patch) row.display_font = patch.displayFont;
  if ("bodyFont" in patch) row.body_font = patch.bodyFont;
  if ("reminderMode" in patch) row.reminder_mode = patch.reminderMode;
  if ("reminderDays" in patch) row.reminder_days = patch.reminderDays;
  if ("reminderTime" in patch) row.reminder_time = patch.reminderTime;
  if ("reminderEmails" in patch) row.reminder_email_enabled = patch.reminderEmails;
  if ("timezone" in patch) row.timezone = patch.timezone;
  if ("discreetNotifications" in patch) row.discreet_notifications = patch.discreetNotifications;
  if ("insightsEnabled" in patch) row.insights_enabled = patch.insightsEnabled;
  if ("aiSuggestionsEnabled" in patch) row.ai_suggestions_enabled = patch.aiSuggestionsEnabled;
  if ("lockEnabled" in patch) row.lock_enabled = patch.lockEnabled;
  if ("passcode" in patch) row.passcode = patch.passcode ?? "";
  if ("musicTastes" in patch) row.music_tastes = patch.musicTastes;
  if ("musicArtists" in patch) row.music_artists = patch.musicArtists;
  if ("showMoodInHistory" in patch) row.show_mood_in_history = patch.showMoodInHistory;
  return row;
};

/* ---------- tiny external store ---------- */

interface StoreState {
  userId: string | null;
  loading: boolean;
  entries: Entry[];
  settings: Settings;
}

let state: StoreState = { userId: null, loading: true, entries: [], settings: defaultSettings };
const listeners = new Set<() => void>();
const set = (patch: Partial<StoreState>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

function useStore(): StoreState {
  const [, bump] = useReducer((c: number) => c + 1, 0);
  useEffect(() => {
    listeners.add(bump);
    return () => {
      listeners.delete(bump);
    };
  }, [bump]);
  return state;
}

export async function loadUserData(userId: string) {
  set({ userId, loading: true });

  const [profileRes, entriesRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("entries").select("*").order("created_at", { ascending: false }),
  ]);

  let settings = defaultSettings;
  if (profileRes.data) {
    settings = toSettings(profileRes.data as ProfileRow);
  } else {
    // Safety net if the signup trigger has not landed yet.
    await supabase.from("profiles").insert({ id: userId }).select().maybeSingle();
  }

  // Keep the stored time zone current so reminders land at the right local hour.
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (localZone && localZone !== settings.timezone) {
    settings = { ...settings, timezone: localZone };
    await supabase.from("profiles").update({ timezone: localZone }).eq("id", userId);
  }

  set({
    settings,
    entries: ((entriesRes.data as EntryRow[] | null) ?? []).map(toEntry),
    loading: false,
  });
}

export function clearUserData() {
  state = { userId: null, loading: false, entries: [], settings: defaultSettings };
  listeners.forEach((l) => l());
}

/* ---------- entries ---------- */

export async function uploadVoiceMemo(userId: string, blob: Blob, mimeType: string): Promise<string> {
  const ext = mimeType.includes("mp4") ? "mp4" : mimeType.includes("ogg") ? "ogg" : mimeType.includes("wav") ? "wav" : "webm";
  const path = `${userId}/${uid()}.${ext}`;
  const { error } = await supabase.storage
    .from(AUDIO_BUCKET)
    .upload(path, blob, { contentType: mimeType || "audio/webm", upsert: false });
  if (error) throw new Error(error.message);
  return path;
}

export async function signedAudioUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from(AUDIO_BUCKET).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export function useEntries() {
  const { entries, loading, userId } = useStore();

  const addEntry = useCallback(
    async (draft: NewEntry): Promise<Entry> => {
      if (!state.userId) throw new Error("Not signed in.");
      const { data, error } = await supabase
        .from("entries")
        .insert({ ...toEntryRow(draft as Partial<Entry>), user_id: state.userId } as EntryInsert)
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      const entry = toEntry(data as EntryRow);
      set({ entries: [entry, ...state.entries] });
      return entry;
    },
    [],
  );

  const updateEntry = useCallback(async (id: string, patch: Partial<Entry>) => {
    set({ entries: state.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
    const { error } = await supabase.from("entries").update(toEntryRow(patch)).eq("id", id);
    if (error) throw new Error(error.message);
  }, []);

  const removeEntry = useCallback(async (id: string) => {
    const entry = state.entries.find((e) => e.id === id);
    set({ entries: state.entries.filter((e) => e.id !== id) });
    if (entry?.audioPath) await supabase.storage.from(AUDIO_BUCKET).remove([entry.audioPath]);
    const { error } = await supabase.from("entries").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }, []);

  const clearAll = useCallback(async () => {
    const paths = state.entries.map((e) => e.audioPath).filter(Boolean) as string[];
    set({ entries: [] });
    if (paths.length) await supabase.storage.from(AUDIO_BUCKET).remove(paths);
    if (!state.userId) return;
    const { error } = await supabase.from("entries").delete().eq("user_id", state.userId);
    if (error) throw new Error(error.message);
  }, []);

  return { entries, loading, userId, addEntry, updateEntry, removeEntry, clearAll };
}

/* ---------- settings ---------- */

export function useSettings() {
  const { settings, loading } = useStore();

  const update = useCallback(async (patch: Partial<Settings>) => {
    if (!state.userId) return;
    set({ settings: { ...state.settings, ...patch } });
    const { error } = await supabase.from("profiles").update(toProfileRow(patch)).eq("id", state.userId);
    if (error) throw new Error(error.message);
  }, []);

  return { settings, loading, update };
}

/* ---------- one-time import of prototype data from this browser ---------- */

export function legacyLocalEntryCount(): number {
  try {
    const raw = localStorage.getItem(LEGACY_ENTRIES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

export async function importLegacyLocalData(): Promise<number> {
  if (!state.userId) return 0;
  let imported = 0;
  try {
    const raw = localStorage.getItem(LEGACY_ENTRIES_KEY);
    const legacy: (Entry & { audioDataUrl?: string })[] = raw ? JSON.parse(raw) : [];
    for (const old of legacy.reverse()) {
      let audioPath: string | undefined;
      if (old.audioDataUrl?.startsWith("data:")) {
        const blob = await (await fetch(old.audioDataUrl)).blob();
        audioPath = await uploadVoiceMemo(state.userId, blob, blob.type);
      }
      const { data, error } = await supabase
        .from("entries")
        .insert({
          ...toEntryRow({ ...old, audioPath }),
          created_at: old.createdAt,
          user_id: state.userId,
        } as EntryInsert)
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      set({ entries: [toEntry(data as EntryRow), ...state.entries] });
      imported += 1;
    }

    const rawSettings = localStorage.getItem(LEGACY_SETTINGS_KEY);
    if (rawSettings) {
      const legacySettings = JSON.parse(rawSettings) as Partial<Settings>;
      delete legacySettings.passcode;
      await supabase.from("profiles").update(toProfileRow(legacySettings)).eq("id", state.userId);
      set({ settings: { ...state.settings, ...legacySettings } });
    }
  } finally {
    localStorage.removeItem(LEGACY_ENTRIES_KEY);
    localStorage.removeItem(LEGACY_SETTINGS_KEY);
  }
  return imported;
}

/* ---------- appearance ---------- */

export function applyAppearance(settings: Settings) {
  const root = document.documentElement;
  root.dataset.theme = settings.theme;
  root.style.setProperty("--font-display", `"${settings.displayFont}"`);
  root.style.setProperty("--font-body", `"${settings.bodyFont}"`);
}

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
