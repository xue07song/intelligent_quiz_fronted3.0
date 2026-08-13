<template>
  <!-- 未登录：显示登录页 -->
  <Login v-if="!currentUser" @success="handleLoginSuccess" @open-register="registerVisible = true" />

  <RegistrationDialog
    v-if="!currentUser"
    :visible="registerVisible"
    @close="registerVisible = false"
    @success="registerSuccess"
  />

  <!-- 已登录：Sidebar + Header + Main 三栏布局 -->
  <div v-else id="app">
    <!-- 左侧 Sidebar -->
    <aside class="iq-layout-sidebar" :class="{ open: sidebarOpen }">
      <div class="iq-sidebar-brand">
        <div class="iq-sidebar-logo">智</div>
        <span class="iq-font-semibold iq-text-lg" style="color: var(--iq-neutral-900);">智能题库</span>
      </div>
      <nav class="iq-sidebar-nav">
        <button
          v-if="currentUser.role !== 'student'"
          class="iq-nav-item"
          :class="{ active: currentView === 'main' }"
          @click="currentView = 'main'; sidebarOpen = false"
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
          v-if="currentUser.role !== 'admin'"
          class="iq-nav-item"
          :class="{ active: currentView === 'practice' && !standalonePracticeViews.includes(practiceView) }"

          @click="onEnterPractice"
=======
          @click="onEnterPractice(); sidebarOpen = false"

        >
          <svg class="iq-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
          </svg>
          {{ currentUser.role === 'student' ? '答题练习' : '出卷与学生管理' }}
        </button>
        <button v-if="currentUser.role === 'student'" class="iq-nav-item" :class="{ active: currentView === 'practice' && practiceView === 'adaptive' }" @click="openPracticeView('adaptive')">
          <span class="iq-nav-symbol">↗</span>自适应练习
        </button>
        <button v-if="currentUser.role === 'student'" class="iq-nav-item" :class="{ active: currentView === 'practice' && practiceView === 'adaptive-progress' }" @click="openPracticeView('adaptive-progress')">
          <span class="iq-nav-symbol">✓</span>我的自适应成果
        </button>
        <button class="iq-nav-item" :class="{ active: currentView === 'practice' && practiceView === 'learning-analysis' }" @click="openPracticeView('learning-analysis')">
          <span class="iq-nav-symbol">▥</span>{{ currentUser.role === 'student' ? '我的学习分析' : '学生个性化分析' }}
        </button>
        <button v-if="currentUser.role === 'teacher' || currentUser.role === 'admin'" class="iq-nav-item" :class="{ active: currentView === 'practice' && practiceView === 'adaptive-overview' }" @click="openPracticeView('adaptive-overview')">
          <span class="iq-nav-symbol">⌁</span>自适应学情
        </button>
        <button
          v-if="currentUser.role === 'admin'"
          class="iq-nav-item"
          :class="{ active: currentView === 'users' }"
          @click="currentView = 'users'; sidebarOpen = false"
        >
          <svg class="iq-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          用户管理
        </button>
        <button
          v-if="currentUser.role === 'admin' || currentUser.role === 'teacher'"
          class="iq-nav-item"
          :class="{ active: currentView === 'audit' }"
          @click="currentView = 'audit'; sidebarOpen = false"
        >
          <svg class="iq-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 11l3 3L22 4"></path>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
          </svg>
          注册审核
          <span v-if="pendingCount > 0" class="iq-nav-badge">{{ pendingCount }}</span>
        </button>
        <button
          class="iq-nav-item"
          :class="{ active: currentView === 'feedback' }"
          @click="currentView = 'feedback'; sidebarOpen = false"
        >
          <svg class="iq-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          用户反馈
        </button>
        <button
          class="iq-nav-item"
          :class="{ active: currentView === 'profile' }"
          @click="currentView = 'profile'; sidebarOpen = false"
        >
          <svg class="iq-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="8" r="4"></circle>
            <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"></path>
          </svg>
          个人中心
        </button>
      </nav>
    </aside>

    <div v-if="sidebarOpen" class="iq-sidebar-overlay" @click="sidebarOpen = false"></div>

    <!-- 顶部 Header -->
    <header class="iq-layout-header">
      <button class="iq-sidebar-toggle" @click="sidebarOpen = !sidebarOpen" aria-label="打开菜单">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
      <div>
        <nav class="iq-breadcrumb">
          <a @click="currentView = 'main'; sidebarOpen = false">首页</a>
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
      <template v-if="currentView === 'main' && currentUser.role !== 'student'">
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
          :subjects="currentUser.subjects || []"
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
          :compact="currentUser.role === 'admin' || currentUser.role === 'teacher'"
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

      <!-- 注册审核视图 -->
      <template v-if="currentView === 'audit' && (currentUser.role === 'admin' || currentUser.role === 'teacher')">
        <div class="iq-page-titlebar">
          <h1>注册审核</h1>
        </div>
        <RegistrationAudit @toast="handleToastFromChild" @update:pending="loadPendingCount" />
      </template>

      <!-- 用户反馈视图 -->
      <template v-if="currentView === 'feedback'">
        <div class="iq-page-titlebar">
          <h1>用户反馈</h1>
        </div>
        <Feedback :role="currentUser.role" @toast="handleToastFromChild" />
      </template>

      <!-- 个人中心视图 -->
      <Profile v-if="currentView === 'profile'" />

      <!-- 答题练习视图 -->
      <template v-if="currentView === 'practice'">
        <div class="iq-page-titlebar">
          <h1>{{ pageTitle }}</h1>
        </div>

        <!-- 练习子导航 -->
        <div v-if="!standalonePracticeViews.includes(practiceView)" class="iq-practice-subnav">
          <button class="iq-subnav-btn" :class="{ active: practiceView === 'exams' }" @click="practiceView = 'exams'">📋 试卷列表</button>


          <button v-if="currentUser.role === 'teacher'" class="iq-subnav-btn" :class="{ active: practiceView === 'generate' }" @click="practiceView = 'generate'">📝 智能组卷</button>
          <button v-if="currentUser.role === 'student'" class="iq-subnav-btn" :class="{ active: practiceView === 'wrong-book' }" @click="practiceView = 'wrong-book'">📕 错题本</button>
          <button v-if="currentUser.role === 'student'" class="iq-subnav-btn" :class="{ active: practiceView === 'records' }" @click="practiceView = 'records'">📊 我的答题记录</button>
          <button v-if="currentUser.role === 'student'" class="iq-subnav-btn" :class="{ active: practiceView === 'stats' }" @click="practiceView = 'stats'">📈 我的统计</button>

