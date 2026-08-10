<template>
  <div class="iq-card">
    <div v-if="loading" class="iq-table-loading">
      <span class="iq-loading-spinner"></span>
      <span class="iq-text-sm iq-text-muted">加载中...</span>
    </div>
    <div v-else class="iq-table-wrap">
      <table class="iq-table q-table">
        <thead>
          <tr>
            <th v-if="canEdit" class="col-check">
              <input
                type="checkbox"
                class="iq-checkbox"
                :checked="isAllSelected"
                :indeterminate.prop="isIndeterminate"
                @change="toggleAll"
              />
            </th>
            <th>ID</th>
            <th>章节</th>
            <th>题型</th>
            <th>序号</th>
            <th class="col-title">题目内容</th>
            <th class="col-opt">选项</th>
            <th>答案</th>
            <th class="col-ana">解析</th>
            <th>难度</th>
            <th class="col-kp">知识点</th>
            <th>使用频率</th>
            <th>出题人</th>
            <th class="col-act">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in list" :key="item.id">
            <td v-if="canEdit" class="col-check">
              <input
                type="checkbox"
                class="iq-checkbox"
                :checked="isSelected(item.id)"
                @change="toggleOne(item.id)"
              />
            </td>
            <td><span class="iq-id-chip">{{ item.id }}</span></td>
            <td>{{ item.章节 }}</td>
            <td>
              <span class="iq-type-tag" :class="`type-${item.题型}`">{{ getTypeName(item.题型) }}</span>
            </td>
            <td>{{ item.序号 }}</td>
            <td class="col-title">
              <span class="iq-truncate" :title="item.题目">{{ item.题目 }}</span>
            </td>
            <td class="col-opt">
              <span class="iq-truncate" :title="item.选项">{{ item.选项 }}</span>
            </td>
            <td>
              <span class="iq-answer-chip">{{ item.答案 }}</span>
            </td>
            <td class="col-ana">
              <span class="iq-truncate" :title="item.解析">{{ item.解析 || '--' }}</span>
            </td>
            <td>
              <span class="iq-diff-tag" :class="`diff-${item.难度}`">{{ getDifficultyLabel(item.难度) }}</span>
            </td>
            <td class="col-kp">
              <span class="iq-truncate" :title="item.知识点">{{ item.知识点 || '--' }}</span>
            </td>
            <td>{{ item.使用频率 ?? 0 }}</td>
            <td>{{ item.出题人 || '--' }}</td>
            <td class="col-act">
              <div class="iq-table-action">
                <button class="iq-btn iq-btn-ghost iq-btn-sm" @click="$emit('view', item)">查看</button>
                <button v-if="canEdit" class="iq-btn iq-btn-ghost iq-btn-sm act-edit" @click="$emit('edit', item)">编辑</button>
                <button v-if="canEdit" class="iq-btn iq-btn-ghost iq-btn-sm act-del" @click="$emit('delete', item)">删除</button>
              </div>
            </td>
          </tr>
          <tr v-if="list.length === 0">
            <td :colspan="canEdit ? 14 : 13" class="iq-empty-row">
              <div class="iq-empty-box">
                <div class="iq-empty-icon">📭</div>
                <div class="iq-empty-text iq-text-sm iq-text-muted">暂无数据</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { getTypeName, getDifficultyLabel } from '@/utils/constants';

const props = defineProps({
  list: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  role: { type: String, default: '' },
  modelValue: { type: Array, default: () => [] },
});

const emit = defineEmits(['view', 'edit', 'delete', 'update:modelValue', 'selection-change']);

const canEdit = computed(() => props.role === 'admin' || props.role === 'teacher');

const isAllSelected = computed(() => {
  if (props.list.length === 0) return false;
  return props.list.every((item) => props.modelValue.includes(item.id));
});

const isIndeterminate = computed(() => {
  const c = props.list.filter((item) => props.modelValue.includes(item.id)).length;
  return c > 0 && c < props.list.length;
});

const isSelected = (id) => props.modelValue.includes(id);

const emitUpdate = (newList) => {
  emit('update:modelValue', newList);
  emit('selection-change', newList);
};

const toggleAll = (e) => {
  if (e.target.checked) {
    emitUpdate(props.list.map((item) => item.id));
  } else {
    emitUpdate([]);
  }
};

const toggleOne = (id) => {
  const idx = props.modelValue.indexOf(id);
  const next = idx === -1
    ? [...props.modelValue, id]
    : props.modelValue.filter((x) => x !== id);
  emitUpdate(next);
};
</script>

<style scoped>
.iq-table-wrap {
  overflow-x: auto;
}
.q-table {
  min-width: 1300px;
}
.iq-table-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 80px 0;
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

.col-check {
  width: 44px;
  text-align: center !important;
}
.iq-checkbox {
  width: 16px;
  height: 16px;
  accent-color: var(--iq-primary);
  cursor: pointer;
}
.col-title { min-width: 260px; max-width: 320px; }
.col-opt   { min-width: 180px; max-width: 220px; }
.col-ana   { min-width: 150px; max-width: 180px; }
.col-kp    { min-width: 120px; max-width: 160px; }
.col-act   { white-space: nowrap; width: 150px; }

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
.iq-answer-chip {
  display: inline-block;
  min-width: 28px;
  text-align: center;
  padding: 2px 8px;
  background: var(--iq-primary-50);
  color: var(--iq-primary-700);
  border-radius: 4px;
  font-weight: 600;
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
.type-1 { background: #ede9fe; color: #6d28d9; }  /* 判断 紫色 */
.type-2 { background: #dbeafe; color: #1d4ed8; }  /* 单选 蓝色 */
.type-3 { background: #fce7f3; color: #be185d; }  /* 多选 粉色 */
.type-4 { background: #d1fae5; color: #047857; }  /* 填空 绿色 */
.type-5 { background: #fef3c7; color: #b45309; }  /* 简答 琥珀 */
.type-6 { background: #ffedd5; color: #c2410c; }  /* 程序论述 橙色 */

.iq-diff-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}
.diff-1, .diff-\31星 { background: #dcfce7; color: #166534; }  /* 1 */
.diff-2, .diff-\32星 { background: #d9f99d; color: #3f6212; }  /* 2 */
.diff-3, .diff-\33星 { background: #fef9c3; color: #854d0e; }  /* 3 */
.diff-4, .diff-\34星 { background: #fed7aa; color: #9a3412; }  /* 4 */
.diff-5, .diff-\35星 { background: #fee2e2; color: #991b1b; }  /* 5 */

.act-edit { color: var(--iq-state-warning) !important; }
.act-edit:hover:not(:disabled) { background: var(--iq-state-warning-bg) !important; color: #b45309 !important; }
.act-del { color: var(--iq-state-error) !important; }
.act-del:hover:not(:disabled) { background: var(--iq-state-error-bg) !important; color: #b91c1c !important; }

.iq-empty-row {
  padding: 0 !important;
}
.iq-empty-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 60px 0;
}
.iq-empty-icon {
  font-size: 40px;
  opacity: 0.5;
}
</style>
