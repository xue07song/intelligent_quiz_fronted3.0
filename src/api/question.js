import request from '@/utils/request';

export const getQuestions = (params = {}) => {
    return request.get('/questions', { params });
};

export const getQuestionById = (id) => {
    return request.get(`/questions/${id}`);
};

export const addQuestion = (data) => {
    return request.post('/questions', data);
};

export const updateQuestion = (id, data) => {
    return request.put(`/questions/${id}`, data);
};

export const deleteQuestion = (id) => {
    return request.delete(`/questions/${id}`);
};

export const searchQuestions = (keyword) => {
    return request.get('/questions/search', { params: { keyword } });
};

export const getStatistics = () => {
    return request.get('/questions/statistics');
};