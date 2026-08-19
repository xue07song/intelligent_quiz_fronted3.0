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
            <span>⏱ {{ remainingSeconds !== null ? `剩余 ${formatRemaining(remainingSeconds)}` : elapsedText }}</span>
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
              :key="qid(q)"
              type="button"
              class="answer-cell"
              :class="{
              answered: isAnswered(q),
              active: activeQuestionId === qid(q)
            }"
              @click="scrollToQuestion(qid(q))"
          >
            {{ idx + 1 }}
          </button>
        </div>
      </div>

      <!-- 题目列表 -->
      <div class="question-list">
        <div
            v-for="(q, idx) in exam.questions"
            :key="qid(q)"
            :id="`question-${qid(q)}`"
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
                  :class="{ active: favoriteSet.has(qid(q)) }"
                  :disabled="favoriteLoading[qid(q)]"
                  @click="toggleFavorite(q)"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                {{ favoriteSet.has(qid(q)) ? '已收藏' : '收藏' }}
              </button>
            </div>
          </div>

          <div class="q-title">{{ unescapeStem(q.题目) }}</div>

          <!-- 选项区域 -->
          <div v-if="[2, 3].includes(Number(q.题型)) && q.选项" class="q-options">
            <label
                v-for="opt in parseOptions(q.选项)"
                :key="opt.key"
                class="option-choice"
                :class="{
                selected: Number(q.题型) === 3
                  ? (multiAnswers[qid(q)] || []).includes(opt.key)
                  : answers[qid(q)] === opt.key
              }"
            >
              <input
                  v-if="Number(q.题型) === 2"
                  type="radio"
                  :name="`q-${qid(q)}`"
                  :value="opt.key"
                  v-model="answers[qid(q)]"
              />
              <input
                  v-else
                  type="checkbox"
                  :value="opt.key"
                  v-model="multiAnswers[qid(q)]"
                  @change="syncMulti(qid(q))"
              />
              <span class="option-text"><strong>{{ opt.key }}.</strong> {{ opt.text }}</span>
            </label>
          </div>

          <!-- 答题输入区 -->
          <div class="q-answer-area">
            <label class="q-answer-label">✏️ 你的答案：</label>

            <!-- 判断题 -->
            <div v-if="Number(q.题型) === 1" class="judge-group">
              <label class="judge-btn" :class="{ active: answers[qid(q)] === 'T' }">
                <input type="radio" :name="`q-${qid(q)}`" value="T" v-model="answers[qid(q)]" />
                ✅ 对
              </label>
              <label class="judge-btn" :class="{ active: answers[qid(q)] === 'F' }">
                <input type="radio" :name="`q-${qid(q)}`" value="F" v-model="answers[qid(q)]" />
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
                v-model="answers[qid(q)]"
                class="input-field"
                placeholder="请输入答案..."
            />

            <!-- 简答/程序题 -->
            <textarea
                v-else
                v-model="answers[qid(q)]"
                class="textarea-field"
                placeholder="请输入你的解答..."
                rows="4"
            ></textarea>
          </div>

          <!-- AI 答疑 -->
          <div class="ai-tutor">
            <button v-if="!examMode" class="btn-ai-tutor" @click="toggleTutor(qid(q))">
              🤖 {{ tutorOpen[qid(q)] ? '收起答疑' : '问 AI 老师' }}
            </button>
            <div v-if="!examMode && tutorOpen[qid(q)]" class="tutor-panel">
              <div class="tutor-history">
                <div v-if="!tutorHistory[qid(q)]?.length" class="tutor-empty">
                  💡 遇到困难？向 AI 老师提问，获取解题思路提示。
                </div>
                <div v-for="(msg, mi) in tutorHistory[qid(q)] || []" :key="mi" class="tutor-msg" :class="msg.role">
                  <div class="msg-role">{{ msg.role === 'user' ? '🙋 我' : '🤖 AI 老师' }}</div>
                  <div class="msg-content">{{ msg.content }}</div>
                </div>
                <div v-if="tutorLoading[qid(q)]" class="tutor-loading">
                  <span class="mini-spinner"></span> AI 思考中...
                </div>
              </div>
              <div class="tutor-input">
                <input
                    v-model="tutorInput[qid(q)]"
                    class="input-field"
                    placeholder="输入你的问题..."
                    @keyup.enter="askTutor(q)"
                    :disabled="tutorLoading[qid(q)]"
                />
                <button
                    class="btn-send"
                    :disabled="tutorLoading[qid(q)] || !tutorInput[qid(q)]?.trim()"
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
import { getExam, submitExam, startExamApi, getExamDraftApi, saveExamDraftApi } from '@/api/practice';
import { getFavorites, addFavorite, removeFavorite } from '@/api/student';
import { askTutor as askTutorApi } from '@/api/ai';
import { getTypeName, getDifficultyLabel } from '@/utils/constants';

