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
   * 활성화된 모든 방 목록을 데이터베이스에서 조회하고, 비즈니스 로직에 따라 처리합니다.
   * @param query - 필터링 및 정렬을 위한 쿼리 파라미터
   * @param userId - (Optional) 요청한 사용자의 ID. 시청 기록 기반 추천에 사용됩니다.
   */
  public async findAll(query: GetRoomsQueryDto, userId?: number): Promise<RoomsDataDto> {
    console.log('Service: Finding rooms with query:', query);

    // 1. Prisma 쿼리 조건 구성 (검색, 정렬)
    const where: Prisma.RoomWhereInput = {
      isActive: true, // 활성화된 방만 조회
      isPublic: true, // 공개된 방만 조회 (요구사항에 따라 변경 가능)
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
      // 'videoTitle'은 DB에서 직접 검색하지 않고, 조회 후 애플리케이션 레벨에서 필터링합니다.
    }

    const orderBy: Prisma.RoomOrderByWithRelationInput = {};
    if (query.sortBy === 'popularity') {
      orderBy.host = {
        popularity: 'desc',
      };
    } else {
      // 'latest' or default
      orderBy.createdAt = 'desc';
    }

    // 2. 데이터베이스에서 방 목록 조회
    const rooms = await prisma.room.findMany({
      where,
      include: {
        host: true, // 호스트 정보 포함
        _count: {
          select: { participants: true },
        },
      },
      orderBy,
    });

    // 3. 각 방의 비디오 정보 조회 (N+1 문제 방지를 위해 Promise.all 사용)
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
        if (!video) return null; // 비디오 정보가 없으면 목록에서 제외

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

    // videoTitle 검색어 필터링 (DB에서 직접 처리 불가 시)
    if (query.keyword && query.searchType === 'videoTitle') {
      roomDtos = roomDtos.filter(room =>
        room.videoTitle.toLowerCase().includes(query.keyword!.toLowerCase()),
      );
    }

    // 5. 데이터 분리 (continueWatching / onAirRooms)
    // TODO: 추후 사용자의 실제 시청 기록(RoomParticipant)을 기반으로 로직 구현 필요
    const continueWatching: RoomDto[] = [];
    const onAirRooms = roomDtos;

    // 예시 로직 (만약 userId가 제공되면)
    if (userId) {
      // 사용자가 참여했던 방 목록을 조회하여 continueWatching 목록을 채우는 로직 추가
    }

    return {
      continueWatching,
      onAirRooms,
    };
  }
}
