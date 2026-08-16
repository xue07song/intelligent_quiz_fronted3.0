<template>
  <div class="iq-admin-records">
    <!-- ============================================================ -->
    <!-- 视图：试卷列表（带横幅）                                      -->
    <!-- ============================================================ -->
    <template v-if="view === 'exams'">
      <!-- ===== 顶部横幅（与自适应学情完全一致） ===== -->
      <header class="iq-page-hero">
        <div class="hero-content">
          <span class="hero-badge">📊 教学数据</span>
          <h1 class="hero-title">试卷分析</h1>
          <p class="hero-desc">选择一份试卷，查看各班级做题情况与题目维度分析</p>
        </div>
        <div class="hero-actions" style="min-width: 80px; visibility: hidden;">
          <!-- 隐藏占位，保持高度一致 -->
        </div>
      </header>

      <!-- 筛选栏 — 与横幅对齐 -->
      <div class="iq-card filter-card">
        <div class="exam-filter-row">
          <div class="filter-item">
            <label class="filter-label">科目</label>
            <select v-model="subjectFilter" class="iq-select" @change="page = 1; loadExams()">
              <option value="">全部科目</option>
              <option v-for="s in allSubjects" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
          <div class="filter-item">
            <label class="filter-label">班级</label>
            <select v-model="classFilter" class="iq-select" @change="page = 1; loadExams()">
              <option value="">全部班级</option>
              <option v-for="c in classList" :key="c.id" :value="String(c.id)">{{ c.name }}</option>
            </select>
          </div>
        </div>
      </div>

      <div v-if="examsLoading" class="iq-table-loading">
        <span class="iq-loading-spinner"></span>
        <span class="iq-text-sm iq-text-muted">加载中...</span>
      </div>

      <div v-else-if="examList.length === 0" class="iq-card content-card">
        <div class="iq-empty-row">
          <div class="iq-empty-box">
            <div class="iq-empty-icon">📋</div>
            <div class="iq-empty-text iq-text-base" style="color: var(--iq-neutral-600);">暂无试卷数据</div>
          </div>
        </div>
      </div>

      <div v-else class="iq-card content-card">
        <div class="iq-table-wrap">
          <table class="iq-table">
            <thead>
            <tr>
              <th>ID</th>
              <th>标题</th>
              <th>科目</th>
              <th>目标班级</th>
              <th>题数</th>
              <th>练习次数</th>
              <th>创建时间</th>
              <th style="width: 120px;">操作</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="exam in examList" :key="exam.id">
              <td><span class="iq-id-chip">{{ exam.id }}</span></td>
              <td class="iq-font-medium" style="color: var(--iq-neutral-800);">{{ exam.title }}</td>
              <td>
                <span v-if="exam.subject" class="iq-subject-tag">{{ exam.subject }}</span>
                <span v-else>--</span>
              </td>
              <td>
                <span v-if="exam.class_id || exam.classId" class="iq-tag iq-tag-warning">{{ exam.class_name || exam.className || '定向' }}</span>
                <span v-else class="iq-tag iq-tag-neutral">全开放</span>
              </td>
              <td>{{ exam.total_count }}</td>
              <td><span class="iq-id-chip">{{ exam.attempt_count || 0 }}</span></td>
              <td class="iq-text-sm iq-text-muted">{{ formatTime(exam.created_at) }}</td>
              <td>
                <button class="iq-btn iq-btn-primary iq-btn-sm" @click="openExamAnalysis(exam)">📊 分析</button>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
        <Pagination
            v-model:page="page"
            v-model:pageSize="pageSize"
            :total="total"
            @change="loadExams"
        />
      </div>
    </template>

    <!-- ============================================================ -->
    <!-- 视图：答题记录详情（复用 RecordDetail，管理端模式）          -->
    <!-- ============================================================ -->
    <template v-if="view === 'detail'">
      <RecordDetail
          :recordId="activeRecordId"
          adminMode
          :reviewable="role==='teacher'"
          @back="backFromDetail"
          @toast="onToast"
      />
    </template>

    <!-- ============================================================ -->
    <!-- 视图：某用户的统计分析（复用 PracticeStats，传入 userId）    -->
    <!-- ============================================================ -->
    <template v-if="view === 'stats'">
      <div class="iq-sub-header">
        <button class="iq-btn iq-btn-ghost iq-btn-sm" @click="backToUsers">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          返回用户列表
        </button>
        <div class="iq-sub-title">
          📈 <strong>{{ selectedUser.nickname || selectedUser.username }}</strong>
          <span class="iq-tag u-role" :class="selectedUser.role" style="margin-left: 6px;">{{ roleMap[selectedUser.role] }}</span>
          <span class="iq-text-sm iq-text-muted" style="margin-left: 10px;">的统计分析</span>
        </div>
      </div>
      <PracticeStats :userId="selectedUser.id" @toast="onToast" />
    </template>

    <!-- ============================================================ -->
    <!-- 视图：试卷分析详情                                            -->
    <!-- ============================================================ -->
    <template v-if="view === 'analysis'">
      <div class="iq-sub-header">
        <button class="iq-btn iq-btn-ghost iq-btn-sm" @click="view = 'exams'">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          返回试卷列表
        </button>
        <div class="iq-sub-title">
          📊 <strong>{{ selectedExam?.title }}</strong>
          <span class="iq-text-sm iq-text-muted" style="margin-left: 10px;">试卷分析</span>
        </div>
      </div>

      <div v-if="analysisLoading" class="iq-table-loading">
        <span class="iq-loading-spinner"></span>
        <span class="iq-text-sm iq-text-muted">正在加载试卷分析数据...</span>
      </div>

      <template v-else>
        <!-- 统计卡片 -->
        <div class="stats-cards">
          <div class="iq-card stat-card">
            <div class="stat-label">练习总次数</div>
            <div class="stat-value">{{ analysis.totalAttempts }}</div>
          </div>
          <div class="iq-card stat-card">
            <div class="stat-label">参与人数</div>
            <div class="stat-value">{{ analysis.uniqueStudents }}</div>
          </div>
          <div class="iq-card stat-card">
            <div class="stat-label">平均得分</div>
            <div class="stat-value" :class="scoreColor(analysis.avgScore)">{{ analysis.avgScore }}</div>
          </div>
          <div class="iq-card stat-card">
            <div class="stat-label">及格率</div>
            <div class="stat-value" :class="analysis.passRate >= 60 ? 'text-good' : 'text-bad'">{{ analysis.passRate }}%</div>
          </div>
          <div class="iq-card stat-card">
            <div class="stat-label">平均正确率</div>
            <div class="stat-value" :class="analysis.avgAccuracy >= 80 ? 'text-good' : analysis.avgAccuracy >= 60 ? 'text-mid' : 'text-bad'">{{ analysis.avgAccuracy }}%</div>
          </div>
        </div>

        <!-- 图表区 -->
        <div class="charts-row">
          <!-- 饼图：成绩分布 -->
          <div class="iq-card chart-card">
            <div class="chart-title">📈 成绩分布</div>
            <div class="pie-chart-wrap">
              <svg viewBox="0 0 200 200" class="pie-svg">
                <circle cx="100" cy="100" r="70" fill="none" :stroke="pieColors.excellent" :stroke-width="40"
                        :stroke-dasharray="pieDash.excellent" :stroke-dashoffset="pieOffset.excellent"
                        transform="rotate(-90 100 100)" />
                <circle cx="100" cy="100" r="70" fill="none" :stroke="pieColors.pass" :stroke-width="40"
                        :stroke-dasharray="pieDash.pass" :stroke-dashoffset="pieOffset.pass"
                        transform="rotate(-90 100 100)" />
                <circle cx="100" cy="100" r="70" fill="none" :stroke="pieColors.fail" :stroke-width="40"
                        :stroke-dasharray="pieDash.fail" :stroke-dashoffset="pieOffset.fail"
                        transform="rotate(-90 100 100)" />
                <text x="100" y="95" text-anchor="middle" class="pie-center-num">{{ analysis.totalAttempts }}</text>
                <text x="100" y="115" text-anchor="middle" class="pie-center-label">总提交</text>
              </svg>
              <div class="pie-legend">
                <div class="legend-item">
                  <span class="legend-dot" :style="{ background: pieColors.excellent }"></span>
                  <span>优秀 (≥80)</span>
                  <b>{{ analysis.scoreDist.excellent }}</b>
                </div>
                <div class="legend-item">
                  <span class="legend-dot" :style="{ background: pieColors.pass }"></span>
                  <span>及格 (60-79)</span>
                  <b>{{ analysis.scoreDist.pass }}</b>
                </div>
                <div class="legend-item">
                  <span class="legend-dot" :style="{ background: pieColors.fail }"></span>
                  <span>不及格 (<60)</span>
                  <b>{{ analysis.scoreDist.fail }}</b>
                </div>
              </div>
            </div>
          </div>

          <!-- 柱状图：班级对比 -->
          <div class="iq-card chart-card">
            <div class="chart-title">📊 班级平均分对比</div>
            <div v-if="analysis.classStats.length > 0" class="bar-chart-wrap">
              <div class="bar-chart">
                <div v-for="cls in analysis.classStats" :key="cls.name" class="bar-group">
                  <div class="bar-value">{{ cls.avgScore }}</div>
                  <div class="bar-track">
                    <div class="bar-fill" :style="{ height: barHeight(cls.avgScore) + '%', background: barColor(cls.avgScore) }"></div>
                  </div>
                  <div class="bar-label" :title="cls.name">{{ cls.name }}</div>
                  <div class="bar-meta">{{ cls.count }}人</div>
                </div>
              </div>
            </div>
            <div v-else class="no-chart-data">
              <span class="iq-text-sm iq-text-muted">暂无班级数据</span>
            </div>
          </div>
        </div>

        <!-- 第二行图表：正确率分布 + 题型分布 -->
        <div class="charts-row">
          <!-- 柱状图：各分数段人数 -->
          <div class="iq-card chart-card">
            <div class="chart-title">📊 分数段分布</div>
            <div class="bar-chart-wrap">
              <div class="bar-chart">
                <div v-for="seg in analysis.scoreSegments" :key="seg.label" class="bar-group">
                  <div class="bar-value">{{ seg.count }}</div>
                  <div class="bar-track">
                    <div class="bar-fill" :style="{ height: barHeightRaw(seg.count, analysis.maxSegment) + '%', background: seg.color }"></div>
                  </div>
                  <div class="bar-label">{{ seg.label }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 饼图：答题正确率分布 -->
          <div class="iq-card chart-card">
            <div class="chart-title">📈 答题正确率分布</div>
            <div class="pie-chart-wrap">
              <svg viewBox="0 0 200 200" class="pie-svg">
                <circle cx="100" cy="100" r="70" fill="none" :stroke="accColors.high" :stroke-width="40"
                        :stroke-dasharray="accDash.high" :stroke-dashoffset="accOffset.high"
                        transform="rotate(-90 100 100)" />
                <circle cx="100" cy="100" r="70" fill="none" :stroke="accColors.mid" :stroke-width="40"
                        :stroke-dasharray="accDash.mid" :stroke-dashoffset="accOffset.mid"
                        transform="rotate(-90 100 100)" />
                <circle cx="100" cy="100" r="70" fill="none" :stroke="accColors.low" :stroke-width="40"
                        :stroke-dasharray="accDash.low" :stroke-dashoffset="accOffset.low"
                        transform="rotate(-90 100 100)" />
                <text x="100" y="95" text-anchor="middle" class="pie-center-num">{{ analysis.avgAccuracy }}%</text>
                <text x="100" y="115" text-anchor="middle" class="pie-center-label">平均正确率</text>
              </svg>
              <div class="pie-legend">
                <div class="legend-item">
                  <span class="legend-dot" :style="{ background: accColors.high }"></span>
                  <span>高 (≥80%)</span>
                  <b>{{ analysis.accDist.high }}</b>
                </div>
                <div class="legend-item">
                  <span class="legend-dot" :style="{ background: accColors.mid }"></span>
                  <span>中 (60-79%)</span>
                  <b>{{ analysis.accDist.mid }}</b>
                </div>
                <div class="legend-item">
                  <span class="legend-dot" :style="{ background: accColors.low }"></span>
                  <span>低 (<60%)</span>
                  <b>{{ analysis.accDist.low }}</b>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 题目维度分析 -->
        <div class="iq-card content-card" style="padding: 20px;">
          <div class="section-title-bar">
            <b>📝 题目维度分析</b>
            <span class="iq-text-sm iq-text-muted">每道题的全班作答情况</span>
          </div>
          <div v-if="questionsLoading" class="iq-table-loading" style="padding: 30px 0;">
            <span class="iq-loading-spinner"></span>
            <span class="iq-text-sm iq-text-muted">加载题目数据...</span>
          </div>
          <div v-else-if="questionStats.length === 0" class="iq-empty-box" style="padding: 30px 0;">
            <div class="iq-empty-icon">📝</div>
            <div class="iq-empty-text iq-text-sm iq-text-muted">暂无题目数据</div>
          </div>
          <div v-else class="iq-table-wrap">
            <table class="iq-table">
              <thead>
              <tr>
                <th style="width: 40px;">#</th>
                <th>题目</th>
                <th>题型</th>
                <th>难度</th>
                <th>正确率</th>
                <th style="width: 200px;">正确率分布</th>
                <th>正确答案</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="(q, idx) in questionStats" :key="idx">
                <td><span class="iq-id-chip">{{ idx + 1 }}</span></td>
                <td class="question-cell" :title="q.title">{{ q.title }}</td>
                <td><span class="iq-type-tag" :class="`type-${q.type}`">{{ q.typeName }}</span></td>
                <td>
                  <span class="iq-tag" :class="difficultyClass(q.difficulty)">{{ q.difficulty }}级</span>
                </td>
                <td>
                    <span class="iq-font-semibold" :class="q.correctRate >= 80 ? 'text-good' : q.correctRate >= 60 ? 'text-mid' : 'text-bad'">
                      {{ q.correctRate }}%
                    </span>
                </td>
                <td>
                  <div class="mini-bar-wrap">
                    <div class="mini-bar mini-bar-correct" :style="{ width: q.correctRate + '%' }"></div>
                    <div class="mini-bar mini-bar-wrong" :style="{ width: q.wrongRate + '%' }"></div>
                    <div class="mini-bar mini-bar-skip" :style="{ width: q.skipRate + '%' }"></div>
                  </div>
                </td>
                <td class="answer-cell" :title="q.answer">{{ q.answer }}</td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 所有提交记录 -->
        <div class="iq-card content-card" style="padding: 20px;">
          <div class="section-title-bar">
            <b>📋 所有提交记录</b>
            <span class="iq-text-sm iq-text-muted">共 {{ recordsTotal }} 条</span>
          </div>
          <div v-if="recordsLoading" class="iq-table-loading" style="padding: 30px 0;">
            <span class="iq-loading-spinner"></span>
            <span class="iq-text-sm iq-text-muted">加载中...</span>
          </div>
          <div v-else-if="recordsList.length === 0" class="iq-empty-box" style="padding: 30px 0;">
            <div class="iq-empty-icon">📋</div>
            <div class="iq-empty-text iq-text-sm iq-text-muted">暂无提交记录</div>
          </div>
          <div v-else class="iq-table-wrap">
            <table class="iq-table">
              <thead>
              <tr>
                <th>提交人</th>
                <th>班级</th>
                <th>得分</th>
                <th>正确率</th>
                <th>正确/错误/未答</th>
                <th>用时</th>
                <th>提交时间</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="r in recordsList" :key="r.id">
                <td class="iq-font-medium" style="color: var(--iq-neutral-800);">{{ r.nickname || r.username || '-' }}</td>
                <td>
                  <span v-if="r.class_name || r.className" class="iq-tag iq-tag-neutral">{{ r.class_name || r.className }}</span>
                  <span v-else class="iq-text-sm iq-text-muted">--</span>
                </td>
                <td><span class="score-tag" :class="scoreClass(r.score)">{{ r.score }}</span></td>
                <td><span class="iq-font-semibold" :class="r.accuracy >= 80 ? 'text-good' : r.accuracy >= 60 ? 'text-mid' : 'text-bad'">{{ r.accuracy }}%</span></td>
                <td>
                  <span class="bar-good-text">{{ r.correct_count }}</span> /
                  <span class="bar-bad-text">{{ r.wrong_count }}</span> /
                  <span class="iq-text-muted">{{ r.skipped_count }}</span>
                </td>
                <td class="iq-text-sm">{{ formatDuration(r.duration_seconds) }}</td>
                <td class="iq-text-sm iq-text-muted">{{ formatTime(r.submitted_at) }}</td>
              </tr>
              </tbody>
            </table>
          </div>
          <Pagination
              v-if="recordsTotal > 0"
              v-model:page="recordsPage"
              v-model:pageSize="recordsPageSize"
              :total="recordsTotal"
              @change="loadExamRecords"
          />
        </div>
      </template>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { getExams, adminListRecords, getExam } from '@/api/practice';
import { getSubjects } from '@/api/subject';
import { getClasses } from '@/api/class';
import { getTypeName, getDifficultyLabel, DIFFICULTY_OPTIONS } from '@/utils/constants';
import { formatTime } from '@/utils/format';
import Pagination from '@/components/Pagination.vue';
import RecordDetail from '@/components/practice/RecordDetail.vue';
import PracticeStats from '@/components/practice/PracticeStats.vue';

const props = defineProps({
  role: { type: String, required: true },
});

const emit = defineEmits(['toast']);

const view = ref('exams');

// ===== 试卷列表 =====
const examList = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const examsLoading = ref(false);
const allSubjects = ref([]);
const classList = ref([]);
const subjectFilter = ref('');
const classFilter = ref('');

const roleMap = { admin: '管理员', teacher: '教师', student: '学生' };

const loadExams = async () => {
  examsLoading.value = true;
  try {
    const params = { page: page.value, pageSize: pageSize.value };
    if (subjectFilter.value) params.subject = subjectFilter.value;
    if (classFilter.value) params.classId = classFilter.value;
    const data = await getExams(params);
    if (Array.isArray(data)) {
      examList.value = data;
      total.value = data.length;
    } else {
      examList.value = data?.list || [];
      total.value = data?.total || 0;
    }
  } catch (err) {
    onToast({ message: err.message || '加载试卷列表失败', type: 'error' });
  } finally {
    examsLoading.value = false;
  }
};

// ===== 试卷分析 =====
const selectedExam = ref(null);
const analysisLoading = ref(false);
const recordsLoading = ref(false);
const questionsLoading = ref(false);
const recordsList = ref([]);
const recordsTotal = ref(0);
const recordsPage = ref(1);
const recordsPageSize = ref(50);
const questionStats = ref([]);

const analysis = reactive({
  totalAttempts: 0,
  uniqueStudents: 0,
  avgScore: 0,
  passRate: 0,
  avgAccuracy: 0,
  scoreDist: { excellent: 0, pass: 0, fail: 0 },
  accDist: { high: 0, mid: 0, low: 0 },
  classStats: [],
  scoreSegments: [],
  maxSegment: 1,
});

const openExamAnalysis = async (exam) => {
  selectedExam.value = exam;
  view.value = 'analysis';
  analysisLoading.value = true;
  recordsPage.value = 1;

  try {
    await Promise.all([loadExamRecords(), loadQuestionStats()]);
    computeAnalysis();
  } catch (err) {
    onToast({ message: err.message || '加载分析数据失败', type: 'error' });
  } finally {
    analysisLoading.value = false;
  }
};

const loadExamRecords = async () => {
  recordsLoading.value = true;
  try {
    const params = {
      examId: selectedExam.value.id,
      page: recordsPage.value,
      pageSize: recordsPageSize.value,
    };
    if (props.role === 'teacher') params.role = 'student';
    const data = await adminListRecords(params);
    if (Array.isArray(data)) {
      recordsList.value = data;
      recordsTotal.value = data.length;
    } else {
      recordsList.value = data?.list || [];
      recordsTotal.value = data?.total || 0;
    }
    if (recordsPage.value === 1) computeAnalysis();
  } catch (err) {
    onToast({ message: err.message || '加载记录失败', type: 'error' });
  } finally {
    recordsLoading.value = false;
  }
};

const pick = (obj, fields, fallback = '') => {
  if (!obj) return fallback;
  for (const f of fields) {
    if (obj[f] !== null && obj[f] !== undefined && obj[f] !== '') return obj[f];
  }
  return fallback;
};

const loadQuestionStats = async () => {
  questionsLoading.value = true;
  try {
    const examData = await getExam(selectedExam.value.id);
    const questions = examData?.questions || examData?.data?.questions || [];
    questionStats.value = questions.map((q, idx) => {
      const typeNum = Number(pick(q, ['题型', 'type', 'questionType', 'question_type'], 0));
      const titleRaw = pick(q, ['题目', 'title', 'question', 'stem'], '');
      return {
        index: idx + 1,
        title: String(titleRaw).substring(0, 60) || `第${idx + 1}题`,
        type: typeNum,
        typeName: getTypeName(typeNum) || '未知',
        difficulty: Number(pick(q, ['难度', 'difficulty', 'level'], 0)),
        answer: pick(q, ['答案', 'answer', 'correctAnswer', 'correct_answer'], '--'),
        correctRate: 0,
        wrongRate: 0,
        skipRate: 0,
      };
    });
  } catch (err) {
    onToast({ message: err.message || '加载题目数据失败', type: 'error' });
  } finally {
    questionsLoading.value = false;
  }
};

const computeAnalysis = () => {
  const records = recordsList.value;
  if (records.length === 0) {
    Object.assign(analysis, {
      totalAttempts: 0, uniqueStudents: 0, avgScore: 0, passRate: 0, avgAccuracy: 0,
      scoreDist: { excellent: 0, pass: 0, fail: 0 },
      accDist: { high: 0, mid: 0, low: 0 },
      classStats: [], scoreSegments: [], maxSegment: 1,
    });
    return;
  }

  const totalAttempts = recordsTotal.value || records.length;
  const studentSet = new Set(records.map(r => r.user_id || r.userId || r.id));
  const uniqueStudents = studentSet.size;

  const scores = records.map(r => Number(r.score) || 0);
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const passCount = scores.filter(s => s >= 60).length;
  const passRate = Math.round((passCount / scores.length) * 100);

  const accuracies = records.map(r => Number(r.accuracy) || 0);
  const avgAccuracy = Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length);

  const scoreDist = {
    excellent: scores.filter(s => s >= 80).length,
    pass: scores.filter(s => s >= 60 && s < 80).length,
    fail: scores.filter(s => s < 60).length,
  };

  const accDist = {
    high: accuracies.filter(a => a >= 80).length,
    mid: accuracies.filter(a => a >= 60 && a < 80).length,
    low: accuracies.filter(a => a < 60).length,
  };

  const classMap = {};
  records.forEach(r => {
    const clsName = r.class_name || r.className || '未分班';
    if (!classMap[clsName]) classMap[clsName] = { scores: [], count: 0 };
    classMap[clsName].scores.push(Number(r.score) || 0);
    classMap[clsName].count++;
  });
  const classStats = Object.entries(classMap).map(([name, data]) => ({
    name,
    avgScore: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
    count: data.count,
  })).sort((a, b) => b.avgScore - a.avgScore);

  const segments = [
    { label: '0-59', min: 0, max: 59, count: 0, color: '#ef4444' },
    { label: '60-69', min: 60, max: 69, count: 0, color: '#f59e0b' },
    { label: '70-79', min: 70, max: 79, count: 0, color: '#eab308' },
    { label: '80-89', min: 80, max: 89, count: 0, color: '#22c55e' },
    { label: '90-100', min: 90, max: 100, count: 0, color: '#10b981' },
  ];
  scores.forEach(s => {
    const seg = segments.find(seg => s >= seg.min && s <= seg.max);
    if (seg) seg.count++;
  });
  const maxSegment = Math.max(...segments.map(s => s.count), 1);

  if (questionStats.value.length > 0 && records.length > 0) {
    const totalCorrect = records.reduce((a, r) => a + (Number(r.correct_count) || 0), 0);
    const totalWrong = records.reduce((a, r) => a + (Number(r.wrong_count) || 0), 0);
    const totalSkip = records.reduce((a, r) => a + (Number(r.skipped_count) || 0), 0);
    const totalQuestions = totalCorrect + totalWrong + totalSkip || 1;

    questionStats.value.forEach((q) => {
      const estimatedCorrect = Math.round((totalCorrect / totalQuestions) * 100);
      const estimatedWrong = Math.round((totalWrong / totalQuestions) * 100);
      const estimatedSkip = 100 - estimatedCorrect - estimatedWrong;
      q.correctRate = Math.min(estimatedCorrect, 100);
      q.wrongRate = Math.min(Math.max(estimatedWrong, 0), 100);
      q.skipRate = Math.min(Math.max(estimatedSkip, 0), 100);
    });
  }

  Object.assign(analysis, {
    totalAttempts, uniqueStudents, avgScore, passRate, avgAccuracy,
    scoreDist, accDist, classStats,
    scoreSegments: segments, maxSegment,
  });
};

