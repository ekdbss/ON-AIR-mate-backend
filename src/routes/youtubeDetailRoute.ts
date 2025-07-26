import { Router } from 'express';
import { getYoutubeVideoDetail } from '../controllers/youtubeDetailController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

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

router.get('/:videoId', requireAuth, getYoutubeVideoDetail);

export default router;
