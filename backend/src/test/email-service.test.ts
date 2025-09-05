import { EmailService } from '../services/EmailService';
import { AIService } from '../services/AIService';
import prisma from '../config/database';

// 测试邮件服务功能
describe('EmailService IMAP/SMTP Integration', () => {
  let emailService: EmailService;
  let testUserId: string;
  let testAccountId: string;

  beforeAll(async () => {
    emailService = new EmailService();
    
    // 创建测试用户
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: '测试用户',
        provider: 'test',
        providerId: 'test123'
      }
    });
    testUserId = testUser.id;
  });

  afterAll(async () => {
    // 清理测试数据
    if (testAccountId) {
      await emailService.deleteAccount(testUserId, testAccountId);
    }
    await prisma.user.delete({ where: { id: testUserId } });
    await prisma.$disconnect();
  });

  test('应该能够检测邮箱提供商', () => {
    expect(EmailService.detectProvider('test@gmail.com')).toBe('gmail');
    expect(EmailService.detectProvider('test@outlook.com')).toBe('outlook');
    expect(EmailService.detectProvider('test@163.com')).toBe('163');
    expect(EmailService.detectProvider('test@qq.com')).toBe('qq');
    expect(EmailService.detectProvider('test@custom.com')).toBe('custom');
  });

  test('应该能够获取提供商配置', () => {
    const gmailConfig = EmailService.getProviderConfig('gmail');
    expect(gmailConfig.imap.host).toBe('imap.gmail.com');
    expect(gmailConfig.smtp.host).toBe('smtp.gmail.com');

    const outlookConfig = EmailService.getProviderConfig('outlook');
    expect(outlookConfig.imap.host).toBe('outlook.office365.com');
    expect(outlookConfig.smtp.host).toBe('smtp.office365.com');
  });

  test('添加Gmail账户应该抛出认证错误（预期）', async () => {
    // 使用无效凭据测试，应该会失败
    await expect(emailService.addAccount(testUserId, {
      name: '测试Gmail',
      email: 'test@gmail.com',
      password: 'invalid_password'
    })).rejects.toThrow('IMAP连接失败');
  });

  test('应该能够测试IMAP连接', async () => {
    const config = {
      host: 'invalid.host.com',
      port: 993,
      secure: true,
      username: 'test@test.com',
      password: 'invalid'
    };

    const result = await emailService.testIMAPConnection(config);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('应该能够测试SMTP连接', async () => {
    const config = {
      host: 'invalid.host.com',
      port: 587,
      secure: false,
      username: 'test@test.com',
      password: 'invalid'
    };

    const result = await emailService.testSMTPConnection(config);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

// 测试AI分析功能
describe('AIService Email Analysis', () => {
  let aiService: AIService;

  beforeAll(() => {
    aiService = new AIService();
  });

  test('应该能够分析邮件内容', async () => {
    const emailData = {
      email_id: 'test-123',
      subject: '重要会议通知 - 项目讨论',
      content: '您好，请确认明天下午2点的重要会议，我们将讨论项目进度。请及时回复。',
      sender: 'manager@company.com'
    };

    const result = await aiService.analyzeEmail(emailData);

    expect(result).toHaveProperty('summary');
    expect(result).toHaveProperty('priority');
    expect(result).toHaveProperty('sentiment');
    expect(result).toHaveProperty('tags');
    expect(result).toHaveProperty('key_points');
    expect(result).toHaveProperty('action_required');
    expect(result).toHaveProperty('confidence');

    // 验证分析结果的合理性
    expect(result.priority).toBe('high'); // 包含"重要"关键词
    expect(result.action_required).toBe(true); // 包含"请回复"
    expect(result.tags).toContain('工作相关'); // 包含工作相关内容
  });

  test('应该能够分析营销邮件', async () => {
    const emailData = {
      email_id: 'test-456',
      subject: '限时优惠 - 50%折扣',
      content: '亲爱的客户，我们的产品正在促销，现在购买可享受50%折扣。',
      sender: 'noreply@shop.com'
    };

    const result = await aiService.analyzeEmail(emailData);

    expect(result.tags).toContain('营销推广');
    expect(result.priority).toBe('low');
  });

  test('应该能够处理空内容', async () => {
    const emailData = {
      email_id: 'test-789',
      subject: '测试邮件',
      content: '',
      sender: 'test@test.com'
    };

    const result = await aiService.analyzeEmail(emailData);

    expect(result.summary).toContain('关于 "测试邮件" 的邮件');
    expect(result.confidence).toBeGreaterThan(0);
  });

  test('应该能够检测情感倾向', async () => {
    const positiveEmail = {
      email_id: 'test-positive',
      subject: '感谢您的帮助',
      content: '非常感谢您的帮助，这个方案太棒了！',
      sender: 'happy@customer.com'
    };

    const negativeEmail = {
      email_id: 'test-negative', 
      subject: '服务问题投诉',
      content: '我对您的服务很不满，存在严重问题需要解决。',
      sender: 'angry@customer.com'
    };

    const positiveResult = await aiService.analyzeEmail(positiveEmail);
    const negativeResult = await aiService.analyzeEmail(negativeEmail);

    expect(positiveResult.sentiment).toBe('positive');
    expect(negativeResult.sentiment).toBe('negative');
  });
});