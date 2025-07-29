import { PrismaClient } from '@prisma/client';
import AppError from '../middleware/errors/AppError.js';

const prisma = new PrismaClient();

// 사용자 프로필 조회
export const getUserProfile = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { userId },
    select: {
      userId: true,
      nickname: true,
      profileImage: true,
      popularity: true,
      isVerified: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError('USER_001');
  }

  return {
    ...user,
    verified: user.isVerified,
  };
};

// 사용자 프로필 수정
export const updateUserProfile = async (
  userId: number,
  data: { nickname?: string; profileImage?: string },
) => {
  // 닉네임 변경 시 중복 체크
  if (data.nickname) {
    const existingUser = await prisma.user.findFirst({
      where: {
        nickname: data.nickname,
        NOT: { userId },
      },
    });

    if (existingUser) {
      throw new AppError('USER_002');
    }
  }

  return await prisma.user.update({
    where: { userId },
    data: {
      ...(data.nickname && { nickname: data.nickname }),
      ...(data.profileImage !== undefined && { profileImage: data.profileImage }),
    },
  });
};

// 알림 설정 조회
export const getNotificationSettings = async (userId: number) => {
  const settings = await prisma.userAgreement.findUnique({
    where: { userId },
    select: {
      serviceNotification: true,
      advertisingNotification: true,
      nightNotification: true,
    },
  });

  if (!settings) {
    throw new AppError('USER_003');
  }

  return {
    serviceNotification: settings.serviceNotification,
    advertisementNotification: settings.advertisingNotification,
    nightNotification: settings.nightNotification,
  };
};

// 알림 설정 수정
export const updateNotificationSettings = async (
  userId: number,
  settings: {
    serviceNotification?: boolean;
    advertisementNotification?: boolean;
    nightNotification?: boolean;
  },
) => {
  return await prisma.userAgreement.update({
    where: { userId },
    data: {
      ...(settings.serviceNotification !== undefined && {
        serviceNotification: settings.serviceNotification,
      }),
      ...(settings.advertisementNotification !== undefined && {
        advertisingNotification: settings.advertisementNotification,
      }),
      ...(settings.nightNotification !== undefined && {
        nightNotification: settings.nightNotification,
      }),
    },
  });
};

// 참여한 방 목록 조회
export const getParticipatedRooms = async (userId: number) => {
  try {
    // 디버깅 로그
    console.log(`[getParticipatedRooms] 조회 시작 - userId: ${userId}`);

    const participations = await prisma.roomParticipant.findMany({
      where: {
        userId,
        // 퇴장한 방만 조회 (leftAt이 null이 아닌 경우)
        leftAt: {
          not: null,
        },
      },
      include: {
        room: {
          include: {
            video: {
              select: {
                videoId: true,
                title: true,
                thumbnail: true,
              },
            },
            bookmarks: {
              where: { userId },
              select: {
                bookmarkId: true,
                content: true,
              },
            },
          },
        },
      },
      orderBy: {
        joinedAt: 'desc',
      },
    });

    console.log(`[getParticipatedRooms] 참여 기록 수: ${participations.length}`);

    // 참여 기록이 없는 경우 빈 배열 반환
    if (participations.length === 0) {
      return [];
    }

    // 30초 이상 체류한 방만 필터링
    const filteredParticipations = participations.filter(p => {
      if (p.leftAt && p.joinedAt) {
        const durationMs = p.leftAt.getTime() - p.joinedAt.getTime();
        const durationSeconds = durationMs / 1000;
        return durationSeconds >= 30;
      }
      return false;
    });

    console.log(`[getParticipatedRooms] 30초 이상 체류한 방: ${filteredParticipations.length}`);

    return filteredParticipations.map(p => {
      // null 체크
      if (!p.room) {
        console.error(
          `[getParticipatedRooms] room이 null입니다. participantId: ${p.participantId}`,
        );
        throw new AppError('ROOM_001', '참여 기록의 방 정보를 찾을 수 없습니다.');
      }

      if (!p.room.video) {
        console.error(`[getParticipatedRooms] video가 null입니다. roomId: ${p.room.roomId}`);
        throw new AppError('ROOM_007', '방의 비디오 정보를 찾을 수 없습니다.');
      }

      return {
        roomId: p.room.roomId,
        roomTitle: p.room.roomName,
        videoTitle: p.room.video.title || '제목 없음',
        videoThumbnail: p.room.video.thumbnail || '',
        participatedAt: p.joinedAt,
        bookmarks:
          p.room.bookmarks?.map(b => ({
            bookmarkId: b.bookmarkId,
            message: b.content || '',
          })) || [],
      };
    });
  } catch (error) {
    console.error('[getParticipatedRooms] 에러 발생:', error);

    // AppError인 경우 그대로 throw
    if (error instanceof AppError) {
      throw error;
    }

    // 예상치 못한 에러
    throw new AppError('GENERAL_005', '참여한 방 목록을 조회하는 중 오류가 발생했습니다.', error);
  }
};

// 검색 기록 조회
export const getSearchHistory = async (userId: number) => {
  try {
    const history = await prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { searchedAt: 'desc' },
      take: 10, // 최근 10개만
    });

    return history.map(h => ({
      keyword: h.searchKeyword,
      searchedAt: h.searchedAt,
    }));
  } catch (error) {
    console.error('[getSearchHistory] 에러 발생:', error);
    throw new AppError('GENERAL_005', '검색 기록을 조회하는 중 오류가 발생했습니다.', error);
  }
};

// 의견 보내기
export const sendUserFeedback = async (userId: number, content: string) => {
  if (!content || content.trim().length === 0) {
    throw new AppError('USER_005');
  }

  try {
    return await prisma.userFeedback.create({
      data: {
        userId,
        content: content.trim(),
      },
    });
  } catch (error) {
    console.error('[sendUserFeedback] 에러 발생:', error);
    throw new AppError('GENERAL_005', '의견을 저장하는 중 오류가 발생했습니다.', error);
  }
};
