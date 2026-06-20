import type { PresetTag, SymptomMeta, BloodColorId } from '@/types';

export const PRESET_TAGS: PresetTag[] = [
  { id: 'painkiller', label: '吃了止痛药', icon: '💊' },
  { id: 'ginger_tea', label: '喝了红糖姜茶', icon: '🍵' },
  { id: 'bad_sleep', label: '没睡好', icon: '😴' },
  { id: 'exercise', label: '做了运动', icon: '🏃' },
  { id: 'stress', label: '压力大', icon: '😰' },
  { id: 'cold', label: '受凉了', icon: '🥶' },
  { id: 'spicy', label: '吃了辛辣', icon: '🌶️' },
  { id: 'happy', label: '心情不错', icon: '😊' },
];

export const BLOOD_COLORS: { id: BloodColorId; label: string; color: string }[] = [
  { id: 'bright', label: '鲜红色', color: '#FF3B30' },
  { id: 'dark', label: '暗红色', color: '#B71C1C' },
  { id: 'brown', label: '褐色', color: '#795548' },
  { id: 'pink', label: '粉红色', color: '#FF80AB' },
  { id: 'coffee', label: '咖啡色', color: '#5D4037' },
];

export const FLOW_LEVELS: {
  level: 0 | 1 | 2 | 3;
  label: string;
  alpha: number;
  hint: string;
  icon: string;
}[] = [
  { level: 0, label: '无', alpha: 0, hint: '非经期', icon: '○' },
  { level: 1, label: '少量', alpha: 0.4, hint: '点滴状', icon: '💧' },
  { level: 2, label: '中量', alpha: 0.72, hint: '正常量', icon: '💧💧' },
  { level: 3, label: '大量', alpha: 1, hint: '需频繁更换', icon: '💧💧💧' },
];

export const SYMPTOM_META: SymptomMeta[] = [
  { key: 'cramp', label: '痛经', icon: '⚡', color: '#E63946' },
  { key: 'backache', label: '腰酸', icon: '💆', color: '#F6A623' },
  { key: 'headache', label: '头痛', icon: '🤕', color: '#9D4EDD' },
  { key: 'breast', label: '乳房胀痛', icon: '💖', color: '#FF6B9D' },
  { key: 'mood', label: '情绪波动', icon: '🎭', color: '#4CC9F0' },
];

export const STORAGE_KEYS = {
  RECORDS: 'period:records',
  SETTINGS: 'period:settings',
  HISTORY: 'period:history',
} as const;

export const DEFAULT_SETTINGS = {
  avgCycleLength: 28,
  avgPeriodDuration: 5,
  lastPeriodStart: '',
};

export const WEEKDAYS_CN = ['日', '一', '二', '三', '四', '五', '六'];