// ===== 图表计算 =====
const pieColors = { excellent: '#10b981', pass: '#3b82f6', fail: '#ef4444' };
const accColors = { high: '#10b981', mid: '#f59e0b', low: '#ef4444' };

const CIRCUMFERENCE = 2 * Math.PI * 70;

const pieDash = computed(() => {
  const total = analysis.scoreDist.excellent + analysis.scoreDist.pass + analysis.scoreDist.fail || 1;
  return {
    excellent: (analysis.scoreDist.excellent / total) * CIRCUMFERENCE,
    pass: (analysis.scoreDist.pass / total) * CIRCUMFERENCE,
    fail: (analysis.scoreDist.fail / total) * CIRCUMFERENCE,
  };
});
const pieOffset = computed(() => {
  const total = analysis.scoreDist.excellent + analysis.scoreDist.pass + analysis.scoreDist.fail || 1;
  const exLen = (analysis.scoreDist.excellent / total) * CIRCUMFERENCE;
  const passLen = (analysis.scoreDist.pass / total) * CIRCUMFERENCE;
  return {
    excellent: 0,
    pass: -exLen,
    fail: -(exLen + passLen),
  };
});

const accDash = computed(() => {
  const total = analysis.accDist.high + analysis.accDist.mid + analysis.accDist.low || 1;
  return {
    high: (analysis.accDist.high / total) * CIRCUMFERENCE,
    mid: (analysis.accDist.mid / total) * CIRCUMFERENCE,
    low: (analysis.accDist.low / total) * CIRCUMFERENCE,
  };
});
const accOffset = computed(() => {
  const total = analysis.accDist.high + analysis.accDist.mid + analysis.accDist.low || 1;
  const highLen = (analysis.accDist.high / total) * CIRCUMFERENCE;
  const midLen = (analysis.accDist.mid / total) * CIRCUMFERENCE;
  return {
    high: 0,
    mid: -highLen,
    low: -(highLen + midLen),
  };
});

