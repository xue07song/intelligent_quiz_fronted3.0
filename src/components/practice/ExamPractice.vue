<template>
  <div class="iq-exam-practice">
    <!-- 加载中 -->
    <div v-if="loading" class="iq-table-loading">
      <span class="iq-loading-spinner"></span>
      <span class="iq-text-sm iq-text-muted">试卷加载中...</span>
    </div>

    <!-- 答题阶段 -->
    <div v-else-if="phase === 'exam'" class="exam-phase">
      <div class="iq-card exam-header-card">
        <div class="exam-header">
          <div>
            <h2 class="iq-text-xl iq-font-semibold" style="color: var(--iq-neutral-900); margin: 0;">{{ exam.title }}</h2>
            <p class="iq-text-sm iq-text-muted" style="margin: 4px 0 0;">
              共 {{ exam.questions.length }} 题 · 客观题 {{ objectiveCount }} 题 ·
              已答 <span class="iq-text-primary iq-font-semibold">{{ answeredCount }}</span> 题 ·
              用时 <span class="iq-font-mono iq-text-base iq-font-semibold" style="color: var(--iq-neutral-800);">{{ elapsedText }}</span>
            </p>
          </div>
          <button class="iq-btn iq-btn-ghost" @click="handleExit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            返回列表
          </button>
        </div>
      </div>

      <div class="question-list">
        <div v-for="(q, idx) in exam.questions" :key="q.id" class="iq-card question-card">
          <div class="q-header">
            <span class="q-num">第 {{ idx + 1 }} 题</span>
            <span class="q-type-tag" :class="`type-${q.题型}`">{{ getTypeName(q.题型) }}</span>
            <span class="iq-tag iq-tag-neutral" style="font-size: 11px;">{{ getDifficultyLabel(q.难度) }}</span>
            <span v-if="Number(q.题型)>=4" class="iq-tag iq-tag-warning" style="font-size: 11px;">语义评阅 · 教师可复核</span>
          </div>
          <div class="q-title">{{ q.题目 }}</div>
          <div v-if="[2,3].includes(Number(q.题型)) && q.选项" class="q-options option-row"><label v-for="opt in parseOptions(q.选项)" :key="opt.key" :class="['option-choice',{selected:Number(q.题型)===3?(multiAnswers[q.id]||[]).includes(opt.key):answers[q.id]===opt.key}]"><input v-if="Number(q.题型)===2" type="radio" :name="`q-${q.id}`" :value="opt.key" v-model="answers[q.id]"><input v-else type="checkbox" :value="opt.key" v-model="multiAnswers[q.id]" @change="syncMulti(q.id)"><b>{{opt.key}}.</b> {{opt.text}}</label></div>

          <!-- 答题输入区 -->
          <div class="q-answer">
            <label class="q-answer-label">你的答案：</label>
            <!-- 判断题 -->
            <div v-if="Number(q.题型) === 1" class="iq-radio-group">
              <label class="iq-radio">
                <input type="radio" :name="`q-${q.id}`" value="T" v-model="answers[q.id]" />
                <span class="iq-radio-custom"></span>
                <span>对</span>
              </label>
              <label class="iq-radio">
                <input type="radio" :name="`q-${q.id}`" value="F" v-model="answers[q.id]" />
                <span class="iq-radio-custom"></span>
                <span>错</span>
              </label>
            </div>
            <!-- 单选题 -->
            <div v-else-if="Number(q.题型) === 2" class="choice-hint">请直接点击上方选项</div>
            <!-- 多选题 -->
            <div v-else-if="Number(q.题型) === 3" class="choice-hint">可直接点击上方一个或多个选项</div>
            <!-- 填空题 -->
            <input v-else-if="Number(q.题型) === 4" v-model="answers[q.id]" class="iq-input" placeholder="请输入答案" />
            <!-- 简答/程序题 -->
            <textarea v-else v-model="answers[q.id]" class="iq-textarea" placeholder="请输入你的解答" rows="4"></textarea>
          </div>

          <!-- AI 答疑助手 -->
          <div class="ai-tutor">
            <button class="iq-btn iq-btn-ghost iq-btn-sm ai-tutor-btn" @click="toggleTutor(q.id)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v1H7a3 3 0 0 0-3 3v2H3v4h1v2a3 3 0 0 0 3 3h2v1a3 3 0 0 0 6 0v-1h2a3 3 0 0 0 3-3v-2h1V9h-1V7a3 3 0 0 0-3-3h-2V5a3 3 0 0 0-3-3z"></path>
              </svg>
              {{ tutorOpen[q.id] ? '收起答疑' : '🤖 问 AI' }}
            </button>
            <div v-if="tutorOpen[q.id]" class="tutor-panel">
              <div class="tutor-history">
                <div v-if="tutorHistory[q.id]?.length === 0" class="tutor-empty">
                  💡 遇到困难？向 AI 老师提问，获取解题思路提示。
                </div>
                <div v-for="(msg, mi) in tutorHistory[q.id] || []" :key="mi" class="tutor-msg" :class="msg.role">
                  <div class="msg-role">{{ msg.role === 'user' ? '🙋 我' : '🤖 AI 老师' }}</div>
                  <div class="msg-content">{{ msg.content }}</div>
                </div>
                <div v-if="tutorLoading[q.id]" class="tutor-loading">
                  <span class="iq-loading-spinner" style="width: 14px; height: 14px; border-width: 2px;"></span>
                  AI 思考中...
                </div>
              </div>
              <div class="tutor-input">
                <input
                  v-model="tutorInput[q.id]"
                  class="iq-input"
                  placeholder="输入你的问题，如：这道题该从哪个角度思考？"
                  @keyup.enter="askTutor(q)"
                  :disabled="tutorLoading[q.id]"
                />
                <button class="iq-btn iq-btn-primary iq-btn-sm" :disabled="tutorLoading[q.id] || !tutorInput[q.id]?.trim()" @click="askTutor(q)">
                  发送
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="submit-bar iq-card">
        <div class="submit-info">
          已答 <span class="iq-text-primary iq-font-semibold iq-text-base">{{ answeredCount }}</span>
          <span class="iq-text-muted"> / {{ exam.questions.length }} 题</span>
          <span v-if="answeredCount < exam.questions.length" class="iq-tag iq-tag-warning" style="margin-left: 10px; font-size: 11px;">
            ⚠️ 还有 {{ exam.questions.length - answeredCount }} 题未作答
          </span>
        </div>
        <button class="iq-btn iq-btn-success" :disabled="submitting" @click="handleSubmit">
          <span v-if="submitting" class="iq-btn-spinner"></span>
          {{ submitting ? '提交中...' : '✓ 提交试卷' }}
        </button>
      </div>
    </div>

    <!-- 评分结果阶段 -->
    <div v-else-if="phase === 'result'" class="result-phase">
      <div class="iq-card result-card">
        <div class="result-emoji">🎉</div>
        <h2 class="iq-text-xl iq-font-semibold" style="color: var(--iq-neutral-900); margin: 0 0 4px;">答题完成</h2>
        <p class="iq-text-sm iq-text-muted" style="margin: 0 0 24px;">系统已自动完成客观题评分</p>

        <div class="score-display" :class="scoreClass(result.score)">
          <div class="score-num">{{ result.score }}</div>
          <div class="score-unit">分</div>
        </div>

        <div class="result-grid">
          <div class="result-item">
            <span class="label">准确率</span>
            <span class="value">{{ result.accuracy }}%</span>
          </div>
          <div class="result-item">
            <span class="label">总题数</span>
            <span class="value">{{ result.totalCount }}</span>
          </div>
          <div class="result-item">
            <span class="label">已答</span>
            <span class="value">{{ result.answeredCount }}</span>
          </div>
          <div class="result-item result-good">
            <span class="label">正确</span>
            <span class="value">{{ result.correctCount }}</span>
          </div>
          <div class="result-item result-bad">
            <span class="label">错误</span>
            <span class="value">{{ result.wrongCount }}</span>
          </div>
          <div class="result-item result-skip">
            <span class="label">未答</span>
            <span class="value">{{ result.skippedCount }}</span>
          </div>
          <div class="result-item">
            <span class="label">客观题</span>
            <span class="value">{{ result.objectiveCorrect }}/{{ result.objectiveTotal }}</span>
          </div>
          <div class="result-item">
            <span class="label">用时</span>
            <span class="value">{{ formatDuration(result.durationSeconds) }}</span>
          </div>
        </div>

        <div class="iq-flex iq-gap-2" style="justify-content: center; margin-top: 24px;">
          <button class="iq-btn iq-btn-primary" @click="$emit('view-record', result.recordId)">
            📋 查看详情
          </button>
          <button class="iq-btn iq-btn-secondary" @click="$emit('exit')">
            返回列表
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { getExam, submitExam } from '@/api/practice';
import { askTutor as askTutorApi } from '@/api/ai';
import { getTypeName, getDifficultyLabel } from '@/utils/constants';

