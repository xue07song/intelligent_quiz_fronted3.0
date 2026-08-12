<template>
  <div class="ai-assistant-root">
    <!-- 浮动按钮 -->
    <button
      v-if="!isOpen"
      class="ai-fab"
      @click="openChat"
      title="AI 小助手"
    >
      <span class="ai-fab-icon">🤖</span>
      <span class="ai-fab-badge" v-if="unreadCount > 0">{{ unreadCount }}</span>
    </button>

    <!-- 聊天窗口 -->
    <transition name="ai-slide">
      <div v-if="isOpen" class="ai-chat-window">
        <!-- 标题栏 -->
        <div class="ai-chat-header">
          <div class="ai-chat-title">
            <span class="ai-chat-avatar">🤖</span>
            <div>
              <div class="ai-chat-name">智学助手</div>
              <div class="ai-chat-status">
                <span class="ai-dot" :class="{ online: aiReady, offline: !aiReady }"></span>
                {{ aiReady ? '在线' : 'AI 未配置' }}
              </div>
            </div>
          </div>
          <div class="ai-chat-actions">
            <button class="ai-icon-btn" @click="clearHistory" title="清空对话">🗑️</button>
            <button class="ai-icon-btn" @click="isOpen = false" title="关闭">✕</button>
          </div>
        </div>

        <!-- 消息区域 -->
        <div class="ai-chat-body" ref="chatBody">
          <!-- 欢迎消息 -->
          <div v-if="messages.length === 0" class="ai-welcome">
            <div class="ai-welcome-icon">👋</div>
            <div class="ai-welcome-title">你好！我是智学助手</div>
            <div class="ai-welcome-desc">有什么学习上的问题都可以问我哦~</div>
            <div class="ai-quick-questions">
              <button v-for="q in quickQuestions" :key="q" class="ai-quick-q" @click="sendQuickQuestion(q)">
                {{ q }}
              </button>
            </div>
          </div>

          <!-- 消息列表 -->
          <div
            v-for="(msg, i) in messages"
            :key="i"
            class="ai-msg"
            :class="msg.role === 'user' ? 'ai-msg-user' : 'ai-msg-bot'"
          >
            <div class="ai-msg-avatar">{{ msg.role === 'user' ? '👤' : '🤖' }}</div>
            <div class="ai-msg-bubble">
              <div class="ai-msg-content" v-html="renderMarkdown(msg.content)"></div>
            </div>
          </div>

          <!-- 加载中 -->
          <div v-if="loading" class="ai-msg ai-msg-bot">
            <div class="ai-msg-avatar">🤖</div>
            <div class="ai-msg-bubble">
              <div class="ai-typing">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="ai-chat-footer">
          <textarea
            ref="inputRef"
            v-model="inputText"
            class="ai-input"
            placeholder="输入你的问题... (Enter 发送, Shift+Enter 换行)"
            rows="1"
            @keydown.enter.exact.prevent="sendMessage"
            @input="autoResize"
          ></textarea>
          <button class="ai-send-btn" :disabled="!inputText.trim() || loading" @click="sendMessage">
            📤
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue';
import { chatWithAssistant, getAiStatus } from '@/api/ai';

const isOpen = ref(false);
const messages = ref([]);
const inputText = ref('');
const loading = ref(false);
const aiReady = ref(false);
const unreadCount = ref(0);
const chatBody = ref(null);
const inputRef = ref(null);

const quickQuestions = [
  '📚 C语言指针怎么学？',
  '💡 数据结构重点有哪些？',
  '📝 如何高效备考？',
  '🔧 智能组卷怎么用？',
];

// 检测 AI 配置状态
const checkAiStatus = async () => {
  try {
    const res = await getAiStatus();
    aiReady.value = res.configured === true;
  } catch {
    aiReady.value = false;
  }
};

const openChat = () => {
  isOpen.value = true;
  unreadCount.value = 0;
  checkAiStatus();
  nextTick(() => {
    scrollToBottom();
    inputRef.value?.focus();
  });
};

const scrollToBottom = () => {
  nextTick(() => {
    if (chatBody.value) {
      chatBody.value.scrollTop = chatBody.value.scrollHeight;
    }
  });
};

const autoResize = () => {
  const el = inputRef.value;
  if (el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }
};

const sendQuickQuestion = (q) => {
  inputText.value = q.replace(/^[^\s]+\s/, '');
  sendMessage();
};

const sendMessage = async () => {
  const text = inputText.value.trim();
  if (!text || loading.value) return;

  // 添加用户消息
  messages.value.push({ role: 'user', content: text });
  inputText.value = '';
  autoResize();
  scrollToBottom();

  loading.value = true;

  try {
    // 构建发送给后端的消息列表（仅传 user/assistant 角色）
    const apiMessages = messages.value.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const res = await chatWithAssistant({ messages: apiMessages });
    messages.value.push({ role: 'assistant', content: res.reply || '(无回复)' });
  } catch (err) {
    const errMsg = err.message || '请求失败';
    messages.value.push({
      role: 'assistant',
      content: `❌ 抱歉，出错了：${errMsg}\n\n请稍后重试，或检查 AI 配置。`,
    });
  } finally {
    loading.value = false;
    scrollToBottom();
    if (!isOpen.value) unreadCount.value++;
  }
};

