<template>
  <div class="record-detail">
    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="!record" class="empty">记录不存在</div>

    <div v-else>
      <div class="detail-header">
        <div>
          <h2>📝 答题详情</h2>
          <p class="meta">{{ record.exam_title || `试卷#${record.exam_id}` }} · 提交于 {{ formatTime(record.submitted_at) }}</p>
        </div>
        <button class="btn-back" @click="$emit('back')">← 返回</button>
      </div>

      <!-- 成绩概览 -->
      <div class="score-summary">
        <div class="score-circle" :class="scoreClass(record.score)">
          <div class="score-num">{{ record.score }}</div>
          <div class="score-text">分</div>
        </div>
        <div class="summary-grid">
          <div class="summary-item"><span class="label">准确率</span><span class="value">{{ record.accuracy }}%</span></div>
          <div class="summary-item"><span class="label">总题数</span><span class="value">{{ record.total_count }}</span></div>
          <div class="summary-item correct"><span class="label">正确</span><span class="value">{{ record.correct_count }}</span></div>
          <div class="summary-item wrong"><span class="label">错误</span><span class="value">{{ record.wrong_count }}</span></div>
          <div class="summary-item"><span class="label">未答</span><span class="value">{{ record.skipped_count }}</span></div>
          <div class="summary-item"><span class="label">客观题</span><span class="value">{{ record.objective_correct }}/{{ record.objective_total }}</span></div>
          <div class="summary-item"><span class="label">用时</span><span class="value">{{ formatDuration(record.duration_seconds) }}</span></div>
        </div>
      </div>

      <!-- 逐题详情 -->
      <h3 class="section-title">逐题详情</h3>
      <div class="answer-list">
        <div v-for="(a, idx) in record.answers" :key="a.id" class="answer-card" :class="answerClass(a)">
          <div class="a-header">
            <span class="a-num">第 {{ idx + 1 }} 题</span>
            <span class="a-type">{{ getTypeName(a.question_type) }}</span>
            <span class="a-status" :class="answerClass(a)">{{ statusText(a) }}</span>
          </div>
          <div class="a-title">{{ a.题目 }}</div>
          <div class="a-detail">
            <div class="a-row">
              <span class="a-label">你的答案：</span>
              <span class="a-value" :class="{ 'text-wrong': a.is_correct === 0, 'text-correct': a.is_correct === 1 }">
                {{ a.user_answer || '（未作答）' }}
              </span>
            </div>
            <div class="a-row">
              <span class="a-label">正确答案：</span>
              <span class="a-value text-correct">{{ a.correct_answer || '-' }}</span>
            </div>
            <div v-if="a.解析" class="a-row">
              <span class="a-label">解析：</span>
              <span class="a-value">{{ a.解析 }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getRecord, adminGetRecord } from '@/api/practice';
import { getTypeName } from '@/utils/constants';

const props = defineProps({
  recordId: { type: [Number, String], required: true },
  adminMode: { type: Boolean, default: false },
});

const emit = defineEmits(['back', 'toast']);

const loading = ref(true);
const record = ref(null);

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

// is_correct: 0=错, 1=对, 2=未答, 3=非客观题
const answerClass = (a) => {
  if (a.is_correct === 1) return 'correct';
  if (a.is_correct === 0) return 'wrong';
  if (a.is_correct === 3) return 'subjective';
  return 'skip';
};

const statusText = (a) => {
  if (a.is_correct === 1) return '✅ 正确';
  if (a.is_correct === 0) return '❌ 错误';
  if (a.is_correct === 3) return '📝 人工批阅';
  return '⏭️ 未答';
};

const loadRecord = async () => {
  loading.value = true;
  try {
    record.value = props.adminMode
      ? await adminGetRecord(props.recordId)
      : await getRecord(props.recordId);
  } catch (err) {
    emit('toast', { message: err.message || '加载记录失败', type: 'error' });
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadRecord();
});
</script>

<style scoped>
.record-detail {
  max-width: 900px;
  margin: 0 auto;
}
.loading, .empty {
  text-align: center;
  padding: 80px 0;
  color: #909399;
  font-size: 16px;
}
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}
.detail-header h2 {
  margin: 0 0 4px;
  font-size: 20px;
  color: #303133;
}
.meta {
  margin: 0;
  font-size: 13px;
  color: #909399;
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
.score-summary {
  display: flex;
  gap: 30px;
  align-items: center;
  background: #fff;
  border-radius: 8px;
  padding: 24px 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 24px;
}
.score-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.score-circle.excellent { background: #f0f9eb; border: 3px solid #52c41a; }
.score-circle.pass { background: #e6f7ff; border: 3px solid #1890ff; }
.score-circle.fail { background: #fef0f0; border: 3px solid #ff4d4f; }
.score-num {
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
}
.score-circle.excellent .score-num { color: #52c41a; }
.score-circle.pass .score-num { color: #1890ff; }
.score-circle.fail .score-num { color: #ff4d4f; }
.score-text {
  font-size: 12px;
  color: #909399;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  flex: 1;
}
.summary-item {
  background: #f5f7fa;
  border-radius: 6px;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.summary-item.correct { background: #f0f9eb; }
.summary-item.wrong { background: #fef0f0; }
.summary-item .label {
  font-size: 12px;
  color: #909399;
}
.summary-item .value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}
.section-title {
  font-size: 18px;
  color: #303133;
  margin: 0 0 16px;
}
.answer-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.answer-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border-left: 4px solid #dcdfe6;
}
.answer-card.correct { border-left-color: #52c41a; }
.answer-card.wrong { border-left-color: #ff4d4f; }
.answer-card.subjective { border-left-color: #e6a23c; }
.answer-card.skip { border-left-color: #c0c4cc; }
.a-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.a-num {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}
.a-type {
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 11px;
  background: #f0f2f5;
  color: #606266;
}
.a-status {
  font-size: 12px;
  font-weight: 500;
}
.a-status.correct { color: #52c41a; }
.a-status.wrong { color: #ff4d4f; }
.a-status.subjective { color: #e6a23c; }
.a-status.skip { color: #909399; }
.a-title {
  font-size: 15px;
  color: #303133;
  line-height: 1.6;
  margin-bottom: 10px;
}
.a-detail {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.a-row {
  font-size: 14px;
  display: flex;
  gap: 4px;
}
.a-label {
  color: #909399;
  white-space: nowrap;
  flex-shrink: 0;
}
.a-value {
  color: #303133;
  word-break: break-word;
}
.text-correct { color: #52c41a; font-weight: 500; }
.text-wrong { color: #ff4d4f; }
</style>
