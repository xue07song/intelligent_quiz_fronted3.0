<template>
  <div class="iq-gen-exam">
    <div class="iq-page-header">
      <div>
        <h2 class="iq-text-xl iq-font-semibold" style="color: var(--iq-neutral-900); margin: 0;">随机组卷</h2>
        <p class="iq-text-sm iq-text-muted" style="margin: 4px 0 0;">按条件从题库随机抽取题目生成练习试卷</p>
      </div>
    </div>

    <div class="iq-card" style="padding: 28px;">
      <div class="iq-form-field">
        <label class="iq-form-label">试卷标题</label>
        <input v-model="form.title" class="iq-input" placeholder="留空则自动生成（练习试卷-时间）" />
      </div>

      <div class="iq-form-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 16px;">
        <div class="iq-form-field">
          <label class="iq-form-label">章节</label>
          <input v-model="form.章节" type="number" class="iq-input" placeholder="不限留空" />
        </div>
        <div class="iq-form-field">
          <label class="iq-form-label">题型</label>
          <select v-model="form.题型" class="iq-select">
            <option value="">不限</option>
            <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
        <div class="iq-form-field">
          <label class="iq-form-label">难度</label>
          <select v-model="form.难度" class="iq-select">
            <option value="">不限</option>
            <option v-for="opt in difficultyOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
        <div class="iq-form-field">
          <label class="iq-form-label">题目数量 <span class="iq-req">*</span></label>
          <input v-model.number="form.count" type="number" min="1" max="100" class="iq-input" placeholder="1-100" />
        </div>
      </div>

      <div class="iq-form-field">
        <label class="iq-checkbox-wrap">
          <input type="checkbox" class="iq-checkbox" v-model="form.focusWeakPoints" />
          <span>侧重薄弱点（AI 根据近期答题表现调整题型分布）</span>
        </label>
      </div>

      <div v-if="errorMsg" class="iq-alert-error">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        {{ errorMsg }}
      </div>

      <div class="iq-flex iq-gap-2" style="margin-top: 8px;">
        <button class="iq-btn iq-btn-primary" :disabled="loading" @click="handleGenerate">
          <span v-if="loading" class="iq-btn-spinner"></span>
          {{ loading ? '组卷中...' : '🎯 生成试卷' }}
        </button>
        <button class="iq-btn ai-gen-btn" :disabled="aiLoading" @click="handleSmartExam">
          <span v-if="aiLoading" class="iq-btn-spinner"></span>
          {{ aiLoading ? 'AI 组卷中...' : '🤖 AI 智能组卷' }}
        </button>
      </div>
    </div>

    <!-- 组卷结果预览 -->
    <div v-if="result" class="iq-card result-card">
      <div class="result-header">
        <div class="result-title-wrap">
          <div class="result-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div>
            <h3 class="iq-modal-title" style="margin: 0;">{{ aiResult ? 'AI 智能组卷成功' : '组卷成功' }}</h3>
            <p class="iq-modal-subtitle" style="margin: 2px 0 0;">
              共 {{ result.total }} 题 · 客观题 {{ result.objectiveCount }} 题
            </p>
          </div>
        </div>
      </div>

      <div v-if="aiResult && result.strategy" class="ai-strategy">
        <div class="strategy-title">📋 AI 组卷策略</div>
        <div class="strategy-text">{{ result.strategy }}</div>
        <div v-if="result.distribution?.length" class="strategy-dist">
          <span v-for="d in result.distribution" :key="d.题型" class="dist-tag">
            {{ getTypeName(d.题型) }} ×{{ d.数量 }}
          </span>
        </div>
      </div>

      <div class="iq-flex iq-gap-2" style="justify-content: flex-end; padding-top: 8px;">
        <button class="iq-btn iq-btn-secondary" @click="result = null">重新组卷</button>
        <button class="iq-btn iq-btn-primary" @click="$emit('start-exam', result.examId)">
          开始答题
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { generateExam } from '@/api/practice';
import { smartExam } from '@/api/ai';
import { TYPE_OPTIONS, DIFFICULTY_OPTIONS, getTypeName } from '@/utils/constants';

const emit = defineEmits(['start-exam', 'toast']);

const form = reactive({
  title: '',
  章节: '',
  题型: '',
  难度: '',
  count: 10,
  focusWeakPoints: true,
});

