<template>
  <div class="student-admin">
    <div class="admin-head">
      <div>
        <h1>学生题库管理</h1>
        <p>查看、审核和删除学生共享题目，并管理各学院的学生版主</p>
      </div>
    </div>

    <div class="admin-tabs">
      <button :class="{ active: activeTab === 'questions' }" @click="activeTab = 'questions'">题目管理</button>
      <button :class="{ active: activeTab === 'moderators' }" @click="activeTab = 'moderators'">版主管理</button>
    </div>

    <template v-if="activeTab === 'questions'">
      <div class="iq-card admin-filters">
        <select v-model="filters.status" class="iq-select" @change="page = 1; loadQuestions()">
          <option value="">全部状态</option>
          <option value="private">私密</option>
          <option value="pending">待审核</option>
          <option value="approved">已公开</option>
          <option value="rejected">未通过</option>
        </select>
        <input v-model="filters.college" class="iq-input" placeholder="学院" @keyup.enter="page = 1; loadQuestions()" />
        <input v-model="filters.keyword" class="iq-input" placeholder="搜索题干 / 知识点" @keyup.enter="page = 1; loadQuestions()" />
        <button class="iq-btn iq-btn-secondary iq-btn-sm" @click="resetFilters">重置</button>
      </div>

      <div class="iq-card">
        <div v-if="loading" class="admin-loading">加载中...</div>
        <div v-else-if="!list.length" class="admin-empty">暂无学生题目</div>
        <div v-else class="admin-table-wrap">
          <table class="iq-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>发布者</th>
                <th>学院</th>
                <th>题型</th>
                <th>题目</th>
                <th>状态</th>
                <th style="width: 190px;">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in list" :key="item.id">
                <td><span class="iq-id-chip">{{ item.id }}</span></td>
                <td>{{ item.owner_nickname || item.owner_username || item.owner_id }}</td>
                <td>{{ item.college || '-' }}</td>
                <td>{{ getTypeName(item.题型) }}</td>
                <td class="q-cell">{{ item.题目 }}</td>
                <td><span class="status-tag" :class="`status-${item.review_status}`">{{ statusText(item.review_status) }}</span></td>
                <td>
                  <button v-if="item.review_status === 'pending'" class="iq-btn iq-btn-primary iq-btn-sm" @click="handleReview(item, 'approve')">通过</button>
                  <button v-if="item.review_status === 'pending'" class="iq-btn iq-btn-secondary iq-btn-sm" @click="handleReview(item, 'reject')">拒绝</button>
                  <button class="iq-btn iq-btn-ghost iq-btn-sm danger" @click="handleDelete(item)">删除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <Pagination v-model:page="page" v-model:pageSize="pageSize" :total="total" @change="loadQuestions" />
      </div>
    </template>

    <template v-else>
      <div class="iq-card admin-filters">
        <input v-model="moderatorKeyword" class="iq-input" placeholder="搜索用户名 / 昵称 / 学院" @keyup.enter="page = 1; loadModerators()" />
        <button class="iq-btn iq-btn-secondary iq-btn-sm" @click="moderatorKeyword = ''; page = 1; loadModerators()">重置</button>
      </div>

      <div class="iq-card">
        <div class="moderator-add">
          <div class="moderator-add-title"><b>添加学生版主</b><span>先搜索学生，再指定负责审核的学院</span></div>
          <input v-model="studentKeyword" class="iq-input" placeholder="输入学生用户名 / 昵称搜索" @keyup.enter="searchStudents" />
          <button class="iq-btn iq-btn-secondary iq-btn-sm" :disabled="searching" @click="searchStudents">{{ searching ? '搜索中...' : '搜索' }}</button>
          <select v-if="studentOptions.length" v-model="selectedStudentId" class="iq-select">
            <option :value="null" disabled>请选择学生</option>
            <option v-for="s in studentOptions" :key="s.id" :value="s.id">{{ s.nickname || s.username }}（{{ s.username }}）</option>
          </select>
          <input v-model="moderatorCollege" class="iq-input" placeholder="负责审核的学院，如 计算机学院" />
          <button class="iq-btn iq-btn-primary iq-btn-sm" :disabled="addingModerator" @click="handleAddModerator">
            {{ addingModerator ? '添加中...' : '添加版主' }}
          </button>
        </div>
      </div>

      <div class="iq-card">
        <div v-if="moderatorLoading" class="admin-loading">加载中...</div>
        <div v-else-if="!moderators.length" class="admin-empty">暂无学生版主</div>
        <div v-else class="admin-table-wrap">
          <table class="iq-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>学生</th>
                <th>负责学院</th>
                <th>创建时间</th>
                <th style="width: 90px;">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in moderators" :key="m.id">
                <td><span class="iq-id-chip">{{ m.id }}</span></td>
                <td>{{ m.nickname || m.username || m.user_id }}</td>
                <td>{{ m.college }}</td>
                <td>{{ formatTime(m.created_at) }}</td>
                <td><button class="iq-btn iq-btn-ghost iq-btn-sm danger" @click="handleRemoveModerator(m)">移除</button></td>
              </tr>
            </tbody>
          </table>
        </div>
        <Pagination v-model:page="moderatorPage" v-model:pageSize="moderatorPageSize" :total="moderatorTotal" @change="loadModerators" />
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { getTypeName } from '@/utils/constants';
import { getUsers } from '@/api/user';
import { formatTime } from '@/utils/format';
import {
  adminListStudentQuestions,
  adminDeleteStudentQuestion,
  reviewStudentQuestion,
  adminListModerators,
  adminCreateModerator,
  adminRemoveModerator,
} from '@/api/studentQuestion';
import Pagination from '@/components/Pagination.vue';