const props = defineProps({
  examId: { type: [Number, String], required: true },
});

const emit = defineEmits(['exit', 'view-record', 'update-question-id', 'update-question', 'update-exam-id', 'toast']);

const OBJECTIVE_TYPES = [1, 2, 3, 4];

// ===== 状态 =====
const loading = ref(true);
const submitting = ref(false);
const phase = ref('exam');
const examMode = ref(false);
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
const remainingSeconds = ref(null);
const expired = ref(false);
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
    exam.value.questions?.filter((q) => isAnswered(q)).length || 0
);

const elapsedText = computed(() => formatDuration(elapsedSeconds.value));

const formatRemaining = (sec) => {
  const m = Math.floor(Number(sec) / 60);
  const s = Math.floor(Number(sec) % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// ===== 方法 =====
function qid(q) {
  // 统一用字符串 key，避免 number/string/NaN 混用导致的串值/找不到
  return String(q.id ?? q.question_id ?? q.questionId ?? '');
}

function unescapeStem(s) {
  if (s === null || s === undefined) return '';
  let t = String(s);
  // 反义：数据库里可能多转义一层，导致页面出现 \" 或 \\"
  t = t.replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\\\/g, '\\');
  return t;
}

function isObjective(type) {
  return OBJECTIVE_TYPES.includes(Number(type));
}

function isAnswered(q) {
  const k = qid(q);
  if (Number(q.题型) === 3) {
    return (multiAnswers[k] || []).length > 0;
  }
  const value = answers[k];
  return value !== undefined && value !== '' && value !== null;
}

function parseOptions(raw) {
  if (raw === null || raw === undefined) return [];
  // 1. 对象数组形式: [{ key:'A', text:'xxx' }] 或 { A:'xxx', B:'yyy' }
  if (Array.isArray(raw) && raw.length) {
    return raw
      .map((o, i) => {
        if (o && typeof o === 'object') {
          const k = String(o.key ?? o.opt ?? o.option ?? o.label ?? '').trim() || String.fromCharCode(65 + i);
          const t = String(o.text ?? o.value ?? o.content ?? o.answer ?? '').trim();
          return { key: k.toUpperCase().slice(0, 1) || String.fromCharCode(65 + i), text: stripOptionKey(t) };
        }
        const t = String(o).trim();
        return { key: String.fromCharCode(65 + i), text: stripOptionKey(t) };
      })
      .filter((o) => o.text);
  }
  if (raw && typeof raw === 'object') {
    const keys = Object.keys(raw);
    if (keys.length) {
      return keys
        .filter((k) => /^[A-Fa-f0-9]/.test(k))
        .map((k, idx) => {
          const letter = /^[A-Fa-f]/.test(k) ? k[0].toUpperCase() : String.fromCharCode(65 + idx);
          return { key: letter, text: stripOptionKey(String(raw[k] || '').trim()) };
        })
        .filter((o) => o.text);
    }
  }
  // 2. 字符串形式
  const str = String(raw).trim();
  if (!str) return [];
  const lines = str.split(/\r?\n+/).map((l) => l.trim()).filter(Boolean);
  if (lines.length > 1) {
    return lines.map((line, i) => {
      const m = line.match(/^([A-Fa-f])\s*[.、)）:：\-]?\s*(.*)$/);
      if (m) return { key: m[1].toUpperCase(), text: stripOptionKey(m[2].trim()) };
      return { key: String.fromCharCode(65 + i), text: stripOptionKey(line) };
    }).filter((o) => o.text);
  }
  // 单行: A.xx B.yy 或 A)xx B)yy
  const regex = /([A-Fa-f])\s*[.、)）:：\-]?\s*([^A-F].*?)(?=\s*[A-Fa-f]\s*[.、)）:：\-]|$)/g;
  const matches = [];
  let mm;
  while ((mm = regex.exec(str)) !== null) {
    matches.push({ key: mm[1].toUpperCase(), text: stripOptionKey(mm[2].trim()) });
  }
  if (matches.length > 1) return matches;
  // 兜底：用标点/空格分隔并分配字母
  const parts = str.split(/\s*[，,;；|｜]\s*/).filter(Boolean);
  if (parts.length > 1) {
    return parts.map((p, i) => ({ key: String.fromCharCode(65 + i), text: stripOptionKey(p.trim()) })).filter((o) => o.text);
  }
  return [{ key: 'A', text: stripOptionKey(str) }];
}

