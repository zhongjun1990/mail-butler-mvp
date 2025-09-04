import * as Imap from 'imap';
import { simpleParser } from 'mailparser';
import prisma from '../config/database';

interface IMAPConfig {
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
  userId: string;
}

interface EmailFilter {
  accountId?: string;
  folder?: string;
  page?: number;
  limit?: number;
  search?: string;
  unreadOnly?: boolean;
}

export class EmailService {
  
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
  async addAccount(userId: string, accountData: Omit<EmailAccount, 'userId'>) {
    try {
      // 首先测试连接
      const testResult = await this.testIMAPConnection(accountData.imapConfig);
      if (!testResult.success) {
        throw new Error(`IMAP连接失败: ${testResult.error}`);
      }

      // 加密存储IMAP配置（实际项目中应该使用加密）
      const account = await prisma.emailAccount.create({
        data: {
          name: accountData.name,
          email: accountData.email,
          provider: accountData.provider,
          imapHost: accountData.imapConfig.host,
          imapPort: accountData.imapConfig.port,
          imapSecure: accountData.imapConfig.secure,
          imapUsername: accountData.imapConfig.username,
          imapPassword: accountData.imapConfig.password, // 实际应用中需要加密
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
      this.syncAccount(userId, account.id).catch(error => 
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

      imap.once('error', (err) => {
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

  // 同步邮箱
  async syncAccount(userId: string, accountId: string) {
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

      await this.syncIMAPEmails(accountId, imapConfig);

      // 更新同步状态
      await prisma.emailAccount.update({
        where: { id: accountId },
        data: { 
          status: 'connected',
          lastSync: new Date()
        }
      });

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
  private async syncIMAPEmails(accountId: string, config: IMAPConfig) {
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

          // 获取最近100封邮件
          const fetch = imap.seq.fetch(`${Math.max(1, box.messages.total - 99)}:*`, {
            bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
            struct: true
          });

          const emails = [];

          fetch.on('message', (msg, seqno) => {
            let header;
            
            msg.on('body', (stream, info) => {
              let buffer = '';
              stream.on('data', (chunk) => {
                buffer += chunk.toString('ascii');
              });
              stream.once('end', () => {
                header = Imap.parseHeader(buffer);
              });
            });

            msg.once('attributes', (attrs) => {
              emails.push({
                uid: attrs.uid,
                flags: attrs.flags,
                date: attrs.date,
                header: header
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
                await this.saveEmail(accountId, email);
              }
              resolve();
            } catch (error) {
              reject(error);
            }
          });
        });
      });

      imap.once('error', (err) => {
        reject(err);
      });

      imap.connect();
    });
  }

  // 保存邮件到数据库
  private async saveEmail(accountId: string, emailData: any) {
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
      await prisma.email.create({
        data: {
          uid: emailData.uid,
          accountId: accountId,
          subject: header.subject ? header.subject[0] : '',
          sender: header.from ? header.from[0] : '',
          recipient: header.to ? header.to[0] : '',
          date: emailData.date,
          isRead: !emailData.flags.includes('\\Seen'),
          flags: emailData.flags.join(','),
          folder: 'INBOX'
        }
      });
    } catch (error) {
      console.error('保存邮件失败:', error);
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
}