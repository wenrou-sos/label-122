import { computed } from 'vue';
import { usePeriodStore } from '@/stores/period';
import { parseDate } from '@/utils/date';

export interface TrendPoint {
  label: string;
  fullLabel: string;
  startDate: string;
  cycleLength: number;
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
  recent3CycleAvg: number;
  older3CycleAvg: number;
  recent3PainAvg: number;
  older3PainAvg: number;
}

export const useHistoryTrend = () => {
  const store = usePeriodStore();

  const MAX_POINTS = 12;
  const MIN_POINTS_FOR_TREND = 2;

  const trendPoints = computed<TrendPoint[]>(() => {
    const cycles = store.history ?? [];
    if (cycles.length === 0) return [];
    const slice = cycles.length > MAX_POINTS ? cycles.slice(-MAX_POINTS) : cycles;
    return slice.map((c) => {
      const d = parseDate(c.startDate);
      return {
        label: `${d.month() + 1}/${d.date()}`,
        fullLabel: `${d.year()}年${d.month() + 1}月${d.date()}日`,
        startDate: c.startDate,
        cycleLength: c.cycleLength,
        painScore: c.avgPainLevel,
        duration: c.duration,
      };
    });
  });

  const hasEnoughData = computed(
    () => trendPoints.value.length >= MIN_POINTS_FOR_TREND,
  );

  const stats = computed<TrendStats | null>(() => {
    const pts = trendPoints.value;
    if (pts.length === 0) return null;

    const cycles = pts.map((p) => p.cycleLength);
    const pains = pts.map((p) => p.painScore);
    const durations = pts.map((p) => p.duration);

    const avg = (arr: number[]) =>
      arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;

    const avgCycle = Math.round(avg(cycles) * 10) / 10;
    const minCycle = Math.min(...cycles);
    const maxCycle = Math.max(...cycles);

    const avgPain = Math.round(avg(pains) * 10) / 10;
    const avgDuration = Math.round(avg(durations) * 10) / 10;

    const recent3 = pts.slice(-3);
    const older3 = pts.length > 3 ? pts.slice(0, pts.length - 3).slice(-3) : [];
    const recent3CycleAvg = Math.round(avg(recent3.map((p) => p.cycleLength)) * 10) / 10;
    const older3CycleAvg =
      older3.length > 0
        ? Math.round(avg(older3.map((p) => p.cycleLength)) * 10) / 10
        : recent3CycleAvg;
    const recent3PainAvg = Math.round(avg(recent3.map((p) => p.painScore)) * 10) / 10;
    const older3PainAvg =
      older3.length > 0
        ? Math.round(avg(older3.map((p) => p.painScore)) * 10) / 10
        : recent3PainAvg;

    const cycleTrend = (() => {
      if (older3.length === 0) return 'stable' as const;
      const diff = recent3CycleAvg - older3CycleAvg;
      if (Math.abs(diff) < 1) return 'stable' as const;
      return diff > 0 ? ('longer' as const) : ('shorter' as const);
    })();

    const painTrend = (() => {
      if (older3.length === 0) return 'stable' as const;
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
    };
  });

  return { trendPoints, stats, hasEnoughData, MAX_POINTS };
};
