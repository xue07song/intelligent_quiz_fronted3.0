<template>
<!-- 轻量级操作反馈 -->
  <Teleport to="body">
    <Transition name="toast-fade">
      <div v-if="visible" class="toast" :class="type">
        <span class="icon">{{ icon }}</span>
        <span class="message">{{ message }}</span>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  message: { type: String, default: '' },
  type: { type: String, default: 'info' },
  duration: { type: Number, default: 3000 },
});

const visible = ref(false);

const icon = computed(() => {
  const map = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  return map[props.type] || 'ℹ️';
});

watch(
  () => props.message,
  (val) => {
    if (val) {
      visible.value = true;
      setTimeout(() => {
        visible.value = false;
      }, props.duration);
    }
  }
);
</script>

<style scoped>
.toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  z-index: 9999;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 8px;
}
.toast.success { background: #52c41a; }
.toast.error { background: #ff4d4f; }
.toast.warning { background: #faad14; }
.toast.info { background: #1890ff; }
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}
.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}
</style>