<template>
  <div class="search-bar">
    <div class="search-row">
      <input
        v-model="filters.关键词"
        class="input"
        placeholder="🔍 搜索题目内容、选项、知识点..."
        @keyup.enter="$emit('search', filters)"
      />
      <select v-model="filters.题型" class="input" @change="$emit('search', filters)">
        <option value="">全部题型</option>
        <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
      <select v-model="filters.难度" class="input" @change="$emit('search', filters)">
        <option value="">全部难度</option>
        <option v-for="opt in difficultyOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
      <input
        v-model="filters.章节"
        type="number"
        class="input"
        placeholder="章节号"
        style="width: 100px;"
        @keyup.enter="$emit('search', filters)"
      />
      <input
        v-model="filters.出题人"
        class="input"
        placeholder="出题人"
        style="width: 120px;"
        @keyup.enter="$emit('search', filters)"
      />
      <button class="btn-primary" @click="$emit('search', filters)">🔍 查询</button>
      <button class="btn-cancel" @click="handleReset">重置</button>

      <div class="batch-actions" v-if="canEdit">
        <button
          class="btn-danger"
          :disabled="selectedCount === 0"
          @click="$emit('batch-delete')"
        >
          🗑️ 批量删除{{ selectedCount ? `(${selectedCount})` : '' }}
        </button>
        <button class="btn-import" @click="$emit('batch-import')">📥 批量导入</button>
        <button class="btn-primary btn-add" @click="$emit('add')">+ 新增题目</button>
      </div>
      <button v-if="!canEdit" class="btn-primary btn-add" @click="$emit('add')" style="display:none;">+ 新增题目</button>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue';
import { TYPE_OPTIONS, DIFFICULTY_OPTIONS } from '@/utils/constants';

const props = defineProps({
  initialFilters: {
    type: Object,
    default: () => ({}),
  },
  role: {
    type: String,
    default: '',
  },
  selectedCount: {
    type: Number,
    default: 0,
  },
});

const canEdit = computed(() => props.role === 'admin' || props.role === 'teacher');

const emit = defineEmits(['search', 'add', 'reset', 'batch-delete', 'batch-import']);

const filters = reactive({
  关键词: props.initialFilters.关键词 || '',
  题型: props.initialFilters.题型 || '',
  难度: props.initialFilters.难度 || '',
  章节: props.initialFilters.章节 || '',
  出题人: props.initialFilters.出题人 || '',
});

const typeOptions = TYPE_OPTIONS;
const difficultyOptions = DIFFICULTY_OPTIONS;

const handleReset = () => {
  filters.关键词 = '';
  filters.题型 = '';
  filters.难度 = '';
  filters.章节 = '';
  filters.出题人 = '';
  emit('reset');
};
</script>

<style scoped>
.search-bar {
  margin-bottom: 20px;
}
.search-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}
.batch-actions {
  margin-left: auto;
  display: flex;
  gap: 10px;
}
.btn-add {
  margin-left: 0;
}
.btn-primary {
  padding: 8px 16px;
  background: #667eea;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}
.btn-primary:hover {
  background: #5568d3;
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-cancel {
  padding: 8px 16px;
  background: #fff;
  color: #606266;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}
.btn-danger {
  padding: 8px 16px;
  background: #ff4d4f;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}
.btn-danger:hover:not(:disabled) {
  background: #e64547;
}
.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-import {
  padding: 8px 16px;
  background: #52c41a;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}
.btn-import:hover {
  background: #49b018;
}
.input {
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 14px;
}
</style>
