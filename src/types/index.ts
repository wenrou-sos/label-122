export type FlowLevel = 0 | 1 | 2 | 3;

export type BloodColorId = 'bright' | 'dark' | 'brown' | 'pink' | 'coffee';

export interface Symptoms {
  cramp: number;
  backache: number;
  headache: number;
  breast: number;
  mood: number;
}

export type SymptomKey = keyof Symptoms;

export interface DayRecord {
  date: string;
  flowLevel: FlowLevel;
  bloodColor?: BloodColorId;
  symptoms: Symptoms;
  tags: string[];
  basalTemp?: number;
  updatedAt: number;
}

export type DayRecordMap = Record<string, DayRecord>;

export interface CalendarCell {
  date: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isFuture: boolean;
  weekday: number;
}

export interface AppSettings {
  avgCycleLength: number;
  avgPeriodDuration: number;
  lastPeriodStart: string;
}

export interface CycleHistoryItem {
  startDate: string;
  duration: number;
  cycleLength: number | null;
  avgPainLevel: number;
  ovulationDate?: string;
  ovulationMethod?: 'predicted' | 'temp';
}

export interface PredictionResult {
  nextPeriodStart: string;
  nextPeriodEnd: string;
  periodErrorRange: [string, string];
  ovulationStart: string;
  ovulationEnd: string;
  ovulationDay: string;
  ovulationMethod: 'predicted' | 'temp';
  ovulationErrorRange: [string, string];
}

export interface DayMarkers {
  flowLevel: FlowLevel;
  hasRecord: boolean;
  isOvulationDay: boolean;
  isOvulationWindow: boolean;
  isPredictedPeriod: boolean;
  isPredictedPeriodStart: boolean;
  isPeriodErrorEdge: boolean;
  symptomTotalScore: number;
  basalTemp?: number;
  isTempOvulationDay: boolean;
}

export interface MonthStats {
  year: number;
  month: number;
  periodDays: number;
  avgCycleLength: number;
  avgPainScore: number;
  prevPeriodDays: number;
  prevAvgPainScore: number;
  periodChange: number;
  painChange: number;
  cycleRegularity: 'improved' | 'stable' | 'declined';
}

export type ViewMode = 'calendar' | 'heatmap' | 'trend' | 'temp';

export interface PresetTag {
  id: string;
  label: string;
  icon: string;
}

export interface SymptomMeta {
  key: SymptomKey;
  label: string;
  icon: string;
  color: string;
}
