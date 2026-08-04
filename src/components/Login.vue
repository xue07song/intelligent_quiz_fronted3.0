<template>
  <div class="login-container">
    <div class="login-card">
      <h1 class="login-title">📚 智能题库管理系统</h1>
      <p class="login-subtitle">请登录后使用</p>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>用户名</label>
          <input
            v-model="form.username"
            type="text"
            class="form-input"
            placeholder="请输入用户名"
            autocomplete="username"
          />
        </div>

        <div class="form-group">
          <label>密码</label>
          <input
            v-model="form.password"
            type="password"
            class="form-input"
            placeholder="请输入密码"
            autocomplete="current-password"
          />
        </div>

        <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>

        <button type="submit" class="login-btn" :disabled="loading">
          {{ loading ? '登录中...' : '登 录' }}
        </button>
      </form>

      <div class="login-hint">
        <p>默认管理员：admin / admin123</p>
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
    // 存储 token 和用户信息
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
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.login-card {
  background: #fff;
  padding: 40px 36px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  width: 380px;
}
.login-title {
  text-align: center;
  font-size: 24px;
  color: #2c3e50;
  margin: 0 0 8px;
}
.login-subtitle {
  text-align: center;
  color: #909399;
  font-size: 14px;
  margin: 0 0 28px;
}
.form-group {
  margin-bottom: 18px;
}
.form-group label {
  display: block;
  font-size: 14px;
  color: #606266;
  margin-bottom: 6px;
}
.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
  transition: border-color 0.2s;
}
.form-input:focus {
  outline: none;
  border-color: #667eea;
}
.error-msg {
  color: #ff4d4f;
  font-size: 13px;
  margin-bottom: 12px;
  text-align: center;
}
.login-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: opacity 0.2s;
}
.login-btn:hover {
  opacity: 0.9;
}
.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.login-hint {
  margin-top: 20px;
  text-align: center;
}
.login-hint p {
  font-size: 12px;
  color: #c0c4cc;
  margin: 0;
}
</style>
