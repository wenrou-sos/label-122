import { computed } from 'vue';
import { usePeriodStore } from '@/stores/period';
import { PRESET_TAGS, SYMPTOM_META } from '@/constants';
import { parseDate, diffDays, addDays, dayjs, todayStr } from '@/utils/date';
import type {
  CyclePhase,
  SymptomPhaseAnalysis,
  TagSymptomCorrelation,
  MonthlySymptomTrend,
  SymptomKey,
  DayRecord,
} from '@/types';

const PHASE_LABELS: Record<CyclePhase, string> = {
  premenstrual: '经前',
  menstrual: '经期',
  postmenstrual: '经后',
  unknown: '未知',
};

const MONTH_RANGE = 6;
const PREMENSTRUAL_DAYS = 7;

const TYPICAL_CYCLE_DAYS = 28;

const getCyclePhase = (date: string, cycles: { start: string; end: string }[]): CyclePhase => {
  const d = parseDate(date);
  const n = cycles.length;
  if (n === 0) return 'unknown';

  for (let i = 0; i < n; i++) {
    const cycleStart = parseDate(cycles[i].start);
    const cycleEnd = parseDate(cycles[i].end);

    if ((d.isSame(cycleStart, 'day') || d.isAfter(cycleStart, 'day')) &&
        (d.isSame(cycleEnd, 'day') || d.isBefore(cycleEnd, 'day'))) {
      return 'menstrual';
    }

    if (d.isBefore(cycleStart, 'day') && d.isAfter(cycleStart.subtract(PREMENSTRUAL_DAYS + 1, 'day'), 'day')) {
      return 'premenstrual';
    }

    if (d.isAfter(cycleEnd, 'day')) {
      let postEnd: dayjs.Dayjs;
      if (i < n - 1) {
        const nextStart = parseDate(cycles[i + 1].start);
        postEnd = nextStart.subtract(PREMENSTRUAL_DAYS, 'day');
      } else {
        const cycleLen = Math.max(
          cycleEnd.diff(cycleStart, 'day') + 1,
          5,
        );
        const remaining = Math.max(TYPICAL_CYCLE_DAYS - cycleLen - PREMENSTRUAL_DAYS, 7);
        postEnd = cycleEnd.add(remaining, 'day');
      }

      if (d.isSame(postEnd, 'day') || d.isBefore(postEnd, 'day')) {
        return 'postmenstrual';
      }
    }
  }

  return 'unknown';
};

const buildCyclesFromRecords = (records: Record<string, DayRecord>): { start: string; end: string }[] => {
  const flowDates = Object.keys(records)
    .filter((k) => (records[k]?.flowLevel ?? 0) > 0)
    .sort();

  if (flowDates.length === 0) return [];

  const cycles: { start: string; end: string }[] = [];
  let currentStart = flowDates[0];
  let currentEnd = flowDates[0];

  for (let i = 1; i < flowDates.length; i++) {
    const gap = diffDays(flowDates[i - 1], flowDates[i]);
    if (gap > 2) {
      cycles.push({ start: currentStart, end: currentEnd });
      currentStart = flowDates[i];
    }
    currentEnd = flowDates[i];
  }
  cycles.push({ start: currentStart, end: currentEnd });

  return cycles;
};

const avg = (arr: number[]) =>
  arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;

