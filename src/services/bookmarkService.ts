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
        video: true; // <-- Room.video (YoutubeVideo)
      };
    };
    collection: {
      select: { title: true };
    };
  };
}>;

export const getBookmarks = async (userId: number, options: GetBookmarksOptions) => {
  const { collectionId, uncategorized } = options || {};

  // 동적 where 구성
  const where: Prisma.BookmarkWhereInput = { userId };
  if (typeof collectionId === 'number') {
    // 특정 컬렉션만
    where.collectionId = collectionId;
  } else if (uncategorized === true) {
    // 미분류만
    where.collectionId = null;
  }

  // 필요한 관계 포함해서 조회 (room.video, bookmark.collection)
  const rows: BookmarkWithRelations[] = await prisma.bookmark.findMany({
    where,
    include: {
      room: {
        include: {
          video: true, // YoutubeVideo
        },
      },
      collection: {
        select: { title: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // room 단위 그룹화 유틸
  const groupByRoom = (list: BookmarkWithRelations[], includeCreatedAt: boolean) => {
    const grouped: Array<{
      roomData: {
        roomId: number;
        videoTitle: string | null;
        videoThumbnail: string | null;
        collectionTitle: string | null;
      };
      bookmarks: Array<{
        bookmarkId: number;
        message: string; // = content
        timeline: number | null;
        createdAt?: Date; // all에서만
      }>;
    }> = [];

    const map = new Map<number, number>(); // roomId -> grouped 인덱스

    for (const b of list) {
      const roomId = b.roomId;

      // roomData 구성
      const videoTitle = b.room?.video?.title ?? null;
      const videoThumbnail = b.room?.video?.thumbnail ?? null;
      const bookmarkCollectionTitle = b.collection?.title ?? null;

      let idx = map.get(roomId);
      if (idx === undefined) {
        grouped.push({
          roomData: {
            roomId,
            videoTitle,
            videoThumbnail,
            collectionTitle: bookmarkCollectionTitle, // 최초 북마크의 컬렉션 제목(미분류면 null)
          },
          bookmarks: [],
        });
        idx = grouped.length - 1;
        map.set(roomId, idx);
      } else {
        // 이미 그룹이 있는데 roomData.collectionTitle이 비어 있고
        // 이번 북마크에 컬렉션 제목이 있으면 보완(옵션)
        if (grouped[idx].roomData.collectionTitle == null && bookmarkCollectionTitle != null) {
          grouped[idx].roomData.collectionTitle = bookmarkCollectionTitle;
        }
      }

      // bookmark 항목 구성 (message = content)
      const item: {
        bookmarkId: number;
        message: string;
        timeline: number | null;
        createdAt?: Date;
      } = {
        bookmarkId: b.bookmarkId,
        message: b.content ?? '', // schema 상 content가 메시지 본문
        timeline: b.timeline ?? 0, // 초 단위
      };

      if (includeCreatedAt) {
        item.createdAt = b.createdAt;
      }

      grouped[idx].bookmarks.push(item);
    }

    return grouped;
  };

  // 필터 동작
  if (typeof collectionId === 'number') {
    // 특정 컬렉션만 조회한 경우 → uncategorized는 비우고 all만 반환
    return {
      uncategorized: [],
      all: groupByRoom(rows, true), // createdAt 포함
    };
  }

  if (uncategorized === true) {
    // 미분류만 요청한 경우 → uncategorized만 반환
    return {
      uncategorized: groupByRoom(rows, false), // createdAt 제외
      all: [],
    };
  }

  // 기본(전체) → 한 번에 둘 다 구성
  const uncategorizedList = rows.filter(b => b.collectionId == null);
  return {
    uncategorized: groupByRoom(uncategorizedList, false), // createdAt 제외
    all: groupByRoom(rows, true), // createdAt 포함
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

  return await prisma.bookmark.update({
    where: { bookmarkId },
    data: { collectionId },
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
          video: true,
        },
      },
    },
  });

  if (!bookmark || bookmark.userId !== userId) {
    throw new Error('해당 북마크에 대한 권한이 없습니다.');
  }

  const videoThumbnail = bookmark.room?.video?.thumbnail ?? '';
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

  return {
    roomId: newRoom.roomId,
    thumbnail: videoThumbnail,
    message: '방이 생성되었습니다.',
  };
};
