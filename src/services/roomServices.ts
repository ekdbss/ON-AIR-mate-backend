import { PrismaClient, RoomParticipant } from '@prisma/client';
import { Participant, createNewRoom } from '../dtos/roomDto.js';
import { findUserById } from './authServices';

const prisma = new PrismaClient();

/**
 * 방 관리
 */

//방 생성
export const createRoom = async (data: createNewRoom) => {
  // ✅ hostId 유효성 검증
  const hostUser = await prisma.user.findUnique({
    where: { userId: data.hostId },
  });

  if (!hostUser) {
    throw new Error('해당 hostId에 해당하는 유저가 존재하지 않습니다.');
  }

  //video db 검증
  const video = await prisma.youtubeVideo.findUnique({
    where: { videoId: data.videoId },
  });
  if (video === null) {
    throw new Error('해당 유튜브 동영상이 존재하지 않습니다.');
  }

  //room db 저장
  const room = await prisma.room.create({
    data: {
      roomName: data.roomName,
      isPublic: data.isPublic ?? true,
      maxParticipants: data.maxParticipants ?? 6,
      video: {
        connect: { videoId: video.videoId },
      },
      host: {
        connect: { userId: data.hostId }, // ← 이 부분 추가
      },
    },
  });

  await prisma.roomParticipant.create({
    data: {
      roomId: room.roomId,
      userId: data.hostId,
      role: 'host',
    },
  });

  return room;
};

//방 조회
export const findRoomById = async (roomId: number) => {
  return await prisma.room.findUnique({
    where: { roomId },
  });
};

//방 삭제
export const outRoom = async (roomId: number, userId: number) => {
  await prisma.roomParticipant.update({
    where: {
      unique_participant: {
        userId,
        roomId,
      },
    },
    data: {
      leftAt: new Date(),
    },
  });
  return { message: '방에서 퇴장했습니다.' };
};

/**
 * 참가자 관리
 */

//참가자 목록 조회
export const getParticipants = async (roomId: number) => {
  const participants = await prisma.roomParticipant.findMany({
    where: { roomId, leftAt: null },
  });

  const result = await Promise.all(
    participants.map(async (p: RoomParticipant) => {
      const member = await findUserById(p.userId); // 사용자 정보 가져오기

      return {
        userId: p.userId,
        nickname: member?.nickname || '',
        profileImage: member?.profileImage || '',
        popularity: member?.popularity ?? 0,
        isHost: p.role === 'host',
        joinedAt: p.joinedAt.toISOString(),
      };
    }),
  );

  return result;
};

// 참가자 존재 확인
export const checkParticipant = async (roomId: number, userId: number) => {
  const participant = await prisma.roomParticipant.findUnique({
    where: { unique_participant: { roomId, userId } },
  });

  //return participant !== null && participant.left === null;
  return participant !== null;
};

//새 참가자 추가
export const addParticipant = async (roomId: number, participant: Participant) => {
  const room = await prisma.room.findUnique({
    where: { roomId },
  });
  if (!room) {
    console.log('존재하지 않은 room입니다.');
    throw new Error('존재하지 않은 room입니다.');
  }

  //roomParicipant DB 등록
  await prisma.roomParticipant.create({
    data: {
      roomId,
      userId: participant.userId,
      role: 'participant',
    },
  });

  //방에 현재 참여자 수 증가
  await prisma.room.update({
    where: { roomId },
    data: {
      currentParticipants: { increment: 1 },
    },
  });

  return room;
};

//참가자 방 탈퇴
export const removeParticipant = async (roomId: number, userId: number) => {
  const room = await prisma.room.findUnique({
    where: { roomId },
  });
  if (!room) return null;

  //roomParticipate db update
  await prisma.$transaction([
    prisma.roomParticipant.delete({
      where: {
        unique_participant: { roomId, userId },
      },
    }),
    prisma.room.update({
      where: { roomId },
      data: {
        currentParticipants: { decrement: 1 },
      },
    }),
  ]);

  return room;
};
