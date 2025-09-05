import axios from 'axios';
import {
  NotificationConfig,
  NotificationHistory,
  NotificationStats,
  SupportedOptions,
  AddNotificationConfigRequest,
  UpdateNotificationConfigRequest,
  TestNotificationConfigRequest,
  SendTestNotificationRequest,
  NotificationHistoryQuery,
  NotificationHistoryResponse
} from '../types/notification';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

// 创建axios实例
const api = axios.create({
  baseURL: `${API_BASE_URL}/api/notifications`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器 - 添加认证token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 清除本地存储的token
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // 重定向到登录页
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export class NotificationService {
  // 获取通知配置列表
  static async getNotificationConfigs(): Promise<NotificationConfig[]> {
    try {
      const response = await api.get('/configs');
      return response.data;
    } catch (error) {
      console.error('获取通知配置失败:', error);
      throw new Error('获取通知配置失败');
    }
  }

  // 添加通知配置
  static async addNotificationConfig(config: AddNotificationConfigRequest): Promise<void> {
    try {
      await api.post('/configs', config);
    } catch (error: any) {
      console.error('添加通知配置失败:', error);
      throw new Error(error.response?.data?.error || '添加通知配置失败');
    }
  }

  // 更新通知配置
  static async updateNotificationConfig(
    configId: string, 
    updates: UpdateNotificationConfigRequest
  ): Promise<void> {
    try {
      await api.put(`/configs/${configId}`, updates);
    } catch (error: any) {
      console.error('更新通知配置失败:', error);
      throw new Error(error.response?.data?.error || '更新通知配置失败');
    }
  }

  // 删除通知配置
  static async deleteNotificationConfig(configId: string): Promise<void> {
    try {
      await api.delete(`/configs/${configId}`);
    } catch (error: any) {
      console.error('删除通知配置失败:', error);
      throw new Error(error.response?.data?.error || '删除通知配置失败');
    }
  }

  // 测试通知配置
  static async testNotificationConfig(config: TestNotificationConfigRequest): Promise<void> {
    try {
      await api.post('/test-config', config);
    } catch (error: any) {
      console.error('测试通知配置失败:', error);
      throw new Error(error.response?.data?.error || '测试通知配置失败');
    }
  }

  // 发送测试通知
  static async sendTestNotification(notification: SendTestNotificationRequest): Promise<void> {
    try {
      await api.post('/send-test', notification);
    } catch (error: any) {
      console.error('发送测试通知失败:', error);
      throw new Error(error.response?.data?.error || '发送测试通知失败');
    }
  }

  // 获取通知历史
  static async getNotificationHistory(query: NotificationHistoryQuery = {}): Promise<NotificationHistoryResponse> {
    try {
      const params = new URLSearchParams();
      
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.platform) params.append('platform', query.platform);
      if (query.type) params.append('type', query.type);
      if (query.success !== undefined) params.append('success', query.success.toString());

      const response = await api.get(`/history?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('获取通知历史失败:', error);
      throw new Error('获取通知历史失败');
    }
  }

  // 获取通知统计
  static async getNotificationStats(): Promise<NotificationStats> {
    try {
      const response = await api.get('/stats');
      return response.data;
    } catch (error) {
      console.error('获取通知统计失败:', error);
      throw new Error('获取通知统计失败');
    }
  }

  // 获取支持的选项
  static async getSupportedOptions(): Promise<SupportedOptions> {
    try {
      const response = await api.get('/options');
      return response.data;
    } catch (error) {
      console.error('获取支持选项失败:', error);
      throw new Error('获取支持选项失败');
    }
  }
}

export default NotificationService;