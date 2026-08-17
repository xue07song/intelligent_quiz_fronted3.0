<template>
  <div class="profile-page">
    <div class="iq-page-titlebar">
      <h1>👤 个人中心</h1>
    </div>

    <el-dialog
        v-model="editVisible"
        title="编辑资料"
        width="520px"
        class="profile-edit-dialog"
        destroy-on-close
    >
      <el-form label-width="80px" class="profile-edit-form">
        <el-form-item label="用户名"><el-input v-model="editForm.username" disabled /></el-form-item>
        <el-form-item label="角色"><el-input :model-value="roleText(editForm.role)" disabled /></el-form-item>
        <el-form-item label="昵称"><el-input v-model="editForm.nickname" placeholder="请输入昵称" /></el-form-item>
        <el-form-item label="邮箱"><el-input v-model="editForm.email" placeholder="请输入常用邮箱" /></el-form-item>
        <el-form-item label="手机号"><el-input v-model="editForm.phone" placeholder="请输入中国大陆手机号" maxlength="11" /></el-form-item>
        <el-form-item label="学校"><el-input v-model="editForm.school" placeholder="请输入学校名称" /></el-form-item>
        <el-form-item label="学院"><el-input v-model="editForm.college" placeholder="请输入学院名称" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="editLoading" @click="handleSaveProfile">保存资料</el-button>
      </template>
    </el-dialog>

    <!-- ===== 个人信息卡片 ===== -->
    <div class="iq-card profile-card" v-loading="profileLoading">
      <div class="profile-card-head">
        <span class="profile-card-title">基本信息</span>
        <el-button type="primary" plain size="small" @click="openEditDialog">
          编辑资料
        </el-button>
      </div>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="用户名">
          {{ profile.username || '--' }}
        </el-descriptions-item>
        <el-descriptions-item label="昵称">
          {{ textValue(profile.nickname) }}
        </el-descriptions-item>
        <el-descriptions-item label="角色">
          {{ roleText(profile.role) }}
        </el-descriptions-item>
        <el-descriptions-item label="注册时间">
          {{ formatTime(profile.created_at) }}
        </el-descriptions-item>
        <el-descriptions-item label="邮箱">
          {{ textValue(profile.email) }}
        </el-descriptions-item>
        <el-descriptions-item label="手机号">
          {{ textValue(profile.phone) }}
        </el-descriptions-item>
        <el-descriptions-item label="学校">
          {{ textValue(profile.school) }}
        </el-descriptions-item>
        <el-descriptions-item label="学院">
          {{ textValue(profile.college) }}
        </el-descriptions-item>
        <el-descriptions-item v-if="profile.role === 'student'" label="所在班级">
          <template v-if="profile.className || profile.class_name">
            <el-tag type="success" effect="light">{{ profile.className || profile.class_name }}</el-tag>
          </template>
          <span v-else class="iq-text-muted">未分班</span>
        </el-descriptions-item>
        <el-descriptions-item v-if="profile.role === 'teacher'" label="所教科目" :span="2">
          <template v-if="profile.subjects && profile.subjects.length > 0">
            <el-tag
                v-for="(s, idx) in profile.subjects"
                :key="idx"
                type="primary"
                effect="light"
                style="margin-right: 6px; margin-bottom: 4px;"
            >
              {{ s }}
            </el-tag>
          </template>
          <span v-else class="iq-text-muted">暂未设置</span>
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <!-- ===== 功能入口 ===== -->
    <div class="iq-card profile-card">
      <div class="profile-actions-title">功能入口</div>
      <div class="profile-actions-grid">
        <div class="profile-action-item" @click="openChangePassword">
          <span class="action-icon">🔐</span>
          <span class="action-label">修改密码</span>
          <span class="action-arrow">›</span>
        </div>
        <div class="profile-action-item" @click="openFeedbackDialog">
          <span class="action-icon">💬</span>
          <span class="action-label">用户反馈</span>
          <span class="action-arrow">›</span>
        </div>
      </div>
    </div>

    <!-- ===== 修改密码弹窗 ===== -->
    <el-dialog
        v-model="changePasswordVisible"
        title="修改密码"
        width="420px"
        class="profile-edit-dialog"
        destroy-on-close
    >
      <el-form label-width="90px" class="profile-edit-form">
        <el-form-item label="旧密码">
          <el-input v-model="passwordForm.oldPassword" type="password" placeholder="请输入旧密码" />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码（至少6位）" />
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="changePasswordVisible = false">取消</el-button>
        <el-button type="primary" :loading="changePasswordLoading" @click="handleChangePassword">
          确认修改
        </el-button>
      </template>
    </el-dialog>

    <!-- ===== 用户反馈弹窗 ===== -->
    <el-dialog
        v-model="feedbackVisible"
        title="💬 用户反馈"
        width="520px"
        class="profile-edit-dialog"
        destroy-on-close
    >
      <el-form label-width="80px" class="profile-edit-form">
        <el-form-item label="反馈类型">
          <el-select v-model="feedbackForm.category" placeholder="请选择反馈类型" style="width: 100%;">
            <el-option label="功能建议" value="suggestion" />
            <el-option label="Bug 故障" value="bug" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="feedbackForm.title" placeholder="简短描述问题或建议" maxlength="100" />
        </el-form-item>
        <el-form-item label="详细内容">
          <el-input
              v-model="feedbackForm.content"
              type="textarea"
              placeholder="请详细描述你的建议或遇到的问题..."
              :rows="5"
          />
        </el-form-item>
        <el-form-item label="联系方式" :error="feedbackContactError">
          <el-input v-model="feedbackForm.contact" placeholder="填写邮箱或中国大陆手机号" @input="feedbackContactError = ''" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="feedbackVisible = false">取消</el-button>
        <el-button type="primary" :loading="feedbackLoading" @click="handleSubmitFeedback">
          提交反馈
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getStudentProfile, updateProfile } from '@/api/student';
import { changePassword } from '@/api/auth';
import { createFeedback } from '@/api/feedback';

