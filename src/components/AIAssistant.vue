<template>
  <div class="ai-assistant">
    <div v-if="hintVisible && !open" class="ai-hint" @click="hintVisible = false">
      有问题？点我试试 👋
    </div>

    <button
      class="ai-ball"
      :style="ballStyle"
      :aria-label="open ? '收起智能助手' : '打开智能助手'"
      @click="toggleOpen"
    >
      💬
    </button>

    <Teleport to="body">
      <div v-if="open" class="ai-panel" :style="panelStyle">
        <div
          class="ai-drag-handle"
          @pointerdown="startDrag"
          @pointermove="onDrag"
          @pointerup="endDrag"
          @pointercancel="endDrag"
        >
          <span>🤖 智能助手</span>
          <button class="ai-close" @click.stop="closePanel()" @pointerdown.stop aria-label="关闭">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div ref="messageListRef" class="ai-messages">
          <div v-if="messages.length === 0" class="ai-welcome">
            <p>你好，我是智能助手 👋</p>
            <p>可以问我怎么开始做题、错题本在哪，也可以帮你组卷、找同类题或浓缩错题。</p>
          </div>
          <div
            v-for="(msg, index) in messages"
            :key="index"
            class="ai-msg"
            :class="msg.role"
          >
            <div class="ai-bubble" v-html="renderMarkdown(msg.content)"></div>

            <div v-if="msg.type === 'exam' && msg.data?.examId" class="ai-actions">
              <button class="ai-action-btn" @click="$emit('start-exam', msg.data.examId)">去练习页查看</button>
            </div>

            <div v-else-if="msg.type === 'similar' && msg.questions?.length" class="ai-similar">
              <div v-for="q in msg.questions" :key="q.id" class="ai-similar-item">
                <div class="ai-similar-head">
                  <span class="ai-similar-id">{{ q.id }}</span>
                  <span class="ai-similar-type">{{ getTypeName(q.题型) }}</span>
                </div>
                <div class="ai-similar-title">{{ q.题目 }}</div>
                <div v-if="q.选项" class="ai-similar-options">{{ q.选项 }}</div>
              </div>
              <button v-if="msg.data?.examId" class="ai-action-btn" @click="$emit('start-exam', msg.data.examId)">去练习</button>
            </div>
          </div>

          <div v-if="sending" class="ai-msg assistant">
            <div class="ai-bubble ai-thinking">正在思考...</div>
          </div>
        </div>

        <div class="ai-input-area">
          <div v-if="showExamForm" class="ai-exam-form">
            <label>
              <span>章节</span>
              <select v-model="examForm.chapter" class="ai-select">
                <option value="">不限</option>
                <option v-for="chapter in 10" :key="chapter" :value="chapter">第{{ chapter }}章</option>
              </select>
            </label>
            <label>
              <span>题型</span>
              <select v-model="examForm.questionType" class="ai-select">
                <option value="">不限</option>
                <option v-for="type in TYPE_OPTIONS" :key="type.value" :value="type.value">{{ type.label }}</option>
              </select>
            </label>
            <label>
              <span>难度</span>
              <select v-model="examForm.difficulty" class="ai-select">
                <option value="">不限</option>
                <option v-for="diff in DIFFICULTY_OPTIONS" :key="diff.value" :value="diff.value">{{ diff.label }}</option>
              </select>
            </label>
            <label>
              <span>题量</span>
              <input v-model.number="examForm.count" type="number" min="1" max="100" class="ai-select" />
            </label>
            <div class="ai-form-actions">
              <button class="ai-form-btn" @click="showExamForm = false">取消</button>
              <button class="ai-form-btn primary" @click="submitExamForm">确认生成</button>
            </div>
          </div>

          <div class="ai-quick-row">
            <button class="ai-quick-btn" @click="sendQuick('怎么开始做题？')">怎么开始做题？</button>
            <button class="ai-quick-btn" @click="sendQuick('错题本在哪？')">错题本在哪？</button>
            <button class="ai-quick-btn" @click="toggleExamForm">生成一套试卷</button>
            <button class="ai-quick-btn" @click="sendQuick('帮我浓缩错题')">帮我浓缩错题</button>
          </div>

          <div class="ai-input-row">
            <input
              v-model="inputText"
              class="ai-input"
              placeholder="输入问题，Enter 发送"
              :disabled="sending"
              @keydown.enter.prevent="sendMessage()"
            />
            <button class="ai-send" :disabled="sending || !inputText.trim()" @click="sendMessage()">
              {{ sending ? '...' : '发送' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, inject, watch, nextTick, onMounted } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import request from '@/utils/request';
import { TYPE_OPTIONS, DIFFICULTY_OPTIONS, getTypeName } from '@/utils/constants';

const emit = defineEmits(['start-exam']);

const assistantState = inject('assistantState', {
  currentView: ref('practice'),
  practiceView: ref('exams'),
  currentQuestionId: ref(null),
  currentExamId: ref(null),
  currentUser: ref(null),
});

const currentView = assistantState.currentView;
const practiceView = assistantState.practiceView;
const currentQuestionId = assistantState.currentQuestionId;
const currentExamId = assistantState.currentExamId;
const currentUser = assistantState.currentUser;

const open = ref(false);
const hintVisible = ref(false);
const sending = ref(false);
const inputText = ref('');
const messages = ref([]);
const messageListRef = ref(null);
const showExamForm = ref(false);

const examForm = ref({
  chapter: '',
  questionType: '',
  difficulty: '',
  count: 10,
});

const isAnswerPage = computed(() => currentView.value === 'practice' && practiceView.value === 'practice');

const currentPage = computed(() => {
  if (currentView.value === 'practice') {
    return practiceView.value === 'practice' ? 'practice/exam' : `practice/${practiceView.value}`;
  }
  return currentView.value;
});

const ballStyle = computed(() => {
  const style = {};
  if (isAnswerPage.value) {
    style.bottom = '104px';
    style.opacity = '0.9';
  }
  return style;
});

const panelStyle = computed(() => {
  if (!dragPos.value) return {};
  return {
    left: `${dragPos.value.x}px`,
    top: `${dragPos.value.y}px`,
    right: 'auto',
    bottom: 'auto',
  };
});

const dragPos = ref(null);
let dragOffset = { x: 0, y: 0 };
let dragging = false;

const renderMarkdown = (content) => {
  if (!content) return '';
  return DOMPurify.sanitize(marked.parse(content));
};

const scrollToBottom = async () => {
  await nextTick();
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight;
  }
};

