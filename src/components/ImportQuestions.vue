<template>
  <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-card">
      <h2 class="modal-title">📥 批量导入题目（Excel）</h2>

      <div class="import-area" :class="{ 'has-file': !!selectedFile, dragging: isDragging }"
           @click="$refs.fileInput.click()"
           @dragover.prevent="isDragging = true"
           @dragleave.prevent="isDragging = false"
           @drop.prevent="handleDrop">
        <input
          ref="fileInput"
          type="file"
          accept=".xlsx,.xls"
          style="display:none;"
          @change="handleFileChange"
        />
        <div v-if="!selectedFile" class="empty-zone">
          <div class="big-icon">📊</div>
          <div class="hint-text">点击或拖拽 Excel 文件到这里</div>
          <div class="small-hint">仅支持 .xlsx 或 .xls 格式，≤ 5MB</div>
        </div>
        <div v-else class="file-info">
          <div class="file-icon">📄</div>
          <div class="file-detail">
            <div class="file-name">{{ selectedFile.name }}</div>
            <div class="file-size">{{ formatSize(selectedFile.size) }}</div>
          </div>
          <button class="btn-remove" @click.stop="removeFile" title="移除">✕</button>
        </div>
      </div>

      <div class="tips">
        <p><strong>💡 Excel 字段说明：</strong></p>
        <ul>
          <li>必填字段：<code>题目</code> / <code>题型</code>（1判断 2单选 3多选 4填空 5简答 6程序论述）/ <code>难度</code>（1-5 或 1星-5星）</li>
          <li>可选字段：<code>ID</code> / <code>章节</code> / <code>序号</code> / <code>选项</code> / <code>答案</code> / <code>解析</code> / <code>知识点</code> / <code>使用频率</code> / <code>出题人</code></li>
          <li>若 ID 与数据库已有记录重复则自动跳过</li>
        </ul>
      </div>

      <div v-if="errorMsg" class="error-msg">❌ {{ errorMsg }}</div>

      <div v-if="result" class="result-box" :class="{ 'has-errors': result.invalid > 0 || result.skipped > 0 }">
        <div class="result-row success">✅ 成功导入：<strong>{{ result.inserted }}</strong> 条</div>
        <div class="result-row warn" v-if="result.skipped > 0">⚠️ 重复跳过：<strong>{{ result.skipped }}</strong> 条</div>
        <div class="result-row error" v-if="result.invalid > 0">❌ 无效数据：<strong>{{ result.invalid }}</strong> 条</div>
      </div>

      <div class="modal-actions">
        <button class="btn-cancel" @click="$emit('close')">{{ result ? '关闭' : '取消' }}</button>
        <button
          v-if="!result"
          class="btn-primary"
          :disabled="!selectedFile || loading"
          @click="handleSubmit"
        >
          {{ loading ? '导入中...' : '开始导入' }}
        </button>
        <button
          v-else
          class="btn-primary"
          @click="resetAndContinue"
        >
          继续导入
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { batchImportQuestions } from '@/api/question';

const props = defineProps({
  visible: { type: Boolean, default: false },
});

const emit = defineEmits(['close', 'success']);

const fileInput = ref(null);
const selectedFile = ref(null);
const isDragging = ref(false);
const loading = ref(false);
const errorMsg = ref('');
const result = ref(null); // { inserted, skipped, invalid }

// 弹窗关闭时重置
watch(() => props.visible, (val) => {
  if (!val) {
    setTimeout(() => {
      selectedFile.value = null;
      result.value = null;
      errorMsg.value = '';
    }, 300);
  }
});

const handleFileChange = (e) => {
  const file = e.target.files?.[0];
  if (file) setFile(file);
  // 清空 input，保证同一文件再次选择也能触发 change
  e.target.value = '';
};

const handleDrop = (e) => {
  isDragging.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) setFile(file);
};

const setFile = (file) => {
  errorMsg.value = '';
  result.value = null;

  if (!/\.(xlsx|xls)$/i.test(file.name)) {
    errorMsg.value = '文件格式错误，仅支持 .xlsx 或 .xls';
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    errorMsg.value = '文件过大，不能超过 5MB';
    return;
  }
  selectedFile.value = file;
};

const removeFile = () => {
  selectedFile.value = null;
  errorMsg.value = '';
  result.value = null;
};

const formatSize = (b) => {
  if (b < 1024) return `${b}B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)}KB`;
  return `${(b / 1024 / 1024).toFixed(2)}MB`;
};

const handleSubmit = async () => {
  if (!selectedFile.value) return;
  loading.value = true;
  errorMsg.value = '';
  try {
    const data = await batchImportQuestions(selectedFile.value);
    result.value = {
      inserted: data.inserted ?? 0,
      skipped: data.skipped ?? 0,
      invalid: data.invalid ?? 0,
    };
    emit('success', result.value);
  } catch (err) {
    errorMsg.value = err.message || '导入失败，请稍后重试';
    result.value = null;
  } finally {
    loading.value = false;
  }
};

const resetAndContinue = () => {
  selectedFile.value = null;
  result.value = null;
  errorMsg.value = '';
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-card {
  background: #fff;
  border-radius: 8px;
  padding: 28px;
  width: 560px;
  max-height: 90vh;
  overflow-y: auto;
}
.modal-title {
  margin: 0 0 20px;
  font-size: 18px;
  color: #303133;
}
.import-area {
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  padding: 30px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 16px;
}
.import-area:hover, .import-area.dragging {
  border-color: #667eea;
  background: #fafbff;
}
.import-area.has-file {
  border-style: solid;
  cursor: default;
}
.import-area.has-file:hover {
  background: #fff;
}
.big-icon {
  font-size: 48px;
  margin-bottom: 12px;
}
.hint-text {
  font-size: 15px;
  color: #303133;
  margin-bottom: 4px;
}
.small-hint {
  font-size: 12px;
  color: #909399;
}
.file-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
.file-icon { font-size: 32px; }
.file-detail { text-align: left; }
.file-name { font-size: 15px; color: #303133; }
.file-size { font-size: 12px; color: #909399; margin-top: 2px; }
.btn-remove {
  margin-left: 10px;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  color: #909399;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.2s;
}
.btn-remove:hover {
  border-color: #ff4d4f;
  color: #ff4d4f;
  background: #fff1f0;
}
.tips {
  background: #f5f7fa;
  border-radius: 6px;
  padding: 12px 16px;
  font-size: 13px;
  color: #606266;
  margin-bottom: 16px;
}
.tips p { margin: 0 0 6px; }
.tips ul { margin: 0; padding-left: 20px; }
.tips li { line-height: 1.8; }
.tips code {
  background: #fff;
  padding: 1px 6px;
  border-radius: 3px;
  font-family: Consolas, monospace;
  color: #e6a23c;
}
.error-msg {
  background: #fff1f0;
  color: #ff4d4f;
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 13px;
  margin-bottom: 16px;
}
.result-box {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 14px 16px;
  margin-bottom: 16px;
  background: #f5f7fa;
}
.result-box.has-errors {
  background: #fffbe6;
  border-color: #f5d898;
}
.result-row {
  padding: 4px 0;
  font-size: 14px;
}
.result-row.success { color: #52c41a; }
.result-row.warn { color: #faad14; }
.result-row.error { color: #ff4d4f; }
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.btn-primary {
  padding: 8px 16px;
  background: #667eea;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}
.btn-primary:hover:not(:disabled) { background: #5568d3; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-cancel {
  padding: 8px 16px;
  background: #fff;
  color: #606266;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}
</style>
