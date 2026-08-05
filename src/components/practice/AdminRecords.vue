<template>
  <div class="admin-records">
    <!-- 顶部标题 + 面包屑 -->
    <div class="page-header">
      <h2>👥 做题管理</h2>
      <p class="page-desc">
        <template v-if="role === 'teacher'">查看学生的做题记录与统计</template>
        <template v-else>查看所有教师与学生的做题记录与统计（按角色区分）</template>
      </p>
    </div>

    <!-- 视图：用户列表 -->
    <template v-if="view === 'users'">
      <!-- 角色筛选（仅管理员可见：区分教师/学生） -->
      <div v-if="role === 'admin'" class="role-tabs">
        <button
          class="role-tab"
          :class="{ active: roleFilter === '' }"
          @click="switchRoleFilter('')"
        >全部 ({{ usersData?.total || 0 }})</button>
        <button
          class="role-tab"
          :class="{ active: roleFilter === 'student' }"
          @click="switchRoleFilter('student')"
        >🎓 学生 ({{ usersData?.grouped?.student?.length || 0 }})</button>
        <button
          class="role-tab"
          :class="{ active: roleFilter === 'teacher' }"
          @click="switchRoleFilter('teacher')"
        >👨‍🏫 教师 ({{ usersData?.grouped?.teacher?.length || 0 }})</button>
      </div>

      <div v-if="usersLoading" class="loading">加载中...</div>

      <div v-else-if="!usersData || usersData.list.length === 0" class="empty">
        <p>📭 暂无做题记录数据</p>
      </div>

      <div v-else class="table-wrapper">
        <table class="data-table">
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
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in usersData.list" :key="u.id">
              <td>{{ u.id }}</td>
              <td>{{ u.username }}</td>
              <td>{{ u.nickname || '-' }}</td>
              <td><span class="role-badge" :class="u.role">{{ roleMap[u.role] || u.role }}</span></td>
              <td>{{ u.attempt_count }}</td>
              <td>{{ u.avg_accuracy }}%</td>
              <td class="correct">{{ u.max_accuracy }}%</td>
              <td class="wrong">{{ u.min_accuracy }}%</td>
              <td>{{ u.total_questions }}</td>
              <td class="correct">{{ u.total_correct }}</td>
              <td>{{ formatTime(u.last_attempt_at) }}</td>
              <td class="actions">
                <button class="btn-op btn-records" @click="openUserRecords(u)">📋 答题记录</button>
                <button class="btn-op btn-stats" @click="openUserStats(u)">📈 统计</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- 视图：某用户的答题记录列表 -->
    <template v-if="view === 'records'">
      <div class="sub-header">
        <button class="btn-back" @click="backToUsers">← 返回用户列表</button>
        <div class="sub-title">
          📋 <strong>{{ selectedUser.nickname || selectedUser.username }}</strong>
          <span class="role-badge" :class="selectedUser.role">{{ roleMap[selectedUser.role] }}</span>
          的答题记录
        </div>
      </div>

      <div v-if="recordsLoading" class="loading">加载中...</div>

      <div v-else-if="records.length === 0" class="empty">
        <p>📭 该用户暂无答题记录</p>
      </div>

      <div v-else class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>试卷</th>
              <th>得分</th>
              <th>准确率</th>
              <th>总题数</th>
              <th>正确</th>
              <th>错误</th>
              <th>未答</th>
              <th>用时</th>
              <th>提交时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in records" :key="r.id">
              <td>{{ r.id }}</td>
              <td class="col-title">{{ r.exam_title || `试卷#${r.exam_id}` }}</td>
              <td><span class="score-tag" :class="scoreClass(r.score)">{{ r.score }}</span></td>
              <td>{{ r.accuracy }}%</td>
              <td>{{ r.total_count }}</td>
              <td class="correct">{{ r.correct_count }}</td>
              <td class="wrong">{{ r.wrong_count }}</td>
              <td>{{ r.skipped_count }}</td>
              <td>{{ formatDuration(r.duration_seconds) }}</td>
              <td>{{ formatTime(r.submitted_at) }}</td>
              <td>
                <button class="btn-op btn-records" @click="openRecordDetail(r.id)">查看详情</button>
              </td>
            </tr>
          </tbody>
        </table>

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
        @back="view = 'records'"
        @toast="onToast"
      />
    </template>

    <!-- 视图：某用户的统计分析（复用 PracticeStats，传入 userId） -->
    <template v-if="view === 'stats'">
      <div class="sub-header">
        <button class="btn-back" @click="backToUsers">← 返回用户列表</button>
        <div class="sub-title">
          📈 <strong>{{ selectedUser.nickname || selectedUser.username }}</strong>
          <span class="role-badge" :class="selectedUser.role">{{ roleMap[selectedUser.role] }}</span>
          的统计分析
        </div>
      </div>
      <PracticeStats :userId="selectedUser.id" @toast="onToast" />
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { adminListUsers, adminListUserRecords } from '@/api/practice';
import Pagination from '@/components/Pagination.vue';
import RecordDetail from './RecordDetail.vue';
import PracticeStats from './PracticeStats.vue';

