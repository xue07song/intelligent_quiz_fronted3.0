<template>
  <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-card">
      <h2 class="modal-title">🤖 AI 自动出题</h2>

      <!-- 配置表单 -->
      <div v-if="!drafts.length" class="form-section">
        <div class="form-row">
          <div class="form-group">
            <label>章节</label>
            <input v-model="form.章节" type="number" class="input" placeholder="不限留空" />
          </div>
          <div class="form-group">
            <label>题型</label>
            <select v-model="form.题型" class="input">
              <option value="">不限</option>
              <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>难度</label>
            <select v-model="form.难度" class="input">
              <option value="">不限</option>
              <option v-for="opt in difficultyOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>数量 *</label>
            <input v-model.number="form.数量" type="number" min="1" max="10" class="input" placeholder="1-10" />
          </div>
        </div>
        <div class="form-group">
          <label>知识点</label>
          <input v-model="form.知识点" class="input" placeholder="如：循环结构、进程调度" />
        </div>
        <div class="form-group">
          <label>补充说明</label>
          <textarea v-model="form.补充说明" class="textarea" rows="2" placeholder="可选：对题目的额外要求"></textarea>
        </div>

        <div v-if="errorMsg" class="error-msg">❌ {{ errorMsg }}</div>

        <div class="modal-actions">
          <button class="btn-cancel" @click="$emit('close')">取消</button>
          <button class="btn-primary" :disabled="loading" @click="handleGenerate">
            {{ loading ? 'AI 生成中...' : '🤖 生成题目草稿' }}
          </button>
        </div>
      </div>

      <!-- 草稿审核列表 -->
      <div v-else class="draft-section">
        <div class="draft-header">
          <span class="draft-info">
            共生成 {{ drafts.length }} 道草稿，勾选后入库（重复 ID 将自动跳过）
          </span>
          <div class="draft-ops">
            <button class="btn-link" @click="selectAll">全选</button>
            <button class="btn-link" @click="drafts.forEach((d) => (d._checked = false))">清空</button>
          </div>
        </div>

        <div class="draft-list">
          <div v-for="(d, idx) in drafts" :key="idx" class="draft-card" :class="{ checked: d._checked }">
            <div class="draft-card-head">
              <label class="check-label">
                <input type="checkbox" v-model="d._checked" />
                <span class="draft-id">{{ d.id }}</span>
                <span class="draft-type">{{ getTypeName(d.题型) }}</span>
              </label>
              <button class="btn-remove" @click="drafts.splice(idx, 1)" title="移除">✕</button>
            </div>
            <div class="draft-title">{{ d.题目 }}</div>
            <div v-if="d.选项" class="draft-options">{{ d.选项 }}</div>
            <div class="draft-answer">
              <span class="ans-label">答案：</span><span class="ans-value">{{ d.答案 }}</span>
            </div>
            <div v-if="d.解析" class="draft-analysis">解析：{{ d.解析 }}</div>
          </div>
        </div>

        <div v-if="errorMsg" class="error-msg">❌ {{ errorMsg }}</div>

        <div class="modal-actions">
          <button class="btn-cancel" @click="resetDrafts">重新生成</button>
          <button class="btn-primary" :disabled="saving || selectedCount === 0" @click="handleSave">
            {{ saving ? '入库中...' : `📥 入库选中（${selectedCount}）` }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { generateQuestions, saveGenerated } from '@/api/ai';
import { TYPE_OPTIONS, DIFFICULTY_OPTIONS, getTypeName } from '@/utils/constants';

const props = defineProps({
  visible: { type: Boolean, default: false },
});

const emit = defineEmits(['close', 'success']);

const form = reactive({
  章节: '',
  题型: '',
  难度: '',
  数量: 3,
  知识点: '',
  补充说明: '',
});

const loading = ref(false);
const saving = ref(false);
const errorMsg = ref('');
const drafts = ref([]);

const typeOptions = TYPE_OPTIONS;
const difficultyOptions = DIFFICULTY_OPTIONS;

const selectedCount = computed(() => drafts.value.filter((d) => d._checked).length);

const selectAll = () => {
  drafts.value.forEach((d) => (d._checked = true));
};

const resetDrafts = () => {
  drafts.value = [];
  errorMsg.value = '';
};

const handleGenerate = async () => {
  if (!form.数量 || form.数量 < 1 || form.数量 > 10) {
    errorMsg.value = '数量需在 1-10 之间';
    return;
  }
  loading.value = true;
  errorMsg.value = '';
  try {
    const body = { 数量: form.数量 };
    if (form.章节 !== '' && form.章节 !== null) body.章节 = form.章节;
    if (form.题型 !== '' && form.题型 !== null) body.题型 = form.题型;
    if (form.难度 !== '' && form.难度 !== null) body.难度 = form.难度;
    if (form.知识点.trim()) body.知识点 = form.知识点.trim();
    if (form.补充说明.trim()) body.补充说明 = form.补充说明.trim();

    const list = await generateQuestions(body);
    if (!list || list.length === 0) {
      errorMsg.value = 'AI 未能生成有效题目，请调整条件后重试';
      return;
    }
    drafts.value = list.map((q) => ({ ...q, _checked: true }));
  } catch (err) {
    errorMsg.value = err.message || 'AI 生成失败，请稍后重试';
  } finally {
    loading.value = false;
  }
};

const handleSave = async () => {
  const selected = drafts.value.filter((d) => d._checked);
  if (selected.length === 0) return;
  saving.value = true;
  errorMsg.value = '';
  try {
    // 去掉内部字段 _checked
    const questions = selected.map(({ _checked, ...rest }) => rest);
    const result = await saveGenerated(questions);
    emit('success', result);
  } catch (err) {
    errorMsg.value = err.message || '入库失败，请稍后重试';
  } finally {
    saving.value = false;
  }
};

// 弹窗关闭时重置
watch(() => props.visible, (val) => {
  if (!val) {
    setTimeout(() => {
      resetDrafts();
      form.章节 = '';
      form.题型 = '';
      form.难度 = '';
      form.数量 = 3;
      form.知识点 = '';
      form.补充说明 = '';
    }, 300);
  }
});
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
  width: 720px;
  max-width: 92vw;
  max-height: 90vh;
  overflow-y: auto;
}
.modal-title {
  margin: 0 0 20px;
  font-size: 18px;
  color: #303133;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 12px;
}
.form-group {
  margin-bottom: 14px;
}
.form-group label {
  display: block;
  font-size: 13px;
  color: #606266;
  margin-bottom: 6px;
}
.input, .textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
  font-family: inherit;
}
.textarea {
  resize: vertical;
}
.error-msg {
  background: #fff1f0;
  color: #ff4d4f;
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 13px;
  margin-bottom: 14px;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}
