// src/routes/friendRoutes.ts
import express from 'express';
import {
  getFriends,
  sendFriendRequest,
  getFriendRequests,
  handleFriendRequest,
  deleteFriend,
  searchFriends,
  inviteFriend,
  getFriendLounge,
} from '../controllers/friendController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// 모든 친구 관련 API는 인증 필요
router.use(requireAuth);

/**
 * @swagger
 * /api/friends:
 *   get:
 *     summary: 친구 목록 조회
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 친구 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: number
 *                         example: 456
 *                       nickname:
 *                         type: string
 *                         example: 친구닉네임
 *                       profileImage:
 *                         type: string
 *                         nullable: true
 *                         example: 프로필이미지URL
 *                       popularity:
 *                         type: number
 *                         example: 90
 *                       isOnline:
 *                         type: boolean
 *                         example: true
 */
router.get('/', getFriends);

/**
 * @swagger
 * /api/friends/request:
 *   post:
 *     summary: 친구 요청 전송
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetUserId
 *             properties:
 *               targetUserId:
 *                 type: number
 *                 description: 친구 요청을 보낼 사용자 ID
 *                 example: 456
 *     responses:
 *       200:
 *         description: 친구 요청 전송 성공
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
 *                     message:
 *                       type: string
 *                       example: 친구 요청을 보냈습니다.
 */
router.post('/request', sendFriendRequest);

/**
 * @swagger
 * /api/friends/requests:
 *   get:
 *     summary: 받은 친구 요청 목록 조회
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 친구 요청 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       requestId:
 *                         type: number
 *                         example: 789
 *                       userId:
 *                         type: number
 *                         example: 456
 *                       nickname:
 *                         type: string
 *                         example: 요청자닉네임
 *                       profileImage:
 *                         type: string
 *                         nullable: true
 *                         example: 프로필이미지URL
 *                       popularity:
 *                         type: number
 *                         example: 75
 *                       requestedAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2025-01-01T12:00:00Z
 */
router.get('/requests', getFriendRequests);

/**
 * @swagger
 * /api/friends/requests/{requestId}:
 *   put:
 *     summary: 친구 요청 수락/거절
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: number
 *         description: 친구 요청 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [ACCEPT, REJECT]
 *                 description: 요청 처리 방식
 *                 example: ACCEPT
 *     responses:
 *       200:
 *         description: 친구 요청 처리 성공
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
 *                     message:
 *                       type: string
 *                       example: 친구 요청을 수락했습니다.
 */
router.put('/requests/:requestId', handleFriendRequest);

/**
 * @swagger
 * /api/friends/{userId}:
 *   delete:
 *     summary: 친구 삭제
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: number
 *         description: 삭제할 친구의 사용자 ID
 *     responses:
 *       200:
 *         description: 친구 삭제 성공
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
 *                     message:
 *                       type: string
 *                       example: 친구가 삭제되었습니다.
 */
router.delete('/:userId', deleteFriend);

/**
 * @swagger
 * /api/friends/search:
 *   get:
 *     summary: 닉네임으로 친구 검색
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: nickname
 *         required: true
 *         schema:
 *           type: string
 *         description: 검색할 닉네임 (완전일치)
 *     responses:
 *       200:
 *         description: 사용자 검색 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: number
 *                         example: 789
 *                       nickname:
 *                         type: string
 *                         example: 검색된닉네임
 *                       profileImage:
 *                         type: string
 *                         nullable: true
 *                         example: 프로필이미지URL
 *                       popularity:
 *                         type: number
 *                         example: 80
 */
router.get('/search', searchFriends);

/**
 * @swagger
 * /api/friends/{friendId}/invite:
 *   post:
 *     summary: 친구를 방에 초대
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: friendId
 *         required: true
 *         schema:
 *           type: number
 *         description: 초대할 친구의 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roomId
 *             properties:
 *               roomId:
 *                 type: number
 *                 description: 초대할 방의 ID
 *                 example: 123
 *     responses:
 *       200:
 *         description: 친구 초대 성공
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
 *                     message:
 *                       type: string
 *                       example: 친구에게 방 초대를 보냈습니다.
 */
router.post('/:friendId/invite', inviteFriend);

/**
 * @swagger
 * /api/friends/{userId}/lounge:
 *   get:
 *     summary: 친구의 라운지 조회 (공개된 컬렉션만)
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: number
 *         description: 조회할 친구의 사용자 ID
 *     responses:
 *       200:
 *         description: 친구 라운지 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       collectionId:
 *                         type: number
 *                         example: 123
 *                       title:
 *                         type: string
 *                         example: 친구의 컬렉션
 *                       description:
 *                         type: string
 *                         nullable: true
 *                         example: 컬렉션 소개
 *                       bookmarkCount:
 *                         type: number
 *                         example: 8
 *                       visibility:
 *                         type: string
 *                         enum: [FRIENDS_ONLY, PUBLIC]
 *                         example: FRIENDS_ONLY
 *                       coverImage:
 *                         type: string
 *                         nullable: true
 *                         example: 커버이미지URL
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2025-01-01T12:00:00Z
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2025-01-01T15:00:00Z
 */
router.get('/:userId/lounge', getFriendLounge);

export default router;
