import { PrismaClient } from '@prisma/client';
import { RoomInfoResponseDto } from '../dtos/roomInfoDto.js';
import { formatISO8601Duration } from '../utils/formatters.js';
import AppError from '../middleware/errors/AppError.js';

const prisma = new PrismaClient();

/**
 * ID를 기반으로 특정 방의 상세 정보를 조회합니다.
 * @param roomId 조회할 방의 ID
 * @returns 방의 상세 정보
 * @throws {AppError} 해당 ID의 방을 찾을 수 없는 경우
 */
const getRoomInfoById = async (roomId: number): Promise<RoomInfoResponseDto> => {
  console.log(`[Service] Fetching room with ID: ${roomId}`);

  const room = await prisma.room.findUnique({
    where: { roomId: roomId },
    include: {
      host: true,
      _count: {
        select: { participants: true },
      },
    },
  });

  console.log('[Service] Room data:', room);

  if (!room) {
    console.error(`[Service] Room with ID ${roomId} not found.`);
    throw new AppError('ROOM_001', `ID가 ${roomId}인 방을 찾을 수 없습니다.`);
  }

  console.log('[Service] Host data:', room.host);

  if (!room.host) {
    console.error(`[Service] Host for room ID ${roomId} not found.`);
    throw new AppError('GENERAL_005', `ID가 ${roomId}인 방의 호스트 정보를 찾을 수 없습니다.`);
  }

  const video = await prisma.youtubeVideo.findUnique({
    where: { videoId: room.videoId },
  });

  console.log('[Service] Video data:', video);

  if (!video) {
    console.error(`[Service] Video for room ID ${roomId} not found.`);
    throw new AppError('ROOM_007', `ID가 ${roomId}인 방의 비디오 정보를 찾을 수 없습니다.`);
  }

  const roomInfo: RoomInfoResponseDto = {
    roomId: room.roomId,
    roomTitle: room.roomName,

    videoId: video.videoId,
    videoTitle: video.title,
    videoThumbnail: video.thumbnail ?? '',
    duration: formatISO8601Duration(video.duration ?? 'PT0S'),

    hostNickname: room.host.nickname,
    hostProfileImage: room.host.profileImage || '',
    hostPopularity: room.host.popularity,
    currentParticipants: room._count.participants,
    maxParticipants: room.maxParticipants,
    isPrivate: !room.isPublic,
    isActive: room.isActive,
    autoArchiving: room.autoArchive,
    invitePermission: room.inviteAuth,
    createdAt: room.createdAt.toISOString(),
  };

  return roomInfo;
};

export const roomInfoService = {
  getRoomInfoById,
};
