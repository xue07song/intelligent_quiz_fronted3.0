<template>
  <div class="pagination">
    <span class="info">共 {{ total }} 条</span>
    <button class="page-btn" :disabled="page <= 1" @click="changePage(page - 1)">‹ 上一页</button>
    <button
      v-for="p in pageNumbers"
      :key="p"
      class="page-btn"
      :class="{ active: p === page }"
      @click="changePage(p)"
    >{{ p }}</button>
    <button class="page-btn" :disabled="page >= totalPages" @click="changePage(page + 1)">下一页 ›</button>
    <select :value="pageSize" class="page-size" @change="changePageSize">
      <option v-for="s in [10, 20, 50, 100]" :key="s" :value="s">{{ s }}条/页</option>
    </select>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  total: { type: Number, default: 0 },
  page: { type: Number, default: 1 },
  pageSize: { type: Number, default: 20 },
});

const emit = defineEmits(['update:page', 'update:pageSize', 'change']);

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)));

const pageNumbers = computed(() => {
  const pages = [];
  const maxShow = 7;
  let start = Math.max(1, props.page - Math.floor(maxShow / 2));
  let end = Math.min(totalPages.value, start + maxShow - 1);
  start = Math.max(1, end - maxShow + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
});

const changePage = (p) => {
  if (p < 1 || p > totalPages.value || p === props.page) return;
  emit('update:page', p);
  emit('change', { page: p, pageSize: props.pageSize });
};

const changePageSize = (e) => {
  const newSize = Number(e.target.value);
  emit('update:pageSize', newSize);
  emit('change', { page: 1, pageSize: newSize });
};
</script>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 16px 0;
}
.info {
  color: #606266;
  font-size: 14px;
  margin-right: 12px;
}
.page-btn {
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid #dcdfe6;
  background: #fff;
  color: #606266;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}
.page-btn:hover:not(:disabled) {
  border-color: #409eff;
  color: #409eff;
}
.page-btn.active {
  background: #409eff;
  border-color: #409eff;
  color: #fff;
}
.page-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.page-size {
  height: 32px;
  padding: 0 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  margin-left: 12px;
}
</style>