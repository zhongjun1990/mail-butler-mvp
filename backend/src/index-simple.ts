import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT || 8000;

// 中间件
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 简单认证中间件
const authMiddleware = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '需要认证' });
  }

  // 演示环境：简单验证
  const token = authHeader.substring(7);
  if (token === 'demo-token' || token.length > 10) {
    req.user = {
      id: 'demo-user-123',
      email: 'demo@example.com',
      name: '演示用户'
    };
    return next();
  }

  return res.status(401).json({ error: '无效令牌' });
};

// 基础路由
app.get('/', (req, res) => {
  res.json({
    message: '📧 邮箱管家 API 服务',
    version: '1.0.0',
    status: 'running'
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 认证相关路由
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '需要认证' });
  }

  res.json({
    id: 'demo-user-123',
    email: 'demo@example.com',
    name: '演示用户',
    avatar: 'https://via.placeholder.com/40',
    provider: 'demo',
    preferences: {
      theme: 'light',
      language: 'zh-CN',
      emailsPerPage: 20
    },
    stats: {
      totalEmails: 156,
      unreadEmails: 23,
      readEmails: 133,
      repliedEmails: 89
    }
  });
});

app.post('/api/auth/demo-login', (req, res) => {
  res.json({
    token: 'demo-token',
    user: {
      id: 'demo-user-123',
      email: 'demo@example.com',
      name: '演示用户',
      provider: 'demo'
    }
  });
});

// 邮箱账户管理
app.get('/api/emails/accounts', authMiddleware, (req, res) => {
  res.json([
    {
      id: 'account-1',
      name: '工作邮箱',
      email: 'work@company.com',
      provider: 'gmail',
      status: 'connected',
      lastSync: new Date().toISOString(),
      unreadCount: 15
    },
    {
      id: 'account-2',
      name: '个人邮箱',
      email: 'personal@gmail.com',
      provider: 'gmail',
      status: 'connected',
      lastSync: new Date().toISOString(),
      unreadCount: 8
    }
  ]);
});

app.post('/api/emails/accounts', authMiddleware, (req, res) => {
  const { name, email, provider, imapConfig } = req.body;
  
  // 模拟添加邮箱账户
  const account = {
    id: 'account-' + Date.now(),
    name,
    email,
    provider,
    status: 'connected',
    createdAt: new Date().toISOString()
  };
  
  res.status(201).json(account);
});

app.post('/api/emails/test-connection', authMiddleware, (req, res) => {
  const { host, port, secure, username, password } = req.body;
  
  // 模拟连接测试
  setTimeout(() => {
    if (host && username && password) {
      res.json({ success: true, message: '连接测试成功' });
    } else {
      res.status(400).json({ error: '连接配置不完整' });
    }
  }, 1000);
});

// 邮件操作
app.get('/api/emails', authMiddleware, (req, res) => {
  const mockEmails = [
    {
      id: 'email-1',
      subject: '会议通知：团队周会',
      sender: 'manager@company.com',
      date: new Date().toISOString(),
      isRead: false,
      account: { name: '工作邮箱', email: 'work@company.com' }
    },
    {
      id: 'email-2',
      subject: 'GitHub 通知',
      sender: 'noreply@github.com',
      date: new Date(Date.now() - 3600000).toISOString(),
      isRead: true,
      account: { name: '个人邮箱', email: 'personal@gmail.com' }
    }
  ];
  
  res.json({
    emails: mockEmails,
    pagination: {
      page: 1,
      limit: 20,
      total: 2,
      pages: 1
    }
  });
});

// AI 驾驶舱
app.get('/api/ai/dashboard', authMiddleware, (req, res) => {
  res.json({
    stats: {
      totalEmails: 1247,
      unreadEmails: 23,
      readEmails: 1224,
      repliedEmails: 856,
      todayEmails: 15,
      weeklyChange: 12.5,
      avgResponseTime: 4.2,
      categories: {
        '工作': 567,
        '个人': 234,
        '通知': 189,
        '营销': 156,
        '垃圾邮件': 101
      },
      priorities: {
        high: 8,
        medium: 32,
        low: 67
      },
      timeStats: {
        labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        data: [25, 32, 18, 24, 41, 15, 8]
      }
    },
    analysis: [
      {
        title: '重要邮件待处理',
        description: '您有 3 封标记为高优先级的邮件超过 24 小时未回复',
        type: 'urgent',
        action: '立即处理'
      },
      {
        title: '回复效率提升',
        description: '本周平均回复时间比上周缩短了 1.5 小时，表现优秀！',
        type: 'success'
      },
      {
        title: '营销邮件增多',
        description: '检测到营销邮件数量增加 35%，建议优化过滤规则',
        type: 'warning',
        action: '设置过滤器'
      }
    ],
    lastUpdate: new Date().toISOString()
  });
});

