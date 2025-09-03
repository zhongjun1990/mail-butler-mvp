import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import jwt from 'jsonwebtoken';

// 模拟用户数据存储（实际项目中应该使用数据库）
interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: string;
  providerId: string;
  createdAt: Date;
}

const users: User[] = [];

// JWT配置
const JWT_SECRET = process.env.JWT_SECRET || 'mail-butler-dev-secret-2024';

// Google OAuth 配置
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // 查找现有用户
      let user = users.find(u => u.providerId === profile.id && u.provider === 'google');
      
      if (!user) {
        // 创建新用户
        user = {
          id: Date.now().toString(),
          email: profile.emails?.[0]?.value || '',
          name: profile.displayName || '',
          avatar: profile.photos?.[0]?.value,
          provider: 'google',
          providerId: profile.id,
          createdAt: new Date()
        };
        users.push(user);
      }
      
      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  }));
}

// JWT策略配置
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: JWT_SECRET
}, async (payload, done) => {
  try {
    const user = users.find(u => u.id === payload.userId);
    if (user) {
      return done(null, user);
    }
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
}));

// 序列化用户（用于会话）
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser((id: string, done) => {
  const user = users.find(u => u.id === id);
  done(null, user || null);
});

// 生成JWT令牌
export const generateJWT = (user: User): string => {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email,
      name: user.name 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// 验证JWT令牌
export const verifyJWT = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// 获取所有用户（开发用）
export const getAllUsers = () => users;

// 根据ID查找用户
export const findUserById = (id: string) => users.find(u => u.id === id);

export default passport;