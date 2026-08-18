<template>
  <!-- ===== 未登录：显示登录页 ===== -->
  <Login v-if="!currentUser" @success="handleLoginSuccess" @open-register="registerVisible = true" />

  <RegistrationDialog
      v-if="!currentUser"
      :visible="registerVisible"
      @close="registerVisible = false"
      @success="registerSuccess"
  />

  <!-- ============================================================== -->
  <!-- 已登录：根据角色渲染不同布局                                    -->
  <!-- ============================================================== -->
  <div v-else>
    <!-- ============================================================ -->
    <!-- 学生端：顶部标签导航布局（5个标签 + 右上角下拉菜单）          -->
    <!-- ============================================================ -->
    <div v-if="currentUser.role === 'student'" class="student-layout">
      <header class="student-header">
        <div class="header-left">
          <div class="brand">
            <span class="brand-icon">📚</span>
            <span class="brand-name">智能题库</span>
          </div>
        </div>

        <nav class="header-nav" ref="navContainer">
          <button
              v-for="tab in studentTabs"
              :key="tab.key"
              class="nav-tab"
              :class="{ active: currentView === tab.key }"
              @click="navigateTo(tab.key)"
          >
            {{ tab.icon }} {{ tab.label }}
          </button>
        </nav>

        <div class="header-right" ref="userMenuRef">
          <div class="user-menu-trigger" :class="{ open: showUserMenu }" @click.stop="toggleUserMenu">
            <span class="user-avatar">{{ avatarChar }}</span>
            <span class="user-name">{{ currentUser.nickname || currentUser.username }}</span>
            <span class="dropdown-arrow">▼</span>
          </div>

          <div v-if="showUserMenu" class="user-dropdown">
            <div class="dropdown-header">
              <span class="dropdown-avatar">{{ avatarChar }}</span>
              <div class="dropdown-user-info">
                <div class="dropdown-username">{{ currentUser.nickname || currentUser.username }}</div>
                <div class="dropdown-role">学生</div>
              </div>
            </div>
            <div class="dropdown-divider"></div>
            <div class="dropdown-item" @click="goToProfile">
              <span>👤</span> 个人资料
            </div>
            <div class="dropdown-item" @click="openChangePasswordFromMenu">
              <span>🔐</span> 修改密码
            </div>
            <div class="dropdown-item" @click="openFeedbackFromMenu">
              <span>💬</span> 用户反馈
            </div>
            <div class="dropdown-divider"></div>
            <div class="dropdown-item logout" @click="handleLogout">
              <span>🚪</span> 退出登录
            </div>
          </div>

          <div v-if="showUserMenu" class="dropdown-overlay" @click="showUserMenu = false"></div>
        </div>
      </header>

      <main class="student-main">
        <ExamList
            v-if="currentView === 'papers'"
            :role="currentUser.role"
            @start-exam="startExam"
            @toast="handleToastFromChild"
        />
        <ExamPractice
            v-if="currentView === 'practice' && activeExamId"
            :examId="activeExamId"
            @exit="exitExam"
            @view-record="viewRecord"
            @toast="handleToastFromChild"
        />
        <AdaptivePractice
            v-if="currentView === 'adaptive'"
            @toast="handleToastFromChild"
        />
        <WrongBook
            v-if="currentView === 'wrongbook'"
            @start-exam="startExam"
            @start-single-practice="startSinglePractice"
            @toast="handleToastFromChild"
        />
        <PracticeRecords
            v-if="currentView === 'records'"
            @view-record="viewRecord"
            @toast="handleToastFromChild"
        />
        <LearningAnalysis
            v-if="currentView === 'analysis'"
            :role="currentUser.role"
            @practice="handlePracticeFromAnalysis"
            @navigate="handleNavigateFromAnalysis"
            @toast="handleToastFromChild"
        />
        <Profile v-if="currentView === 'profile'" />
        <Feedback
            v-if="currentView === 'feedback'"
            :role="currentUser.role"
            @toast="handleToastFromChild"
        />
        <Favorites
            v-if="currentView === 'favorites'"
            @close="currentView = 'analysis'"
            @start-exam="startExam"
            @start-single-practice="startSinglePractice"
        />
        <SingleQuestionPractice
            v-if="currentView === 'single-practice' && singleQuestionId"
            :questionId="singleQuestionId"
            @exit="exitSinglePractice"
        />
      </main>
    </div>

    <!-- ============================================================ -->
    <!-- 教师/管理员端：侧边栏布局                                      -->
    <!-- ============================================================ -->
    <div v-else id="app">
      <aside class="iq-layout-sidebar" :class="{ open: sidebarOpen }">
        <div class="iq-sidebar-brand">
          <div class="iq-sidebar-logo">📚</div>
          <span class="brand-name">智能题库</span>
          <span class="brand-role" v-if="currentUser.role === 'admin'">管理员</span>
          <span class="brand-role" v-else>教师</span>
        </div>

        <nav class="iq-sidebar-nav">
          <div class="iq-nav-group">
            <div class="iq-nav-group-label">教学管理</div>
            <button
                v-if="currentUser.role === 'teacher'"
                class="iq-nav-item"
                :class="{ active: currentView === 'main' }"
                @click="currentView = 'main'; sidebarOpen = false"
            >
              <span class="iq-nav-icon">📚</span> 题库管理
            </button>
            <button
                class="iq-nav-item"
                :class="{ active: currentView === 'practice' && (currentUser.role === 'admin' ? practiceView === 'exams' : practiceView === 'generate') }"
                @click="openPracticeView(currentUser.role === 'admin' ? 'exams' : 'generate'); sidebarOpen = false"
            >
              <span class="iq-nav-icon">📝</span> {{ currentUser.role === 'admin' ? '试卷列表管理' : '出卷管理' }}
            </button>
            <button
                class="iq-nav-item"
                :class="{ active: currentView === 'practice' && practiceView === 'classes' }"
                @click="openPracticeView('classes'); sidebarOpen = false"
            >
              <span class="iq-nav-icon">🏫</span> 班级管理
            </button>
          </div>

          <div class="iq-nav-group">
            <div class="iq-nav-group-label">教学数据</div>
            <button
                class="iq-nav-item"
                :class="{ active: currentView === 'practice' && practiceView === 'admin-records' }"
                @click="openPracticeView('admin-records'); sidebarOpen = false"
            >
              <span class="iq-nav-icon">📊</span> 试卷分析
            </button>
            <button
                class="iq-nav-item"
                :class="{ active: currentView === 'practice' && practiceView === 'learning-analysis' }"
                @click="openPracticeView('learning-analysis'); sidebarOpen = false"
            >
              <span class="iq-nav-icon">📈</span> {{ currentUser.role === 'admin' ? '学生个性化分析' : '学情分析' }}
            </button>
            <button
                class="iq-nav-item"
                :class="{ active: currentView === 'practice' && practiceView === 'adaptive-overview' }"
                @click="openPracticeView('adaptive-overview'); sidebarOpen = false"
            >
              <span class="iq-nav-icon">📊</span> 自适应学情
            </button>
            <button
                class="iq-nav-item"
                :class="{ active: currentView === 'practice' && practiceView === 'adaptive-review' }"
                @click="openPracticeView('adaptive-review'); sidebarOpen = false"
            >
              <span class="iq-nav-icon">📝</span> 自适应复核
            </button>
          </div>

          <div v-if="currentUser.role === 'admin'" class="iq-nav-group">
            <div class="iq-nav-group-label">系统管理</div>
            <button
                class="iq-nav-item"
                :class="{ active: currentView === 'users' }"
                @click="currentView = 'users'; sidebarOpen = false"
            >
              <span class="iq-nav-icon">👥</span> 用户管理
            </button>
            <button
                class="iq-nav-item"
                :class="{ active: currentView === 'audit' }"
                @click="currentView = 'audit'; sidebarOpen = false"
            >
              <span class="iq-nav-icon">✅</span> 注册审核
              <span v-if="pendingCount > 0" class="iq-nav-badge">{{ pendingCount }}</span>
            </button>
          </div>
        </nav>

        <div class="iq-sidebar-footer">
          <div class="sidebar-user-trigger" @click.stop="toggleSidebarUserMenu">
            <div class="user-info">
              <div class="user-avatar">{{ avatarChar }}</div>
              <div class="user-detail">
                <div class="user-name">{{ currentUser.nickname || currentUser.username }}</div>
                <div class="user-role">
                  <span class="role-badge" :class="currentUser.role">{{ roleMap[currentUser.role] }}</span>
                </div>
              </div>
            </div>
            <span class="dropdown-arrow" :class="{ open: showSidebarUserMenu }">▼</span>
          </div>

          <div v-if="showSidebarUserMenu" class="sidebar-user-dropdown">
            <div class="dropdown-item" @click="goToProfile">
              <span>👤</span> 个人中心
            </div>
            <div class="dropdown-item" @click="openChangePasswordFromMenu">
              <span>🔐</span> 修改密码
            </div>
            <div class="dropdown-item" @click="openFeedbackFromMenu">
              <span>💬</span> 用户反馈
            </div>
            <div class="dropdown-divider"></div>
            <div class="dropdown-item logout" @click="handleLogout">
              <span>🚪</span> 退出登录
            </div>
          </div>
        </div>
      </aside>

      <div v-if="sidebarOpen" class="iq-sidebar-overlay" @click="sidebarOpen = false"></div>

      <header class="iq-layout-header">
        <div class="header-left">
          <button class="iq-sidebar-toggle" @click="sidebarOpen = !sidebarOpen" aria-label="打开菜单">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <nav class="iq-breadcrumb">
            <span class="breadcrumb-home" @click="goHome">首页</span>
            <span class="crumb-sep">/</span>
            <span class="breadcrumb-current">{{ currentBreadcrumb }}</span>
          </nav>
        </div>
        <div class="iq-header-right">
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

      <main class="iq-layout-main">
        <template v-if="currentView === 'main'">
          <div class="question-bank-page">
            <header class="iq-page-hero">
              <div class="hero-content">
                <span class="hero-badge">📚 教学管理</span>
                <h1 class="hero-title">题库管理</h1>
                <p class="hero-desc">管理所有题目，支持 AI 出题和批量导入</p>
              </div>
              <div v-if="canEdit" class="hero-actions">
                <button class="iq-btn iq-btn-secondary-light" @click="aiVisible = true">🤖 AI 出题</button>
                <button class="iq-btn iq-btn-secondary-light" @click="importVisible = true">📥 批量导入</button>
                <button class="iq-btn iq-btn-secondary-light" @click="imageRecognitionVisible = true">🖼️ 图片识别</button>
                <button class="iq-btn iq-btn-primary" @click="openAddDialog">+ 新增题目</button>
              </div>
            </header>

            <div v-if="stats" class="iq-stat-grid">
              <div class="iq-card iq-stat-card">
                <div class="iq-stat-label">📊 题库总量</div>
                <div class="iq-stat-value">{{ stats.total }}</div>
              </div>
              <div class="iq-card iq-stat-card">
                <div class="iq-stat-label">📂 章节数</div>
                <div class="iq-stat-value">{{ stats.byChapter?.length || 0 }}</div>
              </div>
            </div>

            <SearchBar
                :initialFilters="filters"
                :role="currentUser.role"
                :subjects="currentUser.subjects || []"
                @search="handleSearch"
                @reset="handleReset"
            />

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
          </div>
        </template>

        <template v-if="currentView === 'users' && currentUser.role === 'admin'">
          <div class="iq-page-titlebar"><h1>👥 用户管理</h1></div>
          <UserManagement @toast="handleToastFromChild" />
        </template>

        <template v-if="currentView === 'audit' && currentUser.role === 'admin'">
          <div class="iq-page-titlebar"><h1>✅ 注册审核</h1></div>
          <RegistrationAudit @toast="handleToastFromChild" @update:pending="loadPendingCount" />
        </template>

        <template v-if="currentView === 'profile'">
          <Profile />
        </template>

        <template v-if="currentView === 'feedback'">
          <div class="iq-page-titlebar"><h1>💬 用户反馈</h1></div>
          <Feedback :role="currentUser.role" @toast="handleToastFromChild" />
        </template>

        <template v-if="currentView === 'favorites'">
          <Favorites
              @close="currentView = 'analysis'"
              @start-exam="startExam"
              @start-single-practice="startSinglePractice"
          />
        </template>

        <SingleQuestionPractice
            v-if="currentView === 'single-practice' && singleQuestionId"
            :questionId="singleQuestionId"
            @exit="exitSinglePractice"
        />

        <template v-if="currentView === 'practice'">
          <div v-if="!standalonePracticeViews.includes(practiceView) && practiceView !== 'generate'" class="iq-page-titlebar">
            <h1>{{ pageTitle }}</h1>
          </div>

          <div v-if="!standalonePracticeViews.includes(practiceView)" class="iq-practice-subnav">
            <button class="iq-subnav-btn" :class="{ active: practiceView === 'exams' }" @click="practiceView = 'exams'">📋 试卷列表</button>
            <button v-if="currentUser.role === 'teacher'" class="iq-subnav-btn" :class="{ active: practiceView === 'generate' }" @click="practiceView = 'generate'">📝 智能组卷</button>
          </div>

          <ExamList
              v-if="practiceView === 'exams'"
              :role="currentUser.role"
              @generate="currentUser.role === 'teacher' && (practiceView = 'generate')"
              @start-exam="startExam"
              @toast="handleToastFromChild"
          />

          <GenerateExam
              v-if="practiceView === 'generate' && currentUser.role === 'teacher'"
              :role="currentUser.role"
              :subjects="currentUser.subjects || []"
              @start-exam="startExam"
              @toast="handleToastFromChild"
          />

          <ClassManagement
              v-if="practiceView === 'classes'"
              @toast="handleToastFromChild"
          />

          <LearningAnalysis
              v-if="practiceView === 'learning-analysis'"
              :role="currentUser.role"
              @practice="handlePracticeFromAnalysis"
              @navigate="handleNavigateFromAnalysis"
              @toast="handleToastFromChild"
          />

          <AdaptiveOverview
              v-if="practiceView === 'adaptive-overview'"
              @toast="handleToastFromChild"
          />

          <AdaptiveReview
              v-if="practiceView === 'adaptive-review'"
              @toast="handleToastFromChild"
          />

          <AdminRecords
              v-if="practiceView === 'admin-records'"
              :role="currentUser.role"
              @toast="handleToastFromChild"
          />
        </template>
      </main>

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
          :role="currentUser.role"
          :subjects="currentUser.subjects || []"
          @close="aiVisible = false"
          @success="handleAiSuccess"
      />

      <ImageRecognition
          :visible="imageRecognitionVisible"
          :role="currentUser.role"
          :subjects="currentUser.subjects || []"
          @close="imageRecognitionVisible = false"
          @success="handleImportSuccess"
      />

      <Toast :message="toastMessage" :type="toastType" />
    </div>
  </div>

  <Toast :message="toastMessage" :type="toastType" v-if="currentUser" />
