<script setup lang="ts">
import { computed } from 'vue';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Droplets,
  Sparkles,
  AlertCircle,
  CalendarDays,
} from 'lucide-vue-next';
import { useHistoryTrend } from '@/composables/useHistoryTrend';
import type { TrendPoint } from '@/composables/useHistoryTrend';

const { trendPoints, stats, hasEnoughCycleData, MONTH_RANGE } = useHistoryTrend();

const SVG_W = 340;
const SVG_H = 220;
const PAD_L = 36;
const PAD_R = 36;
const PAD_T = 18;
const PAD_B = 34;
const PLOT_W = SVG_W - PAD_L - PAD_R;
const PLOT_H = SVG_H - PAD_T - PAD_B;

const CYCLE_COLOR = '#FF6B9D';
const PAIN_COLOR = '#9D4EDD';
const GRID_COLOR = 'rgba(158, 154, 168, 0.15)';
const AXIS_COLOR = 'rgba(158, 154, 168, 0.5)';

const cycleDomain = computed(() => {
  const values = trendPoints.value
    .filter((p) => p.cycleLength !== null)
    .map((p) => p.cycleLength as number);
  if (values.length === 0) return { min: 24, max: 32 };
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const span = Math.max(3, rawMax - rawMin);
  const pad = Math.ceil(span * 0.2);
  return { min: Math.max(18, rawMin - pad), max: rawMax + pad };
});

const painDomain = { min: 0, max: 10 };

const xFor = (idx: number, total: number) =>
  PAD_L + (total === 1 ? PLOT_W / 2 : (idx * PLOT_W) / (total - 1));

const yCycleFor = (v: number) =>
  PAD_T +
  PLOT_H -
  ((v - cycleDomain.value.min) /
    (cycleDomain.value.max - cycleDomain.value.min)) *
    PLOT_H;

const yPainFor = (v: number) =>
  PAD_T +
  PLOT_H -
  ((v - painDomain.min) / (painDomain.max - painDomain.min)) * PLOT_H;

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

const cyclePlotPoints = computed(() =>
  trendPoints.value
    .map((p, i) =>
      p.cycleLength !== null
        ? { x: xFor(i, trendPoints.value.length), y: yCycleFor(p.cycleLength) }
        : null,
    )
    .filter((p): p is { x: number; y: number } => p !== null),
);

const painPlotPoints = computed(() =>
  trendPoints.value.map((p, i) => ({
    x: xFor(i, trendPoints.value.length),
    y: yPainFor(p.painScore),
  })),
);

const cycleLinePath = computed(() => buildSmoothPath(cyclePlotPoints.value));
const painLinePath = computed(() => buildSmoothPath(painPlotPoints.value));

const cycleTickValues = computed(() => {
  const { min, max } = cycleDomain.value;
  const step = Math.max(1, Math.ceil((max - min) / 4));
  const ticks: number[] = [];
  for (let v = min; v <= max; v += step) ticks.push(v);
  if (ticks[ticks.length - 1] !== max) ticks.push(max);
  return ticks;
});

const painTickValues = [0, 2, 5, 8, 10];

const cycleTrendIcon = computed(() => {
  if (!stats.value || stats.value.cycleCount < 2) return Minus;
  switch (stats.value.cycleTrend) {
    case 'longer':
      return TrendingUp;
    case 'shorter':
      return TrendingDown;
    default:
      return Minus;
  }
});

const cycleTrendLabel = computed(() => {
  if (!stats.value || stats.value.cycleCount < 2) return '数据不足';
  switch (stats.value.cycleTrend) {
    case 'longer':
      return '周期略长';
    case 'shorter':
      return '周期略短';
    default:
      return '周期稳定';
  }
});

const cycleTrendColor = computed(() => {
  if (!stats.value || stats.value.cycleCount < 2) return '#9e9aa8';
  switch (stats.value.cycleTrend) {
    case 'longer':
      return '#f64e8b';
    case 'shorter':
      return '#4361ee';
    default:
      return '#3ac569';
  }
});

const painTrendIcon = computed(() => {
  if (!stats.value || stats.value.painCount < 2) return Minus;
  switch (stats.value.painTrend) {
    case 'higher':
      return TrendingUp;
    case 'lower':
      return TrendingDown;
    default:
      return Minus;
  }
});

const painTrendLabel = computed(() => {
  if (!stats.value || stats.value.painCount < 2) return '数据不足';
  switch (stats.value.painTrend) {
    case 'higher':
      return '疼痛上升';
    case 'lower':
      return '疼痛下降';
    default:
      return '疼痛平稳';
  }
});

