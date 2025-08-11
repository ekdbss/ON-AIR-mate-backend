import { Prisma, PrismaClient } from '@prisma/client';
import {
  GetRoomsQueryDto,
  isSearchTypeOption,
  RoomDto,
  RoomsDataDto,
} from '../dtos/activeRoomsDto.js';
import { formatISO8601Duration } from '../utils/formatters.js';

const prisma = new PrismaClient();

export class ActiveRoomService {
  /**
   * 활성화된 방 목록 조회
   * @param query
   * @param userId
   */
  public async findAll(query: GetRoomsQueryDto, userId?: number): Promise<RoomsDataDto> {
    console.log('Service: Finding rooms with query:', query);

    // 1. Prisma 쿼리 조건 구성 (검색, 정렬)
    const where: Prisma.RoomWhereInput = {
      isActive: true,
      isPublic: true,
    };

    if (query.keyword && query.searchType && isSearchTypeOption(query.searchType)) {
      const { searchType, keyword } = query;

      if (searchType === 'hostNickname') {
        where.host = {
          nickname: {
            contains: keyword,
          },
        };
      } else if (searchType === 'roomTitle') {
        where.roomName = {
          contains: keyword,
        };
      }
    }

    const orderBy: Prisma.RoomOrderByWithRelationInput = {};
    if (query.sortBy === 'popularity') {
      orderBy.host = {
        popularity: 'desc',
      };
    } else {
      // 기본값: 최신순
      orderBy.createdAt = 'desc';
    }

    // 2. 데이터베이스에서 방 목록 조회
    const rooms = await prisma.room.findMany({
      where,
      include: {
        host: true,
        _count: {
          select: { participants: true },
        },
      },
      orderBy,
    });

    // 3. 각 방의 영상 정보 조회
    const videoIds = rooms.map(room => room.videoId);
    const videos = await prisma.youtubeVideo.findMany({
      where: {
        videoId: { in: videoIds },
      },
    });
    const videoMap = new Map(videos.map(v => [v.videoId, v]));

    // 4. DTO 형태로 데이터 매핑 및 추가 필터링
    let roomDtos: RoomDto[] = rooms
      .map(room => {
        const video = videoMap.get(room.videoId);
        if (!video) return null; // 영상 정보가 없으면 목록에서 제외

        return {
          roomId: room.roomId,
          roomTitle: room.roomName,
          videoTitle: video.title,
          videoThumbnail: video.thumbnail || 'url_default',
          hostNickname: room.host.nickname,
          hostProfileImage: room.host.profileImage || 'url_profile_default',
          hostPopularity: room.host.popularity,
          currentParticipants: room._count.participants,
          maxParticipants: room.maxParticipants,
          duration: formatISO8601Duration(video.duration || 'PT0S'),
          isPrivate: !room.isPublic,
        };
      })
      .filter((room): room is RoomDto => room !== null);

    // videoTitle 검색어 필터링
    if (query.keyword && query.searchType === 'videoTitle') {
      roomDtos = roomDtos.filter(room =>
        room.videoTitle.toLowerCase().includes(query.keyword!.toLowerCase()),
      );
    }

    // 5. 데이터 분리 (continueWatching: 이전에 참여했던 방 / onAirRooms: 활성화된 모든 방)
    const continueWatching: RoomDto[] = [];
    const onAirRooms = roomDtos;

    if (userId) {
      // 사용자가 참여했던 방 목록을 조회
      const userRooms = await prisma.roomParticipant.findMany({
        where: {
          userId,
          room: {
            isActive: true,
            isPublic: true,
          },
        },
        orderBy: { joinedAt: 'desc' },
        take: 3,
        include: {
          room: {
            include: {
              host: true,
              _count: { select: { participants: true } },
            },
          },
        },
      });
      userRooms.forEach(userRoom => {
        const room = userRoom.room;
        const video = videoMap.get(room.videoId);
        if (video) {
          continueWatching.push({
            roomId: room.roomId,
            roomTitle: room.roomName,
            videoTitle: video.title,
            videoThumbnail: video.thumbnail || 'url_default',
            hostNickname: room.host.nickname,
            hostProfileImage: room.host.profileImage || 'url_profile_default',
            hostPopularity: room.host.popularity,
            currentParticipants: room._count.participants,
            maxParticipants: room.maxParticipants,
            duration: formatISO8601Duration(video.duration || 'PT0S'),
            isPrivate: !room.isPublic,
          });
        }
      });
    }

    return {
      continueWatching,
      onAirRooms,
    };
  }
}
