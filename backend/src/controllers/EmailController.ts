import { Request, Response } from 'express';
import { EmailService } from '../services/EmailService';

export class EmailController {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  // 获取用户所有邮箱账户
  async getAccounts(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: '用户未认证' });
      }

      const accounts = await this.emailService.getUserAccounts(userId);
      res.json(accounts);
    } catch (error) {
      console.error('获取邮箱账户失败:', error);
      res.status(500).json({ error: '获取邮箱账户失败' });
    }
  }

  // 添加新的邮箱账户
  async addAccount(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: '用户未认证' });
      }

      const { name, email, provider, imapConfig } = req.body;

      // 验证必需字段
      if (!name || !email || !imapConfig) {
        return res.status(400).json({ error: '缺少必需字段' });
      }

      // 验证 IMAP 配置
      const { host, port, secure, username, password } = imapConfig;
      if (!host || !port || !username || !password) {
        return res.status(400).json({ error: 'IMAP 配置不完整' });
      }

      const account = await this.emailService.addAccount(userId, {
        name,
        email,
        provider,
        imapConfig: {
          host,
          port: parseInt(port),
          secure: Boolean(secure),
          username,
          password
        }
      });

      res.status(201).json(account);
    } catch (error: any) {
      console.error('添加邮箱账户失败:', error);
      
      if (error.message && error.message.includes('连接')) {
        return res.status(400).json({ error: '邮箱连接失败，请检查配置' });
      }
      
      res.status(500).json({ error: '添加邮箱账户失败' });
    }
  }

  // 删除邮箱账户
  async deleteAccount(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const accountId = req.params.id;

      if (!userId) {
        return res.status(401).json({ error: '用户未认证' });
      }

      await this.emailService.deleteAccount(userId, accountId);
      res.json({ success: true });
    } catch (error) {
      console.error('删除邮箱账户失败:', error);
      res.status(500).json({ error: '删除邮箱账户失败' });
    }
  }

  // 测试IMAP连接
  async testConnection(req: Request, res: Response) {
    try {
      const { host, port, secure, username, password } = req.body;

      if (!host || !port || !username || !password) {
        return res.status(400).json({ error: 'IMAP 配置不完整' });
      }

      const result = await this.emailService.testIMAPConnection({
        host,
        port: parseInt(port),
        secure: Boolean(secure),
        username,
        password
      });

      if (result.success) {
        res.json({ success: true, message: '连接测试成功' });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      console.error('IMAP连接测试失败:', error);
      res.status(500).json({ error: 'IMAP连接测试失败' });
    }
  }

  // 同步邮箱
  async syncAccount(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const accountId = req.params.id;

      if (!userId) {
        return res.status(401).json({ error: '用户未认证' });
      }

      // 启动异步同步
      this.emailService.syncAccount(userId, accountId)
        .catch(error => console.error('同步邮箱失败:', error));

      res.json({ success: true, message: '同步已开始' });
    } catch (error) {
      console.error('启动同步失败:', error);
      res.status(500).json({ error: '启动同步失败' });
    }
  }

  // 获取邮件列表
  async getEmails(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: '用户未认证' });
      }

      const {
        accountId,
        folder = 'INBOX',
        page = 1,
        limit = 20,
        search,
        unreadOnly
      } = req.query;

      const emails = await this.emailService.getEmails(userId, {
        accountId: accountId as string,
        folder: folder as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        search: search as string,
        unreadOnly: unreadOnly === 'true'
      });

      res.json(emails);
    } catch (error) {
      console.error('获取邮件列表失败:', error);
      res.status(500).json({ error: '获取邮件列表失败' });
    }
  }

  // 获取邮件详情
  async getEmailDetail(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const emailId = req.params.id;

      if (!userId) {
        return res.status(401).json({ error: '用户未认证' });
      }

      const email = await this.emailService.getEmailDetail(userId, emailId);
      res.json(email);
    } catch (error) {
      console.error('获取邮件详情失败:', error);
      res.status(500).json({ error: '获取邮件详情失败' });
    }
  }

  // 标记邮件为已读/未读
  async markEmailRead(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const emailId = req.params.id;
      const { isRead } = req.body;

      if (!userId) {
        return res.status(401).json({ error: '用户未认证' });
      }

      await this.emailService.markEmailRead(userId, emailId, isRead);
      res.json({ success: true });
    } catch (error) {
      console.error('标记邮件状态失败:', error);
      res.status(500).json({ error: '标记邮件状态失败' });
    }
  }
}