</template>

<script setup>
import { ref, reactive, computed, provide, onMounted, onUnmounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';

import Login from '@/components/Login.vue';
import RegistrationDialog from '@/components/RegistrationDialog.vue';
import Toast from '@/components/Toast.vue';
import SearchBar from '@/components/SearchBar.vue';
import QuestionTable from '@/components/QuestionTable.vue';
import QuestionForm from '@/components/QuestionForm.vue';
import QuestionDetail from '@/components/QuestionDetail.vue';
import Pagination from '@/components/Pagination.vue';
import UserManagement from '@/components/UserManagement.vue';
import RegistrationAudit from '@/components/RegistrationAudit.vue';
import ChangePassword from '@/components/ChangePassword.vue';
import ImportQuestions from '@/components/ImportQuestions.vue';
import ImageRecognition from '@/components/ImageRecognition.vue';
import AiGenerate from '@/components/AiGenerate.vue';
import Feedback from '@/components/Feedback.vue';
import Profile from '@/components/Profile.vue';

import ExamList from '@/components/practice/ExamList.vue';
import ExamPractice from '@/components/practice/ExamPractice.vue';
import AdaptivePractice from '@/components/practice/AdaptivePractice.vue';
import WrongBook from '@/components/practice/WrongBook.vue';
import PracticeRecords from '@/components/practice/PracticeRecords.vue';
import LearningAnalysis from '@/components/practice/LearningAnalysis.vue';
import AdaptiveOverview from '@/components/practice/AdaptiveOverview.vue';
import AdaptiveReview from '@/components/practice/AdaptiveReview.vue';
import GenerateExam from '@/components/practice/GenerateExam.vue';
import ClassManagement from '@/components/practice/ClassManagement.vue';
import AdminRecords from '@/components/practice/AdminRecords.vue';

import Favorites from '@/views/Favorites.vue';

// ===== [新增] 单题练习组件 =====
import SingleQuestionPractice from '@/components/practice/SingleQuestionPractice.vue';

import {
  getQuestions,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  getStatistics,
  batchDeleteQuestions,
} from '@/api/question';
import { getRegistrations } from '@/api/auth';

// ================================================================
// 路由实例
// ================================================================
const router = useRouter();
const route = useRoute();

// ================================================================
// 常量
// ================================================================
const roleMap = { admin: '管理员', teacher: '教师', student: '学生' };

const studentTabs = [
  { key: 'papers', label: '试卷列表', icon: '📋' },
  { key: 'adaptive', label: '自适应练习', icon: '🎯' },
  { key: 'wrongbook', label: '错题本', icon: '📕' },
  { key: 'records', label: '答题记录', icon: '📊' },
  { key: 'analysis', label: '学情分析', icon: '📈' },
];

// ================================================================
// 登录态管理
// ================================================================
const currentUser = ref(null);
const registerVisible = ref(false);
const currentView = ref('papers');
const sidebarOpen = ref(false);
const pwdVisible = ref(false);

// ================================================================
// 答题练习状态
// ================================================================
const practiceView = ref('exams');
const standalonePracticeViews = ['adaptive', 'adaptive-progress', 'learning-analysis', 'adaptive-overview', 'adaptive-review', 'classes', 'admin-records'];
const activeExamId = ref(null);
const activeRecordId = ref(null);
const analysisPracticeFilters = ref({});
const currentQuestionId = ref(null);
const currentQuestion = ref(null);
const currentExamId = ref(null);

// ===== [新增] 单题练习状态 =====
const singleQuestionId = ref(null);
// ===== [新增] 记录进入单题练习前的视图 =====
const previousView = ref(null);

// ================================================================
// 路由监听
// ================================================================
watch(() => route.path, (newPath) => {
  if (newPath === '/favorites') {
    currentView.value = 'favorites';
  }
}, { immediate: true });

const openPracticeView = (view) => {
  practiceView.value = view;
  currentView.value = 'practice';
};

const handlePracticeFromAnalysis = (filters) => {
  analysisPracticeFilters.value = filters || {};
  currentView.value = 'practice';

  if (filters?.adaptive) {
    practiceView.value = 'adaptive';
  } else if (filters?.questionTypes || filters?.chapters || filters?.knowledgeKeyword) {
    practiceView.value = 'adaptive';
    analysisPracticeFilters.value = filters;
  } else {
    practiceView.value = 'exams';
  }

  sidebarOpen.value = false;
  showToast('已跳转到练习页面', 'success');
};

const handleNavigateFromAnalysis = (target) => {
  if (target === 'generate') {
    currentView.value = 'practice';
    practiceView.value = 'generate';
    sidebarOpen.value = false;
    showToast('已跳转到智能组卷', 'success');
  }
};

const openRecommendedPractice = (filters = {}) => {
  analysisPracticeFilters.value = { ...filters };
  practiceView.value = 'adaptive';
};

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
  currentQuestion,
  currentExamId,
  currentUser,
});

