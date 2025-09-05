import { Request, Response } from 'express';
import { AIService } from '../services/AIService';
import { EmailService } from '../services/EmailService';

export class AIController {
  private aiService: AIService;
  private emailService: EmailService;

  constructor() {
    this.aiService = new AIService();
    this.emailService = new EmailService();
  }

  // 获取驾驶舱数据
  async getDashboard(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: '用户未认证' });
      }

      const { range = 'week' } = req.query;
      
      // 获取邮件统计数据
      const stats = await this.emailService.getEmailStats(userId, range as string);
      
      // 获取AI分析结果
      const analysis = await this.aiService.analyzeEmailPatterns(userId, range as string);

      res.json({
        stats,
        analysis,
        lastUpdate: new Date().toISOString()
      });
    } catch (error) {
      console.error('获取驾驶舱数据失败:', error);
      res.status(500).json({ error: '获取驾驶舱数据失败' });
    }
  }

  // 邮件智能分类
  async classifyEmail(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { emailId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: '用户未认证' });
      }

      const classification = await this.aiService.classifyEmail(userId, emailId);
      res.json(classification);
    } catch (error) {
      console.error('邮件分类失败:', error);
      res.status(500).json({ error: '邮件分类失败' });
    }
  }

  // 生成回复建议
  async generateReply(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { emailId } = req.params;
      const { context = 'formal' } = req.body;

      if (!userId) {
        return res.status(401).json({ error: '用户未认证' });
      }

      const suggestions = await this.aiService.generateReplySuggestions(userId, emailId, context);
      res.json(suggestions);
    } catch (error) {
      console.error('生成回复建议失败:', error);
      res.status(500).json({ error: '生成回复建议失败' });
    }
  }

  // 邮件优先级评估
  async assessPriority(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { emailId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: '用户未认证' });
      }

      const priority = await this.aiService.assessEmailPriority(userId, emailId);
      res.json(priority);
    } catch (error) {
      console.error('优先级评估失败:', error);
      res.status(500).json({ error: '优先级评估失败' });
    }
  }

  // 智能提醒设置
  async setSmartReminder(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { emailId } = req.params;
      const { reminderType, reminderTime, message } = req.body;

      if (!userId) {
        return res.status(401).json({ error: '用户未认证' });
      }

      const reminder = await this.aiService.setSmartReminder(userId, {
        emailId,
        reminderType,
        reminderTime,
        message
      });

      res.json(reminder);
    } catch (error) {
      console.error('设置智能提醒失败:', error);
      res.status(500).json({ error: '设置智能提醒失败' });
    }
  }

  // 获取邮件洞察
  async getEmailInsights(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: '用户未认证' });
      }

      const { timeRange = 'month', category } = req.query;

      const insights = await this.aiService.getEmailInsights(userId, {
        timeRange: timeRange as string,
        category: category as string
      });

      res.json(insights);
    } catch (error) {
      console.error('获取邮件洞察失败:', error);
      res.status(500).json({ error: '获取邮件洞察失败' });
    }
  }

  // 智能搜索
  async smartSearch(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: '用户未认证' });
      }

      const { query, filters = {} } = req.body;

      if (!query) {
        return res.status(400).json({ error: '搜索查询不能为空' });
      }

      const results = await this.aiService.smartSearch(userId, query, filters);
      res.json(results);
    } catch (error) {
      console.error('智能搜索失败:', error);
      res.status(500).json({ error: '智能搜索失败' });
    }
  }

  // 导出统计报告
  async exportReport(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: '用户未认证' });
      }

      const { format = 'json', timeRange = 'month' } = req.query;

      const report = await this.aiService.generateReport(userId, {
        format: format as string,
        timeRange: timeRange as string
      });

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="email-report.csv"');
      } else {
        res.setHeader('Content-Type', 'application/json');
      }

      res.send(report);
    } catch (error) {
      console.error('导出报告失败:', error);
      res.status(500).json({ error: '导出报告失败' });
    }
  }

  // AI 智能聊天
  async chatWithAI(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { message, context } = req.body;

      if (!userId) {
        return res.status(401).json({ error: '用户未认证' });
      }

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: '消息内容不能为空' });
      }

      const chatResponse = await this.aiService.chatWithAI(userId, message, context);
      res.json(chatResponse);
    } catch (error) {
      console.error('AI聊天失败:', error);
      res.status(500).json({ error: 'AI聊天失败' });
    }
  }
}