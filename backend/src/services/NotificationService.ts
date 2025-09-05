import axios from 'axios';
import { PrismaClient } from '@prisma/client';

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
}

// 通知消息接口
export interface NotificationMessage {
  title: string;
  content: string;
  type: NotificationType;
  timestamp: Date;
  metadata?: {
    emailId?: string;
    sender?: string;
    subject?: string;
    priority?: string;
    aiSummary?: string;
  };
}

// 抽象通知提供者基类
export abstract class NotificationProvider {
  protected webhook: string;
  protected platform: NotificationPlatform;

  constructor(webhook: string, platform: NotificationPlatform) {
    this.webhook = webhook;
    this.platform = platform;
  }

  abstract sendNotification(message: NotificationMessage): Promise<boolean>;
  
  protected formatMessage(message: NotificationMessage): any {
    return {
      title: message.title,
      text: message.content,
      timestamp: message.timestamp.toISOString()
    };
  }
}

// 钉钉通知提供者
export class DingTalkProvider extends NotificationProvider {
  constructor(webhook: string) {
    super(webhook, NotificationPlatform.DINGTALK);
  }

  async sendNotification(message: NotificationMessage): Promise<boolean> {
    try {
      const payload = this.formatDingTalkMessage(message);
      const response = await axios.post(this.webhook, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      });
      
      return response.data.errcode === 0;
    } catch (error) {
      console.error('钉钉通知发送失败:', error);
      return false;
    }
  }

  private formatDingTalkMessage(message: NotificationMessage): any {
    const { title, content, metadata } = message;
    
    if (message.type === NotificationType.NEW_EMAIL && metadata) {
      return {
        msgtype: 'markdown',
        markdown: {
          title: title,
          text: `### ${title}\n\n` +
                `**发件人**: ${metadata.sender}\n\n` +
                `**主题**: ${metadata.subject}\n\n` +
                `**内容**: ${content}\n\n` +
                `**时间**: ${message.timestamp.toLocaleString('zh-CN')}`
        }
      };
    }

    return {
      msgtype: 'text',
      text: {
        content: `${title}\n\n${content}`
      }
    };
  }
}

// 飞书通知提供者
export class FeishuProvider extends NotificationProvider {
  constructor(webhook: string) {
    super(webhook, NotificationPlatform.FEISHU);
  }

  async sendNotification(message: NotificationMessage): Promise<boolean> {
    try {
      const payload = this.formatFeishuMessage(message);
      const response = await axios.post(this.webhook, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      });
      
      return response.data.StatusCode === 0;
    } catch (error) {
      console.error('飞书通知发送失败:', error);
      return false;
    }
  }

  private formatFeishuMessage(message: NotificationMessage): any {
    const { title, content, metadata } = message;

    if (message.type === NotificationType.NEW_EMAIL && metadata) {
      return {
        msg_type: 'rich_text',
        content: {
          rich_text: {
            elements: [
              {
                tag: 'text',
                text: title,
                style: {
                  bold: true
                }
              },
              {
                tag: 'text',
                text: `\n发件人: ${metadata.sender}`
              },
              {
                tag: 'text', 
                text: `\n主题: ${metadata.subject}`
              },
              {
                tag: 'text',
                text: `\n内容: ${content}`
              },
              {
                tag: 'text',
                text: `\n时间: ${message.timestamp.toLocaleString('zh-CN')}`
              }
            ]
          }
        }
      };
    }

    return {
      msg_type: 'text',
      content: {
        text: `${title}\n\n${content}`
      }
    };
  }
}

// 微信企业号通知提供者
export class WechatProvider extends NotificationProvider {
  constructor(webhook: string) {
    super(webhook, NotificationPlatform.WECHAT);
  }

