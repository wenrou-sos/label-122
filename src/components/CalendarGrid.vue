<script setup lang="ts">
import { computed } from 'vue';
import DateCell from '@/components/DateCell.vue';
import type { CalendarCellWithMarkers } from '@/composables/useCalendar';
import { WEEKDAYS_CN } from '@/constants';

const emit = defineEmits<{
  (e: 'select', date: string): void;
}>();

const weekdays = computed(() => WEEKDAYS_CN);

const props = defineProps<{
  cells: CalendarCellWithMarkers[];
}>();

const rows = computed(() => {
  const r: CalendarCellWithMarkers[][] = [];
  for (let i = 0; i < 6; i++) {
    r.push(props.cells.slice(i * 7, (i + 1) * 7));
  }
  return r;
});
</script>

<template>
  <div class="calendar-grid">
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
          v-for="cell in row"
          :key="cell.date"
          :cell="cell"
          @click="emit('select', cell.date)"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.calendar-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 6px;
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
  padding: 4px 0;
}
.weekday-item {
  text-align: center;
  font-size: 12px;
  color: #9e9aa8;
  font-weight: 500;
  padding: 6px 0;

  &.weekend {
    color: #ff9dbb;
  }
}
.weeks {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.week-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}
</style>
