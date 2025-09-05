import prisma from '../config/database';
import OpenAI from 'openai';

// OpenAI 客户端初始化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

// 检查 OpenAI API 是否可用
const isOpenAIAvailable = () => {
  return !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-'));
};

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

  // 分析单个邮件
  async analyzeEmail(emailData: {
    email_id: string;
    subject: string;
    content: string;
    sender: string;
  }) {
    try {
      // 如果 OpenAI API 不可用，使用模拟分析
      if (!isOpenAIAvailable()) {
        console.log('⚠️  OpenAI API 未配置，使用模拟分析');
        return this.getSimulatedAnalysis(emailData);
      }

      // 使用 OpenAI 进行真正的智能分析
      const analysisPrompt = this.buildAnalysisPrompt(emailData);
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的邮件分析助手，能够准确分析邮件内容并提供有用的建议。请用 JSON 格式返回分析结果。'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('OpenAI 返回为空');
      }

      // 解析 JSON 响应
      const analysisResult = this.parseAIResponse(response);
      return analysisResult;

    } catch (error) {
      console.error('AI分析邮件失败:', error);
      // 失败时返回模拟结果
      return this.getSimulatedAnalysis(emailData);
    }
  }

  // 构建分析提示词
  private buildAnalysisPrompt(emailData: {
    subject: string;
    content: string;
    sender: string;
  }): string {
    return `
请分析以下邮件内容并提供结构化分析：

发件人：${emailData.sender}
主题：${emailData.subject}
内容：${emailData.content.substring(0, 1000)}

请提供以下分析（用JSON格式返回）：
{
  "summary": "邮件内容摘要（50字以内）",
  "priority": "high/medium/low",
  "sentiment": "positive/neutral/negative",
  "tags": ["相关标签数组，最多5个"],
  "key_points": ["关键要点，最多3个"],
  "action_required": true/false,
  "confidence": 0.0-1.0
}
    `.trim();
  }

  // 解析 AI 响应
  private parseAIResponse(response: string): any {
    try {
      // 尝试从响应中提取 JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const parsed = JSON.parse(jsonStr);
        
        // 验证必需字段
        return {
          summary: parsed.summary || '无法生成摘要',
          priority: ['high', 'medium', 'low'].includes(parsed.priority) ? parsed.priority : 'medium',
          sentiment: ['positive', 'neutral', 'negative'].includes(parsed.sentiment) ? parsed.sentiment : 'neutral',
          tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : ['普通'],
          key_points: Array.isArray(parsed.key_points) ? parsed.key_points.slice(0, 3) : ['需要关注'],
          action_required: Boolean(parsed.action_required),
          confidence: typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0.7
        };
      }
    } catch (error) {
      console.error('解析 AI 响应失败:', error);
    }
    
    // 解析失败时返回默认结果
    return {
      summary: '无法生成摘要',
      priority: 'medium',
      sentiment: 'neutral',
      tags: ['普通'],
      key_points: ['需要查看'],
      action_required: false,
      confidence: 0.5
    };
  }

  // 模拟分析（当 OpenAI 不可用时）
  private getSimulatedAnalysis(emailData: {
    subject: string;
    content: string;
    sender: string;
  }): any {
    const subject = emailData.subject.toLowerCase();
    const content = emailData.content.toLowerCase();
    const sender = emailData.sender.toLowerCase();
    
    // 简单的规则基分析
    let priority = 'medium';
    let sentiment = 'neutral';
    let tags = ['一般'];
    let actionRequired = false;
    
    // 优先级判断
    if (subject.includes('紧急') || subject.includes('重要') || subject.includes('urgent') || subject.includes('important')) {
      priority = 'high';
      actionRequired = true;
    } else if (subject.includes('通知') || subject.includes('notification') || sender.includes('noreply')) {
      priority = 'low';
    }
    
    // 情感分析
    if (content.includes('谢谢') || content.includes('感谢') || content.includes('thank')) {
      sentiment = 'positive';
    } else if (content.includes('问题') || content.includes('错误') || content.includes('error') || content.includes('problem')) {
      sentiment = 'negative';
    }
    
    // 标签生成
    if (subject.includes('会议') || subject.includes('meeting')) {
      tags = ['会议', '工作'];
      actionRequired = true;
    } else if (subject.includes('项目') || subject.includes('project')) {
      tags = ['项目', '工作'];
    } else if (sender.includes('noreply') || sender.includes('system')) {
      tags = ['系统通知'];
    }
    
    return {
      summary: `关于 "${emailData.subject}" 的邮件，来自 ${emailData.sender}`,
      priority,
      sentiment,
      tags,
      key_points: ['需要查看详细内容'],
      action_required: actionRequired,
      confidence: 0.6
    };
  }

  // AI 智能聊天功能
  async chatWithAI(userId: string, message: string, context?: string): Promise<{
    reply: string;
    suggestions: string[];
    timestamp: string;
  }> {
    try {
      if (!isOpenAIAvailable()) {
        return {
          reply: '抱歉，AI 服务当前不可用。请检查 OpenAI API 配置。',
          suggestions: ['查看邮件列表', '管理邮箱账户'],
          timestamp: new Date().toISOString()
        };
      }

      // 获取用户邮件上下文
      const emailContext = await this.getUserEmailContext(userId);
      
      const systemPrompt = `
你是一个专业的邮件管理助手，可以帮助用户：
1. 分析和筛选邮件
2. 找到重要邮件
3. 提供邮件处理建议
4. 回答邮件相关问题

用户当前邮件情况：
${emailContext}

请用中文回复，语气友好专业。
      `.trim();

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 300,
        temperature: 0.7
      });

      const reply = completion.choices[0]?.message?.content || '抱歉，暂时无法处理您的请求。';
      
      // 生成智能建议
      const suggestions = await this.generateSmartSuggestions(userId, message);

      return {
        reply,
        suggestions,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('AI 聊天失败:', error);
      return {
        reply: '抱歉，处理您的消息时出现错误。请稍后重试。',
        suggestions: ['查看未读邮件', '分析邮件趋势'],
        timestamp: new Date().toISOString()
      };
    }
  }

  // 获取用户邮件上下文
  private async getUserEmailContext(userId: string): Promise<string> {
    try {
      const accounts = await prisma.emailAccount.findMany({
        where: { userId },
        select: { id: true, name: true, email: true }
      });

      const accountIds = accounts.map(acc => acc.id);
      
      const [totalEmails, unreadEmails] = await Promise.all([
        prisma.email.count({ where: { accountId: { in: accountIds } } }),
        prisma.email.count({ where: { accountId: { in: accountIds }, isRead: false } })
      ]);

      return `
邮箱账户：${accounts.map(acc => acc.name).join(', ')}
邮件总数：${totalEmails}
未读邮件：${unreadEmails}
      `.trim();
    } catch (error) {
      return '无法获取邮件信息';
    }
  }

  // 生成智能建议
  private async generateSmartSuggestions(userId: string, userMessage: string): Promise<string[]> {
    const message = userMessage.toLowerCase();
    const suggestions = [];

    if (message.includes('未读') || message.includes('unread')) {
      suggestions.push('查看未读邮件', '按优先级排序');
    }
    
    if (message.includes('重要') || message.includes('important')) {
      suggestions.push('筛选重要邮件', '设置提醒');
    }
    
    if (message.includes('搜索') || message.includes('search')) {
      suggestions.push('高级搜索', '按发件人筛选');
    }
    
    if (message.includes('统计') || message.includes('stats')) {
      suggestions.push('查看邮件统计', '生成报告');
    }

    // 默认建议
    if (suggestions.length === 0) {
      suggestions.push('查看未读邮件', '分析邮件模式', '管理邮箱账户');
    }

    return suggestions.slice(0, 3); // 最多返回3个建议
  }

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
  
  // 辅助方法：按数据分类邮件
  private async classifyEmailByData(subject: string, sender: string, content: string) {
    try {
      const subjectLower = subject.toLowerCase();
      const senderLower = sender.toLowerCase();
      const contentLower = content.toLowerCase();
      
      let category = '其他';
      let priority = 'low';
      let tags: string[] = [];
      
      // 工作邮件
      if (subjectLower.includes('会议') || subjectLower.includes('meeting') || 
          subjectLower.includes('项目') || subjectLower.includes('project') ||
          senderLower.includes('work') || senderLower.includes('company')) {
        category = '工作';
        priority = 'medium';
        tags.push('工作相关');
      }
      
      // 通知邮件
      if (subjectLower.includes('通知') || subjectLower.includes('notification') ||
          subjectLower.includes('提醒') || subjectLower.includes('reminder')) {
        category = '通知';
        priority = subjectLower.includes('重要') || subjectLower.includes('urgent') ? 'high' : 'low';
        tags.push('系统通知');
      }
      
      // 营销邮件
      if (subjectLower.includes('优惠') || subjectLower.includes('促销') ||
          subjectLower.includes('sale') || subjectLower.includes('offer') ||
          senderLower.includes('no-reply') || senderLower.includes('noreply')) {
        category = '营销';
        priority = 'low';
        tags.push('营销推广');
      }
      
      // 重要性评估
      if (subjectLower.includes('紧急') || subjectLower.includes('urgent') ||
          subjectLower.includes('重要') || subjectLower.includes('important')) {
        priority = 'high';
        tags.push('高优先级');
      }
      
      return {
        category,
        priority,
        tags,
        confidence: 0.75
      };
    } catch (error) {
      return {
        category: '其他',
        priority: 'medium',
        tags: ['待分类'],
        confidence: 0.5
      };
    }
  }
  
  // 辅助方法：按数据评估优先级
  private async assessEmailPriorityByData(subject: string, sender: string, content: string) {
    try {
      const classification = await this.classifyEmailByData(subject, sender, content);
      
      let score = 50; // 基础分数
      
      if (classification.priority === 'high') score += 30;
      if (classification.priority === 'medium') score += 15;
      
      if (classification.category === '工作') score += 20;
      if (classification.category === '通知') score += 10;
      
      const priority = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low';
      
      return {
        priority,
        score,
        factors: classification.tags
      };
    } catch (error) {
      return {
        priority: 'medium',
        score: 50,
        factors: []
      };
    }
  }
  
  // 辅助方法：生成邮件摘要
  private generateEmailSummary(subject: string, content: string): string {
    try {
      // 简单的摘要生成逻辑
      if (!content || content.length < 50) {
        return `关于 "${subject}" 的邮件`;
      }
      
      // 提取前100个字符作为摘要
      let summary = content.substring(0, 100).replace(/\n/g, ' ').trim();
      if (content.length > 100) {
        summary += '...';
      }
      
      return summary;
    } catch (error) {
      return `关于 "${subject}" 的邮件`;
    }
  }
  
  // 辅助方法：情感分析
  private analyzeSentiment(content: string): string {
    try {
      const contentLower = content.toLowerCase();
      
      // 积极情感关键词
      const positiveKeywords = ['谢谢', '感谢', '太棒了', '很好', '完美', 'thank', 'great', 'excellent', 'perfect'];
      
      // 消极情感关键词
      const negativeKeywords = ['问题', '错误', '失败', '不满', '抱怨', 'problem', 'error', 'issue', 'complaint'];
      
      let positiveCount = 0;
      let negativeCount = 0;
      
      positiveKeywords.forEach(keyword => {
        if (contentLower.includes(keyword)) positiveCount++;
      });
      
      negativeKeywords.forEach(keyword => {
        if (contentLower.includes(keyword)) negativeCount++;
      });
      
      if (positiveCount > negativeCount) return 'positive';
      if (negativeCount > positiveCount) return 'negative';
      return 'neutral';
    } catch (error) {
      return 'neutral';
    }
  }
  
  // 辅助方法：提取关键要点
  private extractKeyPoints(content: string): string[] {
    try {
      const keyPoints: string[] = [];
      const contentLower = content.toLowerCase();
      
      // 检查常见的关键要点
      if (contentLower.includes('截止') || contentLower.includes('deadline')) {
        keyPoints.push('有截止日期');
      }
      
      if (contentLower.includes('会议') || contentLower.includes('meeting')) {
        keyPoints.push('需要参加会议');
      }
      
      if (contentLower.includes('附件') || contentLower.includes('attachment')) {
        keyPoints.push('包含附件');
      }
      
      if (contentLower.includes('回复') || contentLower.includes('reply') || contentLower.includes('回复')) {
        keyPoints.push('需要回复');
      }
      
      if (keyPoints.length === 0) {
        keyPoints.push('需要查看内容');
      }
      
      return keyPoints;
    } catch (error) {
      return ['需要查看内容'];
    }
  }
  
  // 辅助方法：检查是否需要行动
  private checkActionRequired(subject: string, content: string): boolean {
    try {
      const combined = (subject + ' ' + content).toLowerCase();
      
      // 需要行动的关键词
      const actionKeywords = [
        '请', '需要', '必须', '应该', '建议', '希望', '要求',
        'please', 'need', 'must', 'should', 'require', 'request',
        '回复', '确认', '处理', '完成', '提交',
        'reply', 'confirm', 'process', 'complete', 'submit'
      ];
      
      return actionKeywords.some(keyword => combined.includes(keyword));
    } catch (error) {
      return true; // 默认需要行动
    }
  }
}