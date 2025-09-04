import prisma from '../config/database';

interface AnalysisCard {
  title: string;
  description: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  action?: string;
}

interface EmailInsights {
  responseTimeAnalysis: {
    average: number;
    trend: 'improving' | 'declining' | 'stable';
    recommendation: string;
  };
  categoryDistribution: Record<string, number>;
  peakTimes: Array<{ hour: number; count: number }>;
  senderAnalysis: Array<{ sender: string; count: number; avgResponseTime: number }>;
}

export class AIService {

  // 分析邮件模式
  async analyzeEmailPatterns(userId: string, timeRange: string): Promise<AnalysisCard[]> {
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

      // 获取邮件数据进行分析
      const emails = await prisma.email.findMany({
        where: {
          accountId: { in: accountIds },
          date: { gte: startDate }
        },
        orderBy: { date: 'desc' }
      });

      // 生成分析卡片
      const analysisCards: AnalysisCard[] = [];

      // 1. 未读邮件分析
      const unreadEmails = emails.filter(email => !email.isRead);
      if (unreadEmails.length > 10) {
        analysisCards.push({
          title: '未读邮件较多',
          description: `您有 ${unreadEmails.length} 封未读邮件，建议及时处理以免遗漏重要信息`,
          type: unreadEmails.length > 20 ? 'urgent' : 'warning',
          action: '查看未读邮件'
        });
      }

      // 2. 发件人分析
      const senderCount: Record<string, number> = {};
      emails.forEach(email => {
        const sender = this.extractEmailAddress(email.sender);
        senderCount[sender] = (senderCount[sender] || 0) + 1;
      });

      const topSender = Object.entries(senderCount)
        .sort((a, b) => b[1] - a[1])[0];

      if (topSender && topSender[1] > 5) {
        analysisCards.push({
          title: '频繁发件人',
          description: `${topSender[0]} 在此期间发送了 ${topSender[1]} 封邮件，可能需要重点关注`,
          type: 'info'
        });
      }

      // 3. 邮件量趋势分析
      const todayEmails = emails.filter(email => {
        const emailDate = new Date(email.date);
        const today = new Date();
        return emailDate.toDateString() === today.toDateString();
      }).length;

      const avgDailyEmails = emails.length / Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      if (todayEmails > avgDailyEmails * 1.5) {
        analysisCards.push({
          title: '邮件量激增',
          description: `今日收到 ${todayEmails} 封邮件，比平均水平高出 ${Math.round((todayEmails / avgDailyEmails - 1) * 100)}%`,
          type: 'info'
        });
      }

      // 4. 时间分布分析
      const hourlyDistribution: Record<number, number> = {};
      emails.forEach(email => {
        const hour = new Date(email.date).getHours();
        hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
      });

      const peakHour = Object.entries(hourlyDistribution)
        .sort((a, b) => b[1] - a[1])[0];

      if (peakHour) {
        analysisCards.push({
          title: '邮件高峰时段',
          description: `${peakHour[0]}:00 是您收邮件的高峰时段，建议在此时段专注处理邮件`,
          type: 'success'
        });
      }

      // 如果没有足够数据，返回默认分析
      if (analysisCards.length === 0) {
        analysisCards.push({
          title: '数据积累中',
          description: '系统正在学习您的邮件模式，更多智能分析即将推出',
          type: 'info'
        });
      }

      return analysisCards;
    } catch (error) {
      console.error('分析邮件模式失败:', error);
      return [{
        title: '分析服务异常',
        description: '无法获取邮件分析数据，请稍后重试',
        type: 'warning'
      }];
    }
  }

  // 邮件分类
  async classifyEmail(userId: string, emailId: string) {
    try {
      const email = await prisma.email.findFirst({
        where: {
          id: emailId,
          account: { userId }
        }
      });

      if (!email) {
        throw new Error('邮件不存在');
      }

      // 简单的规则基分类
      const subject = email.subject.toLowerCase();
      const sender = email.sender.toLowerCase();

      let category = '其他';
      let priority = 'low';
      let tags: string[] = [];

      // 工作邮件
      if (subject.includes('会议') || subject.includes('meeting') || 
          subject.includes('项目') || subject.includes('project') ||
          sender.includes('work') || sender.includes('company')) {
        category = '工作';
        priority = 'medium';
        tags.push('工作相关');
      }

      // 通知邮件
      if (subject.includes('通知') || subject.includes('notification') ||
          subject.includes('提醒') || subject.includes('reminder')) {
        category = '通知';
        priority = subject.includes('重要') || subject.includes('urgent') ? 'high' : 'low';
        tags.push('系统通知');
      }

      // 营销邮件
      if (subject.includes('优惠') || subject.includes('促销') ||
          subject.includes('sale') || subject.includes('offer') ||
          sender.includes('no-reply') || sender.includes('noreply')) {
        category = '营销';
        priority = 'low';
        tags.push('营销推广');
      }

      // 重要性评估
      if (subject.includes('紧急') || subject.includes('urgent') ||
          subject.includes('重要') || subject.includes('important')) {
        priority = 'high';
        tags.push('高优先级');
      }

      return {
        category,
        priority,
        tags,
        confidence: 0.75 // 模拟置信度
      };
    } catch (error) {
      console.error('邮件分类失败:', error);
      throw error;
    }
  }

  // 生成回复建议
  async generateReplySuggestions(userId: string, emailId: string, context: string = 'formal') {
    try {
      const email = await prisma.email.findFirst({
        where: {
          id: emailId,
          account: { userId }
        }
      });

      if (!email) {
        throw new Error('邮件不存在');
      }

      // 基于邮件内容生成回复模板
      const suggestions = [];

      if (context === 'formal') {
        suggestions.push({
          type: '确认收到',
          text: '感谢您的邮件，我已收到并将尽快处理。',
          confidence: 0.9
        });

        suggestions.push({
          type: '需要更多信息',
          text: '谢谢您的邮件。为了更好地协助您，我需要一些额外信息...',
          confidence: 0.8
        });

        suggestions.push({
          type: '安排会议',
          text: '基于您的邮件，我建议我们安排一次会议详细讨论。',
          confidence: 0.7
        });
      } else {
        suggestions.push({
          type: '友好回复',
          text: '收到！我会处理这个事情。',
          confidence: 0.8
        });

        suggestions.push({
          type: '询问详情',
          text: '好的，能再详细说说吗？',
          confidence: 0.7
        });
      }

      return {
        suggestions,
        context: context,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('生成回复建议失败:', error);
      throw error;
    }
  }

  // 评估邮件优先级
  async assessEmailPriority(userId: string, emailId: string) {
    try {
      const classification = await this.classifyEmail(userId, emailId);
      
      // 基于分类结果和其他因素评估优先级
      let score = 50; // 基础分数
      
      if (classification.priority === 'high') score += 30;
      if (classification.priority === 'medium') score += 15;
      
      if (classification.category === '工作') score += 20;
      if (classification.category === '通知') score += 10;
      
      const priority = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low';
      
      return {
        priority,
        score,
        factors: classification.tags,
        recommendation: this.getPriorityRecommendation(priority)
      };
    } catch (error) {
      console.error('评估邮件优先级失败:', error);
      throw error;
    }
  }

  // 设置智能提醒
  async setSmartReminder(userId: string, reminderData: any) {
    try {
      // 实际项目中会保存到提醒表
      return {
        id: 'reminder_' + Date.now(),
        emailId: reminderData.emailId,
        reminderType: reminderData.reminderType,
        reminderTime: reminderData.reminderTime,
        message: reminderData.message,
        status: 'active',
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('设置智能提醒失败:', error);
      throw error;
    }
  }

  // 获取邮件洞察
  async getEmailInsights(userId: string, options: any): Promise<EmailInsights> {
    try {
      const accounts = await prisma.emailAccount.findMany({
        where: { userId },
        select: { id: true }
      });

      const accountIds = accounts.map(acc => acc.id);

      // 模拟洞察数据
      return {
        responseTimeAnalysis: {
          average: 4.2,
          trend: 'improving',
          recommendation: '您的回复速度在改善，建议继续保持'
        },
        categoryDistribution: {
          '工作': 45,
          '个人': 25,
          '通知': 20,
          '营销': 10
        },
        peakTimes: [
          { hour: 9, count: 15 },
          { hour: 14, count: 12 },
          { hour: 18, count: 8 }
        ],
        senderAnalysis: [
          { sender: 'work@company.com', count: 25, avgResponseTime: 2.1 },
          { sender: 'notifications@system.com', count: 18, avgResponseTime: 24.0 }
        ]
      };
    } catch (error) {
      console.error('获取邮件洞察失败:', error);
      throw error;
    }
  }

  // 智能搜索
  async smartSearch(userId: string, query: string, filters: any) {
    try {
      const accounts = await prisma.emailAccount.findMany({
        where: { userId },
        select: { id: true }
      });

      const accountIds = accounts.map(acc => acc.id);

      const searchConditions: any = {
        accountId: { in: accountIds },
        OR: [
          { subject: { contains: query, mode: 'insensitive' } },
          { sender: { contains: query, mode: 'insensitive' } }
        ]
      };

      if (filters.dateRange) {
        searchConditions.date = {
          gte: new Date(filters.dateRange.start),
          lte: new Date(filters.dateRange.end)
        };
      }

      if (filters.isUnread !== undefined) {
        searchConditions.isRead = !filters.isUnread;
      }

      const results = await prisma.email.findMany({
        where: searchConditions,
        orderBy: { date: 'desc' },
        take: 50,
        include: {
          account: {
            select: { name: true, email: true }
          }
        }
      });

      return {
        results,
        query,
        totalFound: results.length,
        searchTime: Date.now(), // 模拟搜索时间
        suggestions: this.generateSearchSuggestions(query)
      };
    } catch (error) {
      console.error('智能搜索失败:', error);
      throw error;
    }
  }

  // 生成报告
  async generateReport(userId: string, options: any) {
    try {
      const stats = await this.getEmailInsights(userId, options);
      
      if (options.format === 'csv') {
        // 生成CSV格式报告
        let csv = 'Category,Count,Percentage\n';
        Object.entries(stats.categoryDistribution).forEach(([category, count]) => {
          const total = Object.values(stats.categoryDistribution).reduce((sum, c) => sum + c, 0);
          const percentage = ((count / total) * 100).toFixed(1);
          csv += `${category},${count},${percentage}%\n`;
        });
        return csv;
      }

      // JSON格式报告
      return {
        reportId: 'report_' + Date.now(),
        generatedAt: new Date().toISOString(),
        timeRange: options.timeRange,
        userId: userId,
        data: stats,
        summary: {
          totalEmails: Object.values(stats.categoryDistribution).reduce((sum, c) => sum + c, 0),
          avgResponseTime: stats.responseTimeAnalysis.average,
          mostActiveHour: stats.peakTimes[0]?.hour || 9
        }
      };
    } catch (error) {
      console.error('生成报告失败:', error);
      throw error;
    }
  }

  // 辅助方法：提取邮箱地址
  private extractEmailAddress(emailString: string): string {
    const match = emailString.match(/<(.+?)>/) || emailString.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    return match ? match[1] || match[0] : emailString;
  }

  // 辅助方法：获取优先级建议
  private getPriorityRecommendation(priority: string): string {
    switch (priority) {
      case 'high':
        return '建议立即处理，这封邮件可能包含重要信息';
      case 'medium':
        return '建议在今天内处理';
      case 'low':
        return '可以稍后处理，不是紧急邮件';
      default:
        return '按正常流程处理';
    }
  }

  // 辅助方法：生成搜索建议
  private generateSearchSuggestions(query: string): string[] {
    const suggestions = [];
    
    if (query.includes('@')) {
      suggestions.push('尝试搜索发件人姓名');
    }
    
    if (/\d{4}/.test(query)) {
      suggestions.push('按日期范围搜索');
    }
    
    suggestions.push('使用关键词搜索');
    suggestions.push('添加时间筛选');
    
    return suggestions.slice(0, 3);
  }
}