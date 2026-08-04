<template>
  <div class="user-mgmt">
    <!-- 搜索栏 -->
    <div class="toolbar">
      <input
        v-model="keyword"
        class="input"
        placeholder="搜索用户名/昵称"
        @keyup.enter="loadUsers"
      />
      <select v-model="roleFilter" class="input" @change="loadUsers">
        <option value="">全部角色</option>
        <option value="admin">管理员</option>
        <option value="teacher">教师</option>
        <option value="student">学生</option>
      </select>
      <select v-model="statusFilter" class="input" @change="loadUsers">
        <option value="">全部状态</option>
        <option value="1">启用</option>
        <option value="0">禁用</option>
      </select>
      <button class="btn-primary" @click="loadUsers">查询</button>
      <button class="btn-cancel" @click="resetFilter">重置</button>
      <button class="btn-primary btn-add" @click="openCreate">+ 新增用户</button>
    </div>

    <!-- 用户表格 -->
    <div class="table-container">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else class="table-wrapper">
        <table class="user-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>用户名</th>
              <th>昵称</th>
              <th>角色</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in list" :key="user.id">
              <td>{{ user.id }}</td>
              <td>{{ user.username }}</td>
              <td>{{ user.nickname || '-' }}</td>
              <td>
                <span class="role-tag" :class="user.role">{{ roleMap[user.role] }}</span>
              </td>
              <td>
                <span class="status-tag" :class="user.status === 1 ? 'active' : 'disabled'">
                  {{ user.status === 1 ? '启用' : '禁用' }}
                </span>
              </td>
              <td>{{ user.created_at }}</td>
              <td class="col-actions">
                <button class="btn-edit" @click="openEdit(user)">编辑</button>
                <button class="btn-view" @click="handleResetPwd(user)">重置密码</button>
                <button
                  v-if="user.status === 1"
                  class="btn-warn"
                  @click="handleToggleStatus(user, 0)"
                >禁用</button>
                <button
                  v-else
                  class="btn-success"
                  @click="handleToggleStatus(user, 1)"
                >启用</button>
                <button
                  class="btn-delete"
                  :disabled="user.username === 'admin'"
                  @click="handleDelete(user)"
                >删除</button>
              </td>
            </tr>
            <tr v-if="list.length === 0">
              <td colspan="7" class="empty">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination" v-if="total > 0">
      <button :disabled="page === 1" @click="changePage(page - 1)">上一页</button>
      <span>第 {{ page }} / {{ totalPages }} 页（共 {{ total }} 条）</span>
      <button :disabled="page === totalPages" @click="changePage(page + 1)">下一页</button>
    </div>

    <!-- 新增/编辑弹窗 -->
    <div v-if="dialogVisible" class="modal-overlay" @click.self="dialogVisible = false">
      <div class="modal-card">
        <h2 class="modal-title">{{ isEdit ? '编辑用户' : '新增用户' }}</h2>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>用户名 *</label>
            <input v-model="form.username" class="form-input" :disabled="isEdit" placeholder="登录用户名" />
          </div>
          <div class="form-group" v-if="!isEdit">
            <label>密码 *</label>
            <input v-model="form.password" type="password" class="form-input" placeholder="至少6位" />
          </div>
          <div class="form-group">
            <label>昵称</label>
            <input v-model="form.nickname" class="form-input" placeholder="显示昵称" />
          </div>
          <div class="form-group">
            <label>角色 *</label>
            <select v-model="form.role" class="form-input">
              <option value="admin">管理员</option>
              <option value="teacher">教师</option>
              <option value="student">学生</option>
            </select>
          </div>
          <div class="form-group" v-if="!isEdit">
            <label>状态</label>
            <select v-model="form.status" class="form-input">
              <option :value="1">启用</option>
              <option :value="0">禁用</option>
            </select>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="dialogVisible = false">取消</button>
            <button type="submit" class="btn-primary">确定</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { getUsers, createUser, updateUser, resetUserPassword, toggleUserStatus, deleteUser } from '@/api/user';

const emit = defineEmits(['toast']);

const list = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const loading = ref(false);

const keyword = ref('');
const roleFilter = ref('');
const statusFilter = ref('');

const dialogVisible = ref(false);
const isEdit = ref(false);
const form = reactive({
  id: null,
  username: '',
  password: '',
  nickname: '',
  role: 'student',
  status: 1,
});

const roleMap = { admin: '管理员', teacher: '教师', student: '学生' };

const totalPages = computed(() => Math.ceil(total.value / pageSize.value));

const showToast = (msg, type = 'success') => {
  emit('toast', { message: msg, type });
};

const loadUsers = async () => {
  loading.value = true;
  try {
    const params = { page: page.value, pageSize: pageSize.value };
    if (keyword.value) params.keyword = keyword.value;
    if (roleFilter.value) params.role = roleFilter.value;
    if (statusFilter.value !== '') params.status = statusFilter.value;

    const data = await getUsers(params);
    list.value = data.list;
    total.value = data.total;
  } catch (err) {
    showToast(err.message || '加载用户列表失败', 'error');
  } finally {
    loading.value = false;
  }
};