// ================================================================
// 导航
// ================================================================
const navigateTo = (view) => {
  currentView.value = view;
  if (view === 'favorites') {
    router.push('/favorites');
  }
};

const goHome = () => {
  if (currentUser.value?.role === 'student') {
    currentView.value = 'papers';
    router.push('/');
  } else {
    currentView.value = 'main';
  }
  sidebarOpen.value = false;
};

// ================================================================
// 学生端下拉菜单
// ================================================================
const showUserMenu = ref(false);
const userMenuRef = ref(null);

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value;
};

const closeUserMenu = () => {
  showUserMenu.value = false;
};

// ================================================================
// 教师端侧边栏底部下拉菜单
// ================================================================
const showSidebarUserMenu = ref(false);

const toggleSidebarUserMenu = () => {
  showSidebarUserMenu.value = !showSidebarUserMenu.value;
};

const closeSidebarUserMenu = () => {
  showSidebarUserMenu.value = false;
};

// ================================================================
// 公共操作
// ================================================================
const goToProfile = () => {
  currentView.value = 'profile';
  closeUserMenu();
  closeSidebarUserMenu();
};

const openChangePasswordFromMenu = () => {
  pwdVisible.value = true;
  closeUserMenu();
  closeSidebarUserMenu();
};

const openFeedbackFromMenu = () => {
  currentView.value = 'feedback';
  closeUserMenu();
  closeSidebarUserMenu();
};

