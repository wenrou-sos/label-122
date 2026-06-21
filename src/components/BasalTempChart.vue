<script setup lang="ts">
import { computed } from 'vue';
import { Thermometer } from 'lucide-vue-next';
import { useOvulationDetection } from '@/composables/useOvulationDetection';
import { usePrediction } from '@/composables/usePrediction';
import { parseDate, addDays } from '@/utils/date';

const { currentCycleTemps, ovulationFromTemp } = useOvulationDetection();
const { prediction } = usePrediction();

const SVG_W = 340;
const SVG_H = 200;
const PAD_L = 40;
const PAD_R = 20;
const PAD_T = 20;
const PAD_B = 28;
const PLOT_W = SVG_W - PAD_L - PAD_R;
const PLOT_H = SVG_H - PAD_T - PAD_B;

const TEMP_COLOR = '#F72585';
const LOW_PHASE_COLOR = '#4CC9F0';
const COVERLINE_COLOR = 'rgba(247, 37, 133, 0.5)';
const GRID_COLOR = 'rgba(158, 154, 168, 0.15)';
const AXIS_COLOR = 'rgba(158, 154, 168, 0.5)';
const OVU_COLOR = '#9D4EDD';

const tempDomain = computed(() => {
  const temps = currentCycleTemps.value.map((t) => t.temp);
  if (temps.length === 0) return { min: 36.0, max: 37.5 };
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const pad = Math.max(0.2, (max - min) * 0.15);
  return {
    min: Math.floor((min - pad) * 10) / 10,
    max: Math.ceil((max + pad) * 10) / 10,
  };
});

const xFor = (idx: number, total: number) => {
  if (total <= 1) return PAD_L + PLOT_W / 2;
  return PAD_L + (idx / (total - 1)) * PLOT_W;
};

const yFor = (temp: number) => {
  const { min, max } = tempDomain.value;
  return PAD_T + PLOT_H - ((temp - min) / (max - min)) * PLOT_H;
};

const plotPoints = computed(() =>
  currentCycleTemps.value.map((t, i) => ({
    x: xFor(i, currentCycleTemps.value.length),
    y: yFor(t.temp),
    date: t.date,
    temp: t.temp,
  })),
);

