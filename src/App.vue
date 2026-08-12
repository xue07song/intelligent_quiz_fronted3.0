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
          v-if="currentUser.role === 'student'"
          class="iq-nav-item"
          :class="{ active: currentView === 'student-bank' }"
          @click="currentView = 'student-bank'; loadStudentData()"
        >
          <svg class="iq-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
          </svg>
          我的题库
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
          class="iq-nav-item"
          :class="{ active: currentView === 'profile' }"
          @click="currentView = 'profile'; loadProfileData()"
        >
          <svg class="iq-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          个人中心
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
        <button
          v-if="currentUser.role === 'admin' || currentUser.role === 'teacher'"
          class="iq-nav-item"
          :class="{ active: currentView === 'audit' }"
          @click="currentView = 'audit'"
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
          @click="currentView = 'feedback'"
        >
          <svg class="iq-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          用户反馈
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

        <!-- 学生：批量加入我的题库 -->
        <div v-if="currentUser.role === 'student' && selectedIds.length > 0" class="iq-batch-add-bar">
          <span>已选中 {{ selectedIds.length }} 道题目</span>
          <button class="iq-btn iq-btn-primary iq-btn-sm" @click="batchAddToMyBank">📥 批量加入我的题库</button>
        </div>

        <div style="margin-top: 16px;"></div>
        <QuestionTable
          :list="list"
          :loading="loading"
          :role="currentUser.role"
          v-model="selectedIds"
          @view="openViewDialog"
          @edit="openEditDialog"
          @delete="handleDelete"
          @add-to-my-bank="addToMyBank"
        />

        <Pagination
          v-model:page="page"
          v-model:pageSize="pageSize"
          :total="total"
          @change="handlePageChange"
        />
      </template>

      <!-- 学生题库视图 -->
      <template v-if="currentView === 'student-bank'">
        <div class="iq-page-titlebar">
          <h1>我的题库</h1>
          <div class="iq-page-actions">
            <button class="iq-btn iq-btn-secondary" @click="studentImportVisible = true">📥 导入题目</button>
            <button class="iq-btn iq-btn-primary" @click="openStudentAddDialog">+ 新增题目</button>
          </div>
        </div>

        <div v-if="studentStats" class="iq-stat-grid">
          <div class="iq-card iq-stat-card">
            <div class="iq-stat-label">题目总数</div>
            <div class="iq-stat-value">{{ studentStats.total }}</div>
          </div>
          <div class="iq-card iq-stat-card">
            <div class="iq-stat-label">章节数</div>
            <div class="iq-stat-value">{{ studentStats.byChapter?.length || 0 }}</div>
          </div>
          <div class="iq-card iq-stat-card">
            <div class="iq-stat-label">题型数</div>
            <div class="iq-stat-value">{{ studentStats.byType?.length || 0 }}</div>
          </div>
        </div>

        <div class="iq-card" style="margin-top: 16px; padding: 16px 20px;">
          <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-bottom: 16px;">
            <input
              v-model="studentFilters.关键词"
              type="text"
              placeholder="🔍 搜索题目内容/选项/知识点"
              style="flex: 1; min-width: 200px; padding: 8px 12px; border: 1px solid var(--iq-border); border-radius: var(--iq-radius-medium); font-size: 14px;"
              @keyup.enter="handleStudentSearch"
            />
            <select
              v-model="studentFilters.题型"
              style="padding: 8px 12px; border: 1px solid var(--iq-border); border-radius: var(--iq-radius-medium); font-size: 14px;"
            >
              <option value="">全部题型</option>
              <option value="1">判断题</option>
              <option value="2">单选题</option>
              <option value="3">多选题</option>
              <option value="4">填空题</option>
              <option value="5">简答题</option>
              <option value="6">程序论述题</option>
            </select>
            <select
              v-model="studentFilters.难度"
              style="padding: 8px 12px; border: 1px solid var(--iq-border); border-radius: var(--iq-radius-medium); font-size: 14px;"
            >
              <option value="">全部难度</option>
              <option value="1">1星（简单）</option>
              <option value="2">2星</option>
              <option value="3">3星（中等）</option>
              <option value="4">4星</option>
              <option value="5">5星（困难）</option>
            </select>
            <button class="iq-btn iq-btn-secondary" @click="handleStudentSearch">搜索</button>
            <button class="iq-btn iq-btn-secondary" @click="handleStudentReset">重置</button>
          </div>

          <div v-if="studentLoading" style="text-align: center; padding: 40px; color: var(--iq-muted-foreground);">加载中...</div>
          <div v-else-if="studentList.length === 0" style="text-align: center; padding: 40px; color: var(--iq-muted-foreground);">
            <div style="font-size: 48px; margin-bottom: 12px;">📚</div>
            <div>暂无题目，点击上方"导入题目"或"新增题目"开始创建你的题库</div>
          </div>
          <table v-else style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background: var(--iq-neutral-50); border-bottom: 2px solid var(--iq-border);">
                <th style="padding: 10px 12px; text-align: left; font-weight: 600;">编号</th>
                <th style="padding: 10px 12px; text-align: left; font-weight: 600;">题目</th>
                <th style="padding: 10px 12px; text-align: center; font-weight: 600; width: 80px;">题型</th>
                <th style="padding: 10px 12px; text-align: center; font-weight: 600; width: 60px;">难度</th>
                <th style="padding: 10px 12px; text-align: center; font-weight: 600; width: 60px;">章节</th>
                <th style="padding: 10px 12px; text-align: center; font-weight: 600; width: 180px;">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in studentList" :key="item.id" style="border-bottom: 1px solid var(--iq-border);">
                <td style="padding: 10px 12px; color: var(--iq-primary-600); font-family: var(--iq-font-mono); font-size: 12px;">{{ item.question_id }}</td>
                <td style="padding: 10px 12px; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" :title="item.题目">{{ item.题目 }}</td>
                <td style="padding: 10px 12px; text-align: center;">{{ typeMap[item.题型] || '未知' }}</td>
                <td style="padding: 10px 12px; text-align: center;">{{ item.难度 }}</td>
                <td style="padding: 10px 12px; text-align: center;">{{ item.章节 }}</td>
                <td style="padding: 10px 12px; text-align: center;">
                  <button class="iq-action-btn" @click="openStudentViewDialog(item)">查看</button>
                  <button class="iq-action-btn" @click="openStudentEditDialog(item)">编辑</button>
                  <button class="iq-action-btn iq-action-danger" @click="handleStudentDelete(item)">删除</button>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-if="studentList.length > 0" style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px;">
            <div style="font-size: 13px; color: var(--iq-muted-foreground);">共 {{ studentTotal }} 条</div>
            <Pagination
              v-model:page="studentPage"
              v-model:pageSize="studentPageSize"
              :total="studentTotal"
              @change="handleStudentPageChange"
            />
          </div>
        </div>
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
      <template v-if="currentView === 'profile'">
        <div class="iq-page-titlebar">
          <h1>个人中心</h1>
        </div>

        <!-- 三个 Tab -->
        <div class="iq-profile-tabs">
          <button
            class="iq-tab-btn"
            :class="{ active: profileTab === 'info' }"
            @click="profileTab = 'info'"
          >👤 个人信息</button>
          <button
            class="iq-tab-btn"
            :class="{ active: profileTab === 'history' }"
            @click="profileTab = 'history'; loadHistoryQuestions()"
          >📝 历史刷题</button>
          <button
            class="iq-tab-btn"
            :class="{ active: profileTab === 'bookmarks' }"
            @click="profileTab = 'bookmarks'; loadBookmarks()"
          >⭐ 标记收藏</button>
        </div>

        <!-- Tab 1: 个人信息 -->
        <div v-if="profileTab === 'info'" class="iq-profile-info">
          <div class="iq-profile-hero">
            <div class="iq-avatar-big">{{ avatarChar }}</div>
            <div class="iq-profile-hero-info">
              <div class="iq-profile-hero-name">{{ profileData.user?.nickname || profileData.user?.username }}</div>
              <div class="iq-profile-hero-meta">
                <span class="iq-role-tag" :class="currentUser.role">{{ roleLabel }}</span>
                <span class="iq-meta-item">账号：{{ profileData.user?.username }}</span>
                <span class="iq-meta-item" v-if="profileData.user?.created_at">注册：{{ formatDate(profileData.user.created_at) }}</span>
              </div>
            </div>
          </div>

          <div class="iq-profile-stats">
            <div class="iq-stat-card">
              <div class="iq-stat-num">{{ profileData.practice?.total_attempts || 0 }}</div>
              <div class="iq-stat-label">考试次数</div>
            </div>
            <div class="iq-stat-card">
              <div class="iq-stat-num">{{ profileData.practice?.avg_accuracy || 0 }}%</div>
              <div class="iq-stat-label">平均正确率</div>
            </div>
            <div class="iq-stat-card">
              <div class="iq-stat-num">{{ profileData.history?.practiced_total || 0 }}</div>
              <div class="iq-stat-label">刷过题目</div>
            </div>
            <div class="iq-stat-card">
              <div class="iq-stat-num">{{ profileData.bookmarks || 0 }}</div>
              <div class="iq-stat-label">收藏题目</div>
            </div>
          </div>

          <div class="iq-card">
            <div class="iq-card-title">📋 基本资料 <span v-if="infoEditing" class="iq-edit-hint">（编辑中）</span></div>
            <div v-if="!infoEditing" class="iq-info-display">
              <div class="iq-info-row"><span class="iq-info-label">昵称</span><span class="iq-info-value">{{ profileData.user?.nickname || '—' }}</span></div>
              <div class="iq-info-row"><span class="iq-info-label">手机号</span><span class="iq-info-value">{{ profileData.user?.phone || '—' }}</span></div>
              <div class="iq-info-row"><span class="iq-info-label">邮箱</span><span class="iq-info-value">{{ profileData.user?.email || '—' }}</span></div>
              <div class="iq-info-row"><span class="iq-info-label">学校/班级</span><span class="iq-info-value">{{ profileData.user?.school || '—' }}</span></div>
              <div class="iq-info-row"><span class="iq-info-label">个人简介</span><span class="iq-info-value iq-multiline">{{ profileData.user?.bio || '—' }}</span></div>
              <div class="iq-info-row iq-info-actions">
                <button class="iq-btn iq-btn-primary" @click="infoEditing = true; syncEditData()">✏️ 编辑资料</button>
              </div>
            </div>
            <div v-else class="iq-info-form">
              <div class="iq-form-row">
                <label class="iq-form-label">昵称</label>
                <input class="iq-input" v-model="infoForm.nickname" placeholder="请输入昵称" maxlength="50" />
              </div>
              <div class="iq-form-row">
                <label class="iq-form-label">手机号</label>
                <input class="iq-input" v-model="infoForm.phone" placeholder="请输入手机号" maxlength="20" />
              </div>
              <div class="iq-form-row">
                <label class="iq-form-label">邮箱</label>
                <input class="iq-input" v-model="infoForm.email" placeholder="请输入邮箱" maxlength="100" />
              </div>
              <div class="iq-form-row">
                <label class="iq-form-label">学校/班级</label>
                <input class="iq-input" v-model="infoForm.school" placeholder="请输入学校或班级" maxlength="100" />
              </div>
              <div class="iq-form-row">
                <label class="iq-form-label">个人简介</label>
                <textarea class="iq-textarea" v-model="infoForm.bio" placeholder="介绍一下自己..." rows="3" maxlength="500"></textarea>
              </div>
              <div class="iq-form-row iq-info-actions">
                <button class="iq-btn iq-btn-primary" @click="saveProfileInfo" :disabled="infoSaving">
                  {{ infoSaving ? '保存中...' : '💾 保存' }}
                </button>
                <button class="iq-btn iq-btn-ghost" @click="infoEditing = false">取消</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 2: 历史刷题 -->
        <div v-if="profileTab === 'history'" class="iq-profile-history">
          <div class="iq-card">
            <div class="iq-card-title">📝 刷题汇总</div>
            <div class="iq-profile-stats iq-inline-stats">
              <div class="iq-stat-mini">
                <div class="iq-stat-mini-num" style="color:var(--iq-primary)">
                  {{ historySummary.overview?.practiced_total || 0 }}
                </div>
                <div class="iq-stat-mini-label">总做题</div>
              </div>
              <div class="iq-stat-mini">
                <div class="iq-stat-mini-num" style="color:var(--iq-success)">
                  {{ historySummary.overview?.practiced_correct || 0 }}
                </div>
                <div class="iq-stat-mini-label">答对</div>
              </div>
              <div class="iq-stat-mini">
                <div class="iq-stat-mini-num" style="color:var(--iq-danger)">
                  {{ historySummary.overview?.practiced_wrong || 0 }}
                </div>
                <div class="iq-stat-mini-label">答错</div>
              </div>
              <div class="iq-stat-mini">
                <div class="iq-stat-mini-num" style="color:var(--iq-warn)">
                  {{ ratePercent(historySummary.overview?.practiced_correct, historySummary.overview?.practiced_total) }}%
                </div>
                <div class="iq-stat-mini-label">正确率</div>
              </div>
            </div>
          </div>

          <div class="iq-card">
            <div class="iq-filter-bar">
              <div class="iq-filter-group">
                <label>答题情况：</label>
                <select class="iq-select" v-model="historyFilter.isCorrect" @change="loadHistoryQuestions(1)">
                  <option value="">全部</option>
                  <option value="1">答对</option>
                  <option value="0">答错</option>
                </select>
              </div>
              <div class="iq-filter-group">
                <label>题型：</label>
                <select class="iq-select" v-model="historyFilter.question_type" @change="loadHistoryQuestions(1)">
                  <option value="">全部</option>
                  <option :value="1">判断</option>
                  <option :value="2">单选</option>
                  <option :value="3">多选</option>
                  <option :value="4">填空</option>
                  <option :value="5">简答</option>
                  <option :value="6">程序</option>
                </select>
              </div>
              <div class="iq-filter-right">
                <span style="color:var(--iq-neutral-500)">共 {{ historyPagination.total }} 道题</span>
              </div>
            </div>

            <div v-if="historyLoading" class="iq-list-loading">加载中...</div>
            <div v-else-if="historyList.length === 0" class="iq-empty">暂无历史刷题记录，去答几道题吧！</div>
            <div v-else class="iq-question-list">
              <div
                v-for="(q, idx) in historyList"
                :key="q.question_id + '_' + idx"
                class="iq-question-item"
              >
                <div class="iq-question-head">
                  <span class="iq-q-index">#{{ idx + 1 + (historyPagination.page - 1) * historyPagination.pageSize }}</span>
                  <span
                    class="iq-q-tag"
                    :class="{ correct: q.is_correct === 1, wrong: q.is_correct === 0 }"
                  >{{ q.is_correct === 1 ? '✅ 答对' : q.is_correct === 0 ? '❌ 答错' : '💡 主观题' }}</span>
                  <span class="iq-q-type">{{ typeLabel(q.题型) }}</span>
                  <span class="iq-q-time">最后作答：{{ formatDate(q.last_submit_at) }}</span>
                </div>
                <div class="iq-question-body">
                  <div class="iq-q-title">{{ idx + 1 + (historyPagination.page - 1) * historyPagination.pageSize }}. {{ q.题目 }}</div>
                  <div v-if="q.选项" class="iq-q-options">
                    <div
                      v-for="(opt, k) in parseOptions(q.选项)"
                      :key="k"
                      class="iq-option"
                    >
                      <span class="iq-option-label">{{ opt.label }}.</span>
                      <span>{{ opt.text }}</span>
                    </div>
                  </div>
                  <div class="iq-q-answer-compare">
                    <div class="iq-answer-block">
                      <span class="iq-answer-label">你的答案：</span>
                      <span class="iq-answer-value user">{{ q.user_answer || '(未作答)' }}</span>
                    </div>
                    <div class="iq-answer-block">
                      <span class="iq-answer-label">正确答案：</span>
                      <span class="iq-answer-value correct">{{ q.correct_answer || '—' }}</span>
                    </div>
                  </div>
                  <div v-if="q.解析" class="iq-q-analysis">
                    <div class="iq-analysis-label">解析：</div>
                    <div class="iq-analysis-text">{{ q.解析 }}</div>
                  </div>
                </div>
                <div class="iq-question-actions">
                  <button class="iq-btn iq-btn-sm" @click="toggleHistoryBookmark(q)">
                    {{ historyBookmarked.has(String(q.question_id)) ? '⭐ 已收藏' : '☆ 标记收藏' }}
                  </button>
                  <button class="iq-btn iq-btn-sm act-add" @click="addToMyBankFromHistory(q)">📥 加入我的题库</button>
                </div>
              </div>
            </div>

            <div v-if="historyPagination.total > 0" class="iq-pagination">
              <button
                class="iq-page-btn"
                :disabled="historyPagination.page <= 1"
                @click="loadHistoryQuestions(historyPagination.page - 1)"
              >上一页</button>
              <span class="iq-page-info">
                第 {{ historyPagination.page }} / {{ Math.ceil(historyPagination.total / historyPagination.pageSize) || 1 }} 页
              </span>
              <button
                class="iq-page-btn"
                :disabled="historyPagination.page * historyPagination.pageSize >= historyPagination.total"
                @click="loadHistoryQuestions(historyPagination.page + 1)"
              >下一页</button>
            </div>
          </div>
        </div>

        <!-- Tab 3: 标记收藏 -->
        <div v-if="profileTab === 'bookmarks'" class="iq-profile-bookmarks">
          <div class="iq-card">
            <div class="iq-filter-bar">
              <div class="iq-filter-group">
                <label>题目来源：</label>
                <select class="iq-select" v-model="bookmarkFilter.source_type" @change="loadBookmarks(1)">
                  <option value="">全部</option>
                  <option value="public">公共题库</option>
                  <option value="student">我的题库</option>
                </select>
              </div>
              <div class="iq-filter-right">
                <span style="color:var(--iq-neutral-500)">共 {{ bookmarkPagination.total }} 道收藏</span>
              </div>
            </div>

            <div v-if="bookmarkLoading" class="iq-list-loading">加载中...</div>
            <div v-else-if="bookmarkList.length === 0" class="iq-empty">暂无收藏题目，做题或刷题时可「标记收藏」哦！</div>
            <div v-else class="iq-question-list">
              <div
                v-for="(b, idx) in bookmarkList"
                :key="b.id"
                class="iq-question-item"
              >
                <div class="iq-question-head">
                  <span class="iq-q-index">#{{ idx + 1 + (bookmarkPagination.page - 1) * bookmarkPagination.pageSize }}</span>
                  <span class="iq-q-type">{{ typeLabel(b.题型) }}</span>
                  <span class="iq-q-source">{{ b.source_type === 'public' ? '公共题库' : '我的题库' }}</span>
                  <span class="iq-q-time">收藏于：{{ formatDate(b.created_at) }}</span>
                </div>
                <div class="iq-question-body">
                  <div class="iq-q-title">{{ idx + 1 + (bookmarkPagination.page - 1) * bookmarkPagination.pageSize }}. {{ b.题目 }}</div>
                  <div v-if="b.选项" class="iq-q-options">
                    <div
                      v-for="(opt, k) in parseOptions(b.选项)"
                      :key="k"
                      class="iq-option"
                    >
                      <span class="iq-option-label">{{ opt.label }}.</span>
                      <span>{{ opt.text }}</span>
                    </div>
                  </div>
                  <div class="iq-q-answer-compare">
                    <div class="iq-answer-block">
                      <span class="iq-answer-label">正确答案：</span>
                      <span class="iq-answer-value correct">{{ b.答案 || '—' }}</span>
                    </div>
                  </div>
                  <div v-if="b.解析" class="iq-q-analysis">
                    <div class="iq-analysis-label">解析：</div>
                    <div class="iq-analysis-text">{{ b.解析 }}</div>
                  </div>
                  <div class="iq-bookmark-note">
                    <label class="iq-note-label">📌 收藏备注：</label>
                    <input
                      v-if="editingNoteId === b.id"
                      class="iq-input iq-note-input"
                      v-model="editingNoteText"
                      @keyup.enter="saveNote(b)"
                      @blur="saveNote(b)"
                      maxlength="500"
                    />
                    <span v-else class="iq-note-text" @click="startEditNote(b)">
                      {{ b.note || '(点击添加备注，例如：错题、重点、经典题型)' }}
                    </span>
                  </div>
                </div>
                <div class="iq-question-actions">
                  <button class="iq-btn iq-btn-sm act-add" @click="addToMyBankFromBookmark(b)" v-if="b.source_type === 'public'">📥 加入我的题库</button>
                  <button class="iq-btn iq-btn-sm" @click="removeBookmark(b)">🗑️ 取消收藏</button>
                </div>
              </div>
            </div>

            <div v-if="bookmarkPagination.total > 0" class="iq-pagination">
              <button
                class="iq-page-btn"
                :disabled="bookmarkPagination.page <= 1"
                @click="loadBookmarks(bookmarkPagination.page - 1)"
              >上一页</button>
              <span class="iq-page-info">
                第 {{ bookmarkPagination.page }} / {{ Math.ceil(bookmarkPagination.total / bookmarkPagination.pageSize) || 1 }} 页
              </span>
              <button
                class="iq-page-btn"
                :disabled="bookmarkPagination.page * bookmarkPagination.pageSize >= bookmarkPagination.total"
                @click="loadBookmarks(bookmarkPagination.page + 1)"
              >下一页</button>
            </div>
          </div>
        </div>
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

    <ImportQuestions
      :visible="studentImportVisible"
      :isStudentBank="true"
      @close="studentImportVisible = false"
      @success="handleStudentImportSuccess"
    />

    <QuestionForm
      :visible="studentDialogVisible"
      :data="studentFormData"
      :isEdit="studentIsEdit"
      :isStudentBank="true"
      @close="studentDialogVisible = false"
      @submit="handleStudentSubmit"
    />

    <QuestionDetail
      :visible="studentViewVisible"
      :data="studentViewData"
      @close="studentViewVisible = false"
    />

    <AiGenerate
      :visible="aiVisible"
      @close="aiVisible = false"
      @success="handleAiSuccess"
    />

    <Toast :message="toastMessage" :type="toastType" />

    <!-- AI 小助手浮动窗口 -->
    <AiAssistant v-if="currentUser" />
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
import { getRegistrations } from '@/api/auth';
import {
  getStudentQuestions,
  addStudentQuestion,
  updateStudentQuestion,
  deleteStudentQuestion,
  getStudentQuestionStatistics,
  batchDeleteStudentQuestions,
  batchImportStudentQuestions,
  importFromPublic,
  batchImportFromPublic,
} from '@/api/studentQuestion';
import {
  getProfile,
  updateProfile,
  getHistorySummary,
  getHistoryQuestions,
  getBookmarks,
  toggleBookmark,
  removeBookmark as apiRemoveBookmark,
  updateBookmarkNote,
  checkBookmarks,
} from '@/api/profile';
import SearchBar from '@/components/SearchBar.vue';
import QuestionTable from '@/components/QuestionTable.vue';
import QuestionForm from '@/components/QuestionForm.vue';
import QuestionDetail from '@/components/QuestionDetail.vue';
import Pagination from '@/components/Pagination.vue';
import Toast from '@/components/Toast.vue';
import Login from '@/components/Login.vue';
import RegistrationDialog from '@/components/RegistrationDialog.vue';
import RegistrationAudit from '@/components/RegistrationAudit.vue';
import UserManagement from '@/components/UserManagement.vue';
import ChangePassword from '@/components/ChangePassword.vue';
import ImportQuestions from '@/components/ImportQuestions.vue';
import AiAssistant from '@/components/AiAssistant.vue';
import AiGenerate from '@/components/AiGenerate.vue';
import Feedback from '@/components/Feedback.vue';
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
  if (currentView.value === 'student-bank') return '我的题库';
  if (currentView.value === 'users') return '用户管理';
  if (currentView.value === 'audit') return '注册审核';
  if (currentView.value === 'feedback') return '用户反馈';
  if (currentView.value === 'profile') {
    const tabMap = { info: '个人信息', history: '历史刷题', bookmarks: '标记收藏' };
    return '个人中心 / ' + (tabMap[profileTab.value] || '');
  }
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

