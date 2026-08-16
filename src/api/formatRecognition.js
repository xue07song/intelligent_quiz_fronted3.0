import request from '@/utils/request';

const RECOGNIZE_TIMEOUT = 150000;

// 图片识别：上传题目图片，返回可编辑的题目结构化数据
export const recognizeQuestionImage = (file) => {
  const formData = new FormData();
  formData.append('image', file);
  return request.post('/questions/format-recognition/recognize', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: RECOGNIZE_TIMEOUT,
  });
};

// 导入识别后的题目（前端可编辑确认后调用）
export const importRecognizedQuestions = (questions, subject) => {
  return request.post('/questions/format-recognition/import', { questions, subject });
};

// 学生端：图片识别到学生题库
export const recognizeStudentQuestionImage = (file) => {
  const formData = new FormData();
  formData.append('image', file);
  return request.post('/api/student/questions/format-recognition/recognize', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: RECOGNIZE_TIMEOUT,
    baseURL: '',
  });
};

export const importStudentRecognizedQuestions = (questions) => {
  return request.post('/api/student/questions/format-recognition/import', { questions }, { baseURL: '' });
};