const props = defineProps({
  examId: { type: [Number, String], required: true },
});

const emit = defineEmits(['exit', 'view-record', 'toast']);

const OBJECTIVE_TYPES = [1, 2, 3, 4];

const loading = ref(true);
const submitting = ref(false);
const phase = ref('exam');
const exam = ref({ questions: [] });
const answers = reactive({});
const multiAnswers = reactive({});
const result = ref(null);

const tutorOpen = reactive({});
const tutorInput = reactive({});
const tutorHistory = reactive({});
const tutorLoading = reactive({});

const toggleTutor = (qid) => {
  tutorOpen[qid] = !tutorOpen[qid];
  if (!tutorHistory[qid]) tutorHistory[qid] = [];
};

const askTutor = async (q) => {
  const qid = q.id;
  const inputText = (tutorInput[qid] || '').trim();
  if (!inputText || tutorLoading[qid]) return;

  tutorHistory[qid].push({ role: 'user', content: inputText });
  tutorInput[qid] = '';
  tutorLoading[qid] = true;

  try {
    const data = await askTutorApi({
      question: q.题目,
      options: q.选项 || '',
      questionType: Number(q.题型),
      userQuestion: inputText,
      userAnswer: answers[qid] || '',
    });
    tutorHistory[qid].push({ role: 'ai', content: data.reply || '（AI 未返回内容）' });
  } catch (err) {
    tutorHistory[qid].push({ role: 'ai', content: `❌ ${err.message || 'AI 调用失败'}` });
  } finally {
    tutorLoading[qid] = false;
  }
};