const handleClickOutside = (event) => {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target)) {
    showUserMenu.value = false;
  }
};

// ================================================================
// 计算属性
// ================================================================
const canEdit = computed(() => currentUser.value?.role === 'admin' || currentUser.value?.role === 'teacher');

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
  if (currentView.value === 'favorites') return '我的收藏';
  if (currentView.value === 'single-practice') return '单题练习';
  if (currentView.value === 'practice') {
    const map = {
      exams: '试卷列表',
      generate: '智能组卷',
      'wrong-book': '错题本',
      adaptive: '自适应练习',
      'adaptive-overview': '自适应学情',
      'adaptive-review': '自适应复核',
      'adaptive-progress': '自适应成果',
      'learning-analysis': '学习分析',
      practice: '答题中',
      records: '答题记录',
      'record-detail': '记录详情',
      stats: '统计分析',
      'admin-records': '试卷分析',
      classes: '班级管理',
    };
    return '出卷与学生管理 / ' + (map[practiceView.value] || '');
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
    'adaptive-review': '📝 自适应复核',
    'adaptive-progress': '🏅 自适应成果',
    'learning-analysis': '📉 学习分析',
    practice: '✍️ 答题中',
    records: '📊 答题记录',
    'record-detail': '📝 答题详情',
    stats: '📈 统计分析',
    'admin-records': '👥 试卷分析',
    classes: '🏫 班级管理',
  };
  return map[practiceView.value] || '';
});