const emit = defineEmits(['toast']);

const activeTab = ref('questions');
const list = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const loading = ref(false);
const filters = reactive({ status: '', college: '', keyword: '' });

const moderators = ref([]);
const moderatorTotal = ref(0);
const moderatorPage = ref(1);
const moderatorPageSize = ref(20);
const moderatorLoading = ref(false);
const moderatorKeyword = ref('');
const studentKeyword = ref('');
const studentOptions = ref([]);
const selectedStudentId = ref(null);
const moderatorCollege = ref('');
const searching = ref(false);
const addingModerator = ref(false);

const statusText = (status) => ({
  private: '私密',
  pending: '待审核',
  approved: '已公开',
  rejected: '未通过',
}[status] || status);

const loadQuestions = async () => {
  loading.value = true;
  try {
    const params = { page: page.value, pageSize: pageSize.value };
    if (filters.status) params.status = filters.status;
    if (filters.college) params.college = filters.college;
    if (filters.keyword) params.keyword = filters.keyword;
    const data = await adminListStudentQuestions(params);
    list.value = data.list;
    total.value = data.total;
  } catch (err) {
    emit('toast', { message: err.message || '加载失败', type: 'error' });
  } finally {
    loading.value = false;
  }
};

const resetFilters = () => {
  filters.status = '';
  filters.college = '';
  filters.keyword = '';
  page.value = 1;
  loadQuestions();
};

const handleReview = async (item, action) => {
  let reason = '';
  if (action === 'reject') {
    reason = window.prompt('请输入拒绝原因：', '');
    if (reason === null) return;
    if (!reason.trim()) {
      emit('toast', { message: '拒绝时必须填写原因', type: 'warning' });
      return;
    }
  }
  try {
    await reviewStudentQuestion(item.id, { action, reason: reason.trim() });
    emit('toast', { message: action === 'approve' ? '已通过并公开到社区' : '已拒绝该共享题目', type: 'success' });
    loadQuestions();
  } catch (err) {
    emit('toast', { message: err.message || '审核失败', type: 'error' });
  }
};

const handleDelete = async (item) => {
  if (!window.confirm(`确定删除学生题目「${item.题目?.slice(0, 20)}」吗？`)) return;
  try {
    await adminDeleteStudentQuestion(item.id);
    emit('toast', { message: '学生题目已删除', type: 'success' });
    loadQuestions();
  } catch (err) {
    emit('toast', { message: err.message || '删除失败', type: 'error' });
  }
};

