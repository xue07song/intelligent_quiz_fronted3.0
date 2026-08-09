<template>
  <div class="exam-practice">
    <!-- 加载中 -->
    <div v-if="loading" class="loading">试卷加载中...</div>

    <!-- 答题阶段 -->
    <div v-else-if="phase === 'exam'" class="exam-phase">
      <div class="exam-header">
        <div>
          <h2>{{ exam.title }}</h2>
          <p class="meta">
            共 {{ exam.questions.length }} 题 · 客观题 {{ objectiveCount }} 题 ·
            已答 {{ answeredCount }} 题 ·
            用时 {{ elapsedText }}
          </p>
        </div>
        <button class="btn-back" @click="handleExit">← 返回</button>
      </div>

      <div class="question-list">
        <div v-for="(q, idx) in exam.questions" :key="q.id" class="question-card">
          <div class="q-header">
            <span class="q-num">第 {{ idx + 1 }} 题</span>
            <span class="q-type" :class="getTypeClass(q.题型)">{{ getTypeName(q.题型) }}</span>
            <span class="q-difficulty">{{ getDifficultyLabel(q.难度) }}</span>
            <span v-if="!isObjective(q.题型)" class="q-subjective">人工批阅</span>
          </div>
          <div class="q-title">{{ q.题目 }}</div>
          <div v-if="q.选项" class="q-options">{{ q.选项 }}</div>

          <!-- 答题输入区 -->
          <div class="q-answer">
            <label>你的答案：</label>
            <!-- 判断题 -->
            <div v-if="Number(q.题型) === 1" class="radio-group">
              <label><input type="radio" :name="`q-${q.id}`" value="T" v-model="answers[q.id]" /> 对</label>
              <label><input type="radio" :name="`q-${q.id}`" value="F" v-model="answers[q.id]" /> 错</label>
            </div>
            <!-- 单选题 -->
            <div v-else-if="Number(q.题型) === 2" class="radio-group">
              <label v-for="opt in parseOptions(q.选项)" :key="opt.key">
                <input type="radio" :name="`q-${q.id}`" :value="opt.key" v-model="answers[q.id]" />
                {{ opt.key }}. {{ opt.text }}
              </label>
            </div>
            <!-- 多选题 -->
            <div v-else-if="Number(q.题型) === 3" class="checkbox-group">
              <label v-for="opt in parseOptions(q.选项)" :key="opt.key">
                <input type="checkbox" :value="opt.key" v-model="multiAnswers[q.id]" @change="syncMulti(q.id)" />
                {{ opt.key }}. {{ opt.text }}
              </label>
            </div>
            <!-- 填空题 -->
            <input v-else-if="Number(q.题型) === 4" v-model="answers[q.id]" class="input" placeholder="请输入答案" />
            <!-- 简答/程序题 -->
            <textarea v-else v-model="answers[q.id]" class="textarea" placeholder="请输入你的解答" rows="4"></textarea>
          </div>

          <!-- AI 答疑助手 -->
          <div class="ai-tutor">
            <button class="btn-ai" @click="toggleTutor(q.id)">
              {{ tutorOpen[q.id] ? '收起' : '🤖 问 AI' }}
            </button>
            <div v-if="tutorOpen[q.id]" class="tutor-panel">
              <div class="tutor-history">
                <div v-if="tutorHistory[q.id]?.length === 0" class="tutor-empty">
                  💡 遇到困难？向 AI 老师提问，获取解题思路提示。
                </div>
                <div v-for="(msg, mi) in tutorHistory[q.id] || []" :key="mi" class="tutor-msg" :class="msg.role">
                  <div class="msg-role">{{ msg.role === 'user' ? '🙋 我' : '🤖 AI' }}</div>
                  <div class="msg-content">{{ msg.content }}</div>
                </div>
                <div v-if="tutorLoading[q.id]" class="tutor-loading">AI 思考中...</div>
              </div>
              <div class="tutor-input">
                <input
                  v-model="tutorInput[q.id]"
                  class="input"
                  placeholder="输入你的问题，如：这道题该从哪个角度思考？"
                  @keyup.enter="askTutor(q)"
                  :disabled="tutorLoading[q.id]"
                />
                <button class="btn-send" :disabled="tutorLoading[q.id] || !tutorInput[q.id]?.trim()" @click="askTutor(q)">发送</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="submit-bar">
        <div class="submit-info">
          已答 {{ answeredCount }} / {{ exam.questions.length }} 题
          <span v-if="answeredCount < exam.questions.length" class="warn">（还有未作答的题目）</span>
        </div>
        <button class="btn-submit" :disabled="submitting" @click="handleSubmit">
          {{ submitting ? '提交中...' : '提交试卷' }}
        </button>
      </div>
    </div>

    <!-- 评分结果阶段 -->
    <div v-else-if="phase === 'result'" class="result-phase">
      <div class="result-card">
        <h2>🎉 答题完成</h2>
        <div class="score-display">
          <div class="score-big">{{ result.score }}</div>
          <div class="score-label">分</div>
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
          <div class="result-item correct">
            <span class="label">正确</span>
            <span class="value">{{ result.correctCount }}</span>
          </div>
          <div class="result-item wrong">
            <span class="label">错误</span>
            <span class="value">{{ result.wrongCount }}</span>
          </div>
          <div class="result-item skip">
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
        <div class="result-actions">
          <button class="btn-primary" @click="$emit('view-record', result.recordId)">查看详情</button>
          <button class="btn-cancel" @click="$emit('exit')">返回列表</button>
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
const phase = ref('exam'); // 'exam' | 'result'
const exam = ref({ questions: [] });
const answers = reactive({}); // 单选/判断/填空/简答: { [questionId]: string }
const multiAnswers = reactive({}); // 多选: { [questionId]: ['A','B'] }
const result = ref(null);

