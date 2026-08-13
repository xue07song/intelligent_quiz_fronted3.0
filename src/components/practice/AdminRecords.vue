<template>
  <div class="iq-admin-records">
    <!-- 页面头部 -->
    <div class="iq-page-header">
      <div>
        <h2 class="iq-text-xl iq-font-semibold" style="color: var(--iq-neutral-900); margin: 0;">
          👥 做题管理
        </h2>
        <p class="iq-text-sm iq-text-muted" style="margin: 4px 0 0;">
          <template v-if="role === 'teacher'">查看学生的做题记录与统计分析</template>
          <template v-else>查看所有教师与学生的做题记录与统计（按角色区分）</template>
        </p>
      </div>
    </div>

    <!-- 视图：用户列表 -->
    <template v-if="view === 'users'">
      <div class="iq-card" style="padding: 16px 20px; margin-bottom: 16px;">
        <div class="iq-flex iq-gap-3" style="align-items: center; justify-content: space-between; flex-wrap: wrap;">
          <div v-if="role === 'admin'" class="iq-role-tabs">
            <button
              class="iq-role-tab"
              :class="{ active: roleFilter === '' }"
              @click="switchRoleFilter('')"
            >
              全部 ({{ usersData?.total || 0 }})
            </button>
            <button
              class="iq-role-tab"
              :class="{ active: roleFilter === 'student' }"
              @click="switchRoleFilter('student')"
            >
              🎓 学生 ({{ usersData?.grouped?.student?.length || 0 }})
            </button>
            <button
              class="iq-role-tab"
              :class="{ active: roleFilter === 'teacher' }"
              @click="switchRoleFilter('teacher')"
            >
              👨‍🏫 教师 ({{ usersData?.grouped?.teacher?.length || 0 }})
            </button>
          </div>
          <button class="iq-btn iq-btn-primary" style="margin-left: auto;" @click="openAllStats">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            全局统计总览
          </button>
        </div>
      </div>

      <div v-if="usersLoading" class="iq-table-loading">
        <span class="iq-loading-spinner"></span>
        <span class="iq-text-sm iq-text-muted">加载中...</span>
      </div>

      <div v-else-if="!usersData || usersData.list.length === 0" class="iq-card">
        <div class="iq-empty-row">
          <div class="iq-empty-box">
            <div class="iq-empty-icon">📭</div>
            <div class="iq-empty-text iq-text-base" style="color: var(--iq-neutral-600);">暂无做题记录数据</div>
          </div>
        </div>
      </div>

      <div v-else class="iq-card">
        <div class="iq-table-wrap">
          <table class="iq-table">
            <thead>
              <tr>
                <th>用户ID</th>
                <th>用户名</th>
                <th>昵称</th>
                <th>角色</th>
                <th>练习次数</th>
                <th>平均准确率</th>
                <th>最佳</th>
                <th>最差</th>
                <th>累计答题</th>
                <th>累计正确</th>
                <th>最近练习</th>
                <th style="width: 190px;">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in usersData.list" :key="u.id">
                <td><span class="iq-id-chip">{{ u.id }}</span></td>
                <td>{{ u.username }}</td>
                <td>{{ u.nickname || '-' }}</td>
                <td><span class="iq-tag u-role" :class="u.role">{{ roleMap[u.role] || u.role }}</span></td>
                <td><span class="iq-id-chip">{{ u.attempt_count }}</span></td>
                <td><span class="iq-font-semibold" :class="accuracyTextClass(u.avg_accuracy)">{{ u.avg_accuracy }}%</span></td>
                <td class="bar-good-text iq-font-semibold">{{ u.max_accuracy }}%</td>
                <td class="bar-bad-text iq-font-semibold">{{ u.min_accuracy }}%</td>
                <td>{{ u.total_questions }}</td>
                <td class="bar-good-text iq-font-semibold">{{ u.total_correct }}</td>
                <td class="iq-text-sm iq-text-muted">{{ formatTime(u.last_attempt_at) }}</td>
                <td>
                  <div class="iq-flex iq-gap-2">
                    <button class="iq-btn iq-btn-primary iq-btn-sm" @click="openUserRecords(u)">
                      📋 答题记录
                    </button>
                    <button class="iq-btn iq-btn-success iq-btn-sm" @click="openUserStats(u)">
                      📈 统计
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- 视图：某用户的答题记录列表 -->
    <template v-if="view === 'records'">
      <div class="iq-sub-header">
        <button class="iq-btn iq-btn-ghost iq-btn-sm" @click="backToUsers">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          返回用户列表
        </button>
        <div class="iq-sub-title">
          📋 <strong>{{ selectedUser.nickname || selectedUser.username }}</strong>
          <span class="iq-tag u-role" :class="selectedUser.role" style="margin-left: 6px;">{{ roleMap[selectedUser.role] }}</span>
          <span class="iq-text-sm iq-text-muted" style="margin-left: 10px;">的答题记录</span>
        </div>
      </div>

      <div v-if="recordsLoading" class="iq-table-loading">
        <span class="iq-loading-spinner"></span>
        <span class="iq-text-sm iq-text-muted">加载中...</span>
      </div>

      <div v-else-if="records.length === 0" class="iq-card">
        <div class="iq-empty-row">
          <div class="iq-empty-box">
            <div class="iq-empty-icon">📭</div>
            <div class="iq-empty-text iq-text-base" style="color: var(--iq-neutral-600);">该用户暂无答题记录</div>
          </div>
        </div>
      </div>

      <div v-else class="iq-card">
        <div class="iq-table-wrap">
          <table class="iq-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>提交人</th>
                <th>试卷</th>
                <th>得分</th>
                <th>准确率</th>
                <th>总题数</th>
                <th>正确</th>
                <th>错误</th>
                <th>未答</th>
                <th>用时</th>
                <th>提交时间</th>
                <th style="width: 110px;">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in records" :key="r.id">
                <td><span class="iq-id-chip">{{ r.id }}</span></td>
                <td>
                  <div class="user-cell">
                    <span>{{ r.nickname || r.username || '-' }}</span>
                    <span v-if="r.role" class="iq-tag u-role" :class="r.role">{{ roleMap[r.role] || r.role }}</span>
                  </div>
                </td>
                <td class="iq-font-medium" style="color: var(--iq-neutral-800);">{{ r.exam_title || `试卷#${r.exam_id}` }}</td>
                <td><span class="score-tag" :class="scoreClass(r.score)">{{ r.score }}</span></td>
                <td>{{ r.accuracy }}%</td>
                <td>{{ r.total_count }}</td>
                <td class="bar-good-text iq-font-semibold">{{ r.correct_count }}</td>
                <td class="bar-bad-text iq-font-semibold">{{ r.wrong_count }}</td>
                <td>{{ r.skipped_count }}</td>
                <td>{{ formatDuration(r.duration_seconds) }}</td>
                <td class="iq-text-sm iq-text-muted">{{ formatTime(r.submitted_at) }}</td>
                <td>
                  <button class="iq-btn iq-btn-primary iq-btn-sm" @click="openRecordDetail(r.id)">📋 详情</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <Pagination
          v-model:page="recordsPage"
          v-model:pageSize="recordsPageSize"
          :total="recordsTotal"
          @change="loadUserRecords"
        />
      </div>
    </template>

    <!-- 视图：答题记录详情（复用 RecordDetail，管理端模式） -->
    <template v-if="view === 'detail'">
      <RecordDetail
        :recordId="activeRecordId"
        adminMode
        :reviewable="role==='teacher'"
        @back="backFromDetail"
        @toast="onToast"
      />
    </template>

    <!-- 视图：某用户的统计分析（复用 PracticeStats，传入 userId） -->
    <template v-if="view === 'stats'">
      <div class="iq-sub-header">
        <button class="iq-btn iq-btn-ghost iq-btn-sm" @click="backToUsers">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          返回用户列表
        </button>
        <div class="iq-sub-title">
          📈 <strong>{{ selectedUser.nickname || selectedUser.username }}</strong>
          <span class="iq-tag u-role" :class="selectedUser.role" style="margin-left: 6px;">{{ roleMap[selectedUser.role] }}</span>
          <span class="iq-text-sm iq-text-muted" style="margin-left: 10px;">的统计分析</span>
        </div>
      </div>
      <PracticeStats :userId="selectedUser.id" @toast="onToast" />
    </template>

    <!-- 视图：全局统计总览（以人为界，按人分组展示每人每次明细） -->
    <template v-if="view === 'allStats'">
      <div class="iq-sub-header">
        <button class="iq-btn iq-btn-ghost iq-btn-sm" @click="backToUsers">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          返回用户列表
        </button>
        <div class="iq-sub-title">
          📊 全局统计总览（以人为界，共 <strong class="iq-text-primary">{{ allStats?.total || 0 }}</strong> 人）
        </div>
      </div>

      <div v-if="allStatsLoading" class="iq-table-loading">
        <span class="iq-loading-spinner"></span>
        <span class="iq-text-sm iq-text-muted">加载中...</span>
      </div>

      <div v-else-if="!allStats || allStats.users.length === 0" class="iq-card">
        <div class="iq-empty-row">
          <div class="iq-empty-box">
            <div class="iq-empty-icon">📭</div>
            <div class="iq-empty-text iq-text-base" style="color: var(--iq-neutral-600);">暂无做题数据</div>
          </div>
        </div>
      </div>

      <div v-else class="iq-stats-groups">
        <div v-for="u in allStats.users" :key="u.id" class="iq-card iq-stats-group">
          <div class="iq-group-header">
            <div class="iq-group-user">
              <div class="iq-avatar iq-avatar-sm">{{ (u.nickname || u.username || '?').charAt(0) }}</div>
              <div>
                <div class="iq-font-semibold iq-text-base" style="color: var(--iq-neutral-900);">{{ u.nickname || u.username }}</div>
                <span class="iq-tag u-role" :class="u.role">{{ roleMap[u.role] || u.role }}</span>
              </div>
            </div>
            <div class="iq-group-summary">
              <div class="summary-chip"><span class="chip-label">练习</span><b>{{ u.overview.attempt_count }}</b><span class="chip-unit">次</span></div>
              <div class="summary-chip"><span class="chip-label">平均</span><b class="chip-mid">{{ u.overview.avg_accuracy }}%</b></div>
              <div class="summary-chip"><span class="chip-label">最佳</span><b class="chip-good">{{ u.overview.max_accuracy }}%</b></div>
              <div class="summary-chip"><span class="chip-label">最差</span><b class="chip-bad">{{ u.overview.min_accuracy }}%</b></div>
              <div class="summary-chip"><span class="chip-label">累计答题</span><b>{{ u.overview.total_questions }}</b></div>
              <div class="summary-chip"><span class="chip-label">累计正确</span><b class="chip-good">{{ u.overview.total_correct }}</b></div>
            </div>
          </div>

          <div v-if="u.records.length > 0" class="iq-table-wrap">
            <table class="iq-table">
              <thead>
                <tr>
                  <th>提交时间</th>
                  <th>试卷</th>
                  <th>得分</th>
                  <th>准确率</th>
                  <th>总题</th>
                  <th>正确</th>
                  <th>错误</th>
                  <th>未答</th>
                  <th>用时</th>
                  <th style="width: 110px;">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in u.records" :key="r.id">
                  <td class="iq-text-sm iq-text-muted">{{ formatTime(r.submitted_at) }}</td>
                  <td class="iq-font-medium" style="color: var(--iq-neutral-800);">{{ r.exam_title || `试卷#${r.exam_id}` }}</td>
                  <td><span class="score-tag" :class="scoreClass(r.score)">{{ r.score }}</span></td>
                  <td><span class="iq-font-semibold" :class="accuracyTextClass(r.accuracy)">{{ r.accuracy }}%</span></td>
                  <td>{{ r.total_count }}</td>
                  <td class="bar-good-text iq-font-semibold">{{ r.correct_count }}</td>
                  <td class="bar-bad-text iq-font-semibold">{{ r.wrong_count }}</td>
                  <td>{{ r.skipped_count }}</td>
                  <td>{{ formatDuration(r.duration_seconds) }}</td>
                  <td>
                    <button class="iq-btn iq-btn-primary iq-btn-sm" @click="openRecordDetail(r.id, 'allStats')">📋 详情</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="iq-no-data-inline">该用户暂无答题明细</div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { adminListUsers, adminListUserRecords, adminGetAllStats } from '@/api/practice';
