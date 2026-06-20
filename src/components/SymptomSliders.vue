<script setup lang="ts">
import { computed } from 'vue';
import { Slider } from 'vant';
import type { Symptoms } from '@/types';
import { SYMPTOM_META } from '@/constants';

const props = defineProps<{
  modelValue: Symptoms;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: Symptoms): void;
}>();

const metaList = computed(() => SYMPTOM_META);

const update = (key: keyof Symptoms, value: number) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value,
  });
};
</script>

<template>
  <div class="symptom-sliders">
    <div
      v-for="meta in metaList"
      :key="meta.key"
      class="symptom-item"
    >
      <div class="symptom-head">
        <div class="symptom-title">
          <span class="symptom-icon">{{ meta.icon }}</span>
          <span class="symptom-label">{{ meta.label }}</span>
        </div>
        <div
          class="symptom-score"
          :class="{ highlight: modelValue[meta.key] >= 7 }"
        >
          {{ modelValue[meta.key] }}
          <span class="symptom-score-unit">分</span>
        </div>
      </div>
      <Slider
        :model-value="modelValue[meta.key]"
        :min="0"
        :max="10"
        :step="1"
        @update:model-value="(v: number) => update(meta.key, v)"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.symptom-sliders {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.symptom-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.symptom-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.symptom-title {
  display: flex;
  align-items: center;
  gap: 8px;
}
.symptom-icon {
  font-size: 20px;
  line-height: 1;
}
.symptom-label {
  font-size: 14px;
  font-weight: 600;
  color: #2d2d34;
}
.symptom-score {
  font-size: 15px;
  font-weight: 700;
  color: #9d4edd;
  font-variant-numeric: tabular-nums;

  &.highlight {
    color: #e63946;
  }
}
.symptom-score-unit {
  font-size: 11px;
  font-weight: 500;
  color: #9e9aa8;
  margin-left: 2px;
}
</style>