const resetFilter = () => {
  keyword.value = '';
  roleFilter.value = '';
  statusFilter.value = '';
  page.value = 1;
  loadUsers();
};

const changePage = (newPage) => {
  page.value = newPage;
  loadUsers();
};

const openCreate = () => {
  isEdit.value = false;
  Object.assign(form, { id: null, username: '', password: '', nickname: '', role: 'student', status: 1 });
  dialogVisible.value = true;
};

const openEdit = (user) => {
  isEdit.value = true;
  Object.assign(form, { id: user.id, username: user.username, password: '', nickname: user.nickname || '', role: user.role, status: user.status });
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  try {
    if (isEdit.value) {
      await updateUser(form.id, { nickname: form.nickname, role: form.role });
      showToast('用户更新成功');
    } else {
      if (!form.username || !form.password) {
        showToast('用户名和密码不能为空', 'error');
        return;
      }
      if (form.password.length < 6) {
        showToast('密码至少6位', 'error');
        return;
      }
      await createUser({
        username: form.username,
        password: form.password,
        role: form.role,
        nickname: form.nickname,
        status: form.status,
      });
      showToast('用户创建成功');
    }
    dialogVisible.value = false;
    loadUsers();
  } catch (err) {
    showToast(err.message || '操作失败', 'error');
  }
};

const handleResetPwd = async (user) => {
  const newPwd = window.prompt(`重置用户「${user.username}」的密码（至少6位）：`);
  if (!newPwd) return;
  if (newPwd.length < 6) {
    showToast('密码至少6位', 'error');
    return;
  }
  try {
    await resetUserPassword(user.id, newPwd);
    showToast('密码重置成功');
  } catch (err) {
    showToast(err.message || '重置失败', 'error');
  }
};

const handleToggleStatus = async (user, status) => {
  try {
    await toggleUserStatus(user.id, status);
    showToast(status === 1 ? '已启用' : '已禁用');
    loadUsers();
  } catch (err) {
    showToast(err.message || '操作失败', 'error');
  }
};

const handleDelete = async (user) => {
  if (user.username === 'admin') {
    showToast('不能删除超级管理员', 'error');
    return;
  }
  if (!window.confirm(`确定删除用户「${user.username}」吗？`)) return;
  try {
    await deleteUser(user.id);
    showToast('删除成功');
    loadUsers();
  } catch (err) {
    showToast(err.message || '删除失败', 'error');
  }
};

onMounted(() => {
  loadUsers();
});
</script>

<style scoped>
.user-mgmt {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.toolbar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}
.input {
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 14px;
}
.btn-add {
  margin-left: auto;
}
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
}
.table-wrapper {
  padding: 10px;
}
.user-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  min-width: 800px;
}
.user-table th {
  padding: 12px 8px;
  text-align: left;
  white-space: nowrap;
  background: #f5f7fa;
  border-bottom: 2px solid #e4e7ed;
  font-weight: 600;
  color: #303133;
}
.user-table td {
  padding: 10px 8px;
  border-bottom: 1px solid #ebeef5;
  color: #606266;
}
.col-actions {
  white-space: nowrap;
}
.empty {
  text-align: center;
  padding: 40px 0;
  color: #909399;
}
.role-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}
.role-tag.admin { background: #f56c6c; color: #fff; }
.role-tag.teacher { background: #e6a23c; color: #fff; }
.role-tag.student { background: #409eff; color: #fff; }
.status-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}
.status-tag.active { background: #f0f9eb; color: #67c23a; }
.status-tag.disabled { background: #fef0f0; color: #f56c6c; }
.pagination {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
  font-size: 14px;
  color: #606266;
}
.pagination button {
  padding: 6px 14px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
}
.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-primary {
  padding: 8px 16px;
  background: #667eea;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}
.btn-primary:disabled {
  opacity: 0.5;
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
.btn-edit {
  background: #fff7e6;
  color: #fa8c16;
  border: 1px solid #ffd591;
  padding: 4px 10px;
  border-radius: 4px;
  margin-right: 4px;
  cursor: pointer;
  font-size: 12px;
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
}
.btn-warn {
  background: #fff7e6;
  color: #fa8c16;
  border: 1px solid #ffd591;
  padding: 4px 10px;
  border-radius: 4px;
  margin-right: 4px;
  cursor: pointer;
  font-size: 12px;
}
.btn-success {
  background: #f0f9eb;
  color: #67c23a;
  border: 1px solid #c2e7b0;
  padding: 4px 10px;
  border-radius: 4px;
  margin-right: 4px;
  cursor: pointer;
  font-size: 12px;
}
.btn-delete {
  background: #fff1f0;
  color: #ff4d4f;
  border: 1px solid #ffa39e;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}
.btn-delete:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-card {
  background: #fff;
  border-radius: 8px;
  padding: 30px;
  width: 420px;
  max-height: 90vh;
  overflow-y: auto;
}
.modal-title {
  margin: 0 0 20px;
  font-size: 18px;
  color: #303133;
}
.form-group {
  margin-bottom: 16px;
}
.form-group label {
  display: block;
  font-size: 14px;
  color: #606266;
  margin-bottom: 6px;
}
.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}
.form-input:disabled {
  background: #f5f7fa;
  color: #c0c4cc;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
</style>
