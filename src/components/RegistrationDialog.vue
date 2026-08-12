<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="visible" class="iq-modal-overlay" @click.self="$emit('close')">
        <div class="iq-modal iq-modal-md">
          <div class="iq-modal-header">
            <h3 class="iq-modal-title">注册申请</h3>
            <button class="iq-modal-close" @click="$emit('close')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <form class="iq-modal-body" @submit.prevent="handleSubmit">
            <div class="iq-form-tip">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              提交注册申请后，需等待管理员审核通过方可登录使用
            </div>

            <div class="iq-form-field">
              <label class="iq-form-label">申请角色 <span class="iq-form-required">*</span></label>
              <div class="iq-role-selector">
                <button
                  type="button"
                  class="iq-role-option"
                  :class="{ active: form.role === 'student' }"
                  @click="form.role = 'student'"
                >
                  <span class="iq-role-icon">🎓</span>
                  <span class="iq-role-name">学生</span>
                </button>
                <button
                  type="button"
                  class="iq-role-option"
                  :class="{ active: form.role === 'teacher' }"
                  @click="form.role = 'teacher'"
                >
                  <span class="iq-role-icon">👨‍🏫</span>
                  <span class="iq-role-name">教师</span>
                </button>
              </div>
            </div>

            <div class="iq-form-field">
              <label class="iq-form-label">用户名 <span class="iq-form-required">*</span></label>
              <input v-model="form.username" type="text" class="iq-input" placeholder="请输入用户名" />
            </div>

            <div class="iq-form-field">
              <label class="iq-form-label">昵称</label>
              <input v-model="form.nickname" type="text" class="iq-input" placeholder="选填，显示名称" />
            </div>

            <div class="iq-form-field">
              <label class="iq-form-label">密码 <span class="iq-form-required">*</span></label>
              <input v-model="form.password" type="password" class="iq-input" placeholder="至少6位" />
            </div>

            <div class="iq-form-field">
              <label class="iq-form-label">确认密码 <span class="iq-form-required">*</span></label>
              <input v-model="form.confirmPassword" type="password" class="iq-input" placeholder="再次输入密码" />
            </div>

            <div v-if="errorMsg" class="iq-form-alert-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {{ errorMsg }}
            </div>

            <div class="iq-modal-footer">
              <button type="button" class="iq-btn iq-btn-secondary" @click="$emit('close')">取消</button>
              <button type="submit" class="iq-btn iq-btn-primary" :disabled="loading">
                <span v-if="loading" class="iq-btn-spinner"></span>
                {{ loading ? '提交中...' : '提交申请' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { reactive, ref, watch } from 'vue';
import { submitRegistration } from '@/api/auth';

const props = defineProps({
  visible: { type: Boolean, default: false },
});

const emit = defineEmits(['close', 'success']);

const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  role: 'student',
  nickname: '',
});

const loading = ref(false);
const errorMsg = ref('');

watch(() => props.visible, (val) => {
  if (!val) {
    setTimeout(() => {
      Object.assign(form, { username: '', password: '', confirmPassword: '', role: 'student', nickname: '' });
      errorMsg.value = '';
    }, 200);
  }
});

const handleSubmit = async () => {
  errorMsg.value = '';

  if (!form.username || !form.password) {
    errorMsg.value = '用户名和密码不能为空';
    return;
  }
  if (form.password.length < 6) {
    errorMsg.value = '密码长度不能少于6位';
    return;
  }
  if (form.password !== form.confirmPassword) {
    errorMsg.value = '两次输入的密码不一致';
    return;
  }
  if (!['student', 'teacher'].includes(form.role)) {
    errorMsg.value = '角色无效';
    return;
  }

  loading.value = true;
  try {
    await submitRegistration({
      username: form.username,
      password: form.password,
      role: form.role,
      nickname: form.nickname || null,
    });
    emit('success');
    Object.assign(form, { username: '', password: '', confirmPassword: '', role: 'student', nickname: '' });
  } catch (err) {
    errorMsg.value = err.message || '注册申请提交失败';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.iq-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid var(--iq-border);
}
.iq-modal-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--iq-neutral-900);
  margin: 0;
}
.iq-modal-close {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--iq-neutral-400);
  cursor: pointer;
  border-radius: var(--iq-radius-medium);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.iq-modal-close:hover {
  background: var(--iq-neutral-100);
  color: var(--iq-neutral-700);
}
.iq-modal-close svg { width: 18px; height: 18px; }

.iq-form-tip {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: var(--iq-state-info-bg);
  color: var(--iq-state-info);
  border: 1px solid #bfdbfe;
  padding: 10px 14px;
  border-radius: var(--iq-radius-medium);
  font-size: 13px;
  margin-bottom: 16px;
  line-height: 1.5;
}
.iq-form-tip svg { flex-shrink: 0; margin-top: 2px; }

.iq-role-selector {
  display: flex;
  gap: 10px;
}
.iq-role-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 10px;
  border: 2px solid var(--iq-border);
  border-radius: var(--iq-radius-medium);
  background: var(--iq-card);
  cursor: pointer;
  transition: all 0.2s;
  color: var(--iq-neutral-600);
}
.iq-role-option:hover {
  border-color: var(--iq-primary-300);
}
.iq-role-option.active {
  border-color: var(--iq-primary-500);
  background: var(--iq-primary-50);
  color: var(--iq-primary-700);
}
.iq-role-icon { font-size: 22px; }
.iq-role-name { font-size: 13px; font-weight: 500; }

.iq-form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}
.iq-form-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--iq-neutral-700);
}
.iq-form-required {
  color: var(--iq-state-error);
}
.iq-form-alert-error {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--iq-state-error-bg);
  color: #b91c1c;
  border: 1px solid #fecaca;
  padding: 10px 14px;
  border-radius: var(--iq-radius-medium);
  font-size: 13px;
  margin-bottom: 16px;
}

.iq-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 8px;
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
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter-active .iq-modal,
.modal-fade-leave-active .iq-modal {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-from .iq-modal,
.modal-fade-leave-to .iq-modal {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}
</style>
