<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { Popup, showToast, Loading } from 'vant';
import { X, Trash2, Check } from 'lucide-vue-next';
import FlowPicker from '@/components/FlowPicker.vue';
import ColorPicker from '@/components/ColorPicker.vue';
import SymptomSliders from '@/components/SymptomSliders.vue';
import TagSelector from '@/components/TagSelector.vue';
import type { DayRecord, FlowLevel, BloodColorId, Symptoms } from '@/types';
import { PRESET_TAGS, FLOW_LEVELS, BLOOD_COLORS } from '@/constants';
import { usePeriodStore } from '@/stores/period';
import { parseDate, getWeekdayCN } from '@/utils/date';

const props = defineProps<{
  visible: boolean;
  date: string;
}>();

const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void;
  (e: 'saved'): void;
  (e: 'cleared'): void;
}>();

const store = usePeriodStore();
const saving = ref(false);

const flowLevel = ref<FlowLevel>(0);
const bloodColor = ref<BloodColorId | undefined>(undefined);
const symptoms = ref<Symptoms>({
  cramp: 0,
  backache: 0,
  headache: 0,
  breast: 0,
  mood: 0,
});
const tags = ref<string[]>([]);

const dateLabel = computed(() => {
  const d = parseDate(props.date);
  return {
    main: `${d.month() + 1}月${d.date()}日`,
    sub: getWeekdayCN(d),
  };
});

const existing = computed<DayRecord | undefined>(() =>
  store.getRecord(props.date),
);

const hasAnyInput = computed(
  () =>
    flowLevel.value > 0 ||
    !!bloodColor.value ||
    Object.values(symptoms.value).some((v) => v > 0) ||
    tags.value.length > 0,
);

const flowHint = computed(() => {
  const item = FLOW_LEVELS.find((f) => f.level === flowLevel.value);
  return item?.hint ?? '';
});

const bloodColorLabel = computed(() => {
  if (!bloodColor.value) return '';
  return BLOOD_COLORS.find((c) => c.id === bloodColor.value)?.label ?? '';
});

const activeTags = computed(() =>
  PRESET_TAGS.filter((t) => tags.value.includes(t.id)),
);

watch(
  () => [props.visible, props.date] as const,
  ([vis, date]) => {
    if (vis && date) {
      const r = store.getRecord(date);
      flowLevel.value = r?.flowLevel ?? 0;
      bloodColor.value = r?.bloodColor;
      symptoms.value = {
        cramp: r?.symptoms.cramp ?? 0,
        backache: r?.symptoms.backache ?? 0,
        headache: r?.symptoms.headache ?? 0,
        breast: r?.symptoms.breast ?? 0,
        mood: r?.symptoms.mood ?? 0,
      };
      tags.value = [...(r?.tags ?? [])];
    }
  },
  { immediate: true },
);

const close = () => emit('update:visible', false);

const handleSave = async () => {
  saving.value = true;
  try {
    await new Promise((r) => setTimeout(r, 380));
    store.upsertRecord(props.date, {
      flowLevel: flowLevel.value,
      bloodColor: bloodColor.value,
      symptoms: symptoms.value,
      tags: tags.value,
    });
    showToast({ type: 'success', message: '已保存记录', position: 'middle' });
    emit('saved');
    close();
  } finally {
    saving.value = false;
  }
};

const handleClear = () => {
  store.clearRecord(props.date);
  showToast({ type: 'success', message: '已清除记录', position: 'middle' });
  emit('cleared');
  close();
};
</script>

