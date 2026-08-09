<template>
  <!-- 未登录：显示登录页 -->
  <Login v-if="!currentUser" @success="handleLoginSuccess" />

  <!-- 已登录：显示主应用 -->
  <div v-else id="app" class="app-container">
    <header class="app-header">
      <h1 class="app-title">📚 智能题库管理系统</h1>

      <div class="app-stats" v-if="currentView === 'main' && stats">
        <span>题库总量: <strong>{{ stats.total }}</strong></span>
        <span v-if="stats.byChapter?.length">章节数: <strong>{{ stats.byChapter.length }}</strong></span>
      </div>

      <nav class="app-nav">
        <button class="nav-btn" :class="{ active: currentView === 'main' }" @click="currentView = 'main'">📚 题库管理</button>
        <button class="nav-btn" :class="{ active: currentView === 'practice' }" @click="goPractice">✍️ 答题练习</button>
        <button v-if="currentUser.role === 'admin'" class="nav-btn" :class="{ active: currentView === 'users' }" @click="currentView = 'users'">👥 用户管理</button>
      </nav>

      <div class="user-area">
        <span class="user-info">
          {{ currentUser.nickname || currentUser.username }}
          <span class="role-badge" :class="currentUser.role">{{ roleMap[currentUser.role] }}</span>
        </span>
        <button class="btn-link" @click="pwdVisible = true">改密码</button>
        <button class="btn-link btn-logout" @click="handleLogout">退出</button>
      </div>
    </header>

    <!-- 题库管理视图 -->
    <main v-if="currentView === 'main'" class="app-main">
      <SearchBar
        :initialFilters="filters"
        :role="currentUser.role"
        :selectedCount="selectedIds.length"
        @search="handleSearch"
        @reset="handleReset"
        @add="openAddDialog"
        @batch-delete="handleBatchDelete"
        @batch-import="importVisible = true"
        @ai-generate="aiVisible = true"
      />

      <QuestionTable
        :list="list"
        :loading="loading"
        :role="currentUser.role"
        v-model="selectedIds"
        @view="openViewDialog"
        @edit="openEditDialog"
        @delete="handleDelete"
      />

      <Pagination
        v-model:page="page"
        v-model:pageSize="pageSize"
        :total="total"
        @change="handlePageChange"
      />
    </main>

    <!-- 用户管理视图 -->
    <main v-if="currentView === 'users' && currentUser.role === 'admin'">
      <UserManagement @toast="handleToastFromChild" />
    </main>

    <!-- 答题练习视图 -->
    <main v-if="currentView === 'practice'" class="app-main">
      <!-- 练习子导航 -->
      <div class="practice-subnav">
        <button class="subnav-btn" :class="{ active: practiceView === 'exams' }" @click="practiceView = 'exams'">📋 试卷列表</button>
        <button class="subnav-btn" :class="{ active: practiceView === 'generate' }" @click="practiceView = 'generate'">📝 随机组卷</button>
        <button class="subnav-btn" :class="{ active: practiceView === 'records' }" @click="practiceView = 'records'">📊 答题记录</button>
        <button class="subnav-btn" :class="{ active: practiceView === 'stats' }" @click="practiceView = 'stats'">📈 统计分析</button>
        <button v-if="currentUser.role === 'admin' || currentUser.role === 'teacher'" class="subnav-btn" :class="{ active: practiceView === 'admin-records' }" @click="practiceView = 'admin-records'">👥 做题管理</button>
      </div>

      <!-- 试卷列表 -->
      <ExamList
        v-if="practiceView === 'exams'"
        @generate="practiceView = 'generate'"
        @start-exam="startExam"
        @toast="handleToastFromChild"
      />

      <!-- 随机组卷 -->
      <GenerateExam
        v-if="practiceView === 'generate'"
        @start-exam="startExam"
        @toast="handleToastFromChild"
      />

      <!-- 答题页面 -->
      <ExamPractice
        v-if="practiceView === 'practice' && activeExamId"
        :examId="activeExamId"
        @exit="exitExam"
        @view-record="viewRecord"
        @toast="handleToastFromChild"
      />

      <!-- 答题记录列表 -->
      <PracticeRecords
        v-if="practiceView === 'records'"
        :role="currentUser.role"
        @view-record="viewRecord"
        @toast="handleToastFromChild"
      />

      <!-- 答题记录详情（教师/管理员可查看权限范围内任意记录） -->
      <RecordDetail
        v-if="practiceView === 'record-detail' && activeRecordId"
        :recordId="activeRecordId"
        :adminMode="currentUser.role === 'admin' || currentUser.role === 'teacher'"
        @back="practiceView = 'records'"
        @toast="handleToastFromChild"
      />

      <!-- 统计分析 -->
      <PracticeStats
        v-if="practiceView === 'stats'"
        @toast="handleToastFromChild"
      />

      <!-- 做题管理（教师/管理员） -->
      <AdminRecords
        v-if="practiceView === 'admin-records' && (currentUser.role === 'admin' || currentUser.role === 'teacher')"
        :role="currentUser.role"
        @toast="handleToastFromChild"
      />
    </main>

    <QuestionForm
      :visible="dialogVisible"
      :data="formData"
      :isEdit="isEdit"
      @close="dialogVisible = false"
      @submit="handleSubmit"
    />

    <QuestionDetail
      :visible="viewVisible"
      :data="viewData"
      @close="viewVisible = false"
    />

    <ChangePassword
      :visible="pwdVisible"
      @close="pwdVisible = false"
      @success="handlePwdChanged"
    />

    <ImportQuestions
      :visible="importVisible"
      @close="importVisible = false"
      @success="handleImportSuccess"
    />

    <AiGenerate
      :visible="aiVisible"
      @close="aiVisible = false"
      @success="handleAiSuccess"
    />

    <Toast :message="toastMessage" :type="toastType" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue';
