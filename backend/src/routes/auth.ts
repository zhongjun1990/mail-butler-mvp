import { Router } from 'express';
import { UserService } from '../services/UserService';

const router = Router();
const userService = new UserService();

// Google OAuth 路由
router.get('/google', (req, res) => {
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

// 获取当前用户信息
router.get('/me', async (req, res) => {
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

// 演示登录
router.post('/demo-login', (req, res) => {
  // 返回演示token
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

export default router;