import axios, { isAxiosError } from 'axios';
import { formatISO8601Duration } from '../utils/formatters.js';
import {
  RecommendedVideoDto,
  YouTubeSearchResponse,
  YouTubeVideoDetailsResponse,
  YouTubeVideoDetailsResult,
  YouTubeSearchResult,
} from '../dtos/recommendationDto.js';

const YOUTUBE_SEARCH_API_URL = 'https://www.googleapis.com/youtube/v3/search';
const YOUTUBE_VIDEOS_API_URL = 'https://www.googleapis.com/youtube/v3/videos';

export const getRecommendedVideos = async (
  keyword: string,
  limit: number = 3,
): Promise<RecommendedVideoDto[]> => {
  try {
    // 1. keyword로 비디오 검색
    const searchResponse = await axios.get<YouTubeSearchResponse>(YOUTUBE_SEARCH_API_URL, {
      params: {
        part: 'snippet',
        q: keyword,
        key: process.env.YOUTUBE_API_KEY,
        type: 'video',
        maxResults: limit,
      },
    });
    if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
      return [];
    }

    const videoIds = searchResponse.data.items.map((item: YouTubeSearchResult) => item.id.videoId);

    // 2단계: 검색된 영상 ID로 상세 정보 조회
    const detailsResponse = await axios.get<YouTubeVideoDetailsResponse>(YOUTUBE_VIDEOS_API_URL, {
      params: {
        part: 'contentDetails,statistics',
        id: videoIds.join(','),
        key: process.env.YOUTUBE_API_KEY,
      },
    });

    console.log('YouTube Videos API 응답:', JSON.stringify(detailsResponse.data, null, 2));

    const videoDetailsMap = new Map<string, YouTubeVideoDetailsResult>();
    detailsResponse.data.items.forEach((item: YouTubeVideoDetailsResult) => {
      videoDetailsMap.set(item.id, item);
    });

    // 3. 검색 결과와 상세 정보 조합
    const videos: RecommendedVideoDto[] = searchResponse.data.items.map(
      (item: YouTubeSearchResult) => {
        const videoId = item.id.videoId;
        const details = videoDetailsMap.get(videoId);
        const isoDuration = details ? details.contentDetails.duration : '';
        return {
          videoId: videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.default.url,
          channelName: item.snippet.channelTitle || 'Unknown Channel',
          viewCount: details ? parseInt(details.statistics.viewCount, 10) : 0,
          uploadTime: item.snippet.publishedAt,
          duration: isoDuration, // 원본 ISO 8601 형식
          durationFormatted: formatISO8601Duration(isoDuration), // "mm:ss" 형식으로 변환된 값
        };
      },
    );
    return videos;
  } catch (error) {
    if (isAxiosError(error)) {
      const apiError = error.response?.data?.error?.message || error.message;
      throw new Error(`YouTube API 호출 중 Axios 오류 발생: ${apiError}`);
    } else if (error instanceof Error) {
      throw new Error(`YouTube API 호출 중 오류 발생: ${error.message}`);
    }
    throw new Error('YouTube API 호출 중 알 수 없는 오류가 발생했습니다.');
  }
};
