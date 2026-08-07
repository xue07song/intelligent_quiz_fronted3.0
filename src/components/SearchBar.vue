<template>
  <div class="search-bar">
    <div class="search-row">
      <input
        v-model="filters.id"
        class="input"
        placeholder="🔖 题目ID"
        style="width: 120px;"
        @keyup.enter="$emit('search', filters)"
      />
      <div class="keyword-wrapper">
        <input
          v-model="filters.关键词"
          class="input"
          placeholder="🔍 搜索题目内容、选项、知识点..."
          @keyup.enter="$emit('search', filters)"
        />
        <div class="search-hint">
          <div class="hint-title">💡 关键词可辅助搜索单条题目的字段</div>
          <ul class="hint-list">
            <li><strong>题目内容</strong> · 按题干文字片段匹配</li>
            <li><strong>选项</strong> · 按 A/B/C/D 选项文字匹配</li>
            <li><strong>知识点</strong> · 按知识点关键词匹配</li>
          </ul>
          <div class="hint-tip">提示：可结合左侧 ID、章节、题型、难度、出题人等条件精准定位单条题目</div>
        </div>
      </div>
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
        <button class="btn-ai" @click="$emit('ai-generate')">🤖 AI 出题</button>
        <button class="btn-primary btn-add" @click="$emit('add')">+ 新增题目</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue';
import { TYPE_OPTIONS, DIFFICULTY_OPTIONS } from '@/utils/constants';

const props = defineProps({
  initialFilters: { type: Object, default: () => ({}) },
  role: { type: String, default: '' },
  selectedCount: { type: Number, default: 0 },
});

const emit = defineEmits(['search', 'add', 'reset', 'batch-delete', 'batch-import', 'ai-generate']);

const canEdit = computed(() => props.role === 'admin' || props.role === 'teacher');

const filters = reactive({
  id: props.initialFilters.id || '',
  关键词: props.initialFilters.关键词 || '',
  题型: props.initialFilters.题型 || '',
  难度: props.initialFilters.难度 || '',
  章节: props.initialFilters.章节 || '',
  出题人: props.initialFilters.出题人 || '',
});

const typeOptions = TYPE_OPTIONS;
const difficultyOptions = DIFFICULTY_OPTIONS;

const handleReset = () => {
  filters.id = '';
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
.keyword-wrapper {
  position: relative;
}
.search-hint {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 20;
  min-width: 280px;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  padding: 12px 14px;
  font-size: 12px;
  color: #606266;
  line-height: 1.6;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-4px);
  transition: opacity 0.18s ease, transform 0.18s ease, visibility 0.18s ease;
  pointer-events: none;
}
.keyword-wrapper:hover .search-hint {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}
.hint-title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 6px;
}
.hint-list {
  margin: 0 0 8px;
  padding-left: 18px;
}
.hint-list li {
  margin-bottom: 2px;
}
.hint-list strong {
  color: #1890ff;
}
.hint-tip {
  padding-top: 6px;
  border-top: 1px dashed #ebeef5;
  color: #909399;
  font-size: 11px;
}
.batch-actions {
  margin-left: auto;
  display: flex;
  gap: 10px;
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
.btn-primary:hover:not(:disabled) {
  background: #5568d3;
}
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
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
.btn-danger:hover:not(:disabled) { background: #e64547; }
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
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
.btn-import:hover { background: #49b018; }
.btn-ai {
  padding: 8px 16px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: opacity 0.2s;
}
.btn-ai:hover { opacity: 0.9; }
.btn-add {
  margin-left: 0;
}
.input {
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 14px;
}
</style>
