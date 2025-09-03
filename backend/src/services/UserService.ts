import { User, Prisma } from '@prisma/client';
import prisma from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface CreateUserData {
  email: string;
  name: string;
  avatarUrl?: string;
  provider: string;
  providerId: string;
  preferences?: Record<string, any>;
}

export interface UpdateUserData {
  name?: string;
  avatarUrl?: string;
  preferences?: Record<string, any>;
  locale?: string;
  timezone?: string;
}

export class UserService {
  /**
   * 创建或更新OAuth用户
   */
  async createOrUpdateOAuthUser(data: CreateUserData): Promise<User> {
    const { provider, providerId, ...userData } = data;

    // 首先查找是否存在OAuth提供商记录
    const existingOAuth = await prisma.userOauthProvider.findUnique({
      where: {
        provider_providerUserId: {
          provider,
          providerUserId: providerId,
        },
      },
      include: {
        user: true,
      },
    });

    if (existingOAuth) {
      // 更新现有用户信息
      return await prisma.user.update({
        where: { id: existingOAuth.user.id },
        data: {
          ...userData,
          lastLoginAt: new Date(),
        },
      });
    }

    // 检查是否存在相同邮箱的用户
    let user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      // 创建新用户
      user = await prisma.user.create({
        data: {
          ...userData,
          lastLoginAt: new Date(),
        },
      });
    }

    // 创建OAuth提供商关联
    await prisma.userOauthProvider.create({
      data: {
        userId: user.id,
        provider,
        providerUserId: providerId,
      },
    });

    return user;
  }

  /**
   * 根据ID获取用户
   */
  async findById(id: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        mailAccounts: {
          where: { isActive: true },
          select: {
            id: true,
            email: true,
            displayName: true,
            provider: true,
            isActive: true,
            lastSyncAt: true,
          },
        },
      },
    });
  }

  /**
   * 根据邮箱获取用户
   */
  async findByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * 更新用户信息
   */
  async updateUser(id: string, data: UpdateUserData): Promise<User> {
    return await prisma.user.update({
      where: { id },
      data,
    });
  }

  /**
   * 更新用户最后登录时间
   */
  async updateLastLogin(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  /**
   * 获取用户邮件统计
   */
  async getUserEmailStats(userId: string) {
    const stats = await prisma.$queryRaw`
      SELECT 
        COUNT(*)::int as total_emails,
        COUNT(CASE WHEN NOT is_read THEN 1 END)::int as unread_emails,
        COUNT(CASE WHEN is_starred THEN 1 END)::int as starred_emails,
        COUNT(CASE WHEN is_important THEN 1 END)::int as important_emails,
        COUNT(CASE WHEN received_at > NOW() - INTERVAL '24 hours' THEN 1 END)::int as emails_today
      FROM emails 
      WHERE user_id = ${userId}::uuid AND NOT is_deleted
    `;

    return (stats as any[])[0] || {
      total_emails: 0,
      unread_emails: 0,
      starred_emails: 0,
      important_emails: 0,
      emails_today: 0,
    };
  }

  /**
   * 创建系统标签
   */
  async createSystemTags(userId: string): Promise<void> {
    const systemTags = [
      { name: '重要', color: '#EF4444', description: '重要邮件' },
      { name: '工作', color: '#3B82F6', description: '工作相关邮件' },
      { name: '个人', color: '#10B981', description: '个人邮件' },
      { name: '待回复', color: '#F59E0B', description: '需要回复的邮件' },
      { name: '已处理', color: '#6B7280', description: '已处理的邮件' },
    ];

    for (const tag of systemTags) {
      await prisma.userTag.upsert({
        where: {
          userId_name: {
            userId,
            name: tag.name,
          },
        },
        update: {},
        create: {
          userId,
          ...tag,
          isSystem: true,
        },
      });
    }
  }

  /**
   * 软删除用户（保留数据但标记为不活跃）
   */
  async deactivateUser(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * 获取用户偏好设置
   */
  async getUserPreferences(userId: string): Promise<Record<string, any>> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });

    return (user?.preferences as Record<string, any>) || {};
  }

  /**
   * 更新用户偏好设置
   */
  async updateUserPreferences(
    userId: string,
    preferences: Record<string, any>
  ): Promise<void> {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });

    const currentPrefs = (currentUser?.preferences as Record<string, any>) || {};
    const updatedPrefs = { ...currentPrefs, ...preferences };

    await prisma.user.update({
      where: { id: userId },
      data: { preferences: updatedPrefs },
    });
  }
}