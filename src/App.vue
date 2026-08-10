<template>
  <!-- 未登录：显示登录页 -->
  <Login v-if="!currentUser" @success="handleLoginSuccess" />

  <!-- 已登录：Sidebar + Header + Main 三栏布局 -->
  <div v-else id="app">
    <!-- 左侧 Sidebar -->
    <aside class="iq-layout-sidebar">
      <div class="iq-sidebar-brand">
        <div class="iq-sidebar-logo">智</div>
        <span class="iq-font-semibold iq-text-lg" style="color: var(--iq-neutral-900);">智能题库</span>
      </div>
      <nav class="iq-sidebar-nav">
        <button
          class="iq-nav-item"
          :class="{ active: currentView === 'main' }"
          @click="currentView = 'main'"
        >
          <svg class="iq-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
          题库管理
        </button>
        <button
          class="iq-nav-item"
          :class="{ active: currentView === 'practice' && practiceView === 'exams' }"
          @click="practiceView = 'exams'; currentView = 'practice'"
        >
          <svg class="iq-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
          试卷列表
        </button>
        <button
          class="iq-nav-item"
          :class="{ active: currentView === 'practice' && practiceView === 'generate' }"
          @click="practiceView = 'generate'; currentView = 'practice'"
        >
          <svg class="iq-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
          </svg>
          答题练习
        </button>
        <button
          class="iq-nav-item"
          :class="{ active: currentView === 'practice' && practiceView === 'records' }"
          @click="practiceView = 'records'; currentView = 'practice'"
        >
          <svg class="iq-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          答题记录
        </button>
        <button
          class="iq-nav-item"
          :class="{ active: currentView === 'practice' && practiceView === 'stats' }"
          @click="practiceView = 'stats'; currentView = 'practice'"
        >
          <svg class="iq-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          统计分析
        </button>
        <button
          v-if="currentUser.role === 'admin' || currentUser.role === 'teacher'"
          class="iq-nav-item"
          :class="{ active: currentView === 'practice' && practiceView === 'admin-records' }"
          @click="practiceView = 'admin-records'; currentView = 'practice'"
        >
          <svg class="iq-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          做题管理
        </button>
        <button
          v-if="currentUser.role === 'admin'"
          class="iq-nav-item"
          :class="{ active: currentView === 'users' }"
          @click="currentView = 'users'"
        >
          <svg class="iq-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          用户管理
        </button>
      </nav>
    </aside>

    <!-- 顶部 Header -->
    <header class="iq-layout-header">
      <div>
        <nav class="iq-breadcrumb">
          <a @click="currentView = 'main'">首页</a>
          <span class="crumb-sep">/</span>
          <span>{{ currentBreadcrumb }}</span>
        </nav>
      </div>
      <div class="iq-header-right">
        <button class="iq-header-link" @click="pwdVisible = true">改密码</button>
        <button class="iq-header-link" @click="handleLogout">退出</button>
        <div class="iq-avatar-wrap">
          <div class="iq-avatar">{{ avatarChar }}</div>
          <div class="iq-avatar-info">
            <div class="iq-avatar-name">{{ currentUser.nickname || currentUser.username }}</div>
            <div class="iq-avatar-role">
              <span class="role-badge" :class="currentUser.role">{{ roleMap[currentUser.role] }}</span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="iq-layout-main">
      <!-- 题库管理视图 -->
      <template v-if="currentView === 'main'">
        <div class="iq-page-titlebar">
          <h1>题库管理</h1>
          <div v-if="canEdit" class="iq-page-actions">
            <button class="iq-btn iq-btn-secondary" @click="aiVisible = true">🤖 AI 出题</button>
            <button class="iq-btn iq-btn-secondary" @click="importVisible = true">📥 批量导入</button>
            <button class="iq-btn iq-btn-primary" @click="openAddDialog">+ 新增题目</button>
          </div>
        </div>

        <div v-if="stats" class="iq-stat-grid">
          <div class="iq-card iq-stat-card">
            <div class="iq-stat-label">题库总量</div>
            <div class="iq-stat-value">{{ stats.total }}</div>
          </div>
          <div class="iq-card iq-stat-card">
            <div class="iq-stat-label">章节数</div>
            <div class="iq-stat-value">{{ stats.byChapter?.length || 0 }}</div>
          </div>
        </div>

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

        <div style="margin-top: 16px;"></div>
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
      </template>

      <!-- 用户管理视图 -->
      <template v-if="currentView === 'users' && currentUser.role === 'admin'">
        <div class="iq-page-titlebar">
          <h1>用户管理</h1>
        </div>
        <UserManagement @toast="handleToastFromChild" />
      </template>

      <!-- 答题练习视图 -->
      <template v-if="currentView === 'practice'">
        <div class="iq-page-titlebar">
          <h1>{{ pageTitle }}</h1>
        </div>

        <!-- 练习子导航 -->
        <div class="iq-practice-subnav">
          <button class="iq-subnav-btn" :class="{ active: practiceView === 'exams' }" @click="practiceView = 'exams'">📋 试卷列表</button>
          <button class="iq-subnav-btn" :class="{ active: practiceView === 'generate' }" @click="practiceView = 'generate'">📝 随机组卷</button>
          <button class="iq-subnav-btn" :class="{ active: practiceView === 'records' }" @click="practiceView = 'records'">📊 答题记录</button>
          <button class="iq-subnav-btn" :class="{ active: practiceView === 'stats' }" @click="practiceView = 'stats'">📈 统计分析</button>
          <button
            v-if="currentUser.role === 'admin' || currentUser.role === 'teacher'"
            class="iq-subnav-btn"
            :class="{ active: practiceView === 'admin-records' }"
            @click="practiceView = 'admin-records'"
          >👥 做题管理</button>
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
          @view-record="viewRecord"
          @toast="handleToastFromChild"
        />

        <!-- 答题记录详情 -->
        <RecordDetail
          v-if="practiceView === 'record-detail' && activeRecordId"
          :recordId="activeRecordId"
          @back="practiceView = 'records'"
          @toast="handleToastFromChild"
        />

        <!-- 统计分析 -->
        <PracticeStats
          v-if="practiceView === 'stats'"
          @toast="handleToastFromChild"
        />

        <!-- 做题管理 -->
        <AdminRecords
          v-if="practiceView === 'admin-records' && (currentUser.role === 'admin' || currentUser.role === 'teacher')"
          :role="currentUser.role"
          @toast="handleToastFromChild"
        />
      </template>
    </main>

    <!-- 弹窗层 -->
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
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue';
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
const currentView = ref('main');
const pwdVisible = ref(false);

