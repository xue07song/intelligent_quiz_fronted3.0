import request from '@/utils/request';

const EXPORT_TIMEOUT = 60000;

// 学生题库
export const getStudentQuestions = (params = {}) => request.get('/api/student/questions', { params, baseURL: '' });
export const createStudentQuestion = (data) => request.post('/api/student/questions', data, { baseURL: '' });
export const updateStudentQuestion = (id, data) => request.put(`/api/student/questions/${id}`, data, { baseURL: '' });
export const deleteStudentQuestion = (id) => request.delete(`/api/student/questions/${id}`, { baseURL: '' });
export const shareStudentQuestion = (id) => request.post(`/api/student/questions/${id}/share`, {}, { baseURL: '' });
export const reviewStudentQuestion = (id, data) => request.patch(`/api/student/questions/${id}/review`, data, { baseURL: '' });
export const getStudentReviewQueue = (params = {}) => request.get('/api/student/questions/review-queue', { params, baseURL: '' });
export const exportStudentQuestions = (params) =>
  request.get('/api/student/questions/export', {
    params,
    responseType: 'blob',
    timeout: EXPORT_TIMEOUT,
    baseURL: '',
  });

// 管理员：学生题库管理
export const adminListStudentQuestions = (params = {}) => request.get('/admin/student-questions', { params });
export const adminDeleteStudentQuestion = (id) => request.delete(`/admin/student-questions/${id}`);

// 管理员：学生版主管理
export const adminListModerators = (params = {}) => request.get('/admin/student-moderators', { params });
export const adminCreateModerator = (data) => request.post('/admin/student-moderators', data);
export const adminRemoveModerator = (id) => request.delete(`/admin/student-moderators/${id}`);