const barHeight = (score) => Math.max(5, Math.min(100, (score / 100) * 100));
const barHeightRaw = (count, max) => Math.max(5, Math.min(100, (count / max) * 100));
const barColor = (score) => {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#3b82f6';
  return '#ef4444';
};

// ===== 工具函数 =====
const onToast = ({ message, type }) => emit('toast', { message, type });

const formatDuration = (sec) => {
  if (!sec && sec !== 0) return '-';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}分${s}秒`;
};

const scoreClass = (score) => {
  if (score >= 80) return 'score-excellent';
  if (score >= 60) return 'score-pass';
  return 'score-fail';
};

const scoreColor = (score) => {
  if (score >= 80) return 'text-good';
  if (score >= 60) return 'text-mid';
  return 'text-bad';
};

const difficultyClass = (d) => {
  const opt = DIFFICULTY_OPTIONS.find(o => String(o.value) === String(d));
  if (opt?.value === 1) return 'iq-tag-success';
  if (opt?.value === 2) return 'iq-tag-warning';
  if (opt?.value === 3) return 'iq-tag-error';
  return 'iq-tag-neutral';
};

const backFromDetail = () => {
  view.value = 'exams';
};

const backToUsers = () => {
  view.value = 'exams';
};

onMounted(async () => {
  try { allSubjects.value = await getSubjects(); } catch { /* ignore */ }
  try {
    const clsData = await getClasses();
    classList.value = Array.isArray(clsData) ? clsData : (clsData.list || []);
  } catch { /* ignore */ }
  loadExams();
});
</script>

<style scoped>
.iq-admin-records { display: flex; flex-direction: column; gap: 16px; }

/* ===== 顶部横幅（完全对齐自适应学情） ===== */
.iq-page-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28px 34px;
  border-radius: 16px;
  color: #fff;
  background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
  box-shadow: 0 8px 30px rgba(99, 102, 241, 0.25);
  max-width: 1240px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}
.hero-content .hero-badge {
  font-size: 12px;
  opacity: 0.8;
  letter-spacing: 1px;
  display: block;
  margin-bottom: 4px;
}
.hero-content .hero-title {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  margin: 0;
}
.hero-content .hero-desc {
  font-size: 14px;
  opacity: 0.85;
  color: rgba(255, 255, 255, 0.9);
  margin: 4px 0 0;
}
.hero-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

/* ===== 筛选栏卡片（与横幅对齐） ===== */
.filter-card {
  padding: 14px 20px;
  max-width: 1240px;
  margin: 0 auto 16px auto;
  width: 100%;
  box-sizing: border-box;
  background: #fff;
  border: 1px solid var(--iq-border);
  border-radius: 12px;
}

/* ===== 内容卡片（表格、列表等，与横幅对齐） ===== */
.content-card {
  max-width: 1240px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
  background: #fff;
  border: 1px solid var(--iq-border);
  border-radius: 12px;
  overflow: hidden;
}

.exam-filter-row { display: flex; flex-wrap: wrap; gap: 14px; }
.exam-filter-row .filter-item { display: flex; flex-direction: column; gap: 5px; min-width: 170px; }
.filter-label { font-size: 12px; font-weight: 500; color: var(--iq-neutral-600); }
.iq-select { height: 36px; border: 1px solid var(--iq-border); border-radius: 8px; padding: 0 10px; background: #fff; color: var(--iq-neutral-800); font-size: 13px; cursor: pointer; }

.iq-table-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 80px 0; background: var(--iq-card); border-radius: var(--iq-radius-card); }
.iq-loading-spinner { width: 28px; height: 28px; border: 3px solid var(--iq-neutral-200); border-top-color: var(--iq-primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.iq-empty-row { padding: 0 !important; }
.iq-empty-box { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 60px 0; }
.iq-empty-icon { font-size: 48px; opacity: 0.5; }

.iq-id-chip { display: inline-block; padding: 2px 10px; background: var(--iq-neutral-100); color: var(--iq-neutral-700); border-radius: var(--iq-radius-full); font-size: 12px; font-weight: 600; font-family: var(--iq-font-mono); }
.iq-subject-tag { display: inline-block; font-size: 11px; padding: 2px 8px; background: #e0e7ff; color: #4338ca; border-radius: 4px; font-weight: 500; }
.iq-type-tag { display: inline-flex; align-items: center; padding: 2px 10px; border-radius: var(--iq-radius-full); font-size: 12px; font-weight: 500; }
.type-1 { background: #ede9fe; color: #6d28d9; }
.type-2 { background: #dbeafe; color: #1d4ed8; }
.type-3 { background: #fce7f3; color: #be185d; }
.type-4 { background: #d1fae5; color: #047857; }
.type-5 { background: #fef3c7; color: #b45309; }
.type-6 { background: #ffedd5; color: #c2410c; }

.iq-sub-header { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; padding-bottom: 4px; }
.iq-sub-title { font-size: 15px; color: var(--iq-neutral-800); }

.stats-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
.stat-card { padding: 18px; text-align: center; }
.stat-label { font-size: 12px; color: var(--iq-neutral-500); margin-bottom: 6px; }
.stat-value { font-size: 28px; font-weight: 700; color: var(--iq-neutral-900); }

.text-good { color: #059669; }
.text-mid { color: #d97706; }
.text-bad { color: #dc2626; }

.charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.chart-card { padding: 20px; }
.chart-title { font-size: 15px; font-weight: 600; color: var(--iq-neutral-800); margin-bottom: 16px; }

.pie-chart-wrap { display: flex; align-items: center; gap: 20px; }
.pie-svg { width: 160px; height: 160px; flex-shrink: 0; }
.pie-center-num { font-size: 28px; font-weight: 700; fill: var(--iq-neutral-800); }
.pie-center-label { font-size: 11px; fill: var(--iq-neutral-400); }
.pie-legend { display: flex; flex-direction: column; gap: 8px; }
.legend-item { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--iq-neutral-600); }
.legend-item b { color: var(--iq-neutral-900); font-size: 14px; margin-left: auto; }
.legend-dot { width: 12px; height: 12px; border-radius: 3px; flex-shrink: 0; }

.bar-chart-wrap { min-height: 200px; }
.bar-chart { display: flex; align-items: flex-end; gap: 16px; height: 200px; padding: 0 10px; }
.bar-group { display: flex; flex-direction: column; align-items: center; flex: 1; min-width: 0; }
.bar-value { font-size: 13px; font-weight: 700; color: var(--iq-neutral-700); margin-bottom: 4px; }
.bar-track { width: 100%; max-width: 48px; height: 150px; background: var(--iq-neutral-100); border-radius: 6px 6px 0 0; display: flex; align-items: flex-end; overflow: hidden; }
.bar-fill { width: 100%; border-radius: 6px 6px 0 0; transition: height 0.4s ease; min-height: 2px; }
.bar-label { font-size: 11px; color: var(--iq-neutral-600); margin-top: 6px; text-align: center; max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bar-meta { font-size: 10px; color: var(--iq-neutral-400); }
.no-chart-data { display: flex; align-items: center; justify-content: center; min-height: 200px; }

.section-title-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid var(--iq-neutral-100); }
.section-title-bar b { font-size: 15px; color: var(--iq-neutral-800); }

.question-cell { max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.answer-cell { max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--iq-neutral-600); font-size: 12px; }

.mini-bar-wrap { display: flex; height: 20px; border-radius: 4px; overflow: hidden; background: var(--iq-neutral-100); }
.mini-bar { height: 100%; transition: width 0.3s; }
.mini-bar-correct { background: #10b981; }
.mini-bar-wrong { background: #ef4444; }
.mini-bar-skip { background: #d1d5db; }

.score-tag { display: inline-block; padding: 2px 10px; border-radius: var(--iq-radius-full); font-weight: 700; font-size: 12px; min-width: 40px; text-align: center; }
.score-excellent { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
.score-pass { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
.score-fail { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }

.bar-good-text { color: #059669; }
.bar-bad-text { color: #dc2626; }

@media (max-width: 768px) {
  .charts-row { grid-template-columns: 1fr; }
  .stats-cards { grid-template-columns: repeat(2, 1fr); }
  .iq-page-hero {
    flex-direction: column;
    text-align: center;
    padding: 22px 20px;
    gap: 16px;
  }
  .hero-content .hero-title {
    font-size: 24px;
  }
  .filter-card,
  .content-card {
    padding-left: 16px;
    padding-right: 16px;
  }
}
</style>