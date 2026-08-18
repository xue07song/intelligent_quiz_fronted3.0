<template>
  <div class="single-question-page">
    <!-- ===== 顶部横幅 ===== -->
    <header class="page-hero">
      <div class="hero-content">
        <span class="hero-badge">📝 单题练习</span>
        <h1 class="hero-title">{{ question?.题目 || '加载中...' }}</h1>
        <p class="hero-desc">选择答案后立即显示对错和解析</p>
      </div>
      <div class="hero-actions">
        <button class="btn-back" @click="handleExit">
          ← 返回
        </button>
      </div>
    </header>

    <!-- ===== 加载状态 ===== -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载题目...</p>
    </div>

    <!-- ===== 题目区域 ===== -->
    <div v-else-if="question" class="question-area">
      <div class="question-card">
        <div class="q-header">
          <span class="q-type-tag" :class="`type-${question.题型}`">
            {{ getTypeName(question.题型) }}
          </span>
          <span class="q-difficulty">{{ getDifficultyLabel(question.难度) }}</span>
        </div>

        <div class="q-title">{{ question.题目 }}</div>

        <!-- ===== 判断题 ===== -->
        <div v-if="Number(question.题型) === 1" class="judge-group">
          <label class="judge-btn" :class="{ active: selectedAnswer === 'T', disabled: showResult }">
            <input type="radio" :name="`q-${question.id}`" value="T" v-model="selectedAnswer" :disabled="showResult" @change="handleAnswerSelect" />
            ✅ 对
          </label>
          <label class="judge-btn" :class="{ active: selectedAnswer === 'F', disabled: showResult }">
            <input type="radio" :name="`q-${question.id}`" value="F" v-model="selectedAnswer" :disabled="showResult" @change="handleAnswerSelect" />
            ❌ 错
          </label>
        </div>

        <!-- ===== 单选题/多选题 ===== -->
        <div v-else-if="[2, 3].includes(Number(question.题型)) && question.选项" class="q-options">
          <label
              v-for="opt in parseOptions(question.选项)"
              :key="opt.key"
              class="option-choice"
              :class="{
                selected: selectedAnswer === opt.key,
                correct: showResult && opt.key === correctAnswer,
                wrong: showResult && selectedAnswer === opt.key && opt.key !== correctAnswer,
                disabled: showResult
              }"
          >
            <input
                type="radio"
                :name="`q-${question.id}`"
                :value="opt.key"
                v-model="selectedAnswer"
                :disabled="showResult"
                @change="handleAnswerSelect"
            />
            <span class="option-key">{{ opt.key }}.</span>
            <span class="option-text">{{ opt.text }}</span>
            <span v-if="showResult && opt.key === correctAnswer" class="result-icon">✅</span>
            <span v-if="showResult && selectedAnswer === opt.key && opt.key !== correctAnswer" class="result-icon">❌</span>
          </label>
        </div>

        <!-- ===== 填空题 / 简答题 / 程序题（手动提交） ===== -->
        <div v-if="[4, 5, 6].includes(Number(question.题型))" class="input-area">
          <!-- 填空题 -->
          <input
              v-if="Number(question.题型) === 4"
              v-model="selectedAnswer"
              class="input-field"
              placeholder="请输入答案..."
              :disabled="showResult"
              @keyup.enter="submitManual"
          />

          <!-- 简答/程序题 -->
          <textarea
              v-else
              v-model="selectedAnswer"
              class="textarea-field"
              placeholder="请输入你的解答..."
              rows="4"
              :disabled="showResult"
          ></textarea>

          <!-- 手动提交按钮 -->
          <div v-if="!showResult" class="manual-submit-area">
            <button class="btn-submit-manual" @click="submitManual" :disabled="!selectedAnswer.trim()">
              提交答案
            </button>
            <span class="hint-text">按 Enter 键也可提交</span>
          </div>
        </div>
      </div>

      <!-- ===== 结果区域 ===== -->
      <div v-if="showResult" class="result-area">
        <div class="result-box" :class="result.isCorrect ? 'correct' : 'wrong'">
          <div class="result-icon-big">{{ result.isCorrect ? '✅' : '❌' }}</div>
          <div class="result-text">{{ result.isCorrect ? '回答正确！' : '回答错误' }}</div>
        </div>
        <div class="answer-detail">
          <div class="detail-row">
            <span class="detail-label">你的答案：</span>
            <span class="detail-value">{{ selectedAnswer || '未作答' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">正确答案：</span>
            <span class="detail-value correct-answer">{{ result.correctAnswer }}</span>
          </div>
          <div v-if="result.explanation" class="explanation">
            <strong>📖 解析：</strong>{{ result.explanation }}
          </div>
        </div>
        <div class="result-actions">
          <button class="btn-next" @click="handleExit">返回</button>
          <button class="btn-retry" @click="resetQuestion">重新练习</button>
        </div>
      </div>
    </div>

    <!-- ===== 题目不存在 ===== -->
    <div v-else class="empty-state">
      <div class="empty-icon">📭</div>
      <h3>题目不存在</h3>
      <p>请返回重新选择</p>
      <button class="btn-primary" @click="handleExit">返回</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getQuestionById } from '@/api/question';
import { checkSingleQuestion } from '@/api/practice';
import { getTypeName, getDifficultyLabel } from '@/utils/constants';

const props = defineProps({
  questionId: { type: [Number, String], required: true },
});

const emit = defineEmits(['exit']);

// ===== 状态 =====
const loading = ref(true);
const question = ref(null);
const selectedAnswer = ref('');
const showResult = ref(false);
const result = ref({ isCorrect: false, correctAnswer: '', explanation: '' });

// ===== 方法 =====
function parseOptions(text) {
  if (!text) return [];
  const str = String(text).trim();
  const lines = str.split(/\n+/).filter(Boolean);

  const cleanText = (raw) => {
    return String(raw || '')
        .replace(/^[A-Fa-f]\s*[.、)）]\s*/, '')
        .trim();
  };

  const result = [];
  const seenText = new Set();

  const addOption = (key, rawText) => {
    const textClean = cleanText(rawText);
    if (textClean && !seenText.has(textClean)) {
      seenText.add(textClean);
      result.push({ key, text: textClean });
    }
  };

  if (lines.length > 1) {
    lines.forEach((line, index) => {
      const match = line.match(/^([A-Fa-f])\s*[.、)）]?\s*(.*)/);
      if (match) {
        addOption(match[1].toUpperCase(), match[2]);
      } else {
        addOption(String.fromCharCode(65 + index), line);
      }
    });
  } else {
    const parts = str.split(/[，,;；\s]+/).filter(Boolean);
    parts.forEach((p, i) => {
      addOption(String.fromCharCode(65 + i), p);
    });
  }

  return result;
}

