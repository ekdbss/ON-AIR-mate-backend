export interface YouTubeSearchResult {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails: {
      default: {
        url: string;
        width: number;
      };
    };
  };
}

export interface YouTubeSearchResponse {
  items: YouTubeSearchResult[];
}

export interface YouTubeVideoDetailsResult {
  id: string;
  statistics: {
    viewCount: string;
  };
  contentDetails: {
    duration: string;
  };
}

export interface YouTubeVideoDetailsResponse {
  items: YouTubeVideoDetailsResult[];
}

export interface RecommendedVideoDto {
  videoId: string;
  title: string;
  thumbnail: string;
  channelName: string;
  viewCount: number;
  uploadTime: string;
  duration: string;
  durationFormatted: string;
}
