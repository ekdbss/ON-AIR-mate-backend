import express from 'express';
import {
  getRecentNotifications,
  getUnReadNotificationNum,
  setReadNotification,
} from '../controllers/notificationController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: 최근 7일 이내 알림 목록 조회
 *     tags:
 *       - Notification
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 알림 목록 응답
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     today:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Notification'
 *                     yesterday:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Notification'
 *                     recent7Days:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Notification'
 *       401:
 *         description: 인증 실패
 */
router.get('/', requireAuth, getRecentNotifications);
/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     summary: 안 읽은 알림 개수 조회
 *     tags:
 *       - Notification
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 안 읽은 알림 개수 응답
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     unreadCount:
 *                       type: integer
 *                       example: 3
 *       401:
 *         description: 인증 실패
 */
router.get('/unread-count', requireAuth, getUnReadNotificationNum);
/**
 * @swagger
 * /api/notifications/read:
 *   put:
 *     summary: 모든 알림을 읽음 처리
 *     tags:
 *       - Notification
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 읽음 처리 완료 메시지
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "모든 알림이 읽음 처리되었습니다."
 *       401:
 *         description: 인증 실패
 */
router.put('/read', requireAuth, setReadNotification);

export default router;