import {
  getQuestions,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  getStatistics,
  batchDeleteQuestions,
} from '@/api/question';
import SearchBar from '@/components/SearchBar.vue';
import QuestionTable from '@/components/QuestionTable.vue';
import QuestionForm from '@/components/QuestionForm.vue';
import QuestionDetail from '@/components/QuestionDetail.vue';
import Pagination from '@/components/Pagination.vue';
import Toast from '@/components/Toast.vue';
import Login from '@/components/Login.vue';
import UserManagement from '@/components/UserManagement.vue';
import ChangePassword from '@/components/ChangePassword.vue';
import ImportQuestions from '@/components/ImportQuestions.vue';
import AiGenerate from '@/components/AiGenerate.vue';
import GenerateExam from '@/components/practice/GenerateExam.vue';
import ExamList from '@/components/practice/ExamList.vue';
import ExamPractice from '@/components/practice/ExamPractice.vue';
import PracticeRecords from '@/components/practice/PracticeRecords.vue';
import RecordDetail from '@/components/practice/RecordDetail.vue';
import PracticeStats from '@/components/practice/PracticeStats.vue';
import AdminRecords from '@/components/practice/AdminRecords.vue';

const roleMap = { admin: '管理员', teacher: '教师', student: '学生' };

// ===== 登录态管理 =====
const currentUser = ref(null);
const currentView = ref('main'); // 'main' | 'users' | 'practice'
const pwdVisible = ref(false);

// ===== 答题练习 =====
const practiceView = ref('exams'); // 'exams' | 'generate' | 'practice' | 'records' | 'record-detail' | 'stats'
const activeExamId = ref(null);
const activeRecordId = ref(null);

const goPractice = () => {
  currentView.value = 'practice';
  practiceView.value = 'exams';
};

const startExam = (examId) => {
  activeExamId.value = examId;
  practiceView.value = 'practice';
};

const exitExam = () => {
  activeExamId.value = null;
  practiceView.value = 'exams';
};

const viewRecord = (recordId) => {
  activeRecordId.value = recordId;
  practiceView.value = 'record-detail';
};