// ===== 个人信息 =====
const profile = ref({});
const profileLoading = ref(false);
const editVisible = ref(false);
const editLoading = ref(false);
const editForm = ref({
  username: '',
  role: '',
  nickname: '',
  email: '',
  phone: '',
  school: '',
  college: '',
});

// ===== 修改密码 =====
const changePasswordVisible = ref(false);
const changePasswordLoading = ref(false);
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

// ===== 用户反馈 =====
const feedbackVisible = ref(false);
const feedbackLoading = ref(false);
const feedbackContactError = ref('');
const feedbackForm = ref({
  category: 'suggestion',
  title: '',
  content: '',
  contact: '',
});

const loadProfile = async () => {
  const localUser = JSON.parse(localStorage.getItem('user') || '{}');
  profile.value = { ...localUser };
  profileLoading.value = true;
  try {
    const data = await getStudentProfile();
    profile.value = { ...localUser, ...data };
  } catch (err) {
    // 接口异常时保留 localStorage 中的用户信息
  } finally {
    profileLoading.value = false;
  }
};

const openEditDialog = () => {
  editForm.value = {
    username: profile.value.username || '',
    role: profile.value.role || '',
    nickname: profile.value.nickname || '',
    email: profile.value.email || '',
    phone: profile.value.phone || '',
    school: profile.value.school || '',
    college: profile.value.college || '',
  };
  editVisible.value = true;
};

const handleSaveProfile = async () => {
  const email = editForm.value.email.trim();
  const phone = editForm.value.phone.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    ElMessage.warning('邮箱格式不正确');
    return;
  }
  if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
    ElMessage.warning('请填写正规的中国大陆手机号');
    return;
  }

  editLoading.value = true;
  try {
    await updateProfile({
      nickname: editForm.value.nickname.trim(),
      email,
      phone,
      school: editForm.value.school.trim(),
      college: editForm.value.college.trim(),
    });
    ElMessage.success('资料更新成功');
    editVisible.value = false;
    await loadProfile();
    const current = JSON.parse(localStorage.getItem('user') || '{}');
    localStorage.setItem('user', JSON.stringify({ ...current, ...profile.value }));
  } catch (err) {
    ElMessage.error(err.message || '资料更新失败');
  } finally {
    editLoading.value = false;
  }
};

