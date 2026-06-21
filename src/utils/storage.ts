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

// 存储版本标记：当本地存储缺少版本号时，仅写入当前版本号，
// 不清空任何已有数据，避免误删老用户的真实历史记录。
// （早期版本自动播种 mock 数据的问题已通过移除 seedMockDataIfEmpty 从根源解决）
export const migrateStorage = (): void => {
  const stored = safeGet<string>(STORAGE_KEYS.VERSION, '');
  if (stored === STORAGE_VERSION) return;
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