const roleLabel = computed(() => {
  const map = { admin: '管理员', teacher: '教师', student: '学生' };
  return map[currentUser.value?.role] || '未知角色';
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

// ===== 学生题库 =====
const typeMap = { 1: '判断', 2: '单选', 3: '多选', 4: '填空', 5: '简答', 6: '程序论述' };

const studentList = ref([]);
const studentTotal = ref(0);
const studentPage = ref(1);
const studentPageSize = ref(20);
const studentLoading = ref(false);
const studentStats = ref(null);

const studentFilters = reactive({
  关键词: '',
  题型: '',
  难度: '',
});

const studentImportVisible = ref(false);
const studentDialogVisible = ref(false);
const studentIsEdit = ref(false);
const studentFormData = ref({});
const studentEditDbId = ref(null);
const studentViewVisible = ref(false);
const studentViewData = ref({});

const loadStudentData = async () => {
  studentLoading.value = true;
  try {
    const params = {
      page: studentPage.value,
      pageSize: studentPageSize.value,
    };
    if (studentFilters.关键词) params.关键词 = studentFilters.关键词;
    if (studentFilters.题型) params.题型 = studentFilters.题型;
    if (studentFilters.难度) params.难度 = studentFilters.难度;

    const data = await getStudentQuestions(params);
    studentList.value = data.list;
    studentTotal.value = data.total;
  } catch (error) {
    showToast(error.message || '加载题库失败', 'error');
  } finally {
    studentLoading.value = false;
  }
};

const loadStudentStats = async () => {
  try {
    studentStats.value = await getStudentQuestionStatistics();
  } catch (e) {
    console.warn('学生题库统计加载失败:', e);
  }
};

const handleStudentSearch = () => {
  studentPage.value = 1;
  loadStudentData();
};

const handleStudentReset = () => {
  studentFilters.关键词 = '';
  studentFilters.题型 = '';
  studentFilters.难度 = '';
  studentPage.value = 1;
  loadStudentData();
};

const handleStudentPageChange = ({ page, pageSize }) => {
  studentPage.value = page;
  studentPageSize.value = pageSize;
  loadStudentData();
};

const generateStudentId = () => {
  const maxId = studentList.value.reduce((max, item) => {
    const num = parseInt((item.question_id || 'SQ0').replace(/\D/g, ''), 10);
    return num > max ? num : max;
  }, 0);
  return `SQ${String(maxId + 1).padStart(3, '0')}`;
};

const openStudentAddDialog = () => {
  studentIsEdit.value = false;
  studentFormData.value = {
    id: generateStudentId(),
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
    出题人: currentUser.value?.nickname || currentUser.value?.username || '',
  };
  studentDialogVisible.value = true;
};

const openStudentEditDialog = (item) => {
  studentIsEdit.value = true;
  studentEditDbId.value = item.id;
  studentFormData.value = { ...item, id: item.question_id };
  studentDialogVisible.value = true;
};

const openStudentViewDialog = (item) => {
  studentViewData.value = { ...item };
  studentViewVisible.value = true;
};

const handleStudentSubmit = async (payload) => {
  try {
    if (studentIsEdit.value) {
      const { id: _, ...updateData } = payload;
      await updateStudentQuestion(studentEditDbId.value, updateData);
      showToast('✅ 修改成功', 'success');
    } else {
      await addStudentQuestion(payload);
      showToast('✅ 新增成功', 'success');
    }
    studentDialogVisible.value = false;
    loadStudentData();
    loadStudentStats();
  } catch (error) {
    showToast(error.message || '操作失败', 'error');
  }
};

const handleStudentDelete = async (item) => {
  if (!window.confirm(`确定要删除题目「${item.题目?.substring(0, 20)}${item.题目?.length > 20 ? '...' : ''}」吗？`)) {
    return;
  }
  try {
    await deleteStudentQuestion(item.id);
    showToast('✅ 删除成功', 'success');
    if (studentList.value.length === 1 && studentPage.value > 1) {
      studentPage.value--;
    }
    loadStudentData();
    loadStudentStats();
  } catch (error) {
    showToast(error.message || '删除失败', 'error');
  }
};

const handleStudentImportSuccess = (result) => {
  const { inserted = 0, skipped = 0, invalid = 0 } = result || {};
  const msg = `导入完成：成功 ${inserted} 条，跳过 ${skipped} 条，无效 ${invalid} 条`;
  if (inserted > 0) {
    loadStudentData();
    loadStudentStats();
  }
  if (invalid > 0 || skipped > 0) {
    showToast(msg, 'warning');
  } else {
    showToast(msg, 'success');
  }
};

// 从公共题库加入我的题库（单道）
const addToMyBank = async (item) => {
  if (!window.confirm(`确定将题目「${String(item.题目 || '').slice(0, 30)}...」加入我的题库吗？`)) return;
  try {
    await importFromPublic(item.id);
    showToast('✅ 已加入我的题库', 'success');
  } catch (e) {
    if (e.errorCode === 40901 || (e.message || '').includes('已存在')) {
      showToast('该题目已在你的题库中', 'warning');
    } else {
      showToast(e.message || '加入题库失败', 'error');
    }
  }
};

// 批量加入我的题库
const batchAddToMyBank = async () => {
  if (!selectedIds.value || selectedIds.value.length === 0) {
    showToast('请先选择要加入的题目', 'warning');
    return;
  }
  if (!window.confirm(`确定将选中的 ${selectedIds.value.length} 道题目加入我的题库吗？`)) return;
  try {
    const result = await batchImportFromPublic(selectedIds.value);
    const msg = `导入完成：成功 ${result.inserted} 条，跳过 ${result.skipped} 条，未找到 ${result.notFound} 条`;
    showToast(msg, result.inserted > 0 ? 'success' : 'warning');
    selectedIds.value = [];
  } catch (e) {
    showToast(e.message || '批量加入失败', 'error');
  }
};

// ===== 工具函数 =====
const formatDate = (v) => {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const typeLabel = (t) => {
  const m = { 1: '判断', 2: '单选', 3: '多选', 4: '填空', 5: '简答', 6: '程序' };
  return m[Number(t)] || `类型${t}`;
};
const parseOptions = (raw) => {
  if (!raw) return [];
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map((o, i) => ({ label: String.fromCharCode(65 + i), text: o }));
      if (typeof parsed === 'object') return Object.keys(parsed).map((k) => ({ label: k, text: parsed[k] }));
    } catch {
      const lines = raw.split(/\n/).map((s) => s.trim()).filter(Boolean);
      return lines.map((l, i) => {
        const m = l.match(/^([A-Z])[.、:：]?\s*(.+)$/);
        return m ? { label: m[1], text: m[2] } : { label: String.fromCharCode(65 + i), text: l };
      });
    }
  }
  if (Array.isArray(raw)) return raw.map((o, i) => ({ label: String.fromCharCode(65 + i), text: typeof o === 'string' ? o : o.text }));
  if (typeof raw === 'object') return Object.keys(raw).map((k) => ({ label: k, text: raw[k] }));
  return [];
};
const ratePercent = (correct, total) => {
  if (!total) return 0;
  return Math.round((Number(correct) / Number(total)) * 10000) / 100;
};

// ===== 个人中心：状态 =====
const profileTab = ref('info');
const profileData = reactive({
  user: null,
  practice: {},
  bookmarks: 0,
  history: {},
  historyByType: [],
});

// 个人信息编辑
const infoEditing = ref(false);
const infoSaving = ref(false);
const infoForm = reactive({
  nickname: '', phone: '', email: '', school: '', bio: '',
});

// 历史刷题
const historyList = ref([]);
const historyLoading = ref(false);
const historySummary = reactive({ overview: {}, byType: [] });
const historyPagination = reactive({ page: 1, pageSize: 10, total: 0 });
const historyFilter = reactive({ isCorrect: '', question_type: '' });
const historyBookmarked = reactive(new Set());

// 收藏
const bookmarkList = ref([]);
const bookmarkLoading = ref(false);
const bookmarkPagination = reactive({ page: 1, pageSize: 10, total: 0 });
const bookmarkFilter = reactive({ source_type: '' });
const editingNoteId = ref(null);
const editingNoteText = ref('');

// ===== 个人中心：方法 =====
const loadProfileData = async () => {
  try {
    const res = await getProfile();
    profileData.user = res.user;
    profileData.practice = res.practice || {};
    profileData.bookmarks = res.bookmarks || 0;
    profileData.history = res.history || {};
    profileData.historyByType = res.historyByType || [];
  } catch (e) {
    showToast(e.message || '加载个人信息失败', 'error');
  }
};

const syncEditData = () => {
  const u = profileData.user || {};
  infoForm.nickname = u.nickname || '';
  infoForm.phone = u.phone || '';
  infoForm.email = u.email || '';
  infoForm.school = u.school || '';
  infoForm.bio = u.bio || '';
};

const saveProfileInfo = async () => {
  infoSaving.value = true;
  try {
    const updated = await updateProfile({ ...infoForm });
    profileData.user = updated;
    // 同步更新 localStorage 里的用户信息（昵称）
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const u = JSON.parse(stored);
        if (updated.nickname !== undefined) u.nickname = updated.nickname;
        localStorage.setItem('user', JSON.stringify(u));
        if (currentUser.value) currentUser.value.nickname = updated.nickname;
      } catch {}
    }
    infoEditing.value = false;
    showToast('✅ 个人信息更新成功', 'success');
  } catch (e) {
    showToast(e.message || '保存失败', 'error');
  } finally {
    infoSaving.value = false;
  }
};

