<script setup lang="ts">
import { ref, computed } from 'vue';
import { Droplets, Wind, Sparkles, AlertCircle } from 'lucide-vue-next';
import AppHeader from '@/components/AppHeader.vue';
import MonthOverview from '@/components/MonthOverview.vue';
import CalendarGrid from '@/components/CalendarGrid.vue';
import HeatmapGrid from '@/components/HeatmapGrid.vue';
import DateDetailModal from '@/components/DateDetailModal.vue';
import { usePeriodStore } from '@/stores/period';
import { useCalendar } from '@/composables/useCalendar';
import { usePrediction } from '@/composables/usePrediction';
import type { ViewMode } from '@/types';
import { parseDate, todayStr } from '@/utils/date';

const store = usePeriodStore();
const { prediction } = usePrediction();

const today = parseDate(todayStr());
const currentYear = ref(today.year());
const currentMonth = ref(today.month());

const viewMode = ref<ViewMode>('calendar');
const selectedDate = ref('');
const modalVisible = ref(false);
const viewTransitionKey = ref(0);

const { cells, monthStats } = useCalendar(
  () => currentYear.value,
  () => currentMonth.value,
);

const handlePrev = () => {
  viewTransitionKey.value++;
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
};

const handleNext = () => {
  viewTransitionKey.value++;
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
};

const handleToday = () => {
  viewTransitionKey.value++;
  currentYear.value = today.year();
  currentMonth.value = today.month();
};

const handleSelectDate = (date: string) => {
  selectedDate.value = date;
  modalVisible.value = true;
};

const changeView = (mode: ViewMode) => {
  if (mode === viewMode.value) return;
  viewTransitionKey.value++;
  viewMode.value = mode;
};

const predictionCard = computed(() => {
  const p = prediction.value;
  const d1 = parseDate(p.ovulationStart);
  const d2 = parseDate(p.ovulationEnd);
  const daysToNext = Math.max(0, Math.abs(parseDate(todayStr()).diff(parseDate(p.nextPeriodStart), 'day')));
  const isBefore = parseDate(todayStr()).isBefore(parseDate(p.nextPeriodStart), 'day');
  return {
    ovulation: `${d1.month() + 1}/${d1.date()} - ${d2.month() + 1}/${d2.date()}`,
    next: `${parseDate(p.nextPeriodStart).month() + 1}/${parseDate(p.nextPeriodStart).date()}`,
    daysToNext,
    isBefore,
  };
});
</script>

<template>
  <div class="home-page noise-bg">
    <AppHeader
      :year="currentYear"
      :month="currentMonth"
      :view-mode="viewMode"
      @prev="handlePrev"
      @next="handleNext"
      @today="handleToday"
      @change-view="changeView"
    />

    <main class="page-body">
      <div class="content-stack">
        <MonthOverview :stats="monthStats" />

        <div class="prediction-tip glass-card">
          <div class="tip-left">
            <div class="tip-icon">
              <Sparkles :size="18" color="#f64e8b" />
            </div>
            <div class="tip-content">
              <div class="tip-title">周期预测</div>
              <div class="tip-detail">
                <span class="pred-item">
                  <Droplets :size="11" color="#e63946" />
                  下次经期约 <b>{{ predictionCard.next }}</b>
                  <template v-if="predictionCard.isBefore">
                    （还有 {{ predictionCard.daysToNext }} 天）
                  </template>
                </span>
                <span class="pred-item">
                  <Wind :size="11" color="#4361ee" />
                  排卵期 {{ predictionCard.ovulation }}
                </span>
              </div>
            </div>
          </div>
          <div class="tip-note">
            <AlertCircle :size="12" />
            <span>预测仅供参考</span>
          </div>
        </div>

        <Transition
          :name="viewMode === 'calendar' ? 'slide-right' : 'slide-left'"
          mode="out-in"
        >
          <CalendarGrid
            v-if="viewMode === 'calendar'"
            :key="'cal-' + viewTransitionKey"
            :cells="cells"
            @select="handleSelectDate"
          />
          <HeatmapGrid
            v-else
            :key="'heat-' + viewTransitionKey"
            :cells="cells"
            @select="handleSelectDate"
          />
        </Transition>

        <div class="legend-card glass-card">
          <div class="legend-title">图例说明</div>
          <div class="legend-grid">
            <div class="legend-entry">
              <span class="legend-dot flow-dot" style="background:#e63946;opacity:0.9" />
              <span>经期日</span>
            </div>
            <div class="legend-entry">
              <span class="legend-dot ovu-dot" />
              <span>排卵日</span>
            </div>
            <div class="legend-entry">
              <span class="legend-dot record-dot" />
              <span>有记录</span>
            </div>
            <div class="legend-entry">
              <span class="legend-dash" />
              <span>预测误差区</span>
            </div>
          </div>
        </div>

        <div class="page-footer">
          <div class="footer-title">
            <Sparkles :size="12" />
            <span>经期助手</span>
          </div>
          <div class="footer-hint">科学记录 · 关爱自己 · 数据仅保存在本地</div>
        </div>
      </div>
    </main>

    <DateDetailModal
      v-model:visible="modalVisible"
      :date="selectedDate"
      @saved="viewTransitionKey++"
      @cleared="viewTransitionKey++"
    />
  </div>
</template>

<style lang="scss" scoped>
.home-page {
  min-height: 100vh;
  position: relative;
}

.page-body {
  padding: 6px 20px calc(36px + var(--safe-bottom));
}

.content-stack {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 480px;
  margin: 0 auto;
}

.prediction-tip {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 16px;
}
.tip-left {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
  min-width: 0;
}
.tip-icon {
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: linear-gradient(135deg, #ffe4ec, #ffc9d9);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(255, 107, 157, 0.18);
}
.tip-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.tip-title {
  font-size: 13px;
  font-weight: 700;
  color: #2d2d34;
}
.tip-detail {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.pred-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #6a6473;

  b {
    color: #f64e8b;
    font-weight: 700;
  }
}
.tip-note {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 4px 8px;
  border-radius: 8px;
  background: rgba(157, 78, 221, 0.08);
  color: #9d4edd;
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
}

.slide-right-enter-active,
.slide-right-leave-active,
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-16px);
}
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(16px);
}
.slide-left-enter-from {
  opacity: 0;
  transform: translateX(16px);
}
.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-16px);
}

.legend-card {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.legend-title {
  font-size: 12px;
  font-weight: 700;
  color: #2d2d34;
}
.legend-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px 18px;
}
.legend-entry {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #6a6473;
  font-weight: 500;
}
.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}
.flow-dot {
  box-shadow: 0 1px 3px rgba(230, 57, 70, 0.35);
}
.ovu-dot {
  background: #4cc9f0;
  box-shadow: 0 0 0 2px rgba(76, 201, 240, 0.25);
}
.record-dot {
  width: 6px;
  height: 6px;
  background: #9d4edd;
}
.legend-dash {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  border: 1.5px dashed #e63946;
  background: rgba(230, 57, 70, 0.06);
  flex-shrink: 0;
}

.page-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding-top: 8px;
}
.footer-title {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 700;
  color: #ff6b9d;
}
.footer-hint {
  font-size: 10px;
  color: #c0bcc8;
}
</style>
