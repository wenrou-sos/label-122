import { DEFAULT_SETTINGS, STORAGE_KEYS } from '@/constants';
import type { DayRecordMap, AppSettings, CycleHistoryItem } from '@/types';

const safeGet = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn('[storage] 读取失败', key, err);
    return fallback;
  }
};

const safeSet = <T>(key: string, value: T): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn('[storage] 写入失败', key, err);
    return false;
  }
};

export const loadRecords = (): DayRecordMap =>
  safeGet<DayRecordMap>(STORAGE_KEYS.RECORDS, {});

export const saveRecords = (records: DayRecordMap): boolean =>
  safeSet(STORAGE_KEYS.RECORDS, records);

export const loadSettings = (): AppSettings => {
  const stored = safeGet<Partial<AppSettings>>(STORAGE_KEYS.SETTINGS, {});
  return { ...DEFAULT_SETTINGS, ...stored };
};

export const saveSettings = (settings: AppSettings): boolean =>
  safeSet(STORAGE_KEYS.SETTINGS, settings);

export const loadHistory = (): CycleHistoryItem[] =>
  safeGet<CycleHistoryItem[]>(STORAGE_KEYS.HISTORY, []);

export const saveHistory = (history: CycleHistoryItem[]): boolean =>
  safeSet(STORAGE_KEYS.HISTORY, history);
