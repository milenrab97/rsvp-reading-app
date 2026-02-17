import type { PersistedState, ReadingStats } from '../types';
import { version as appVersion } from '../../package.json';

const STORAGE_KEY = 'rsvp-reader-state';

export { appVersion };

export function saveState(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Silently fail — private browsing, quota exceeded, etc.
  }
}

export function loadState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedState;
  } catch {
    return null;
  }
}

const STATS_KEY = 'rsvp-reader-stats';

const DEFAULT_STATS: ReadingStats = {
  totalWordsRead: 0,
  totalReadingTimeMs: 0,
  sessionsCount: 0,
  books: {},
  sessions: [],
};

export function saveStats(stats: ReadingStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // Silently fail
  }
}

export function loadStats(): ReadingStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return DEFAULT_STATS;
    return { ...DEFAULT_STATS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATS;
  }
}
