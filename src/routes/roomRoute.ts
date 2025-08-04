import express from 'express';

import { roomInfoController } from '../controllers/roomInfoController.js';
import { getRoomSettings, updateRoomSettings } from '../controllers/roomSettingController.js';
import {
  createRoom,
  joinRoom,
  getRoomMessages,
  getRoomParticipants,
  postRoomMessage,
  leaveRoom,
} from '../controllers/roomController.js';
import { ActiveRoomController } from '../controllers/activeRoomsController.js';
import { ActiveRoomService } from '../services/activeRoomsService.js';

import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();
const activeRoomService = new ActiveRoomService();
const activeRoomController = new ActiveRoomController(activeRoomService);

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
 *         description: '정렬 기준 (latest: 최신순, popularity: 방장 인기순)'
 *       - in: query
 *         name: searchType
 *         schema:
 *           type: string
 *           enum: [videoTitle, roomTitle, hostNickname]
 *         description: '검색 기준 (videoTitle: 영상제목, roomTitle: 방제목, hostNickname: 방장 닉네임)'
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: '검색어 (searchType이 지정된 경우에만 유효)'
 *     responses:
 *       200:
 *         description: 활성화된 방 목록 조회 성공
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

/**
 * @swagger
 * /api/rooms/{roomId}:
 *   get:
 *     summary: 특정 방의 상세 정보 조회
 *     tags: [Room]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 방의 고유 ID
 *     responses:
 *       200:
 *         description: 방 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 roomId:
 *                   type: integer
 *                   example: 1
 *                 roomTitle:
 *                   type: string
 *                   example: "테스트 방"
 *                 videoId:
 *                   type: string
 *                   example: "dQw4w9WgXcQ"
 *                 videoTitle:
 *                   type: string
 *                   example: "Never Gonna Give You Up"
 *                 videoThumbnail:
 *                   type: string
 *                   format: url
 *                   example: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
 *                 hostNickname:
 *                   type: string
 *                   example: "rick_astley"
 *                 hostProfileImage:
 *                   type: string
 *                   format: url
 *                   example: "https://example.com/profile.jpg"
 *                 hostPopularity:
 *                   type: integer
 *                   example: 100
 *                 currentParticipants:
 *                   type: integer
 *                   example: 3
 *                 maxParticipants:
 *                   type: integer
 *                   example: 8
 *                 duration:
 *                   type: string
 *                   example: "00:15:30"
 *                 isPrivate:
 *                   type: boolean
 *                   example: false
 *                 isActive:
 *                   type: boolean
 *                   example: true
 *                 autoArchiving:
 *                   type: boolean
 *                   example: false
 *                 invitePermission:
 *                   type: string
 *                   enum: [HOST_ONLY, ALL]
 *                   example: "HOST_ONLY"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2023-10-27T10:00:00.000Z"
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 방을 찾을 수 없음
 */
router.get('/:roomId', requireAuth, roomInfoController.getRoomInfo);

/**
 * @swagger
 * /api/rooms/{roomId}/settings:
 *   get:
 *     summary: 방 설정 조회
 *     description: 특정 방의 설정된 기존 설정 값을 가져옵니다.
 *     tags:
 *       - Room
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 설정을 조회할 방의 ID
 *     responses:
 *       200:
 *         description: 방 설정 조회 성공
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
 *                     maxParticipants:
 *                       type: integer
 *                       example: 15
 *                     isPrivate:
 *                       type: boolean
 *                       example: true
 *                     autoArchiving:
 *                       type: boolean
 *                       example: false
 *                     invitePermission:
 *                       type: string
 *                       enum: [all, host]
 *                       example: "all"
 *                 error:
 *                   type: object
 *                   nullable: true
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 방에 참여하지 않은 사용자
 *       404:
 *         description: 방을 찾을 수 없음
 */
router.get('/:roomId/settings', requireAuth, getRoomSettings);

/**
 * @swagger
 * /api/rooms/{roomId}/settings:
 *   put:
 *     summary: 방 설정 수정
 *     description: 방장이 특정 방의 설정을 수정합니다.
 *     tags:
 *       - Room
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 설정을 수정할 방의 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               maxParticipants:
 *                 type: integer
 *                 description: 최대 참여자 수
 *                 example: 8
 *               isPrivate:
 *                 type: boolean
 *                 description: 방 공개 여부 (true이면 비공개)
 *                 example: true
 *               autoArchiving:
 *                 type: boolean
 *                 description: 자동 아카이빙 여부
 *                 example: true
 *               invitePermission:
 *                 type: string
 *                 enum: [all, host]
 *                 description: 초대 권한
 *                 example: host
 *     responses:
 *       200:
 *         description: 방 설정 수정 성공
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
 *                   example: 방 설정이 수정되었습니다.
 *       401:
 *         description: 인증 실패 또는 호스트가 아님
 *       404:
 *         description: 방을 찾을 수 없음
 */
router.put('/:roomId/settings', requireAuth, updateRoomSettings);

export default router;
