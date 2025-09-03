import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import prisma from './config/database';
import { UserService } from './services/UserService';

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

// API 路由
// 认证相关路由
app.get('/api/auth/google', (req, res) => {
  res.json({ 
    message: 'Google OAuth 集成请前往 Google Cloud Console 配置',
    setup_instructions: {
      step1: '前往 https://console.cloud.google.com/',
      step2: '创建 OAuth 2.0 客户端ID',
      step3: '设置重定向URI: http://localhost:8000/api/auth/google/callback',
      step4: '将客户端ID和密钥添加到环境变量中'
    }
  });
});

const userService = new UserService();

app.get('/api/auth/me', async (req, res) => {
  try {
    // 模拟检查认证状态
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '需要认证' });
    }

    // 创建或获取演示用户
    let user = await userService.findByEmail('demo@example.com');
    if (!user) {
      user = await userService.createOrUpdateOAuthUser({
        email: 'demo@example.com',
        name: '演示用户',
        avatarUrl: 'https://via.placeholder.com/40',
        provider: 'demo',
        providerId: 'demo-user-123',
        preferences: {
          theme: 'light',
          language: 'zh-CN',
          emailsPerPage: 20
        }
      });
    }

    // 获取用户邮件统计
    const stats = await userService.getUserEmailStats(user.id);

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatarUrl,
      provider: 'demo',
      preferences: user.preferences,
      stats
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ error: '内部服务器错误' });
  }
});

app.use('/api/emails', (req: any, res) => {
  res.json({ 
    message: '邮件服务正在开发中...', 
    user: { id: '1', email: 'demo@example.com' }
  });
});

app.use('/api/ai', (req: any, res) => {
  res.json({ 
    message: 'AI 服务正在开发中...', 
    user: { id: '1', email: 'demo@example.com' }
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