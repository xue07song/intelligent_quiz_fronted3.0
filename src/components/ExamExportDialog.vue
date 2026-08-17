<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="visible" class="iq-modal-overlay" @click.self="$emit('close')">
        <div class="iq-modal export-modal">
          <div class="iq-modal-header">
            <div class="iq-modal-title-wrap">
              <div class="export-modal-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
              </div>
              <div>
                <h3 class="iq-modal-title">导出试卷</h3>
                <p class="iq-modal-subtitle">选择文件格式和是否附带答案</p>
              </div>
            </div>
            <button class="iq-modal-close" @click="$emit('close')" aria-label="关闭">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div class="iq-modal-body">
            <div class="export-field">
              <label class="export-label">文件格式</label>
              <div class="export-options">
                <label class="export-option">
                  <input type="radio" value="docx" v-model="format" />
                  <span>Word (.docx)</span>
                </label>
                <label class="export-option">
                  <input type="radio" value="xlsx" v-model="format" />
                  <span>Excel (.xlsx)</span>
                </label>
              </div>
            </div>

            <div class="export-field">
              <label class="export-label">答案内容</label>
              <div class="export-options">
                <label class="export-option">
                  <input type="radio" :value="false" v-model="withAnswers" />
                  <span>不带答案</span>
                </label>
                <label class="export-option">
                  <input type="radio" :value="true" v-model="withAnswers" />
                  <span>带答案与解析</span>
                </label>
              </div>
            </div>

            <div v-if="errorMsg" class="export-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{{ errorMsg }}</span>
            </div>
          </div>

          <div class="iq-modal-footer">
            <button type="button" class="iq-btn iq-btn-secondary" @click="$emit('close')">取消</button>
            <button type="button" class="iq-btn iq-btn-primary" :disabled="loading" @click="handleExport">
              <span v-if="loading" class="export-spinner"></span>
              {{ loading ? '导出中...' : '确认导出' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue';
import { exportExam } from '@/api/practice';
import { downloadBlob } from '@/utils/download';

const props = defineProps({
  visible: { type: Boolean, default: false },
  examId: { type: [Number, String], default: null },
  title: { type: String, default: '' },
});

const emit = defineEmits(['close', 'toast']);

const format = ref('docx');
const withAnswers = ref(false);
const loading = ref(false);
const errorMsg = ref('');

watch(
  () => props.visible,
  (val) => {
    if (val) {
      format.value = 'docx';
      withAnswers.value = false;
      errorMsg.value = '';
    }
  }
);

const handleExport = async () => {
  if (!props.examId) return;
  loading.value = true;
  errorMsg.value = '';
  try {
    const blob = await exportExam(props.examId, {
      format: format.value,
      withAnswers: withAnswers.value,
    });
    const suffix = format.value === 'xlsx' ? 'xlsx' : 'docx';
    const answerLabel = withAnswers.value ? '含答案' : '不含答案';
    const baseName = (props.title || '试卷').replace(/[\\/:*?"<>|]/g, '_');
    downloadBlob(blob, `${baseName}_${answerLabel}.${suffix}`);
    emit('toast', { message: '试卷导出成功', type: 'success' });
    emit('close');
  } catch (err) {
    errorMsg.value = err.message || '导出失败，请稍后重试';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.export-modal {
  width: 460px;
  max-width: calc(100vw - 32px);
}

.export-modal-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #eef2ff;
  color: #4f46e5;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.export-modal-icon svg {
  width: 20px;
  height: 20px;
}

.export-field {
  margin-bottom: 18px;
}

.export-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  margin-bottom: 8px;
}

.export-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.export-option {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px 14px;
  background: #f8fafc;
  cursor: pointer;
  font-size: 13px;
  color: #334155;
}

.export-option:hover {
  border-color: #a5b4fc;
  background: #eef2ff;
}

.export-option input {
  accent-color: #4f46e5;
}

.export-error {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
}

.export-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: export-spin 0.7s linear infinite;
  margin-right: 6px;
  flex-shrink: 0;
}

@keyframes export-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
