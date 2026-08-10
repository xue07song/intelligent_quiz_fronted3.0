<template>
  <div class="login-page">
    <div class="login-decor"></div>
    <div class="login-card">
      <div class="login-brand">
        <div class="login-logo">智</div>
        <div class="login-brand-text">
          <h1 class="login-title">智能题库管理系统</h1>
          <p class="login-subtitle">Intelligent Quiz Platform</p>
        </div>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="login-field">
          <label class="iq-text-sm iq-font-medium" style="color: var(--iq-neutral-700);">用户名</label>
          <div class="login-input-wrap">
            <svg class="login-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <input
              v-model="form.username"
              type="text"
              class="iq-input login-input"
              placeholder="请输入用户名"
              autocomplete="username"
            />
          </div>
        </div>

        <div class="login-field">
          <label class="iq-text-sm iq-font-medium" style="color: var(--iq-neutral-700);">密码</label>
          <div class="login-input-wrap">
            <svg class="login-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <input
              v-model="form.password"
              type="password"
              class="iq-input login-input"
              placeholder="请输入密码"
              autocomplete="current-password"
            />
          </div>
        </div>

        <div v-if="errorMsg" class="login-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {{ errorMsg }}
        </div>

        <button type="submit" class="iq-btn iq-btn-primary iq-btn-lg login-btn" :disabled="loading">
          <span v-if="loading" class="login-spinner"></span>
          {{ loading ? '登录中...' : '登 录' }}
        </button>
      </form>

      <div class="login-footer iq-text-xs iq-text-muted">
        © 2025 智能题库系统 · 高效出题 · 智能练习
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { login } from '@/api/auth';

const emit = defineEmits(['success']);

const form = reactive({
  username: '',
  password: '',
});

const loading = ref(false);
const errorMsg = ref('');

const handleLogin = async () => {
  if (!form.username || !form.password) {
    errorMsg.value = '用户名和密码不能为空';
    return;
  }

  loading.value = true;
  errorMsg.value = '';

  try {
    const data = await login({ username: form.username, password: form.password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    emit('success', data.user);
  } catch (err) {
    errorMsg.value = err.message || '登录失败，请检查用户名和密码';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background:
    radial-gradient(ellipse at top left, rgba(99, 102, 241, 0.12), transparent 50%),
    radial-gradient(ellipse at bottom right, rgba(139, 92, 246, 0.10), transparent 50%),
    var(--iq-background);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  position: relative;
  overflow: hidden;
}
.login-decor {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(99, 102, 241, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(99, 102, 241, 0.04) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: radial-gradient(ellipse at center, #000 40%, transparent 80%);
}
.login-card {
  position: relative;
  width: 100%;
  max-width: 420px;
  background: var(--iq-card);
  border: 1px solid var(--iq-border);
  border-radius: 16px;
  box-shadow:
    0 20px 50px -20px rgba(15, 23, 42, 0.20),
    0 1px 3px rgba(15, 23, 42, 0.05);
  padding: 40px 36px 28px;
}
.login-brand {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 36px;
}
.login-logo {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--iq-primary-500), var(--iq-primary-700));
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 22px;
  box-shadow: 0 6px 16px -4px rgba(79, 70, 229, 0.4);
}
.login-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--iq-neutral-900);
  margin: 0;
  line-height: 1.3;
}
.login-subtitle {
  font-size: 12px;
  color: var(--iq-muted-foreground);
  margin: 2px 0 0;
  letter-spacing: 0.3px;
}
.login-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.login-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.login-input-wrap {
  position: relative;
}
.login-input-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: var(--iq-neutral-400);
  pointer-events: none;
}
.login-input {
  padding-left: 40px;
  height: 44px;
}
.login-error {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--iq-state-error-bg);
  color: #b91c1c;
  border: 1px solid #fecaca;
  padding: 10px 14px;
  border-radius: var(--iq-radius-medium);
  font-size: 13px;
}
.login-btn {
  width: 100%;
  height: 44px;
  margin-top: 4px;
  font-size: 15px;
  letter-spacing: 2px;
  box-shadow: 0 4px 14px -4px rgba(79, 70, 229, 0.5);
}
.login-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  margin-right: 6px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.login-footer {
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid var(--iq-border);
  text-align: center;
}
</style>
