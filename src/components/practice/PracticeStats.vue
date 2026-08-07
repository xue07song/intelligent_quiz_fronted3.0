<template>
  <div class="practice-stats">
    <div class="page-header">
      <h2>📈 统计分析</h2>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="!stats || stats.overview.total_attempts === 0" class="empty">
      <p>📭 暂无练习数据，完成一次答题练习后即可查看统计</p>
    </div>

    <div v-else>
      <!-- AI 错题分析（仅本人统计时可用） -->
      <div v-if="!userId" class="ai-section">
        <button class="btn-ai" :disabled="aiLoading" @click="loadWeakness">
          {{ aiLoading ? 'AI 分析中...' : '🤖 AI 错题分析' }}
        </button>
        <div v-if="aiReport" class="ai-report">
          <div v-if="!aiReport.hasData" class="ai-empty">{{ aiReport.message }}</div>
          <template v-else>
            <div v-if="aiReport.analysis?.summary" class="report-block">
              <div class="block-title">📋 总体评价</div>
              <div class="block-text">{{ aiReport.analysis.summary }}</div>
            </div>
            <div v-if="aiReport.analysis?.weakTypes?.length" class="report-block">
              <div class="block-title">⚠️ 薄弱题型</div>
              <div v-for="(t, i) in aiReport.analysis.weakTypes" :key="i" class="weak-item">
                <span class="weak-name">{{ t.题型 }}</span>
                <span class="weak-acc">正确率 {{ t.正确率 }}%</span>
                <span class="weak-advice">{{ t.建议 }}</span>
              </div>
            </div>
            <div v-if="aiReport.analysis?.weakPoints?.length" class="report-block">
              <div class="block-title">🎯 薄弱知识点</div>
              <div v-for="(p, i) in aiReport.analysis.weakPoints" :key="i" class="point-item">
                <div class="point-head">
                  <span class="point-name">{{ p.知识点 }}</span>
                  <span class="point-chapter">第{{ p.章节 }}章</span>
                </div>
                <div class="point-reason">原因：{{ p.原因 }}</div>
                <div class="point-advice">建议：{{ p.建议 }}</div>
              </div>
            </div>
            <div v-if="aiReport.analysis?.studyPlan?.length" class="report-block">
              <div class="block-title">📚 学习建议</div>
              <ul class="plan-list">
                <li v-for="(s, i) in aiReport.analysis.studyPlan" :key="i">{{ s }}</li>
              </ul>
            </div>
            <div v-if="aiReport.analysis?.encouragement" class="report-encourage">
              💪 {{ aiReport.analysis.encouragement }}
            </div>
          </template>
        </div>
      </div>

      <!-- 总览卡片 -->
      <div class="overview-grid">
        <div class="stat-card">
          <div class="stat-icon">📝</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.overview.total_attempts }}</div>
            <div class="stat-label">练习次数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🎯</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.overview.avg_accuracy }}%</div>
            <div class="stat-label">平均准确率</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🏆</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.overview.max_accuracy }}%</div>
            <div class="stat-label">最佳成绩</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📚</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.overview.total_questions }}</div>
            <div class="stat-label">累计答题</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.overview.total_correct }}</div>
            <div class="stat-label">累计正确</div>
          </div>
        </div>
      </div>

      <!-- 趋势图 -->
      <div class="chart-card">
        <h3>📊 近期练习趋势（最近 {{ stats.trend.length }} 次）</h3>
        <div class="trend-chart" v-if="stats.trend.length > 0">
          <div class="trend-bars">
            <div v-for="(item, idx) in stats.trend" :key="item.id" class="trend-bar-wrapper">
              <div class="trend-bar" :style="{ height: barHeight(item.accuracy) + '%' }">
                <span class="bar-value">{{ item.accuracy }}%</span>
              </div>
              <span class="bar-label">#{{ idx + 1 }}</span>
            </div>
          </div>
        </div>
        <div v-else class="no-data">暂无趋势数据</div>
      </div>

      <!-- 按题型正确率 -->
      <div class="chart-card">
        <h3>📋 按题型正确率</h3>
        <div class="type-list" v-if="stats.byType.length > 0">
          <div v-for="item in stats.byType" :key="item.question_type" class="type-row">
            <div class="type-name">{{ getTypeName(item.question_type) }}</div>
            <div class="type-bar-bg">
              <div class="type-bar" :style="{ width: item.accuracy + '%' }" :class="accuracyClass(item.accuracy)"></div>
            </div>
            <div class="type-detail">
              <span class="type-accuracy">{{ item.accuracy }}%</span>
              <span class="type-count">({{ item.correct }}/{{ item.total }})</span>
            </div>
          </div>
        </div>
        <div v-else class="no-data">暂无题型数据</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getPracticeStats, adminGetUserStats } from '@/api/practice';
import { getWeakness } from '@/api/ai';
import { getTypeName } from '@/utils/constants';

const props = defineProps({
  userId: { type: [Number, String], default: null },
});

const emit = defineEmits(['toast']);

const loading = ref(true);
const stats = ref(null);

// AI 错题分析（仅本人模式可用，管理端查看他人时不显示 AI 分析按钮）
const aiLoading = ref(false);
const aiReport = ref(null);