const loadModerators = async () => {
  moderatorLoading.value = true;
  try {
    const data = await adminListModerators({
      page: moderatorPage.value,
      pageSize: moderatorPageSize.value,
      keyword: moderatorKeyword.value || undefined,
    });
    moderators.value = data.list;
    moderatorTotal.value = data.total;
  } catch (err) {
    emit('toast', { message: err.message || '加载版主失败', type: 'error' });
  } finally {
    moderatorLoading.value = false;
  }
};

const searchStudents = async () => {
  if (!studentKeyword.value.trim()) return;
  searching.value = true;
  try {
    const data = await getUsers({ role: 'student', keyword: studentKeyword.value.trim(), pageSize: 20 });
    studentOptions.value = data.list || [];
    selectedStudentId.value = null;
  } catch (err) {
    emit('toast', { message: err.message || '搜索学生失败', type: 'error' });
  } finally {
    searching.value = false;
  }
};

const handleAddModerator = async () => {
  if (!selectedStudentId.value || !moderatorCollege.value.trim()) {
    emit('toast', { message: '请先选择学生并填写学院', type: 'warning' });
    return;
  }
  addingModerator.value = true;
  try {
    await adminCreateModerator({ userId: selectedStudentId.value, college: moderatorCollege.value.trim() });
    emit('toast', { message: '学生版主已添加', type: 'success' });
    studentOptions.value = [];
    selectedStudentId.value = null;
    moderatorCollege.value = '';
    studentKeyword.value = '';
    loadModerators();
  } catch (err) {
    emit('toast', { message: err.message || '添加失败', type: 'error' });
  } finally {
    addingModerator.value = false;
  }
};

const handleRemoveModerator = async (moderator) => {
  if (!window.confirm(`确定移除 ${moderator.nickname || moderator.username || moderator.user_id} 的「${moderator.college}」版主身份吗？`)) return;
  try {
    await adminRemoveModerator(moderator.id);
    emit('toast', { message: '版主已移除', type: 'success' });
    loadModerators();
  } catch (err) {
    emit('toast', { message: err.message || '移除失败', type: 'error' });
  }
};

onMounted(() => {
  loadQuestions();
  loadModerators();
});
</script>

<style scoped>
.student-admin {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 1200px;
}

.admin-head h1 {
  margin: 0;
  font-size: 24px;
  color: var(--iq-neutral-900);
}

.admin-head p {
  margin: 4px 0 0;
  color: var(--iq-neutral-500);
  font-size: 13px;
}

.admin-tabs {
  display: flex;
  gap: 8px;
}

.admin-tabs button {
  border: 1px solid var(--iq-border);
  background: #fff;
  color: var(--iq-neutral-600);
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
}

.admin-tabs button.active {
  background: var(--iq-primary-50);
  border-color: var(--iq-primary-500);
  color: var(--iq-primary-700);
  font-weight: 600;
}

.admin-filters {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 12px 16px;
  flex-wrap: wrap;
}

.admin-filters .iq-input {
  flex: 1;
  min-width: 160px;
}

.admin-filters .iq-select {
  min-width: 130px;
}

.admin-table-wrap {
  overflow-x: auto;
}

.q-cell {
  max-width: 360px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 12px;
}

.status-private {
  background: var(--iq-neutral-100);
  color: var(--iq-neutral-600);
}

.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.status-approved {
  background: #dcfce7;
  color: #15803d;
}

.status-rejected {
  background: #fee2e2;
  color: #b91c1c;
}

.danger {
  color: #dc2626;
}

.admin-loading,
.admin-empty {
  padding: 48px;
  text-align: center;
  color: var(--iq-neutral-500);
}

.moderator-add {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 16px;
  flex-wrap: wrap;
}

.moderator-add-title {
  display: grid;
  width: 100%;
  gap: 2px;
  margin-bottom: 4px;
}

.moderator-add-title span {
  font-size: 12px;
  color: var(--iq-neutral-500);
}

.moderator-add .iq-input,
.moderator-add .iq-select {
  min-width: 200px;
}
</style>
