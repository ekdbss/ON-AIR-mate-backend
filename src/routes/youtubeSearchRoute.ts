import { Router } from 'express';
import { searchYoutubeVideos } from '../controllers/youtubeSearchController';

const router: Router = Router();

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
router.get('/search', searchYoutubeVideos);

export default router;