const buildLinePath = (pts: { x: number; y: number }[]): string => {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${pts[i].x} ${pts[i].y}`;
  }
  return d;
};

const linePath = computed(() => buildLinePath(plotPoints.value));

const yTickValues = computed(() => {
  const { min, max } = tempDomain.value;
  const ticks: number[] = [];
  const step = 0.2;
  for (let t = Math.ceil(min * 10) / 10; t <= max; t = Math.round((t + step) * 10) / 10) {
    ticks.push(t);
  }
  return ticks;
});

const xLabels = computed(() => {
  const pts = currentCycleTemps.value;
  if (pts.length === 0) return [];
  const step = Math.max(1, Math.floor(pts.length / 6));
  return pts
    .filter((_, i) => i % step === 0 || i === pts.length - 1)
    .map((p, i, arr) => ({
      x: xFor(p === arr[0] ? 0 : p === arr[arr.length - 1] ? currentCycleTemps.value.length - 1 : (i * step),
        currentCycleTemps.value.length),
      label: (() => {
        const d = parseDate(p.date);
        return `${d.month() + 1}/${d.date()}`;
      })(),
    }));
});

const coverlineY = computed(() => {
  const c = ovulationFromTemp.value.coverline;
  if (c === null) return null;
  const { min, max } = tempDomain.value;
  if (c < min || c > max) return null;
  return yFor(c);
});

const ovulationMarker = computed(() => {
  const ovuDate = ovulationFromTemp.value.ovulationDate;
  if (!ovuDate) return null;
  const idx = currentCycleTemps.value.findIndex((t) => t.date === ovuDate);
  if (idx < 0) return null;
  return {
    x: xFor(idx, currentCycleTemps.value.length),
    y: yFor(currentCycleTemps.value[idx].temp),
    date: ovuDate,
  };
});

const predictedOvuMarker = computed(() => {
  const ovuDate = prediction.value.ovulationDay;
  const pts = currentCycleTemps.value;
  if (pts.length === 0) return null;
  const firstDate = parseDate(pts[0].date);
  const lastDate = parseDate(pts[pts.length - 1].date);
  const ovu = parseDate(ovuDate);
  if (ovu.isBefore(firstDate) || ovu.isAfter(lastDate.add(5, 'day'))) return null;
  const totalDays = pts.length - 1;
  const dayDiff = ovu.diff(firstDate, 'day');
  const ratio = Math.max(0, Math.min(1, dayDiff / totalDays));
  return {
    x: PAD_L + ratio * PLOT_W,
    date: ovuDate,
  };
});

const confidenceLabel = computed(() => {
  const c = ovulationFromTemp.value.confidence;
  switch (c) {
    case 'high':
      return '可信度高';
    case 'medium':
      return '可信度中';
    default:
      return '数据不足';
  }
});

const confidenceColor = computed(() => {
  const c = ovulationFromTemp.value.confidence;
  switch (c) {
    case 'high':
      return '#3ac569';
    case 'medium':
      return '#f5a623';
    default:
      return '#9e9aa8';
  }
});
</script>

<template>
  <div class="basal-temp-chart">
    <div class="chart-header">
      <div class="chart-title">
        <Thermometer :size="16" color="#F72585" />
        <span>基础体温曲线</span>
      </div>
      <div v-if="ovulationFromTemp.ovulationDate" class="ovu-badge" :style="{ color: confidenceColor }">
        <span class="badge-dot" :style="{ background: confidenceColor }" />
        {{ confidenceLabel }}
      </div>
    </div>

    <div v-if="currentCycleTemps.length < 3" class="empty-state">
      <div class="empty-icon">
        <Thermometer :size="32" color="#c0bcc8" />
      </div>
      <div class="empty-title">体温记录还不够</div>
      <div class="empty-desc">
        连续记录 6 天以上基础体温，可自动识别排卵日与双相体温
      </div>
    </div>

    <div v-else class="chart-wrap">
      <svg :viewBox="`0 0 ${SVG_W} ${SVG_H}`" class="temp-svg">
        <line
          v-for="(tick, i) in yTickValues"
          :key="`grid-h-${i}`"
          :x1="PAD_L"
          :x2="SVG_W - PAD_R"
          :y1="yFor(tick)"
          :y2="yFor(tick)"
          :stroke="GRID_COLOR"
          stroke-width="1"
        />

        <line
          v-if="coverlineY !== null"
          :x1="PAD_L"
          :x2="SVG_W - PAD_R"
          :y1="coverlineY"
          :y2="coverlineY"
          :stroke="COVERLINE_COLOR"
          stroke-width="1.5"
          stroke-dasharray="6 4"
        />

        <path
          v-if="plotPoints.length >= 2"
          :d="linePath"
          fill="none"
          :stroke="TEMP_COLOR"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        <g class="temp-points">
          <g
            v-for="(pt, i) in plotPoints"
            :key="`pt-${i}`"
            class="temp-point"
          >
            <circle
              :cx="pt.x"
              :cy="pt.y"
              r="3.5"
              fill="white"
              :stroke="TEMP_COLOR"
              stroke-width="1.5"
            />
          </g>
        </g>

        <g v-if="ovulationMarker" class="ovulation-marker">
          <circle
            :cx="ovulationMarker.x"
            :cy="ovulationMarker.y"
            r="8"
            fill="none"
            :stroke="OVU_COLOR"
            stroke-width="2"
          />
          <text
            :x="ovulationMarker.x"
            :y="yFor(tempDomain.min) - 6"
            text-anchor="middle"
            font-size="10"
            fill="currentColor"
            :style="{ color: OVU_COLOR }"
            font-weight="600"
          >
            排卵
          </text>
        </g>

        <g v-if="predictedOvuMarker && !ovulationMarker" class="predicted-ovu">
          <line
            :x1="predictedOvuMarker.x"
            :x2="predictedOvuMarker.x"
            :y1="PAD_T"
            :y2="SVG_H - PAD_B"
            stroke="#9D4EDD"
            stroke-width="1"
            stroke-dasharray="3 3"
            opacity="0.5"
          />
          <text
            :x="predictedOvuMarker.x"
            :y="PAD_T - 4"
            text-anchor="middle"
            font-size="9"
            fill="#9D4EDD"
            opacity="0.7"
          >
            预测排卵
          </text>
        </g>

        <g class="y-axis">
          <text
            v-for="(tick, i) in yTickValues"
            :key="`yt-${i}`"
            :x="PAD_L - 8"
            :y="yFor(tick) + 3"
            text-anchor="end"
            font-size="10"
            fill="#9e9aa8"
          >
            {{ tick.toFixed(1) }}
          </text>
        </g>

        <g class="x-axis">
          <text
            v-for="(lbl, i) in xLabels"
            :key="`xl-${i}`"
            :x="lbl.x"
            :y="SVG_H - PAD_B + 16"
            text-anchor="middle"
            font-size="9"
            fill="#9e9aa8"
          >
            {{ lbl.label }}
          </text>
        </g>

        <line
          :x1="PAD_L"
          :x2="PAD_L"
          :y1="PAD_T"
          :y2="SVG_H - PAD_B"
          :stroke="AXIS_COLOR"
          stroke-width="1"
        />
        <line
          :x1="PAD_L"
          :x2="SVG_W - PAD_R"
          :y1="SVG_H - PAD_B"
          :y2="SVG_H - PAD_B"
          :stroke="AXIS_COLOR"
          stroke-width="1"
        />
      </svg>
    </div>

    <div v-if="ovulationFromTemp.ovulationDate" class="temp-stats">
      <div class="stat-item">
        <div class="stat-value">{{ ovulationFromTemp.lowPhaseAvg?.toFixed(2) ?? '—' }}</div>
        <div class="stat-label">低温相平均</div>
      </div>
      <div class="stat-divider" />
      <div class="stat-item">
        <div class="stat-value temp-high">{{ ovulationFromTemp.highPhaseAvg?.toFixed(2) ?? '—' }}</div>
        <div class="stat-label">高温相平均</div>
      </div>
      <div class="stat-divider" />
      <div class="stat-item">
        <div class="stat-value ovu-color">+{{ ovulationFromTemp.tempShift?.toFixed(2) ?? '0.00' }}</div>
        <div class="stat-label">体温升高</div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.basal-temp-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
}
.chart-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #2d2d34;
}
.ovu-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 500;
}
.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 10px;
}
.empty-icon {
  opacity: 0.5;
  margin-bottom: 4px;
}
.empty-title {
  font-size: 15px;
  font-weight: 600;
  color: #6a6473;
}
.empty-desc {
  font-size: 12px;
  color: #9e9aa8;
  text-align: center;
  line-height: 1.5;
}

.chart-wrap {
  width: 100%;
}
.temp-svg {
  width: 100%;
  height: auto;
  display: block;
}

.temp-stats {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 14px 16px;
  background: linear-gradient(135deg, #fff5f8 0%, #faf5ff 100%);
  border-radius: 14px;
}
.stat-item {
  flex: 1;
  text-align: center;
}
.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #2d2d34;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;

  &.temp-high {
    color: #f72585;
  }
  &.ovu-color {
    color: #9d4edd;
  }
}
.stat-label {
  font-size: 11px;
  color: #9e9aa8;
  margin-top: 4px;
}
.stat-divider {
  width: 1px;
  height: 32px;
  background: rgba(158, 154, 168, 0.2);
}
</style>