export const usePatternAnalysis = () => {
  const store = usePeriodStore();

  const allRecords = computed(() => {
    const recs = store.records;
    const dates = Object.keys(recs).sort();
    return dates.map((d) => ({ date: d, record: recs[d] })).filter((x) => x.record);
  });

  const cycles = computed(() => buildCyclesFromRecords(store.records));

  const symptomPhaseAnalysis = computed<SymptomPhaseAnalysis[]>(() => {
    const cyclesData = cycles.value;
    const symptomKeys: SymptomKey[] = ['cramp', 'backache', 'headache', 'breast', 'mood'];
    const phaseBuckets: Record<CyclePhase, { severities: Record<SymptomKey, number[]>; count: number }> = {
      premenstrual: { severities: { cramp: [], backache: [], headache: [], breast: [], mood: [] }, count: 0 },
      menstrual: { severities: { cramp: [], backache: [], headache: [], breast: [], mood: [] }, count: 0 },
      postmenstrual: { severities: { cramp: [], backache: [], headache: [], breast: [], mood: [] }, count: 0 },
      unknown: { severities: { cramp: [], backache: [], headache: [], breast: [], mood: [] }, count: 0 },
    };

    for (const { date, record } of allRecords.value) {
      const phase = getCyclePhase(date, cyclesData);
      phaseBuckets[phase].count++;
      for (const key of symptomKeys) {
        const val = record.symptoms[key] ?? 0;
        if (val > 0) {
          phaseBuckets[phase].severities[key].push(val);
        }
      }
    }

    return symptomKeys.map((key) => {
      const meta = SYMPTOM_META.find((m) => m.key === key)!;
      const phases = (['premenstrual', 'menstrual', 'postmenstrual'] as CyclePhase[]).map((phase) => {
        const bucket = phaseBuckets[phase];
        const severities = bucket.severities[key];
        return {
          phase,
          phaseLabel: PHASE_LABELS[phase],
          avgSeverity: Math.round(avg(severities) * 10) / 10,
          occurrenceRate: bucket.count > 0 ? Math.round((severities.length / bucket.count) * 100) : 0,
          sampleCount: bucket.count,
        };
      });
      let highestPhase: CyclePhase = 'unknown';
      let highestRate = -1;
      for (const p of phases) {
        if (p.occurrenceRate > highestRate) {
          highestRate = p.occurrenceRate;
          highestPhase = p.phase;
        }
      }
      return {
        symptomKey: key,
        symptomLabel: meta.label,
        phases,
        highestPhase,
        highestPhaseLabel: PHASE_LABELS[highestPhase],
      };
    });
  });

  const tagSymptomCorrelations = computed<TagSymptomCorrelation[]>(() => {
    const results: TagSymptomCorrelation[] = [];
    const symptomKeys: SymptomKey[] = ['cramp', 'backache', 'headache', 'breast', 'mood'];

    for (const tag of PRESET_TAGS) {
      const withTag: Record<SymptomKey, number[]> = {
        cramp: [], backache: [], headache: [], breast: [], mood: [],
      };
      const withoutTag: Record<SymptomKey, number[]> = {
        cramp: [], backache: [], headache: [], breast: [], mood: [],
      };

      for (const { record } of allRecords.value) {
        const hasTag = record.tags?.includes(tag.id);
        for (const key of symptomKeys) {
          const val = record.symptoms[key] ?? 0;
          if (hasTag) {
            withTag[key].push(val);
          } else {
            withoutTag[key].push(val);
          }
        }
      }

      for (const key of symptomKeys) {
        const meta = SYMPTOM_META.find((m) => m.key === key)!;
        const withAvg = Math.round(avg(withTag[key]) * 10) / 10;
        const withoutAvg = Math.round(avg(withoutTag[key]) * 10) / 10;
        const diff = Math.round((withAvg - withoutAvg) * 10) / 10;
        let correlation: TagSymptomCorrelation['correlation'] = 'neutral';
        if (diff >= 1.5) correlation = 'strong-positive';
        else if (diff >= 0.6) correlation = 'positive';
        else if (diff <= -1.5) correlation = 'strong-negative';
        else if (diff <= -0.6) correlation = 'negative';

        if (withTag[key].length >= 2 && withoutTag[key].length >= 2 && Math.abs(diff) >= 0.5) {
          results.push({
            tagId: tag.id,
            tagLabel: tag.label,
            tagIcon: tag.icon,
            symptomKey: key,
            symptomLabel: meta.label,
            withTagAvg: withAvg,
            withoutTagAvg: withoutAvg,
            diff,
            correlation,
            sampleWithTag: withTag[key].length,
            sampleWithoutTag: withoutTag[key].length,
          });
        }
      }
    }

    return results.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
  });

  const monthlySymptomTrends = computed<MonthlySymptomTrend[]>(() => {
    const symptomKeys: SymptomKey[] = ['cramp', 'backache', 'headache', 'breast', 'mood'];
    const today = dayjs();
    const monthBuckets: Record<string, { severities: Record<SymptomKey, number[]>; count: number }> = {};

    for (let i = MONTH_RANGE - 1; i >= 0; i--) {
      const m = today.subtract(i, 'month');
      const key = `${m.year()}-${String(m.month() + 1).padStart(2, '0')}`;
      monthBuckets[key] = {
        severities: { cramp: [], backache: [], headache: [], breast: [], mood: [] },
        count: 0,
      };
    }

    for (const { date, record } of allRecords.value) {
      const d = parseDate(date);
      const key = `${d.year()}-${String(d.month() + 1).padStart(2, '0')}`;
      if (monthBuckets[key]) {
        monthBuckets[key].count++;
        for (const sKey of symptomKeys) {
          const val = record.symptoms[sKey] ?? 0;
          if (val > 0) {
            monthBuckets[key].severities[sKey].push(val);
          }
        }
      }
    }

    return symptomKeys.map((key) => {
      const meta = SYMPTOM_META.find((m) => m.key === key)!;
      const points = Object.keys(monthBuckets).map((monthKey) => {
        const bucket = monthBuckets[monthKey];
        const severities = bucket.severities[key];
        const [y, m] = monthKey.split('-');
        return {
          month: monthKey,
          monthLabel: `${parseInt(m)}月`,
          avgSeverity: Math.round(avg(severities) * 10) / 10,
          occurrenceRate: bucket.count > 0 ? Math.round((severities.length / bucket.count) * 100) : 0,
          sampleCount: bucket.count,
        };
      });

      const allVals = points.filter((p) => p.sampleCount > 0).map((p) => p.avgSeverity);
      const overallAvg = Math.round(avg(allVals) * 10) / 10;

      const mid = Math.floor(points.length / 2);
      const earlier = points.slice(0, mid).filter((p) => p.sampleCount > 0).map((p) => p.avgSeverity);
      const recent = points.slice(mid).filter((p) => p.sampleCount > 0).map((p) => p.avgSeverity);
      const earlier3Avg = Math.round(avg(earlier) * 10) / 10;
      const recent3Avg = Math.round(avg(recent) * 10) / 10;

      let trend: MonthlySymptomTrend['trend'] = 'stable';
      if (earlier.length > 0 && recent.length > 0) {
        const d = recent3Avg - earlier3Avg;
        if (d <= -0.5) trend = 'improving';
        else if (d >= 0.5) trend = 'worsening';
      }

      return {
        symptomKey: key,
        symptomLabel: meta.label,
        symptomColor: meta.color,
        symptomIcon: meta.icon,
        points,
        trend,
        overallAvg,
        recent3Avg,
        earlier3Avg,
      };
    });
  });

  const totalFlowDays = computed(() => {
    return cycles.value.reduce((sum, c) => {
      const days = diffDays(c.start, c.end) + 1;
      return sum + days;
    }, 0);
  });

  const phaseSampleCounts = computed(() => {
    const counts: Record<CyclePhase, number> = {
      premenstrual: 0,
      menstrual: 0,
      postmenstrual: 0,
      unknown: 0,
    };
    for (const { date } of allRecords.value) {
      const phase = getCyclePhase(date, cycles.value);
      counts[phase]++;
    }
    return counts;
  });

  const hasReliablePhaseData = computed(() => {
    const enoughCycles = cycles.value.length >= 2 || totalFlowDays.value >= 3;
    if (!enoughCycles) return false;
    const samples = phaseSampleCounts.value;
    return (
      samples.menstrual >= 2 &&
      (samples.premenstrual + samples.postmenstrual) >= 3 &&
      samples.premenstrual >= 1 &&
      samples.postmenstrual >= 1
    );
  });

  const hasEnoughData = computed(() => {
    return allRecords.value.length >= 10;
  });

  const hasCycleData = computed(() => {
    return cycles.value.length >= 1;
  });

  const hasTagCorrelationData = computed(() => {
    return tagSymptomCorrelations.value.length > 0;
  });

  return {
    symptomPhaseAnalysis,
    tagSymptomCorrelations,
    monthlySymptomTrends,
    hasEnoughData,
    hasCycleData,
    hasReliablePhaseData,
    hasTagCorrelationData,
    totalFlowDays,
    phaseSampleCounts,
    MONTH_RANGE,
    PREMENSTRUAL_DAYS,
  };
};
