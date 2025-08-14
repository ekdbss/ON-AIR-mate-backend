import { RoomParticipant } from '@prisma/client';
import { Participant, createNewRoom } from '../dtos/roomDto.js';
import { findUserById } from './authServices.js';
import { prisma } from '../lib/prisma.js';

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
      isPublic: data.isPrivate,
      maxParticipants: data.maxParticipants ?? 6,
      videoId: video.videoId,
      hostId: data.hostId,
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
      left_at: new Date(),
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
    where: { roomId, left_at: null },
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
  const participant = await prisma.roomParticipant.findFirst({
    where: {
      roomId,
      userId,
      left_at: null,
    },
  });
  //return participant !== null && participant.left === null;
  return participant !== null;
};

// host 확인
export const isHost = async (roomId: number, userId: number) => {
  const participant = await prisma.roomParticipant.findFirst({
    where: {
      roomId,
      userId,
      left_at: null,
    },
  });
  //return participant !== null && participant.left === null;
  return participant?.role;
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
  //한번 탈퇴했던 방인지 확인 - roomParticant에 left_at이 null 이 아님
  //아예 처음이면 create
  const existingParticipant = await prisma.roomParticipant.findUnique({
    where: {
      unique_participant: {
        roomId: roomId,
        userId: participant.userId,
      },
    },
  });

  if (existingParticipant) {
    if (existingParticipant.left_at === null) {
      // 이미 참가 중
      console.log('참가자 확인 에러: 이미 참여중임.');
      throw new Error('이미 이 방에 참가 중입니다.');
    } else {
      // 재참여 → left_at 초기화
      return await prisma.roomParticipant.update({
        where: { participantId: existingParticipant.participantId },
        data: {
          left_at: null,
          lastJoinedAt: new Date(),
        },
      });
    }
  }
  return await prisma.roomParticipant.create({
    data: {
      roomId,
      userId: participant.userId,
      role: 'participant',
      left_at: null,
      lastJoinedAt: new Date(),
    },
  });
};

//참가자 방 탈퇴
export const removeParticipant = async (roomId: number, userId: number) => {
  console.log('[방 탈퇴 로그]removeParticipant params:', roomId, userId, typeof roomId);
  const room = await prisma.room.findUnique({
    where: { roomId },
  });
  if (!room) return null;

  //host인지 확인 -> host이면 모든 참가자 다 탈퇴시키기.
  //그냥 participant면 -> 유저만 탈퇴시키기
  // 참가자 정보 조회 (roomId + userId)
  const participant = await prisma.roomParticipant.findUnique({
    where: {
      unique_participant: {
        roomId: roomId,
        userId,
      },
    },
  });

  console.log('parti:ddddd', participant);

  if (!participant) {
    console.warn(`[방 탈퇴] 해당 유저(${userId})는 방(${roomId}) 참가자가 아님`);
    return null;
  }
  //호스트인 경우
  if (participant.role === 'host') {
    console.log(`[방 탈퇴] 호스트(${userId}) → 모든 참가자 탈퇴 + 방 삭제`);

    // 모든 참가자 left_at 업데이트
    await prisma.roomParticipant.updateMany({
      where: { roomId: roomId, left_at: null },
      data: { left_at: new Date() },
    });

    // 방 삭제 ()
    await prisma.room.delete({
      where: { roomId: roomId },
    });

    const checkRoom = await prisma.room.findUnique({
      where: { roomId: roomId },
    });
    console.log('room DB 삭제 확인: 0', checkRoom);
    if (checkRoom) {
      return { message: '방이 삭제 실패하였습니다.', participant: 'everyone', ishost: true };
    }
    return { message: '방이 삭제되었습니다(호스트 탈퇴).', participant: 'everyone', ishost: true };
  }

  // 2. 일반 참가자인 경우 → 본인만 탈퇴

  const updatedParticipant = await prisma.roomParticipant.update({
    where: { participantId: participant.participantId },
    data: { left_at: new Date() },
  });
  console.log('parti:참가자임 ', updatedParticipant);

  return {
    message: '방이 삭제되었습니다(참가자 탈퇴).',
    participant: updatedParticipant,
    ishost: false,
  };
};
