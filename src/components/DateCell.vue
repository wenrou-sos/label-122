<script setup lang="ts">
import { computed } from 'vue';
import type { CalendarCellWithMarkers } from '@/composables/useCalendar';
import { getFlowColor } from '@/utils/color';

const props = defineProps<{
  cell: CalendarCellWithMarkers;
  showHeatmap?: boolean;
  heatColor?: string;
  heatTextColor?: string;
}>();

const emit = defineEmits<{
  (e: 'click'): void;
}>();

const m = computed(() => props.cell.markers);

const flowStyle = computed(() => ({
  background: getFlowColor(m.value.flowLevel),
}));
</script>

<template>
  <div
    class="date-cell"
    :class="{
      'is-current': cell.isCurrentMonth,
      'is-today': cell.isToday,
      'is-future': cell.isFuture,
      'is-weekend': cell.weekday === 0 || cell.weekday === 6,
      'has-ovu-window': m.isOvulationWindow && !m.isOvulationDay,
      'has-predicted-period': m.isPredictedPeriod,
      'predicted-start': m.isPredictedPeriodStart,
      'error-edge': m.isPeriodErrorEdge,
      heatmap: showHeatmap,
    }"
    :style="
      showHeatmap
        ? {
            background: heatColor ?? 'transparent',
            color: heatTextColor ?? undefined,
          }
        : undefined
    "
    @click="emit('click')"
  >
    <div class="cell-bg-layer">
      <div v-if="m.isPredictedPeriod && !showHeatmap" class="pred-period-bg" />
      <div v-if="m.isOvulationWindow && !showHeatmap" class="ovu-window-bg" />
    </div>

    <div class="cell-content">
      <div class="cell-day" :class="{ 'today-ring': cell.isToday && !showHeatmap }">
        {{ cell.day }}
      </div>

      <div v-if="!showHeatmap" class="cell-markers">
        <div class="markers-row">
          <div
            v-if="m.flowLevel > 0"
            class="period-dot"
            :style="flowStyle"
            :class="{ strong: m.flowLevel >= 3 }"
          />
          <div
            v-else-if="m.isPredictedPeriodStart"
            class="predicted-period-dot"
          />
          <div
            v-else-if="m.isOvulationDay"
            class="ovulation-dot"
          />
        </div>
        <div class="markers-bottom">
          <div v-if="m.hasRecord" class="record-dot" />
        </div>
      </div>

      <div v-if="showHeatmap && m.symptomTotalScore > 0" class="heat-score">
        {{ m.symptomTotalScore }}
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.date-cell {
  position: relative;
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;

  &:active {
    transform: scale(0.95);
  }

  &.is-future {
    opacity: 0.45;
  }

  &:not(.is-current) {
    opacity: 0.28;
    pointer-events: none;
  }

  &.is-weekend:not(.heatmap) {
    background: rgba(255, 107, 157, 0.04);
  }

  &.has-ovu-window {
    background: rgba(76, 201, 240, 0.08);
  }

  &.predicted-start {
    background: rgba(230, 57, 70, 0.1);
    border: 1.5px dashed rgba(230, 57, 70, 0.4);
  }

  &.heatmap {
    color: #2d2d34;
    border-radius: 12px;
    margin: 2px;
  }
}

.cell-bg-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.pred-period-bg {
  position: absolute;
  inset: 4px;
  border-radius: 10px;
  background: repeating-linear-gradient(
    45deg,
    rgba(230, 57, 70, 0.06),
    rgba(230, 57, 70, 0.06) 4px,
    transparent 4px,
    transparent 8px
  );
}

.ovu-window-bg {
  position: absolute;
  inset: 3px;
  border-radius: 10px;
  border: 1.5px dashed rgba(76, 201, 240, 0.5);
}

.cell-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 6px 0;
  gap: 2px;
}

.cell-day {
  font-size: 14px;
  font-weight: 500;
  line-height: 1;
  padding-top: 4px;

  .is-today & {
    font-weight: 700;
  }
}

.today-ring {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff6b9d 0%, #f64e8b 100%);
  color: white;
  padding-top: 0;
  box-shadow: 0 3px 10px rgba(255, 107, 157, 0.4);
}

.cell-markers {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  width: 100%;
}

.markers-row {
  height: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.period-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(230, 57, 70, 0.35);

  &.strong {
    width: 11px;
    height: 11px;
    box-shadow: 0 2px 6px rgba(230, 57, 70, 0.5);
  }
}

.ovulation-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #4cc9f0;
  box-shadow: 0 0 0 3px rgba(76, 201, 240, 0.25),
    0 1px 4px rgba(67, 97, 238, 0.4);
}

.predicted-period-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  border: 2px solid #e63946;
  background: white;
  opacity: 0.75;
}

.markers-bottom {
  height: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.record-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #9d4edd;
  box-shadow: 0 0 4px rgba(157, 78, 221, 0.5);
}

.heat-score {
  font-size: 9px;
  font-weight: 600;
  opacity: 0.85;
  line-height: 1;
  padding-bottom: 4px;
  font-variant-numeric: tabular-nums;
}
</style>
