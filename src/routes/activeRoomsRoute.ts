import { Router } from 'express';
import { ActiveRoomController } from '../controllers/activeRoomsController.js';
import { ActiveRoomService } from '../services/activeRoomsService.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

const activeRoomService = new ActiveRoomService();
const activeRoomController = new ActiveRoomController(activeRoomService);
/**
 * @swagger
 * /api/rooms:
 *   get:
 *     summary: 활성화된 방 목록 조회
 *     description: 현재 활성화된 방 목록을 검색 및 정렬 조건에 따라 조회합니다.
 *     tags:
 *       - Room
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [latest, popularity]
 *           description: '정렬 기준 (latest: 최신순(기본 값), popularity: 방장 인기순)'
 *       - in: query
 *         name: searchType
 *         schema:
 *           type: string
 *           enum: [videoTitle, roomTitle, hostNickname]
 *           description: '검색 기준 (videoTitle: 영상 제목(기본 값), roomTitle: 방 제목, hostNickname: 방장 닉네임)'
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *           description: '검색어'
 *     responses:
 *       200:
 *         description: '활성화된 방 목록 조회 성공'
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ActiveRoomsResponse'
 *       401:
 *         description: 인증 실패
 *       500:
 *         description: 서버 내부 오류
 */
router.get('/', requireAuth, activeRoomController.getRooms);

export default router;
