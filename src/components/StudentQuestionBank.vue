<template>
  <div class="student-bank">
    <div class="bank-head">
      <div>
        <h1>{{ tabTitle }}</h1>
        <p>{{ tabDescription }}</p>
      </div>
      <div class="bank-actions">
        <button class="iq-btn iq-btn-secondary" @click="ocrVisible = true">🖼 图片识别导入</button>
        <button class="iq-btn iq-btn-secondary" @click="openCreate">➕ 新增题目</button>
        <button v-if="activeTab !== 'review'" class="iq-btn iq-btn-primary" @click="openExport">📤 导出</button>
      </div>
    </div>

    <div class="bank-tabs">
      <button :class="{ active: activeTab === 'own' }" @click="activeTab = 'own'">我的题目</button>
      <button :class="{ active: activeTab === 'community' }" @click="activeTab = 'community'">社区题目</button>
      <button :class="{ active: activeTab === 'review' }" @click="activeTab = 'review'">审核队列</button>
    </div>

    <div class="iq-card bank-filters">
      <input v-model="filters.keyword" class="iq-input" placeholder="搜索题干 / 知识点" @keyup.enter="page = 1; load()" />
      <select v-model="filters.subject" class="iq-select" @change="page = 1; load()">
        <option value="">全部科目</option>
        <option v-for="s in subjectOptions" :key="s" :value="s">{{ s }}</option>
      </select>
      <select v-if="activeTab === 'own'" v-model="filters.status" class="iq-select" @change="page = 1; load()">
        <option value="">全部状态</option>
        <option value="private">私密</option>
        <option value="pending">待审核</option>
        <option value="approved">已公开</option>
        <option value="rejected">未通过</option>
      </select>
      <button class="iq-btn iq-btn-secondary iq-btn-sm" @click="resetFilters">重置</button>
    </div>

    <div class="iq-card">
      <div v-if="loading" class="bank-loading">加载中...</div>
      <div v-else-if="!list.length" class="bank-empty">
        {{ activeTab === 'own' ? '还没有题目，可以用图片识别导入或手动新增' : '同专业暂时还没有已公开的题目' }}
      </div>
      <div v-else class="bank-table-wrap">
        <table class="iq-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>题型</th>
              <th>题目</th>
              <th>科目</th>
              <th>难度</th>
              <th v-if="activeTab === 'own'">状态</th>
              <th v-if="activeTab === 'community' || activeTab === 'review'">发布者</th>
              <th style="width: 180px;">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in list" :key="item.id">
              <td><span class="iq-id-chip">{{ item.id }}</span></td>
              <td><span class="type-chip">{{ getTypeName(item.题型) }}</span></td>
              <td class="q-cell">{{ item.题目 }}</td>
              <td>{{ item.科目 || '-' }}</td>
              <td>{{ getDifficultyLabel(item.难度) }}</td>
              <td v-if="activeTab === 'own'">
                <span class="status-tag" :class="`status-${item.review_status}`">{{ statusText(item.review_status) }}</span>
              </td>
              <td v-if="activeTab === 'community' || activeTab === 'review'">{{ item.owner_nickname || item.owner_username || item.owner_id }}</td>
              <td>
                <button class="iq-btn iq-btn-secondary iq-btn-sm" @click="openDetail(item)">查看</button>
                <template v-if="activeTab === 'review'">
                  <button class="iq-btn iq-btn-primary iq-btn-sm" @click="handleReview(item, 'approve')">通过</button>
                  <button class="iq-btn iq-btn-secondary iq-btn-sm" @click="handleReview(item, 'reject')">拒绝</button>
                </template>
                <button v-if="activeTab === 'own'" class="iq-btn iq-btn-secondary iq-btn-sm" @click="openEdit(item)">编辑</button>
                <button
                  v-if="activeTab === 'own' && item.review_status !== 'pending' && item.review_status !== 'approved'"
                  class="iq-btn iq-btn-secondary iq-btn-sm"
                  @click="handleShare(item)"
                >申请共享</button>
                <button v-if="activeTab === 'own'" class="iq-btn iq-btn-ghost iq-btn-sm danger" @click="handleDelete(item)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <Pagination v-model:page="page" v-model:pageSize="pageSize" :total="total" @change="load" />
    </div>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="formVisible" class="iq-modal-overlay" @click.self="formVisible = false">
          <div class="iq-modal student-form-modal">
            <div class="iq-modal-header">
              <h3 class="iq-modal-title">{{ editingId ? '编辑题目' : '新增题目' }}</h3>
              <button class="iq-modal-close" @click="formVisible = false">×</button>
            </div>
            <div class="iq-modal-body">
              <div class="form-grid">
                <div class="form-field">
                  <label class="form-label">题型</label>
                  <select v-model="form.题型" class="iq-select">
                    <option v-for="opt in TYPE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                  </select>
                </div>
                <div class="form-field">
                  <label class="form-label">难度</label>
                  <select v-model="form.难度" class="iq-select">
                    <option value="">不限</option>
                    <option v-for="opt in DIFFICULTY_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                  </select>
                </div>
              </div>
              <div class="form-field">
                <label class="form-label">科目（可选）</label>
                <select v-model="form.科目" class="iq-select">
                  <option value="">不限科目</option>
                  <option v-for="s in subjectOptions" :key="s" :value="s">{{ s }}</option>
                </select>
              </div>
              <div class="form-field">
                <label class="form-label">题目 <span class="required">*</span></label>
                <textarea v-model="form.题目" class="iq-input form-textarea" rows="3"></textarea>
              </div>
              <div class="form-field">
                <label class="form-label">选项</label>
                <textarea v-model="form.选项" class="iq-input form-textarea" rows="3" placeholder="A. ...&#10;B. ..."></textarea>
              </div>
              <div class="form-grid">
                <div class="form-field">
                  <label class="form-label">答案</label>
                  <input v-model="form.答案" type="text" class="iq-input" />
                </div>
                <div class="form-field">
                  <label class="form-label">知识点</label>
                  <input v-model="form.知识点" type="text" class="iq-input" />
                </div>
              </div>
              <div class="form-field">
                <label class="form-label">解析</label>
                <textarea v-model="form.解析" class="iq-input form-textarea" rows="2"></textarea>
              </div>
              <label class="share-check">
                <input type="checkbox" v-model="form.share" />
                <span>同时申请共享到同专业社区（需版主/管理员审核）</span>
              </label>
              <div v-if="formError" class="form-error">{{ formError }}</div>
            </div>
            <div class="iq-modal-footer">
              <button type="button" class="iq-btn iq-btn-secondary" @click="formVisible = false">取消</button>
              <button type="button" class="iq-btn iq-btn-primary" :disabled="saving" @click="saveForm">
                {{ saving ? '保存中...' : '保存' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="detailVisible" class="iq-modal-overlay" @click.self="detailVisible = false">
          <div class="iq-modal student-detail-modal">
            <div class="iq-modal-header">
              <h3 class="iq-modal-title">题目详情</h3>
              <button class="iq-modal-close" @click="detailVisible = false">×</button>
            </div>
            <div class="iq-modal-body">
              <div class="detail-meta">
                <span>{{ getTypeName(detail.题型) }}</span>
                <span>难度 {{ detail.难度 || '-' }}</span>
                <span>{{ detail.科目 || '不限科目' }}</span>
              </div>
              <div class="detail-block"><b>题目</b><p>{{ detail.题目 }}</p></div>
              <div v-if="detail.选项" class="detail-block"><b>选项</b><p class="pre">{{ detail.选项 }}</p></div>
              <div class="detail-block"><b>答案</b><p>{{ detail.答案 || '-' }}</p></div>
              <div v-if="detail.解析" class="detail-block"><b>解析</b><p>{{ detail.解析 }}</p></div>
              <div v-if="detail.知识点" class="detail-block"><b>知识点</b><p>{{ detail.知识点 }}</p></div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="exportVisible" class="iq-modal-overlay" @click.self="exportVisible = false">
          <div class="iq-modal export-modal">
            <div class="iq-modal-header">
              <h3 class="iq-modal-title">导出学生题库</h3>
              <button class="iq-modal-close" @click="exportVisible = false">×</button>
            </div>
            <div class="iq-modal-body">
              <div class="form-field">
                <label class="form-label">文件格式</label>
                <div class="export-options">
                  <label class="export-option"><input type="radio" value="docx" v-model="exportFormat" /> Word (.docx)</label>
                  <label class="export-option"><input type="radio" value="xlsx" v-model="exportFormat" /> Excel (.xlsx)</label>
                </div>
              </div>
              <div class="form-field">
                <label class="form-label">答案内容</label>
                <div class="export-options">
                  <label class="export-option"><input type="radio" :value="true" v-model="exportWithAnswers" /> 带答案与解析</label>
                  <label class="export-option"><input type="radio" :value="false" v-model="exportWithAnswers" /> 不带答案</label>
                </div>
              </div>
              <div v-if="exportError" class="form-error">{{ exportError }}</div>
            </div>
            <div class="iq-modal-footer">
              <button type="button" class="iq-btn iq-btn-secondary" @click="exportVisible = false">取消</button>
              <button type="button" class="iq-btn iq-btn-primary" :disabled="exporting" @click="handleExport">
                {{ exporting ? '导出中...' : '确认导出' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <ImageRecognition
      :visible="ocrVisible"
      role="student"
      :subjects="[]"
      bank="student"
      @close="ocrVisible = false"
      @success="handleOcrSuccess"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { TYPE_OPTIONS, DIFFICULTY_OPTIONS, getTypeName, getDifficultyLabel } from '@/utils/constants';
import { getSubjects } from '@/api/subject';
import {
  getStudentQuestions,
  createStudentQuestion,
  updateStudentQuestion,
  deleteStudentQuestion,
  shareStudentQuestion,
  exportStudentQuestions,
  getStudentReviewQueue,
  reviewStudentQuestion,
} from '@/api/studentQuestion';
import { downloadBlob } from '@/utils/download';
import ImageRecognition from '@/components/ImageRecognition.vue';
import Pagination from '@/components/Pagination.vue';

defineProps({ user: { type: Object, default: null } });
const emit = defineEmits(['toast']);

const activeTab = ref('own');
const list = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const loading = ref(false);
const filters = reactive({ keyword: '', subject: '', status: '' });
const subjectOptions = ref([]);

const formVisible = ref(false);
const editingId = ref(null);
const saving = ref(false);
const formError = ref('');
const form = reactive({
  章节: 0,
  题型: 2,
  序号: 0,
  题目: '',
  选项: '',
  答案: '',
  解析: '',
  难度: '',
  知识点: '',
  科目: '',
  share: false,
});

const detailVisible = ref(false);
const detail = ref({});

const exportVisible = ref(false);
const exportFormat = ref('docx');
const exportWithAnswers = ref(true);
const exporting = ref(false);
const exportError = ref('');

const ocrVisible = ref(false);

const statusText = (status) => ({
  private: '私密',
  pending: '待审核',
  approved: '已公开',
  rejected: '未通过',
}[status] || status);

const tabTitle = computed(() => ({
  own: '我的题库',
  community: '同专业社区',
  review: '审核队列',
}[activeTab.value] || '学生题库'));

const tabDescription = computed(() => ({
  own: '管理自己收集和导入的题目，可共享到同专业社区',
  community: '浏览同专业同学分享并通过审核的题目',
  review: '审核同专业同学提交的共享题目（仅学生版主可见）',
}[activeTab.value] || ''));

const load = async () => {
  loading.value = true;
  try {
    let data;
    if (activeTab.value === 'review') {
      data = await getStudentReviewQueue({
        page: page.value,
        pageSize: pageSize.value,
        keyword: filters.keyword || undefined,
      });
    } else {
      const params = {
        scope: activeTab.value,
        page: page.value,
        pageSize: pageSize.value,
      };
      if (filters.keyword) params.keyword = filters.keyword;
      if (filters.subject) params.subject = filters.subject;
      if (activeTab.value === 'own' && filters.status) params.status = filters.status;
      data = await getStudentQuestions(params);
    }
    list.value = data.list;
    total.value = data.total;
  } catch (err) {
    emit('toast', { message: err.message || '加载失败', type: 'error' });
  } finally {
    loading.value = false;
  }
};

const resetFilters = () => {
  filters.keyword = '';
  filters.subject = '';
  filters.status = '';
  page.value = 1;
  load();
};

watch(activeTab, () => {
  page.value = 1;
  resetFilters();
});

const openCreate = () => {
  editingId.value = null;
  Object.assign(form, {
    章节: 0, 题型: 2, 序号: 0, 题目: '', 选项: '', 答案: '', 解析: '', 难度: '', 知识点: '', 科目: '', share: false,
  });
  formError.value = '';
  formVisible.value = true;
};

const openEdit = (item) => {
  editingId.value = item.id;
  Object.assign(form, {
    章节: item.章节 || 0,
    题型: Number(item.题型) || 2,
    序号: item.序号 || 0,
    题目: item.题目 || '',
    选项: item.选项 || '',
    答案: item.答案 || '',
    解析: item.解析 || '',
    难度: item.难度 || '',
    知识点: item.知识点 || '',
    科目: item.科目 || '',
    share: false,
  });
  formError.value = '';
  formVisible.value = true;
};

const saveForm = async () => {
  if (!form.题目.trim()) {
    formError.value = '题目内容不能为空';
    return;
  }
  saving.value = true;
  formError.value = '';
  try {
    const payload = { ...form, share: form.share };
    if (editingId.value) {
      await updateStudentQuestion(editingId.value, payload);
      emit('toast', { message: '题目已更新', type: 'success' });
    } else {
      await createStudentQuestion(payload);
      emit('toast', { message: form.share ? '题目已保存并提交共享审核' : '题目已保存', type: 'success' });
    }
    formVisible.value = false;
    load();
  } catch (err) {
    formError.value = err.message || '保存失败';
  } finally {
    saving.value = false;
  }
};

const handleDelete = async (item) => {
  if (!window.confirm(`确定删除题目「${item.题目?.slice(0, 20)}」吗？`)) return;
  try {
    await deleteStudentQuestion(item.id);
    emit('toast', { message: '题目已删除', type: 'success' });
    load();
  } catch (err) {
    emit('toast', { message: err.message || '删除失败', type: 'error' });
  }
};

const handleShare = async (item) => {
  if (!window.confirm('确定提交到同专业社区审核吗？')) return;
  try {
    await shareStudentQuestion(item.id);
    emit('toast', { message: '已提交共享审核', type: 'success' });
    load();
  } catch (err) {
    emit('toast', { message: err.message || '提交失败', type: 'error' });
  }
};

const handleReview = async (item, action) => {
  let reason = '';
  if (action === 'reject') {
    reason = window.prompt('请输入拒绝原因：', '');
    if (reason === null) return;
    if (!reason.trim()) {
      emit('toast', { message: '拒绝时必须填写原因', type: 'warning' });
      return;
    }
  }
  try {
    await reviewStudentQuestion(item.id, { action, reason: reason.trim() });
    emit('toast', { message: action === 'approve' ? '已通过并公开到社区' : '已拒绝该共享题目', type: 'success' });
    load();
  } catch (err) {
    emit('toast', { message: err.message || '审核失败', type: 'error' });
  }
};

const openDetail = (item) => {
  detail.value = item;
  detailVisible.value = true;
};

const openExport = () => {
  exportFormat.value = 'docx';
  exportWithAnswers.value = true;
  exportError.value = '';
  exportVisible.value = true;
};

const handleExport = async () => {
  exporting.value = true;
  exportError.value = '';
  try {
    const blob = await exportStudentQuestions({
      scope: activeTab.value,
      format: exportFormat.value,
      withAnswers: exportWithAnswers.value,
    });
    const suffix = exportFormat.value === 'xlsx' ? 'xlsx' : 'docx';
    const label = exportWithAnswers.value ? '含答案' : '不含答案';
    const title = activeTab.value === 'community' ? '同专业共享题目' : '我的题库题目';
    downloadBlob(blob, `${title}_${label}.${suffix}`);
    emit('toast', { message: '导出成功', type: 'success' });
    exportVisible.value = false;
  } catch (err) {
    exportError.value = err.message || '导出失败，请稍后重试';
  } finally {
    exporting.value = false;
  }
};

const handleOcrSuccess = (result) => {
  const { inserted = 0, invalid = 0 } = result || {};
  emit('toast', {
    message: `图片识别导入完成：成功 ${inserted} 条，无效 ${invalid} 条`,
    type: invalid > 0 ? 'warning' : 'success',
  });
  ocrVisible.value = false;
  load();
};

onMounted(async () => {
  try {
    const data = await getSubjects();
    subjectOptions.value = Array.isArray(data) ? data : [];
  } catch (e) {
    subjectOptions.value = [];
  }
  load();
});
</script>

<style scoped>
.student-bank {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 1200px;
}

.bank-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.bank-head h1 {
  margin: 0;
  font-size: 24px;
  color: var(--iq-neutral-900);
}

.bank-head p {
  margin: 4px 0 0;
  color: var(--iq-neutral-500);
  font-size: 13px;
}

.bank-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.bank-tabs {
  display: flex;
  gap: 8px;
}

.bank-tabs button {
  border: 1px solid var(--iq-border);
  background: #fff;
  color: var(--iq-neutral-600);
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
}

.bank-tabs button.active {
  background: var(--iq-primary-50);
  border-color: var(--iq-primary-500);
  color: var(--iq-primary-700);
  font-weight: 600;
}

.bank-filters {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 12px 16px;
  flex-wrap: wrap;
}

.bank-filters .iq-input {
  flex: 1;
  min-width: 180px;
}

.bank-table-wrap {
  overflow-x: auto;
}

.q-cell {
  max-width: 360px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.type-chip {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--iq-primary-50);
  color: var(--iq-primary-700);
  font-size: 12px;
}

.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 12px;
}

.status-private {
  background: var(--iq-neutral-100);
  color: var(--iq-neutral-600);
}

.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.status-approved {
  background: #dcfce7;
  color: #15803d;
}

.status-rejected {
  background: #fee2e2;
  color: #b91c1c;
}

.danger {
  color: #dc2626;
}

.bank-loading,
.bank-empty {
  padding: 48px;
  text-align: center;
  color: var(--iq-neutral-500);
}

.student-form-modal {
  width: 640px;
  max-width: calc(100vw - 32px);
}

.student-detail-modal {
  width: 560px;
  max-width: calc(100vw - 32px);
}

.export-modal {
  width: 460px;
  max-width: calc(100vw - 32px);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--iq-neutral-700);
}

.required {
  color: #dc2626;
}

.form-textarea {
  width: 100%;
  resize: vertical;
}

.share-check {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--iq-neutral-700);
  margin-top: 4px;
}

.form-error {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  margin-top: 8px;
}

.detail-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.detail-meta span {
  padding: 3px 10px;
  border-radius: 999px;
  background: #eef2ff;
  color: #4338ca;
  font-size: 12px;
}

.detail-block {
  margin-bottom: 12px;
}

.detail-block b {
  display: block;
  font-size: 12px;
  color: var(--iq-neutral-500);
  margin-bottom: 4px;
}

.detail-block p {
  margin: 0;
  color: var(--iq-neutral-800);
  line-height: 1.7;
  white-space: pre-wrap;
}

.export-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.export-option {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px 14px;
  background: #f8fafc;
  cursor: pointer;
  font-size: 13px;
}

.export-option input {
  accent-color: #4f46e5;
}

@media (max-width: 640px) {
  .bank-head {
    flex-direction: column;
  }
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
