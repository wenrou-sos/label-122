<script setup lang="ts">
import { computed } from 'vue';
import { Zap } from 'lucide-vue-next';
import type { SymptomPhaseAnalysis } from '@/types';
import { SYMPTOM_META } from '@/constants';

const props = defineProps<{
  data: SymptomPhaseAnalysis[];
}>();

const SVG_W = 340;
const SVG_H = 260;
const PAD_L = 44;
const PAD_R = 16;
const PAD_T = 18;
const PAD_B = 44;
const PLOT_W = SVG_W - PAD_L - PAD_R;
const PLOT_H = SVG_H - PAD_T - PAD_B;

const GRID_COLOR = 'rgba(158, 154, 168, 0.15)';
const AXIS_COLOR = 'rgba(158, 154, 168, 0.5)';
const PRE_COLOR = '#F6A623';
const MEN_COLOR = '#E63946';
const POST_COLOR = '#4CC9F0';

const phaseColors: Record<string, string> = {
  premenstrual: PRE_COLOR,
  menstrual: MEN_COLOR,
  postmenstrual: POST_COLOR,
};

const xTickValues = [0, 25, 50, 75, 100];

const symptomBars = computed(() => {
  const n = props.data.length;
  if (n === 0) return [];
  const groupWidth = PLOT_W / n;
  const barWidth = Math.min(18, (groupWidth - 16) / 3);
  const gap = 3;

  return props.data.map((s, si) => {
    const meta = SYMPTOM_META.find((m) => m.key === s.symptomKey)!;
    const groupX = PAD_L + si * groupWidth + groupWidth / 2;
    return {
      symptomKey: s.symptomKey,
      symptomLabel: meta.label,
      symptomColor: meta.color,
      groupX,
      highestPhase: s.highestPhase,
      highestPhaseLabel: s.highestPhaseLabel,
      bars: s.phases.map((p, pi) => {
        const offset = (pi - 1) * (barWidth + gap);
        const h = (p.occurrenceRate / 100) * PLOT_H;
        return {
          phase: p.phase,
          phaseLabel: p.phaseLabel,
          x: groupX + offset - barWidth / 2,
          y: PAD_T + PLOT_H - h,
          width: barWidth,
          height: Math.max(2, h),
          color: phaseColors[p.phase],
          rate: p.occurrenceRate,
          avgSeverity: p.avgSeverity,
        };
      }),
    };
  });
});
</script>

<template>
  <div class="symptom-phase-chart">
    <div class="chart-head">
      <div class="chart-title">
        <Zap :size="14" color="#E63946" />
        <span>症状高发阶段</span>
      </div>
      <div class="chart-legend">
        <span class="legend-item"><i class="dot pre" />经前</span>
        <span class="legend-item"><i class="dot men" />经期</span>
        <span class="legend-item"><i class="dot post" />经后</span>
      </div>
    </div>

    <div class="chart-wrap">
      <svg :viewBox="`0 0 ${SVG_W} ${SVG_H}`" class="chart-svg">
        <g class="grid-lines">
          <line
            v-for="t in xTickValues"
            :key="`g-${t}`"
            :x1="PAD_L"
            :x2="SVG_W - PAD_R"
            :y1="PAD_T + PLOT_H - (t / 100) * PLOT_H"
            :y2="PAD_T + PLOT_H - (t / 100) * PLOT_H"
            :stroke="GRID_COLOR"
            stroke-width="1"
            stroke-dasharray="3 4"
          />
        </g>

        <g class="y-axis">
          <line :x1="PAD_L" :x2="PAD_L" :y1="PAD_T" :y2="SVG_H - PAD_B" :stroke="AXIS_COLOR" stroke-width="1" />
          <text
            v-for="t in xTickValues"
            :key="`yt-${t}`"
            :x="PAD_L - 6"
            :y="PAD_T + PLOT_H - (t / 100) * PLOT_H + 3"
            text-anchor="end"
            font-size="9"
            fill="#9e9aa8"
          >{{ t }}%</text>
        </g>

        <g class="x-axis">
          <line :x1="PAD_L" :x2="SVG_W - PAD_R" :y1="SVG_H - PAD_B" :y2="SVG_H - PAD_B" :stroke="AXIS_COLOR" stroke-width="1" />
        </g>

        <g class="bars">
          <g v-for="sb in symptomBars" :key="sb.symptomKey" class="symptom-group">
            <rect
              v-for="b in sb.bars"
              :key="`${sb.symptomKey}-${b.phase}`"
              :x="b.x"
              :y="b.y"
              :width="b.width"
              :height="b.height"
              :fill="b.color"
              :rx="3"
              opacity="0.85"
            />
            <text
              :x="sb.groupX"
              :y="SVG_H - PAD_B + 16"
              text-anchor="middle"
              font-size="11"
              :fill="sb.symptomColor"
              font-weight="600"
            >{{ sb.symptomLabel }}</text>
            <text
              v-if="sb.highestPhase !== 'unknown'"
              :x="sb.groupX"
              :y="SVG_H - PAD_B + 30"
              text-anchor="middle"
              font-size="9"
              fill="#9e9aa8"
            >高发: {{ sb.highestPhaseLabel }}</text>
          </g>
        </g>
      </svg>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.symptom-phase-chart {
  display: flex;
  flex-direction: column;
  gap: 10px;
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
  gap: 4px;
  font-size: 10px;
  color: #6a6473;
  font-weight: 600;
}
.legend-item .dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  display: inline-block;
}
.legend-item .dot.pre { background: #F6A623; }
.legend-item .dot.men { background: #E63946; }
.legend-item .dot.post { background: #4CC9F0; }
.chart-wrap {
  width: 100%;
}
.chart-svg {
  width: 100%;
  height: auto;
  display: block;
}
</style>