.btn-primary {
  padding: 8px 16px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}
.btn-primary:hover:not(:disabled) { opacity: 0.9; }
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
.draft-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}
.draft-info {
  font-size: 13px;
  color: #606266;
}
.draft-ops {
  display: flex;
  gap: 10px;
}
.btn-link {
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  font-size: 13px;
  padding: 0;
}
.btn-link:hover { text-decoration: underline; }
.draft-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 14px;
}
.draft-card {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 12px 14px;
  transition: border-color 0.2s;
}
.draft-card.checked {
  border-color: #667eea;
  background: #fafbff;
}
.draft-card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.check-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.draft-id {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}
.draft-type {
  font-size: 11px;
  color: #667eea;
  background: #f0f5ff;
  padding: 1px 8px;
  border-radius: 10px;
}
.btn-remove {
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  color: #909399;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
}
.btn-remove:hover {
  border-color: #ff4d4f;
  color: #ff4d4f;
}
.draft-title {
  font-size: 14px;
  color: #303133;
  line-height: 1.6;
  margin-bottom: 6px;
}
.draft-options {
  font-size: 13px;
  color: #606266;
  white-space: pre-wrap;
  background: #f9fafc;
  border-radius: 4px;
  padding: 6px 10px;
  margin-bottom: 6px;
}
.draft-answer {
  font-size: 13px;
  margin-bottom: 4px;
}
.ans-label { color: #909399; }
.ans-value { color: #52c41a; font-weight: 600; }
.draft-analysis {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
}
</style>
