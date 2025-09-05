import Imap from 'imap';
import { simpleParser } from 'mailparser';
import * as nodemailer from 'nodemailer';
import prisma from '../config/database';
import { AIService } from './AIService';
import { NotificationService } from './NotificationService';

interface IMAPConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
}

interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
}

interface EmailAccount {
  id?: string;
  name: string;
  email: string;
  provider: string;
  imapConfig: IMAPConfig;
  smtpConfig?: SMTPConfig;
  userId: string;
}

interface EmailFilter {
  accountId?: string;
  folder?: string;
  page?: number;
  limit?: number;
  search?: string;
  unreadOnly?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  hasAttachments?: boolean;
}

interface SendEmailRequest {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

// 邮箱提供商配置
const EMAIL_PROVIDERS = {
  gmail: {
    imap: { host: 'imap.gmail.com', port: 993, secure: true },
    smtp: { host: 'smtp.gmail.com', port: 587, secure: false }
  },
  outlook: {
    imap: { host: 'outlook.office365.com', port: 993, secure: true },
    smtp: { host: 'smtp.office365.com', port: 587, secure: false }
  },
  yahoo: {
    imap: { host: 'imap.mail.yahoo.com', port: 993, secure: true },
    smtp: { host: 'smtp.mail.yahoo.com', port: 587, secure: false }
  },
  '163': {
    imap: { host: 'imap.163.com', port: 993, secure: true },
    smtp: { host: 'smtp.163.com', port: 465, secure: true }
  },
  'qq': {
    imap: { host: 'imap.qq.com', port: 993, secure: true },
    smtp: { host: 'smtp.qq.com', port: 587, secure: false }
  }
} as const;

export class EmailService {
  private aiService: AIService;
  private notificationService: NotificationService;

  constructor() {
    this.aiService = new AIService();
    this.notificationService = new NotificationService(prisma);
  }

  // 获取邮箱提供商配置
  static getProviderConfig(provider: string) {
    const providerConfig = EMAIL_PROVIDERS[provider as keyof typeof EMAIL_PROVIDERS];
    if (!providerConfig) {
      throw new Error(`不支持的邮箱提供商: ${provider}`);
    }
    return providerConfig;
  }

  // 智能检测邮箱提供商
  static detectProvider(email: string): string {
    const domain = email.split('@')[1]?.toLowerCase();
    
    if (domain.includes('gmail')) return 'gmail';
    if (domain.includes('outlook') || domain.includes('hotmail') || domain.includes('live')) return 'outlook';
    if (domain.includes('yahoo')) return 'yahoo';
    if (domain.includes('163')) return '163';
    if (domain.includes('qq')) return 'qq';
    
    // 默认返回需要手动配置
    return 'custom';
  }
  
  // 获取用户所有邮箱账户
  async getUserAccounts(userId: string) {
    try {
      const accounts = await prisma.emailAccount.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          email: true,
          provider: true,
          status: true,
          lastSync: true,
          createdAt: true,
          // 不返回敏感的IMAP配置信息
        }
      });

      // 为每个账户获取未读邮件数量
      const accountsWithStats = await Promise.all(
        accounts.map(async (account) => {
          const unreadCount = await this.getUnreadCount(account.id);
          return {
            ...account,
            unreadCount
          };
        })
      );