const toggleOpen = () => {
  open.value = !open.value;
  hintVisible.value = false;
  if (open.value) scrollToBottom();
};

const closePanel = () => {
  open.value = false;
};

const toggleExamForm = () => {
  showExamForm.value = !showExamForm.value;
};

const sendQuick = (text) => {
  showExamForm.value = false;
  sendMessage(text);
};

const submitExamForm = () => {
  const options = {
    chapter: examForm.value.chapter || undefined,
    questionType: examForm.value.questionType || undefined,
    difficulty: examForm.value.difficulty || undefined,
    count: Math.min(Math.max(Number(examForm.value.count) || 10, 1), 100),
  };
  showExamForm.value = false;
  sendMessage('生成一套试卷', options);
};

const sendMessage = async (text = inputText.value, examOptions = null) => {
  const message = String(text || '').trim();
  if (!message || sending.value) return;

  messages.value.push({ role: 'user', content: message });
  inputText.value = '';
  sending.value = true;
  scrollToBottom();

  try {
    const res = await request.post('/ai-assistant/chat', {
      message,
      currentPage: currentPage.value,
      currentQuestionId: currentQuestionId.value || null,
      currentExamId: currentExamId.value || null,
      examOptions,
    });
    messages.value.push({
      role: 'assistant',
      content: res.reply || '',
      type: res.type || 'text',
      data: res.data || null,
      questions: res.questions || [],
    });
  } catch (err) {
    messages.value.push({
      role: 'assistant',
      content: err.message || '请求失败，请稍后再试',
      type: 'text',
    });
  } finally {
    sending.value = false;
    scrollToBottom();
  }
};