const props = defineProps({
  role: { type: String, required: true }, // 'admin' | 'teacher'
});

const emit = defineEmits(['toast']);

const roleMap = { admin: '管理员', teacher: '教师', student: '学生' };

// 视图状态：users | records | detail | stats
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

const openRecordDetail = (recordId) => {
  activeRecordId.value = recordId;
  view.value = 'detail';
};

// ===== 某用户统计 =====
const openUserStats = (user) => {
  selectedUser.value = user;
  view.value = 'stats';
};

// ===== 导航 =====
const backToUsers = () => {
  view.value = 'users';
};

// ===== 工具函数 =====
const onToast = ({ message, type }) => {
  emit('toast', { message, type });
};

const formatTime = (t) => {
  if (!t) return '-';
  return String(t).replace('T', ' ').substring(0, 16);
};

const formatDuration = (sec) => {
  if (!sec && sec !== 0) return '-';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}分${s}秒`;
};

const scoreClass = (score) => {
  if (score >= 90) return 'excellent';
  if (score >= 60) return 'pass';
  return 'fail';
};

onMounted(() => {
  loadUsers();
});

defineExpose({ loadUsers });
</script>

<style scoped>
.admin-records {
  max-width: 1200px;
  margin: 0 auto;
}
.page-header {
  margin-bottom: 20px;
}
.page-header h2 {
  margin: 0 0 4px;
  font-size: 20px;
  color: #303133;
}
.page-desc {
  margin: 0;
  font-size: 13px;
  color: #909399;
}
.role-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.role-tab {
  padding: 6px 16px;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 16px;
  cursor: pointer;
  font-size: 13px;
  color: #606266;
  transition: all 0.2s;
}
.role-tab:hover {
  border-color: #1890ff;
  color: #1890ff;
}
.role-tab.active {
  background: #1890ff;
  border-color: #1890ff;
  color: #fff;
}
.loading, .empty {
  text-align: center;
  padding: 60px 0;
  color: #909399;
  font-size: 15px;
}
.table-wrapper {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  padding: 10px;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.data-table th {
  padding: 12px 8px;
  text-align: left;
  background: #f5f7fa;
  border-bottom: 2px solid #e4e7ed;
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
}
.data-table td {
  padding: 10px 8px;
  border-bottom: 1px solid #ebeef5;
  color: #606266;
}
.col-title {
  max-width: 200px;
  word-break: break-word;
}
.correct { color: #52c41a; }
.wrong { color: #ff4d4f; }
.role-badge {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  background: #f0f2f5;
  color: #606266;
}
.role-badge.admin { background: #fff7e6; color: #fa8c16; }
.role-badge.teacher { background: #e6f7ff; color: #1890ff; }
.role-badge.student { background: #f0f9eb; color: #52c41a; }
.score-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 14px;
}
.score-tag.excellent { background: #f0f9eb; color: #52c41a; }
.score-tag.pass { background: #e6f7ff; color: #1890ff; }
.score-tag.fail { background: #fef0f0; color: #ff4d4f; }
.actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.btn-op {
  background: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
}
.btn-op:hover { background: #bae7ff; }
.btn-op.btn-stats {
  background: #f0f9eb;
  color: #52c41a;
  border-color: #b7eb8f;
}
.btn-op.btn-stats:hover { background: #d9f7be; }
.sub-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.btn-back {
  padding: 6px 14px;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
}
.btn-back:hover { border-color: #1890ff; color: #1890ff; }
.sub-title {
  font-size: 15px;
  color: #303133;
}
.sub-title .role-badge { margin-left: 4px; }
</style>
