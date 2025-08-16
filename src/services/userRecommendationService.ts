import { UserRecommendationRequestDto } from '../dtos/userRecommendationDto.js';

import { prisma } from '../lib/prisma.js';

export class RecommendationService {
  // 1. 일일 추천하기 로직
  async createDailyRecommendation(userId: number, dto: UserRecommendationRequestDto) {
    // 오늘 자정 기준 날짜
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 이미 오늘 추천했는지 DB에서 확인
    const existing = await prisma.dailyRecommendation.findFirst({
      where: {
        recommenderId: userId,
        recommendedUserId: dto.targetUserId,
        recommendationDate: today,
      },
    });

    if (existing) {
      throw new Error('이미 오늘 추천을 보냈습니다.');
    }

    // 추천 생성 + 인기도 증가 (트랜잭션 처리)
    await prisma.$transaction([
      prisma.dailyRecommendation.create({
        data: {
          recommenderId: userId,
          recommendedUserId: dto.targetUserId,
          recommendationDate: today,
        },
      }),
      prisma.user.update({
        where: { userId: dto.targetUserId },
        data: {
          popularity: {
            increment: 1,
          },
        },
      }),
      //인기도 상승에 따른 알림 생성
      prisma.notification.create({
        data: {
          fromUserId: userId,
          toUserId: dto.targetUserId,
          type: 'popularityUp',
          title: `인기도가 1 상승하였습니다.`,
        },
      }),
    ]);

    return {
      success: true,
      message: '추천을 보냈습니다.',
    };
  }

  // 2. 추천 가능 여부 확인
  async checkDailyRecommendation(userId: number, targetUserId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const existing = await prisma.dailyRecommendation.findFirst({
      where: {
        recommenderId: userId,
        recommendedUserId: targetUserId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    return {
      success: true,
      data: {
        canRecommend: !existing,
        lastRecommendedAt: existing?.createdAt ?? null,
      },
    };
  }
}