const startedAt = ref(null);
const elapsedSeconds = ref(0);
let timer = null;

const objectiveCount = computed(() =>
  exam.value.questions.filter((q) => isObjective(q.题型)).length
);

const answeredCount = computed(() =>
  exam.value.questions.filter((q) => {
    const a = answers[q.id];
    const m = multiAnswers[q.id];
    return (a !== undefined && a !== '') || (m && m.length > 0);
  }).length
);

const elapsedText = computed(() => formatDuration(elapsedSeconds.value));

function isObjective(type) {
  return OBJECTIVE_TYPES.includes(Number(type));
}

function parseOptions(text) {
  const str=String(text||'').trim();
  const markers=[...str.matchAll(/(?:^|\s)([A-Fa-f])\s*[.、．）)]\s*/g)];
  if(markers.length>1)return markers.map((marker,index)=>({key:marker[1].toUpperCase(),text:str.slice(marker.index+marker[0].length,markers[index+1]?.index??str.length).trim()}));
  return str.split(/\n+/).map(v=>v.trim()).filter(Boolean).map((value,index)=>({key:String.fromCharCode(65+index),text:value.replace(/^[A-Fa-f]\s*[.、．）)]?\s*/, '')}));
}

function legacyParseOptions(text) {
  if (!text) return [];
  const str = String(text).trim();
  const lines = str.split(/\n+/).filter(Boolean);
  if (lines.length > 1) {
    const result = [];
    for (const line of lines) {
      const match = line.match(/^([A-Fa-f])\s*[.、)）]?\s*(.*)/);
      if (match) {
        result.push({ key: match[1].toUpperCase(), text: match[2].trim() });
      } else {
        result.push({ key: String.fromCharCode(65 + result.length), text: line.trim() });
      }
    }
    return result;
  }
  const matches = [...str.matchAll(/([A-Fa-f])\s*[.、)）]\s*([^A-Fa-f]*)/g)];
  if (matches.length > 0) {
    return matches.map((m) => ({ key: m[1].toUpperCase(), text: m[2].trim() }));
  }
  const parts = str.split(/[，,;；\s]+/).filter(Boolean);
  return parts.map((p, i) => ({ key: String.fromCharCode(65 + i), text: p }));
}

function syncMulti(qid) {
  const arr = multiAnswers[qid] || [];
  answers[qid] = arr.sort().join('');
}

function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function scoreClass(score) {
  if (score >= 90) return 'score-excellent';
  if (score >= 60) return 'score-pass';
  return 'score-fail';
}