  async sendNotification(message: NotificationMessage): Promise<boolean> {
    try {
      const payload = this.formatWechatMessage(message);
      const response = await axios.post(this.webhook, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      });
      
      return response.data.errcode === 0;
    } catch (error) {
      console.error('微信通知发送失败:', error);
      return false;
    }
  }

  private formatWechatMessage(message: NotificationMessage): any {
    const { title, content, metadata } = message;

    if (message.type === NotificationType.NEW_EMAIL && metadata) {
      return {
        msgtype: 'markdown',
        markdown: {
          content: `# ${title}\n\n` +
                  `**发件人**: ${metadata.sender}\n\n` +
                  `**主题**: ${metadata.subject}\n\n` +
                  `**内容**: ${content}\n\n` +
                  `**时间**: ${message.timestamp.toLocaleString('zh-CN')}`
        }
      };
    }

    return {
      msgtype: 'text',
      text: {
        content: `${title}\n\n${content}`
      }
    };
  }
}

// 通知规则引擎
export class NotificationRuleEngine {
  static shouldNotify(
    message: NotificationMessage, 
    config: NotificationConfig
  ): boolean {
    // 检查通知类型是否启用
    if (!config.types.includes(message.type)) {
      return false;
    }

    // 检查时间范围
    if (config.filters?.timeRange) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const { start, end } = config.filters.timeRange;
      
      if (currentTime < start || currentTime > end) {
        return false;
      }
    }

    // 检查关键词过滤
    if (config.filters?.keywords && config.filters.keywords.length > 0) {
      const hasKeyword = config.filters.keywords.some(keyword =>
        message.title.toLowerCase().includes(keyword.toLowerCase()) ||
        message.content.toLowerCase().includes(keyword.toLowerCase())
      );
      if (!hasKeyword) {
        return false;
      }
    }

    // 检查发件人过滤
    if (config.filters?.senders && config.filters.senders.length > 0 && message.metadata?.sender) {
      const hasSender = config.filters.senders.some(sender =>
        message.metadata!.sender!.toLowerCase().includes(sender.toLowerCase())
      );
      if (!hasSender) {
        return false;
      }
    }

    // 检查优先级过滤
    if (config.filters?.minPriority && message.metadata?.priority) {
      const priorityLevel = { low: 1, medium: 2, high: 3 };
      const minLevel = priorityLevel[config.filters.minPriority];
      const currentLevel = priorityLevel[message.metadata.priority as keyof typeof priorityLevel];
      
      if (currentLevel < minLevel) {
        return false;
      }
    }

    return true;
  }
}

// 主通知服务类
export class NotificationService {
  private prisma: PrismaClient;
  private providers: Map<string, NotificationProvider> = new Map();

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // 注册通知提供者
  private createProvider(platform: NotificationPlatform, webhook: string): NotificationProvider {
    switch (platform) {
      case NotificationPlatform.DINGTALK:
        return new DingTalkProvider(webhook);
      case NotificationPlatform.FEISHU:
        return new FeishuProvider(webhook);
      case NotificationPlatform.WECHAT:
        return new WechatProvider(webhook);
      default:
        throw new Error(`不支持的通知平台: ${platform}`);
    }
  }

  // 添加通知配置
  async addNotificationConfig(config: NotificationConfig): Promise<void> {
    try {
      // 验证webhook连接
      const provider = this.createProvider(config.platform, config.webhook);
      const testMessage: NotificationMessage = {
        title: '📧 邮箱助手配置测试',
        content: '通知配置已成功添加！您将在这里收到重要邮件通知。',
        type: NotificationType.CUSTOM,
        timestamp: new Date()
      };

      const success = await provider.sendNotification(testMessage);
      if (!success) {
        throw new Error('Webhook连接测试失败');
      }

      // 保存配置到数据库
      await this.prisma.notificationConfig.create({
        data: {
          userId: config.userId,
          platform: config.platform,
          webhook: config.webhook,
          enabled: config.enabled,
          types: config.types,
          filters: config.filters || {}
        }
      });

      // 缓存提供者
      const key = `${config.userId}-${config.platform}`;
      this.providers.set(key, provider);

    } catch (error) {
      console.error('添加通知配置失败:', error);
      throw error;
    }
  }