import { formatTime } from '@/utils/format';
import Pagination from '@/components/Pagination.vue';
import RecordDetail from './RecordDetail.vue';
import PracticeStats from './PracticeStats.vue';

const props = defineProps({
  role: { type: String, required: true }, // 'admin' | 'teacher'
});

const emit = defineEmits(['toast']);

const roleMap = { admin: '管理员', teacher: '教师', student: '学生' };

// 视图状态：users | records | detail | stats | allStats
const view = ref('users');

// ===== 用户列表 =====
const usersData = ref(null);
const usersLoading = ref(false);
const roleFilter = ref(''); // '' | 'student' | 'teacher'（仅管理员可用）

const loadUsers = async () => {
  usersLoading.value = true;
  try {
    const params = {};
    if (props.role === 'teacher') {
      // 教师强制只看学生（后端也会强制，这里显式传）
      params.role = 'student';
    } else if (roleFilter.value) {
      params.role = roleFilter.value;
    }
    usersData.value = await adminListUsers(params);
  } catch (err) {
    onToast({ message: err.message || '加载用户列表失败', type: 'error' });
  } finally {
    usersLoading.value = false;
  }
};

const switchRoleFilter = (r) => {
  roleFilter.value = r;
  loadUsers();
};

// ===== 某用户答题记录 =====
const selectedUser = ref({});
const records = ref([]);
const recordsTotal = ref(0);
const recordsPage = ref(1);
const recordsPageSize = ref(20);
const recordsLoading = ref(false);
const activeRecordId = ref(null);
// 详情返回目标视图（从 allStats 进入详情后返回 allStats，否则返回 records）
const detailBackTarget = ref('records');

