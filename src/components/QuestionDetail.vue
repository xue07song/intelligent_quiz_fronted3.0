<template>
  <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <h2 class="modal-title">📄 题目详情</h2>
      <div v-if="data.id" class="detail-grid">
        <div><strong>ID</strong>：{{ data.id }}</div>
        <div><strong>章节</strong>：{{ data.章节 }}</div>
        <div><strong>题型</strong>：{{ getTypeName(data.题型) }}</div>
        <div><strong>序号</strong>：{{ data.序号 }}</div>
        <div class="full-width"><strong>题目内容</strong>：{{ data.题目 }}</div>
        <div class="full-width"><strong>选项</strong>：{{ data.选项 }}</div>
        <div><strong>答案</strong>：{{ data.答案 }}</div>
        <div><strong>解析</strong>：{{ data.解析 }}</div>
        <div><strong>难度</strong>：{{ getDifficultyLabel(data.难度) }}</div>
        <div><strong>知识点</strong>：{{ data.知识点 }}</div>
        <div><strong>使用频率</strong>：{{ data.使用频率 }}</div>
        <div><strong>出题人</strong>：{{ data.出题人 }}</div>
      </div>
      <div class="form-actions">
        <button class="btn-cancel" @click="$emit('close')">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { getTypeName, getDifficultyLabel } from '@/utils/constants';

defineProps({
  visible: { type: Boolean, default: false },
  data: { type: Object, default: () => ({}) },
});

defineEmits(['close']);
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background: white;
  padding: 30px 35px;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
}
.modal-title {
  margin: 0 0 20px;
  color: #2c3e50;
}
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}
.detail-grid strong {
  color: #303133;
}
.full-width {
  grid-column: 1 / -1;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
}
.btn-cancel {
  background: #f5f5f5;
  color: #333;
  border: 1px solid #d9d9d9;
  padding: 8px 20px;
  border-radius: 4px;
  cursor: pointer;
}
.btn-cancel:hover { background: #e8e8e8; }
</style>