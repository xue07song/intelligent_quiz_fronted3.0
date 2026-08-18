import request from '@/utils/request';

// 本地可能同时运行旧版后端；班级管理统一连接本次启动的新服务，避免新增接口返回 404。
const classUrl = (path) => {
  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  return isLocal ? `http://${window.location.hostname}:3012/api/v1${path}` : path;
};

// 班级列表
export const getClasses = (params = {}) => {
  return request.get(classUrl('/classes'), { params });
};

// 班级详情（含班内学生）
export const getClassById = (id) => {
  return request.get(classUrl(`/classes/${id}`));
};

// 创建班级
export const createClass = (data) => {
  return request.post(classUrl('/classes'), data);
};

// 更新班级
export const updateClass = (id, data) => {
  return request.put(classUrl(`/classes/${id}`), data);
};

// 删除班级
export const deleteClass = (id) => {
  return request.delete(classUrl(`/classes/${id}`));
};

// 添加学生到班级（分班）
export const addStudentToClass = (classId, studentId) => {
  return request.post(classUrl(`/classes/${classId}/students`), { studentId });
};

// 批量添加学生
export const addStudentsToClass = (classId, studentIds) => {
  return request.post(classUrl(`/classes/${classId}/students/batch`), { studentIds });
};

// 调班（将学生从一个班转到另一个班）
export const transferStudent = (fromClassId, toClassId, studentId) => {
  return request.patch(classUrl('/classes/transfer-student'), { fromClassId, toClassId, studentId });
};

// 移出班级（学生变为未分班状态）
export const removeStudentFromClass = (classId, studentId) => {
  return request.delete(classUrl(`/classes/${classId}/students/${studentId}`));
};

// 获取未分班的学生列表
export const getUnassignedStudents = (params = {}) => {
  return request.get(classUrl('/classes/unassigned-students'), { params });
};

export const getTeacherOptions = (params = {}) => request.get(classUrl('/classes/teachers/options'), { params });
export const getAcademicStructure = () => request.get(classUrl('/classes/academic/structure'));
export const createCollege = (name) => request.post(classUrl('/classes/academic/colleges'), { name });
export const createMajor = (collegeId, name) => request.post(classUrl('/classes/academic/majors'), { collegeId, name });
