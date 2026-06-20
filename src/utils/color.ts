import { FLOW_LEVELS } from '@/constants';
import type { FlowLevel } from '@/types';

export const getFlowColor = (level: FlowLevel): string => {
  const item = FLOW_LEVELS.find((f) => f.level === level);
  if (!item || level === 0) return 'transparent';
  const baseColor = '#E63946';
  const r = parseInt(baseColor.slice(1, 3), 16);
  const g = parseInt(baseColor.slice(3, 5), 16);
  const b = parseInt(baseColor.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${item.alpha})`;
};

export const getFlowBorder = (level: FlowLevel): string => {
  if (level === 0) return 'transparent';
  return '#E63946';
};

export const symptomScoreToHeatColor = (totalScore: number): string => {
  const clamp = Math.max(0, Math.min(50, totalScore));
  const t = clamp / 50;

  if (t === 0) {
    return 'hsla(350, 60%, 97%, 0.55)';
  }

  const stops = [
    { t: 0, h: 350, s: 60, l: 96 },
    { t: 0.2, h: 345, s: 70, l: 88 },
    { t: 0.4, h: 338, s: 75, l: 78 },
    { t: 0.6, h: 330, s: 78, l: 66 },
    { t: 0.8, h: 325, s: 80, l: 54 },
    { t: 1, h: 350, s: 85, l: 46 },
  ];

  let i = 0;
  while (i < stops.length - 1 && t > stops[i + 1].t) i++;

  const a = stops[i];
  const b = stops[Math.min(stops.length - 1, i + 1)];
  const range = b.t - a.t;
  const ratio = range === 0 ? 0 : (t - a.t) / range;

  const h = Math.round(a.h + (b.h - a.h) * ratio);
  const s = Math.round(a.s + (b.s - a.s) * ratio);
  const l = Math.round(a.l + (b.l - a.l) * ratio);

  return `hsl(${h}, ${s}%, ${l}%)`;
};

export const getHeatTextColor = (totalScore: number): string => {
  return totalScore >= 30 ? 'white' : '#2d2d34';
};
