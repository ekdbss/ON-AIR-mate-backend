export interface YoutubeSearchDto {
  query: string;
  limit?: string | number;
}

export interface YoutubeVideoDto {
  videoId: string;
  title: string;
  thumbnail: string;
  channelName: string;
  viewCount: number;
  uploadTime: string;
}