      return accountsWithStats;
    } catch (error) {
      console.error('获取用户邮箱账户失败:', error);
      throw new Error('获取邮箱账户失败');
    }
  }

  // 添加新的邮箱账户
  async addAccount(userId: string, accountData: {
    name: string;
    email: string;
    password: string;
    provider?: string;
    customImap?: Partial<IMAPConfig>;
    customSmtp?: Partial<SMTPConfig>;
  }) {
    try {
      // 自动检测提供商
      let provider = accountData.provider || EmailService.detectProvider(accountData.email);
      
      let imapConfig: IMAPConfig;
      let smtpConfig: SMTPConfig;
      
      if (provider === 'custom') {
        // 手动配置
        if (!accountData.customImap || !accountData.customSmtp) {
          throw new Error('自定义邮箱需要提供IMAP和SMTP配置');
        }
        imapConfig = {
          host: accountData.customImap.host!,
          port: accountData.customImap.port!,
          secure: accountData.customImap.secure!,
          username: accountData.email,
          password: accountData.password
        };
        smtpConfig = {
          host: accountData.customSmtp.host!,
          port: accountData.customSmtp.port!,
          secure: accountData.customSmtp.secure!,
          username: accountData.email,
          password: accountData.password
        };
      } else {
        // 使用预设配置
        const providerConfig = EmailService.getProviderConfig(provider);
        imapConfig = {
          ...providerConfig.imap,
          username: accountData.email,
          password: accountData.password
        };
        smtpConfig = {
          ...providerConfig.smtp,
          username: accountData.email,
          password: accountData.password
        };
      }

      // 测试IMAP连接
      const imapTest = await this.testIMAPConnection(imapConfig);
      if (!imapTest.success) {
        throw new Error(`IMAP连接失败: ${imapTest.error}`);
      }

      // 测试SMTP连接
      const smtpTest = await this.testSMTPConnection(smtpConfig);
      if (!smtpTest.success) {
        console.warn(`SMTP连接测试失败: ${smtpTest.error}`);
        // SMTP失败不阻止账户创建，只是警告
      }

      // 加密存储配置（实际项目中应该使用加密）
      const account = await prisma.emailAccount.create({
        data: {
          name: accountData.name,
          email: accountData.email,
          provider: provider,
          // IMAP配置
          imapHost: imapConfig.host,
          imapPort: imapConfig.port,
          imapSecure: imapConfig.secure,
          imapUsername: imapConfig.username,
          imapPassword: imapConfig.password, // 实际应用中需要加密
          // SMTP配置
          smtpHost: smtpConfig.host,
          smtpPort: smtpConfig.port,
          smtpSecure: smtpConfig.secure,
          smtpUsername: smtpConfig.username,
          smtpPassword: smtpConfig.password, // 实际应用中需要加密
          status: 'connected',
          userId: userId
        },
        select: {
          id: true,
          name: true,
          email: true,
          provider: true,
          status: true,
          createdAt: true
        }
      });

      // 异步启动首次同步
      this.syncAccount(userId, account.id, true).catch(error => 
        console.error('首次同步失败:', error)
      );

      return account;
    } catch (error) {
      console.error('添加邮箱账户失败:', error);
      throw error;
    }
  }

  // 删除邮箱账户
  async deleteAccount(userId: string, accountId: string) {
    try {
      await prisma.emailAccount.deleteMany({
        where: {
          id: accountId,
          userId: userId
        }
      });

      // 同时删除相关的邮件数据
      await prisma.email.deleteMany({
        where: {
          accountId: accountId
        }
      });
    } catch (error) {
      console.error('删除邮箱账户失败:', error);
      throw new Error('删除邮箱账户失败');
    }
  }

  // 测试IMAP连接
  async testIMAPConnection(config: IMAPConfig): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      const imap = new Imap({
        host: config.host,
        port: config.port,
        tls: config.secure,
        user: config.username,
        password: config.password,
        tlsOptions: {
          rejectUnauthorized: false
        }
      });

      const timeout = setTimeout(() => {
        imap.destroy();
        resolve({ success: false, error: '连接超时' });
      }, 10000);

      imap.once('ready', () => {
        clearTimeout(timeout);
        imap.end();
        resolve({ success: true });
      });

      imap.once('error', (err: any) => {
        clearTimeout(timeout);
        resolve({ success: false, error: err.message });
      });

      try {
        imap.connect();
      } catch (error: any) {
        clearTimeout(timeout);
        resolve({ success: false, error: error.message || 'Connection failed' });
      }
    });
  }

  // 测试SMTP连接
  async testSMTPConnection(config: SMTPConfig): Promise<{ success: boolean; error?: string }> {
    try {
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.username,
          pass: config.password
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      await transporter.verify();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // 发送邮件
  async sendEmail(userId: string, accountId: string, emailData: SendEmailRequest) {
    try {
      const account = await prisma.emailAccount.findFirst({
        where: { id: accountId, userId }
      });

      if (!account) {
        throw new Error('邮箱账户不存在');
      }

      const smtpConfig = {
        host: account.smtpHost,
        port: account.smtpPort,
        secure: account.smtpSecure,
        username: account.smtpUsername,
        password: account.smtpPassword
      };

      const transporter = nodemailer.createTransport({
        host: smtpConfig.host!,
        port: smtpConfig.port!,
        secure: smtpConfig.secure,
        auth: {
          user: smtpConfig.username!,
          pass: smtpConfig.password!
        }
      } as any);

      const mailOptions = {
        from: `"${account.name}" <${account.email}>`,
        to: Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to,
        cc: emailData.cc ? (Array.isArray(emailData.cc) ? emailData.cc.join(', ') : emailData.cc) : undefined,
        bcc: emailData.bcc ? (Array.isArray(emailData.bcc) ? emailData.bcc.join(', ') : emailData.bcc) : undefined,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html,
        attachments: emailData.attachments
      };

      const result = await transporter.sendMail(mailOptions);

      // 保存已发送邮件记录
      await prisma.email.create({
        data: {
          uid: Date.now(), // 使用时间戳作为 UID
          accountId: accountId,
          subject: emailData.subject,
          sender: account.email,
          recipient: Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to,
          content: emailData.text || emailData.html || '',
          date: new Date(),
          isRead: true,
          isSent: true,
          folder: 'Sent',
          messageId: result.messageId
        }
      });

      return {
        success: true,
        messageId: result.messageId,
        response: result.response
      };
    } catch (error) {
      console.error('发送邮件失败:', error);
      throw error;
    }
  }

  // 同步邮箱
  async syncAccount(userId: string, accountId: string, enableAI: boolean = false) {
    try {
      // 更新同步状态
      await prisma.emailAccount.update({
        where: { id: accountId },
        data: { 
          status: 'syncing',
          lastSync: new Date()
        }
      });

      const account = await prisma.emailAccount.findFirst({
        where: { id: accountId, userId }
      });

      if (!account) {
        throw new Error('邮箱账户不存在');
      }

      const imapConfig = {
        host: account.imapHost,
        port: account.imapPort,
        secure: account.imapSecure,
        username: account.imapUsername,
        password: account.imapPassword
      };

      await this.syncIMAPEmails(accountId, imapConfig, enableAI);

      // 更新同步状态
      await prisma.emailAccount.update({
        where: { id: accountId },
        data: { 
          status: 'connected',
          lastSync: new Date()
        }
      });

      return { success: true };
    } catch (error) {
      console.error('同步邮箱失败:', error);
      
      // 更新错误状态
      await prisma.emailAccount.update({
        where: { id: accountId },
        data: { status: 'error' }
      });
      
      throw error;
    }
  }

  // 同步IMAP邮件
  private async syncIMAPEmails(accountId: string, config: IMAPConfig, enableAI: boolean = false) {
    return new Promise<void>((resolve, reject) => {
      const imap = new Imap({
        host: config.host,
        port: config.port,
        tls: config.secure,
        user: config.username,
        password: config.password,
        tlsOptions: {
          rejectUnauthorized: false
        }
      });

      imap.once('ready', () => {
        imap.openBox('INBOX', true, (err, box) => {
          if (err) {
            reject(err);
            return;
          }

          // 获取最近100封邮件（包含完整内容）
          const fetch = imap.seq.fetch(`${Math.max(1, box.messages.total - 99)}:*`, {
            bodies: '', // 获取完整邮件内容
            struct: true
          });

          const emails: any[] = [];

          fetch.on('message', (msg, seqno) => {
            let header: any;
            let content = '';
            
            msg.on('body', (stream, info) => {
              let buffer = '';
              stream.on('data', (chunk) => {
                buffer += chunk.toString('ascii');
              });
              stream.once('end', () => {
                if (info.which === 'HEADER') {
                  header = Imap.parseHeader(buffer);
                } else {
                  // 处理邮件正文内容
                  content = buffer;
                }
              });
            });

            msg.once('attributes', (attrs) => {
              emails.push({
                uid: attrs.uid,
                flags: attrs.flags,
                date: attrs.date,
                header: header,
                content: content
              });
            });
          });

          fetch.once('error', (err) => {
            reject(err);
          });

          fetch.once('end', async () => {
            imap.end();
            
            try {
              // 保存邮件到数据库
              for (const email of emails) {
                await this.saveEmail(accountId, email, enableAI);
              }
              resolve();
            } catch (error) {
              reject(error);
            }
          });
        });
      });

      imap.once('error', (err: any) => {
        reject(err);
      });

      imap.connect();
    });
  }

  // 保存邮件到数据库
  private async saveEmail(accountId: string, emailData: any, enableAI: boolean = false) {
    try {
      const existingEmail = await prisma.email.findFirst({
        where: {
          accountId: accountId,
          uid: emailData.uid
        }
      });

      if (existingEmail) {
        return; // 邮件已存在，跳过
      }

      const header = emailData.header;
      const subject = header.subject ? header.subject[0] : '';
      const sender = header.from ? header.from[0] : '';
      const recipient = header.to ? header.to[0] : '';
      const content = emailData.content || ''; // 邮件正文内容

      // 创建邮件记录
      const emailRecord = await prisma.email.create({
        data: {
          uid: emailData.uid,
          accountId: accountId,
          subject: subject,
          sender: sender,
          recipient: recipient,
          textContent: content, // 使用正确的字段名
          date: emailData.date,
          isRead: !emailData.flags.includes('\\Seen'),
          flags: emailData.flags.join(','),
          folder: 'INBOX'
        }
      });

      // 如果启用AI分析，异步进行分析
      if (enableAI && this.aiService && subject && content) {
        try {
          // 调用AI服务进行邮件分析
          const analysisResult = await this.aiService.analyzeEmail({
            email_id: emailRecord.id,
            subject: subject,
            content: content,
            sender: sender
          });

          // 更新邮件记录的AI分析结果
          await prisma.email.update({
            where: { id: emailRecord.id },
            data: {
              aiAnalysis: {
                summary: analysisResult.summary,
                priority: analysisResult.priority,
                sentiment: analysisResult.sentiment,
                tags: analysisResult.tags,
                keyPoints: analysisResult.key_points,
                actionRequired: analysisResult.action_required,
                confidence: analysisResult.confidence,
                analyzedAt: new Date().toISOString()
              },
              // 同时更新一些简化字段方便查询
              category: analysisResult.tags[0] || '其他',
              priority: analysisResult.priority
            }
          });

          // 发送通知
          await this.sendEmailNotifications(accountId, emailRecord, analysisResult);
        } catch (aiError) {
          console.error('AI分析失败，但邮件已保存:', aiError);
          // AI分析失败不影响邮件保存，但仍发送新邮件通知
          await this.sendEmailNotifications(accountId, emailRecord);
        }
      } else {
        // 没有AI分析的情况下也发送新邮件通知
        await this.sendEmailNotifications(accountId, emailRecord);
      }

      return emailRecord;
    } catch (error) {
      console.error('保存邮件失败:', error);
      throw error;
    }
  }

  // 获取邮件列表
  async getEmails(userId: string, filter: EmailFilter) {
    try {
      const where: any = {};
      
      if (filter.accountId) {
        where.accountId = filter.accountId;
      } else {
        // 获取用户所有账户的邮件
        const accounts = await prisma.emailAccount.findMany({
          where: { userId },
          select: { id: true }
        });
        where.accountId = { in: accounts.map(acc => acc.id) };
      }

      if (filter.unreadOnly) {
        where.isRead = false;
      }

      if (filter.search) {
        where.OR = [
          { subject: { contains: filter.search, mode: 'insensitive' } },
          { sender: { contains: filter.search, mode: 'insensitive' } }
        ];
      }

      const emails = await prisma.email.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: ((filter.page || 1) - 1) * (filter.limit || 20),
        take: filter.limit || 20,
        include: {
          account: {
            select: { name: true, email: true }
          }
        }
      });

      const total = await prisma.email.count({ where });

      return {
        emails,
        pagination: {
          page: filter.page || 1,
          limit: filter.limit || 20,
          total,
          pages: Math.ceil(total / (filter.limit || 20))
        }
      };
    } catch (error) {
      console.error('获取邮件列表失败:', error);
      throw new Error('获取邮件列表失败');
    }
  }

  // 获取邮件详情
  async getEmailDetail(userId: string, emailId: string) {
    try {
      const email = await prisma.email.findFirst({
        where: {
          id: emailId,
          account: { userId }
        },
        include: {
          account: {
            select: { name: true, email: true }
          }
        }
      });

      if (!email) {
        throw new Error('邮件不存在');
      }

      return email;
    } catch (error) {
      console.error('获取邮件详情失败:', error);
      throw error;
    }
  }

  // 标记邮件为已读/未读
  async markEmailRead(userId: string, emailId: string, isRead: boolean) {
    try {
      await prisma.email.updateMany({
        where: {
          id: emailId,
          account: { userId }
        },
        data: { isRead }
      });
    } catch (error) {
      console.error('标记邮件状态失败:', error);
      throw error;
    }
  }

  // 获取未读邮件数量
  async getUnreadCount(accountId: string): Promise<number> {
    try {
      return await prisma.email.count({
        where: {
          accountId,
          isRead: false
        }
      });
    } catch (error) {
      console.error('获取未读邮件数量失败:', error);
      return 0;
    }
  }

  // 获取邮件统计数据
  async getEmailStats(userId: string, timeRange: string) {
    try {
      const accounts = await prisma.emailAccount.findMany({
        where: { userId },
        select: { id: true }
      });

      const accountIds = accounts.map(acc => acc.id);

      // 计算时间范围
      const now = new Date();
      let startDate: Date;

      switch (timeRange) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'quarter':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      const [totalEmails, unreadEmails, readEmails, todayEmails] = await Promise.all([
        prisma.email.count({ where: { accountId: { in: accountIds } } }),
        prisma.email.count({ where: { accountId: { in: accountIds }, isRead: false } }),
        prisma.email.count({ where: { accountId: { in: accountIds }, isRead: true } }),
        prisma.email.count({ 
          where: { 
            accountId: { in: accountIds },
            date: { gte: new Date(now.toDateString()) }
          } 
        })
      ]);

      // 模拟其他统计数据
      return {
        totalEmails,
        unreadEmails,
        readEmails,
        repliedEmails: Math.floor(readEmails * 0.7),
        todayEmails,
        weeklyChange: 12.5,
        avgResponseTime: 4.2,
        categories: {
          '工作': Math.floor(totalEmails * 0.45),
          '个人': Math.floor(totalEmails * 0.19),
          '通知': Math.floor(totalEmails * 0.15),
          '营销': Math.floor(totalEmails * 0.12),
          '垃圾邮件': Math.floor(totalEmails * 0.09)
        },
        priorities: {
          high: Math.floor(unreadEmails * 0.15),
          medium: Math.floor(unreadEmails * 0.35),
          low: Math.floor(unreadEmails * 0.50)
        },
        timeStats: {
          labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
          data: [25, 32, 18, 24, 41, 15, 8]
        }
      };
    } catch (error) {
      console.error('获取邮件统计失败:', error);
      throw error;
    }
  }

  // 发送邮件通知
  private async sendEmailNotifications(accountId: string, email: any, aiAnalysis?: any) {
    try {
      // 获取邮箱账户和用户信息
      const account = await prisma.emailAccount.findUnique({
        where: { id: accountId },
        include: { user: true }
      });

      if (!account) {
        console.error('未找到邮箱账户:', accountId);
        return;
      }

      const userId = account.userId;

      // 发送新邮件通知
      await this.notificationService.notifyNewEmail(userId, {
        id: email.id,
        subject: email.subject,
        sender: email.sender,
        priority: email.priority || 'medium'
      });

      // 如果有AI分析结果且是重要邮件，发送重要邮件通知
      if (aiAnalysis && aiAnalysis.priority === 'high') {
        await this.notificationService.notifyImportantEmail(userId, {
          id: email.id,
          subject: email.subject,
          sender: email.sender,
          priority: 'high'
        }, aiAnalysis);
      }
    } catch (error) {
      console.error('发送邮件通知失败:', error);
      // 通知发送失败不影响主流程
    }
  }
}