function stripOptionKey(t) {
  // 去掉文本前缀多余的 "A. / A) / A、" 等，防止显示为 "A. A. xxx"
  return String(t || '').replace(/^[A-Fa-f]\s*[.、)）:：\-]\s*/, '').trim();
}

function syncMulti(rawQid) {
  const k = String(rawQid);
  // 防御：若 multiAnswers[k] 被意外写成字符串/对象，先转成数组，避免 "arr is not iterable"
  let raw = multiAnswers[k];
  let arr;
  if (Array.isArray(raw)) {
    arr = raw.filter((v) => typeof v === 'string');
  } else if (raw === null || raw === undefined) {
    arr = [];
  } else if (typeof raw === 'string') {
    arr = raw.split('').filter((c) => /^[A-Fa-f]$/.test(c)).map((c) => c.toUpperCase());
  } else {
    arr = [];
  }
  multiAnswers[k] = arr;
  answers[k] = [...arr].sort().join('');
}

function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getDifficultyClass(level) {
  const map = { 1: 'diff-easy', 2: 'diff-easy', 3: 'diff-medium', 4: 'diff-hard', 5: 'diff-hard' };
  return map[Number(level)] || 'diff-easy';
}

function scoreClass(score) {
  if (score >= 90) return 'score-excellent';
  if (score >= 60) return 'score-pass';
  return 'score-fail';
}

function scrollToQuestion(qidRaw) {
  const k = String(qidRaw);
  activeQuestionId.value = k;
  emit('update-question-id', k);
  const el = document.getElementById(`question-${k}`);
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
  saveExamDraftApi(props.examId, {
    answers: { ...answers },
    durationSeconds: Math.floor(elapsedSeconds.value),
  }).catch(() => { /* 服务端草稿保存失败不影响本地答题 */ });
  draftSaved.value = true;
};

const normalizeQuestionKey = (raw) => String(raw ?? '');