// ===== AI 答疑助手状态 =====
const tutorOpen = reactive({});      // { [questionId]: boolean }
const tutorInput = reactive({});     // { [questionId]: string }
const tutorHistory = reactive({});   // { [questionId]: [{role, content}] }
const tutorLoading = reactive({});   // { [questionId]: boolean }

const toggleTutor = (qid) => {
  tutorOpen[qid] = !tutorOpen[qid];
  if (!tutorHistory[qid]) tutorHistory[qid] = [];
};

const askTutor = async (q) => {
  const qid = q.id;
  const inputText = (tutorInput[qid] || '').trim();
  if (!inputText || tutorLoading[qid]) return;

  // 追加用户消息
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

// 计时
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

function getTypeClass(type) {
  const t = Number(type);
  if (t <= 2) return 'type-obj';
  if (t <= 4) return 'type-obj2';
  return 'type-sub';
}

// 解析选项文本，兼容多种格式：
// "A.北京 B.上海 C.广州 D.深圳"（空格分隔，同一行）
// "A.北京\nB.上海\nC.广州\nD.深圳"（换行分隔）
// "北京\n上海\n广州\n深圳"（无字母前缀）
function parseOptions(text) {
  if (!text) return [];
  const str = String(text).trim();

  // 先尝试换行分割
  const lines = str.split(/\n+/).filter(Boolean);

  // 多行：逐行解析
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

  // 单行：用正则按字母前缀拆分，如 "A.北京 B.上海 C.广州 D.深圳"
  const matches = [...str.matchAll(/([A-Fa-f])\s*[.、)）]\s*([^A-Fa-f]*)/g)];
  if (matches.length > 0) {
    return matches.map((m) => ({ key: m[1].toUpperCase(), text: m[2].trim() }));
  }

  // 无字母前缀：按空格/逗号分割
  const parts = str.split(/[，,;；\s]+/).filter(Boolean);
  return parts.map((p, i) => ({ key: String.fromCharCode(65 + i), text: p }));
}

function syncMulti(qid) {
  // 多选 → 拼接为 "ABC" 字符串
  const arr = multiAnswers[qid] || [];
  answers[qid] = arr.sort().join('');
}

