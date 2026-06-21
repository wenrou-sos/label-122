import { computed } from 'vue';
import { usePeriodStore } from '@/stores/period';
import { parseDate, todayStr } from '@/utils/date';
import type { CycleHistoryItem } from '@/types';

export interface TrendPoint {
  label: string;
  fullLabel: string;
  startDate: string;
  cycleLength: number | null;
  painScore: number;
  duration: number;
}

export interface TrendStats {
  avgCycle: number;
  minCycle: number;
  maxCycle: number;
  cycleRange: number;
  avgPain: number;
  avgDuration: number;
  cycleTrend: 'shorter' | 'stable' | 'longer';
  painTrend: 'lower' | 'stable' | 'higher';
  recent3CycleAvg: number | null;
  older3CycleAvg: number | null;
  recent3PainAvg: number;
  older3PainAvg: number;
  cycleCount: number;
  painCount: number;
}

const MONTH_RANGE = 12;
const MIN_CYCLES_FOR_TREND = 2;

const mapCycleToPoint = (c: CycleHistoryItem): TrendPoint => {
  const d = parseDate(c.startDate);
  return {
    label: `${d.month() + 1}/${d.date()}`,
    fullLabel: `${d.year()}年${d.month() + 1}月${d.date()}日`,
    startDate: c.startDate,
    cycleLength: c.cycleLength,
    painScore: c.avgPainLevel,
    duration: c.duration,
  };
};

export const useHistoryTrend = () => {
  const store = usePeriodStore();

  const cyclesInRange = computed<CycleHistoryItem[]>(() => {
    const cycles = store.history ?? [];
    if (cycles.length === 0) return [];
    const today = parseDate(todayStr());
    const cutoff = today.subtract(MONTH_RANGE, 'month');
    return cycles.filter((c) => parseDate(c.startDate).isAfter(cutoff, 'day'));
  });

  const trendPoints = computed<TrendPoint[]>(() => {
    const cycles = cyclesInRange.value;
    if (cycles.length === 0) return [];
    return cycles.map((c) => mapCycleToPoint(c));
  });

  const hasEnoughCycleData = computed(() => {
    const count = trendPoints.value.filter((p) => p.cycleLength !== null).length;
    return count >= MIN_CYCLES_FOR_TREND;
  });

  const stats = computed<TrendStats | null>(() => {
    const pts = trendPoints.value;
    if (pts.length === 0) return null;

    const cyclePts = pts.filter((p) => p.cycleLength !== null);
    const cycleVals = cyclePts.map((p) => p.cycleLength as number);
    const painVals = pts.map((p) => p.painScore);
    const durVals = pts.map((p) => p.duration);

    const avg = (arr: number[]) =>
      arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;

    const avgCycle = cycleVals.length > 0 ? Math.round(avg(cycleVals) * 10) / 10 : 0;
    const minCycle = cycleVals.length > 0 ? Math.min(...cycleVals) : 0;
    const maxCycle = cycleVals.length > 0 ? Math.max(...cycleVals) : 0;

    const avgPain = Math.round(avg(painVals) * 10) / 10;
    const avgDuration = Math.round(avg(durVals) * 10) / 10;

    const mid = Math.floor(pts.length / 2);
    const firstHalf = pts.slice(0, mid);
    const secondHalf = pts.slice(mid);

    const firstHalfCycles = firstHalf
      .filter((p) => p.cycleLength !== null)
      .map((p) => p.cycleLength as number);
    const secondHalfCycles = secondHalf
      .filter((p) => p.cycleLength !== null)
      .map((p) => p.cycleLength as number);

    const older3CycleAvg =
      firstHalfCycles.length > 0
        ? Math.round(avg(firstHalfCycles) * 10) / 10
        : null;
    const recent3CycleAvg =
      secondHalfCycles.length > 0
        ? Math.round(avg(secondHalfCycles) * 10) / 10
        : null;

    const older3PainAvg =
      firstHalf.length > 0
        ? Math.round(avg(firstHalf.map((p) => p.painScore)) * 10) / 10
        : 0;
    const recent3PainAvg =
      secondHalf.length > 0
        ? Math.round(avg(secondHalf.map((p) => p.painScore)) * 10) / 10
        : 0;

    const cycleTrend = (() => {
      if (older3CycleAvg === null || recent3CycleAvg === null) return 'stable' as const;
      const diff = recent3CycleAvg - older3CycleAvg;
      if (Math.abs(diff) < 1) return 'stable' as const;
      return diff > 0 ? ('longer' as const) : ('shorter' as const);
    })();

    const painTrend = (() => {
      if (firstHalf.length === 0 || secondHalf.length === 0) return 'stable' as const;
      const diff = recent3PainAvg - older3PainAvg;
      if (Math.abs(diff) < 0.8) return 'stable' as const;
      return diff > 0 ? ('higher' as const) : ('lower' as const);
    })();

    return {
      avgCycle,
      minCycle,
      maxCycle,
      cycleRange: maxCycle - minCycle,
      avgPain,
      avgDuration,
      cycleTrend,
      painTrend,
      recent3CycleAvg,
      older3CycleAvg,
      recent3PainAvg,
      older3PainAvg,
      cycleCount: cycleVals.length,
      painCount: pts.length,
    };
  });

  return {
    trendPoints,
    stats,
    hasEnoughCycleData,
    MONTH_RANGE,
  };
};
