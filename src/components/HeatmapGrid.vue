<script setup lang="ts">
import { computed } from 'vue';
import DateCell from '@/components/DateCell.vue';
import type { CalendarCellWithMarkers } from '@/composables/useCalendar';
import { WEEKDAYS_CN } from '@/constants';
import {
  symptomScoreToHeatColor,
  getHeatTextColor,
} from '@/utils/color';

const emit = defineEmits<{
  (e: 'select', date: string): void;
}>();

const weekdays = computed(() => WEEKDAYS_CN);

const props = defineProps<{
  cells: CalendarCellWithMarkers[];
}>();

const rows = computed(() => {
  const r: {
    cell: CalendarCellWithMarkers;
    bg: string;
    text: string;
  }[][] = [];
  for (let i = 0; i < 6; i++) {
    const slice = props.cells.slice(i * 7, (i + 1) * 7);
    r.push(
      slice.map((c) => ({
        cell: c,
        bg: c.isCurrentMonth
          ? symptomScoreToHeatColor(c.markers.symptomTotalScore)
          : 'rgba(200, 200, 210, 0.12)',
        text: c.isCurrentMonth
          ? getHeatTextColor(c.markers.symptomTotalScore)
          : '#c0bcc8',
      })),
    );
  }
  return r;
});

const legendItems = computed(() => [
  { label: '无症状', score: 0 },
  { label: '轻微', score: 12 },
  { label: '中度', score: 25 },
  { label: '较重', score: 38 },
  { label: '严重', score: 50 },
]);
</script>

<template>
  <div class="heatmap-grid">
    <div class="weekdays">
      <div
        v-for="(w, idx) in weekdays"
        :key="w"
        class="weekday-item"
        :class="{ weekend: idx === 0 || idx === 6 }"
      >
        {{ w }}
      </div>
    </div>
    <div class="weeks">
      <div v-for="(row, rowIdx) in rows" :key="rowIdx" class="week-row">
        <DateCell
          v-for="item in row"
          :key="item.cell.date"
          :cell="item.cell"
          :show-heatmap="true"
          :heat-color="item.bg"
          :heat-text-color="item.text"
          @click="emit('select', item.cell.date)"
        />
      </div>
    </div>

    <div class="legend">
      <div class="legend-label">症状程度</div>
      <div class="legend-strip">
        <div
          v-for="(l, i) in legendItems"
          :key="i"
          class="legend-cell"
          :style="{
            background: symptomScoreToHeatColor(l.score),
            color: getHeatTextColor(l.score),
          }"
        >
          <span class="legend-text">{{ l.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.heatmap-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.55);
  border-radius: 24px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.7);
  box-shadow: 0 4px 24px rgba(255, 107, 157, 0.08);
}
.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}
.weekday-item {
  text-align: center;
  font-size: 12px;
  color: #9e9aa8;
  font-weight: 500;
  padding: 4px 0;

  &.weekend {
    color: #ff9dbb;
  }
}
.weeks {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.week-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0;
}
.legend {
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.legend-label {
  font-size: 11px;
  font-weight: 600;
  color: #6a6473;
}
.legend-strip {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
  border-radius: 10px;
  overflow: hidden;
}
.legend-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 2px;
}
.legend-text {
  font-size: 10px;
  font-weight: 600;
  opacity: 0.9;
}
</style>