function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const loadExam = async () => {
  loading.value = true;
  try {
    const data = await getExam(props.examId);
    exam.value = data;
    // 初始化答案容器
    data.questions.forEach((q) => {
      if (Number(q.题型) === 3) {
        multiAnswers[q.id] = [];
      } else {
        answers[q.id] = '';
      }
    });
    // 启动计时器：记录开始时间，用时间差实时计算（避免 setInterval 累加不精确）
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
    // 组装答案数组
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
.exam-practice {
  max-width: 900px;
  margin: 0 auto;
}
.loading {
  text-align: center;
  padding: 80px 0;
  color: #909399;
  font-size: 16px;
}
.exam-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}
.exam-header h2 {
  margin: 0 0 4px;
  font-size: 20px;
  color: #303133;
}
.meta {
  margin: 0;
  font-size: 13px;
  color: #909399;
}
.btn-back {
  padding: 6px 14px;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
}
.question-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.question-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.q-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.q-num {
  font-weight: 600;
  color: #303133;
  font-size: 15px;
}
.q-type {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #fff;
}
.q-type.type-obj { background: #409eff; }
.q-type.type-obj2 { background: #9254de; }
.q-type.type-sub { background: #e6a23c; }
.q-difficulty {
  font-size: 12px;
  color: #909399;
}
.q-subjective {
  font-size: 12px;
  color: #e6a23c;
  border: 1px solid #ffd591;
  border-radius: 4px;
  padding: 1px 6px;
}
.q-title {
  font-size: 15px;
  color: #303133;
  line-height: 1.7;
  margin-bottom: 8px;
}
.q-options {
  font-size: 14px;
  color: #606266;
  white-space: pre-wrap;
  background: #f9fafc;
  border-radius: 6px;
  padding: 10px 14px;
  margin-bottom: 8px;
}
.q-answer {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 10px;
}
.ai-tutor {
  margin-top: 12px;
  border-top: 1px dashed #ebeef5;
  padding-top: 10px;
}
.btn-ai {
  padding: 4px 12px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  color: #fff;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  font-size: 12px;
  transition: opacity 0.2s;
}
.btn-ai:hover { opacity: 0.9; }
.tutor-panel {
  margin-top: 10px;
  background: #f9fafc;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 12px;
}
.tutor-history {
  max-height: 240px;
  overflow-y: auto;
  margin-bottom: 10px;
}
.tutor-empty {
  text-align: center;
  color: #909399;
  font-size: 13px;
  padding: 16px 0;
}
.tutor-msg {
  margin-bottom: 10px;
}
.tutor-msg:last-child { margin-bottom: 0; }
.msg-role {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}
.msg-content {
  font-size: 14px;
  line-height: 1.6;
  padding: 8px 12px;
  border-radius: 6px;
  white-space: pre-wrap;
  word-break: break-word;
}
.tutor-msg.user .msg-content {
  background: #e6f7ff;
  color: #1890ff;
  margin-left: 24px;
}
.tutor-msg.ai .msg-content {
  background: #fff;
  border: 1px solid #ebeef5;
  color: #303133;
  margin-right: 24px;
}
.tutor-loading {
  text-align: center;
  color: #909399;
  font-size: 13px;
  padding: 8px 0;
}
.tutor-input {
  display: flex;
  gap: 8px;
}
.tutor-input .input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 14px;
}
.btn-send {
  padding: 8px 16px;
  background: #667eea;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}
.btn-send:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-send:hover:not(:disabled) { background: #5568d3; }
.q-answer > label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}
.radio-group, .checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.radio-group label, .checkbox-group label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #303133;
  cursor: pointer;
  padding: 4px 0;
}
.input {
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 14px;
}
.textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
  font-family: inherit;
  resize: vertical;
}
.submit-bar {
  position: sticky;
  bottom: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  padding: 14px 20px;
  border-radius: 8px;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.08);
  margin-top: 20px;
}
.submit-info {
  font-size: 14px;
  color: #606266;
}
.submit-info .warn {
  color: #e6a23c;
}
.btn-submit {
  padding: 10px 28px;
  background: #52c41a;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 15px;
}
.btn-submit:hover:not(:disabled) { background: #49b018; }
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

/* 结果页 */
.result-phase {
  display: flex;
  justify-content: center;
  padding-top: 40px;
}
.result-card {
  background: #fff;
  border-radius: 12px;
  padding: 36px 40px;
  width: 500px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}
.result-card h2 {
  margin: 0 0 20px;
  font-size: 22px;
  color: #303133;
}
.score-display {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
  margin-bottom: 24px;
}
.score-big {
  font-size: 64px;
  font-weight: 700;
  color: #52c41a;
  line-height: 1;
}
.score-label {
  font-size: 20px;
  color: #909399;
}
.result-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  margin-bottom: 24px;
}
.result-item {
  background: #f5f7fa;
  border-radius: 6px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.result-item.correct { background: #f0f9eb; }
.result-item.wrong { background: #fef0f0; }
.result-item.skip { background: #f4f4f5; }
.result-item .label {
  font-size: 12px;
  color: #909399;
}
.result-item .value {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}
.result-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
}
.btn-primary {
  padding: 10px 24px;
  background: #667eea;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}
.btn-cancel {
  padding: 10px 24px;
  background: #fff;
  color: #606266;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}
</style>
