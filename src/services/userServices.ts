import AppError from '../middleware/errors/AppError.js';

import { prisma } from '../lib/prisma.js';

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
        // 퇴장한 방만 조회 (left_at이 null이 아닌 경우)
        left_at: {
          not: null,
        },
      },
      include: {
        room: {
          include: {
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
      if (p.left_at && p.joinedAt) {
        const durationMs = p.left_at.getTime() - p.joinedAt.getTime();
        const durationSeconds = durationMs / 1000;
        return durationSeconds >= 30;
      }
      return false;
    });

    console.log(`[getParticipatedRooms] 30초 이상 체류한 방: ${filteredParticipations.length}`);

    const results = await Promise.all(
      filteredParticipations.map(async p => {
        // null 체크
        if (!p.room) {
          console.error(
            `[getParticipatedRooms] room이 null입니다. participantId: ${p.participantId}`,
          );
          throw new AppError('ROOM_001', '참여 기록의 방 정보를 찾을 수 없습니다.');
        }

        const video = await prisma.youtubeVideo.findUnique({
          where: { videoId: p.room.videoId },
          select: {
            title: true,
            thumbnail: true,
          },
        });

        if (!video) {
          console.error(`[getParticipatedRooms] video가 null입니다. roomId: ${p.room.roomId}`);
          throw new AppError('ROOM_007', '방의 비디오 정보를 찾을 수 없습니다.');
        }

        return {
          roomId: p.room.roomId,
          roomTitle: p.room.roomName,
          videoTitle: video.title || '제목 없음',
          videoThumbnail: video.thumbnail || '',
          participatedAt: p.joinedAt,
          bookmarks:
            p.room.bookmarks?.map(b => ({
              bookmarkId: b.bookmarkId,
              message: b.content || '',
            })) || [],
        };
      }),
    );
    return results;
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

export const deleteParticipatedRoom = async (userId: number, roomId: number) => {
  try {
    // 해당 사용자의 참여 기록 확인
    const participation = await prisma.roomParticipant.findUnique({
      where: {
        unique_participant: {
          roomId,
          userId,
        },
      },
    });

    if (!participation) {
      throw new AppError('ROOM_001', '참여한 방 기록을 찾을 수 없습니다.');
    }

    // 본인의 기록만 삭제할 수 있도록 확인
    if (participation.userId !== userId) {
      throw new AppError('AUTH_006', '다른 사용자의 기록은 삭제할 수 없습니다.');
    }

    // left_at이 null인 경우 (아직 방에 있는 경우)
    if (participation.left_at === null) {
      throw new AppError('ROOM_009', '현재 참여 중인 방의 기록은 삭제할 수 없습니다.');
    }

    // 참여 기록 삭제
    await prisma.roomParticipant.delete({
      where: {
        participantId: participation.participantId,
      },
    });

    console.log(
      `[deleteParticipatedRoom] 참여 기록 삭제 완료 - userId: ${userId}, roomId: ${roomId}`,
    );
  } catch (error) {
    console.error('[deleteParticipatedRoom] 에러 발생:', error);

    // AppError인 경우 그대로 throw
    if (error instanceof AppError) {
      throw error;
    }

    // 예상치 못한 에러
    throw new AppError('GENERAL_005', '참여 기록을 삭제하는 중 오류가 발생했습니다.', error);
  }
};
