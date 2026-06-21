<script setup lang="ts">
import { computed } from 'vue';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-vue-next';
import type { MonthlySymptomTrend } from '@/types';

const props = defineProps<{
  data: MonthlySymptomTrend[];
}>();

const SVG_W = 340;
const SVG_H = 200;
const PAD_L = 36;
const PAD_R = 16;
const PAD_T = 18;
const PAD_B = 34;
const PLOT_W = SVG_W - PAD_L - PAD_R;
const PLOT_H = SVG_H - PAD_T - PAD_B;

const GRID_COLOR = 'rgba(158, 154, 168, 0.15)';
const AXIS_COLOR = 'rgba(158, 154, 168, 0.5)';

const xFor = (idx: number, total: number) =>
  PAD_L + (total === 1 ? PLOT_W / 2 : (idx * PLOT_W) / (total - 1));

const yFor = (v: number) =>
  PAD_T + PLOT_H - (v / 10) * PLOT_H;

const yTickValues = [0, 2, 5, 8, 10];

const buildSmoothPath = (pts: { x: number; y: number }[]): string => {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const cur = pts[i];
    const cpx1 = prev.x + (cur.x - prev.x) / 2;
    const cpx2 = prev.x + (cur.x - prev.x) / 2;
    d += ` C ${cpx1} ${prev.y}, ${cpx2} ${cur.y}, ${cur.x} ${cur.y}`;
  }
  return d;
};

const monthLabels = computed(() => {
  if (props.data.length === 0) return [];
  return props.data[0].points.map((p) => p.monthLabel);
});

const trendIcon = (t: MonthlySymptomTrend['trend']) => {
  switch (t) {
    case 'improving': return TrendingDown;
    case 'worsening': return TrendingUp;
    default: return Minus;
  }
};

const trendLabel = (t: MonthlySymptomTrend['trend']) => {
  switch (t) {
    case 'improving': return '好转';
    case 'worsening': return '加重';
    default: return '平稳';
  }
};

const trendColor = (t: MonthlySymptomTrend['trend']) => {
  switch (t) {
    case 'improving': return '#3ac569';
    case 'worsening': return '#f64e8b';
    default: return '#9e9aa8';
  }
};
</script>

<template>
  <div class="symptom-trend-chart">
    <div class="chart-head">
      <div class="chart-title">
        <BarChart3 :size="14" color="#FF6B9D" />
        <span>症状逐月趋势</span>
      </div>
    </div>

    <div v-if="data.length === 0" class="empty-state">
      <div class="empty-icon"><BarChart3 :size="32" color="#c0bcc8" /></div>
      <div class="empty-title">暂无趋势数据</div>
      <div class="empty-desc">持续记录症状，这里将展示近 6 个月的症状变化趋势</div>
    </div>

    <div v-else class="chart-wrap">
      <svg :viewBox="`0 0 ${SVG_W} ${SVG_H}`" class="chart-svg">
        <g class="grid-lines">
          <line
            v-for="t in yTickValues"
            :key="`g-${t}`"
            :x1="PAD_L"
            :x2="SVG_W - PAD_R"
            :y1="yFor(t)"
            :y2="yFor(t)"
            :stroke="GRID_COLOR"
            stroke-width="1"
            stroke-dasharray="3 4"
          />
        </g>

        <g class="y-axis">
          <line :x1="PAD_L" :x2="PAD_L" :y1="PAD_T" :y2="SVG_H - PAD_B" :stroke="AXIS_COLOR" stroke-width="1" />
          <text
            v-for="t in yTickValues"
            :key="`yt-${t}`"
            :x="PAD_L - 6"
            :y="yFor(t) + 3"
            text-anchor="end"
            font-size="9"
            fill="#9e9aa8"
          >{{ t }}</text>
        </g>

        <g class="x-axis">
          <line :x1="PAD_L" :x2="SVG_W - PAD_R" :y1="SVG_H - PAD_B" :y2="SVG_H - PAD_B" :stroke="AXIS_COLOR" stroke-width="1" />
          <text
            v-for="(lbl, i) in monthLabels"
            :key="`xl-${i}`"
            :x="xFor(i, monthLabels.length)"
            :y="SVG_H - PAD_B + 14"
            text-anchor="middle"
            font-size="9"
            fill="#9e9aa8"
          >{{ lbl }}</text>
        </g>

        <template v-for="s in data" :key="s.symptomKey">
          <path
            v-if="s.points.filter(p => p.sampleCount > 0).length >= 2"
            :d="buildSmoothPath(s.points.map((p, i) => ({
              x: xFor(i, s.points.length),
              y: yFor(p.avgSeverity),
            })))"
            fill="none"
            :stroke="s.symptomColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            opacity="0.9"
          />
          <g>
            <circle
              v-for="(p, i) in s.points"
              v-show="p.sampleCount > 0"
              :key="`pt-${s.symptomKey}-${i}`"
              :cx="xFor(i, s.points.length)"
              :cy="yFor(p.avgSeverity)"
              r="3"
              fill="white"
              :stroke="s.symptomColor"
              stroke-width="1.5"
            />
          </g>
        </template>
      </svg>
    </div>

    <div v-if="data.length > 0" class="legend-row">
      <div v-for="s in data" :key="s.symptomKey" class="legend-item">
        <span class="legend-dot" :style="{ background: s.symptomColor }" />
        <span class="legend-name">{{ s.symptomIcon }} {{ s.symptomLabel }}</span>
        <component :is="trendIcon(s.trend)" :size="12" :color="trendColor(s.trend)" />
        <span class="legend-trend" :style="{ color: trendColor(s.trend) }">{{ trendLabel(s.trend) }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.symptom-trend-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.chart-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.chart-title {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  font-weight: 700;
  color: #2d2d34;
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px 20px;
  gap: 8px;
  text-align: center;
}
.empty-icon {
  opacity: 0.5;
  margin-bottom: 4px;
}
.empty-title {
  font-size: 14px;
  font-weight: 700;
  color: #2d2d34;
}
.empty-desc {
  font-size: 11px;
  color: #9e9aa8;
  line-height: 1.6;
  max-width: 260px;
}
.chart-wrap {
  width: 100%;
}
.chart-svg {
  width: 100%;
  height: auto;
  display: block;
}
.legend-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 12px;
}
.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
}
.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.legend-name {
  color: #6a6473;
  font-weight: 600;
  flex: 1;
}
.legend-trend {
  font-weight: 700;
  font-size: 10px;
}
</style>
