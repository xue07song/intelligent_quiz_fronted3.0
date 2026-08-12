<template>
  <div class="profile-page">
    <div class="iq-page-titlebar">
      <h1>个人中心</h1>
    </div>

    <el-tabs v-model="activeTab" class="profile-tabs">
      <!-- 个人信息 -->
      <el-tab-pane label="个人信息" name="info">
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
          </el-descriptions>
        </div>
      </el-tab-pane>

      <!-- 历史题目 -->
      <el-tab-pane label="历史题目" name="questions">
        <div class="iq-card profile-table-card">
          <el-table
            :data="questionList"
            v-loading="questionLoading"
            border
            class="profile-table"
          >
            <el-table-column prop="title" label="题目" min-width="280" show-overflow-tooltip />
            <el-table-column label="题型" width="110">
              <template #default="{ row }">
                {{ typeText(row.questionType) }}
              </template>
            </el-table-column>
            <el-table-column prop="userAnswer" label="用户答案" min-width="120" show-overflow-tooltip />
            <el-table-column prop="correctAnswer" label="正确答案" min-width="120" show-overflow-tooltip />
            <el-table-column label="是否正确" width="100">
              <template #default="{ row }">
                <el-tag :type="correctTagType(row.isCorrect)" size="small">
                  {{ correctText(row.isCorrect) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="答题时间" width="180">
              <template #default="{ row }">
                {{ formatTime(row.answeredAt) }}
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-model:current-page="questionPage"
            v-model:page-size="questionSize"
            class="profile-pagination"
            :total="questionTotal"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @current-change="loadQuestions"
            @size-change="handleQuestionSizeChange"
          />
        </div>
      </el-tab-pane>

      <!-- 历史试卷 -->
      <el-tab-pane label="历史试卷" name="exams">
        <div class="iq-card profile-table-card">
          <el-table
            :data="examList"
            v-loading="examLoading"
            border
            row-key="id"
            class="profile-table"
            @expand-change="handleExamExpand"
          >
            <el-table-column type="expand">
              <template #default="{ row }">
                <div class="exam-records-wrap" v-loading="recordsLoadingMap[row.id]">
                  <el-table :data="recordsMap[row.id] || []" size="small" border>
                    <el-table-column prop="score" label="得分" width="100">
                      <template #default="{ row: rec }">
                        {{ rec.score }} 分
                      </template>
                    </el-table-column>
                    <el-table-column prop="correctCount" label="正确数" width="90" />
                    <el-table-column prop="wrongCount" label="错误数" width="90" />
                    <el-table-column prop="skippedCount" label="未答数" width="90" />
                    <el-table-column label="提交时间" min-width="180">
                      <template #default="{ row: rec }">
                        {{ formatTime(rec.submittedAt) }}
                      </template>
                    </el-table-column>
                  </el-table>
                  <el-empty
                    v-if="!recordsLoadingMap[row.id] && (recordsMap[row.id] || []).length === 0"
                    description="暂无提交记录"
                    :image-size="60"
                  />
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="id" label="试卷ID" width="90" />
            <el-table-column prop="title" label="标题" min-width="220" show-overflow-tooltip />
            <el-table-column prop="totalCount" label="总题数" width="90" />
            <el-table-column label="提交次数" width="100">
              <template #default="{ row }">
                {{ row.attemptCount }}
              </template>
            </el-table-column>
            <el-table-column label="最高分" width="100">
              <template #default="{ row }">
                {{ row.maxScore }}
              </template>
            </el-table-column>
            <el-table-column label="生成时间" width="180">
              <template #default="{ row }">
                {{ formatTime(row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-model:current-page="examPage"
            v-model:page-size="examSize"
            class="profile-pagination"
            :total="examTotal"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @current-change="loadExams"
            @size-change="handleExamSizeChange"
          />
        </div>
      </el-tab-pane>

      <!-- 标记题目 -->
      <el-tab-pane label="标记题目" name="favorites">
        <div class="iq-card profile-table-card">
          <div class="favorite-add">
            <el-input
              v-model="favoriteQuestionId"
              class="favorite-input"
              placeholder="输入题目 ID 后收藏，如 Q001"
              clearable
              @keyup.enter="handleAddFavorite"
            />
            <el-button type="primary" :loading="addingFavorite" @click="handleAddFavorite">
              收藏
            </el-button>
          </div>

          <el-table
            :data="favoriteList"
            v-loading="favoriteLoading"
            border
            class="profile-table"
          >
            <el-table-column prop="questionId" label="题目ID" width="130" />
            <el-table-column prop="title" label="题目" min-width="280" show-overflow-tooltip />
            <el-table-column label="题型" width="110">
              <template #default="{ row }">
                {{ typeText(row.questionType) }}
              </template>
            </el-table-column>
            <el-table-column prop="knowledgePoint" label="知识点" min-width="140" show-overflow-tooltip />
            <el-table-column label="操作" width="130">
              <template #default="{ row }">
                <el-button
                  size="small"
                  type="danger"
                  plain
                  :loading="removingId === row.questionId"
                  @click="handleRemoveFavorite(row)"
                >
                  取消标记
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-model:current-page="favoritePage"
            v-model:page-size="favoriteSize"
            class="profile-pagination"
            :total="favoriteTotal"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @current-change="loadFavorites"
            @size-change="handleFavoriteSizeChange"
          />
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 编辑资料弹窗 -->
    <el-dialog
      v-model="editVisible"
      title="编辑资料"
      width="520px"
      class="profile-edit-dialog"
      destroy-on-close
    >
      <el-form label-width="90px" class="profile-edit-form">
        <el-form-item label="用户名">
          <el-input :model-value="editForm.username" disabled />
        </el-form-item>
        <el-form-item label="角色">
          <el-input :model-value="roleText(editForm.role)" disabled />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="editForm.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="editForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="editForm.phone" placeholder="请输入11位手机号" maxlength="11" />
        </el-form-item>
        <el-form-item label="学校">
          <el-input v-model="editForm.school" placeholder="请输入学校" />
        </el-form-item>
        <el-form-item label="学院">
          <el-input v-model="editForm.college" placeholder="请输入学院" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="editLoading" @click="handleSaveProfile">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, watch, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import {
  getStudentProfile,
  updateProfile,
  getHistoryQuestions,
  getHistoryExams,
  getExamRecords,
  getFavorites,
  addFavorite,
  removeFavorite,
} from '@/api/student';

const activeTab = ref('info');

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
  if (phone && !/^\d{11}$/.test(phone)) {
    ElMessage.warning('手机号必须是11位数字');
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
    loadProfile();
  } catch (err) {
    ElMessage.error(err.message || '资料更新失败');
  } finally {
    editLoading.value = false;
  }
};

// ===== 历史题目 =====
const questionList = ref([]);
const questionTotal = ref(0);
const questionPage = ref(1);
const questionSize = ref(20);
const questionLoading = ref(false);

const loadQuestions = async () => {
  questionLoading.value = true;
  try {
    const data = await getHistoryQuestions({
      page: questionPage.value,
      size: questionSize.value,
    });
    questionList.value = data.list || [];
    questionTotal.value = data.total || 0;
  } catch (err) {
    ElMessage.error(err.message || '加载历史题目失败');
  } finally {
    questionLoading.value = false;
  }
};

const handleQuestionSizeChange = () => {
  questionPage.value = 1;
  loadQuestions();
};

// ===== 历史试卷 =====
const examList = ref([]);
const examTotal = ref(0);
const examPage = ref(1);
const examSize = ref(20);
const examLoading = ref(false);
const recordsMap = reactive({});
const recordsLoadingMap = reactive({});

const loadExams = async () => {
  examLoading.value = true;
  try {
    const data = await getHistoryExams({
      page: examPage.value,
      size: examSize.value,
    });
    examList.value = data.list || [];
    examTotal.value = data.total || 0;
  } catch (err) {
    ElMessage.error(err.message || '加载历史试卷失败');
  } finally {
    examLoading.value = false;
  }
};

const handleExamSizeChange = () => {
  examPage.value = 1;
  loadExams();
};

const handleExamExpand = async (row, expandedRows) => {
  const expanded = expandedRows.some((item) => item.id === row.id);
  if (!expanded) return;
  if (recordsMap[row.id]) return;

  recordsLoadingMap[row.id] = true;
  try {
    const list = await getExamRecords(row.id);
    recordsMap[row.id] = Array.isArray(list) ? list : (list.list || []);
  } catch (err) {
    ElMessage.error(err.message || '加载提交记录失败');
    recordsMap[row.id] = [];
  } finally {
    recordsLoadingMap[row.id] = false;
  }
};

// ===== 标记题目 =====
const favoriteList = ref([]);
const favoriteTotal = ref(0);
const favoritePage = ref(1);
const favoriteSize = ref(20);
const favoriteLoading = ref(false);
const favoriteQuestionId = ref('');
const addingFavorite = ref(false);
const removingId = ref('');

const loadFavorites = async () => {
  favoriteLoading.value = true;
  try {
    const data = await getFavorites({
      page: favoritePage.value,
      size: favoriteSize.value,
    });
    favoriteList.value = data.list || [];
    favoriteTotal.value = data.total || 0;
  } catch (err) {
    ElMessage.error(err.message || '加载收藏题目失败');
  } finally {
    favoriteLoading.value = false;
  }
};

const handleFavoriteSizeChange = () => {
  favoritePage.value = 1;
  loadFavorites();
};

const handleAddFavorite = async () => {
  const questionId = favoriteQuestionId.value.trim();
  if (!questionId) {
    ElMessage.warning('请输入题目 ID');
    return;
  }

  addingFavorite.value = true;
  try {
    await addFavorite(questionId);
    ElMessage.success('收藏成功');
    favoriteQuestionId.value = '';
    loadFavorites();
  } catch (err) {
    ElMessage.error(err.message || '收藏失败');
  } finally {
    addingFavorite.value = false;
  }
};

const handleRemoveFavorite = async (row) => {
  removingId.value = row.questionId;
  try {
    await removeFavorite(row.questionId);
    ElMessage.success('已取消标记');
    if (favoriteList.value.length === 1 && favoritePage.value > 1) {
      favoritePage.value -= 1;
    }
    loadFavorites();
  } catch (err) {
    ElMessage.error(err.message || '取消标记失败');
  } finally {
    removingId.value = '';
  }
};

// ===== 工具函数 =====
const TYPE_MAP = {
  1: '判断题',
  2: '单选题',
  3: '多选题',
  4: '填空题',
  5: '简答题',
  6: '程序论述题',
};

const ROLE_MAP = {
  admin: '管理员',
  teacher: '教师',
  student: '学生',
};

const typeText = (type) => TYPE_MAP[Number(type)] || '未知';
const roleText = (role) => ROLE_MAP[role] || role || '--';

const textValue = (value) => {
  if (value === null || value === undefined || String(value).trim() === '') {
    return '暂未填写';
  }
  return value;
};

const correctText = (value) => {
  const map = { 0: '错误', 1: '正确', 2: '未答', 3: '不判分' };
  return map[Number(value)] || '--';
};

const correctTagType = (value) => {
  const map = { 0: 'danger', 1: 'success', 2: 'info', 3: 'warning' };
  return map[Number(value)] || 'info';
};

const formatTime = (value) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// ===== 生命周期 =====
const loadedTabs = {
  questions: false,
  exams: false,
  favorites: false,
};

watch(activeTab, (tab) => {
  if (tab === 'questions' && !loadedTabs.questions) {
    loadedTabs.questions = true;
    loadQuestions();
  }
  if (tab === 'exams' && !loadedTabs.exams) {
    loadedTabs.exams = true;
    loadExams();
  }
  if (tab === 'favorites' && !loadedTabs.favorites) {
    loadedTabs.favorites = true;
    loadFavorites();
  }
});

onMounted(() => {
  loadProfile();
});
</script>

<style scoped>
.profile-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
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

.profile-tabs :deep(.el-tabs__item) {
  font-size: 14px;
  color: var(--iq-neutral-600);
}

.profile-tabs :deep(.el-tabs__item.is-active) {
  color: var(--iq-primary);
}

.profile-tabs :deep(.el-tabs__active-bar) {
  background-color: var(--iq-primary);
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

.profile-edit-form :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px var(--iq-border) inset;
}

.profile-edit-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--iq-primary) inset;
}

.profile-table-card {
  padding: 20px;
}

.profile-table {
  width: 100%;
}

.profile-table :deep(.el-table th.el-table__cell) {
  background: var(--iq-neutral-50);
  color: var(--iq-neutral-700);
  font-weight: 600;
}

.profile-pagination {
  margin-top: 16px;
  justify-content: flex-end;
}

.exam-records-wrap {
  padding: 12px 24px;
  background: var(--iq-neutral-50);
  min-height: 60px;
}

.favorite-add {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.favorite-input {
  max-width: 320px;
}

@media (max-width: 768px) {
  .favorite-add {
    flex-direction: column;
    align-items: stretch;
  }

  .favorite-input {
    max-width: none;
  }
}
</style>