// ===== 考试相关方法 =====
const startExam = (examId) => {
  activeExamId.value = examId;
  if (currentUser.value?.role === 'student') {
    currentView.value = 'practice';
  } else {
    practiceView.value = 'practice';
  }
};

const exitExam = () => {
  activeExamId.value = null;
  if (currentUser.value?.role === 'student') {
    currentView.value = 'papers';
  } else {
    practiceView.value = 'exams';
  }
};

const viewRecord = (recordId) => {
  activeRecordId.value = recordId;
  practiceView.value = 'record-detail';
};

// ===== [修改] 单题练习相关方法 =====
const startSinglePractice = (questionId) => {
  singleQuestionId.value = questionId;
  previousView.value = currentView.value; // 保存当前视图
  currentView.value = 'single-practice';
};

const exitSinglePractice = () => {
  singleQuestionId.value = null;
  // 如果有保存的视图则恢复，否则默认回到学情分析
  currentView.value = previousView.value || 'analysis';
  previousView.value = null; // 清空保存
};

// ================================================================
// 注册审核
// ================================================================
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

// ================================================================
// 登录/退出
// ================================================================
const restoreSession = () => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      currentUser.value = user;
      if (user.role === 'student') {
        currentView.value = 'papers';
      } else if (user.role === 'admin') {
        currentView.value = 'practice';
        practiceView.value = 'exams';
      } else {
        currentView.value = 'main';
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
    currentView.value = 'papers';
  } else if (user.role === 'admin') {
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
  currentView.value = 'papers';
  pendingCount.value = 0;
  closeUserMenu();
  closeSidebarUserMenu();
  router.push('/');
};