const loading = ref(false);
const aiLoading = ref(false);
const errorMsg = ref('');
const result = ref(null);
const aiResult = ref(false);

const typeOptions = TYPE_OPTIONS;
const difficultyOptions = DIFFICULTY_OPTIONS;

const buildBody = () => {
  if (!form.count || form.count < 1 || form.count > 100) {
    errorMsg.value = '题目数量需在 1-100 之间';
    return null;
  }
  errorMsg.value = '';
  const body = { count: form.count };
  if (form.title.trim()) body.title = form.title.trim();
  if (form.章节 !== '' && form.章节 !== null) body.章节 = form.章节;
  if (form.题型 !== '' && form.题型 !== null) body.题型 = form.题型;
  if (form.难度 !== '' && form.难度 !== null) body.难度 = form.难度;
  return body;
};

const handleGenerate = async () => {
  const body = buildBody();
  if (!body) return;
  loading.value = true;
  try {
    const data = await generateExam(body);
    result.value = data;
    aiResult.value = false;
    emit('toast', { message: `组卷成功，共 ${data.total} 题`, type: 'success' });
  } catch (err) {
    errorMsg.value = err.message || '组卷失败，请检查条件后重试';
  } finally {
    loading.value = false;
  }
};

const handleSmartExam = async () => {
  const body = buildBody();
  if (!body) return;
  aiLoading.value = true;
  try {
    body.focusWeakPoints = form.focusWeakPoints;
    const data = await smartExam(body);
    result.value = data;
    aiResult.value = true;
    emit('toast', { message: `AI 智能组卷成功，共 ${data.total} 题`, type: 'success' });
  } catch (err) {
    errorMsg.value = err.message || 'AI 组卷失败，请稍后重试';
  } finally {
    aiLoading.value = false;
  }
};
</script>

<style scoped>
.iq-gen-exam {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 780px;
}
.iq-page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
.iq-form-grid {
  display: grid;
  gap: 16px;
}
.iq-form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}
.iq-form-grid .iq-form-field { margin-bottom: 0; }
.iq-form-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--iq-neutral-700);
}
.iq-req {
  color: var(--iq-state-error);
  margin-left: 2px;
}
.iq-checkbox-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--iq-neutral-700);
  cursor: pointer;
}
.iq-checkbox {
  width: 16px;
  height: 16px;
  accent-color: var(--iq-primary);
  cursor: pointer;
}
.iq-flex {
  display: flex;
}
.iq-gap-2 {
  gap: 10px;
}
.ai-gen-btn {
  background: linear-gradient(135deg, var(--iq-primary-500), #8b5cf6);
  border-color: transparent;
  color: #fff;
  box-shadow: 0 4px 14px -4px rgba(99, 102, 241, 0.5);
}
.ai-gen-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--iq-primary-600), #7c3aed);
  border-color: transparent;
  opacity: 0.95;
}
.iq-alert-error {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--iq-state-error-bg);
  color: #b91c1c;
  border: 1px solid #fecaca;
  padding: 10px 14px;
  border-radius: var(--iq-radius-medium);
  font-size: 13px;
  margin-bottom: 16px;
}
.iq-btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  margin-right: 6px;
  flex-shrink: 0;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.result-card {
  border-left: 4px solid var(--iq-state-success);
}
.result-header {
  margin-bottom: 16px;
}
.result-title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}
.result-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--iq-radius-medium);
  background: var(--iq-state-success-bg);
  color: var(--iq-state-success);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.iq-modal-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--iq-neutral-900);
}
.iq-modal-subtitle {
  font-size: 12px;
  color: var(--iq-muted-foreground);
}
.ai-strategy {
  background: linear-gradient(135deg, var(--iq-primary-50), #faf5ff);
  border: 1px solid var(--iq-primary-100);
  border-radius: var(--iq-radius-medium);
  padding: 14px 16px;
  margin-bottom: 16px;
}
.strategy-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--iq-primary-700);
  margin-bottom: 6px;
}
.strategy-text {
  font-size: 14px;
  color: var(--iq-neutral-800);
  line-height: 1.7;
  margin-bottom: 8px;
}
.strategy-dist {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.dist-tag {
  background: var(--iq-neutral-0);
  border: 1px solid var(--iq-primary-200);
  color: var(--iq-primary-700);
  padding: 2px 10px;
  border-radius: var(--iq-radius-full);
  font-size: 12px;
  font-weight: 500;
}
</style>
