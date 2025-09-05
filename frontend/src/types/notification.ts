// 通知平台类型
export enum NotificationPlatform {
  DINGTALK = 'dingtalk',
  FEISHU = 'feishu',
  WECHAT = 'wechat'
}

// 通知类型
export enum NotificationType {
  NEW_EMAIL = 'new_email',
  IMPORTANT_EMAIL = 'important_email', 
  AI_SUMMARY = 'ai_summary',
  DAILY_DIGEST = 'daily_digest',
  CUSTOM = 'custom'
}

// 通知配置接口
export interface NotificationConfig {
  id?: string;
  userId: string;
  platform: NotificationPlatform;
  webhook: string;
  enabled: boolean;
  types: NotificationType[];
  filters?: {
    keywords?: string[];
    senders?: string[];
    minPriority?: 'low' | 'medium' | 'high';
    timeRange?: {
      start: string; // HH:mm
      end: string;   // HH:mm
    };
  };
  createdAt?: string;
  updatedAt?: string;
}

// 通知历史接口
export interface NotificationHistory {
  id: string;
  platform: NotificationPlatform;
  type: NotificationType;
  title: string;
  content: string;
  success: boolean;
  metadata?: any;
  sentAt: string;
  config?: {
    platform: string;
    webhook: string;
  };
}

// 通知统计接口
export interface NotificationStats {
  total: number;
  successful: number;
  failureRate: string;
  activeConfigs: number;
  platformStats: Array<{
    platform: string;
    total: number;
    successful: number;
  }>;
  typeStats: Array<{
    type: string;
    count: number;
  }>;
  recentHistory: Array<{
    platform: string;
    type: string;
    success: boolean;
    sentAt: string;
  }>;
}

// 平台选项接口
export interface PlatformOption {
  value: NotificationPlatform;
  label: string;
  description: string;
}

// 类型选项接口
export interface TypeOption {
  value: NotificationType;
  label: string;
  description: string;
}

// 支持选项接口
export interface SupportedOptions {
  platforms: PlatformOption[];
  types: TypeOption[];
}

// 添加通知配置请求
export interface AddNotificationConfigRequest {
  platform: NotificationPlatform;
  webhook: string;
  enabled?: boolean;
  types: NotificationType[];
  filters?: NotificationConfig['filters'];
}

// 更新通知配置请求
export interface UpdateNotificationConfigRequest {
  enabled?: boolean;
  types?: NotificationType[];
  filters?: NotificationConfig['filters'];
}

// 测试通知配置请求
export interface TestNotificationConfigRequest {
  platform: NotificationPlatform;
  webhook: string;
}

// 发送测试通知请求
export interface SendTestNotificationRequest {
  title: string;
  content: string;
  type?: NotificationType;
}

// 通知历史查询参数
export interface NotificationHistoryQuery {
  page?: number;
  limit?: number;
  platform?: NotificationPlatform;
  type?: NotificationType;
  success?: boolean;
}

// 通知历史响应
export interface NotificationHistoryResponse {
  history: NotificationHistory[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}