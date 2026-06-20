<script setup lang="ts">
import { computed } from 'vue';
import { Check } from 'lucide-vue-next';
import type { BloodColorId } from '@/types';
import { BLOOD_COLORS } from '@/constants';

const props = defineProps<{
  modelValue: BloodColorId | undefined;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: BloodColorId | undefined): void;
}>();

const list = computed(() => BLOOD_COLORS);

const select = (id: BloodColorId) => {
  if (props.modelValue === id) {
    emit('update:modelValue', undefined);
  } else {
    emit('update:modelValue', id);
  }
};
</script>

<template>
  <div class="color-picker">
    <div
      v-for="item in list"
      :key="item.id"
      class="color-item"
      :class="{ active: modelValue === item.id }"
      @click="select(item.id)"
    >
      <div class="color-dot-wrap">
        <div class="color-dot" :style="{ background: item.color }" />
        <div v-if="modelValue === item.id" class="color-check">
          <Check :size="12" stroke-width="3" color="white" />
        </div>
      </div>
      <div class="color-label">{{ item.label }}</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.color-picker {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}
.color-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
  cursor: pointer;
  user-select: none;
  transition: transform 0.15s ease;

  &:active {
    transform: scale(0.94);
  }
}
.color-dot-wrap {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.2s ease;

  .color-item.active & {
    box-shadow: 0 0 0 3px rgba(255, 107, 157, 0.28);
    transform: scale(1.08);
  }
}
.color-dot {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.6);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.12);
}
.color-check {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 22px;
  height: 22px;
  background: rgba(0, 0, 0, 0.32);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}
.color-label {
  font-size: 11px;
  color: #6a6473;
  font-weight: 500;

  .color-item.active & {
    color: #f64e8b;
    font-weight: 600;
  }
}
</style>
