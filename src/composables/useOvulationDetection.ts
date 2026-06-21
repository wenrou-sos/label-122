import { computed } from 'vue';
import { usePeriodStore } from '@/stores/period';
import { parseDate, diffDays } from '@/utils/date';

export interface TempOvulationResult {
  ovulationDate: string | null;
  coverline: number | null;
  lowPhaseAvg: number | null;
  highPhaseAvg: number | null;
  tempShift: number | null;
  confidence: 'low' | 'medium' | 'high';
  cycleStart: string | null;
}

export const useOvulationDetection = () => {
  const store = usePeriodStore();

  const currentCycleTemps = computed<{ date: string; temp: number }[]>(() => {
    const records = store.records;
    const lastPeriodStart = store.settings.lastPeriodStart;
    if (!lastPeriodStart) return [];

    const temps: { date: string; temp: number }[] = [];
    Object.keys(records).forEach((date) => {
      const rec = records[date];
      if (rec?.basalTemp !== undefined && rec.basalTemp > 0) {
        if (parseDate(date).isAfter(parseDate(lastPeriodStart).subtract(1, 'day'), 'day')) {
          temps.push({ date, temp: rec.basalTemp });
        }
      }
    });

    return temps.sort((a, b) => (a.date < b.date ? -1 : 1));
  });

  const ovulationFromTemp = computed<TempOvulationResult>(() => {
    const temps = currentCycleTemps.value;
    const lastPeriodStart = store.settings.lastPeriodStart;

    const empty: TempOvulationResult = {
      ovulationDate: null,
      coverline: null,
      lowPhaseAvg: null,
      highPhaseAvg: null,
      tempShift: null,
      confidence: 'low',
      cycleStart: lastPeriodStart || null,
    };

    if (temps.length < 6) return empty;

    const values = temps.map((t) => t.temp);
    const minTemp = Math.min(...values);
    const maxTemp = Math.max(...values);
    const overallRange = maxTemp - minTemp;

    if (overallRange < 0.2) return empty;

    const sorted = [...temps].sort((a, b) => a.temp - b.temp);
    const lowerSixth = sorted.slice(0, Math.max(3, Math.floor(sorted.length / 4)));
    const lowPhaseEstimate =
      lowerSixth.reduce((s, t) => s + t.temp, 0) / lowerSixth.length;
    const coverline = lowPhaseEstimate + 0.2;

    let shiftIndex = -1;
    for (let i = 2; i < temps.length - 2; i++) {
      const prev3 = temps.slice(Math.max(0, i - 3), i).map((t) => t.temp);
      const prevAvg = prev3.reduce((a, b) => a + b, 0) / prev3.length;

      const next3 = temps.slice(i, Math.min(temps.length, i + 3)).map((t) => t.temp);
      const nextAvg = next3.reduce((a, b) => a + b, 0) / next3.length;

      const allBelowCoverline = prev3.every((t) => t < coverline);
      const allAboveCoverline = next3.every((t) => t >= coverline - 0.05);

      if (allBelowCoverline && allAboveCoverline && nextAvg - prevAvg >= 0.2) {
        shiftIndex = i;
        break;
      }
    }

    if (shiftIndex < 0) {
      for (let i = 1; i < temps.length; i++) {
        if (temps[i].temp >= coverline && temps[i - 1].temp < coverline) {
          shiftIndex = i;
          break;
        }
      }
    }

    if (shiftIndex <= 0) return empty;

    const ovulationDate = temps[shiftIndex - 1].date;
    const lowTemps = temps.slice(0, shiftIndex).map((t) => t.temp);
    const highTemps = temps.slice(shiftIndex).map((t) => t.temp);

    const lowPhaseAvg = lowTemps.length > 0
      ? Math.round((lowTemps.reduce((a, b) => a + b, 0) / lowTemps.length) * 100) / 100
      : null;
    const highPhaseAvg = highTemps.length > 0
      ? Math.round((highTemps.reduce((a, b) => a + b, 0) / highTemps.length) * 100) / 100
      : null;
    const tempShift = lowPhaseAvg && highPhaseAvg
      ? Math.round((highPhaseAvg - lowPhaseAvg) * 100) / 100
      : null;

    let confidence: 'low' | 'medium' | 'high' = 'low';
    if (highTemps.length >= 3) confidence = 'medium';
    if (highTemps.length >= 3 && lowTemps.length >= 5 && (tempShift ?? 0) >= 0.3) {
      confidence = 'high';
    }

    return {
      ovulationDate,
      coverline: Math.round(coverline * 100) / 100,
      lowPhaseAvg,
      highPhaseAvg,
      tempShift,
      confidence,
      cycleStart: lastPeriodStart || null,
    };
  });

  const isTempOvulationDay = (date: string): boolean => {
    return ovulationFromTemp.value.ovulationDate === date;
  };

  return {
    currentCycleTemps,
    ovulationFromTemp,
    isTempOvulationDay,
  };
};
