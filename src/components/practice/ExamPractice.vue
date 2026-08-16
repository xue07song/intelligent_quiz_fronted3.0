<template>
  <div class="exam-practice-page">
    <!-- ===== 顶部横幅（答题中） ===== -->
    <div v-if="phase === 'exam'" class="exam-header-banner">
      <div class="banner-left">
        <div class="banner-icon">📝</div>
        <div>
          <h2>{{ exam.title || '试卷' }}</h2>
          <div class="banner-meta">
            <span>共 {{ exam.questions?.length || 0 }} 题</span>
            <span class="dot">·</span>
            <span>客观题 {{ objectiveCount }} 题</span>
            <span class="dot">·</span>
            <span>已答 <strong class="answered-highlight">{{ answeredCount }}</strong> / {{ exam.questions?.length || 0 }} 题</span>
            <span class="dot">·</span>
            <span>⏱ {{ elapsedText }}</span>
            <span v-if="draftSaved" class="draft-badge">💾 草稿已存</span>
          </div>
        </div>
      </div>
      <div class="banner-right">
        <button class="btn-exit" @click="handleExit">
          ✕ 退出
        </button>
      </div>
    </div>

    <!-- ===== 加载中 ===== -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>试卷加载中...</p>
    </div>

    <!-- ===== 答题阶段 ===== -->
    <div v-else-if="phase === 'exam'" class="exam-body">
      <!-- 答题卡（题目数 > 4 时显示） -->
      <div v-if="exam.questions?.length > 4" class="answer-card-panel">
        <div class="answer-card-head">
          <span class="card-title">📋 答题卡</span>
          <span class="card-hint">已答 {{ answeredCount }} / {{ exam.questions?.length || 0 }}，点击编号跳转</span>
        </div>
        <div class="answer-card-grid">
          <button
              v-for="(q, idx) in exam.questions"
              :key="q.id"
              type="button"
              class="answer-cell"
              :class="{
              answered: isAnswered(q),
              active: activeQuestionId === q.id
            }"
              @click="scrollToQuestion(q.id)"
          >
            {{ idx + 1 }}
          </button>
        </div>
      </div>

      <!-- 题目列表 -->
      <div class="question-list">
        <div
            v-for="(q, idx) in exam.questions"
            :key="q.id"
            :id="`question-${q.id}`"
            class="question-card"
        >
          <div class="q-header">
            <div class="q-header-left">
              <span class="q-number">第 {{ idx + 1 }} 题</span>
              <span class="q-type-tag" :class="`type-${q.题型}`">
                {{ getTypeName(q.题型) }}
              </span>
              <span class="q-difficulty-tag" :class="getDifficultyClass(q.难度)">
                {{ getDifficultyLabel(q.难度) }}
              </span>
              <span v-if="!isObjective(q.题型)" class="q-manual-tag">📝 人工批阅</span>
            </div>
            <div class="q-header-right">
              <button
                  type="button"
                  class="btn-favorite"
                  :class="{ active: favoriteSet.has(String(q.id)) }"
                  :disabled="favoriteLoading[q.id]"
                  @click="toggleFavorite(q)"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                {{ favoriteSet.has(String(q.id)) ? '已收藏' : '收藏' }}
              </button>
            </div>
          </div>

          <div class="q-title">{{ q.题目 }}</div>

          <!-- 选项区域 -->
          <div v-if="[2, 3].includes(Number(q.题型)) && q.选项" class="q-options">
            <label
                v-for="opt in parseOptions(q.选项)"
                :key="opt.key"
                class="option-choice"
                :class="{
                selected: Number(q.题型) === 3
                  ? (multiAnswers[q.id] || []).includes(opt.key)
                  : answers[q.id] === opt.key
              }"
            >
              <input
                  v-if="Number(q.题型) === 2"
                  type="radio"
                  :name="`q-${q.id}`"
                  :value="opt.key"
                  v-model="answers[q.id]"
              />
              <input
                  v-else
                  type="checkbox"
                  :value="opt.key"
                  v-model="multiAnswers[q.id]"
                  @change="syncMulti(q.id)"
              />
              <span class="option-key">{{ opt.key }}.</span>
              <span class="option-text">{{ opt.text }}</span>
            </label>
          </div>

          <!-- 答题输入区 -->
          <div class="q-answer-area">
            <label class="q-answer-label">✏️ 你的答案：</label>

            <!-- 判断题 -->
            <div v-if="Number(q.题型) === 1" class="judge-group">
              <label class="judge-btn" :class="{ active: answers[q.id] === 'T' }">
                <input type="radio" :name="`q-${q.id}`" value="T" v-model="answers[q.id]" />
                ✅ 对
              </label>
              <label class="judge-btn" :class="{ active: answers[q.id] === 'F' }">
                <input type="radio" :name="`q-${q.id}`" value="F" v-model="answers[q.id]" />
                ❌ 错
              </label>
            </div>

            <!-- 单选题/多选题提示 -->
            <div v-else-if="Number(q.题型) === 2" class="choice-hint">
              👆 请直接点击上方选项
            </div>
            <div v-else-if="Number(q.题型) === 3" class="choice-hint">
              👆 请直接点击上方选项（可多选）
            </div>

            <!-- 填空题 -->
            <input
                v-else-if="Number(q.题型) === 4"
                v-model="answers[q.id]"
                class="input-field"
                placeholder="请输入答案..."
            />

            <!-- 简答/程序题 -->
            <textarea
                v-else
                v-model="answers[q.id]"
                class="textarea-field"
                placeholder="请输入你的解答..."
                rows="4"
            ></textarea>
          </div>

          <!-- AI 答疑 -->
          <div class="ai-tutor">
            <button class="btn-ai-tutor" @click="toggleTutor(q.id)">
              🤖 {{ tutorOpen[q.id] ? '收起答疑' : '问 AI 老师' }}
            </button>
            <div v-if="tutorOpen[q.id]" class="tutor-panel">
              <div class="tutor-history">
                <div v-if="!tutorHistory[q.id]?.length" class="tutor-empty">
                  💡 遇到困难？向 AI 老师提问，获取解题思路提示。
                </div>
                <div v-for="(msg, mi) in tutorHistory[q.id] || []" :key="mi" class="tutor-msg" :class="msg.role">
                  <div class="msg-role">{{ msg.role === 'user' ? '🙋 我' : '🤖 AI 老师' }}</div>
                  <div class="msg-content">{{ msg.content }}</div>
                </div>
                <div v-if="tutorLoading[q.id]" class="tutor-loading">
                  <span class="mini-spinner"></span> AI 思考中...
                </div>
              </div>
              <div class="tutor-input">
                <input
                    v-model="tutorInput[q.id]"
                    class="input-field"
                    placeholder="输入你的问题..."
                    @keyup.enter="askTutor(q)"
                    :disabled="tutorLoading[q.id]"
                />
                <button
                    class="btn-send"
                    :disabled="tutorLoading[q.id] || !tutorInput[q.id]?.trim()"
                    @click="askTutor(q)"
                >
                  发送
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== 底部提交栏 ===== -->
      <div class="submit-bar">
        <div class="submit-info">
          已答 <strong class="answered-highlight">{{ answeredCount }}</strong>
          <span class="text-muted">/ {{ exam.questions?.length || 0 }} 题</span>
          <span v-if="answeredCount < (exam.questions?.length || 0)" class="warn-tag">
            ⚠️ 还有 {{ (exam.questions?.length || 0) - answeredCount }} 题未作答
          </span>
        </div>
        <button class="btn-submit" :disabled="submitting" @click="handleSubmit">
          <span v-if="submitting" class="btn-spinner"></span>
          {{ submitting ? '提交中...' : '📤 提交试卷' }}
        </button>
      </div>
    </div>

    <!-- ===== 结果阶段 ===== -->
    <div v-else-if="phase === 'result'" class="result-phase">
      <div class="result-card">
        <div class="result-emoji">🎉</div>
        <h2>答题完成！</h2>
        <p class="result-sub">系统已自动完成客观题评分</p>

        <div class="score-display" :class="scoreClass(result.score)">
          <span class="score-number">{{ result.score }}</span>
          <span class="score-unit">分</span>
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
          <div class="result-item result-good">
            <span class="label">✅ 正确</span>
            <span class="value">{{ result.correctCount }}</span>
          </div>
          <div class="result-item result-bad">
            <span class="label">❌ 错误</span>
            <span class="value">{{ result.wrongCount }}</span>
          </div>
          <div class="result-item result-skip">
            <span class="label">⏭ 未答</span>
            <span class="value">{{ result.skippedCount }}</span>
          </div>
          <div class="result-item">
            <span class="label">⏱ 用时</span>
            <span class="value">{{ formatDuration(result.durationSeconds) }}</span>
          </div>
        </div>

        <div class="result-actions">
          <button class="btn-primary" @click="$emit('view-record', result.recordId)">
            📋 查看详情
          </button>
          <button class="btn-secondary" @click="$emit('exit')">
            返回列表
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue';
import { getExam, submitExam } from '@/api/practice';
import { getFavorites, addFavorite, removeFavorite } from '@/api/student';
import { askTutor as askTutorApi } from '@/api/ai';
import { getTypeName, getDifficultyLabel } from '@/utils/constants';

