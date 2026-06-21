<script setup lang="ts">
import { Link2, TrendingUp, TrendingDown } from 'lucide-vue-next';
import type { TagSymptomCorrelation } from '@/types';

defineProps<{
  data: TagSymptomCorrelation[];
}>();

const correlationColor = (c: TagSymptomCorrelation['correlation']) => {
  switch (c) {
    case 'strong-positive': return '#E63946';
    case 'positive': return '#F6A623';
    case 'neutral': return '#9e9aa8';
    case 'negative': return '#4CC9F0';
    case 'strong-negative': return '#3ac569';
  }
};

const correlationLabel = (c: TagSymptomCorrelation['correlation']) => {
  switch (c) {
    case 'strong-positive': return '明显加重';
    case 'positive': return '可能加重';
    case 'neutral': return '无明显关联';
    case 'negative': return '可能缓解';
    case 'strong-negative': return '明显缓解';
  }
};
</script>

<template>
  <div class="tag-correlation-chart">
    <div class="chart-head">
      <div class="chart-title">
        <Link2 :size="14" color="#9D4EDD" />
        <span>生活习惯与症状关联</span>
      </div>
    </div>

    <div v-if="data.length === 0" class="empty-state">
      <div class="empty-icon"><Link2 :size="32" color="#c0bcc8" /></div>
      <div class="empty-title">暂无足够关联数据</div>
      <div class="empty-desc">多使用标签记录生活习惯（如饮食、运动、睡眠），系统将自动分析它们与症状的关联</div>
    </div>

    <div v-else class="correlation-list">
      <div v-for="item in data.slice(0, 8)" :key="`${item.tagId}-${item.symptomKey}`" class="correlation-card">
        <div class="tag-side">
          <span class="tag-icon">{{ item.tagIcon }}</span>
          <span class="tag-label">{{ item.tagLabel }}</span>
        </div>
        <div class="arrow">
          <TrendingUp v-if="item.diff > 0" :size="16" :color="correlationColor(item.correlation)" />
          <TrendingDown v-else :size="16" :color="correlationColor(item.correlation)" />
        </div>
        <div class="symptom-side">
          <span class="symptom-label">{{ item.symptomLabel }}</span>
          <span class="correlation-tag" :style="{ background: correlationColor(item.correlation) + '20', color: correlationColor(item.correlation) }">
            {{ correlationLabel(item.correlation) }}
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-item">有此习惯: <b>{{ item.withTagAvg.toFixed(1) }}</b>分</span>
          <span class="detail-item">无此习惯: <b>{{ item.withoutTagAvg.toFixed(1) }}</b>分</span>
          <span class="diff-item" :style="{ color: correlationColor(item.correlation) }">
            {{ item.diff > 0 ? '+' : '' }}{{ item.diff.toFixed(1) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.tag-correlation-chart {
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
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px 20px;
  gap: 8px;
  text-align: center;
}
.empty-icon {
  opacity: 0.5;
  margin-bottom: 4px;
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
  max-width: 260px;
}
.correlation-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.correlation-card {
  padding: 12px 14px;
  background: rgba(157, 78, 221, 0.05);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.tag-side,
.symptom-side {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.tag-icon {
  font-size: 16px;
}
.tag-label {
  font-size: 12px;
  font-weight: 600;
  color: #2d2d34;
}
.symptom-label {
  font-size: 12px;
  font-weight: 600;
  color: #6a6473;
}
.correlation-tag {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
}
.arrow {
  display: flex;
  justify-content: center;
}
.detail-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-top: 6px;
  border-top: 1px dashed rgba(158, 154, 168, 0.15);
  flex-wrap: wrap;
}
.detail-item {
  font-size: 10px;
  color: #9e9aa8;
  font-weight: 500;
}
.detail-item b {
  color: #6a6473;
  font-weight: 700;
}
.diff-item {
  margin-left: auto;
  font-size: 12px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
</style>
