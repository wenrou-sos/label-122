<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  ChevronLeft,
  Sparkles,
  Brain,
  AlertCircle,
  Info,
} from 'lucide-vue-next';
import SymptomPhaseChart from '@/components/SymptomPhaseChart.vue';
import TagCorrelationChart from '@/components/TagCorrelationChart.vue';
import SymptomTrendChart from '@/components/SymptomTrendChart.vue';
import { usePatternAnalysis } from '@/composables/usePatternAnalysis';

const router = useRouter();
const {
  symptomPhaseAnalysis,
  tagSymptomCorrelations,
  monthlySymptomTrends,
  hasEnoughData,
  hasCycleData,
  hasTagCorrelationData,
  MONTH_RANGE,
} = usePatternAnalysis();

const topInsights = computed(() => {
  const insights: { icon: string; text: string; type: 'tip' | 'warn' | 'info' }[] = [];

  if (hasCycleData.value) {
    const phaseAnalysis = symptomPhaseAnalysis.value;
    const cramp = phaseAnalysis.find((p) => p.symptomKey === 'cramp');
    if (cramp && cramp.highestPhase === 'menstrual') {
      insights.push({
        icon: '⚡',
        text: `痛经主要集中在经期，高发期为经期阶段`,
        type: 'info',
      });
    }
    const breast = phaseAnalysis.find((p) => p.symptomKey === 'breast');
    if (breast && breast.highestPhase === 'premenstrual') {
      insights.push({
        icon: '💖',
        text: `乳房胀痛高发于经前，属于典型经前综合征表现`,
        type: 'info',
      });
    }
    const mood = phaseAnalysis.find((p) => p.symptomKey === 'mood');
    if (mood && mood.highestPhase === 'premenstrual') {
      insights.push({
        icon: '🎭',
        text: `情绪波动多发生在经前，建议提前做好心理调节`,
        type: 'tip',
      });
    }
  }

  if (hasTagCorrelationData.value) {
    const strongPositives = tagSymptomCorrelations.value.filter(
      (c) => c.correlation === 'strong-positive' || c.correlation === 'positive',
    );
    if (strongPositives.length > 0) {
      const top = strongPositives[0];
      insights.push({
        icon: top.tagIcon,
        text: `${top.tagLabel}时${top.symptomLabel}评分较高（+${top.diff.toFixed(1)}分），建议适当调整`,
        type: 'warn',
      });
    }
    const strongNegatives = tagSymptomCorrelations.value.filter(
      (c) => c.correlation === 'strong-negative' || c.correlation === 'negative',
    );
    if (strongNegatives.length > 0) {
      const top = strongNegatives[0];
      insights.push({
        icon: top.tagIcon,
        text: `${top.tagLabel}时${top.symptomLabel}较轻（${top.diff.toFixed(1)}分），值得保持`,
        type: 'tip',
      });
    }
  }

  const worseningSymptoms = monthlySymptomTrends.value.filter(
    (s) => s.trend === 'worsening' && s.earlier3Avg > 0,
  );
  if (worseningSymptoms.length > 0) {
    const top = worseningSymptoms[0];
    insights.push({
      icon: top.symptomIcon,
      text: `近 ${Math.floor(MONTH_RANGE / 2)} 个月${top.symptomLabel}有加重趋势，建议关注`,
      type: 'warn',
    });
  }

  const improvingSymptoms = monthlySymptomTrends.value.filter(
    (s) => s.trend === 'improving' && s.earlier3Avg > 0,
  );
  if (improvingSymptoms.length > 0) {
    const top = improvingSymptoms[0];
    insights.push({
      icon: top.symptomIcon,
      text: `${top.symptomLabel}近 ${Math.floor(MONTH_RANGE / 2)} 个月有所好转，继续保持！`,
      type: 'tip',
    });
  }

  return insights.slice(0, 4);
});

const goBack = () => {
  router.push('/');
};
</script>

