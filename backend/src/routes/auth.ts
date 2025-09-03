import express, { Request, Response } from 'express';
import { 
  authenticateGoogle, 
  authenticateGoogleCallback, 
  authenticateJWT 
} from '../middleware/auth';
import { generateJWT, getAllUsers, findUserById } from '../config/passport';

const router = express.Router();

// Google OAuth 登录
router.get('/google', authenticateGoogle);

// Google OAuth 回调
router.get('/google/callback', 
  authenticateGoogleCallback,
  (req: Request, res: Response) => {
    // 认证成功，生成JWT令牌
    if (req.user) {
      const token = generateJWT(req.user);
      
      // 重定向到前端，并传递令牌
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendURL}/auth/callback?token=${token}`);
    } else {
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=auth_failed`);
    }
  }
);

// 获取当前用户信息
router.get('/me', authenticateJWT, (req: Request, res: Response) => {
  if (req.user) {
    const user = findUserById(req.user.userId);
    if (user) {
      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        provider: user.provider,
        createdAt: user.createdAt
      });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// 登出
router.post('/logout', authenticateJWT, (req: Request, res: Response) => {
  // 对于JWT，登出主要在前端处理（删除token）
  res.json({ message: '登出成功' });
});

// 验证令牌
router.get('/verify', authenticateJWT, (req: Request, res: Response) => {
  res.json({ 
    valid: true, 
    user: {
      id: req.user?.userId,
      email: req.user?.email,
      name: req.user?.name
    }
  });
});

// 开发环境：获取所有用户
if (process.env.NODE_ENV === 'development') {
  router.get('/users', (req: Request, res: Response) => {
    const users = getAllUsers();
    res.json(users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      provider: user.provider,
      createdAt: user.createdAt
    })));
  });
}

export default router;