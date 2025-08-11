import { prisma } from '../lib/prisma.js';
import { reportReason as ReportReasonEnum } from '@prisma/client';

// 타입 정의
interface Block {
  blockerUserId: number;
  blockedUserId: number;
  reportReasons: ReportReasonEnum[];
  customReason?: string;
}

/**
 * 차단 생성
 */
export const newBlock = async (data: Block) => {
  return prisma.userBlock.create({
    data: {
      blockerUserId: data.blockerUserId,
      blockedUserId: data.blockedUserId,
      customReason: data.customReason,
      reportReasons: {
        create: data.reportReasons.map(reasonValue => ({ reason: reasonValue })),
      },
    },
  });
};

/**
 * 차단 목록 조회
 */
export const getBlockList = async (blockerUserId: number) => {
  const blocks = await prisma.userBlock.findMany({
    where: {
      blockerUserId,
      isActive: true,
    },
    include: {
      blocked: {
        select: {
          userId: true,
          nickname: true,
          profileImage: true,
        },
      },
      reportReasons: {
        select: {
          reason: true,
        },
      },
    },
    orderBy: { blockedAt: 'desc' },
  });

  return blocks.map(block => ({
    blockId: block.blockId,
    userId: block.blocked.userId,
    nickname: block.blocked.nickname,
    profileImage: block.blocked.profileImage,
    reasons: block.reportReasons.map(r => r.reason),
    blockedAt: block.blockedAt,
  }));
};

/**
 * 차단 해제
 */
export const unBlock = async (blockId: number) => {
  return prisma.userBlock.updateMany({
    where: {
      blockId,
      isActive: true,
    },
    data: {
      isActive: false,
    },
  });
};
