import { Router } from 'express';
import { AIController } from '../controllers/AIController';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const aiController = new AIController();

// 中间件：所有AI相关路由都需要认证
router.use(authMiddleware);

// 驾驶舱和统计
router.get('/dashboard', aiController.getDashboard.bind(aiController));
router.get('/insights', aiController.getEmailInsights.bind(aiController));

// 邮件智能分析
router.post('/emails/:emailId/classify', aiController.classifyEmail.bind(aiController));
router.post('/emails/:emailId/priority', aiController.assessPriority.bind(aiController));
router.post('/emails/:emailId/reply-suggestions', aiController.generateReply.bind(aiController));

// 智能功能
router.post('/search', aiController.smartSearch.bind(aiController));
router.post('/reminders', aiController.setSmartReminder.bind(aiController));
router.post('/chat', aiController.chatWithAI.bind(aiController));

// 报告导出
router.get('/reports/export', aiController.exportReport.bind(aiController));

export default router;