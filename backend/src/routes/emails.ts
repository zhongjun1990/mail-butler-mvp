import { Router } from 'express';
import { EmailController } from '../controllers/EmailController';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const emailController = new EmailController();

// 中间件：所有邮件相关路由都需要认证
router.use(authMiddleware);

// 邮箱账户管理
router.get('/accounts', emailController.getAccounts.bind(emailController));
router.post('/accounts', emailController.addAccount.bind(emailController));
router.delete('/accounts/:id', emailController.deleteAccount.bind(emailController));
router.post('/accounts/:id/sync', emailController.syncAccount.bind(emailController));

// 连接测试
router.post('/test-connection', emailController.testConnection.bind(emailController));

// 邮件操作
router.get('/', emailController.getEmails.bind(emailController));
router.get('/:id', emailController.getEmailDetail.bind(emailController));
router.patch('/:id/read', emailController.markEmailRead.bind(emailController));

export default router;