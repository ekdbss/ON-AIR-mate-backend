var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import axios from 'axios';
// 명시적 타입으로 처리 (any 사용 X)
export const searchYoutubeVideos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { query, limit = 10 } = req.query;
        // Authorization 헤더 확인
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                message: '인증 정보가 누락되었습니다.',
            });
            return;
        }
        const apiKey = process.env.YOUTUBE_API_KEY;
        if (!apiKey) {
            res.status(500).json({
                success: false,
                message: '서버 설정 오류: YOUTUBE_API_KEY가 누락되었습니다.',
            });
            return;
        }
        const response = yield axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                q: query,
                part: 'snippet',
                type: 'video',
                maxResults: limit,
                key: apiKey,
            },
        });
        const items = response.data.items;
        const videoList = yield Promise.all(items.map((item) => __awaiter(void 0, void 0, void 0, function* () {
            const statsRes = yield axios.get('https://www.googleapis.com/youtube/v3/videos', {
                params: {
                    part: 'statistics,snippet',
                    id: item.id.videoId,
                    key: apiKey,
                },
            });
            const videoData = statsRes.data.items[0];
            return {
                videoId: item.id.videoId,
                title: item.snippet.title,
                thumbnail: item.snippet.thumbnails.medium.url,
                channelName: item.snippet.channelTitle,
                viewCount: parseInt(videoData.statistics.viewCount, 10),
                uploadTime: videoData.snippet.publishedAt,
            };
        })));
        res.status(200).json({
            success: true,
            data: videoList,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'YouTube API 요청 실패',
            timestamp: new Date().toISOString(),
        });
    }
});
