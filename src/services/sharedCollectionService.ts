import { prisma } from '../lib/prisma.js';
import {
  SharedCollectionActionDto,
  SharedCollectionResponseDto,
} from '../dtos/sharedCollectionDto.js';

export class SharedCollectionService {
  // 공유받은 컬렉션 목록 조회
  async getReceivedCollections(userId: number): Promise<SharedCollectionResponseDto[]> {
    const sharedCollections = await prisma.sharedCollection.findMany({
      where: { sharedToUserId: userId },
      include: {
        collection: {
          include: {
            user: true, // fromUser 정보
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return sharedCollections.map(sc => ({
      sharedCollectionId: sc.shareId,
      originalCollectionId: sc.collection.collectionId,
      title: `공유받은 컬렉션 by ${sc.collection.user.nickname}`,
      fromUserId: sc.collection.user.userId,
      fromUserNickname: sc.collection.user.nickname,
      bookmarkCount: sc.collection.bookmarkCount,
      sharedAt: sc.createdAt,
    }));
  }

  // 공유 수락/거절
  async respondToSharedCollection(
    sharedCollectionId: number,
    action: SharedCollectionActionDto['action'],
  ) {
    const sharedCollection = await prisma.sharedCollection.findUnique({
      where: { shareId: sharedCollectionId },
      include: {
        collection: true,
      },
    });

    if (!sharedCollection) {
      throw new Error('존재하지 않는 공유입니다.');
    }

    if (action === 'ACCEPT') {
      // 복사본 생성
      await prisma.collection.create({
        data: {
          userId: sharedCollection.sharedToUserId,
          title: sharedCollection.collection.title,
          description: sharedCollection.collection.description,
          visibility: 'private', // 소문자!
          bookmarkCount: 0,
          isLiked: false,
          originalCollectionId: sharedCollection.collectionId,
          coverImage: sharedCollection.collection.coverImage,
        },
      });

      // 공유 내역 삭제
      await prisma.sharedCollection.delete({ where: { shareId: sharedCollectionId } });

      return { success: true, message: '컬렉션을 수락했습니다.' };
    }

    if (action === 'REJECT') {
      await prisma.sharedCollection.delete({ where: { shareId: sharedCollectionId } });
      return { success: true, message: '컬렉션을 거절했습니다.' };
    }

    throw new Error('유효하지 않은 요청입니다.');
  }
}
