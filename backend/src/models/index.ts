export interface EmailAccount {
  id: string;
  name: string;
  email: string;
  provider: 'gmail' | 'outlook' | 'imap' | 'other';
  status: 'connected' | 'error' | 'syncing';
  
  // IMAP 配置
  imapHost: string;
  imapPort: number;
  imapSecure: boolean;
  imapUsername: string;
  imapPassword: string; // 实际应用中需要加密存储
  
  // 关联信息
  userId: string;
  
  // 时间戳
  lastSync?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Email {
  id: string;
  uid: number; // IMAP UID
  
  // 基本信息
  subject: string;
  sender: string;
  recipient: string;
  date: Date;
  
  // 状态
  isRead: boolean;
  isStarred?: boolean;
  flags: string; // IMAP flags
  
  // 内容
  textContent?: string;
  htmlContent?: string;
  attachments?: string; // JSON string of attachment info
  
  // 分类和标签
  category?: string;
  priority?: 'high' | 'medium' | 'low';
  tags?: string; // JSON string of tags array
  
  // 关联信息
  accountId: string;
  folder: string; // INBOX, Sent, etc.
  
  // AI 分析结果
  aiAnalysis?: string; // JSON string of AI analysis results
  
  // 时间戳
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  
  // OAuth 信息
  provider: string;
  providerId: string;
  
  // 用户偏好
  preferences?: string; // JSON string of user preferences
  
  // 时间戳
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailStats {
  id: string;
  userId: string;
  
  // 统计数据
  totalEmails: number;
  unreadEmails: number;
  readEmails: number;
  repliedEmails: number;
  
  // 分类统计
  categoryStats: string; // JSON string of category counts
  
  // 时间统计
  timeStats: string; // JSON string of time-based stats
  
  // 统计时间范围
  statsDate: Date; // 统计日期
  
  createdAt: Date;
  updatedAt: Date;
}

export interface AIReminder {
  id: string;
  userId: string;
  emailId: string;
  
  // 提醒配置
  reminderType: 'follow_up' | 'deadline' | 'custom';
  reminderTime: Date;
  message: string;
  
  // 状态
  status: 'active' | 'triggered' | 'cancelled';
  
  // 时间戳
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailRule {
  id: string;
  userId: string;
  
  // 规则配置
  name: string;
  conditions: string; // JSON string of rule conditions
  actions: string; // JSON string of actions to take
  
  // 状态
  isActive: boolean;
  priority: number; // 规则优先级
  
  // 统计
  triggerCount: number;
  lastTriggered?: Date;
  
  // 时间戳
  createdAt: Date;
  updatedAt: Date;
}