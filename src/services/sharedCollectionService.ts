import { prisma } from '../lib/prisma.js';
import { SharedCollectionResponseDto } from '../dtos/sharedCollectionDto.js';

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
}
