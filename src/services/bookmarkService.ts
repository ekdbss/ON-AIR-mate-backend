import { prisma } from '../lib/prisma.js';
import type { Prisma } from '@prisma/client';
import AppError from '../middleware/errors/AppError.js';
import { tryParseBookmarkMessage } from '../utils/parseBookmark.js';

// 1. 북마크 생성 서비스
export const createBookmark = async (
  userId: number,
  roomId: number,
  message: string,
  timeline: number,
) => {
  return await prisma.bookmark.create({
    data: {
      userId,
      roomId,
      content: message,
      timeline,
    },
  });
};

//1-1. 소캣에서 북마크 생성하기
export const createBookmarkFromSocket = async (userId: number, roomId: number, message: string) => {
  const result = tryParseBookmarkMessage(message);
  if (!result) {
    throw new AppError('CHAT_003', '메시지에서 유효한 타임라인을 찾을 수 없습니다.');
  }
  const { timeline, content } = result;
  console.log(`북마크 파싱 성공: ${timeline}`);
  console.log(`메시지: ${content}`);

  return await createBookmark(userId, roomId, content, timeline);
};

// 2. 북마크 목록 조회 서비스
interface GetBookmarksOptions {
  collectionId?: number;
  uncategorized?: boolean;
}

type BookmarkWithRelations = Prisma.BookmarkGetPayload<{
  include: {
    room: {
      include: {
        youtube_videos: true; // Room.video (YoutubeVideo)
      };
    };
    collection: {
      select: { title: true };
    };
  };
}>;