const loadHistoryQuestions = async (page = historyPagination.page) => {
  historyPagination.page = page;
  historyLoading.value = true;
  try {
    const params = {
      page,
      pageSize: historyPagination.pageSize,
    };
    if (historyFilter.isCorrect !== '') params.isCorrect = historyFilter.isCorrect;
    if (historyFilter.question_type !== '') params.question_type = historyFilter.question_type;

    // 汇总 + 列表
    const [summary, listData] = await Promise.all([
      getHistorySummary().catch(() => ({ overview: {}, byType: [] })),
      getHistoryQuestions(params),
    ]);
    historySummary.overview = summary.overview || {};
    historySummary.byType = summary.byType || [];
    historyList.value = listData.list || [];
    historyPagination.total = listData.total || 0;

    // 批量检查收藏状态
    if (historyList.value.length > 0) {
      const ids = historyList.value.map((q) => String(q.question_id));
      try {
        const res = await checkBookmarks(ids, 'public');
        historyBookmarked.clear();
        (res.marked_ids || []).forEach((id) => historyBookmarked.add(String(id)));
      } catch {}
    }
  } catch (e) {
    showToast(e.message || '加载历史刷题失败', 'error');
  } finally {
    historyLoading.value = false;
  }
};

const toggleHistoryBookmark = async (q) => {
  try {
    const res = await toggleBookmark({ question_id: String(q.question_id), source_type: 'public' });
    if (res.bookmarked) {
      historyBookmarked.add(String(q.question_id));
      showToast('⭐ 已收藏', 'success');
    } else {
      historyBookmarked.delete(String(q.question_id));
      showToast('已取消收藏', 'info');
    }
    loadProfileData();
  } catch (e) {
    showToast(e.message || '操作失败', 'error');
  }
};