  // 获取用户通知配置
  async getUserNotificationConfigs(userId: string): Promise<NotificationConfig[]> {
    try {
      const configs = await this.prisma.notificationConfig.findMany({
        where: { userId, enabled: true }
      });

      return configs.map(config => ({
        id: config.id,
        userId: config.userId,
        platform: config.platform as NotificationPlatform,
        webhook: config.webhook,
        enabled: config.enabled,
        types: config.types as NotificationType[],
        filters: config.filters as any
      }));
    } catch (error) {
      console.error('获取通知配置失败:', error);
      return [];
    }
  }

  // 发送通知
  async sendNotification(userId: string, message: NotificationMessage): Promise<void> {
    try {
      const configs = await this.getUserNotificationConfigs(userId);
      
      for (const config of configs) {
        // 检查通知规则
        if (!NotificationRuleEngine.shouldNotify(message, config)) {
          continue;
        }

        // 获取或创建提供者
        const key = `${userId}-${config.platform}`;
        let provider = this.providers.get(key);
        
        if (!provider) {
          provider = this.createProvider(config.platform, config.webhook);
          this.providers.set(key, provider);
        }

        // 发送通知
        const success = await provider.sendNotification(message);
        
        // 记录通知历史
        await this.prisma.notificationHistory.create({
          data: {
            userId,
            configId: config.id!,
            platform: config.platform,
            type: message.type,
            title: message.title,
            content: message.content,
            success,
            metadata: message.metadata || {},
            sentAt: new Date()
          }
        });

        if (success) {
          console.log(`通知发送成功: ${config.platform} - ${message.title}`);
        } else {
          console.error(`通知发送失败: ${config.platform} - ${message.title}`);
        }
      }
    } catch (error) {
      console.error('发送通知失败:', error);
    }
  }

  // 发送新邮件通知
  async notifyNewEmail(userId: string, email: any): Promise<void> {
    const message: NotificationMessage = {
      title: '📧 新邮件通知',
      content: `您收到一封来自 ${email.sender} 的新邮件`,
      type: NotificationType.NEW_EMAIL,
      timestamp: new Date(),
      metadata: {
        emailId: email.id,
        sender: email.sender,
        subject: email.subject,
        priority: email.priority || 'medium'
      }
    };

    await this.sendNotification(userId, message);
  }

  // 发送重要邮件通知
  async notifyImportantEmail(userId: string, email: any, aiAnalysis: any): Promise<void> {
    const message: NotificationMessage = {
      title: '⚠️ 重要邮件提醒',
      content: `AI检测到一封重要邮件，建议及时处理`,
      type: NotificationType.IMPORTANT_EMAIL,
      timestamp: new Date(),
      metadata: {
        emailId: email.id,
        sender: email.sender,
        subject: email.subject,
        priority: 'high',
        aiSummary: aiAnalysis.summary
      }
    };

    await this.sendNotification(userId, message);
  }

  // 发送AI摘要通知
  async notifyAISummary(userId: string, summary: string): Promise<void> {
    const message: NotificationMessage = {
      title: '🤖 AI邮件摘要',
      content: summary,
      type: NotificationType.AI_SUMMARY,
      timestamp: new Date()
    };

    await this.sendNotification(userId, message);
  }

  // 删除通知配置
  async deleteNotificationConfig(userId: string, configId: string): Promise<void> {
    try {
      await this.prisma.notificationConfig.delete({
        where: {
          id: configId,
          userId
        }
      });

      // 清除缓存的提供者
      for (const [key, provider] of this.providers.entries()) {
        if (key.startsWith(userId)) {
          this.providers.delete(key);
        }
      }
    } catch (error) {
      console.error('删除通知配置失败:', error);
      throw error;
    }
  }

  // 更新通知配置
  async updateNotificationConfig(userId: string, configId: string, updates: Partial<NotificationConfig>): Promise<void> {
    try {
      await this.prisma.notificationConfig.update({
        where: {
          id: configId,
          userId
        },
        data: {
          enabled: updates.enabled,
          types: updates.types,
          filters: updates.filters || {}
        }
      });

      // 清除缓存的提供者以便重新创建
      const configs = await this.getUserNotificationConfigs(userId);
      for (const config of configs) {
        const key = `${userId}-${config.platform}`;
        this.providers.delete(key);
      }
    } catch (error) {
      console.error('更新通知配置失败:', error);
      throw error;
    }
  }
}