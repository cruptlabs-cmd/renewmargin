import type { HistoryAnalysis } from './history';

export type SavedHistoryScan = {
  id: string;
  name: string;
  createdAt: string;
  agreementFile: string;
  visitFile: string;
  loadedHourlyCost: number;
  targetMargin: number;
  results: HistoryAnalysis[];
};

const STORAGE_KEY = 'renewmargin.history-scans.v1';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function listSavedScans(): SavedHistoryScan[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedHistoryScan[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHistoryScan(scan: Omit<SavedHistoryScan, 'id' | 'createdAt'>): SavedHistoryScan {
  const saved: SavedHistoryScan = {
    ...scan,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  const scans = [saved, ...listSavedScans()].slice(0, 25);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scans));
  return saved;
}

export function deleteSavedScan(id: string) {
  if (!canUseStorage()) return;
  const scans = listSavedScans().filter(scan => scan.id !== id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scans));
}
