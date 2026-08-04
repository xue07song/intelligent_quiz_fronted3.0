<template>
  <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-card">
      <h2 class="modal-title">修改密码</h2>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>原密码 *</label>
          <input v-model="form.oldPassword" type="password" class="form-input" placeholder="请输入原密码" />
        </div>
        <div class="form-group">
          <label>新密码 *</label>
          <input v-model="form.newPassword" type="password" class="form-input" placeholder="至少6位" />
        </div>
        <div class="form-group">
          <label>确认新密码 *</label>
          <input v-model="form.confirmPassword" type="password" class="form-input" placeholder="再次输入新密码" />
        </div>
        <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
        <div class="modal-actions">
          <button type="button" class="btn-cancel" @click="$emit('close')">取消</button>
          <button type="submit" class="btn-primary" :disabled="loading">
            {{ loading ? '提交中...' : '确认修改' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { changePassword } from '@/api/auth';

const props = defineProps({
  visible: { type: Boolean, default: false },
});

const emit = defineEmits(['close', 'success']);

const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const loading = ref(false);
const errorMsg = ref('');

const handleSubmit = async () => {
  errorMsg.value = '';

  if (!form.oldPassword || !form.newPassword) {
    errorMsg.value = '原密码和新密码不能为空';
    return;
  }
  if (form.newPassword.length < 6) {
    errorMsg.value = '新密码长度不能少于6位';
    return;
  }
  if (form.newPassword !== form.confirmPassword) {
    errorMsg.value = '两次输入的新密码不一致';
    return;
  }

  loading.value = true;
  try {
    await changePassword({
      oldPassword: form.oldPassword,
      newPassword: form.newPassword,
    });
    emit('success');
    // 重置表单
    Object.assign(form, { oldPassword: '', newPassword: '', confirmPassword: '' });
  } catch (err) {
    errorMsg.value = err.message || '密码修改失败';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-card {
  background: #fff;
  border-radius: 8px;
  padding: 30px;
  width: 400px;
}
.modal-title {
  margin: 0 0 20px;
  font-size: 18px;
  color: #303133;
}
.form-group {
  margin-bottom: 16px;
}
.form-group label {
  display: block;
  font-size: 14px;
  color: #606266;
  margin-bottom: 6px;
}
.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}
.error-msg {
  color: #ff4d4f;
  font-size: 13px;
  margin-bottom: 12px;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
.btn-primary {
  padding: 8px 16px;
  background: #667eea;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-cancel {
  padding: 8px 16px;
  background: #fff;
  color: #606266;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}
</style>
