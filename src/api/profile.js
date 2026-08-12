import request from '@/utils/request';

// 获取完整个人信息（用户资料 + 统计）
export const getProfile = () => {
  return request.get('/profile');
};

// 更新个人资料
export const updateProfile = (data) => {
  return request.put('/profile', data);
};

// 历史做题汇总
export const getHistorySummary = () => {
  return request.get('/profile/history/summary');
};

// 历史做过的题目（去重分页）
export const getHistoryQuestions = (params = {}) => {
  return request.get('/profile/history/questions', { params });
};

// ========== 收藏标记接口 ==========

// 收藏/取消收藏切换
export const toggleBookmark = (data) => {
  return request.post('/bookmarks', data);
};

// 收藏列表
export const getBookmarks = (params = {}) => {
  return request.get('/bookmarks', { params });
};

// 批量检查题目是否已收藏
export const checkBookmarks = (ids, source_type = 'public') => {
  return request.get('/bookmarks/check', { params: { ids: ids.join(','), source_type } });
};

// 更新收藏备注
export const updateBookmarkNote = (id, note) => {
  return request.put(`/bookmarks/${id}/note`, { note });
};

// 取消收藏
export const removeBookmark = (id) => {
  return request.delete(`/bookmarks/${id}`);
};