const openUserRecords = (user) => {
  selectedUser.value = user;
  recordsPage.value = 1;
  view.value = 'records';
  loadUserRecords();
};

const loadUserRecords = async () => {
  recordsLoading.value = true;
  try {
    const data = await adminListUserRecords(selectedUser.value.id, {
      page: recordsPage.value,
      pageSize: recordsPageSize.value,
    });
    records.value = data.list;
    recordsTotal.value = data.total;
  } catch (err) {
    onToast({ message: err.message || '加载答题记录失败', type: 'error' });
  } finally {
    recordsLoading.value = false;
  }
};

const openRecordDetail = (recordId, from = 'records') => {
  activeRecordId.value = recordId;
  detailBackTarget.value = from;
  view.value = 'detail';
};

const backFromDetail = () => {
  view.value = detailBackTarget.value;
};

// ===== 某用户统计 =====
const openUserStats = (user) => {
  selectedUser.value = user;
  view.value = 'stats';
};

// ===== 全局统计总览（以人为界，按人分组）=====
const allStats = ref(null);
const allStatsLoading = ref(false);

const openAllStats = () => {
  view.value = 'allStats';
  loadAllStats();
};

const loadAllStats = async () => {
  allStatsLoading.value = true;
  try {
    const params = {};
    if (props.role === 'teacher') {
      params.role = 'student';
    } else if (roleFilter.value) {
      params.role = roleFilter.value;
    }
    allStats.value = await adminGetAllStats(params);
  } catch (err) {
    onToast({ message: err.message || '加载全局统计失败', type: 'error' });
  } finally {
    allStatsLoading.value = false;
  }
};