// 从历史刷题加入我的题库
const addToMyBankFromHistory = async (q) => {
  try {
    await importFromPublic(String(q.question_id));
    showToast('✅ 已加入我的题库', 'success');
  } catch (e) {
    if ((e.message || '').includes('已存在') || (e.message || '').includes('已在')) {
      showToast('该题目已在你的题库中', 'warning');
    } else {
      showToast(e.message || '加入题库失败', 'error');
    }
  }
};

// 从收藏列表加入我的题库
const addToMyBankFromBookmark = async (b) => {
  try {
    await importFromPublic(String(b.question_id));
    showToast('✅ 已加入我的题库', 'success');
  } catch (e) {
    if ((e.message || '').includes('已存在') || (e.message || '').includes('已在')) {
      showToast('该题目已在你的题库中', 'warning');
    } else {
      showToast(e.message || '加入题库失败', 'error');
    }
  }
};

const loadBookmarks = async (page = bookmarkPagination.page) => {
  bookmarkPagination.page = page;
  bookmarkLoading.value = true;
  try {
    const params = { page, pageSize: bookmarkPagination.pageSize };
    if (bookmarkFilter.source_type !== '') params.source_type = bookmarkFilter.source_type;
    const data = await getBookmarks(params);
    bookmarkList.value = data.list || [];
    bookmarkPagination.total = data.total || 0;
  } catch (e) {
    showToast(e.message || '加载收藏失败', 'error');
  } finally {
    bookmarkLoading.value = false;
  }
};

