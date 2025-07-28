import express from 'express';

import { postDirectMessage, getDirectMessage } from '../controllers/directMessageController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/chat/direct/{friendId}/message:
 *   post:
 *     summary: 1:1 친구에게 메시지 전송
 *     tags:
 *       - DirectMessage
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: friendId
 *         in: path
 *         required: true
 *         description: 메시지를 받을 친구의 사용자 ID
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - messageType
 *             properties:
 *               content:
 *                 type: string
 *                 description: 메시지 내용
 *               messageType:
 *                 type: string
 *                 enum: [general, collectionShare, roomInvite]
 *                 description: 메시지 타입
 *     responses:
 *       201:
 *         description: 메시지 전송 성공
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
 *                     messageId:
 *                       type: integer
 *                       example: 123
 *                     content:
 *                       type: string
 *                       example: "안녕 친구야!"
 *                     message:
 *                       type: string
 *                       example: "채팅이 전송되었습니다."
 */
router.post('/:friendId/message', requireAuth, postDirectMessage);

/**
 * @swagger
 * /api/chat/direct/{friendId}/message:
 *   get:
 *     summary: 친구와의 1:1 메시지 조회
 *     tags:
 *       - DirectMessage
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: friendId
 *         in: path
 *         required: true
 *         description: 친구의 사용자 ID
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 메시지 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Message'
 */
router.get('/:friendId/message', requireAuth, getDirectMessage);

export default router;
