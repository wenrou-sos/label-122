<script setup lang="ts">
import { computed } from 'vue';
import type { PresetTag } from '@/types';
import { PRESET_TAGS } from '@/constants';

const props = defineProps<{
  modelValue: string[];
  options?: PresetTag[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void;
}>();

const list = computed(() => props.options ?? PRESET_TAGS);

const isActive = (id: string) => props.modelValue.includes(id);

const toggle = (id: string) => {
  const next = isActive(id)
    ? props.modelValue.filter((t) => t !== id)
    : [...props.modelValue, id];
  emit('update:modelValue', next);
};
</script>

<template>
  <div class="tag-selector">
    <div
      v-for="tag in list"
      :key="tag.id"
      class="tag-item"
      :class="{ active: isActive(tag.id) }"
      @click="toggle(tag.id)"
    >
      <span class="tag-icon">{{ tag.icon }}</span>
      <span class="tag-label">{{ tag.label }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.tag-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.8);
  border: 1.5px solid rgba(255, 107, 157, 0.12);
  border-radius: 999px;
  font-size: 13px;
  color: #6a6473;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:active {
    transform: scale(0.96);
  }

  &.active {
    background: linear-gradient(135deg, #ff6b9d 0%, #f64e8b 100%);
    border-color: transparent;
    color: white;
    box-shadow: 0 4px 12px rgba(255, 107, 157, 0.32);
  }
}
.tag-icon {
  font-size: 14px;
  line-height: 1;
}
</style>