const startEditNote = (b) => {
  editingNoteId.value = b.id;
  editingNoteText.value = b.note || '';
};
const saveNote = async (b) => {
  const id = editingNoteId.value;
  if (!id) return;
  const text = editingNoteText.value;
  editingNoteId.value = null;
  editingNoteText.value = '';
  if (text === (b.note || '')) return;
  try {
    await updateBookmarkNote(id, text);
    b.note = text;
    showToast('✅ 备注已更新', 'success');
  } catch (e) {
    showToast(e.message || '备注保存失败', 'error');
  }
};
const removeBookmark = async (b) => {
  if (!window.confirm('确定取消收藏该题目吗？')) return;
  try {
    await apiRemoveBookmark(b.id);
    showToast('✅ 已取消收藏', 'success');
    if (bookmarkList.value.length === 1 && bookmarkPagination.page > 1) {
      bookmarkPagination.page--;
    }
    loadBookmarks();
    loadProfileData();
  } catch (e) {
    showToast(e.message || '操作失败', 'error');
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
.iq-action-btn {
  background: transparent;
  border: none;
  color: var(--iq-primary-600);
  cursor: pointer;
  font-size: 13px;
  padding: 2px 6px;
  border-radius: 4px;
  transition: all 0.15s;
}
.iq-action-btn:hover {
  background: var(--iq-primary-50);
}
.iq-action-btn.iq-action-danger {
  color: var(--iq-state-error);
}
.iq-action-btn.iq-action-danger:hover {
  background: var(--iq-state-error-bg);
}

/* ===== 个人中心 Tabs ===== */
.iq-profile-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  background: #fff;
  padding: 8px;
  border-radius: 10px;
  border: 1px solid var(--iq-neutral-200);
}
.iq-tab-btn {
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--iq-neutral-600);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.iq-tab-btn:hover {
  background: var(--iq-neutral-100);
}
.iq-tab-btn.active {
  background: var(--iq-primary-50);
  color: var(--iq-primary-700);
  font-weight: 600;
  box-shadow: inset 0 -2px 0 var(--iq-primary-500);
}

/* ===== 个人信息 ===== */
.iq-profile-hero {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 28px 32px;
  background: linear-gradient(135deg, var(--iq-primary-50), var(--iq-info-50));
  border-radius: 14px;
  border: 1px solid var(--iq-primary-100);
  margin-bottom: 20px;
}
.iq-avatar-big {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--iq-primary-500), var(--iq-primary-700));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 700;
  box-shadow: 0 6px 14px rgba(59, 130, 246, 0.25);
  flex-shrink: 0;
}
.iq-profile-hero-info { flex: 1; }
.iq-profile-hero-name {
  font-size: 22px;
  font-weight: 700;
  color: var(--iq-neutral-900);
  margin-bottom: 10px;
}
.iq-profile-hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
  align-items: center;
}
.iq-role-tag {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}
.iq-role-tag.admin { background: var(--iq-state-error-bg); color: var(--iq-state-error); }
.iq-role-tag.teacher { background: var(--iq-state-info-bg); color: var(--iq-state-info); }
.iq-role-tag.student { background: var(--iq-state-success-bg); color: var(--iq-state-success); }
.iq-meta-item {
  color: var(--iq-neutral-600);
  font-size: 13px;
}

