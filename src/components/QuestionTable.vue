<template>
<!-- 把数据库里面的数据以表格的形式展现出来 -->
  <div class="table-container">
    <div v-if="loading" class="loading">⏳ 加载中...</div>
    <div v-else class="table-wrapper">
      <table class="question-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>章节</th>
            <th>题型</th>
            <th>序号</th>
            <th class="col-title">题目内容</th>
            <th class="col-options">选项</th>
            <th>答案</th>
            <th class="col-analysis">解析</th>
            <th>难度</th>
            <th class="col-kp">知识点</th>
            <th>使用频率</th>
            <th>出题人</th>
            <th class="col-actions">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in list" :key="item.id">
            <td>{{ item.id }}</td>
            <td>{{ item.章节 }}</td>
            <td>{{ getTypeName(item.题型) }}</td>
            <td>{{ item.序号 }}</td>
            <td class="col-title" :title="item.题目">{{ item.题目 }}</td>
            <td class="col-options" :title="item.选项">{{ item.选项 }}</td>
            <td>{{ item.答案 }}</td>
            <td class="col-analysis" :title="item.解析">{{ item.解析 }}</td>
            <td>{{ getDifficultyLabel(item.难度) }}</td>
            <td class="col-kp" :title="item.知识点">{{ item.知识点 }}</td>
            <td>{{ item.使用频率 }}</td>
            <td>{{ item.出题人 }}</td>
            <td class="col-actions">
              <button class="btn-view" @click="$emit('view', item)">查看</button>
              <button class="btn-edit" @click="$emit('edit', item)">编辑</button>
              <button class="btn-delete" @click="$emit('delete', item)">删除</button>
            </td>
          </tr>
          <tr v-if="list.length === 0">
            <td colspan="13" class="empty">📭 暂无数据</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { getTypeName, getDifficultyLabel } from '@/utils/constants';

defineProps({
  list: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
});

defineEmits(['view', 'edit', 'delete']);
</script>

<style scoped>
.table-container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}
.loading {
  text-align: center;
  padding: 60px 0;
  color: #909399;
  font-size: 16px;
}
.table-wrapper {
  padding: 10px;
}
.question-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  min-width: 1200px;
}
.question-table th {
  padding: 12px 8px;
  text-align: left;
  white-space: nowrap;
  background: #f5f7fa;
  border-bottom: 2px solid #e4e7ed;
  font-weight: 600;
  color: #303133;
}
.question-table td {
  padding: 10px 8px;
  border-bottom: 1px solid #ebeef5;
  color: #606266;
}
.col-title {
  max-width: 250px;
  word-break: break-word;
}
.col-options {
  max-width: 180px;
  word-break: break-word;
}
.col-analysis {
  max-width: 150px;
  word-break: break-word;
}
.col-kp {
  max-width: 120px;
  word-break: break-word;
}
.col-actions {
  text-align: center;
  white-space: nowrap;
}
.empty {
  text-align: center;
  padding: 40px 0;
  color: #909399;
}
.btn-view {
  background: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
  padding: 4px 10px;
  border-radius: 4px;
  margin-right: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s;
}
.btn-view:hover { background: #bae7ff; }
.btn-edit {
  background: #fff7e6;
  color: #fa8c16;
  border: 1px solid #ffd591;
  padding: 4px 10px;
  border-radius: 4px;
  margin-right: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s;
}
.btn-edit:hover { background: #ffe7ba; }
.btn-delete {
  background: #fff1f0;
  color: #ff4d4f;
  border: 1px solid #ffa39e;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s;
}
.btn-delete:hover { background: #ffccc7; }
</style>