=======
          <button v-if="currentUser.role === 'teacher'" class="iq-subnav-btn" :class="{ active: practiceView === 'generate' }" @click="practiceView = 'generate'">📝 智能组卷</button>
          <button v-if="currentUser.role === 'student'" class="iq-subnav-btn" :class="{ active: practiceView === 'wrong-book' }" @click="practiceView = 'wrong-book'">📕 错题本</button>
          <button class="iq-subnav-btn" :class="{ active: practiceView === 'records' }" @click="practiceView = 'records'">📊 答题记录</button>

          <button
            v-if="currentUser.role === 'admin' || currentUser.role === 'teacher'"
            class="iq-subnav-btn"
            :class="{ active: practiceView === 'admin-records' }"
            @click="practiceView = 'admin-records'"
          >📊 试卷分析</button>
          <button
            v-if="currentUser.role === 'admin' || currentUser.role === 'teacher'"
            class="iq-subnav-btn"
            :class="{ active: practiceView === 'classes' }"
            @click="practiceView = 'classes'"
          >🏫 班级管理</button>
        </div>

        <!-- 试卷列表 -->
        <ExamList
          v-if="practiceView === 'exams'"
          :role="currentUser.role"
          @generate="practiceView = 'generate'"
          @start-exam="startExam"
          @toast="handleToastFromChild"
        />

        <!-- 智能组卷 -->
        <GenerateExam
          v-if="practiceView === 'generate' && currentUser.role === 'teacher'"
          :role="currentUser.role"
          :subjects="currentUser.subjects || []"
          @start-exam="startExam"
          @toast="handleToastFromChild"
        />


        <!-- 错题本 -->
        <WrongBook
          v-if="practiceView === 'wrong-book' && currentUser.role === 'student'"
          @start-exam="startExam"
          @toast="handleToastFromChild"
        />

