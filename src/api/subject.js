import request from '@/utils/request';

export const getSubjects = () => {
  return request.get('/subjects');
};