// 从 localStorage 恢复登录态
const restoreSession = () => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  if (token && userStr) {
    try {
      currentUser.value = JSON.parse(userStr);
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
};

const handleLoginSuccess = (user) => {
  currentUser.value = user;
  currentView.value = 'main';
  loadData();
  loadStats();
};

const handleLogout = () => {
  if (!window.confirm('确定要退出登录吗？')) return;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  currentUser.value = null;
  currentView.value = 'main';
};

const handlePwdChanged = () => {
  pwdVisible.value = false;
  showToast('密码修改成功，请重新登录', 'success');
  setTimeout(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser.value = null;
  }, 1500);
};

const handleAuthExpired = () => {
  currentUser.value = null;
  currentView.value = 'main';
  showToast('登录已过期，请重新登录', 'warning');
};

// ===== 批量操作 =====
const selectedIds = ref([]);
const importVisible = ref(false);
const aiVisible = ref(false);

// ===== 题库管理（原有逻辑，先声明变量供 watch 使用） =====
const list = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const loading = ref(false);

// 切换分页/翻页后清空选中
watch(page, () => {
  selectedIds.value = [];
});

const handleBatchDelete = async () => {
  if (selectedIds.value.length === 0) return;
  if (!window.confirm(`确定要批量删除选中的 ${selectedIds.value.length} 条题目吗？`)) return;

  loading.value = true;
  try {
    const result = await batchDeleteQuestions(selectedIds.value);
    const deleted = result?.deleted ?? selectedIds.value.length;
    showToast(`✅ 批量删除成功，共删除 ${deleted} 条`, 'success');
    selectedIds.value = [];

    // 处理分页边界：如果当前页数据全部被删完且不是第 1 页，回退一页
    const remainingInPage = list.value.length - deleted;
    if (remainingInPage <= 0 && page.value > 1) {
      page.value--;
    }
    await loadData();
    await loadStats();
  } catch (error) {
    showToast(error.message || '批量删除失败', 'error');
  } finally {
    loading.value = false;
  }
};

const handleImportSuccess = (result) => {
  const { inserted = 0, skipped = 0, invalid = 0 } = result || {};
  const msg = `导入完成：成功 ${inserted} 条，跳过 ${skipped} 条，无效 ${invalid} 条`;
  if (inserted > 0) {
    loadData();
    loadStats();
  }
  if (invalid > 0 || skipped > 0) {
    showToast(msg, 'warning');
  } else {
    showToast(msg, 'success');
  }
};

const handleAiSuccess = (result) => {
  const { inserted = 0, skipped = 0 } = result || {};
  const msg = `AI 出题入库完成：成功 ${inserted} 条，跳过 ${skipped} 条`;
  if (inserted > 0) {
    loadData();
    loadStats();
  }
  if (skipped > 0) {
    showToast(msg, 'warning');
  } else {
    showToast(msg, 'success');
  }
  aiVisible.value = false;
};

const filters = reactive({
  id: '',
  关键词: '',
  题型: '',
  难度: '',
  章节: '',
  出题人: '',
});

const dialogVisible = ref(false);
const isEdit = ref(false);
const formData = ref({});

const viewVisible = ref(false);
const viewData = ref({});

const stats = ref(null);

const toastMessage = ref('');
const toastType = ref('info');

const showToast = (message, type = 'info') => {
  toastMessage.value = '';
  toastType.value = type;
  setTimeout(() => {
    toastMessage.value = message;
  }, 10);
};

const handleToastFromChild = ({ message, type }) => {
  showToast(message, type);
};

const loadData = async () => {
  loading.value = true;
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
    };
    if (filters.id) params.id = filters.id;
    if (filters.关键词) params.关键词 = filters.关键词;
    if (filters.题型) params.题型 = filters.题型;
    if (filters.难度) params.难度 = filters.难度;
    if (filters.章节) params.章节 = filters.章节;
    if (filters.出题人) params.出题人 = filters.出题人;

    const data = await getQuestions(params);
    list.value = data.list;
    total.value = data.total;
  } catch (error) {
    showToast(error.message || '加载数据失败', 'error');
  } finally {
    loading.value = false;
  }
};

const loadStats = async () => {
  try {
    stats.value = await getStatistics();
  } catch (e) {
    console.warn('统计加载失败:', e);
  }
};

const handleSearch = (newFilters) => {
  Object.assign(filters, newFilters);
  page.value = 1;
  loadData();
};

