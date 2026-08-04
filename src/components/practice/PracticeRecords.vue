<template>
  <div class="records-list">
    <div class="page-header">
      <h2>📊 答题记录</h2>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="list.length === 0" class="empty">
      <p>📭 暂无答题记录，去组卷练习吧</p>
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
          <tr v-for="r in list" :key="r.id">
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
              <button class="btn-view" @click="$emit('view-record', r.id)">查看详情</button>
            </td>
          </tr>
        </tbody>
      </table>

      <Pagination
        v-model:page="page"
        v-model:pageSize="pageSize"
        :total="total"
        @change="loadRecords"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getRecords } from '@/api/practice';
import Pagination from '@/components/Pagination.vue';

const emit = defineEmits(['view-record', 'toast']);

const list = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const loading = ref(false);

const formatTime = (t) => {
  if (!t) return '-';
  return String(t).replace('T', ' ').substring(0, 16);
};

const formatDuration = (sec) => {
  if (!sec) return '-';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}分${s}秒`;
};

const scoreClass = (score) => {
  if (score >= 90) return 'excellent';
  if (score >= 60) return 'pass';
  return 'fail';
};

const loadRecords = async () => {
  loading.value = true;
  try {
    const data = await getRecords({ page: page.value, pageSize: pageSize.value });
    list.value = data.list;
    total.value = data.total;
  } catch (err) {
    emit('toast', { message: err.message || '加载记录失败', type: 'error' });
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadRecords();
});

defineExpose({ loadRecords });
</script>

<style scoped>
.records-list {
  max-width: 1100px;
  margin: 0 auto;
}
.page-header {
  margin-bottom: 20px;
}
.page-header h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
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
.btn-view {
  background: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
}
.btn-view:hover { background: #bae7ff; }
</style>