const startDrag = (event) => {
  if (event.pointerType !== 'mouse') return;
  const panel = event.currentTarget.closest('.ai-panel');
  if (!panel) return;
  const rect = panel.getBoundingClientRect();
  dragOffset = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  dragging = true;
  event.currentTarget.setPointerCapture(event.pointerId);
};

const onDrag = (event) => {
  if (!dragging || event.pointerType !== 'mouse') return;
  const panel = event.currentTarget.closest('.ai-panel');
  if (!panel) return;
  const rect = panel.getBoundingClientRect();
  const x = Math.min(Math.max(event.clientX - dragOffset.x, 0), window.innerWidth - rect.width);
  const y = Math.min(Math.max(event.clientY - dragOffset.y, 0), window.innerHeight - rect.height);
  dragPos.value = { x, y };
};

const endDrag = () => {
  dragging = false;
};

watch(
  () => messages.value.length,
  () => scrollToBottom()
);

onMounted(() => {
  const userId = currentUser.value?.id || JSON.parse(localStorage.getItem('user') || '{}').id;
  const hintKey = `iq_ai_ball_hint_${userId || 'guest'}`;
  if (!localStorage.getItem(hintKey)) {
    localStorage.setItem(hintKey, '1');
    hintVisible.value = true;
  }
});
</script>