const handleReset = () => {
  filters.id = '';
  filters.关键词 = '';
  filters.题型 = '';
  filters.难度 = '';
  filters.章节 = '';
  filters.出题人 = '';
  page.value = 1;
  loadData();
};

const handlePageChange = ({ page: newPage, pageSize: newSize }) => {
  page.value = newPage;
  pageSize.value = newSize;
  loadData();
};

const generateId = () => {
  const maxId = list.value.reduce((max, item) => {
    const num = parseInt(item.id.replace(/\D/g, ''), 10);
    return num > max ? num : max;
  }, 0);
  return `Q${String(maxId + 1).padStart(3, '0')}`;
};

const openAddDialog = () => {
  isEdit.value = false;
  formData.value = {
    id: generateId(),
    章节: '',
    题型: 2,
    序号: 0,
    题目: '',
    选项: '',
    答案: '',
    解析: '',
    难度: '',
    知识点: '',
    使用频率: '',
    出题人: '',
  };
  dialogVisible.value = true;
};

const openEditDialog = (item) => {
  isEdit.value = true;
  formData.value = { ...item };
  dialogVisible.value = true;
};

const openViewDialog = (item) => {
  viewData.value = { ...item };
  viewVisible.value = true;
};

const handleSubmit = async (payload) => {
  try {
    if (isEdit.value) {
      await updateQuestion(payload.id, payload);
      showToast('✅ 修改成功', 'success');
    } else {
      await addQuestion(payload);
      showToast('✅ 新增成功', 'success');
    }
    dialogVisible.value = false;
    loadData();
    loadStats();
  } catch (error) {
    showToast(error.message || '操作失败', 'error');
  }
};

const handleDelete = async (item) => {
  if (!window.confirm(`确定要删除题目「${item.题目?.substring(0, 20)}${item.题目?.length > 20 ? '...' : ''}」吗？`)) {
    return;
  }
  try {
    await deleteQuestion(item.id);
    showToast('✅ 删除成功', 'success');
    if (list.value.length === 1 && page.value > 1) {
      page.value--;
    }
    loadData();
    loadStats();
  } catch (error) {
    showToast(error.message || '删除失败', 'error');
  }
};

// ===== 生命周期 =====
onMounted(() => {
  restoreSession();
  if (currentUser.value) {
    loadData();
    loadStats();
  }
  window.addEventListener('auth-expired', handleAuthExpired);
});

onUnmounted(() => {
  window.removeEventListener('auth-expired', handleAuthExpired);
});
</script>

<style scoped>
.app-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}
.app-title {
  color: #2c3e50;
  margin: 0;
  font-size: 24px;
}
.app-stats {
  display: flex;
  gap: 20px;
  color: #606266;
  font-size: 14px;
}
.app-stats strong {
  color: #409eff;
  font-size: 18px;
}
.app-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.user-area {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #606266;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 6px;
}
.role-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #fff;
}
.role-badge.admin { background: #f56c6c; }
.role-badge.teacher { background: #e6a23c; }
.role-badge.student { background: #409eff; }
.btn-link {
  background: none;
  border: 1px solid #dcdfe6;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  color: #606266;
  transition: all 0.2s;
}
.btn-link:hover {
  border-color: #667eea;
  color: #667eea;
}
.btn-logout {
  color: #ff4d4f;
  border-color: #ffcdd2;
}
.btn-logout:hover {
  border-color: #ff4d4f;
  color: #ff4d4f;
}

/* 导航 */
.app-nav {
  display: flex;
  gap: 8px;
}
.nav-btn {
  padding: 6px 16px;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
  transition: all 0.2s;
}
.nav-btn:hover {
  border-color: #667eea;
  color: #667eea;
}
.nav-btn.active {
  background: #667eea;
  border-color: #667eea;
  color: #fff;
}

/* 练习子导航 */
.practice-subnav {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.subnav-btn {
  padding: 8px 16px;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
  transition: all 0.2s;
}
.subnav-btn:hover {
  border-color: #667eea;
  color: #667eea;
}
.subnav-btn.active {
  background: #667eea;
  border-color: #667eea;
  color: #fff;
}

@media (max-width: 768px) {
  .app-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