// ===== 选择题（判断/单选/多选）自动判题 =====
const handleAnswerSelect = () => {
  if (showResult.value) return;
  const answer = String(selectedAnswer.value || '').trim();
  if (answer) {
    submitAnswer(answer);
  }
};

// ===== 手动提交（填空题/简答题/程序题） =====
const submitManual = () => {
  if (showResult.value) return;
  const answer = String(selectedAnswer.value || '').trim();
  if (!answer) {
    alert('请先填写答案');
    return;
  }
  submitAnswer(answer);
};

// ===== 统一判题 =====
const submitAnswer = async (answer) => {
  try {
    const data = await checkSingleQuestion(props.questionId, answer);
    result.value = data;
    showResult.value = true;
  } catch (err) {
    alert(err.message || '判题失败，请重试');
  }
};

const resetQuestion = () => {
  showResult.value = false;
  result.value = { isCorrect: false, correctAnswer: '', explanation: '' };
  selectedAnswer.value = '';
};

const handleExit = () => {
  emit('exit');
};

// ===== 加载题目 =====
const loadQuestion = async () => {
  loading.value = true;
  try {
    const data = await getQuestionById(props.questionId);
    question.value = data;
  } catch (err) {
    console.error('加载题目失败:', err);
    question.value = null;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadQuestion();
});
</script>

<style scoped>
/* ===== 页面容器 ===== */
.single-question-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 20px 40px;
}

/* ===== 顶部横幅 ===== */
.page-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28px 34px;
  border-radius: 16px;
  color: #fff;
  background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%);
  box-shadow: 0 8px 30px rgba(99, 102, 241, 0.25);
  margin-bottom: 24px;
}

.hero-content .hero-badge {
  font-size: 12px;
  opacity: 0.8;
  letter-spacing: 1px;
  display: block;
  margin-bottom: 4px;
}

.hero-content .hero-title {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0;
}

.hero-content .hero-desc {
  font-size: 13px;
  opacity: 0.85;
  color: rgba(255, 255, 255, 0.9);
  margin: 4px 0 0;
}

.btn-back {
  padding: 8px 20px;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}
.btn-back:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* ===== 加载状态 ===== */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  color: #94A3B8;
}
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #E2E8F0;
  border-top: 3px solid #6366F1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ===== 空状态 ===== */