const restoreDraft = (loadedExam, serverDraft = null) => {
  let draft = null;
  if (serverDraft?.answers && Object.keys(serverDraft.answers).length) {
    draft = { answers: serverDraft.answers, elapsedSeconds: serverDraft.duration_seconds ?? serverDraft.durationSeconds };
  } else {
    const raw = localStorage.getItem(draftKey());
    if (!raw) return false;
    try {
      draft = JSON.parse(raw);
    } catch {
      return false;
    }
  }
  try {
    if (!draft?.answers) return false;
    // 先把草稿 answers / multiAnswers 的 key 做一次归一化（兼容 number 与 string 两种 key）
    const normAnswers = Object.fromEntries(
      Object.entries(draft.answers).map(([k, v]) => [normalizeQuestionKey(k), v])
    );
    const normMulti = draft.multiAnswers
      ? Object.fromEntries(Object.entries(draft.multiAnswers).map(([k, v]) => [normalizeQuestionKey(k), Array.isArray(v) ? v : []]))
      : {};
    let restoredAny = false;
    loadedExam.questions.forEach((q) => {
      const k = qid(q);
      if (Number(q.题型) === 3) {
        const restored = normMulti[k] || [];
        multiAnswers[k] = restored;
        if (restored.length) {
          answers[k] = [...restored].sort().join('');
          restoredAny = true;
        } else if (normAnswers[k]) {
          // 后端 draft 可能只存 answers 字符串（例如 "AC"），拆回 multiAnswers
          const chars = String(normAnswers[k]).split('').filter((c) => /^[A-Fa-f]$/.test(c));
          multiAnswers[k] = chars.map((c) => c.toUpperCase());
          answers[k] = chars.sort().join('');
          restoredAny = restoredAny || chars.length > 0;
        }
      } else if (normAnswers[k] !== undefined) {
        answers[k] = normAnswers[k];
        if (answers[k] !== '' && answers[k] !== null && answers[k] !== undefined) restoredAny = true;
      }
    });
    if (draft.startedAt) {
      const start = new Date(draft.startedAt);
      if (!isNaN(start.getTime())) startedAt.value = start;
    }
    if (draft.elapsedSeconds !== undefined || draft.duration_seconds !== undefined) {
      elapsedSeconds.value = Math.max(0, Number(draft.elapsedSeconds ?? draft.duration_seconds) || 0);
    }
    return restoredAny;
  } catch {
    return false;
  }
};

// ===== 收藏 =====
const loadFavorites = async () => {
  try {
    const ids = new Set();
    let page = 1;
    let guard = 0;
    while (guard++ < 20) {
      const data = await getFavorites({ page, size: 100 });
      // 兼容后端返回的多种字段名
      const rows = Array.isArray(data) ? data : (data?.list || data?.rows || data?.items || []);
      rows.forEach((f) => {
        const v = f.questionId ?? f.question_id ?? f.id;
        if (v !== undefined && v !== null) ids.add(String(v));
      });
      const total = Number(data?.total ?? data?.totalCount ?? rows.length);
      if (rows.length === 0 || ids.size >= total) break;
      page += 1;
    }
    favoriteSet.value = ids;
  } catch (e) {
    // ignore
  }
};

const toggleFavorite = async (q) => {
  const qidStr = qid(q);
  if (!qidStr || qidStr === 'undefined' || qidStr === 'NaN') {
    emit('toast', { message: '题目ID异常，无法收藏', type: 'error' });
    return;
  }
  if (favoriteLoading[qidStr]) return;
  favoriteLoading[qidStr] = true;
  try {
    if (favoriteSet.value.has(qidStr)) {
      await removeFavorite(qidStr);
      const next = new Set(favoriteSet.value);
      next.delete(qidStr);
      favoriteSet.value = next;
      emit('toast', { message: '已取消收藏', type: 'success' });
    } else {
      await addFavorite(qidStr);
      const next = new Set(favoriteSet.value);
      next.add(qidStr);
      favoriteSet.value = next;
      emit('toast', { message: '已收藏', type: 'success' });
    }
  } catch (err) {
    emit('toast', { message: err.message || '收藏操作失败', type: 'error' });
  } finally {
    favoriteLoading[qidStr] = false;
  }
};

// ===== AI 答疑 =====
const toggleTutor = (rawQid) => {
  const k = String(rawQid);
  tutorOpen[k] = !tutorOpen[k];
  if (!tutorHistory[k]) tutorHistory[k] = [];
};

