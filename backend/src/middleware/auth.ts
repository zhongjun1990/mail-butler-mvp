import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { verifyJWT } from '../config/passport';

// 扩展Request接口以包含用户信息
declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      name: string;
      avatar?: string;
      provider: string;
      providerId: string;
      createdAt: Date;
    }
  }
}

// JWT认证中间件
export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: '需要提供有效的访问令牌' 
    });
  }

  const token = authHeader.substring(7);
  const decoded = verifyJWT(token);
  
  if (!decoded) {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: '令牌无效或已过期' 
    });
  }

  // 将用户信息附加到请求对象
  req.user = decoded;
  next();
};

// 可选的JWT认证中间件（不强制要求认证）
export const optionalJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = verifyJWT(token);
    
    if (decoded) {
      req.user = decoded;
    }
  }
  
  next();
};

// Passport认证中间件
export const authenticateGoogle = passport.authenticate('google', { 
  scope: ['profile', 'email'] 
});

export const authenticateGoogleCallback = passport.authenticate('google', { 
  failureRedirect: '/login?error=oauth_failed' 
});

// 演示用的简单认证中间件
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: '需要提供有效的访问令牌' 
    });
  }

  // 演示环境：简单验证
  const token = authHeader.substring(7);
  if (token === 'demo-token' || token.length > 10) {
    // 模拟用户信息
    req.user = {
      id: 'demo-user-123',
      email: 'demo@example.com',
      name: '演示用户',
      provider: 'demo',
      providerId: 'demo-123',
      createdAt: new Date()
    };
    return next();
  }

  // 实际环境中这里应该验证JWT token
  const decoded = verifyJWT(token);
  if (!decoded) {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: '令牌无效或已过期' 
    });
  }

  req.user = decoded;
  next();
};