.empty-state {
  text-align: center;
  padding: 60px 40px;
  background: #fff;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
}
.empty-icon {
  font-size: 56px;
  margin-bottom: 16px;
}
.empty-state h3 {
  font-size: 20px;
  color: #1E293B;
  margin: 0 0 8px;
}
.empty-state p {
  color: #64748B;
  font-size: 14px;
  margin: 0 0 20px;
}
.btn-primary {
  padding: 10px 28px;
  background: #6366F1;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}
.btn-primary:hover {
  background: #4F46E5;
}

/* ===== 题目区域 ===== */
.question-area {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.question-card {
  background: #fff;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 24px 28px;
}

.q-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #F1F5F9;
}

.q-type-tag {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 12px;
  border-radius: 12px;
}
.type-1 { background: #EDE9FE; color: #6D28D9; }
.type-2 { background: #DBEAFE; color: #1D4ED8; }
.type-3 { background: #FCE7F3; color: #BE185D; }
.type-4 { background: #D1FAE5; color: #047857; }
.type-5 { background: #FEF3C7; color: #B45309; }
.type-6 { background: #FFEDD5; color: #C2410C; }

.q-difficulty {
  font-size: 12px;
  padding: 2px 10px;
  background: #F1F5F9;
  color: #475569;
  border-radius: 12px;
}

.q-title {
  font-size: 16px;
  font-weight: 500;
  color: #1E293B;
  line-height: 1.8;
  margin-bottom: 16px;
}

/* 判断题 */
.judge-group {
  display: flex;
  gap: 16px;
}
.judge-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 24px;
  border: 2px solid #E2E8F0;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  font-family: inherit;
}
.judge-btn:hover:not(.disabled) {
  border-color: #C7D2FE;
}
.judge-btn.active {
  border-color: #6366F1;
  background: #EEF2FF;
}
.judge-btn.disabled {
  cursor: not-allowed;
  opacity: 0.8;
}
.judge-btn input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

/* 单选题/多选题 */
.q-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.option-choice {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 2px solid #E2E8F0;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  color: #475569;
  min-width: 80px;
  flex: 1 0 calc(50% - 10px);
}
.option-choice:hover:not(.disabled) {
  border-color: #C7D2FE;
}
.option-choice.selected {
  border-color: #6366F1;
  background: #EEF2FF;
}
.option-choice.correct {
  border-color: #10B981;
  background: #DCFCE7;
}
.option-choice.wrong {
  border-color: #EF4444;
  background: #FEE2E2;
}
.option-choice.disabled {
  cursor: not-allowed;
  opacity: 0.9;
}
.option-choice input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
.option-key {
  font-weight: 600;
}
.result-icon {
  font-size: 18px;
  margin-left: auto;
}

/* 输入区域（填空题/简答题/程序题） */
.input-area {
  margin-top: 8px;
}
.input-field {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
}
.input-field:focus {
  outline: none;
  border-color: #6366F1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}
.textarea-field {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
}
.textarea-field:focus {
  outline: none;
  border-color: #6366F1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

/* 手动提交区域 */
.manual-submit-area {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 12px;
}
.btn-submit-manual {
  padding: 8px 24px;
  background: #6366F1;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}
.btn-submit-manual:hover:not(:disabled) {
  background: #4F46E5;
}
.btn-submit-manual:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.hint-text {
  font-size: 12px;
  color: #94A3B8;
}

/* ===== 结果区域 ===== */
.result-area {
  animation: fadeIn 0.3s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.result-box {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  border-radius: 12px;
  margin-bottom: 16px;
}
.result-box.correct {
  background: #DCFCE7;
  border: 1px solid #86EFAC;
}
.result-box.wrong {
  background: #FEE2E2;
  border: 1px solid #FCA5A5;
}

.result-icon-big {
  font-size: 32px;
}
.result-text {
  font-size: 20px;
  font-weight: 700;
}
.result-box.correct .result-text {
  color: #15803D;
}
.result-box.wrong .result-text {
  color: #B91C1C;
}

.answer-detail {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 16px;
}
.detail-row {
  display: flex;
  gap: 12px;
  padding: 4px 0;
  font-size: 14px;
}
.detail-label {
  color: #94A3B8;
  min-width: 80px;
}
.detail-value {
  font-weight: 500;
  color: #1E293B;
}
.correct-answer {
  color: #059669;
  font-weight: 600;
}
.explanation {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #E2E8F0;
  font-size: 14px;
  color: #475569;
  line-height: 1.8;
}
.explanation strong {
  color: #1E293B;
}

.result-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
.btn-next,
.btn-retry {
  padding: 10px 28px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  font-family: inherit;
  transition: all 0.2s;
}
.btn-next {
  background: #6366F1;
  color: #fff;
}
.btn-next:hover {
  background: #4F46E5;
}
.btn-retry {
  background: #F1F5F9;
  color: #475569;
}
.btn-retry:hover {
  background: #E2E8F0;
}

/* ===== 响应式 ===== */
@media (max-width: 640px) {
  .page-hero {
    flex-direction: column;
    text-align: center;
    padding: 20px;
  }
  .option-choice {
    flex: 1 0 100%;
  }
  .judge-group {
    flex-direction: column;
  }
  .result-box {
    flex-direction: column;
    text-align: center;
  }
  .result-actions {
    flex-direction: column;
  }
  .manual-submit-area {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>