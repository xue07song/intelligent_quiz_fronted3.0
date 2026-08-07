import axios from 'axios';

const instance = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
});

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

instance.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (res.code === 0) {
      return res.data;
    }
    const err = new Error(res.message || '请求失败');
    err.code = res.code;
    err.errors = res.errors;
    return Promise.reject(err);
  },
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || '网络错误';

    if (status === 401) {
      // token 失效或未登录，清除本地存储，触发跳转登录
      console.warn('🔐 登录已过期，请重新登录');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // 通过自定义事件通知 App.vue 跳转登录页
      window.dispatchEvent(new CustomEvent('auth-expired'));
    } else if (status === 403) {
      console.warn('⛔ 权限不足:', message);
    } else if (status === 404) {
      console.warn('📭 资源不存在:', message);
    } else if (status === 409) {
      console.warn('⚠️ 数据冲突:', message);
    } else if (status >= 500) {
      console.error('🔥 服务器错误:', message);
    }

    return Promise.reject({
      message,
      status,
      code: error.response?.data?.code,
      errors: error.response?.data?.errors,
    });
  }
);

export default instance;