<template>
  <div class="generate-exam">
    <div class="page-header">
      <h2>📝 随机组卷</h2>
      <p class="hint">按条件从题库随机抽取题目生成练习试卷</p>
    </div>

    <div class="form-card">
      <div class="form-group">
        <label>试卷标题</label>
        <input v-model="form.title" class="input" placeholder="留空则自动生成（练习试卷-时间）" />
      </div>

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
          <label>题目数量 *</label>
          <input v-model.number="form.count" type="number" min="1" max="100" class="input" placeholder="1-100" />
        </div>
      </div>

      <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>

      <div class="actions">
        <button class="btn-primary" :disabled="loading" @click="handleGenerate">
          {{ loading ? '组卷中...' : '🎯 生成试卷' }}
        </button>
      </div>
    </div>

    <!-- 组卷结果预览 -->
    <div v-if="result" class="result-card">
      <div class="result-header">
        <h3>✅ 组卷成功</h3>
        <span class="result-meta">
          共 {{ result.total }} 题 · 客观题 {{ result.objectiveCount }} 题
        </span>
      </div>
      <div class="result-actions">
        <button class="btn-primary" @click="$emit('start-exam', result.examId)">开始答题 →</button>
        <button class="btn-cancel" @click="result = null">重新组卷</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { generateExam } from '@/api/practice';
import { TYPE_OPTIONS, DIFFICULTY_OPTIONS } from '@/utils/constants';

const emit = defineEmits(['start-exam', 'toast']);

const form = reactive({
  title: '',
  章节: '',
  题型: '',
  难度: '',
  count: 10,
});

const loading = ref(false);
const errorMsg = ref('');
const result = ref(null);

const typeOptions = TYPE_OPTIONS;
const difficultyOptions = DIFFICULTY_OPTIONS;

const handleGenerate = async () => {
  errorMsg.value = '';

  if (!form.count || form.count < 1 || form.count > 100) {
    errorMsg.value = '题目数量需在 1-100 之间';
    return;
  }

  loading.value = true;
  try {
    const body = { count: form.count };
    if (form.title.trim()) body.title = form.title.trim();
    if (form.章节 !== '' && form.章节 !== null) body.章节 = form.章节;
    if (form.题型 !== '' && form.题型 !== null) body.题型 = form.题型;
    if (form.难度 !== '' && form.难度 !== null) body.难度 = form.难度;

    const data = await generateExam(body);
    result.value = data;
    emit('toast', { message: `组卷成功，共 ${data.total} 题`, type: 'success' });
  } catch (err) {
    errorMsg.value = err.message || '组卷失败，请检查条件后重试';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.generate-exam {
  max-width: 700px;
  margin: 0 auto;
}
.page-header {
  margin-bottom: 24px;
}
.page-header h2 {
  margin: 0 0 6px;
  font-size: 20px;
  color: #303133;
}
.hint {
  margin: 0;
  font-size: 14px;
  color: #909399;
}
.form-card {
  background: #fff;
  border-radius: 8px;
  padding: 28px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.form-group {
  margin-bottom: 16px;
}
.form-group label {
  display: block;
  font-size: 14px;
  color: #606266;
  margin-bottom: 6px;
}
.input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}
.error-msg {
  color: #ff4d4f;
  font-size: 13px;
  margin-bottom: 12px;
  background: #fff1f0;
  padding: 8px 12px;
  border-radius: 6px;
}
.actions {
  margin-top: 8px;
}
.btn-primary {
  padding: 10px 24px;
  background: #667eea;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 15px;
  transition: background 0.2s;
}
.btn-primary:hover:not(:disabled) { background: #5568d3; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-cancel {
  padding: 10px 24px;
  background: #fff;
  color: #606266;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  cursor: pointer;
  font-size: 15px;
}
.result-card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  margin-top: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border-left: 4px solid #52c41a;
}
.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.result-header h3 {
  margin: 0;
  font-size: 18px;
  color: #52c41a;
}
.result-meta {
  font-size: 14px;
  color: #606266;
}
.result-actions {
  display: flex;
  gap: 10px;
}
</style>