// ===== 答题练习 =====
const practiceView = ref('exams');
const activeExamId = ref(null);
const activeRecordId = ref(null);

const canEdit = computed(() => currentUser.value?.role === 'admin' || currentUser.value?.role === 'teacher');

const avatarChar = computed(() => {
  const name = currentUser.value?.nickname || currentUser.value?.username || 'U';
  return name.charAt(0).toUpperCase();
});

const currentBreadcrumb = computed(() => {
  if (currentView.value === 'main') return '题库管理';
  if (currentView.value === 'users') return '用户管理';
  if (currentView.value === 'practice') {
    const map = {
      exams: '试卷列表',
      generate: '随机组卷',
      practice: '答题中',
      records: '答题记录',
      'record-detail': '记录详情',
      stats: '统计分析',
      'admin-records': '做题管理',
    };
    return '答题练习 / ' + (map[practiceView.value] || '');
  }
  return '';
});

const pageTitle = computed(() => {
  const map = {
    exams: '📋 试卷列表',
    generate: '📝 随机组卷',
    practice: '✍️ 答题中',
    records: '📊 答题记录',
    'record-detail': '📝 答题详情',
    stats: '📈 统计分析',
    'admin-records': '👥 做题管理',
  };
  return map[practiceView.value] || '';
});

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

// ===== 题库管理 =====
const list = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const loading = ref(false);

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
.role-badge {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}
.role-badge.admin {
  background: var(--iq-state-error-bg);
  color: var(--iq-state-error);
}
.role-badge.teacher {
  background: var(--iq-state-info-bg);
  color: var(--iq-state-info);
}
.role-badge.student {
  background: var(--iq-state-success-bg);
  color: var(--iq-state-success);
}
</style>
