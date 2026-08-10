<template>
  <div class="iq-records">
    <div class="iq-page-header">
      <div>
        <h2 class="iq-text-xl iq-font-semibold" style="color: var(--iq-neutral-900); margin: 0;">答题记录</h2>
        <p class="iq-text-sm iq-text-muted" style="margin: 4px 0 0;">查看过往答题的成绩与详细分析</p>
      </div>
    </div>

    <div v-if="loading" class="iq-table-loading">
      <span class="iq-loading-spinner"></span>
      <span class="iq-text-sm iq-text-muted">加载中...</span>
    </div>

    <div v-else-if="list.length === 0" class="iq-card">
      <div class="iq-empty-row">
        <div class="iq-empty-box">
          <div class="iq-empty-icon">📊</div>
          <div class="iq-empty-text iq-text-base" style="color: var(--iq-neutral-600);">暂无答题记录</div>
          <div class="iq-text-sm iq-text-muted">去组卷练习后回来查看记录</div>
        </div>
      </div>
    </div>

    <div v-else class="iq-card">
      <div class="iq-table-wrap">
        <table class="iq-table">
          <thead>
            <tr>
              <th>ID</th>
              <th v-if="showSubmitter">提交人</th>
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
            <tr v-for="r in list" :key="r.id">
              <td><span class="iq-id-chip">{{ r.id }}</span></td>
              <td v-if="showSubmitter">
                <div class="user-cell">
                  <span class="iq-font-medium" style="color: var(--iq-neutral-800);">{{ r.nickname || r.username || '-' }}</span>
                  <span v-if="r.role" class="iq-tag u-role" :class="r.role">{{ roleMap[r.role] || r.role }}</span>
                </div>
              </td>
              <td class="iq-font-medium" style="color: var(--iq-neutral-800);">{{ r.exam_title || `试卷#${r.exam_id}` }}</td>
              <td><span class="score-tag" :class="scoreClass(r.score)">{{ r.score }}</span></td>
              <td>{{ r.accuracy }}%</td>
              <td>{{ r.total_count }}</td>
              <td class="text-success iq-font-semibold">{{ r.correct_count }}</td>
              <td class="text-error iq-font-semibold">{{ r.wrong_count }}</td>
              <td>{{ r.skipped_count }}</td>
              <td>{{ formatDuration(r.duration_seconds) }}</td>
              <td class="iq-text-sm iq-text-muted">{{ formatTime(r.submitted_at) }}</td>
              <td>
                <button class="iq-btn iq-btn-primary iq-btn-sm" @click="$emit('view-record', r.id)">
                  📋 详情
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

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
import { ref, computed, onMounted } from 'vue';
import { getRecords } from '@/api/practice';
import Pagination from '@/components/Pagination.vue';
import { formatTime } from '@/utils/format';

const roleMap = { admin: '管理员', teacher: '教师', student: '学生' };

const props = defineProps({
  role: { type: String, default: 'student' },
});

const showSubmitter = computed(() => props.role === 'admin' || props.role === 'teacher');

const emit = defineEmits(['view-record', 'toast']);

const list = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const loading = ref(false);

const formatDuration = (sec) => {
  if (!sec) return '-';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}分${s}秒`;
};

const scoreClass = (score) => {
  if (score >= 90) return 'score-excellent';
  if (score >= 60) return 'score-pass';
  return 'score-fail';
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
.iq-records {
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

.user-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}
.iq-id-chip {
  display: inline-block;
  font-family: var(--iq-font-mono);
  font-size: 12px;
  padding: 2px 8px;
  background: var(--iq-neutral-100);
  color: var(--iq-neutral-700);
  border-radius: 4px;
  font-weight: 500;
}
.u-role.iq-tag.admin { background: #fef2f2; color: #b91c1c; }
.u-role.iq-tag.teacher { background: #eff6ff; color: #1d4ed8; }
.u-role.iq-tag.student { background: #ecfdf5; color: #047857; }
.text-success { color: var(--iq-state-success); }
.text-error { color: var(--iq-state-error); }
.score-tag {
  display: inline-block;
  padding: 3px 10px;
  border-radius: var(--iq-radius-full);
  font-weight: 700;
  font-size: 13px;
  min-width: 44px;
  text-align: center;
}
.score-excellent { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
.score-pass { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
.score-fail { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
</style>
