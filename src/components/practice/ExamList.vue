<template>
  <div class="exam-list">
    <div class="page-header">
      <h2>📋 我的试卷</h2>
      <button class="btn-primary" @click="$emit('generate')">+ 新建试卷</button>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="list.length === 0" class="empty">
      <p>📭 暂无试卷，点击"新建试卷"开始练习</p>
    </div>

    <div v-else class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>标题</th>
            <th>题数</th>
            <th>客观题</th>
            <th>章节</th>
            <th>题型</th>
            <th>难度</th>
            <th>练习次数</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="exam in list" :key="exam.id">
            <td>{{ exam.id }}</td>
            <td class="col-title">{{ exam.title }}</td>
            <td>{{ exam.total_count }}</td>
            <td>{{ exam.objective_count }}</td>
            <td>{{ exam.chapter || '-' }}</td>
            <td>{{ exam.question_type ? getTypeName(exam.question_type) : '不限' }}</td>
            <td>{{ exam.difficulty ? getDifficultyLabel(exam.difficulty) : '不限' }}</td>
            <td>{{ exam.attempt_count || 0 }}</td>
            <td>{{ formatTime(exam.created_at) }}</td>
            <td>
              <button class="btn-start" @click="$emit('start-exam', exam.id)">开始答题</button>
            </td>
          </tr>
        </tbody>
      </table>

      <Pagination
        v-model:page="page"
        v-model:pageSize="pageSize"
        :total="total"
        @change="loadExams"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getExams } from '@/api/practice';
import { getTypeName, getDifficultyLabel } from '@/utils/constants';
import Pagination from '@/components/Pagination.vue';

const emit = defineEmits(['generate', 'start-exam', 'toast']);

const list = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const loading = ref(false);

const formatTime = (t) => {
  if (!t) return '-';
  const d = new Date(t);
  if (isNaN(d)) return String(t).replace('T', ' ').substring(0, 16);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const loadExams = async () => {
  loading.value = true;
  try {
    const data = await getExams({ page: page.value, pageSize: pageSize.value });
    list.value = data.list;
    total.value = data.total;
  } catch (err) {
    emit('toast', { message: err.message || '加载试卷列表失败', type: 'error' });
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadExams();
});

defineExpose({ loadExams });
</script>

<style scoped>
.exam-list {
  max-width: 1100px;
  margin: 0 auto;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.page-header h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}
.btn-primary {
  padding: 8px 16px;
  background: #667eea;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
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
.btn-start {
  background: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
}
.btn-start:hover { background: #bae7ff; }
</style>