// ===== 导航 =====
const backToUsers = () => {
  view.value = 'users';
};

// ===== 工具函数 =====
const onToast = ({ message, type }) => {
  emit('toast', { message, type });
};

const formatDuration = (sec) => {
  if (!sec && sec !== 0) return '-';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}分${s}秒`;
};

const scoreClass = (score) => {
  if (score >= 80) return 'score-excellent';
  if (score >= 60) return 'score-pass';
  return 'score-fail';
};

const accuracyTextClass = (acc) => {
  if (acc >= 80) return 'bar-good-text';
  if (acc >= 60) return 'bar-mid-text';
  return 'bar-bad-text';
};

onMounted(() => {
  loadUsers();
});

defineExpose({ loadUsers });
</script>

<style scoped>
.iq-admin-records {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.iq-page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
.iq-table-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 80px 0;
  background: var(--iq-card);
  border-radius: var(--iq-radius-card);
}
.iq-loading-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--iq-neutral-200);
  border-top-color: var(--iq-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.iq-empty-row { padding: 0 !important; }
.iq-empty-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 60px 0;
}
.iq-empty-icon { font-size: 48px; opacity: 0.5; }

.iq-flex { display: flex; }
.iq-gap-2 { gap: 8px; }
.iq-gap-3 { gap: 12px; }

.iq-role-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.iq-role-tab {
  padding: 6px 16px;
  background: var(--iq-neutral-0);
  border: 1px solid var(--iq-neutral-200);
  border-radius: var(--iq-radius-full);
  cursor: pointer;
  font-size: 13px;
  color: var(--iq-neutral-600);
  transition: all 0.2s;
  font-weight: 500;
}
.iq-role-tab:hover {
  border-color: var(--iq-primary-400);
  color: var(--iq-primary-600);
}
.iq-role-tab.active {
  background: var(--iq-primary-500);
  border-color: var(--iq-primary-500);
  color: #fff;
  box-shadow: 0 2px 8px -2px rgba(99, 102, 241, 0.4);
}

.iq-id-chip {
  display: inline-block;
  padding: 2px 10px;
  background: var(--iq-neutral-100);
  color: var(--iq-neutral-700);
  border-radius: var(--iq-radius-full);
  font-size: 12px;
  font-weight: 600;
  font-family: var(--iq-font-mono);
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}
.u-role.iq-tag.admin { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }
.u-role.iq-tag.teacher { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
.u-role.iq-tag.student { background: #ecfdf5; color: #047857; border-color: #a7f3d0; }

.score-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: var(--iq-radius-full);
  font-weight: 700;
  font-size: 12px;
  min-width: 40px;
  text-align: center;
}
.score-excellent { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
.score-pass { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
.score-fail { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }

.bar-good-text { color: #059669; }
.bar-mid-text { color: #d97706; }
.bar-bad-text { color: #dc2626; }

.iq-sub-header {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding-bottom: 4px;
}
.iq-sub-title {
  font-size: 15px;
  color: var(--iq-neutral-800);
}

.iq-stats-groups {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.iq-stats-group { padding: 18px 20px; }
.iq-group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--iq-neutral-100);
}
.iq-group-user {
  display: flex;
  align-items: center;
  gap: 10px;
}
.iq-avatar.iq-avatar-sm {
  width: 36px;
  height: 36px;
  font-size: 14px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--iq-primary-500), #8b5cf6);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
}
.iq-group-summary {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.summary-chip {
  display: inline-flex;
  align-items: baseline;
  gap: 3px;
  padding: 5px 12px;
  background: var(--iq-neutral-50);
  border: 1px solid var(--iq-neutral-100);
  border-radius: var(--iq-radius-medium);
  font-size: 12px;
  color: var(--iq-neutral-600);
}
.summary-chip b {
  color: var(--iq-neutral-900);
  font-size: 14px;
  font-weight: 700;
}
.chip-label, .chip-unit {
  font-size: 11px;
  color: var(--iq-neutral-400);
  font-weight: 500;
}
.chip-good { color: #059669 !important; }
.chip-mid { color: #d97706 !important; }
.chip-bad { color: #dc2626 !important; }

.iq-no-data-inline {
  text-align: center;
  color: var(--iq-neutral-400);
  padding: 20px 0;
  font-size: 13px;
}
</style>