// 通知设置 API
app.get('/api/notifications/options', authMiddleware, (req, res) => {
  res.json({
    platforms: [
      { value: 'dingtalk', label: '钉钉', description: '通过钉钉机器人发送消息通知' },
      { value: 'feishu', label: '飞书', description: '通过飞书机器人发送消息通知' },
      { value: 'wechat', label: '微信企业号', description: '通过微信企业号应用发送消息通知' }
    ],
    types: [
      { value: 'new_email', label: '新邮件通知', description: '收到新邮件时发送通知' },
      { value: 'important_email', label: '重要邮件通知', description: 'AI检测到重要邮件时发送通知' },
      { value: 'ai_summary', label: 'AI摘要通知', description: 'AI生成邮件摘要时发送通知' },
      { value: 'daily_digest', label: '每日摘要', description: '发送每日邮件摘要' },
      { value: 'custom', label: '自定义通知', description: '自定义触发的通知' }
    ]
  });
});

app.get('/api/notifications/configs', authMiddleware, (req, res) => {
  res.json([
    {
      id: 'config-1',
      platform: 'dingtalk',
      webhook: 'https://oapi.dingtalk.com/robot/send?access_token=***',
      enabled: true,
      types: ['new_email', 'important_email'],
      filters: {
        keywords: ['重要', '紧急'],
        minPriority: 'medium',
        timeRange: { start: '09:00', end: '18:00' }
      },
      createdAt: new Date().toISOString()
    }
  ]);
});

app.post('/api/notifications/configs', authMiddleware, (req, res) => {
  const { platform, webhook, enabled, types, filters } = req.body;
  
  // 模拟添加通知配置
  const config = {
    id: 'config-' + Date.now(),
    platform,
    webhook: webhook.substring(0, 50) + '***', // 隐藏敏感信息
    enabled,
    types,
    filters,
    createdAt: new Date().toISOString()
  };
  
  res.status(201).json({ success: true, message: '通知配置添加成功' });
});

app.post('/api/notifications/test-config', authMiddleware, (req, res) => {
  const { platform, webhook } = req.body;
  
  // 模拟测试通知配置
  setTimeout(() => {
    if (webhook && webhook.startsWith('https://')) {
      res.json({ success: true, message: '通知测试成功' });
    } else {
      res.status(400).json({ error: 'Webhook配置无效' });
    }
  }, 800);
});

app.post('/api/notifications/send-test', authMiddleware, (req, res) => {
  const { title, content } = req.body;
  
  // 模拟发送测试通知
  setTimeout(() => {
    res.json({ success: true, message: '测试通知发送成功' });
  }, 1000);
});

app.get('/api/notifications/stats', authMiddleware, (req, res) => {
  res.json({
    total: 156,
    successful: 142,
    failureRate: '8.97',
    activeConfigs: 2,
    platformStats: [
      { platform: 'dingtalk', total: 89, successful: 85 },
      { platform: 'feishu', total: 67, successful: 57 }
    ],
    typeStats: [
      { type: 'new_email', count: 98 },
      { type: 'important_email', count: 34 },
      { type: 'ai_summary', count: 24 }
    ],
    recentHistory: [
      { platform: 'dingtalk', type: 'new_email', success: true, sentAt: new Date().toISOString() }
    ]
  });
});

app.get('/api/notifications/history', authMiddleware, (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  
  const mockHistory = [
    {
      id: 'history-1',
      platform: 'dingtalk',
      type: 'new_email',
      title: '新邮件通知',
      content: '您收到一封来自 manager@company.com 的新邮件',
      success: true,
      sentAt: new Date().toISOString(),
      config: { platform: 'dingtalk', webhook: 'https://***' }
    }
  ];
  
  res.json({
    history: mockHistory,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total: 1,
      pages: 1
    }
  });
});

// 错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'API endpoint not found'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 邮箱管家后端服务启动成功！`);
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log(`🏥 健康检查: http://localhost:${PORT}/health`);
});