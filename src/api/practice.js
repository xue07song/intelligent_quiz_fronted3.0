import request from '@/utils/request';

// 随机组卷
// body: { 章节, 题型, 难度, count, title }
export const generateExam = (data) => {
  return request.post('/practice/exams', data);
};

export const getExamInventory = (chapters = [], subject = '') => {
  const params = { chapters: chapters.join(',') };
  if (subject) params.subject = subject;
  return request.get('/practice/exam-inventory', { params });
};

export const previewRuleExam = (data) => {
  return request.post('/practice/rule-exams/preview', data);
};

export const generateRuleExam = (data) => {
  return request.post('/practice/rule-exams', data);
};

export const checkAdaptiveInventory = (data) => request.post('/practice/adaptive/inventory', data);
export const startAdaptivePractice = (data) => request.post('/practice/adaptive/sessions', data);
export const getAdaptiveSession = (id) => request.get(`/practice/adaptive/sessions/${id}`);
export const submitAdaptiveAnswer = (id, data) => request.post(`/practice/adaptive/sessions/${id}/answers`, data);
export const getAdaptiveOverview = () => request.get('/practice/adaptive-overview');
export const getAdaptiveProgress = () => request.get('/practice/adaptive-progress');
export const getLearningAnalysis = () => request.get('/practice/learning-analysis/me');
export const getLearningAnalysisOverview = () => request.get('/practice/learning-analysis/overview');
export const getStudentLearningAnalysis = (userId) => request.get(`/practice/learning-analysis/students/${userId}`);

// 试卷列表（分页）
export const getExams = (params = {}) => {
  return request.get('/practice/exams', { params });
};

// 试卷详情（含题目）
export const getExam = (id) => {
  return request.get(`/practice/exams/${id}`);
};

// 导出试卷：docx / xlsx，可带答案与解析
export const exportExam = (id, params) => {
  return request.get(`/practice/exams/${id}/export`, {
    params,
    responseType: 'blob',
    timeout: 60000,
  });
};

// 提交答卷（自动评分）
// body: { answers: [{ questionId, userAnswer }], startedAt }
export const submitExam = (id, data) => {
  return request.post(`/practice/exams/${id}/submit`, data);
};

// 答题记录列表（分页）
export const getRecords = (params = {}) => {
  return request.get('/practice/records', { params });
};

// 答题记录详情（含每题对错）
export const getRecord = (id) => {
  return request.get(`/practice/records/${id}`);
};

// 统计分析（总览 + 趋势 + 按题型）
export const getPracticeStats = () => {
  return request.get('/practice/statistics');
};

// 错题本：分页列表
export const getWrongQuestions = (params = {}) => {
  return request.get('/practice/wrong-questions', { params });
};

// 错题本：错题重练
// body: { count, 章节, 题型, title }
export const createWrongExam = (data) => {
  return request.post('/practice/wrong-exams', data);
};

// ===== [新增] 单题练习：根据题目ID生成练习 =====
export const startSingleQuestion = (questionId) => {
  return request.post('/practice/single-question', { questionId });
};

// ==================== 管理端接口（教师/管理员）====================
// 教师只能查看学生数据；管理员可查看所有人并按角色筛选

// 管理端：有做题记录的用户列表（按角色分组，含统计汇总）
export const adminListUsers = (params = {}) => {
  return request.get('/practice/admin/users', { params });
};

// 管理端：所有用户答题记录列表（可按角色筛选）
export const adminListRecords = (params = {}) => {
  return request.get('/practice/admin/records', { params });
};

// 管理端：查看任意答题记录详情
export const adminGetRecord = (id) => {
  return request.get(`/practice/admin/records/${id}`);
};
export const reviewSubjectiveAnswer = (answerId, data) => request.put(`/practice/admin/answers/${answerId}/review`, data);

// 管理端：查看指定用户的答题记录列表
export const adminListUserRecords = (userId, params = {}) => {
  return request.get(`/practice/admin/users/${userId}/records`, { params });
};

// 管理端：查看指定用户的统计分析
export const adminGetUserStats = (userId) => {
  return request.get(`/practice/admin/users/${userId}/statistics`);
};
// ===== 单题判题（直接返回对错和解析） =====
export const checkSingleQuestion = (questionId, userAnswer) => {
  return request.post('/practice/single-question/check', { questionId, userAnswer });
};

// 管理端：以人为界的全局统计总览（每人含汇总 + 最近 N 次答题明细）
export const adminGetAllStats = (params = {}) => {
  return request.get('/practice/admin/stats/all', { params });
};