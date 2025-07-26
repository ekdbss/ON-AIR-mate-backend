import { Request, Response } from 'express';
import axios from 'axios';
import { sendError } from '../utils/response';
import { saveYoutubeVideo } from '../services/youtubeDetailService';

export const getYoutubeVideoDetail = async (
  req: Request<{ videoId: string }>,
  res: Response,
): Promise<void> => {
  try {
    const { videoId } = req.params;

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      sendError(res, '서버 설정 오류: YOUTUBE_API_KEY가 누락되었습니다.', 500, 'SERVER_ERROR');
      return;
    }

    // 1. 영상 상세 정보 + 통계 + duration
    const videoRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        part: 'snippet,statistics,contentDetails',
        id: videoId,
        key: apiKey,
      },
    });

    const videoData = videoRes.data.items?.[0];

    if (!videoData) {
      sendError(res, '해당 videoId에 대한 영상 정보를 찾을 수 없습니다.', 404, 'NOT_FOUND');
      return;
    }

    const { id, snippet, statistics, contentDetails } = videoData;

    const channelId = snippet.channelId;

    // 2. 채널 아이콘 가져오기
    const channelRes = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      params: {
        part: 'snippet',
        id: channelId,
        key: apiKey,
      },
    });

    const channelIcon = channelRes.data.items?.[0]?.snippet?.thumbnails?.default?.url ?? null;

    // 3. 결과 객체 구성
    const result = {
      videoId: id,
      title: snippet.title,
      description: snippet.description,
      thumbnail: snippet.thumbnails.medium?.url,
      channelName: snippet.channelTitle,
      channelIcon: channelIcon,
      viewCount: parseInt(statistics?.viewCount || '0', 10),
      duration: contentDetails.duration, // ISO 8601 (e.g. "PT15M33S")
      uploadedAt: snippet.publishedAt,
    };

    // 4. DB 저장
    await saveYoutubeVideo(result);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(error);
    sendError(res, 'YouTube API 요청 실패', 500, 'INTERNAL_SERVER_ERROR');
  }
};
