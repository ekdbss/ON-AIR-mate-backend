import { Router } from 'express';
import { recommendVideos } from '../controllers/youtubeRecommendationController.js';
import { searchYoutubeVideos } from '../controllers/youtubeSearchController.js';
import { getYoutubeVideoDetail } from '../controllers/youtubeDetailController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

/**
 * @swagger
 * /api/youtube/recommendations:
 *   get:
 *     summary: 검색어 기반 추천 영상 조회
 *     tags: [YouTube]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         required: true
 *         description: 검색할 키워드
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 3
 *         description: 가져올 영상의 최대 개수 (1-50)
 *     responses:
 *       200:
 *         description: 추천 영상 목록
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RecommendationResponse'
 *       400:
 *         description: 잘못된 요청 (키워드 누락 또는 limit 파라미터 오류)
 */
router.get('/recommendations', requireAuth, recommendVideos);

/**
 * @swagger
 * /api/youtube/search:
 *   get:
 *     summary: 유튜브 영상 검색
 *     description: 키워드로 유튜브 영상을 검색합니다.
 *     tags:
 *       - YouTube
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: 검색할 키워드
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 검색할 영상 수
 *     responses:
 *       200:
 *         description: 검색 결과
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
 *                       videoId:
 *                         type: string
 *                       title:
 *                         type: string
 *                       thumbnail:
 *                         type: string
 *                       channelName:
 *                         type: string
 *                       viewCount:
 *                         type: integer
 *                       uploadTime:
 *                         type: string
 *       401:
 *         description: 인증 실패
 *       500:
 *         description: YouTube API 요청 실패
 */
router.get('/search', requireAuth, searchYoutubeVideos);

/**
 * @swagger
 * /api/youtube/videos/{videoId}:
 *   get:
 *     summary: 유튜브 영상 상세 조회
 *     description: 특정 videoId에 대한 유튜브 영상 정보를 조회하고 DB에 저장합니다.
 *     tags:
 *       - YouTube
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: 유튜브 비디오 ID
 *     responses:
 *       200:
 *         description: 영상 상세 정보
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     videoId:
 *                       type: string
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     thumbnail:
 *                       type: string
 *                     channelName:
 *                       type: string
 *                     channelIcon:
 *                       type: string
 *                     viewCount:
 *                       type: integer
 *                     duration:
 *                       type: string
 *                       example: PT15M33S
 *                     uploadedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 영상 없음
 *       500:
 *         description: 서버 에러
 */
router.get('/videos/:videoId', requireAuth, getYoutubeVideoDetail);

export default router;