const handlePwdChanged = () => {
  pwdVisible.value = false;
  showToast('密码修改成功，请重新登录', 'success');
  setTimeout(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser.value = null;
    router.push('/');
  }, 1500);
};

const handleAuthExpired = () => {
  currentUser.value = null;
  currentView.value = 'papers';
  showToast('登录已过期，请重新登录', 'warning');
};

// ================================================================
// Toast
// ================================================================
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

// ================================================================
// 题库管理
// ================================================================
const list = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const loading = ref(false);
const selectedIds = ref([]);
const importVisible = ref(false);
const aiVisible = ref(false);
const imageRecognitionVisible = ref(false);
const stats = ref(null);

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

watch(page, () => {
  selectedIds.value = [];
});

watch(currentView, (val) => {
  if (val === 'main' && currentUser.value?.role === 'student') {
    currentView.value = 'papers';
  }
});

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

// ================================================================
// 生命周期
// ================================================================
onMounted(() => {
  restoreSession();
  if (currentUser.value) {
    loadData();
    loadStats();
    loadPendingCount();
  }
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('auth-expired', handleAuthExpired);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('auth-expired', handleAuthExpired);
});
</script>

<style scoped>
/* ================================================================
   学生端样式
   ================================================================ */
.student-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #F8FAFC;
}

.student-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 60px;
  background: #FFFFFF;
  border-bottom: 1px solid #E2E8F0;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  color: #1E293B;
}
.brand-icon {
  font-size: 24px;
}
.brand-name {
  background: linear-gradient(135deg, #6366F1, #8B5CF6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-nav {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: 1;
  justify-content: center;
  overflow-x: auto;
  padding: 0 8px;
}

.nav-tab {
  padding: 6px 14px;
  border: none;
  background: transparent;
  color: #64748B;
  font-size: 13px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  white-space: nowrap;
}
.nav-tab:hover {
  background: #F1F5F9;
  color: #1E293B;
}
.nav-tab.active {
  background: #EEF2FF;
  color: #4338CA;
}

.header-right {
  position: relative;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.user-menu-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px 6px 6px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  user-select: none;
}

.user-menu-trigger:hover {
  background: #F1F5F9;
}

.user-menu-trigger .user-avatar {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #EEF2FF;
  color: #4338CA;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 600;
}

.user-menu-trigger .user-name {
  font-size: 13px;
  font-weight: 500;
  color: #1E293B;
}

.dropdown-arrow {
  font-size: 10px;
  color: #94A3B8;
  transition: transform 0.2s;
}

.user-menu-trigger.open .dropdown-arrow {
  transform: rotate(180deg);
}

.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 220px;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
  z-index: 200;
  overflow: hidden;
}

.dropdown-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #F8FAFC;
}

.dropdown-avatar {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #EEF2FF;
  color: #4338CA;
  border-radius: 50%;
  font-size: 14px;
  font-weight: 600;
}

.dropdown-user-info {
  display: flex;
  flex-direction: column;
}

.dropdown-username {
  font-size: 14px;
  font-weight: 600;
  color: #1E293B;
}