const clearHistory = () => {
  if (messages.value.length === 0) return;
  if (window.confirm('确定清空对话记录吗？')) {
    messages.value = [];
  }
};

// 简易 Markdown 渲染（代码块、加粗、列表、换行）
const renderMarkdown = (text) => {
  if (!text) return '';
  let html = text;

  // 代码块 ```lang\ncode\n```
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre class="ai-code-block"><code>${escapeHtml(code.trim())}</code></pre>`;
  });

  // 行内代码 `code`
  html = html.replace(/`([^`]+)`/g, '<code class="ai-code-inline">$1</code>');

  // 加粗 **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // 无序列表 - item
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`);

  // 换行
  html = html.replace(/\n/g, '<br>');

  return html;
};

const escapeHtml = (str) => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

onMounted(() => {
  checkAiStatus();
});
</script>

<style scoped>
.ai-assistant-root {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
}

/* 浮动按钮 */
.ai-fab {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  position: relative;
}
.ai-fab:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 28px rgba(99, 102, 241, 0.5);
}
.ai-fab-icon {
  font-size: 28px;
}
.ai-fab-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background: #ef4444;
  color: #fff;
  font-size: 12px;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

/* 聊天窗口 */
.ai-chat-window {
  width: 400px;
  height: 600px;
  max-height: calc(100vh - 48px);
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

/* 标题栏 */
.ai-chat-header {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}
.ai-chat-title {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ai-chat-avatar {
  font-size: 32px;
}
.ai-chat-name {
  font-size: 16px;
  font-weight: 600;
}
.ai-chat-status {
  font-size: 12px;
  opacity: 0.9;
  display: flex;
  align-items: center;
  gap: 4px;
}
.ai-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.ai-dot.online { background: #4ade80; }
.ai-dot.offline { background: #f87171; }
.ai-chat-actions {
  display: flex;
  gap: 4px;
}
.ai-icon-btn {
  background: rgba(255,255,255,0.2);
  border: none;
  color: #fff;
  width: 30px;
  height: 30px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}
.ai-icon-btn:hover {
  background: rgba(255,255,255,0.35);
}

/* 消息区域 */
.ai-chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #f9fafb;
}
.ai-chat-body::-webkit-scrollbar {
  width: 6px;
}
.ai-chat-body::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

/* 欢迎消息 */
.ai-welcome {
  text-align: center;
  padding: 24px 12px;
}
.ai-welcome-icon {
  font-size: 48px;
  margin-bottom: 12px;
}
.ai-welcome-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 6px;
}
.ai-welcome-desc {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 20px;
}
.ai-quick-questions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}
.ai-quick-q {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 13px;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s;
  width: fit-content;
}
.ai-quick-q:hover {
  background: #ede9fe;
  border-color: #8b5cf6;
  color: #7c3aed;
}

/* 消息气泡 */
.ai-msg {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
  align-items: flex-start;
}
.ai-msg-avatar {
  font-size: 24px;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
.ai-msg-bubble {
  max-width: 280px;
  border-radius: 14px;
  padding: 10px 14px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}
.ai-msg-user .ai-msg-bubble {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  border-bottom-right-radius: 4px;
  margin-left: auto;
}
.ai-msg-bot .ai-msg-bubble {
  background: #fff;
  color: #1f2937;
  border: 1px solid #e5e7eb;
  border-bottom-left-radius: 4px;
}
.ai-msg-user {
  flex-direction: row-reverse;
}

/* 代码块 */
.ai-msg-content :deep(.ai-code-block) {
  background: #1e293b;
  color: #e2e8f0;
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 13px;
  margin: 8px 0;
}
.ai-msg-content :deep(.ai-code-inline) {
  background: rgba(99,102,241,0.1);
  color: #6366f1;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
}
.ai-msg-content :deep(ul) {
  padding-left: 20px;
  margin: 6px 0;
}
.ai-msg-content :deep(li) {
  margin: 2px 0;
}

/* 加载动画 */
.ai-typing {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}
.ai-typing span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #9ca3af;
  animation: ai-bounce 1.4s infinite ease-in-out;
}
.ai-typing span:nth-child(2) { animation-delay: 0.2s; }
.ai-typing span:nth-child(3) { animation-delay: 0.4s; }
@keyframes ai-bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-6px); opacity: 1; }
}

/* 输入区域 */
.ai-chat-footer {
  padding: 10px 12px;
  border-top: 1px solid #e5e7eb;
  background: #fff;
  display: flex;
  gap: 8px;
  align-items: flex-end;
  flex-shrink: 0;
}
.ai-input {
  flex: 1;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 14px;
  resize: none;
  outline: none;
  max-height: 120px;
  line-height: 1.5;
  font-family: inherit;
  transition: border-color 0.2s;
}
.ai-input:focus {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139,92,246,0.1);
}
.ai-send-btn {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}
.ai-send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.ai-send-btn:not(:disabled):hover {
  transform: scale(1.05);
}

/* 动画 */
.ai-slide-enter-active,
.ai-slide-leave-active {
  transition: all 0.3s ease;
}
.ai-slide-enter-from,
.ai-slide-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

/* 响应式 */
@media (max-width: 480px) {
  .ai-chat-window {
    width: calc(100vw - 32px);
    height: calc(100vh - 100px);
  }
}
</style>
