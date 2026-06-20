<script setup lang="ts">
import { computed } from 'vue';
import { Droplets, CalendarRange, Activity, TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-vue-next';
import type { MonthStats } from '@/types';
import { usePrediction } from '@/composables/usePrediction';
import { parseDate, diffDays, todayStr } from '@/utils/date';

const props = defineProps<{
  stats: MonthStats;
}>();

const { prediction } = usePrediction();

const cards = computed(() => {
  const period = buildCard({
    title: '经期持续',
    value: props.stats.periodDays,
    unit: '天',
    icon: 'droplet',
    gradient: 'period',
    change: props.stats.periodChange,
    changeLabel:
      props.stats.prevPeriodDays > 0
        ? `上月 ${props.stats.prevPeriodDays} 天`
        : '首次记录',
  });

  const cycle = buildCard({
    title: '平均周期',
    value: props.stats.avgCycleLength,
    unit: '天',
    icon: 'calendar',
    gradient: 'cycle',
    change: props.stats.cycleRegularity === 'improved' ? 999 : props.stats.cycleRegularity === 'stable' ? 0 : -999,
    changeLabel:
      props.stats.cycleRegularity === 'improved'
        ? '周期规律度提升'
        : props.stats.cycleRegularity === 'stable'
          ? '周期稳定'
          : '周期波动较大',
    hideArrow: true,
  });

  const daysToNext = Math.max(0, diffDays(todayStr(), prediction.value.nextPeriodStart));
  const pain = buildCard({
    title: '痛经平均',
    value: props.stats.avgPainScore,
    unit: '分',
    icon: 'activity',
    gradient: 'pain',
    change: -props.stats.painChange,
    changeLabel:
      props.stats.painChange === 0
        ? `距离下次约 ${daysToNext} 天`
        : props.stats.painChange < 0
          ? `痛经下降 ${Math.abs(props.stats.painChange)}%`
          : `痛经上升 ${props.stats.painChange}%`,
  });

  return [period, cycle, pain];
});

type CardColor = 'period' | 'cycle' | 'pain';

function buildCard(opt: {
  title: string;
  value: number;
  unit: string;
  icon: 'droplet' | 'calendar' | 'activity';
  gradient: CardColor;
  change: number;
  changeLabel: string;
  hideArrow?: boolean;
}) {
  const trend: 'up' | 'down' | 'flat' =
    opt.change > 0 ? 'up' : opt.change < 0 ? 'down' : 'flat';
  return {
    ...opt,
    trend,
    showPositiveAsGood: opt.gradient === 'pain' ? false : true,
  };
}

const trendColor = (trend: 'up' | 'down' | 'flat', isPain: boolean) => {
  if (trend === 'flat') return '#9e9aa8';
  if (isPain) return trend === 'down' ? '#10b981' : '#e63946';
  return trend === 'up' ? '#e63946' : '#f64e8b';
};
</script>

<template>
  <div class="month-overview">
    <div class="overview-head">
      <div class="head-title">
        <Sparkles :size="16" color="#f64e8b" />
        <span>本月健康总览</span>
      </div>
      <div class="head-sub">基于历史记录智能分析</div>
    </div>
    <div class="cards-scroll">
      <div class="cards-track">
        <div
          v-for="(card, idx) in cards"
          :key="idx"
          class="stat-card"
          :class="card.gradient"
        >
          <div class="card-bg" />
          <div class="card-content">
            <div class="card-top">
              <div class="card-icon">
                <Droplets v-if="card.icon === 'droplet'" :size="16" />
                <CalendarRange v-else-if="card.icon === 'calendar'" :size="16" />
                <Activity v-else :size="16" />
              </div>
              <div
                v-if="!card.hideArrow && card.change !== 0"
                class="card-trend"
                :style="{ color: trendColor(card.trend, card.gradient === 'pain') }"
              >
                <TrendingUp v-if="card.trend === 'up'" :size="14" />
                <TrendingDown v-else-if="card.trend === 'down'" :size="14" />
                <Minus v-else :size="14" />
              </div>
            </div>
            <div class="card-value">
              <span class="value-num">{{ card.value }}</span>
              <span class="value-unit">{{ card.unit }}</span>
            </div>
            <div class="card-title">{{ card.title }}</div>
            <div class="card-change">{{ card.changeLabel }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.month-overview {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.overview-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 0 6px;
}
.head-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 700;
  color: #2d2d34;
}
.head-sub {
  font-size: 11px;
  color: #9e9aa8;
}
.cards-scroll {
  overflow-x: auto;
  margin: 0 -20px;
  padding: 6px 20px 10px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.cards-track {
  display: flex;
  gap: 12px;
  padding-right: 4px;
}
.stat-card {
  position: relative;
  flex: 0 0 156px;
  height: 148px;
  border-radius: 22px;
  padding: 14px;
  overflow: hidden;
  color: #2d2d34;
  display: flex;
  flex-direction: column;
  box-shadow: 0 6px 20px rgba(255, 107, 157, 0.12);
  transition: transform 0.2s ease;

  &:active {
    transform: scale(0.98);
  }

  &.period {
    background: linear-gradient(135deg, #ffe4ec 0%, #ffc9d9 100%);
    color: #9e1b32;
    .card-icon {
      background: rgba(255, 255, 255, 0.6);
      color: #e63946;
    }
    .value-num {
      color: #c41e3a;
    }
  }
  &.cycle {
    background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
    color: #075985;
    .card-icon {
      background: rgba(255, 255, 255, 0.6);
      color: #0369a1;
    }
    .value-num {
      color: #0369a1;
    }
  }
  &.pain {
    background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
    color: #6b21a8;
    .card-icon {
      background: rgba(255, 255, 255, 0.6);
      color: #9d4edd;
    }
    .value-num {
      color: #7e22ce;
    }
  }
}
.card-bg {
  position: absolute;
  right: -30px;
  bottom: -30px;
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background: radial-gradient(
    circle at center,
    rgba(255, 255, 255, 0.5) 0%,
    transparent 70%
  );
  pointer-events: none;
}
.card-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  height: 100%;
}
.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.card-icon {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}
.card-trend {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.55);
}
.card-value {
  margin-top: auto;
  display: flex;
  align-items: baseline;
  gap: 2px;
}
.value-num {
  font-size: 32px;
  font-weight: 800;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.value-unit {
  font-size: 13px;
  font-weight: 600;
  opacity: 0.85;
}
.card-title {
  font-size: 12px;
  font-weight: 600;
  margin-top: 4px;
  opacity: 0.9;
}
.card-change {
  margin-top: 3px;
  font-size: 10px;
  opacity: 0.75;
  font-weight: 500;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}
</style>
