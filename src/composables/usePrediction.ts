import { computed } from 'vue';
import type { PredictionResult } from '@/types';
import { usePeriodStore } from '@/stores/period';
import { addDays, parseDate, formatDate } from '@/utils/date';

export const usePrediction = () => {
  const store = usePeriodStore();

  const prediction = computed<PredictionResult>(() => {
    const { avgCycleLength, avgPeriodDuration, lastPeriodStart } = store.settings;
    const cycles = store.history;

    let cycle: number = avgCycleLength;
    if (cycles.length >= 3) {
      const [last, prev, prev2] = [...cycles].reverse();
      cycle =
        last.cycleLength * 0.5 + prev.cycleLength * 0.3 + prev2.cycleLength * 0.2;
    } else if (cycles.length === 2) {
      const [last, prev] = [...cycles].reverse();
      cycle = last.cycleLength * 0.6 + prev.cycleLength * 0.4;
    } else if (cycles.length === 1) {
      cycle = cycles[0].cycleLength;
    }

    let duration: number = avgPeriodDuration;
    if (cycles.length > 0) {
      const latestCycles = [...cycles].reverse().slice(0, 3);
      duration = Math.round(
        latestCycles.reduce((sum, c) => sum + c.duration, 0) / latestCycles.length,
      );
    }

    const base = lastPeriodStart || formatDate(new Date());
    const start = parseDate(base);

    const nextPeriodStart = addDays(start, Math.round(cycle));
    const nextPeriodEnd = addDays(nextPeriodStart, duration - 1);
    const periodErrorStart = addDays(nextPeriodStart, -2);
    const periodErrorEnd = addDays(nextPeriodEnd, 2);

    const ovulationDay = addDays(nextPeriodStart, -14);
    const ovulationStart = addDays(ovulationDay, -5);
    const ovulationEnd = addDays(ovulationDay, 4);
    const ovulationErrorStart = addDays(ovulationStart, -1);
    const ovulationErrorEnd = addDays(ovulationEnd, 1);

    return {
      nextPeriodStart: formatDate(nextPeriodStart),
      nextPeriodEnd: formatDate(nextPeriodEnd),
      periodErrorRange: [formatDate(periodErrorStart), formatDate(periodErrorEnd)],
      ovulationStart: formatDate(ovulationStart),
      ovulationEnd: formatDate(ovulationEnd),
      ovulationDay: formatDate(ovulationDay),
      ovulationErrorRange: [formatDate(ovulationErrorStart), formatDate(ovulationErrorEnd)],
    };
  });

  return { prediction };
};