const askTutor = async (q) => {
  const k = qid(q);
  const inputText = (tutorInput[k] || '').trim();
  if (!inputText || tutorLoading[k]) return;

  tutorHistory[k].push({ role: 'user', content: inputText });
  tutorInput[k] = '';
  tutorLoading[k] = true;

  try {
    const data = await askTutorApi({
      question: q.题目,
      options: q.选项 || '',
      questionType: Number(q.题型),
      userQuestion: inputText,
      userAnswer: answers[k] || '',
      examId: props.examId,
    });
    tutorHistory[k].push({ role: 'ai', content: data.reply || '（AI 未返回内容）' });
  } catch (err) {
    tutorHistory[k].push({ role: 'ai', content: `❌ ${err.message || 'AI 调用失败'}` });
  } finally {
    tutorLoading[k] = false;
  }
};

// ===== 加载试卷 =====
const loadExam = async () => {
  loading.value = true;
  try {
    const data = await getExam(props.examId);
    exam.value = data;
    examMode.value = Boolean(data.duration_minutes || data.end_at || data.max_attempts || data.status === 'draft' || data.status === 'closed');
    const started = await startExamApi(props.examId);
    if (started?.startedAt) {
      const serverStart = new Date(started.startedAt);
      if (!isNaN(serverStart.getTime())) startedAt.value = serverStart;
    }
    remainingSeconds.value = started?.remainingSeconds ?? null;
    expired.value = remainingSeconds.value === 0;
    let serverDraft = null;
    try {
      serverDraft = await getExamDraftApi(props.examId);
    } catch { /* 无服务端草稿 */ }
    // 先清空旧状态（防止组件复用）
    Object.keys(answers).forEach((k) => delete answers[k]);
    Object.keys(multiAnswers).forEach((k) => delete multiAnswers[k]);
    data.questions.forEach((q) => {
      const k = qid(q);
      if (Number(q.题型) === 3) {
        multiAnswers[k] = [];
      } else {
        answers[k] = '';
      }
    });
    if (data.questions.length > 0) {
      const firstKey = qid(data.questions[0]);
      activeQuestionId.value = firstKey;
      emit('update-question-id', firstKey);
      emit('update-question', data.questions[0]);
      emit('update-exam-id', props.examId);
    }
    const restored = restoreDraft(data, serverDraft);
    if (!startedAt.value) startedAt.value = new Date();
    if (restored) {
      emit('toast', { message: '已恢复上次答题草稿', type: 'info' });
    }
    loadFavorites();
    timer = setInterval(() => {
      elapsedSeconds.value = Math.floor((Date.now() - startedAt.value.getTime()) / 1000);
      if (remainingSeconds.value !== null) {
        remainingSeconds.value = Math.max(0, remainingSeconds.value - 1);
        if (remainingSeconds.value <= 0) expired.value = true;
      }
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
  if (expired.value) {
    emit('toast', { message: '答题时间已到，无法提交', type: 'error' });
    return;
  }
  const qs = exam.value.questions || [];
  const total = qs.length;
  if (answeredCount.value < total) {
    if (!window.confirm(`还有 ${total - answeredCount.value} 题未作答，确定提交吗？`)) {
      return;
    }
  }
  submitting.value = true;
  try {
    const answersArr = qs.map((q) => {
      const k = qid(q);
      const ua = Number(q.题型) === 3
        ? (multiAnswers[k] || []).sort().join('')
        : (answers[k] || '');
      // 同时传 questionId / question_id 做兼容，避免后端只认某一种时出现 null
      return {
        questionId: q.id ?? q.questionId ?? q.question_id,
        question_id: q.id ?? q.question_id ?? q.questionId,
        userAnswer: ua,
      };
    });
    const data = await submitExam(props.examId, {
      answers: answersArr,
      startedAt: startedAt.value.toISOString(),
    });
    result.value = data;
    phase.value = 'result';
    if (timer) clearInterval(timer);
    emit('update-question-id', null);
    emit('update-question', null);
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
  emit('update-question', null);
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
