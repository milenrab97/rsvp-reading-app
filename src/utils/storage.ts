import type { PersistedState } from '../types';
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
