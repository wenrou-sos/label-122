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
import { loadRecords, saveRecords, loadSettings, saveSettings, loadHistory, saveHistory } from '@/utils/storage';
import { todayStr, diffDays, addDays, parseDate, formatDate } from '@/utils/date';

const EMPTY_SYMPTOMS: Symptoms = {
  cramp: 0,
  backache: 0,
  headache: 0,
  breast: 0,
  mood: 0,
};

export const usePeriodStore = defineStore('period', () => {
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

    if (merged.flowLevel > 0 && !settings.value.lastPeriodStart) {
      settings.value.lastPeriodStart = findLastPeriodStart(date);
    } else if (merged.flowLevel > 0) {
      const currentStart = parseDate(settings.value.lastPeriodStart);
      const d = parseDate(date);
      if (d.isBefore(currentStart, 'day')) {
        settings.value.lastPeriodStart = findLastPeriodStart(date);
      } else if (d.diff(currentStart, 'day') > settings.value.avgCycleLength) {
        settings.value.lastPeriodStart = findLastPeriodStart(date);
      }
    }

    refreshHistory();
    return merged;
  };

  const clearRecord = (date: string): void => {
    const { [date]: _removed, ...rest } = records.value;
    records.value = rest;
    refreshHistory();
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

  const findLastPeriodStart = (fromDate: string): string => {
    const sorted = Object.keys(records.value)
      .filter((k) => (records.value[k]?.flowLevel ?? 0) > 0)
      .sort((a, b) => (a < b ? 1 : -1));

    if (sorted.length === 0) return fromDate;

    let start = sorted[0];
    for (const d of sorted) {
      if (diffDays(d, start) <= 1) {
        start = d;
      } else {
        break;
      }
    }
    return start;
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

  const refreshHistory = (): void => {
    history.value = detectCyclesFromRecords();
  };

  const hasAnyRecord = computed(
    () => Object.keys(records.value).length > 0,
  );

  const seedMockDataIfEmpty = (): void => {
    if (hasAnyRecord.value) return;

    const today = parseDate(todayStr());
    const cycleStart = addDays(today, -3);
    settings.value.lastPeriodStart = formatDate(cycleStart);
    settings.value.avgCycleLength = 28;
    settings.value.avgPeriodDuration = 5;

    const mockList: { date: string; patch: Partial<DayRecord> }[] = [];

    for (let i = 0; i < 5; i++) {
      const d = addDays(cycleStart, i - 28);
      mockList.push({
        date: formatDate(d),
        patch: {
          flowLevel: (i === 0 || i === 4 ? 1 : (i === 1 || i === 3 ? 2 : 3)) as FlowLevel,
          bloodColor: ['bright', 'dark', 'bright', 'brown', 'pink'][i] as BloodColorId,
          symptoms: {
            cramp: [8, 6, 4, 3, 2][i],
            backache: [5, 6, 4, 2, 1][i],
            headache: [3, 2, 1, 0, 0][i],
            breast: [4, 3, 2, 1, 0][i],
            mood: [6, 5, 4, 2, 1][i],
          },
          tags: i === 0
            ? ['painkiller', 'bad_sleep']
            : i === 1
              ? ['ginger_tea', 'stress']
              : i === 2
                ? ['ginger_tea']
                : i === 3
                  ? ['happy']
                  : ['exercise'],
        },
      });
    }

    for (let i = 0; i < 5; i++) {
      const d = addDays(cycleStart, i);
      mockList.push({
        date: formatDate(d),
        patch: {
          flowLevel: (i === 0 || i === 4 ? 1 : (i === 1 || i === 3 ? 2 : 3)) as FlowLevel,
          bloodColor: ['bright', 'dark', 'bright', 'brown', 'pink'][i] as BloodColorId,
          symptoms: {
            cramp: [7, 5, 3, 2, 1][i],
            backache: [4, 5, 3, 2, 1][i],
            headache: [2, 3, 1, 0, 0][i],
            breast: [3, 2, 2, 1, 0][i],
            mood: [5, 4, 3, 1, 0][i],
          },
          tags: i === 0
            ? ['painkiller', 'ginger_tea']
            : i === 1
              ? ['ginger_tea', 'bad_sleep']
              : i === 2
                ? ['cold']
                : i === 3
                  ? ['spicy']
                  : ['happy'],
        },
      });
    }

    for (let i = -18; i <= -10; i++) {
      const d = addDays(cycleStart, i);
      if (Math.abs(i) % 3 === 0) {
        mockList.push({
          date: formatDate(d),
          patch: {
            flowLevel: 0,
            symptoms: {
              cramp: 1,
              backache: 2,
              headache: 0,
              breast: 5,
              mood: 3,
            },
            tags: ['stress'],
          },
        });
      }
    }

    mockList.forEach(({ date, patch }) => upsertRecord(date, patch));
    refreshHistory();
  };

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

    seedMockDataIfEmpty,
    refreshHistory,
  };
});
