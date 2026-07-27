<template>
  <div id="app" class="app-container">
    <header class="app-header">
      <h1 class="app-title">📚 智能题库管理系统</h1>
      <div class="app-stats" v-if="stats">
        <span>题库总量: <strong>{{ stats.total }}</strong></span>
        <span v-if="stats.byChapter?.length">章节数: <strong>{{ stats.byChapter.length }}</strong></span>
      </div>
    </header>

    <main class="app-main">
      <SearchBar
        :initialFilters="filters"
        @search="handleSearch"
        @reset="handleReset"
        @add="openAddDialog"
      />

      <QuestionTable
        :list="list"
        :loading="loading"
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

    <Toast :message="toastMessage" :type="toastType" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { getQuestions, addQuestion, updateQuestion, deleteQuestion, getStatistics } from '@/api/question';
import SearchBar from '@/components/SearchBar.vue';
import QuestionTable from '@/components/QuestionTable.vue';
import QuestionForm from '@/components/QuestionForm.vue';
import QuestionDetail from '@/components/QuestionDetail.vue';
import Pagination from '@/components/Pagination.vue';
import Toast from '@/components/Toast.vue';

const list = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const loading = ref(false);

const filters = reactive({
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

const loadData = async () => {
  loading.value = true;
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
    };
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

onMounted(() => {
  loadData();
  loadStats();
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

@media (max-width: 768px) {
  .app-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>