export const getBookmarks = async (userId: number, options: GetBookmarksOptions) => {
  const { collectionId, uncategorized } = options || {};

  // 공통 where
  const baseWhere: Prisma.BookmarkWhereInput = { userId };

  // collectionId 지정된 경우 → 해당 컬렉션 북마크만
  if (typeof collectionId === 'number') {
    baseWhere.collectionId = collectionId;
  }
  // uncategorized 플래그 켜진 경우 → 컬렉션 없는 북마크만
  else if (uncategorized === true) {
    baseWhere.collectionId = null;
  }

  // 필요한 관계 포함해서 조회
  const rows: BookmarkWithRelations[] = await prisma.bookmark.findMany({
    where: baseWhere,
    include: {
      room: { include: { youtube_videos: true } },
      collection: { select: { title: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // HH:MM:SS 변환 유틸
  const formatTimeline = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
  };

  // room 단위 그룹화
  const groupByRoom = (list: BookmarkWithRelations[], includeCreatedAt: boolean) => {
    const grouped: Array<{
      roomData: {
        roomId: number;
        roomName: string | null;
        videoTitle: string | null;
        videoThumbnail: string | null;
        collectionTitle: string | null;
      };
      bookmarks: Array<{
        bookmarkId: number;
        message: string;
        timeline: number | null;
        createdAt?: Date;
      }>;
    }> = [];

    const map = new Map<number, number>();

    for (const b of list) {
      const roomId = b.roomId;
      const roomName = b.room?.roomName ?? null;
      const videoTitle = b.room?.youtube_videos?.title ?? null;
      const videoThumbnail = b.room?.youtube_videos?.thumbnail ?? null;
      const bookmarkCollectionTitle = b.collection?.title ?? null;

      let idx = map.get(roomId);
      if (idx === undefined) {
        grouped.push({
          roomData: {
            roomId,
            roomName,
            videoTitle,
            videoThumbnail,
            collectionTitle: bookmarkCollectionTitle,
          },
          bookmarks: [],
        });
        idx = grouped.length - 1;
        map.set(roomId, idx);
      } else {
        if (grouped[idx].roomData.collectionTitle == null && bookmarkCollectionTitle != null) {
          grouped[idx].roomData.collectionTitle = bookmarkCollectionTitle;
        }
      }

      const item: {
        bookmarkId: number;
        message: string;
        timeline: number | null;
        createdAt?: Date;
      } = {
        bookmarkId: b.bookmarkId,
        message: `${formatTimeline(b.timeline ?? 0)} ${b.content ?? ''}`,
        timeline: b.timeline ?? 0,
      };

      if (includeCreatedAt) {
        item.createdAt = b.createdAt;
      }

      grouped[idx].bookmarks.push(item);
    }

    return grouped;
  };

  // collectionId 지정 시
  if (typeof collectionId === 'number') {
    return {
      uncategorized: [],
      all: groupByRoom(rows, true),
    };
  }

  // uncategorized 지정 시
  if (uncategorized === true) {
    return {
      uncategorized: groupByRoom(rows, false),
      all: [],
    };
  }

  // 기본: uncategorized = collectionId == null, all = collectionId != null
  const uncategorizedList = rows.filter(b => b.collectionId == null);
  const categorizedList = rows.filter(b => b.collectionId != null);

  return {
    uncategorized: groupByRoom(uncategorizedList, false),
    all: groupByRoom(categorizedList, true),
  };
};

// 3. 북마크 삭제 서비스
export const deleteBookmark = async (userId: number, bookmarkId: number) => {
  const bookmark = await prisma.bookmark.findUnique({
    where: { bookmarkId },
  });

  if (!bookmark || bookmark.userId !== userId) {
    throw new Error('권한이 없습니다.');
  }

  await prisma.bookmark.delete({ where: { bookmarkId } });
};

// 4. 북마크 컬렉션 이동 서비스
export const moveBookmarkToCollection = async (
  userId: number,
  bookmarkId: number,
  collectionId: number,
) => {
  const bookmark = await prisma.bookmark.findUnique({
    where: { bookmarkId },
  });

  if (!bookmark || bookmark.userId !== userId) {
    throw new Error('권한이 없습니다.');
  }

  const res1 = await prisma.bookmark.update({
    where: { bookmarkId },
    data: { collectionId },
  });

  // 1. 해당 Room 조회 (YoutubeVideo 포함)
  const room = await prisma.room.findUnique({
    where: { roomId: res1.roomId },
    include: {
      youtube_videos: {
        select: { thumbnail: true },
      },
    },
  });

  // 2. 현재 Collection 조회
  const collection = await prisma.collection.findUnique({
    where: { collectionId },
    select: { bookmarkCount: true, coverImage: true },
  });

  // 3. coverImage 업데이트 여부 결정
  const shouldUpdateCover =
    collection?.bookmarkCount === 0 && !collection.coverImage && room?.youtube_videos?.thumbnail;

  // 4. Collection 업데이트- bookmarkCount가 0에서 1로 되는 순간에만 썸네일 지정
  await prisma.collection.update({
    where: { collectionId },
    data: {
      bookmarkCount: { increment: 1 },
      ...(shouldUpdateCover ? { coverImage: room.youtube_videos.thumbnail } : {}),
    },
  });
};

// 5. 북마크로 방 생성 서비스
export const createRoomFromBookmark = async (
  userId: number,
  bookmarkId: number,
  roomTitle: string,
  maxParticipants: number,
  isPrivate: boolean,
  startFrom: 'BOOKMARK' | 'BEGINNING',
) => {
  // 입력 값 검증
  if (!roomTitle?.trim()) {
    throw new Error('방 제목은 필수입니다.');
  }

  if (maxParticipants !== 8 && maxParticipants !== 15 && maxParticipants !== 30) {
    throw new Error('최대 참가자 수는 8, 15, 30 중 하나여야 합니다.');
  }

  const bookmark = await prisma.bookmark.findUnique({
    where: { bookmarkId },
    include: {
      room: {
        include: {
          youtube_videos: true,
        },
      },
    },
  });

  if (!bookmark || bookmark.userId !== userId) {
    throw new Error('해당 북마크에 대한 권한이 없습니다.');
  }

  const videoThumbnail = bookmark.room?.youtube_videos?.thumbnail ?? '';
  const startTime = startFrom === 'BOOKMARK' ? (bookmark?.timeline ?? 0) : 0;

  if (!bookmark.room?.videoId) {
    throw new Error('북마크에 연결된 비디오를 찾을 수 없습니다.');
  }

  const newRoom = await prisma.room.create({
    data: {
      roomName: roomTitle,
      maxParticipants,
      isPublic: !isPrivate,
      videoId: bookmark.room.videoId,
      hostId: userId,
      startType: startFrom,
      startTime: startTime,
    },
  });

  //참가자 목록 추가
  await prisma.roomParticipant.create({
    data: {
      roomId: newRoom.roomId,
      userId: userId,
      role: 'host',
    },
  });

  return {
    roomId: newRoom.roomId,
    thumbnail: videoThumbnail,
    message: '방이 생성되었습니다.',
  };
};
