<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Flame,
  Thermometer,
  Target,
  LineChart,
  Brain,
} from 'lucide-vue-next';
import type { ViewMode } from '@/types';

const router = useRouter();

const props = defineProps<{
  year: number;
  month: number;
  viewMode: ViewMode;
}>();

const emit = defineEmits<{
  (e: 'prev'): void;
  (e: 'next'): void;
  (e: 'today'): void;
  (e: 'change-view', mode: ViewMode): void;
}>();

const monthLabel = computed(() => `${props.year}年${props.month + 1}月`);
const isTrendMode = computed(() => props.viewMode === 'trend');
const isTempMode = computed(() => props.viewMode === 'temp');
const isCalendarMode = computed(
  () => props.viewMode === 'calendar' || props.viewMode === 'heatmap',
);

</script>

<template>
  <header class="app-header">
    <div class="header-left">
      <button v-if="isCalendarMode" class="nav-btn" @click="emit('prev')">
        <ChevronLeft :size="24" stroke-width="2.4" color="#6a6473" />
      </button>
      <div v-else class="nav-btn-placeholder" />
    </div>

    <div v-if="isCalendarMode" class="header-center" @click="emit('today')">
      <div class="month-label">{{ monthLabel }}</div>
      <div class="today-tag">
        <Target :size="10" />
        <span>回到今天</span>
      </div>
    </div>
    <div v-else-if="isTrendMode" class="header-center">
      <div class="month-label">历史趋势</div>
      <div class="today-tag trend-tag">
        <LineChart :size="10" />
        <span>周期规律分析</span>
      </div>
    </div>
    <div v-else class="header-center">
      <div class="month-label">基础体温</div>
      <div class="today-tag temp-tag">
        <Thermometer :size="10" />
        <span>排卵精准识别</span>
      </div>
    </div>

    <div class="header-right">
      <div class="view-switch">
        <button
          class="view-btn"
          :class="{ active: viewMode === 'calendar' }"
          @click="emit('change-view', 'calendar')"
          title="日历视图"
        >
          <CalendarIcon :size="17" />
        </button>
        <button
          class="view-btn"
          :class="{ active: viewMode === 'heatmap' }"
          @click="emit('change-view', 'heatmap')"
          title="症状热力图"
        >
          <Flame :size="17" />
        </button>
        <button
          class="view-btn"
          :class="{ active: viewMode === 'temp' }"
          @click="emit('change-view', 'temp')"
          title="基础体温"
        >
          <Thermometer :size="17" />
        </button>
        <button
          class="view-btn"
          :class="{ active: viewMode === 'trend' }"
          @click="emit('change-view', 'trend')"
          title="历史趋势"
        >
          <LineChart :size="17" />
        </button>
      </div>
      <button
        class="patterns-btn"
        @click="router.push('/patterns')"
        title="我的规律"
      >
        <Brain :size="16" />
      </button>
      <button v-if="isCalendarMode" class="nav-btn" @click="emit('next')">
        <ChevronRight :size="24" stroke-width="2.4" color="#6a6473" />
      </button>
      <div v-else class="nav-btn-placeholder" />
    </div>
  </header>
</template>

<style lang="scss" scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(14px + var(--safe-top)) 14px 14px;
  gap: 10px;
  position: sticky;
  top: 0;
  z-index: 30;
  background: linear-gradient(
    180deg,
    rgba(255, 245, 247, 0.95) 0%,
    rgba(255, 245, 247, 0.8) 100%
  );
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}
.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 6px;
}
.nav-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.7);
  box-shadow: 0 2px 8px rgba(255, 107, 157, 0.08);
  transition: all 0.15s ease;

  &:active {
    transform: scale(0.92);
    background: rgba(255, 255, 255, 1);
  }
}
.nav-btn-placeholder {
  width: 40px;
  height: 40px;
}
.header-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  cursor: pointer;
  padding: 4px 10px;
  border-radius: 14px;
  transition: all 0.2s ease;

  &:active {
    background: rgba(255, 107, 157, 0.08);
    transform: scale(0.98);
  }
}
.month-label {
  font-size: 18px;
  font-weight: 700;
  color: #2d2d34;
  letter-spacing: 0.5px;
  line-height: 1.1;
}
.today-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  background: linear-gradient(135deg, rgba(255, 107, 157, 0.15), rgba(246, 78, 139, 0.12));
  color: #f64e8b;
  font-size: 10px;
  font-weight: 600;
  border-radius: 999px;
}
.temp-tag {
  background: linear-gradient(135deg, rgba(247, 37, 133, 0.15), rgba(247, 37, 133, 0.1));
  color: #f72585;
}
.view-switch {
  display: inline-flex;
  padding: 3px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 999px;
  box-shadow: 0 2px 8px rgba(255, 107, 157, 0.08);
  margin-right: 4px;
}
.view-btn {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9e9aa8;
  transition: all 0.2s ease;

  &:active {
    transform: scale(0.9);
  }

  &.active {
    background: linear-gradient(135deg, #ff6b9d 0%, #f64e8b 100%);
    color: white;
    box-shadow: 0 2px 8px rgba(255, 107, 157, 0.35);
  }
}
.patterns-btn {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  background: linear-gradient(135deg, #9D4EDD 0%, #7B2CBF 100%);
  box-shadow: 0 2px 8px rgba(157, 78, 221, 0.35);
  margin-right: 4px;
  transition: all 0.2s ease;

  &:active {
    transform: scale(0.9);
  }
}
</style>
