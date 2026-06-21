import { computed } from 'vue';
import type { MonthStats } from '@/types';
import { usePeriodStore } from '@/stores/period';
import { usePrediction } from '@/composables/usePrediction';
import { buildMonthCells, isInRange, isSameDay, parseDate, addDays, diffDays } from '@/utils/date';

type CalendarCell = { date: string; day: number; isCurrentMonth: boolean; isToday: boolean; isFuture: boolean; weekday: number };
export type CalendarCellWithMarkers = CalendarCell & {
  markers: {
    flowLevel: 0 | 1 | 2 | 3;
    hasRecord: boolean;
    isOvulationDay: boolean;
    isOvulationWindow: boolean;
    isPredictedPeriod: boolean;
    isPredictedPeriodStart: boolean;
    isPeriodErrorEdge: boolean;
    symptomTotalScore: number;
  };
};

export const useCalendar = (year: () => number, month: () => number) => {
  const store = usePeriodStore();
  const { prediction } = usePrediction();

  const cells = computed<CalendarCellWithMarkers[]>(() => {
    const raw = buildMonthCells(year(), month());
    const pred = prediction.value;
    const periodRange = [pred.periodErrorRange[0], pred.periodErrorRange[1]] as const;

    return raw.map((cell): CalendarCellWithMarkers => {
      const record = store.records[cell.date];
      const flowLevel = (record?.flowLevel ?? 0) as 0 | 1 | 2 | 3;
      const symptoms = record?.symptoms ?? { cramp: 0, backache: 0, headache: 0, breast: 0, mood: 0 };
      const symptomTotalScore =
        symptoms.cramp + symptoms.backache + symptoms.headache + symptoms.breast + symptoms.mood;

      const inOvuWindow = isInRange(
        cell.date,
        pred.ovulationErrorRange[0],
        pred.ovulationErrorRange[1],
      );
      const inPredPeriod = isInRange(cell.date, periodRange[0], periodRange[1]);

      return {
        ...cell,
        markers: {
          flowLevel,
          hasRecord: !!record && (flowLevel > 0 || symptomTotalScore > 0 || (record.tags?.length ?? 0) > 0),
          isOvulationDay: isSameDay(cell.date, pred.ovulationDay),
          isOvulationWindow: inOvuWindow,
          isPredictedPeriod: inPredPeriod,
          isPredictedPeriodStart: isSameDay(cell.date, pred.nextPeriodStart),
          isPeriodErrorEdge:
            isSameDay(cell.date, periodRange[0]) || isSameDay(cell.date, periodRange[1]),
          symptomTotalScore,
        },
      };
    });
  });

  const monthStats = computed<MonthStats>(() => {
    const y = year();
    const m = month();
    const monthStart = parseDate(new Date(y, m, 1));
    const prevMonthStart = parseDate(new Date(y, m - 1, 1));
    const prevMonthEnd = addDays(monthStart, -1);

    let periodDays = 0;
    let painSum = 0;
    let painCount = 0;
    let prevPeriodDays = 0;
    let prevPainSum = 0;
    let prevPainCount = 0;

    Object.entries(store.records).forEach(([date, rec]) => {
      const d = parseDate(date);
      const inThisMonth = d.month() === m && d.year() === y;
      const inPrevMonth =
        d.isAfter(prevMonthStart.subtract(1, 'day'), 'day') &&
        d.isBefore(monthStart, 'day');

      const flow = rec?.flowLevel ?? 0;
      if (flow > 0) {
        if (inThisMonth) periodDays++;
        else if (inPrevMonth) prevPeriodDays++;
      }
      const pain = rec?.symptoms.cramp ?? 0;
      if (inThisMonth && pain > 0) {
        painSum += pain;
        painCount++;
      } else if (inPrevMonth && pain > 0) {
        prevPainSum += pain;
        prevPainCount++;
      }
    });

    const avgPainScore = painCount > 0 ? Math.round((painSum / painCount) * 10) / 10 : 0;
    const prevAvgPainScore =
      prevPainCount > 0 ? Math.round((prevPainSum / prevPainCount) * 10) / 10 : 0;

    const calcChange = (cur: number, prev: number): number => {
      if (prev === 0 && cur === 0) return 0;
      if (prev === 0) return cur > 0 ? 100 : 0;
      return Math.round(((cur - prev) / prev) * 100);
    };

    const avgCycleLength = (() => {
      const cycles = store.history.filter((c) => c.cycleLength !== null);
      if (cycles.length === 0) return store.settings.avgCycleLength;
      const latest = cycles.slice(-3);
      return Math.round(
        latest.reduce((s, c) => s + (c.cycleLength as number), 0) / latest.length,
      );
    })();

    const regularity = (() => {
      const cycles = store.history
        .filter((c) => c.cycleLength !== null)
        .slice(-4);
      if (cycles.length < 3) return 'stable' as const;
      const lengths = cycles.map((c) => c.cycleLength as number);
      const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
      const variance =
        lengths.reduce((s, l) => s + (l - avg) ** 2, 0) / lengths.length;
      const std = Math.sqrt(variance);
      if (std <= 1.2) return 'improved' as const;
      if (std <= 2.5) return 'stable' as const;
      return 'declined' as const;
    })();

    return {
      year: y,
      month: m,
      periodDays,
      avgCycleLength,
      avgPainScore,
      prevPeriodDays,
      prevAvgPainScore,
      periodChange: calcChange(periodDays, prevPeriodDays),
      painChange: calcChange(avgPainScore, prevAvgPainScore),
      cycleRegularity: regularity,
    };
  });

  return { cells, monthStats };
};
