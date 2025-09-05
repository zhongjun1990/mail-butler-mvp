import { Request, Response } from 'express';
import { NotificationService, NotificationPlatform, NotificationType } from '../services/NotificationService';
import { PrismaClient } from '@prisma/client';

export class NotificationController {
  private notificationService: NotificationService;
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
    this.notificationService = new NotificationService(this.prisma);
  }

  // 获取用户通知配置列表
  async getNotificationConfigs(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: '用户未认证' });
      }

      const configs = await this.notificationService.getUserNotificationConfigs(userId);
      res.json(configs);
    } catch (error) {
      console.error('获取通知配置失败:', error);
      res.status(500).json({ error: '获取通知配置失败' });
    }
  }

  // 添加通知配置
  async addNotificationConfig(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: '用户未认证' });
      }

      const { platform, webhook, enabled = true, types, filters } = req.body;

      // 验证必需字段
      if (!platform || !webhook || !types || !Array.isArray(types)) {
        return res.status(400).json({ error: '缺少必需字段或格式不正确' });
      }

      // 验证平台类型
      if (!Object.values(NotificationPlatform).includes(platform)) {
        return res.status(400).json({ error: '不支持的通知平台' });
      }

      // 验证通知类型
      const validTypes = types.filter(type => Object.values(NotificationType).includes(type));
      if (validTypes.length === 0) {
        return res.status(400).json({ error: '无效的通知类型' });
      }

      const config = {
        userId,
        platform,
        webhook,
        enabled,
        types: validTypes,
        filters: filters || {}
      };

      await this.notificationService.addNotificationConfig(config);
      res.status(201).json({ success: true, message: '通知配置添加成功' });
    } catch (error: any) {
      console.error('添加通知配置失败:', error);
      
      if (error.message && error.message.includes('Webhook')) {
        return res.status(400).json({ error: 'Webhook连接测试失败，请检查配置' });
      }
      
      res.status(500).json({ error: '添加通知配置失败' });
    }
  }

  // 测试通知配置
  async testNotificationConfig(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: '用户未认证' });
      }

      const { platform, webhook } = req.body;

      if (!platform || !webhook) {
        return res.status(400).json({ error: '缺少平台或Webhook参数' });
      }

      // 验证平台类型
      if (!Object.values(NotificationPlatform).includes(platform)) {
        return res.status(400).json({ error: '不支持的通知平台' });
      }

      // 创建临时配置进行测试
      const testConfig = {
        userId,
        platform,
        webhook,
        enabled: true,
        types: [NotificationType.CUSTOM]
      };

      await this.notificationService.addNotificationConfig(testConfig);
      
      // 立即删除测试配置
      const configs = await this.notificationService.getUserNotificationConfigs(userId);
      const testConfigRecord = configs.find(c => c.webhook === webhook && c.platform === platform);
      if (testConfigRecord?.id) {
        await this.notificationService.deleteNotificationConfig(userId, testConfigRecord.id);
      }

      res.json({ success: true, message: '通知测试成功' });
    } catch (error: any) {
      console.error('通知测试失败:', error);
      
      if (error.message && error.message.includes('Webhook')) {
        return res.status(400).json({ error: 'Webhook连接失败，请检查配置' });
      }
      
      res.status(500).json({ error: '通知测试失败' });
    }
  }

  // 更新通知配置
  async updateNotificationConfig(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const configId = req.params.id;

      if (!userId) {
        return res.status(401).json({ error: '用户未认证' });
      }

      const updates = req.body;
      
      // 如果更新了通知类型，验证其有效性
      if (updates.types && Array.isArray(updates.types)) {
        const validTypes = updates.types.filter((type: any) => Object.values(NotificationType).includes(type));
        if (validTypes.length === 0) {
          return res.status(400).json({ error: '无效的通知类型' });
        }
        updates.types = validTypes;
      }

      await this.notificationService.updateNotificationConfig(userId, configId, updates);
      res.json({ success: true, message: '通知配置更新成功' });
    } catch (error) {
      console.error('更新通知配置失败:', error);
      res.status(500).json({ error: '更新通知配置失败' });
    }
  }

  // 删除通知配置
  async deleteNotificationConfig(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const configId = req.params.id;

      if (!userId) {
        return res.status(401).json({ error: '用户未认证' });
      }

      await this.notificationService.deleteNotificationConfig(userId, configId);
      res.json({ success: true, message: '通知配置删除成功' });
    } catch (error) {
      console.error('删除通知配置失败:', error);
      res.status(500).json({ error: '删除通知配置失败' });
    }
  }

  // 手动发送测试通知
  async sendTestNotification(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: '用户未认证' });
      }

      const { title, content, type = NotificationType.CUSTOM } = req.body;

      if (!title || !content) {
        return res.status(400).json({ error: '缺少标题或内容' });
      }

      const message = {
        title,
        content,
        type,
        timestamp: new Date()
      };

      await this.notificationService.sendNotification(userId, message);
      res.json({ success: true, message: '测试通知发送成功' });
    } catch (error) {
      console.error('发送测试通知失败:', error);
      res.status(500).json({ error: '发送测试通知失败' });
    }
  }

  // 获取通知历史
  async getNotificationHistory(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: '用户未认证' });
      }

      const { 
        page = 1, 
        limit = 20, 
        platform, 
        type,
        success
      } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      const where: any = { userId };
      
      if (platform) where.platform = platform;
      if (type) where.type = type;
      if (success !== undefined) where.success = success === 'true';

      const [history, total] = await Promise.all([
        this.prisma.notificationHistory.findMany({
          where,
          skip,
          take,
          orderBy: { sentAt: 'desc' },
          include: {
            config: {
              select: {
                platform: true,
                webhook: true
              }
            }
          }
        }),
        this.prisma.notificationHistory.count({ where })
      ]);

      res.json({
        history,
        pagination: {
          page: parseInt(page as string),
          limit: take,
          total,
          pages: Math.ceil(total / take)
        }
      });
    } catch (error) {
      console.error('获取通知历史失败:', error);
      res.status(500).json({ error: '获取通知历史失败' });
    }
  }

  // 获取通知统计
  async getNotificationStats(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: '用户未认证' });
      }

      const [
        totalNotifications,
        successfulNotifications,
        configsCount,
        recentHistory
      ] = await Promise.all([
        this.prisma.notificationHistory.count({ where: { userId } }),
        this.prisma.notificationHistory.count({ where: { userId, success: true } }),
        this.prisma.notificationConfig.count({ where: { userId, enabled: true } }),
        this.prisma.notificationHistory.findMany({
          where: { userId },
          take: 10,
          orderBy: { sentAt: 'desc' },
          select: {
            platform: true,
            type: true,
            success: true,
            sentAt: true
          }
        })
      ]);

      // 按平台统计
      const platformStats = await this.prisma.notificationHistory.groupBy({
        by: ['platform'],
        where: { userId },
        _count: {
          id: true
        }
      });

      // 获取成功通知数
      const successfulByPlatform = await this.prisma.notificationHistory.groupBy({
        by: ['platform'],
        where: { userId, success: true },
        _count: {
          id: true
        }
      });

      // 按类型统计
      const typeStats = await this.prisma.notificationHistory.groupBy({
        by: ['type'],
        where: { userId },
        _count: {
          id: true
        }
      });

      const stats = {
        total: totalNotifications,
        successful: successfulNotifications,
        failureRate: totalNotifications > 0 ? 
          ((totalNotifications - successfulNotifications) / totalNotifications * 100).toFixed(2) : '0',
        activeConfigs: configsCount,
        platformStats: platformStats.map(stat => {
          const successfulStat = successfulByPlatform.find(s => s.platform === stat.platform);
          return {
            platform: stat.platform,
            total: stat._count.id,
            successful: successfulStat ? successfulStat._count.id : 0
          };
        }),
        typeStats: typeStats.map(stat => ({
          type: stat.type,
          count: stat._count.id
        })),
        recentHistory
      };

      res.json(stats);
    } catch (error) {
      console.error('获取通知统计失败:', error);
      res.status(500).json({ error: '获取通知统计失败' });
    }
  }

  // 获取支持的通知平台和类型
  async getSupportedOptions(req: Request, res: Response) {
    try {
      const platforms = Object.values(NotificationPlatform).map(platform => ({
        value: platform,
        label: this.getPlatformLabel(platform),
        description: this.getPlatformDescription(platform)
      }));

      const types = Object.values(NotificationType).map(type => ({
        value: type,
        label: this.getTypeLabel(type),
        description: this.getTypeDescription(type)
      }));

      res.json({
        platforms,
        types
      });
    } catch (error) {
      console.error('获取支持选项失败:', error);
      res.status(500).json({ error: '获取支持选项失败' });
    }
  }

  private getPlatformLabel(platform: NotificationPlatform): string {
    const labels = {
      [NotificationPlatform.DINGTALK]: '钉钉',
      [NotificationPlatform.FEISHU]: '飞书',
      [NotificationPlatform.WECHAT]: '微信企业号'
    };
    return labels[platform];
  }

  private getPlatformDescription(platform: NotificationPlatform): string {
    const descriptions = {
      [NotificationPlatform.DINGTALK]: '通过钉钉机器人发送消息通知',
      [NotificationPlatform.FEISHU]: '通过飞书机器人发送消息通知',
      [NotificationPlatform.WECHAT]: '通过微信企业号应用发送消息通知'
    };
    return descriptions[platform];
  }

  private getTypeLabel(type: NotificationType): string {
    const labels = {
      [NotificationType.NEW_EMAIL]: '新邮件通知',
      [NotificationType.IMPORTANT_EMAIL]: '重要邮件通知',
      [NotificationType.AI_SUMMARY]: 'AI摘要通知',
      [NotificationType.DAILY_DIGEST]: '每日摘要',
      [NotificationType.CUSTOM]: '自定义通知'
    };
    return labels[type];
  }

  private getTypeDescription(type: NotificationType): string {
    const descriptions = {
      [NotificationType.NEW_EMAIL]: '收到新邮件时发送通知',
      [NotificationType.IMPORTANT_EMAIL]: 'AI检测到重要邮件时发送通知',
      [NotificationType.AI_SUMMARY]: 'AI生成邮件摘要时发送通知',
      [NotificationType.DAILY_DIGEST]: '发送每日邮件摘要',
      [NotificationType.CUSTOM]: '自定义触发的通知'
    };
    return descriptions[type];
  }
}