const loadExam = async () => {
  loading.value = true;
  try {
    const data = await getExam(props.examId);
    exam.value = data;
    data.questions.forEach((q) => {
      if (Number(q.题型) === 3) {
        multiAnswers[q.id] = [];
      } else {
        answers[q.id] = '';
      }
    });
    startedAt.value = new Date();
    timer = setInterval(() => {
      elapsedSeconds.value = Math.floor((Date.now() - startedAt.value.getTime()) / 1000);
    }, 1000);
  } catch (err) {
    emit('toast', { message: err.message || '加载试卷失败', type: 'error' });
    emit('exit');
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async () => {
  if (answeredCount.value < exam.value.questions.length) {
    if (!window.confirm(`还有 ${exam.value.questions.length - answeredCount.value} 题未作答，确定提交吗？`)) {
      return;
    }
  }
  submitting.value = true;
  try {
    const answersArr = exam.value.questions.map((q) => ({
      questionId: q.id,
      userAnswer: answers[q.id] || '',
    }));
    const data = await submitExam(props.examId, {
      answers: answersArr,
      startedAt: startedAt.value.toISOString(),
    });
    result.value = data;
    phase.value = 'result';
    if (timer) clearInterval(timer);
    emit('toast', { message: `提交成功！得分 ${data.score} 分`, type: 'success' });
  } catch (err) {
    emit('toast', { message: err.message || '提交失败', type: 'error' });
  } finally {
    submitting.value = false;
  }
};

const handleExit = () => {
  if (answeredCount.value > 0) {
    if (!window.confirm('答题进度将不会保存，确定退出吗？')) return;
  }
  emit('exit');
};

onMounted(() => {
  loadExam();
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
.iq-exam-practice {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 920px;
  margin: 0 auto;
  padding-bottom: 100px;
}
.iq-table-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 100px 0;
  background: var(--iq-card);
  border-radius: var(--iq-radius-card);
}
.iq-loading-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--iq-neutral-200);
  border-top-color: var(--iq-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.exam-header-card {
  padding: 20px 24px;
  background: linear-gradient(135deg, var(--iq-primary-50), #eef2ff);
  border: 1px solid var(--iq-primary-100);
}
.exam-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}
.question-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.question-card {
  padding: 22px 24px;
}
.q-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--iq-neutral-100);
}
.q-num {
  font-weight: 600;
  color: var(--iq-neutral-900);
  font-size: 15px;
}
.q-type-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: var(--iq-radius-full);
  font-size: 12px;
  font-weight: 500;
}
.type-1 { background: #ede9fe; color: #6d28d9; }
.type-2 { background: #dbeafe; color: #1d4ed8; }
.type-3 { background: #fce7f3; color: #be185d; }
.type-4 { background: #d1fae5; color: #047857; }
.type-5 { background: #fef3c7; color: #b45309; }
.type-6 { background: #ffedd5; color: #c2410c; }

.q-title {
  font-size: 15px;
  color: var(--iq-neutral-900);
  line-height: 1.8;
  margin-bottom: 10px;
  font-weight: 500;
}
.q-options {
  font-size: 14px;
  color: var(--iq-neutral-600);
  white-space: pre-wrap;
  background: var(--iq-neutral-50);
  border-radius: var(--iq-radius-medium);
  padding: 12px 14px;
  margin-bottom: 12px;
  line-height: 1.8;
  border: 1px solid var(--iq-neutral-100);
}
.option-row{display:flex;flex-wrap:wrap;gap:8px;white-space:normal}.option-choice{display:inline-flex;align-items:center;gap:5px;padding:9px 12px;border:1px solid var(--iq-neutral-200);border-radius:6px;background:#fff;cursor:pointer}.option-choice input{position:absolute;opacity:0;pointer-events:none}.option-choice.selected{border-color:var(--iq-primary);background:var(--iq-primary-50);color:var(--iq-primary-800)}.choice-hint{font-size:12px;color:var(--iq-neutral-500)}
.q-answer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}
.q-answer-label {
  font-size: 13px;
  color: var(--iq-neutral-700);
  font-weight: 600;
}
.iq-radio-group {
  display: flex;
  gap: 24px;
}
.iq-radio-col {
  flex-direction: column;
  gap: 10px;
}
.iq-radio {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: var(--iq-neutral-800);
  padding: 4px 0;
}
.iq-radio input { display: none; }
.iq-radio-custom {
  width: 18px;
  height: 18px;
  border: 2px solid var(--iq-neutral-300);
  border-radius: 50%;
  position: relative;
  flex-shrink: 0;
  transition: all 0.15s;
}
.iq-radio input:checked + .iq-radio-custom {
  border-color: var(--iq-primary);
}
.iq-radio input:checked + .iq-radio-custom::after {
  content: '';
  position: absolute;
  width: 10px;
  height: 10px;
  background: var(--iq-primary);
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
.iq-checkbox-group {
  display: flex;
  gap: 24px;
}
.iq-checkbox-col {
  flex-direction: column;
  gap: 10px;
}
.iq-checkbox-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: var(--iq-neutral-800);
  padding: 4px 0;
}
.iq-checkbox-item input { display: none; }
.iq-checkbox-custom {
  width: 18px;
  height: 18px;
  border: 2px solid var(--iq-neutral-300);
  border-radius: 4px;
  position: relative;
  flex-shrink: 0;
  transition: all 0.15s;
}
.iq-checkbox-item input:checked + .iq-checkbox-custom {
  border-color: var(--iq-primary);
  background: var(--iq-primary);
}
.iq-checkbox-item input:checked + .iq-checkbox-custom::after {
  content: '';
  position: absolute;
  width: 5px;
  height: 9px;
  border: 2px solid #fff;
  border-top: none;
  border-left: none;
  top: 2px;
  left: 5px;
  transform: rotate(45deg);
}
.ai-tutor {
  margin-top: 14px;
  border-top: 1px dashed var(--iq-neutral-200);
  padding-top: 12px;
}
.ai-tutor-btn {
  background: linear-gradient(135deg, var(--iq-primary-50), #faf5ff);
  color: var(--iq-primary-700);
  border: 1px solid var(--iq-primary-100);
}
.ai-tutor-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--iq-primary-100), #f3e8ff);
  color: var(--iq-primary-800);
  border-color: var(--iq-primary-200);
}
.tutor-panel {
  margin-top: 10px;
  background: var(--iq-neutral-50);
  border: 1px solid var(--iq-neutral-200);
  border-radius: var(--iq-radius-card);
  padding: 14px;
}
.tutor-history {
  max-height: 260px;
  overflow-y: auto;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.tutor-empty {
  text-align: center;
  color: var(--iq-neutral-500);
  font-size: 13px;
  padding: 20px 0;
}
.tutor-msg {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.msg-role {
  font-size: 11px;
  color: var(--iq-neutral-500);
  font-weight: 600;
}
.msg-content {
  font-size: 14px;
  line-height: 1.7;
  padding: 10px 12px;
  border-radius: var(--iq-radius-medium);
  white-space: pre-wrap;
  word-break: break-word;
}
.tutor-msg.user .msg-content {
  background: var(--iq-primary-50);
  color: var(--iq-primary-800);
  border: 1px solid var(--iq-primary-100);
  margin-left: 24px;
}
.tutor-msg.ai .msg-content {
  background: var(--iq-neutral-0);
  border: 1px solid var(--iq-neutral-200);
  color: var(--iq-neutral-800);
  margin-right: 24px;
}
.tutor-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--iq-neutral-500);
  font-size: 13px;
  padding: 10px 0;
}
.tutor-input {
  display: flex;
  gap: 8px;
}
.submit-bar {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: min(920px, calc(100% - 40px));
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  box-shadow: 0 -4px 20px -8px rgba(15, 23, 42, 0.15);
  z-index: 50;
}
.submit-info {
  font-size: 14px;
  color: var(--iq-neutral-600);
  display: flex;
  align-items: center;
}
.iq-text-primary {
  color: var(--iq-primary);
}
.iq-font-mono {
  font-family: var(--iq-font-mono);
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
  display: inline-block;
  vertical-align: middle;
}
.result-phase {
  display: flex;
  justify-content: center;
  padding-top: 20px;
}
.result-card {
  padding: 40px 48px;
  width: 560px;
  text-align: center;
}
.result-emoji {
  font-size: 56px;
  line-height: 1;
  margin-bottom: 12px;
}
.score-display {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 6px;
  margin: 24px 0 28px;
  padding: 24px;
  border-radius: var(--iq-radius-card);
}
.score-display.score-excellent {
  background: linear-gradient(135deg, #ecfdf5, #d1fae5);
}
.score-display.score-pass {
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
}
.score-display.score-fail {
  background: linear-gradient(135deg, #fef2f2, #fee2e2);
}
.score-num {
  font-size: 72px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -2px;
}
.score-excellent .score-num { color: #059669; }
.score-pass .score-num { color: #2563eb; }
.score-fail .score-num { color: #dc2626; }
.score-unit {
  font-size: 24px;
  color: var(--iq-neutral-500);
  font-weight: 600;
}
.result-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.result-item {
  background: var(--iq-neutral-50);
  border-radius: var(--iq-radius-medium);
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border: 1px solid var(--iq-neutral-100);
}
.result-item.result-good { background: #ecfdf5; border-color: #a7f3d0; }
.result-item.result-bad { background: #fef2f2; border-color: #fecaca; }
.result-item.result-skip { background: #f8fafc; border-color: var(--iq-neutral-200); }
.result-item .label {
  font-size: 12px;
  color: var(--iq-neutral-500);
}
.result-item .value {
  font-size: 20px;
  font-weight: 700;
  color: var(--iq-neutral-900);
}
.result-item.result-good .value { color: #059669; }
.result-item.result-bad .value { color: #dc2626; }
.iq-flex { display: flex; }
.iq-gap-2 { gap: 10px; }
</style>