<style scoped>
.ai-assistant {
  position: relative;
}
.ai-ball {
  position: fixed;
  right: 20px;
  bottom: calc(20px + env(safe-area-inset-bottom));
  width: 56px;
  height: 56px;
  border: none;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #4338ca);
  color: #fff;
  font-size: 26px;
  line-height: 1;
  box-shadow: 0 8px 24px -6px rgba(79, 70, 229, 0.55);
  cursor: pointer;
  z-index: 999;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  animation: ai-breath 2.4s ease-in-out infinite;
  transition: bottom 0.25s ease, opacity 0.25s ease, transform 0.15s ease;
}
.ai-ball:hover {
  transform: scale(1.05);
}
@keyframes ai-breath {
  0%, 100% {
    box-shadow: 0 8px 24px -6px rgba(79, 70, 229, 0.55), 0 0 0 0 rgba(99, 102, 241, 0.35);
  }
  50% {
    box-shadow: 0 8px 24px -6px rgba(79, 70, 229, 0.55), 0 0 0 14px rgba(99, 102, 241, 0);
  }
}
.ai-hint {
  position: fixed;
  right: 88px;
  bottom: calc(34px + env(safe-area-inset-bottom));
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 10px 30px -10px rgba(15, 23, 42, 0.25);
  padding: 10px 14px;
  font-size: 13px;
  color: #334155;
  z-index: 999;
  cursor: pointer;
  max-width: 220px;
}
.ai-hint::after {
  content: '';
  position: absolute;
  right: -6px;
  bottom: 16px;
  width: 12px;
  height: 12px;
  background: #fff;
  border-right: 1px solid #e2e8f0;
  border-top: 1px solid #e2e8f0;
  transform: rotate(45deg);
}
.ai-panel {
  position: fixed;
  right: 20px;
  bottom: calc(96px + env(safe-area-inset-bottom));
  width: 400px;
  height: 600px;
  max-height: calc(100vh - 120px);
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 24px 60px -20px rgba(15, 23, 42, 0.35);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 999;
}
.ai-drag-handle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  user-select: none;
}
@media (hover: hover) and (pointer: fine) {
  .ai-drag-handle {
    cursor: move;
  }
}
.ai-close {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.ai-close:hover {
  background: rgba(255, 255, 255, 0.3);
}
.ai-messages {
  flex: 1;
  overflow-y: auto;
  padding: 14px 14px 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #f8fafc;
}
.ai-welcome {
  color: #64748b;
  font-size: 13px;
  line-height: 1.7;
  text-align: center;
  padding: 30px 16px;
  background: #fff;
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
}
.ai-msg {
  display: flex;
  flex-direction: column;
}
.ai-msg.user {
  align-items: flex-end;
}
.ai-msg.assistant {
  align-items: flex-start;
}
.ai-bubble {
  max-width: 86%;
  padding: 10px 13px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.7;
  word-break: break-word;
  white-space: normal;
}
.ai-msg.user .ai-bubble {
  background: #4f46e5;
  color: #fff;
  border-bottom-right-radius: 3px;
}
.ai-msg.assistant .ai-bubble {
  background: #fff;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  border-bottom-left-radius: 3px;
}
.ai-bubble :deep(p) {
  margin: 4px 0;
}
.ai-bubble :deep(p:first-child) {
  margin-top: 0;
}
.ai-bubble :deep(p:last-child) {
  margin-bottom: 0;
}
.ai-bubble :deep(pre),
.ai-bubble :deep(code) {
  white-space: pre-wrap;
  word-break: break-word;
}
.ai-thinking {
  color: #64748b;
}
.ai-actions {
  margin-top: 8px;
  padding-left: 4px;
}
.ai-action-btn {
  padding: 7px 14px;
  border: 1px solid #c7d2fe;
  border-radius: 8px;
  background: #eef2ff;
  color: #4f46e5;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.ai-action-btn:hover {
  background: #e0e7ff;
}
.ai-similar {
  width: 100%;
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ai-similar-item {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px 12px;
}
.ai-similar-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.ai-similar-id {
  font-family: var(--iq-font-mono);
  font-size: 11px;
  background: #f1f5f9;
  color: #475569;
  padding: 2px 7px;
  border-radius: 4px;
}
.ai-similar-type {
  font-size: 11px;
  color: #4f46e5;
  font-weight: 600;
}
.ai-similar-title {
  font-size: 13px;
  color: #1e293b;
  line-height: 1.6;
}
.ai-similar-options {
  margin-top: 6px;
  font-size: 12px;
  color: #64748b;
  white-space: pre-wrap;
}
.ai-input-area {
  border-top: 1px solid #e2e8f0;
  padding: 10px 12px 12px;
  background: #fff;
}
.ai-exam-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 10px;
  margin-bottom: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}
.ai-exam-form label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11px;
  color: #64748b;
}
.ai-select {
  width: 100%;
  height: 32px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 0 8px;
  font-size: 13px;
  background: #fff;
  color: #1e293b;
  font-family: inherit;
}
.ai-form-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 2px;
}
.ai-form-btn {
  padding: 6px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #fff;
  color: #475569;
  font-size: 12px;
  cursor: pointer;
}
.ai-form-btn.primary {
  background: #4f46e5;
  border-color: #4f46e5;
  color: #fff;
}
.ai-quick-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.ai-quick-btn {
  padding: 5px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: #f8fafc;
  color: #475569;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.ai-quick-btn:hover {
  border-color: #a5b4fc;
  background: #eef2ff;
  color: #4338ca;
}
.ai-input-row {
  display: flex;
  gap: 8px;
}
.ai-input {
  flex: 1;
  height: 38px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0 12px;
  font-size: 14px;
  font-family: inherit;
  color: #1e293b;
  outline: none;
}
.ai-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}
.ai-send {
  height: 38px;
  padding: 0 16px;
  border: none;
  border-radius: 8px;
  background: #4f46e5;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.ai-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .ai-ball {
    right: 12px;
    bottom: calc(12px + env(safe-area-inset-bottom));
  }
  .ai-hint {
    right: 78px;
    bottom: calc(24px + env(safe-area-inset-bottom));
  }
  .ai-panel {
    right: 12px;
    bottom: calc(12px + env(safe-area-inset-bottom));
    left: 12px;
    width: auto;
    height: 70vh;
    max-height: 70vh;
  }
}
</style>