const props = defineProps({
  examId: { type: [Number, String], required: true },
});

const emit = defineEmits(['exit', 'view-record', 'update-question-id', 'update-exam-id', 'toast']);

const OBJECTIVE_TYPES = [1, 2, 3, 4];

// ===== 状态 =====
const loading = ref(true);
const submitting = ref(false);
const phase = ref('exam');
const exam = ref({ questions: [] });
const answers = reactive({});
const multiAnswers = reactive({});
const result = ref(null);
const favoriteSet = ref(new Set());
const favoriteLoading = reactive({});
const draftSaved = ref(false);
const activeQuestionId = ref(null);
const startedAt = ref(null);
const elapsedSeconds = ref(0);
let timer = null;
let draftTimer = null;

// ===== AI 答疑 =====
const tutorOpen = reactive({});
const tutorInput = reactive({});
const tutorHistory = reactive({});
const tutorLoading = reactive({});

// ===== 计算属性 =====
const objectiveCount = computed(() =>
    exam.value.questions?.filter((q) => isObjective(q.题型)).length || 0
);

const answeredCount = computed(() =>
    exam.value.questions?.filter((q) => {
      const a = answers[q.id];
      const m = multiAnswers[q.id];
      return (a !== undefined && a !== '') || (m && m.length > 0);
    }).length || 0
);

