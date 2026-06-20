<script setup lang="ts">
import { computed } from 'vue';
import type { FlowLevel } from '@/types';
import { FLOW_LEVELS } from '@/constants';

const props = defineProps<{
  modelValue: FlowLevel;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: FlowLevel): void;
}>();

const list = computed(() => FLOW_LEVELS);

const select = (level: FlowLevel) => {
  emit('update:modelValue', level);
};
</script>

<template>
  <div class="flow-picker">
    <div
      v-for="item in list"
      :key="item.level"
      class="flow-item"
      :class="{
        active: modelValue === item.level,
        empty: item.level === 0,
      }"
      @click="select(item.level)"
    >
      <div class="flow-icon-wrap">
        <div
          class="flow-dot"
          :style="{
            opacity: item.alpha,
            transform: `scale(${0.5 + item.level * 0.25})`,
          }"
        />
      </div>
      <div class="flow-label">{{ item.label }}</div>
      <div class="flow-hint">{{ item.hint }}</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.flow-picker {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.flow-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 6px;
  background: rgba(255, 255, 255, 0.7);
  border: 2px solid transparent;
  border-radius: 18px;
  transition: all 0.2s ease;
  cursor: pointer;
  user-select: none;

  &:active {
    transform: scale(0.96);
  }

  &.active {
    border-color: #ff6b9d;
    background: linear-gradient(180deg, #fff0f5 0%, #ffe4ec 100%);
    box-shadow: 0 4px 14px rgba(255, 107, 157, 0.22);

    .flow-icon-wrap {
      background: white;
      box-shadow: 0 0 0 2px rgba(255, 107, 157, 0.25),
        0 4px 10px rgba(255, 107, 157, 0.3);
    }
  }
}
.flow-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 107, 157, 0.06);
  transition: all 0.2s ease;
}
.flow-dot {
  width: 22px;
  height: 22px;
  background: #e63946;
  border-radius: 50%;
  transition: all 0.25s ease;
}
.flow-label {
  font-size: 13px;
  font-weight: 600;
  color: #2d2d34;
}
.flow-hint {
  font-size: 10px;
  color: #9e9aa8;
}
</style>
