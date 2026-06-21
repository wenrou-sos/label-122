import { computed } from 'vue';
import type { PredictionResult } from '@/types';
import { usePeriodStore } from '@/stores/period';
import { useOvulationDetection } from '@/composables/useOvulationDetection';
import { addDays, parseDate, formatDate, dayjs, isSameDay } from '@/utils/date';

export const usePrediction = () => {
  const store = usePeriodStore();
  const { ovulationFromTemp } = useOvulationDetection();

  const prediction = computed<PredictionResult>(() => {
    const { avgCycleLength, avgPeriodDuration, lastPeriodStart } = store.settings;
    const cycles = store.history;

    let cycle: number = avgCycleLength;
    const validCycles = cycles.filter((c) => c.cycleLength !== null);
    if (validCycles.length >= 3) {
      const [last, prev, prev2] = [...validCycles].reverse();
      cycle =
        (last.cycleLength as number) * 0.5 +
        (prev.cycleLength as number) * 0.3 +
        (prev2.cycleLength as number) * 0.2;
    } else if (validCycles.length === 2) {
      const [last, prev] = [...validCycles].reverse();
      cycle = (last.cycleLength as number) * 0.6 + (prev.cycleLength as number) * 0.4;
    } else if (validCycles.length === 1) {
      cycle = validCycles[0].cycleLength as number;
    }
    cycle = Math.max(1, Math.round(cycle));

    let duration: number = avgPeriodDuration;
    if (cycles.length > 0) {
      const latestCycles = [...cycles].reverse().slice(0, 3);
      duration = Math.round(
        latestCycles.reduce((sum, c) => sum + c.duration, 0) / latestCycles.length,
      );
    }
    duration = Math.max(1, duration);

    // 参考起点：有真实经期记录时使用最近一次经期起始日，否则以今天为基准
    const base = lastPeriodStart ? parseDate(lastPeriodStart) : dayjs();
    const now = dayjs();

    // 预测下次经期起始日 = 基准 + 周期长度
    let nextPeriodStart = addDays(base, cycle);

    // 当最近一次记录已超过一个周期（逾期/漏记）时，
    // 直接计算需要追加的周期数，确保预测日落在今天或未来，
    // 避免因循环上限导致"下次经期"停留在过去日期
    if (nextPeriodStart.isBefore(now, 'day')) {
      const elapsedDays = now.diff(base, 'day');
      const cyclesToAdd = Math.max(1, Math.ceil(elapsedDays / cycle));
      nextPeriodStart = addDays(base, cyclesToAdd * cycle);
      // 兜底：取整误差导致仍落在过去时，继续向前推一个周期
      let guard = 0;
      while (nextPeriodStart.isBefore(now, 'day') && guard < 4) {
        nextPeriodStart = nextPeriodStart.add(cycle, 'day');
        guard++;
      }
    }

    const nextPeriodEnd = addDays(nextPeriodStart, duration - 1);
    const periodErrorStart = addDays(nextPeriodStart, -2);
    const periodErrorEnd = addDays(nextPeriodEnd, 2);

    const predictedOvulationDay = addDays(nextPeriodStart, -14);
    const tempOvulationDate = ovulationFromTemp.value.ovulationDate;

    const ovulationDay = tempOvulationDate
      ? parseDate(tempOvulationDate)
      : predictedOvulationDay;
    const ovulationMethod: 'predicted' | 'temp' = tempOvulationDate ? 'temp' : 'predicted';

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
      ovulationMethod,
      ovulationErrorRange: [formatDate(ovulationErrorStart), formatDate(ovulationErrorEnd)],
    };
  });

  return { prediction };
};