const elapsedText = computed(() => formatDuration(elapsedSeconds.value));

// ===== 方法 =====
function isObjective(type) {
  return OBJECTIVE_TYPES.includes(Number(type));
}

function isAnswered(q) {
  if (Number(q.题型) === 3) {
    return (multiAnswers[q.id] || []).length > 0;
  }
  const value = answers[q.id];
  return value !== undefined && value !== '';
}

function parseOptions(text) {
  if (!text) return [];
  const str = String(text).trim();
  const lines = str.split(/\n+/).filter(Boolean);
  if (lines.length > 1) {
    return lines.map((line) => {
      const match = line.match(/^([A-Fa-f])\s*[.、)）]?\s*(.*)/);
      if (match) {
        return { key: match[1].toUpperCase(), text: match[2].trim() };
      }
      return { key: String.fromCharCode(65 + lines.indexOf(line)), text: line.trim() };
    });
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

function getDifficultyClass(level) {
  const map = { 1: 'diff-easy', 2: 'diff-medium', 3: 'diff-hard' };
  return map[level] || 'diff-easy';
}

function scoreClass(score) {
  if (score >= 90) return 'score-excellent';
  if (score >= 60) return 'score-pass';
  return 'score-fail';
}

function scrollToQuestion(qid) {
  activeQuestionId.value = qid;
  emit('update-question-id', qid);
  const el = document.getElementById(`question-${qid}`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== 草稿 =====
const draftKey = () => `iq_exam_draft_${props.examId}`;

const saveDraft = () => {
  if (!exam.value.questions?.length || answeredCount.value === 0) return;
  const payload = {
    answers: { ...answers },
    multiAnswers: Object.fromEntries(Object.entries(multiAnswers).map(([k, v]) => [k, [...v]])),
    startedAt: startedAt.value ? startedAt.value.toISOString() : null,
    elapsedSeconds: elapsedSeconds.value,
    savedAt: Date.now(),
  };
  localStorage.setItem(draftKey(), JSON.stringify(payload));
  draftSaved.value = true;
};

const restoreDraft = (loadedExam) => {
  const raw = localStorage.getItem(draftKey());
  if (!raw) return false;
  try {
    const draft = JSON.parse(raw);
    if (!draft?.answers) return false;
    loadedExam.questions.forEach((q) => {
      const qid = q.id;
      if (Number(q.题型) === 3) {
        const restored = Array.isArray(draft.multiAnswers?.[qid]) ? draft.multiAnswers[qid] : [];
        multiAnswers[qid] = restored;
        if (restored.length) answers[qid] = [...restored].sort().join('');
      } else if (draft.answers[qid] !== undefined) {
        answers[qid] = draft.answers[qid];
      }
    });
    if (draft.startedAt) {
      const start = new Date(draft.startedAt);
      if (!isNaN(start.getTime())) startedAt.value = start;
    }
    elapsedSeconds.value = Math.max(0, Number(draft.elapsedSeconds) || 0);
    return true;
  } catch {
    return false;
  }
};

// ===== 收藏 =====
const loadFavorites = async () => {
  try {
    const ids = new Set();
    let page = 1;
    while (true) {
      const data = await getFavorites({ page, size: 100 });
      const rows = data.list || [];
      rows.forEach((f) => ids.add(String(f.questionId)));
      if (rows.length === 0 || ids.size >= Number(data.total || 0)) break;
      page += 1;
    }
    favoriteSet.value = ids;
  } catch {
    // ignore
  }
};

const toggleFavorite = async (q) => {
  const qid = String(q.id);
  if (favoriteLoading[qid]) return;
  favoriteLoading[qid] = true;
  try {
    if (favoriteSet.value.has(qid)) {
      await removeFavorite(qid);
      const next = new Set(favoriteSet.value);
      next.delete(qid);
      favoriteSet.value = next;
      emit('toast', { message: '已取消收藏', type: 'success' });
    } else {
      await addFavorite(qid);
      const next = new Set(favoriteSet.value);
      next.add(qid);
      favoriteSet.value = next;
      emit('toast', { message: '已收藏', type: 'success' });
    }
  } catch (err) {
    emit('toast', { message: err.message || '收藏操作失败', type: 'error' });
  } finally {
    favoriteLoading[qid] = false;
  }
};

// ===== AI 答疑 =====
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

// ===== 加载试卷 =====
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
    if (data.questions.length > 0) {
      activeQuestionId.value = data.questions[0].id;
      emit('update-question-id', data.questions[0].id);
      emit('update-exam-id', props.examId);
    }
    const restored = restoreDraft(data);
    if (!startedAt.value) startedAt.value = new Date();
    if (restored) {
      emit('toast', { message: '已恢复上次答题草稿', type: 'info' });
    }
    loadFavorites();
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

// ===== 提交 =====
const handleSubmit = async () => {
  const total = exam.value.questions?.length || 0;
  if (answeredCount.value < total) {
    if (!window.confirm(`还有 ${total - answeredCount.value} 题未作答，确定提交吗？`)) {
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
    emit('update-question-id', null);
    emit('update-exam-id', null);
    localStorage.removeItem(draftKey());
    draftSaved.value = false;
    emit('toast', { message: `提交成功！得分 ${data.score} 分`, type: 'success' });
  } catch (err) {
    emit('toast', { message: err.message || '提交失败', type: 'error' });
  } finally {
    submitting.value = false;
  }
};

const handleExit = () => {
  if (answeredCount.value > 0) {
    if (!window.confirm('答题进度已保存，确定退出吗？')) return;
  }
  emit('update-question-id', null);
  emit('update-exam-id', null);
  emit('exit');
};

// ===== 监听 =====
watch([answers, multiAnswers], () => {
  if (!exam.value.questions?.length) return;
  clearTimeout(draftTimer);
  draftTimer = setTimeout(saveDraft, 400);
}, { deep: true });

// ===== 生命周期 =====
onMounted(() => {
  loadExam();
});

onUnmounted(() => {
  clearTimeout(draftTimer);
  if (phase.value === 'exam' && exam.value.questions?.length && answeredCount.value > 0) saveDraft();
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
/* ===== 页面容器 ===== */
.exam-practice-page {
  max-width: 900px;
  margin: 0 auto;
  padding-bottom: 100px;
}

/* ===== 顶部横幅 ===== */
.exam-header-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 28px;
  background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%);
  border-radius: 16px;
  border: 1px solid #C7D2FE;
  margin-bottom: 24px;
}
.banner-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.banner-icon { font-size: 32px; }
.banner-left h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #1E293B;
}
.banner-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #64748B;
}
.banner-meta .dot { color: #CBD5E1; }
.answered-highlight { color: #6366F1; font-weight: 700; }
.draft-badge {
  font-size: 11px;
  padding: 2px 10px;
  background: #DCFCE7;
  color: #15803D;
  border-radius: 12px;
  margin-left: 6px;
}
.btn-exit {
  padding: 6px 16px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  background: #fff;
  color: #64748B;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.btn-exit:hover { background: #F1F5F9; }

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

/* ===== 答题卡 ===== */
.answer-card-panel {
  background: #fff;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 20px;
}
.answer-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}
.answer-card-head .card-title {
  font-weight: 600;
  font-size: 14px;
  color: #1E293B;
}
.answer-card-head .card-hint {
  font-size: 12px;
  color: #94A3B8;
}
.answer-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
  gap: 8px;
}
.answer-cell {
  height: 36px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  background: #F8FAFC;
  color: #64748B;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.answer-cell:hover { border-color: #C7D2FE; }
.answer-cell.answered {
  background: #DCFCE7;
  border-color: #86EFAC;
  color: #15803D;
}
.answer-cell.active {
  background: #6366F1;
  border-color: #6366F1;
  color: #fff;
}

/* ===== 题目列表 ===== */
.question-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.question-card {
  background: #fff;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 22px 24px;
  scroll-margin-top: 80px;
}

/* 题目头部 */
.q-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #F1F5F9;
}
.q-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.q-number {
  font-weight: 600;
  font-size: 14px;
  color: #1E293B;
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

.q-difficulty-tag {
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 12px;
}
.diff-easy { background: #DCFCE7; color: #15803D; }
.diff-medium { background: #FEF3C7; color: #B45309; }
.diff-hard { background: #FEE2E2; color: #B91C1C; }

.q-manual-tag {
  font-size: 11px;
  padding: 2px 10px;
  background: #FEF3C7;
  color: #B45309;
  border-radius: 12px;
}
.btn-favorite {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border: 1px solid #E2E8F0;
  border-radius: 16px;
  background: #fff;
  color: #94A3B8;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.btn-favorite:hover { border-color: #FCD34D; background: #FFFBEB; }
.btn-favorite.active {
  background: #FEF3C7;
  border-color: #FBBF24;
  color: #B45309;
}

/* 题目内容 */
.q-title {
  font-size: 15px;
  font-weight: 500;
  color: #1E293B;
  line-height: 1.8;
  margin-bottom: 12px;
}

/* 选项 */
.q-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
}
.option-choice {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  color: #475569;
  min-width: 80px;
}
.option-choice:hover { border-color: #C7D2FE; }
.option-choice.selected {
  border-color: #6366F1;
  background: #EEF2FF;
  color: #4338CA;
}
.option-choice input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
.option-key { font-weight: 600; }

/* 答题区 */
.q-answer-area {
  margin-top: 6px;
  padding-top: 12px;
  border-top: 1px dashed #E2E8F0;
}
.q-answer-label {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  display: block;
  margin-bottom: 8px;
}
.judge-group {
  display: flex;
  gap: 16px;
}
.judge-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  font-family: inherit;
}
.judge-btn:hover { border-color: #C7D2FE; }
.judge-btn.active {
  border-color: #6366F1;
  background: #EEF2FF;
}
.judge-btn input { display: none; }

.choice-hint {
  font-size: 13px;
  color: #94A3B8;
  padding: 4px 0;
}
.input-field {
  width: 100%;
  padding: 8px 14px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.2s;
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

/* ===== AI 答疑 ===== */
.ai-tutor {
  margin-top: 14px;
  border-top: 1px dashed #E2E8F0;
  padding-top: 14px;
}
.btn-ai-tutor {
  padding: 6px 16px;
  border: 1px solid #C7D2FE;
  border-radius: 20px;
  background: #EEF2FF;
  color: #4338CA;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.btn-ai-tutor:hover { background: #E0E7FF; }
.tutor-panel {
  margin-top: 10px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 14px;
}
.tutor-history {
  max-height: 260px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
}
.tutor-empty {
  text-align: center;
  color: #94A3B8;
  font-size: 13px;
  padding: 16px 0;
}
.tutor-msg {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.msg-role {
  font-size: 11px;
  font-weight: 600;
  color: #94A3B8;
}
.msg-content {
  font-size: 14px;
  line-height: 1.7;
  padding: 10px 14px;
  border-radius: 8px;
  white-space: pre-wrap;
}
.tutor-msg.user .msg-content {
  background: #EEF2FF;
  color: #4338CA;
  margin-left: 20px;
}
.tutor-msg.ai .msg-content {
  background: #fff;
  border: 1px solid #E2E8F0;
  color: #1E293B;
  margin-right: 20px;
}
.tutor-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #94A3B8;
  font-size: 13px;
  padding: 8px 0;
}
.mini-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid #E2E8F0;
  border-top: 2px solid #6366F1;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
}
.tutor-input {
  display: flex;
  gap: 8px;
}
.tutor-input .input-field { flex: 1; }
.btn-send {
  padding: 8px 18px;
  background: #6366F1;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
}
.btn-send:hover:not(:disabled) { background: #4F46E5; }
.btn-send:disabled { opacity: 0.5; cursor: not-allowed; }

/* ===== 底部提交栏 ===== */
.submit-bar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: min(900px, 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  background: #fff;
  border: 1px solid #E2E8F0;
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -4px 20px rgba(15, 23, 42, 0.08);
  z-index: 50;
}
.submit-info {
  font-size: 14px;
  color: #64748B;
}
.submit-info .text-muted { color: #94A3B8; }
.warn-tag {
  font-size: 12px;
  padding: 2px 10px;
  background: #FEF3C7;
  color: #B45309;
  border-radius: 12px;
  margin-left: 8px;
}
.btn-submit {
  padding: 10px 28px;
  background: #10B981;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.btn-submit:hover:not(:disabled) { background: #059669; }
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top: 2px solid #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  margin-right: 8px;
  vertical-align: middle;
}

/* ===== 结果页 ===== */
.result-phase {
  display: flex;
  justify-content: center;
  padding-top: 20px;
}
.result-card {
  background: #fff;
  border: 1px solid #E2E8F0;
  border-radius: 16px;
  padding: 40px 48px;
  width: 560px;
  max-width: 100%;
  text-align: center;
}
.result-emoji { font-size: 56px; margin-bottom: 8px; }
.result-card h2 {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 4px;
  color: #1E293B;
}
.result-sub {
  color: #94A3B8;
  font-size: 14px;
  margin: 0 0 24px;
}
.score-display {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 6px;
  padding: 20px 30px;
  border-radius: 12px;
  margin-bottom: 24px;
}
.score-excellent { background: #ECFDF5; }
.score-pass { background: #EEF2FF; }
.score-fail { background: #FEF2F2; }

.score-number {
  font-size: 64px;
  font-weight: 800;
  line-height: 1;
}
.score-excellent .score-number { color: #059669; }
.score-pass .score-number { color: #4338CA; }
.score-fail .score-number { color: #DC2626; }

.score-unit {
  font-size: 20px;
  color: #94A3B8;
  font-weight: 600;
}
.result-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 24px;
}
.result-item {
  background: #F8FAFC;
  border-radius: 8px;
  padding: 12px 10px;
}
.result-item .label {
  display: block;
  font-size: 12px;
  color: #94A3B8;
  margin-bottom: 2px;
}
.result-item .value {
  font-size: 20px;
  font-weight: 700;
  color: #1E293B;
}
.result-item.result-good .value { color: #059669; }
.result-item.result-bad .value { color: #DC2626; }
.result-item.result-skip .value { color: #94A3B8; }

.result-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
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
.btn-primary:hover { background: #4F46E5; }
.btn-secondary {
  padding: 10px 28px;
  background: #F1F5F9;
  color: #475569;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}
.btn-secondary:hover { background: #E2E8F0; }

@media (max-width: 640px) {
  .exam-header-banner { flex-direction: column; text-align: center; }
  .banner-left { flex-direction: column; }
  .result-card { padding: 24px 20px; }
  .result-grid { grid-template-columns: repeat(2, 1fr); }
  .submit-bar { flex-direction: column; gap: 10px; padding: 12px 16px; }
}
</style>