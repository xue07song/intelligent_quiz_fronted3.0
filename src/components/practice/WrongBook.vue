<template>
  <div class="iq-wrong-book">
    <div class="iq-page-header">
      <div>
        <h2 class="iq-text-xl iq-font-semibold" style="color: var(--iq-neutral-900); margin: 0;">错题本</h2>
        <p class="iq-text-sm iq-text-muted" style="margin: 4px 0 0;">自动收集你做错的题目，集中回顾并重新练习</p>
      </div>
      <button class="iq-btn iq-btn-secondary" :disabled="loading" @click="loadData">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="23 4 23 10 17 10"></polyline>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
        </svg>
        刷新
      </button>
    </div>

    <div class="iq-card wrong-summary">
      <div class="summary-main">
        <div class="summary-count">
          <div class="summary-num">{{ total }}</div>
          <div class="summary-label">错题总数</div>
        </div>
        <div class="summary-copy">
          <b>错题重练</b>
          <span>从当前错题中随机抽取生成一套新试卷，反复巩固易错点</span>
        </div>
      </div>
      <div class="retry-controls">
        <label>
          <span>章节</span>
          <select v-model="retryChapter" class="iq-select" @change="loadData">
            <option value="">全部章节</option>
            <option v-for="chapter in 10" :key="chapter" :value="chapter">第{{ chapter }}章</option>
          </select>
        </label>
        <label>
          <span>题型</span>
          <select v-model="retryType" class="iq-select" @change="loadData">
            <option value="">全部题型</option>
            <option v-for="type in TYPE_OPTIONS" :key="type.value" :value="type.value">{{ type.label }}</option>
          </select>
        </label>
        <label>
          <span>题目数</span>
          <input v-model.number="retryCount" type="number" min="1" max="100" class="iq-input" />
        </label>
        <button class="iq-btn iq-btn-primary" :disabled="generating || total === 0" @click="handleRetry">
          <span v-if="generating" class="iq-btn-spinner"></span>
          {{ generating ? '正在组卷...' : '错题重练' }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="iq-table-loading">
      <span class="iq-loading-spinner"></span>
      <span class="iq-text-sm iq-text-muted">加载中...</span>
    </div>

    <div v-else-if="list.length === 0" class="iq-card">
      <div class="iq-empty-row">
        <div class="iq-empty-box">
          <div class="iq-empty-icon">📕</div>
          <div class="iq-empty-text iq-text-base" style="color: var(--iq-neutral-600);">暂无错题</div>
          <div class="iq-text-sm iq-text-muted">完成练习后，做错的题目会自动收录到这里</div>
        </div>
      </div>
    </div>

    <div v-else class="iq-card">
      <div class="iq-table-wrap">
        <table class="iq-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>题目</th>
              <th>题型</th>
              <th>难度</th>
              <th>章节</th>
              <th>知识点</th>
              <th>错题次数</th>
              <th>最近做错</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in list" :key="item.id">
              <td><span class="iq-id-chip">{{ item.id }}</span></td>
              <td class="wrong-title" :title="item.title">{{ item.title }}</td>
              <td>
                <span class="iq-type-tag" :class="`type-${item.question_type}`">{{ getTypeName(item.question_type) }}</span>
              </td>
              <td><span class="iq-tag iq-tag-neutral">{{ getDifficultyLabel(item.difficulty) }}</span></td>
              <td>第{{ item.chapter }}章</td>
              <td class="iq-text-sm iq-text-muted">{{ item.knowledge_point || '-' }}</td>
              <td><span class="wrong-count">{{ item.wrong_count }}</span></td>
              <td class="iq-text-sm iq-text-muted">{{ formatTime(item.last_wrong_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Pagination
        v-model:page="page"
        v-model:pageSize="pageSize"
        :total="total"
        @change="loadData"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getWrongQuestions, createWrongExam } from '@/api/practice';
import { getTypeName, getDifficultyLabel, TYPE_OPTIONS } from '@/utils/constants';
import { formatTime } from '@/utils/format';
import Pagination from '@/components/Pagination.vue';

const emit = defineEmits(['start-exam', 'toast']);

const list = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const loading = ref(false);
const generating = ref(false);

const retryChapter = ref('');
const retryType = ref('');
const retryCount = ref(20);

const loadData = async () => {
  loading.value = true;
  try {
    const params = { page: page.value, pageSize: pageSize.value };
    if (retryChapter.value) params.chapter = retryChapter.value;
    if (retryType.value) params.questionType = retryType.value;
    const data = await getWrongQuestions(params);
    list.value = data.list;
    total.value = data.total;
  } catch (err) {
    emit('toast', { message: err.message || '加载错题失败', type: 'error' });
  } finally {
    loading.value = false;
  }
};

const handleRetry = async () => {
  const count = Number(retryCount.value);
  if (!Number.isInteger(count) || count < 1 || count > 100) {
    emit('toast', { message: '题目数需为 1-100 之间的整数', type: 'warning' });
    return;
  }
  generating.value = true;
  try {
    const data = await createWrongExam({
      count,
      chapter: retryChapter.value || undefined,
      questionType: retryType.value || undefined,
    });
    if (data.truncated) {
      emit('toast', { message: `当前筛选下只有 ${data.availableCount} 道错题，已全部组卷`, type: 'warning' });
    } else {
      emit('toast', { message: `错题重练试卷已生成，共 ${data.total} 题`, type: 'success' });
    }
    emit('start-exam', data.examId);
  } catch (err) {
    emit('toast', { message: err.message || '生成错题练习失败', type: 'error' });
  } finally {
    generating.value = false;
  }
};

onMounted(() => {
  loadData();
});

defineExpose({ loadData });
</script>

<style scoped>
.iq-wrong-book {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.iq-page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
.wrong-summary {
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
}
.summary-main {
  display: flex;
  align-items: center;
  gap: 18px;
}
.summary-count {
  min-width: 96px;
  text-align: center;
  padding: 14px 18px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: var(--iq-radius-medium);
}
.summary-num {
  font-size: 30px;
  font-weight: 800;
  color: var(--iq-state-error);
  line-height: 1.1;
}
.summary-label {
  font-size: 12px;
  color: var(--iq-neutral-500);
  margin-top: 4px;
}
.summary-copy {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.summary-copy b {
  font-size: 15px;
  color: var(--iq-neutral-900);
}
.summary-copy span {
  font-size: 12px;
  color: var(--iq-neutral-500);
}
.retry-controls {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}
.retry-controls label {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 12px;
  color: var(--iq-neutral-600);
}
.retry-controls .iq-select,
.retry-controls .iq-input {
  width: 130px;
  height: 36px;
}
.retry-controls .iq-input {
  width: 100px;
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
.wrong-title {
  max-width: 380px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--iq-neutral-800);
  font-weight: 500;
}
.wrong-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 24px;
  padding: 0 8px;
  border-radius: var(--iq-radius-full);
  background: #fee2e2;
  color: #b91c1c;
  font-weight: 700;
  font-size: 12px;
}
.iq-type-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: var(--iq-radius-full);
  font-size: 12px;
  font-weight: 500;
}
.type-1 { background: #ede9fe; color: #6d28d9; }
.type-2 { background: #dbeafe; color: #1d4ed8; }
.type-3 { background: #fce7f3; color: #be185d; }
.type-4 { background: #d1fae5; color: #047857; }
.type-5 { background: #fef3c7; color: #b45309; }
.type-6 { background: #ffedd5; color: #c2410c; }
.iq-btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  margin-right: 6px;
  flex-shrink: 0;
  display: inline-block;
  vertical-align: middle;
}
@media (max-width: 768px) {
  .retry-controls {
    width: 100%;
  }
  .retry-controls label,
  .retry-controls .iq-select,
  .retry-controls .iq-input {
    flex: 1;
    width: auto;
    min-width: 0;
  }
}
</style>