=======


        <!-- 班级管理 -->
        <ClassManagement
          v-if="practiceView === 'classes' && (currentUser.role === 'admin' || currentUser.role === 'teacher')"
          @toast="handleToastFromChild"
        />

        <AdaptivePractice
          v-if="practiceView === 'adaptive' && currentUser.role === 'student'"
          :initial-filters="analysisPracticeFilters"
          @toast="handleToastFromChild"
        />

        <LearningAnalysis
          v-if="practiceView === 'learning-analysis'"
          :role="currentUser.role"
          @practice="openRecommendedPractice"
          @navigate="practiceView = $event"
          @toast="handleToastFromChild"
        />

        <AdaptiveOverview
          v-if="practiceView === 'adaptive-overview' && (currentUser.role === 'teacher' || currentUser.role === 'admin')"
          @toast="handleToastFromChild"
        />

        <AdaptiveProgress
          v-if="practiceView === 'adaptive-progress' && currentUser.role === 'student'"
          @practice="practiceView = 'adaptive'"

          @toast="handleToastFromChild"
        />

        <!-- 答题页面 -->
        <ExamPractice
          v-if="practiceView === 'practice' && activeExamId"
          :examId="activeExamId"
          @exit="exitExam"
          @view-record="viewRecord"
          @update-question-id="currentQuestionId = $event"
          @update-exam-id="currentExamId = $event"
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
      :role="currentUser.role"
      :subjects="currentUser.subjects || []"
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
      :role="currentUser.role"
      :subjects="currentUser.subjects || []"
      @close="importVisible = false"
      @success="handleImportSuccess"
    />

    <AiGenerate
      :visible="aiVisible"
      @close="aiVisible = false"
      @success="handleAiSuccess"
    />

    <Toast :message="toastMessage" :type="toastType" />

    <AIAssistant
      v-if="currentUser?.role === 'student'"
      @start-exam="startExam"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, provide, onMounted, onUnmounted, watch } from 'vue';
import {
  getQuestions,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  getStatistics,
  batchDeleteQuestions,
} from '@/api/question';
import { getRegistrations } from '@/api/auth';
import SearchBar from '@/components/SearchBar.vue';
import QuestionTable from '@/components/QuestionTable.vue';
import QuestionForm from '@/components/QuestionForm.vue';
import QuestionDetail from '@/components/QuestionDetail.vue';
import Pagination from '@/components/Pagination.vue';
import Toast from '@/components/Toast.vue';
import Login from '@/components/Login.vue';
import RegistrationDialog from '@/components/RegistrationDialog.vue';
import UserManagement from '@/components/UserManagement.vue';
import RegistrationAudit from '@/components/RegistrationAudit.vue';
import ChangePassword from '@/components/ChangePassword.vue';
import AIAssistant from '@/components/AIAssistant.vue';
import ImportQuestions from '@/components/ImportQuestions.vue';
import AiGenerate from '@/components/AiGenerate.vue';
import Feedback from '@/components/Feedback.vue';
import Profile from '@/components/Profile.vue';
import GenerateExam from '@/components/practice/GenerateExam.vue';
import ExamList from '@/components/practice/ExamList.vue';

import WrongBook from '@/components/practice/WrongBook.vue';
import ClassManagement from '@/components/practice/ClassManagement.vue';

import ExamPractice from '@/components/practice/ExamPractice.vue';
import PracticeRecords from '@/components/practice/PracticeRecords.vue';
import RecordDetail from '@/components/practice/RecordDetail.vue';
import PracticeStats from '@/components/practice/PracticeStats.vue';
import AdminRecords from '@/components/practice/AdminRecords.vue';
import AdaptivePractice from '@/components/practice/AdaptivePractice.vue';
import AdaptiveOverview from '@/components/practice/AdaptiveOverview.vue';
import AdaptiveProgress from '@/components/practice/AdaptiveProgress.vue';
import LearningAnalysis from '@/components/practice/LearningAnalysis.vue';
import '@/components/practice/learning-analysis.css';

const roleMap = { admin: '管理员', teacher: '教师', student: '学生' };

// ===== 登录态管理 =====
const currentUser = ref(null);
const currentView = ref('main');
const sidebarOpen = ref(false);
const pwdVisible = ref(false);

// ===== 答题练习 =====
const practiceView = ref('exams');
const currentQuestionId = ref(null);
const currentExamId = ref(null);
const standalonePracticeViews = ['adaptive', 'adaptive-progress', 'learning-analysis', 'adaptive-overview'];
const activeExamId = ref(null);
const activeRecordId = ref(null);
const analysisPracticeFilters = ref({});
const openPracticeView = (view) => {
  practiceView.value = view;
  currentView.value = 'practice';
};
const openRecommendedPractice = (filters = {}) => {
  analysisPracticeFilters.value = { ...filters };
  practiceView.value = 'adaptive';
};