<template>
  <Popup
    :show="visible"
    position="bottom"
    round
    :style="{ maxHeight: '88%' }"
    @update:show="(v: boolean) => emit('update:visible', v)"
  >
    <div class="detail-modal">
      <div class="modal-header">
        <button class="close-btn" @click="close">
          <X :size="22" color="#6a6473" />
        </button>
        <div class="date-title">
          <div class="date-main">{{ dateLabel.main }}</div>
          <div class="date-sub">{{ dateLabel.sub }}</div>
        </div>
        <button
          v-if="existing"
          class="clear-btn"
          @click="handleClear"
          title="清除记录"
        >
          <Trash2 :size="18" color="#ff6b9d" />
        </button>
        <div v-else class="header-spacer" />
      </div>

      <div class="modal-body">
        <section class="section">
          <div class="section-title">
            <span class="title-dot" style="background:#E63946" />
            <span>经期流量</span>
          </div>
          <FlowPicker v-model="flowLevel" />
          <div v-if="flowLevel > 0" class="hint-row">
            <span class="hint-label">当前状态：</span>
            <span class="hint-value">{{ flowHint }}</span>
          </div>
        </section>

        <section v-if="flowLevel > 0" class="section">
          <div class="section-title">
            <span class="title-dot" style="background:#795548" />
            <span>经血颜色</span>
            <span v-if="bloodColorLabel" class="title-value">
              · {{ bloodColorLabel }}
            </span>
          </div>
          <ColorPicker v-model="bloodColor" />
        </section>

        <section class="section">
          <div class="section-title">
            <span class="title-dot" style="background:#9D4EDD" />
            <span>身体症状</span>
          </div>
          <SymptomSliders v-model="symptoms" />
        </section>

        <section class="section">
          <div class="section-title">
            <span class="title-dot" style="background:#4CC9F0" />
            <span>今日标签</span>
            <span v-if="activeTags.length > 0" class="title-value">
              · 已选 {{ activeTags.length }} 项
            </span>
          </div>
          <TagSelector v-model="tags" />
        </section>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" @click="close">取消</button>
        <button
          class="btn-primary save-btn"
          :disabled="saving || !hasAnyInput"
          @click="handleSave"
        >
          <Loading v-if="saving" :size="18" color="white" />
          <template v-else>
            <Check :size="18" />
            <span>保存记录</span>
          </template>
        </button>
      </div>
    </div>
  </Popup>
</template>

<style lang="scss" scoped>
.detail-modal {
  display: flex;
  flex-direction: column;
  max-height: 88vh;
  background: linear-gradient(180deg, #fffafb 0%, #ffffff 100%);
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
  border-bottom: 1px solid rgba(255, 107, 157, 0.1);
  flex-shrink: 0;
}
.close-btn,
.clear-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 107, 157, 0.08);
  transition: all 0.2s ease;

  &:active {
    transform: scale(0.92);
  }
}
.clear-btn {
  background: rgba(255, 107, 157, 0.12);
}
.header-spacer {
  width: 38px;
}
.date-title {
  text-align: center;
}
.date-main {
  font-size: 18px;
  font-weight: 700;
  color: #2d2d34;
  line-height: 1.2;
}
.date-sub {
  font-size: 12px;
  color: #9e9aa8;
  margin-top: 2px;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 18px 20px 140px;
  -webkit-overflow-scrolling: touch;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #2d2d34;
}
.title-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.title-value {
  font-size: 12px;
  font-weight: 500;
  color: #9e9aa8;
}
.hint-row {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255, 107, 157, 0.06);
  border-radius: 10px;
  font-size: 12px;
}
.hint-label {
  color: #9e9aa8;
}
.hint-value {
  color: #f64e8b;
  font-weight: 600;
}

.modal-footer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 14px 20px calc(14px + var(--safe-bottom));
  background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, #ffffff 30%);
  display: flex;
  gap: 12px;
  align-items: center;
  z-index: 10;
}
.btn-cancel {
  flex: 0 0 auto;
  padding: 0 22px;
  height: 46px;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 600;
  color: #6a6473;
  background: rgba(110, 100, 115, 0.08);
  transition: all 0.2s ease;

  &:active {
    transform: scale(0.97);
    background: rgba(110, 100, 115, 0.14);
  }
}
.save-btn {
  flex: 1;
  height: 46px;
  font-size: 15px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
</style>