.dropdown-role {
  font-size: 12px;
  color: #94A3B8;
}

.dropdown-divider {
  height: 1px;
  background: #E2E8F0;
  margin: 0 12px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  font-size: 14px;
  color: #475569;
  cursor: pointer;
  transition: background 0.15s;
}

.dropdown-item:hover {
  background: #F1F5F9;
}

.dropdown-item.logout {
  color: #EF4444;
}

.dropdown-item.logout:hover {
  background: #FEF2F2;
}

.dropdown-item span:first-child {
  width: 20px;
  text-align: center;
}

.dropdown-overlay {
  position: fixed;
  inset: 0;
  z-index: 150;
}

.student-main {
  flex: 1;
  padding: 24px;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .student-header {
    flex-wrap: wrap;
    height: auto;
    padding: 10px 12px;
    gap: 8px;
  }
  .header-nav {
    order: 3;
    flex-basis: 100%;
    justify-content: flex-start;
  }
  .nav-tab {
    padding: 4px 10px;
    font-size: 12px;
  }
  .student-main {
    padding: 16px;
  }
  .user-menu-trigger .user-name {
    display: none;
  }
}

/* ================================================================
   教师/管理员端样式
   ================================================================ */
#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.iq-layout-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 260px;
  height: 100vh;
  background: #FFFFFF;
  border-right: 1px solid #E2E8F0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  transition: transform 0.25s ease;
}

.iq-sidebar-brand {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #E2E8F0;
  gap: 10px;
  flex-wrap: wrap;
}
.iq-sidebar-logo {
  font-size: 28px;
  line-height: 1;
}
.brand-name {
  font-size: 18px;
  font-weight: 700;
  background: linear-gradient(135deg, #6366F1, #8B5CF6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.brand-role {
  font-size: 10px;
  padding: 1px 8px;
  border-radius: 10px;
  background: #EEF2FF;
  color: #4338CA;
  font-weight: 500;
  -webkit-text-fill-color: #4338CA;
  margin-left: auto;
}

.iq-sidebar-nav {
  flex: 1;
  padding: 12px 0 8px;
  overflow-y: auto;
}

.iq-nav-group {
  margin-bottom: 4px;
}
.iq-nav-group-label {
  padding: 8px 20px 4px;
  font-size: 11px;
  font-weight: 600;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.iq-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 16px;
  margin: 1px 12px;
  border-radius: 8px;
  color: #64748B;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  background: transparent;
  font-family: inherit;
  text-align: left;
  width: calc(100% - 24px);
}
.iq-nav-item:hover {
  background: #F1F5F9;
  color: #1E293B;
}
.iq-nav-item.active {
  background: #6366F1;
  color: #FFFFFF;
}
.iq-nav-item .iq-nav-icon {
  font-size: 16px;
  flex-shrink: 0;
  width: 20px;
  text-align: center;
}

.iq-nav-badge {
  display: inline-block;
  min-width: 18px;
  height: 18px;
  line-height: 18px;
  padding: 0 6px;
  background: #EF4444;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  text-align: center;
  border-radius: 9px;
  margin-left: auto;
}

.iq-sidebar-footer {
  border-top: 1px solid #E2E8F0;
  padding: 12px 16px;
  margin-top: auto;
  position: relative;
}

.sidebar-user-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: 4px 0;
  border-radius: 8px;
  transition: background 0.2s;
}

.sidebar-user-trigger:hover {
  background: #F1F5F9;
}

.iq-sidebar-footer .user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.iq-sidebar-footer .user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #EEF2FF;
  color: #4338CA;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}

.iq-sidebar-footer .user-detail {
  flex: 1;
  min-width: 0;
}

.iq-sidebar-footer .user-name {
  font-size: 13px;
  font-weight: 600;
  color: #1E293B;
}

.iq-sidebar-footer .user-role {
  font-size: 11px;
  color: #94A3B8;
}

.sidebar-user-trigger .dropdown-arrow {
  font-size: 10px;
  color: #94A3B8;
  transition: transform 0.2s;
  margin-left: 4px;
}

.sidebar-user-trigger .dropdown-arrow.open {
  transform: rotate(180deg);
}

.sidebar-user-dropdown {
  position: absolute;
  bottom: calc(100% + 4px);
  left: 8px;
  right: 8px;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  z-index: 50;
}

.sidebar-user-dropdown .dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
  transition: background 0.15s;
}

.sidebar-user-dropdown .dropdown-item:hover {
  background: #F1F5F9;
}

.sidebar-user-dropdown .dropdown-item.logout {
  color: #EF4444;
}