<template>
  <div class="patterns-page noise-bg">
    <header class="page-header">
      <button class="back-btn" @click="goBack">
        <ChevronLeft :size="24" stroke-width="2.4" color="#6a6473" />
      </button>
      <div class="header-center">
        <div class="page-title">我的规律</div>
        <div class="page-subtitle">
          <Brain :size="10" />
          <span>AI 数据分析 · 洞察身体信号</span>
        </div>
      </div>
      <div class="header-placeholder" />
    </header>

    <main class="page-body">
      <div class="content-stack">
        <section v-if="!hasEnoughData" class="intro-card glass-card">
          <div class="intro-icon">
            <Sparkles :size="28" color="#f64e8b" />
          </div>
          <div class="intro-title">用数据了解你的身体</div>
          <div class="intro-desc">
            持续记录经期、症状和生活习惯后，系统将自动分析：
          </div>
          <ul class="feature-list">
            <li><span class="feature-dot pre" />哪些症状在经前/经中/经后高发</li>
            <li><span class="feature-dot cor" />生活习惯与症状的关联（如吃辣→痛经？）</li>
            <li><span class="feature-dot trend" />近 {{ MONTH_RANGE }} 个月各项症状的变化趋势</li>
          </ul>
          <div class="intro-hint">
            <AlertCircle :size="12" />
            <span>记录 10 天以上数据即可查看初步分析</span>
          </div>
        </section>

        <template v-else>
          <section v-if="topInsights.length > 0" class="insights-section">
            <div class="section-title">
              <Sparkles :size="14" color="#f64e8b" />
              <span>个性化洞察</span>
            </div>
            <div class="insight-list">
              <div
                v-for="(ins, i) in topInsights"
                :key="i"
                class="insight-card glass-card"
                :class="{ 'insight-warn': ins.type === 'warn', 'insight-tip': ins.type === 'tip' }"
              >
                <span class="insight-icon">{{ ins.icon }}</span>
                <span class="insight-text">{{ ins.text }}</span>
              </div>
            </div>
          </section>

          <section v-if="hasCycleData" class="chart-card glass-card">
            <SymptomPhaseChart :data="symptomPhaseAnalysis" />
          </section>

          <section v-else class="chart-card glass-card hint-card">
            <div class="hint-icon">
              <Info :size="20" color="#9D4EDD" />
            </div>
            <div class="hint-content">
              <div class="hint-title">还需更多经期数据</div>
              <div class="hint-desc">至少记录 1 次完整经期，即可查看症状在不同阶段的高发规律</div>
            </div>
          </section>

          <section class="chart-card glass-card">
            <TagCorrelationChart :data="tagSymptomCorrelations" />
          </section>

          <section class="chart-card glass-card">
            <SymptomTrendChart :data="monthlySymptomTrends" />
          </section>

          <section class="disclaimer-card">
            <Info :size="12" color="#9e9aa8" />
            <span>以上分析基于您的历史记录自动生成，仅供参考，不作为医疗建议。如有疑问请咨询专业医生。</span>
          </section>
        </template>

        <div class="page-footer">
          <div class="footer-title">
            <Sparkles :size="12" />
            <span>经期助手</span>
          </div>
          <div class="footer-hint">科学记录 · 关爱自己 · 数据仅保存在本地</div>
        </div>
      </div>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.patterns-page {
  min-height: 100vh;
  position: relative;
}
.page-header {
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
.back-btn {
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
  }
}
.header-placeholder {
  width: 40px;
  height: 40px;
}
.header-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}
.page-title {
  font-size: 18px;
  font-weight: 700;
  color: #2d2d34;
  letter-spacing: 0.5px;
  line-height: 1.1;
}
.page-subtitle {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  background: linear-gradient(135deg, rgba(157, 78, 221, 0.15), rgba(157, 78, 221, 0.1));
  color: #9d4edd;
  font-size: 10px;
  font-weight: 600;
  border-radius: 999px;
}
.page-body {
  padding: 6px 20px calc(36px + var(--safe-bottom));
}
.content-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 480px;
  margin: 0 auto;
}
.intro-card {
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;
}
.intro-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffe4ec, #ffc9d9);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
  box-shadow: 0 4px 12px rgba(255, 107, 157, 0.2);
}
.intro-title {
  font-size: 17px;
  font-weight: 700;
  color: #2d2d34;
}
.intro-desc {
  font-size: 12px;
  color: #6a6473;
  line-height: 1.5;
}
.feature-list {
  list-style: none;
  padding: 0;
  margin: 6px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
  width: 100%;
}
.feature-list li {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #6a6473;
  font-weight: 500;
  text-align: left;
}
.feature-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
  &.pre { background: #F6A623; }
  &.cor { background: #9D4EDD; }
  &.trend { background: #FF6B9D; }
}
.intro-hint {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  padding: 6px 12px;
  background: rgba(157, 78, 221, 0.08);
  border-radius: 10px;
  font-size: 11px;
  color: #9d4edd;
  font-weight: 600;
}
.section-title {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  font-weight: 700;
  color: #2d2d34;
  padding: 0 4px;
}
.insights-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.insight-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.insight-card {
  padding: 12px 14px;
  display: inline-flex;
  align-items: flex-start;
  gap: 10px;
}
.insight-icon {
  font-size: 18px;
  flex-shrink: 0;
  line-height: 1.3;
}
.insight-text {
  font-size: 12px;
  color: #6a6473;
  font-weight: 500;
  line-height: 1.5;
  flex: 1;
}
.insight-card.insight-warn {
  background: linear-gradient(135deg, rgba(230, 57, 70, 0.06), rgba(246, 166, 35, 0.06));
  border-color: rgba(230, 57, 70, 0.15);
  .insight-text { color: #9b2c2c; }
}
.insight-card.insight-tip {
  background: linear-gradient(135deg, rgba(58, 197, 105, 0.06), rgba(76, 201, 240, 0.06));
  border-color: rgba(58, 197, 105, 0.15);
  .insight-text { color: #276749; }
}
.chart-card {
  padding: 16px 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 0;
}
.hint-card {
  padding: 20px 18px;
  flex-direction: row;
  align-items: center;
  gap: 14px;
}
.hint-icon {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: rgba(157, 78, 221, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}
.hint-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}
.hint-title {
  font-size: 13px;
  font-weight: 700;
  color: #2d2d34;
}
.hint-desc {
  font-size: 11px;
  color: #9e9aa8;
  line-height: 1.5;
}
.disclaimer-card {
  display: inline-flex;
  align-items: flex-start;
  gap: 6px;
  padding: 10px 14px;
  font-size: 10px;
  color: #9e9aa8;
  line-height: 1.5;
  font-weight: 500;
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
