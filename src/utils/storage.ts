import { DEFAULT_SETTINGS, STORAGE_KEYS, STORAGE_VERSION } from '@/constants';
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

// 一次性数据迁移：当本地存储版本与当前版本不一致时，
// 清空所有历史残留数据（含早期版本误写入的伪造健康数据），
// 随后写入新版本号，避免重复清理。
export const migrateStorage = (): void => {
  const stored = safeGet<string>(STORAGE_KEYS.VERSION, '');
  if (stored === STORAGE_VERSION) return;
  try {
    localStorage.removeItem(STORAGE_KEYS.RECORDS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
  } catch (err) {
    console.warn('[storage] 迁移清理失败', err);
  }
  safeSet(STORAGE_KEYS.VERSION, STORAGE_VERSION);
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
