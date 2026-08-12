import request from '@/utils/request';

export const getStudentQuestions = (params = {}) => {
    return request.get('/student-questions', { params });
};

export const getStudentQuestionById = (id) => {
    return request.get(`/student-questions/${id}`);
};

export const addStudentQuestion = (data) => {
    return request.post('/student-questions', data);
};

export const updateStudentQuestion = (id, data) => {
    return request.put(`/student-questions/${id}`, data);
};

export const deleteStudentQuestion = (id) => {
    return request.delete(`/student-questions/${id}`);
};

export const batchDeleteStudentQuestions = (ids) => {
    return request.post('/student-questions/batch-delete', { ids });
};

export const batchImportStudentQuestions = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request.post('/student-questions/batch-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

export const getStudentQuestionStatistics = () => {
  return request.get('/student-questions/statistics');
};

// 从公共题库导入单道题目到学生题库
export const importFromPublic = (question_id) => {
  return request.post('/student-questions/import-from-public', { question_id });
};

// 批量从公共题库导入题目到学生题库
export const batchImportFromPublic = (question_ids) => {
  return request.post('/student-questions/batch-import-from-public', { question_ids });
};
