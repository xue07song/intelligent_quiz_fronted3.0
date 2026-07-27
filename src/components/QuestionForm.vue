<template>
  <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <h2 class="modal-title">{{ isEdit ? '✏️ 编辑题目' : '📝 新增题目' }}</h2>
      <form @submit.prevent="handleSubmit">
        <div class="form-row">
          <div class="form-group">
            <label>ID <span class="required">*</span></label>
            <input v-model="form.id" class="input" placeholder="如 Q001" :disabled="isEdit" />
          </div>
          <div class="form-group">
            <label>章节</label>
            <input v-model.number="form.章节" type="number" class="input" placeholder="章节编号" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>题型 <span class="required">*</span></label>
            <select v-model="form.题型" class="input">
              <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>序号</label>
            <input v-model.number="form.序号" type="number" class="input" placeholder="章节内排序" />
          </div>
        </div>
        <div class="form-group">
          <label>题目内容 <span class="required">*</span></label>
          <textarea v-model="form.题目" rows="3" class="input" placeholder="请输入题目内容"></textarea>
        </div>
        <div class="form-group">
          <label>选项</label>
          <textarea v-model="form.选项" rows="3" class="input" placeholder="例如：A.北京 B.上海 C.广州 D.深圳"></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>答案</label>
            <input v-model="form.答案" class="input" placeholder="如 A" />
          </div>
          <div class="form-group">
            <label>解析</label>
            <input v-model="form.解析" class="input" placeholder="答案解析" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>难度</label>
            <select v-model="form.难度" class="input">
              <option value="">请选择难度</option>
              <option v-for="opt in difficultyOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>知识点</label>
            <input v-model="form.知识点" class="input" placeholder="关联知识点" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>使用频率</label>
            <input v-model="form.使用频率" class="input" placeholder="如 0" />
          </div>
          <div class="form-group">
            <label>出题人</label>
            <input v-model="form.出题人" class="input" placeholder="出题人姓名" />
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn-cancel" @click="$emit('close')">取消</button>
          <button type="submit" class="btn-primary" :disabled="submitting.value">
            {{ submitting.value ? '提交中...' : (isEdit ? '确认修改' : '确认新增') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue';
import { TYPE_OPTIONS, DIFFICULTY_OPTIONS } from '@/utils/constants';

const props = defineProps({
  visible: { type: Boolean, default: false },
  data: { type: Object, default: () => ({}) },
  isEdit: { type: Boolean, default: false },
});

const emit = defineEmits(['close', 'submit']);

const typeOptions = TYPE_OPTIONS;
const difficultyOptions = DIFFICULTY_OPTIONS;

const defaultForm = () => ({
  id: '',
  章节: '',
  题型: 2,
  序号: 0,
  题目: '',
  选项: '',
  答案: '',
  解析: '',
  难度: '',
  知识点: '',
  使用频率: '',
  出题人: '',
});

const form = reactive(defaultForm());
const submitting = reactive({ value: false });

watch(
  () => [props.visible, props.data, props.isEdit],
  () => {
    if (props.visible) {
      Object.assign(form, defaultForm(), props.data);
      if (!form.题型) form.题型 = 2;
    }
  },
  { immediate: true }
);

const handleSubmit = async () => {
  if (!form.id || !form.id.trim()) {
    alert('ID不能为空');
    return;
  }
  if (!form.题目 || !form.题目.trim()) {
    alert('题目内容不能为空');
    return;
  }
  submitting.value = true;
  try {
    const payload = { ...form };
    if (payload.章节 === '' || payload.章节 === null) payload.章节 = 0;
    if (payload.序号 === '' || payload.序号 === null) payload.序号 = 0;
    await emit('submit', payload);
  } finally {
    submitting.value = false;
  }
};
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
.required {
  color: #ff4d4f;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 12px;
}
.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
}
.form-group label {
  font-weight: 500;
  margin-bottom: 4px;
  font-size: 13px;
  color: #606266;
}
.input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
  background: white;
  font-family: inherit;
}
.input:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}
select.input {
  appearance: auto;
  height: 38px;
}
textarea.input {
  resize: vertical;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
.btn-primary {
  background: #409eff;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-primary:hover { background: #66b1ff; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-cancel {
  background: #f5f5f5;
  color: #333;
  border: 1px solid #d9d9d9;
  padding: 8px 20px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-cancel:hover { background: #e8e8e8; }
</style>