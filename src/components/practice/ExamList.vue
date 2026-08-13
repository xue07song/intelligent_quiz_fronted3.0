<template>
  <div class="iq-exam-list">
    <div class="iq-page-header">
      <div>
        <h2 class="iq-text-xl iq-font-semibold" style="color: var(--iq-neutral-900); margin: 0;">{{ role === 'teacher' ? '我创建的试卷' : '教师试卷' }}</h2>
        <p class="iq-text-sm iq-text-muted" style="margin: 4px 0 0;">{{ role === 'student' ? '选择教师发布的试卷开始答题' : role === 'admin' ? '查看所有教师创建的试卷和题目内容' : '管理自己创建的试卷' }}</p>
      </div>
        <button v-if="role === 'teacher'" class="iq-btn iq-btn-primary" @click="$emit('generate')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        新建试卷
      </button>
    </div>

    <div v-if="loading" class="iq-table-loading">
      <span class="iq-loading-spinner"></span>
      <span class="iq-text-sm iq-text-muted">加载中...</span>
    </div>

    <div v-else-if="list.length === 0" class="iq-card">
      <div class="iq-empty-row">
        <div class="iq-empty-box">
          <div class="iq-empty-icon">📋</div>
          <div class="iq-empty-text iq-text-base" style="color: var(--iq-neutral-600);">暂无试卷</div>
          <div class="iq-text-sm iq-text-muted">点击「新建试卷」开始组卷练习</div>
        </div>
      </div>
    </div>

    <div v-else class="iq-card">
      <div class="iq-table-wrap">
        <table class="iq-table">
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
              <th style="width: 120px;">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="exam in list" :key="exam.id">
              <td><span class="iq-id-chip">{{ exam.id }}</span></td>
              <td class="iq-font-medium" style="color: var(--iq-neutral-800);">{{ exam.title }}</td>
              <td>{{ exam.total_count }}</td>
              <td>{{ exam.objective_count }}</td>
              <td>{{ exam.chapter || '-' }}</td>
              <td>
                <span v-if="exam.question_type" class="iq-type-tag" :class="`type-${exam.question_type}`">{{ getTypeName(exam.question_type) }}</span>
                <span v-else class="iq-tag iq-tag-neutral">不限</span>
              </td>
              <td>
                <span v-if="exam.difficulty" class="iq-tag" :class="difficultyClass(exam.difficulty)">{{ getDifficultyLabel(exam.difficulty) }}</span>
                <span v-else class="iq-tag iq-tag-neutral">不限</span>
              </td>
              <td><span class="iq-id-chip">{{ exam.attempt_count || 0 }}</span></td>
              <td class="iq-text-sm iq-text-muted">{{ formatTime(exam.created_at) }}</td>
              <td>
                <button v-if="role === 'student'" class="iq-btn iq-btn-primary iq-btn-sm" @click="$emit('start-exam', exam.id)">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                  开始答题
                </button>
                <button v-else class="iq-btn iq-btn-secondary iq-btn-sm" @click="openPreview(exam.id)">查看题目</button>
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

    <div v-if="previewVisible" class="preview-mask" @click.self="closePreview"><div class="preview-dialog"><div class="preview-head"><div><h2>{{ previewExam.title }}</h2><p>创建教师：{{ previewExam.creator_name || '-' }} · 共 {{ previewExam.questions?.length || 0 }} 题</p></div><button class="close" @click="closePreview">×</button></div><div v-if="previewLoading" class="preview-loading">正在读取试卷题目...</div><div v-else class="preview-body"><article v-for="(q,index) in previewExam.questions" :key="q.id" class="preview-question"><div class="number">{{ index+1 }}</div><div><div class="question-meta"><span>{{ getTypeName(q.题型) }}</span><span>难度{{ q.难度 }}</span><span>{{ q.知识点 || '未标注知识点' }}</span></div><h3>{{ q.题目 }}</h3><p v-if="q.选项">{{ q.选项 }}</p><details><summary>查看答案与解析</summary><p><b>答案：</b>{{ q.答案 }}</p><p v-if="q.解析"><b>解析：</b>{{ q.解析 }}</p></details></div></article></div></div></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getExams, getExam } from '@/api/practice';
import { getTypeName, getDifficultyLabel, DIFFICULTY_OPTIONS } from '@/utils/constants';
import { formatTime } from '@/utils/format';
import Pagination from '@/components/Pagination.vue';

const emit = defineEmits(['generate', 'start-exam', 'toast']);
defineProps({ role: { type: String, default: 'student' } });

const list = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const loading = ref(false);
const previewVisible=ref(false),previewLoading=ref(false),previewExam=ref({questions:[]});
const openPreview=async(id)=>{previewVisible.value=true;previewLoading.value=true;try{previewExam.value=await getExam(id)}catch(err){emit('toast',{message:err.message||'读取试卷失败',type:'error'});previewVisible.value=false}finally{previewLoading.value=false}};
const closePreview=()=>{previewVisible.value=false;previewExam.value={questions:[]}};

const difficultyClass = (d) => {
  const opt = DIFFICULTY_OPTIONS.find(o => String(o.value) === String(d));
  if (opt?.value === 1) return 'iq-tag-success';
  if (opt?.value === 2) return 'iq-tag-warning';
  if (opt?.value === 3) return 'iq-tag-error';
  return 'iq-tag-neutral';
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
.iq-exam-list {
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
.preview-mask{position:fixed;inset:0;z-index:1000;background:#0f172a88;display:grid;place-items:center;padding:30px}.preview-dialog{width:min(900px,95vw);max-height:88vh;display:flex;flex-direction:column;background:white;border-radius:18px;box-shadow:0 25px 70px #0f172a55}.preview-head{display:flex;justify-content:space-between;padding:22px 26px;border-bottom:1px solid #e2e8f0}.preview-head h2{margin:0}.preview-head p{margin:5px 0 0;color:#64748b}.close{border:0;background:#f1f5f9;width:34px;height:34px;border-radius:50%;font-size:24px}.preview-body{overflow:auto;padding:20px 26px}.preview-loading{padding:70px;text-align:center}.preview-question{display:grid;grid-template-columns:36px 1fr;gap:12px;padding:18px 0;border-bottom:1px solid #e2e8f0}.number{width:30px;height:30px;display:grid;place-items:center;background:#eef2ff;color:#4338ca;border-radius:8px;font-weight:700}.question-meta{display:flex;gap:7px}.question-meta span{font-size:12px;padding:3px 7px;background:#f1f5f9;border-radius:10px}.preview-question h3{font-size:16px;line-height:1.6}.preview-question p{white-space:pre-wrap;color:#475569}details{margin-top:10px;padding:10px;background:#f8fafc;border-radius:8px}summary{cursor:pointer;color:#4f46e5;font-weight:600}
</style>
