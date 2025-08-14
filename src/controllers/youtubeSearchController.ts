import { Request, Response } from 'express';
import axios from 'axios';

type YoutubeSearchItem = {
  id?: {
    videoId?: string;
  };
  snippet: {
    title: string;
    thumbnails: {
      medium: {
        url: string;
      };
    };
    channelTitle: string;
  };
};

type YoutubeVideoResult = {
  videoId: string;
  title: string;
  thumbnail: string;
  channelName: string;
  viewCount: number;
  uploadTime: string;
};

function hasVideoId(
  item: YoutubeSearchItem,
): item is YoutubeSearchItem & { id: { videoId: string } } {
  return typeof item.id?.videoId === 'string' && item.id.videoId.length > 0;
}

export const searchYoutubeVideos = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.query as string;
    const limitRaw = req.query.limit as string | undefined;
    const limit = limitRaw !== undefined ? Number(limitRaw) : 10;

    // 입력값 검증
    if (!query || query.trim().length === 0) {
      res.status(400).json({ success: false, message: '검색어를 입력해주세요.' });
      return;
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
      res.status(400).json({ success: false, message: 'limit은 1-50 사이여야 합니다.' });
      return;
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      res
        .status(500)
        .json({ success: false, message: '서버 설정 오류: YOUTUBE_API_KEY가 누락되었습니다.' });
      return;
    }

    // 1차 검색 요청
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        q: query,
        part: 'snippet',
        type: 'video',
        maxResults: limit,
        key: apiKey,
      },
    });

    // videoId 없는 결과 필터링
    const items = (response.data.items as YoutubeSearchItem[]).filter(hasVideoId);

    // 2차 상세 정보 요청 (실패한 건 null 처리)
    const results = await Promise.all(
      items.map(async item => {
        try {
          const statsRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
            params: {
              part: 'statistics,snippet',
              id: item.id.videoId,
              key: apiKey,
            },
          });

          const videoData = statsRes.data.items?.[0];
          if (!videoData) return null;

          return {
            videoId: item.id.videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.medium.url,
            channelName: item.snippet.channelTitle,
            viewCount: parseInt(videoData.statistics.viewCount, 10),
            uploadTime: videoData.snippet.publishedAt,
          } as YoutubeVideoResult;
        } catch (err) {
          console.error(`Failed to fetch video details for ID ${item.id.videoId}`, err);
          return null;
        }
      }),
    );

    // null 제외
    const videoList = results.filter((v): v is YoutubeVideoResult => v !== null);

    res.status(200).json({ success: true, data: videoList });
  } catch (error: unknown) {
    console.error('YouTube search failed:', error);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 403) {
        res.status(403).json({
          success: false,
          message: 'YouTube API 할당량 초과 또는 API 키 오류',
        });
        return;
      }
    }

    res.status(500).json({
      success: false,
      message: 'YouTube API 요청 실패',
      timestamp: new Date().toISOString(),
    });
  }
};