.iq-profile-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}
.iq-profile-stats.iq-inline-stats {
  grid-template-columns: repeat(4, 1fr);
  margin-bottom: 0;
}
.iq-stat-card {
  background: #fff;
  border: 1px solid var(--iq-neutral-200);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  transition: all 0.2s;
}
.iq-stat-card:hover {
  border-color: var(--iq-primary-300);
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.08);
}
.iq-stat-num {
  font-size: 28px;
  font-weight: 700;
  color: var(--iq-primary-600);
  line-height: 1.2;
  margin-bottom: 6px;
}
.iq-stat-label {
  font-size: 13px;
  color: var(--iq-neutral-500);
}

.iq-card {
  background: #fff;
  border: 1px solid var(--iq-neutral-200);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
}
.iq-card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--iq-neutral-900);
  margin-bottom: 18px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--iq-neutral-100);
}
.iq-edit-hint {
  color: var(--iq-primary-600);
  font-weight: 500;
  font-size: 13px;
}

/* info display & form */
.iq-info-display, .iq-info-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.iq-info-row, .iq-form-row {
  display: grid;
  grid-template-columns: 120px 1fr;
  align-items: start;
  gap: 16px;
}
.iq-info-label, .iq-form-label {
  color: var(--iq-neutral-500);
  font-size: 14px;
  font-weight: 500;
  padding-top: 8px;
}
.iq-info-value {
  color: var(--iq-neutral-800);
  font-size: 14px;
  padding: 8px 0;
  line-height: 1.6;
}
.iq-info-value.iq-multiline {
  white-space: pre-wrap;
  word-break: break-word;
}
.iq-input, .iq-select, .iq-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--iq-neutral-300);
  border-radius: 8px;
  font-size: 14px;
  color: var(--iq-neutral-800);
  background: #fff;
  transition: all 0.15s;
  outline: none;
  font-family: inherit;
}
.iq-input:focus, .iq-select:focus, .iq-textarea:focus {
  border-color: var(--iq-primary-500);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}
