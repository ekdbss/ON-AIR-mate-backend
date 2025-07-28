import express from 'express';

import {
  createRoom,
  joinRoom,
  getRoomMessages,
  getRoomParticipants,
  postRoomMessage,
  leaveRoom,
} from '../controllers/roomController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();
/**
 * @swagger
 * /api/rooms:
 *   post:
 *     summary: 방 생성
 *     description: 새로운 방을 생성합니다.
 *     tags:
 *       - Room
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roomName
 *             properties:
 *               roomName:
 *                 type: string
 *                 example: 즐거운 방
 *               isPublic:
 *                 type: boolean
 *                 example: true
 *               maxParticipants:
 *                 type: integer
 *                 example: 6
 *               videoId:
 *                 type: string
 *                 example: 1
 *     responses:
 *       201:
 *         description: 방 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 roomId:
 *                   type: integer
 *                   example: 10
 *                 message:
 *                   type: string
 *                   example: 방이 생성되었습니다.
 *       400:
 *         description: 요청 데이터 오류 (roomName 누락 등)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: roomName이 없습니다.
 *       409:
 *         description: 권한 오류 (hostId 누락)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: unauthorized
 *       500:
 *         description: 서버 에러
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 방 생성에 오류가 발생했습니다
 */
router.post('/', requireAuth, createRoom);

// 소켓 통신으로 할거임 이거는 단순 db 및 라우팅 처리
/**
 * @swagger
 * /api/rooms/{roomId}/join:
 *   post:
 *     summary: 채팅방 참가
 *     description: 인증된 사용자가 특정 채팅방에 참가합니다.
 *     tags:
 *       - Room
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 참가할 채팅방의 ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         message:
 *            type: string
 *            example: 채팅방 참가 성공하였습니다.
 *         description: 채팅방 참가 성공
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 채팅방을 찾을 수 없음
 */
router.post('/:roomId/join', requireAuth, joinRoom);

/**
 * @swagger
 * /api/rooms/{roomId}/leave:
 *   post:
 *     summary: 채팅방 나가기
 *     description: 인증된 사용자가 특정 채팅방에서 나갑니다.
 *     tags:
 *       - Room
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 나갈 채팅방의 ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         message:
 *            type: string
 *            example: 채팅방 나가기 성공하였습니다.
 *         description: 채팅방 나가기 성공
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 채팅방을 찾을 수 없음
 */
router.post('/:roomId/leave', requireAuth, leaveRoom);

/**
 * @swagger
 * /api/rooms/{roomId}/participants:
 *   get:
 *     summary: 특정 채팅방 참여자 목록 조회
 *     tags:
 *       - Room
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: roomId
 *         in: path
 *         required: true
 *         description: 채팅방 ID
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 참여자 목록 조회 성공
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
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: integer
 *                         example: 1
 *                       nickname:
 *                         type: string
 *                         example: "user123"
 *                       profileImage:
 *                         type: string
 *                         format: url
 *                         example: "https://example.com/image.png"
 *                       popularity:
 *                         type: integer
 *                         example: 1
 *                       isHost:
 *                         type: boolean
 *                       joinedAt:
 *                         type: string
 *                         format: date-time
 */
router.get('/:roomId/participants', requireAuth, getRoomParticipants);

/**
 * @swagger
 * /api/rooms/{roomId}/messages:
 *   post:
 *     summary: Room 채팅방 메시지 전송
 *     tags:
 *       - Room
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: roomId
 *         in: path
 *         required: true
 *         description: 채팅방 ID
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
 *                 enum: [general, roomInvite, collectionShare]
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
 *                 data:
 *                   messageId:
 *                     type: integer
 *                   content:
 *                     type: string
 *                   message:
 *                     type: string
 */
router.post('/:roomId/messages', requireAuth, postRoomMessage);

/**
 * @swagger
 * /api/rooms/{roomId}/messages:
 *   get:
 *     summary: room 채팅방 메시지 목록 조회
 *     tags:
 *       - Room
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: roomId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: 채팅방 ID
 *     responses:
 *       200:
 *         description: 메시지 목록 조회 성공
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
 *                     type: object
 *                     properties:
 *                       messageId:
 *                         type: integer
 *                         example: 1
 *                       userId:
 *                         type: integer
 *                         example: 1
 *                       nickname:
 *                         type: string
 *                         example: "user123"
 *                       profileImage:
 *                         type: string
 *                         format: url
 *                         example: "https://example.com/image.png"
 *                       content:
 *                         type: string
 *                       messageType:
 *                         type: string
 *                         enum: [general, system]
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 */
router.get('/:roomId/messages', requireAuth, getRoomMessages);

export default router;
