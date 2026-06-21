import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type {
  DayRecord,
  DayRecordMap,
  AppSettings,
  CycleHistoryItem,
  FlowLevel,
  BloodColorId,
  Symptoms,
} from '@/types';
import { DEFAULT_SETTINGS } from '@/constants';
import { loadRecords, saveRecords, loadSettings, saveSettings, loadHistory, saveHistory, migrateStorage } from '@/utils/storage';
import { diffDays, parseDate } from '@/utils/date';

const EMPTY_SYMPTOMS: Symptoms = {
  cramp: 0,
  backache: 0,
  headache: 0,
  breast: 0,
  mood: 0,
};

export const usePeriodStore = defineStore('period', () => {
  // 初始化前先执行一次性数据迁移，清理早期版本残留的伪造健康数据
  migrateStorage();

  const records = ref<DayRecordMap>(loadRecords());
  const settings = ref<AppSettings>(loadSettings());
  const history = ref<CycleHistoryItem[]>(loadHistory());

  watch(records, (val) => saveRecords(val), { deep: true });
  watch(settings, (val) => saveSettings(val), { deep: true });
  watch(history, (val) => saveHistory(val), { deep: true });

  const getRecord = (date: string): DayRecord | undefined => records.value[date];

  const upsertRecord = (
    date: string,
    patch: Partial<Omit<DayRecord, 'date' | 'updatedAt'>>,
  ): DayRecord => {
    const existing = records.value[date];
    const baseSymptoms = { ...EMPTY_SYMPTOMS, ...(existing?.symptoms ?? {}), ...(patch.symptoms ?? {}) };
    const baseTags = patch.tags ?? existing?.tags ?? [];
    const merged: DayRecord = {
      date,
      flowLevel: 0,
      bloodColor: undefined,
      symptoms: { ...EMPTY_SYMPTOMS },
      tags: [],
      updatedAt: Date.now(),
      ...existing,
      ...patch,
    } as DayRecord;
    merged.symptoms = baseSymptoms;
    merged.tags = baseTags;
    records.value = { ...records.value, [date]: merged };

    syncDerivedState();
    return merged;
  };

  const clearRecord = (date: string): void => {
    const { [date]: _removed, ...rest } = records.value;
    records.value = rest;
    // 清空记录后立即重算派生状态，确保预测不再沿用已删除的周期起点
    syncDerivedState();
  };

  const setFlowLevel = (date: string, level: FlowLevel): DayRecord =>
    upsertRecord(date, { flowLevel: level });

  const setBloodColor = (date: string, color: BloodColorId | undefined): DayRecord =>
    upsertRecord(date, { bloodColor: color });

  const setSymptom = (date: string, key: keyof Symptoms, value: number): DayRecord =>
    upsertRecord(date, {
      symptoms: {
        ...(getRecord(date)?.symptoms ?? { ...EMPTY_SYMPTOMS }),
        [key]: value,
      },
    });

  const setSymptoms = (date: string, symptoms: Symptoms): DayRecord =>
    upsertRecord(date, { symptoms });

  const toggleTag = (date: string, tagId: string): DayRecord => {
    const current = getRecord(date)?.tags ?? [];
    const next = current.includes(tagId)
      ? current.filter((t) => t !== tagId)
      : [...current, tagId];
    return upsertRecord(date, { tags: next });
  };

  const setTags = (date: string, tags: string[]): DayRecord =>
    upsertRecord(date, { tags });

  const setSettings = (patch: Partial<AppSettings>): void => {
    settings.value = { ...settings.value, ...patch };
  };

  // 计算最近一次经期的起始日：将所有 flow>0 的日期按升序排列，
  // 相邻间隔 <= 2 天视为同一周期，返回最后一组（最近一次）的起始日；
  // 没有任何经期记录时返回空字符串
  const computeLatestPeriodStart = (): string => {
    const flowDates = Object.keys(records.value)
      .filter((k) => (records.value[k]?.flowLevel ?? 0) > 0)
      .sort();
    if (flowDates.length === 0) return '';

    let lastGroupStart = flowDates[0];
    for (let i = 1; i < flowDates.length; i++) {
      const gap = diffDays(flowDates[i - 1], flowDates[i]);
      if (gap > 2) {
        lastGroupStart = flowDates[i];
      }
    }
    return lastGroupStart;
  };

  const detectCyclesFromRecords = (): CycleHistoryItem[] => {
    const flowDates = Object.keys(records.value)
      .filter((k) => (records.value[k]?.flowLevel ?? 0) > 0)
      .sort();

    if (flowDates.length === 0) return [];

    const cycles: { start: string; days: string[] }[] = [];
    let currentDays: string[] = [flowDates[0]];

    for (let i = 1; i < flowDates.length; i++) {
      const prev = parseDate(flowDates[i - 1]);
      const cur = parseDate(flowDates[i]);
      if (cur.diff(prev, 'day') <= 2) {
        currentDays.push(flowDates[i]);
      } else {
        cycles.push({ start: currentDays[0], days: [...currentDays] });
        currentDays = [flowDates[i]];
      }
    }
    if (currentDays.length > 0) {
      cycles.push({ start: currentDays[0], days: [...currentDays] });
    }

    const result: CycleHistoryItem[] = cycles.map((c, idx) => {
      const duration = diffDays(c.start, c.days[c.days.length - 1]) + 1;
      const prevStart = idx > 0 ? cycles[idx - 1].start : null;
      const cycleLength = prevStart ? diffDays(prevStart, c.start) : settings.value.avgCycleLength;
      const avgPain =
        c.days.reduce((sum, d) => sum + (records.value[d]?.symptoms.cramp ?? 0), 0) /
        c.days.length;
      return {
        startDate: c.start,
        duration,
        cycleLength,
        avgPainLevel: Math.round(avgPain * 10) / 10,
      };
    });

    return result;
  };

  // 同步派生状态：历史周期汇总 + 最近经期起始日
  const syncDerivedState = (): void => {
    history.value = detectCyclesFromRecords();
    settings.value.lastPeriodStart = computeLatestPeriodStart();
  };

  // 初始化时立即同步派生状态，确保 lastPeriodStart 与 history
  // 始终与真实记录保持一致，避免预测沿用陈旧的周期起点
  syncDerivedState();

  const hasAnyRecord = computed(
    () => Object.keys(records.value).length > 0,
  );

  return {
    records,
    settings,
    history,

    hasAnyRecord,

    getRecord,
    upsertRecord,
    clearRecord,
    setFlowLevel,
    setBloodColor,
    setSymptom,
    setSymptoms,
    toggleTag,
    setTags,
    setSettings,
  };
});