.iq-textarea {
  resize: vertical;
  min-height: 72px;
}
.iq-info-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding-top: 6px;
}
.iq-btn {
  padding: 8px 18px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.15s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.iq-btn-primary {
  background: var(--iq-primary-600);
  color: #fff;
}
.iq-btn-primary:hover { background: var(--iq-primary-700); }
.iq-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.iq-btn-ghost {
  background: transparent;
  color: var(--iq-neutral-600);
  border: 1px solid var(--iq-neutral-300);
}
.iq-btn-ghost:hover {
  background: var(--iq-neutral-50);
  color: var(--iq-neutral-800);
}
.iq-btn-sm {
  padding: 5px 12px;
  font-size: 12px;
  border-radius: 6px;
  background: var(--iq-neutral-100);
  color: var(--iq-neutral-700);
}
.iq-btn-sm:hover {
  background: var(--iq-primary-50);
  color: var(--iq-primary-700);
}

/* filter bar */
.iq-filter-bar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px dashed var(--iq-neutral-200);
}
.iq-filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--iq-neutral-600);
}
.iq-filter-group .iq-select {
  width: 140px;
  padding: 6px 10px;
}
.iq-filter-right { font-size: 13px; }

/* loading & empty */
.iq-list-loading {
  padding: 40px 0;
  text-align: center;
  color: var(--iq-neutral-400);
}
.iq-empty {
  padding: 60px 20px;
  text-align: center;
  color: var(--iq-neutral-400);
  font-size: 14px;
}

