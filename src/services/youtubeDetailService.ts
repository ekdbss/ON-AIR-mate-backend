import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type YoutubeVideoDetail = {
  videoId: string;
  title: string;
  description?: string;
  thumbnail?: string;
  channelIcon?: string;
  channelName?: string;
  viewCount: number;
  duration?: string;
  uploadedAt?: string;
};

// 유튜브 영상 정보를 DB에 저장/업데이트하는 함수
export const saveYoutubeVideo = async (video: YoutubeVideoDetail) => {
  try {
    const existingVideo = await prisma.youtubeVideo.findUnique({
      where: { videoId: video.videoId },
    });

    const data = {
      title: video.title,
      description: video.description || null,
      thumbnail: video.thumbnail || null,
      channelIcon: video.channelIcon || null,
      channelName: video.channelName || null,
      viewCount: video.viewCount,
      duration: video.duration || null,
      uploadedAt: video.uploadedAt ? new Date(video.uploadedAt) : null,
    };

    if (existingVideo) {
      return await prisma.youtubeVideo.update({
        where: { videoId: video.videoId },
        data,
      });
    } else {
      return await prisma.youtubeVideo.create({
        data: {
          videoId: video.videoId,
          ...data,
        },
      });
    }
  } catch (error) {
    console.error('영상 저장 중 오류 발생:', error);
    throw new Error('DB 저장 실패');
  }
};