// 教师端进入出卷与学生管理：默认进入"试卷分析"；学生端仍为"试卷列表"
const onEnterPractice = () => {
  if (currentUser.value?.role === 'teacher') {
    practiceView.value = 'admin-records';
  } else if (currentUser.value?.role === 'student') {
    practiceView.value = 'exams';
  } else {
    practiceView.value = 'exams';
  }
  currentView.value = 'practice';
};

provide('assistantState', {
  currentView,
  practiceView,
  currentQuestionId,
  currentExamId,
  currentUser,
});

const canEdit = computed(() => currentUser.value?.role === 'admin' || currentUser.value?.role === 'teacher');

// ===== 注册审核 =====
const registerVisible = ref(false);
const pendingCount = ref(0);

const loadPendingCount = async () => {
  if (!currentUser.value || currentUser.value.role === 'student') return;
  try {
    const data = await getRegistrations({ status: 'pending', pageSize: 1 });
    pendingCount.value = data.total;
  } catch (e) {
    pendingCount.value = 0;
  }
};

const registerSuccess = () => {
  registerVisible.value = false;
  showToast('✅ 注册申请已提交，请等待管理员审核', 'success');
};

const avatarChar = computed(() => {
  const name = currentUser.value?.nickname || currentUser.value?.username || 'U';
  return name.charAt(0).toUpperCase();
});

const currentBreadcrumb = computed(() => {
  if (currentView.value === 'main') return '题库管理';
  if (currentView.value === 'users') return '用户管理';
  if (currentView.value === 'audit') return '注册审核';
  if (currentView.value === 'feedback') return '用户反馈';
  if (currentView.value === 'profile') return '个人中心';
  if (currentView.value === 'practice') {
    const map = {
      exams: '试卷列表',
      generate: '智能组卷',
      'wrong-book': '错题本',
      adaptive: '自适应练习',
      'adaptive-overview': '自适应学情',
      'adaptive-progress': '我的自适应成果',
      'learning-analysis': '学习分析',
      practice: '答题中',
      records: '答题记录',
      'record-detail': '记录详情',
      stats: '统计分析',
      'admin-records': '试卷分析',
      classes: '班级管理',
    };
    const parent = currentUser.value?.role === 'student' ? '答题练习' : '出卷与学生管理';
    return parent + ' / ' + (map[practiceView.value] || '');
  }
  return '';
});


const pageTitle = computed(() => {
  const map = {
    exams: '📋 试卷列表',
    generate: '📝 智能组卷',

    'wrong-book': '📕 错题本',
    adaptive: '🧭 自适应练习',
    'adaptive-overview': '📈 自适应学情',
    'adaptive-progress': '🏅 我的自适应成果',
    'learning-analysis': '学习分析',

    practice: '✍️ 答题中',
    records: '📊 答题记录',
    'record-detail': '📝 答题详情',
    stats: '📈 统计分析',
    'admin-records': '👥 做题管理',
    classes: '🏫 班级管理',
  };
  return map[practiceView.value] || '';
});

=======

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
      const user = JSON.parse(userStr);
      currentUser.value = user;
      if (user.role === 'student') {
        currentView.value = 'practice';
        practiceView.value = 'exams';
      }
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
};

const handleLoginSuccess = (user) => {
  currentUser.value = user;
  if (user.role === 'student') {
    currentView.value = 'practice';
    practiceView.value = 'exams';
  } else {
    currentView.value = 'main';
  }
  loadData();
  loadStats();
  loadPendingCount();
};

const handleLogout = () => {
  if (!window.confirm('确定要退出登录吗？')) return;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  currentUser.value = null;
  currentView.value = 'main';
  pendingCount.value = 0;
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

watch(currentView, (val) => {
  if (val === 'main' && currentUser.value?.role === 'student') {
    currentView.value = 'practice';
    practiceView.value = 'exams';
  }
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
  科目: '',
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
    if (filters.科目) params.科目 = filters.科目;

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
  filters.科目 = '';
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
  const teacherSubjects = currentUser.value?.subjects || [];
  const defaultSubject = teacherSubjects.length === 1 ? teacherSubjects[0] : '';
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
    科目: defaultSubject,
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
    loadPendingCount();
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

.iq-nav-badge {
  display: inline-block;
  min-width: 20px;
  height: 20px;
  line-height: 20px;
  padding: 0 6px;
  background: #ef4444;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  text-align: center;
  border-radius: 10px;
  margin-left: 4px;
}
</style>