// ===== 修改密码 =====
const openChangePassword = () => {
  passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' };
  changePasswordVisible.value = true;
};

const handleChangePassword = async () => {
  const { oldPassword, newPassword, confirmPassword } = passwordForm.value;
  if (!oldPassword || !newPassword || !confirmPassword) {
    ElMessage.warning('请完整填写所有密码字段');
    return;
  }
  if (newPassword.length < 6) {
    ElMessage.warning('新密码至少6位');
    return;
  }
  if (newPassword !== confirmPassword) {
    ElMessage.warning('两次输入的密码不一致');
    return;
  }

  changePasswordLoading.value = true;
  try {
    await changePassword({ oldPassword, newPassword });
    ElMessage.success('密码修改成功，请重新登录');
    changePasswordVisible.value = false;
    setTimeout(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.reload();
    }, 1500);
  } catch (err) {
    ElMessage.error(err.message || '密码修改失败');
  } finally {
    changePasswordLoading.value = false;
  }
};

// ===== 用户反馈 =====
const openFeedbackDialog = () => {
  feedbackForm.value = { category: 'suggestion', title: '', content: '', contact: '' };
  feedbackContactError.value = '';
  feedbackVisible.value = true;
};

const handleSubmitFeedback = async () => {
  const { category, title, content, contact } = feedbackForm.value;
  if (!category) {
    ElMessage.warning('请选择反馈类型');
    return;
  }
  if (!title || !title.trim()) {
    ElMessage.warning('请填写反馈标题');
    return;
  }
  if (!content || !content.trim()) {
    ElMessage.warning('请填写反馈内容');
    return;
  }
  const normalizedContact = contact.trim();
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedContact);
  const validPhone = /^1[3-9]\d{9}$/.test(normalizedContact);
  if (normalizedContact && !validEmail && !validPhone) {
    feedbackContactError.value = '请填写正规手机号码或邮箱';
    return;
  }

  feedbackLoading.value = true;
  try {
    await createFeedback({
      category,
      title: title.trim(),
      content: content.trim(),
      contact: normalizedContact || undefined,
    });
    ElMessage.success('反馈提交成功，感谢你的建议！');
    feedbackVisible.value = false;
  } catch (err) {
    ElMessage.error(err.message || '反馈提交失败');
  } finally {
    feedbackLoading.value = false;
  }
};

// ===== 工具函数 =====
const ROLE_MAP = {
  admin: '管理员',
  teacher: '教师',
  student: '学生',
};

const roleText = (role) => ROLE_MAP[role] || role || '--';

const textValue = (value) => {
  if (value === null || value === undefined || String(value).trim() === '') {
    return '暂未填写';
  }
  return value;
};

const formatTime = (value) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// ===== 生命周期 =====
onMounted(() => {
  loadProfile();
});
</script>

<style scoped>
.profile-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 1000px;
  margin: 0 auto;
}

.profile-page {
  --el-color-primary: var(--iq-primary);
  --el-color-primary-light-3: var(--iq-primary-300);
  --el-color-primary-light-5: var(--iq-primary-200);
  --el-color-primary-light-7: var(--iq-primary-100);
  --el-color-primary-light-8: var(--iq-primary-50);
  --el-color-primary-light-9: var(--iq-primary-50);
  --el-color-primary-dark-2: var(--iq-primary-600);
}

.profile-card {
  padding: 24px;
}

.profile-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.profile-card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--iq-neutral-900);
}

/* ===== 功能入口 ===== */
.profile-actions-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--iq-neutral-700);
  margin-bottom: 12px;
}

.profile-actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.profile-action-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border: 1px solid var(--iq-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;
}

.profile-action-item:hover {
  border-color: var(--iq-primary);
  background: var(--iq-primary-50);
}

.action-icon {
  font-size: 18px;
  margin-right: 10px;
}

.action-label {
  flex: 1;
  font-size: 14px;
  color: var(--iq-neutral-700);
}

.action-arrow {
  font-size: 18px;
  color: var(--iq-neutral-400);
}

.profile-edit-form :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px var(--iq-border) inset;
}

.profile-edit-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--iq-primary) inset;
}

@media (max-width: 768px) {
  .profile-actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>
