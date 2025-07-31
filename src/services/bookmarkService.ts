import { prisma } from '../lib/prisma.js';

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

// 2. 북마크 목록 조회 서비스
export const getBookmarks = async (
  userId: number,
  options: { collectionId?: number; uncategorized?: boolean },
) => {
  const { collectionId, uncategorized } = options;

  const bookmarks = await prisma.bookmark.findMany({
    where: {
      userId,
      ...(collectionId !== undefined && { collectionId }),
      ...(uncategorized && { collectionId: null }),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      room: {
        select: {
          roomName: true,
          video: {
            select: {
              title: true,
              thumbnail: true,
            },
          },
        },
      },
      collection: {
        select: {
          title: true, // 북마크 컬렉션 제목
        },
      },
    },
  });

  const formatted = bookmarks.map(bookmark => ({
    bookmarkId: bookmark.bookmarkId,
    videoTitle: bookmark.room?.video?.title,
    videoThumbnail: bookmark.room?.video?.thumbnail,
    message: bookmark.content,
    timeline: bookmark.timeline,
    createdAt: bookmark.createdAt,
    collectionTitle: bookmark.collection?.title ?? null,
  }));

  if (uncategorized) {
    return { uncategorized: formatted, all: [] };
  } else {
    return { uncategorized: [], all: formatted };
  }
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
  isPublic: boolean,
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
      isPublic,
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