.sidebar-user-dropdown .dropdown-item.logout:hover {
  background: #FEF2F2;
}

.sidebar-user-dropdown .dropdown-item span:first-child {
  width: 20px;
  text-align: center;
}

.sidebar-user-dropdown .dropdown-divider {
  height: 1px;
  background: #E2E8F0;
  margin: 4px 12px;
}

.iq-layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 64px;
  background: #FFFFFF;
  border-bottom: 1px solid #E2E8F0;
  position: fixed;
  top: 0;
  right: 0;
  left: 260px;
  z-index: 90;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.iq-sidebar-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  background: #FFFFFF;
  color: #64748B;
  cursor: pointer;
  flex-shrink: 0;
}
.iq-sidebar-toggle:hover {
  background: #F1F5F9;
}

.iq-breadcrumb {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}
.breadcrumb-home {
  color: #94A3B8;
  cursor: pointer;
}
.breadcrumb-home:hover {
  color: #6366F1;
}
.crumb-sep {
  color: #CBD5E1;
}
.breadcrumb-current {
  color: #1E293B;
  font-weight: 500;
}

.iq-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.iq-avatar-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 8px 2px 2px;
  border-radius: 8px;
}
.iq-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #EEF2FF;
  color: #4338CA;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}
.iq-avatar-name {
  font-size: 13px;
  font-weight: 500;
  color: #1E293B;
}
.iq-avatar-role {
  font-size: 11px;
  color: #94A3B8;
}

.role-badge {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}
.role-badge.admin {
  background: #FEF2F2;
  color: #DC2626;
}
.role-badge.teacher {
  background: #DBEAFE;
  color: #1D4ED8;
}
.role-badge.student {
  background: #DCFCE7;
  color: #15803D;
}

.iq-layout-main {
  margin-left: 260px;
  padding: 88px 24px 24px;
  min-height: 100vh;
  background: #F8FAFC;
}

.question-bank-page {
  max-width: 1240px;
  margin: 0 auto;
  display: grid;
  gap: 18px;
}

.iq-stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.iq-stat-card {
  padding: 20px;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.iq-stat-label {
  font-size: 13px;
  color: #94A3B8;
  margin-bottom: 4px;
}

.iq-stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #6366F1;
}

.iq-page-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28px 34px;
  border-radius: 16px;
  color: #fff;
  background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
  box-shadow: 0 8px 30px rgba(99, 102, 241, 0.25);
}

.hero-content .hero-badge {
  font-size: 12px;
  opacity: 0.8;
  letter-spacing: 1px;
  display: block;
  margin-bottom: 4px;
}

.hero-content .hero-title {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.hero-content .hero-desc {
  font-size: 14px;
  opacity: 0.85;
  color: rgba(255, 255, 255, 0.9);
  margin: 4px 0 0;
}

.hero-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.iq-btn-secondary-light {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(4px);
}

.iq-btn-secondary-light:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.3);
}

.iq-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  font-family: inherit;
  transition: all 0.2s;
}

.iq-btn-primary {
  background: #6366F1;
  color: #fff;
  border-color: #6366F1;
}
.iq-btn-primary:hover {
  background: #4F46E5;
  border-color: #4F46E5;
}

.iq-btn-secondary {
  background: #FFFFFF;
  color: #64748B;
  border-color: #E2E8F0;
}
.iq-btn-secondary:hover {
  background: #F1F5F9;
}

.iq-practice-subnav {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  background: #FFFFFF;
  padding: 8px;
  border-radius: 12px;
  border: 1px solid #E2E8F0;
  flex-wrap: wrap;
}
.iq-subnav-btn {
  padding: 6px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  background: transparent;
  color: #64748B;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}
.iq-subnav-btn:hover {
  background: #F1F5F9;
}
.iq-subnav-btn.active {
  background: #6366F1;
  color: #fff;
}

.iq-sidebar-overlay {
  display: none;
}

@media (max-width: 768px) {
  .iq-sidebar-toggle {
    display: inline-flex;
  }
  .iq-layout-sidebar {
    transform: translateX(-100%);
    width: 280px;
  }
  .iq-layout-sidebar.open {
    transform: translateX(0);
  }
  .iq-sidebar-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.4);
    z-index: 99;
  }
  .iq-layout-header {
    left: 0;
    padding: 0 12px;
  }
  .iq-layout-main {
    margin-left: 0;
    padding: 80px 12px 20px;
  }
  .iq-avatar-info {
    display: none;
  }
  .iq-header-right {
    gap: 6px;
  }
  .iq-sidebar-footer .user-detail {
    display: none;
  }
  .brand-role {
    display: none;
  }
}
</style>