const loadWeakness = async () => {
  if (props.userId) {
    emit('toast', { message: '查看他人统计时不支持 AI 错题分析', type: 'warning' });
    return;
  }
  aiLoading.value = true;
  try {
    aiReport.value = await getWeakness();
  } catch (err) {
    emit('toast', { message: err.message || 'AI 分析失败', type: 'error' });
  } finally {
    aiLoading.value = false;
  }
};

const barHeight = (accuracy) => {
  // 最小 5%，保证可见
  return Math.max(5, accuracy);
};

const accuracyClass = (acc) => {
  if (acc >= 80) return 'bar-good';
  if (acc >= 60) return 'bar-mid';
  return 'bar-bad';
};

const loadStats = async () => {
  loading.value = true;
  try {
    stats.value = props.userId
      ? await adminGetUserStats(props.userId)
      : await getPracticeStats();
  } catch (err) {
    emit('toast', { message: err.message || '加载统计数据失败', type: 'error' });
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadStats();
});

defineExpose({ loadStats });
</script>

<style scoped>
.practice-stats {
  max-width: 900px;
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
.ai-section {
  margin-bottom: 24px;
}
.btn-ai {
  padding: 8px 18px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: opacity 0.2s;
}
.btn-ai:hover:not(:disabled) { opacity: 0.9; }
.btn-ai:disabled { opacity: 0.6; cursor: not-allowed; }
.ai-report {
  margin-top: 14px;
  background: linear-gradient(135deg, #f0f5ff, #f9f0ff);
  border: 1px solid #d6e4ff;
  border-radius: 8px;
  padding: 18px 22px;
}
.ai-empty {
  text-align: center;
  color: #909399;
  font-size: 14px;
  padding: 20px 0;
}
.report-block {
  margin-bottom: 16px;
}
.report-block:last-child {
  margin-bottom: 0;
}
.block-title {
  font-size: 15px;
  font-weight: 600;
  color: #667eea;
  margin-bottom: 8px;
}
.block-text {
  font-size: 14px;
  color: #303133;
  line-height: 1.7;
}
.weak-item {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 8px 12px;
  background: #fff;
  border-radius: 6px;
  margin-bottom: 6px;
  font-size: 13px;
}
.weak-name {
  font-weight: 600;
  color: #303133;
  min-width: 70px;
}
.weak-acc {
  color: #ff4d4f;
  min-width: 90px;
}
.weak-advice {
  color: #606266;
  flex: 1;
}
.point-item {
  background: #fff;
  border-radius: 6px;
  padding: 10px 12px;
  margin-bottom: 8px;
}
.point-head {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 4px;
}
.point-name {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}
.point-chapter {
  font-size: 12px;
  color: #909399;
  background: #f0f2f5;
  padding: 1px 8px;
  border-radius: 10px;
}
.point-reason, .point-advice {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
}
.plan-list {
  margin: 0;
  padding-left: 20px;
}
.plan-list li {
  font-size: 14px;
  color: #303133;
  line-height: 1.8;
}
.report-encourage {
  margin-top: 12px;
  padding: 10px 14px;
  background: #fff;
  border-radius: 6px;
  font-size: 14px;
  color: #52c41a;
  font-weight: 500;
  text-align: center;
}
.loading, .empty {
  text-align: center;
  padding: 60px 0;
  color: #909399;
  font-size: 15px;
}
.overview-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}
.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.stat-icon {
  font-size: 28px;
}
.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
}
.stat-label {
  font-size: 12px;
  color: #909399;
}
.chart-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
}
.chart-card h3 {
  margin: 0 0 16px;
  font-size: 16px;
  color: #303133;
}
.trend-chart {
  overflow-x: auto;
  padding: 10px 0;
}
.trend-bars {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  min-height: 200px;
  padding-bottom: 24px;
}
.trend-bar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 36px;
  height: 100%;
  justify-content: flex-end;
}
.trend-bar {
  width: 28px;
  background: linear-gradient(180deg, #667eea, #764ba2);
  border-radius: 4px 4px 0 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 4px;
  min-height: 10px;
  transition: height 0.3s;
}
.bar-value {
  font-size: 10px;
  color: #fff;
  font-weight: 600;
}
.bar-label {
  font-size: 11px;
  color: #909399;
}
.type-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.type-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.type-name {
  width: 80px;
  font-size: 14px;
  color: #303133;
  flex-shrink: 0;
}
.type-bar-bg {
  flex: 1;
  height: 20px;
  background: #f0f2f5;
  border-radius: 10px;
  overflow: hidden;
}
.type-bar {
  height: 100%;
  border-radius: 10px;
  transition: width 0.3s;
}
.type-bar.bar-good { background: linear-gradient(90deg, #52c41a, #73d13d); }
.type-bar.bar-mid { background: linear-gradient(90deg, #faad14, #ffc53d); }
.type-bar.bar-bad { background: linear-gradient(90deg, #ff4d4f, #ff7875); }
.type-detail {
  display: flex;
  gap: 4px;
  font-size: 13px;
  white-space: nowrap;
}
.type-accuracy {
  font-weight: 600;
  color: #303133;
}
.type-count {
  color: #909399;
}
.no-data {
  text-align: center;
  color: #c0c4cc;
  padding: 30px 0;
}

@media (max-width: 768px) {
  .overview-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