const painTrendColor = computed(() => {
  if (!stats.value || stats.value.painCount < 2) return '#9e9aa8';
  switch (stats.value.painTrend) {
    case 'higher':
      return '#f64e8b';
    case 'lower':
      return '#3ac569';
    default:
      return '#9e9aa8';
  }
});

const hovered = (p: TrendPoint) => {
  const cycleTxt =
    p.cycleLength !== null ? `周期 ${p.cycleLength}天 · ` : '周期长度暂无 · ';
  return `${p.fullLabel}\n${cycleTxt}持续 ${p.duration}天\n痛经 ${p.painScore}分`;
};
</script>

<template>
  <div class="history-trend">
    <section v-if="stats" class="summary-row">
      <div class="stat-card glass-card">
        <div class="stat-head">
          <Droplets :size="14" :color="CYCLE_COLOR" />
          <span>平均周期</span>
        </div>
        <div class="stat-body">
          <div class="stat-main">
            <b class="num" :style="{ color: CYCLE_COLOR }">{{ stats.avgCycle }}</b>
            <span class="unit">天</span>
          </div>
          <div class="stat-sub">
            <span>{{ stats.minCycle }}~{{ stats.maxCycle }} 天</span>
          </div>
        </div>
      </div>

      <div class="stat-card glass-card">
        <div class="stat-head">
          <Activity :size="14" :color="PAIN_COLOR" />
          <span>痛经平均</span>
        </div>
        <div class="stat-body">
          <div class="stat-main">
            <b class="num" :style="{ color: PAIN_COLOR }">{{ stats.avgPain }}</b>
            <span class="unit">分</span>
          </div>
          <div class="stat-sub">
            <span>经期 {{ stats.avgDuration }} 天</span>
          </div>
        </div>
      </div>
    </section>

    <section class="chart-card glass-card">
      <div class="chart-head">
        <div class="chart-title">
          <Sparkles :size="14" color="#f64e8b" />
          <span>周期 & 痛经趋势</span>
        </div>
        <div class="chart-legend">
          <span class="legend-item">
            <i class="dot cycle" />周期长度
          </span>
          <span class="legend-item">
            <i class="dot pain" />痛经评分
          </span>
        </div>
      </div>

      <div v-if="trendPoints.length === 0" class="empty-state">
        <div class="empty-icon">
          <CalendarDays :size="36" color="#c0bcc8" />
        </div>
        <div class="empty-title">还没有足够的周期记录</div>
        <div class="empty-desc">
          在日历中记录至少 2 次经期，这里会展示过去 {{ MONTH_RANGE }} 个月的周期趋势变化
        </div>
      </div>

      <div v-else class="chart-wrap">
        <svg
          :viewBox="`0 0 ${SVG_W} ${SVG_H}`"
          preserveAspectRatio="xMidYMid meet"
          class="trend-svg"
        >
          <g class="grid-lines">
            <line
              v-for="t in cycleTickValues"
              :key="`g-c-${t}`"
              :x1="PAD_L"
              :x2="SVG_W - PAD_R"
              :y1="yCycleFor(t)"
              :y2="yCycleFor(t)"
              :stroke="GRID_COLOR"
              stroke-width="1"
              stroke-dasharray="3 4"
            />
          </g>

          <g class="axis axis-left">
            <line
              :x1="PAD_L"
              :x2="PAD_L"
              :y1="PAD_T"
              :y2="SVG_H - PAD_B"
              :stroke="AXIS_COLOR"
              stroke-width="1"
            />
            <text
              v-for="t in cycleTickValues"
              :key="`l-c-${t}`"
              :x="PAD_L - 6"
              :y="yCycleFor(t) + 3"
              text-anchor="end"
              font-size="9"
              fill="#9e9aa8"
            >
              {{ t }}
            </text>
          </g>

          <g class="axis axis-right">
            <line
              :x1="SVG_W - PAD_R"
              :x2="SVG_W - PAD_R"
              :y1="PAD_T"
              :y2="SVG_H - PAD_B"
              :stroke="AXIS_COLOR"
              stroke-width="1"
            />
            <text
              v-for="t in painTickValues"
              :key="`l-p-${t}`"
              :x="SVG_W - PAD_R + 6"
              :y="yPainFor(t) + 3"
              text-anchor="start"
              font-size="9"
              fill="#9e9aa8"
            >
              {{ t }}
            </text>
          </g>

          <g class="axis axis-bottom">
            <line
              :x1="PAD_L"
              :x2="SVG_W - PAD_R"
              :y1="SVG_H - PAD_B"
              :y2="SVG_H - PAD_B"
              :stroke="AXIS_COLOR"
              stroke-width="1"
            />
            <text
              v-for="(p, i) in trendPoints"
              :key="`x-${p.startDate}`"
              :x="xFor(i, trendPoints.length)"
              :y="SVG_H - PAD_B + 14"
              text-anchor="middle"
              font-size="9"
              fill="#9e9aa8"
            >
              {{ p.label }}
            </text>
          </g>

          <path
            v-if="stats && stats.cycleCount >= 2"
            :d="cycleLinePath"
            fill="none"
            :stroke="CYCLE_COLOR"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            v-if="stats && stats.painCount >= 2"
            :d="painLinePath"
            fill="none"
            :stroke="PAIN_COLOR"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-dasharray="4 3"
          />

          <g class="points">
            <g
              v-for="(p, i) in trendPoints"
              :key="`pt-${p.startDate}`"
              class="point-group"
              :title="hovered(p)"
            >
              <circle
                v-if="p.cycleLength !== null"
                :cx="xFor(i, trendPoints.length)"
                :cy="yCycleFor(p.cycleLength)"
                r="4.5"
                fill="white"
                :stroke="CYCLE_COLOR"
                stroke-width="2"
              />
              <circle
                :cx="xFor(i, trendPoints.length)"
                :cy="yPainFor(p.painScore)"
                r="3.5"
                fill="white"
                :stroke="PAIN_COLOR"
                stroke-width="1.8"
              />
            </g>
          </g>
        </svg>
      </div>

      <div v-if="stats" class="trend-summary">
        <div class="trend-row">
          <component :is="cycleTrendIcon" :size="14" :color="cycleTrendColor" />
          <span class="trend-label" :style="{ color: cycleTrendColor }">{{
            cycleTrendLabel
          }}</span>
          <span class="trend-desc">
            <template v-if="stats.recent3CycleAvg !== null">
              近期平均 {{ stats.recent3CycleAvg }} 天
              <template v-if="stats.older3CycleAvg !== null && stats.older3CycleAvg !== stats.recent3CycleAvg">
                vs 前期 {{ stats.older3CycleAvg }} 天
              </template>
            </template>
            <template v-else>
              需更多周期数据判断趋势
            </template>
          </span>
        </div>
        <div class="trend-row">
          <component :is="painTrendIcon" :size="14" :color="painTrendColor" />
          <span class="trend-label" :style="{ color: painTrendColor }">{{
            painTrendLabel
          }}</span>
          <span class="trend-desc">
            近期平均 {{ stats.recent3PainAvg }} 分
            <template v-if="stats.older3PainAvg !== stats.recent3PainAvg">
              vs 前期 {{ stats.older3PainAvg }} 分
            </template>
          </span>
        </div>
      </div>

      <div v-if="!hasEnoughCycleData && trendPoints.length > 0" class="hint-row">
        <AlertCircle :size="11" color="#9d4edd" />
        <span>再记录 1 次经期即可查看周期长度趋势连线</span>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.history-trend {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.summary-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.stat-card {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.stat-head {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  color: #6a6473;
}
.stat-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.stat-main {
  display: inline-flex;
  align-items: baseline;
  gap: 3px;
}
.stat-main .num {
  font-size: 26px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.5px;
}
.stat-main .unit {
  font-size: 12px;
  color: #9e9aa8;
  font-weight: 600;
}
.stat-sub {
  font-size: 11px;
  color: #9e9aa8;
  font-weight: 500;
}

.chart-card {
  padding: 14px 14px 16px;
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
.chart-legend {
  display: inline-flex;
  gap: 10px;
}
.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  color: #6a6473;
  font-weight: 600;
}
.legend-item .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.legend-item .dot.cycle {
  background: #ff6b9d;
  box-shadow: 0 0 0 2px rgba(255, 107, 157, 0.2);
}
.legend-item .dot.pain {
  background: #9d4edd;
  box-shadow: 0 0 0 2px rgba(157, 78, 221, 0.2);
}

.chart-wrap {
  width: 100%;
}
.trend-svg {
  width: 100%;
  height: auto;
  display: block;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28px 16px 20px;
  gap: 8px;
  text-align: center;
}
.empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(158, 154, 168, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
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
  max-width: 240px;
}

.trend-summary {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 6px;
  border-top: 1px dashed rgba(158, 154, 168, 0.2);
}
.trend-row {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #6a6473;
}
.trend-label {
  font-weight: 700;
  min-width: 58px;
}
.trend-desc {
  color: #9e9aa8;
  font-weight: 500;
}

.hint-row {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: #9d4edd;
  font-weight: 600;
  padding: 6px 10px;
  background: rgba(157, 78, 221, 0.08);
  border-radius: 8px;
}
</style>