/* question list */
.iq-question-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.iq-question-item {
  border: 1px solid var(--iq-neutral-200);
  border-radius: 10px;
  padding: 16px 20px;
  background: #fff;
  transition: all 0.15s;
}
.iq-question-item:hover {
  border-color: var(--iq-primary-300);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.iq-question-head {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
  font-size: 12px;
}
.iq-q-index {
  color: var(--iq-neutral-400);
  font-weight: 600;
}
.iq-q-tag {
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 600;
}
.iq-q-tag.correct { background: var(--iq-state-success-bg); color: var(--iq-state-success); }
.iq-q-tag.wrong { background: var(--iq-state-error-bg); color: var(--iq-state-error); }
.iq-q-type, .iq-q-source {
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--iq-neutral-100);
  color: var(--iq-neutral-600);
}
.iq-q-source { background: var(--iq-info-50); color: var(--iq-info-700); }
.iq-q-time {
  color: var(--iq-neutral-400);
  margin-left: auto;
}

.iq-question-body { margin-bottom: 10px; }
.iq-q-title {
  font-size: 14px;
  color: var(--iq-neutral-800);
  line-height: 1.6;
  font-weight: 500;
  margin-bottom: 10px;
}
.iq-q-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 12px;
  background: var(--iq-neutral-50);
  border-radius: 8px;
  margin-bottom: 10px;
}
.iq-option {
  font-size: 13px;
  color: var(--iq-neutral-700);
  line-height: 1.5;
}
.iq-option-label {
  color: var(--iq-primary-600);
  font-weight: 600;
  margin-right: 4px;
}

.iq-q-answer-compare {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 10px;
}
.iq-answer-block {
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--iq-neutral-50);
  font-size: 13px;
}
.iq-answer-label {
  color: var(--iq-neutral-500);
  margin-right: 6px;
  font-size: 12px;
}
.iq-answer-value.user { color: var(--iq-neutral-800); font-weight: 500; }
.iq-answer-value.correct { color: var(--iq-state-success); font-weight: 600; }

.iq-q-analysis {
  padding: 10px 12px;
  background: var(--iq-warn-50);
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.6;
  margin-bottom: 8px;
}
.iq-analysis-label {
  color: var(--iq-warn-700);
  font-weight: 600;
  font-size: 12px;
  margin-bottom: 4px;
}
.iq-analysis-text { color: var(--iq-neutral-700); }

.iq-bookmark-note {
  margin-top: 10px;
  padding: 8px 12px;
  background: var(--iq-primary-50);
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.iq-note-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--iq-primary-700);
  flex-shrink: 0;
}
.iq-note-text {
  font-size: 13px;
  color: var(--iq-neutral-700);
  cursor: text;
  flex: 1;
  padding: 2px 0;
}
.iq-note-text:empty::before {
  content: '(点击添加备注)';
  color: var(--iq-neutral-400);
}
.iq-note-input {
  flex: 1;
  padding: 4px 8px;
  font-size: 13px;
}

.iq-question-actions {
  padding-top: 10px;
  border-top: 1px dashed var(--iq-neutral-100);
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.iq-batch-add-bar {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 12px;
  padding: 10px 16px;
  background: var(--iq-state-success-bg);
  border: 1px solid var(--iq-state-success);
  border-radius: 8px;
  font-size: 14px;
  color: var(--iq-state-success);
  font-weight: 500;
}
.iq-btn-sm.act-add {
  color: var(--iq-state-success);
  background: var(--iq-state-success-bg);
}
.iq-btn-sm.act-add:hover {
  background: var(--iq-state-success);
  color: #fff;
}

/* pagination */
.iq-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 14px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--iq-neutral-100);
}
.iq-page-btn {
  padding: 6px 14px;
  border: 1px solid var(--iq-neutral-300);
  border-radius: 6px;
  background: #fff;
  color: var(--iq-neutral-700);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.15s;
}
.iq-page-btn:hover:not(:disabled) {
  border-color: var(--iq-primary-500);
  color: var(--iq-primary-700);
}
.iq-page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.iq-page-info {
  font-size: 13px;
  color: var(--iq-neutral-500);
}

/* stat mini (for history summary inline) */
.iq-stat-mini {
  padding: 14px;
  border-radius: 10px;
  background: var(--iq-neutral-50);
  text-align: center;
  border: 1px solid var(--iq-neutral-100);
}
.iq-stat-mini-num {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
  line-height: 1.2;
}
.iq-stat-mini-label {
  font-size: 12px;
  color: var(--iq-neutral-500);
}

@media (max-width: 900px) {
  .iq-profile-stats { grid-template-columns: repeat(2, 1fr); }
  .iq-profile-stats.iq-inline-stats { grid-template-columns: repeat(2, 1fr); }
  .iq-q-answer-compare { grid-template-columns: 1fr; }
  .iq-info-row, .iq-form-row { grid-template-columns: 1fr; gap: 4px; }
  .iq-profile-hero { flex-direction: column; text-align: center; }
}
</style>
