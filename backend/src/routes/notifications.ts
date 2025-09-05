import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const notificationController = new NotificationController();

// 中间件：所有通知相关路由都需要认证
router.use(authMiddleware);

// 通知配置管理
router.get('/configs', notificationController.getNotificationConfigs.bind(notificationController));
router.post('/configs', notificationController.addNotificationConfig.bind(notificationController));
router.put('/configs/:id', notificationController.updateNotificationConfig.bind(notificationController));
router.delete('/configs/:id', notificationController.deleteNotificationConfig.bind(notificationController));

// 通知测试
router.post('/test-config', notificationController.testNotificationConfig.bind(notificationController));
router.post('/send-test', notificationController.sendTestNotification.bind(notificationController));

// 通知历史和统计
router.get('/history', notificationController.getNotificationHistory.bind(notificationController));
router.get('/stats', notificationController.getNotificationStats.bind(notificationController));

// 获取支持的选项
router.get('/options', notificationController.getSupportedOptions.bind(notificationController));

export default router;