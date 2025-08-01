import { PrismaClient, InviteAuth } from '@prisma/client';
import AppError from '../middleware/errors/AppError.js';
import { UpdateRoomSettingDto } from '../dtos/roomSettingDto.js';

const prisma = new PrismaClient();

// 방장이 맞는지 확인하는 헬퍼 함수
const findRoomAndCheckHost = async (roomId: string, userId: number) => {
  const numericRoomId = parseInt(roomId, 10);
  if (isNaN(numericRoomId)) throw new AppError('ROOM_003', '유효하지 않은 방 ID입니다.');

  const room = await prisma.room.findUnique({ where: { roomId: numericRoomId } });
  if (!room) throw new AppError('ROOM_001', `ID가 '${roomId}'인 방을 찾을 수 없습니다.`);
  if (room.hostId !== userId) throw new AppError('ROOM_004', '방장만 접근할 수 있습니다.');
  return room;
};

// 방 참여자가 맞는지 확인하는 헬퍼 함수
const findRoomAndCheckParticipant = async (roomId: string, userId: number) => {
  const numericRoomId = parseInt(roomId, 10);
  if (isNaN(numericRoomId)) throw new AppError('ROOM_003', '유효하지 않은 방 ID입니다.');

  const room = await prisma.room.findUnique({ where: { roomId: numericRoomId } });
  if (!room) throw new AppError('ROOM_001', `ID가 '${roomId}'인 방을 찾을 수 없습니다.`);

  // 사용자가 해당 방에 참여하고 있는지 확인 (left_at이 null인 경우)
  const participant = await prisma.roomParticipant.findFirst({
    where: { roomId: numericRoomId, userId: userId, left_at: null },
  });

  if (!participant) {
    throw new AppError('ROOM_006', '방에 참여한 사용자만 설정을 조회할 수 있습니다.');
  }
  return room;
};

/**
 * 방 설정을 수정합니다. (방장만 가능)
 * @param roomId 방 ID (URL 파라미터로 받은 문자열)
 * @param userId 요청을 보낸 사용자 ID
 * @param updateDto 수정할 설정 데이터
 */
export const updateRoomSettings = async (
  roomId: string,
  userId: number,
  updateDto: UpdateRoomSettingDto,
): Promise<void> => {
  const room = await findRoomAndCheckHost(roomId, userId);

  // DTO와 Prisma 모델 필드명 매핑
  const { maxParticipants, isPrivate, autoArchiving, invitePermission } = updateDto;
  const dataToUpdate: Partial<{
    maxParticipants: number;
    isPublic: boolean;
    autoArchive: boolean;
    inviteAuth: InviteAuth;
  }> = {};

  // maxParticipants 값 검증 (8, 15, 30명만 가능)
  if (maxParticipants !== undefined) {
    if (![8, 15, 30].includes(maxParticipants)) {
      throw new AppError(
        'ROOM_008',
        '최대 참여 인원은 8명, 15명, 또는 30명으로만 설정할 수 있습니다.',
      );
    }
    dataToUpdate.maxParticipants = maxParticipants;
  }

  if (isPrivate !== undefined) dataToUpdate.isPublic = !isPrivate;
  if (autoArchiving !== undefined) dataToUpdate.autoArchive = autoArchiving;

  // invitePermission 값 검증
  if (invitePermission) {
    const lowercasedPermission = invitePermission.toLowerCase();
    if (lowercasedPermission !== 'all' && lowercasedPermission !== 'host') {
      throw new AppError(
        'ROOM_009',
        `유효하지 않은 초대 권한 값입니다. "ALL" 또는 "HOST"만 가능합니다.`,
      );
    }
    dataToUpdate.inviteAuth = lowercasedPermission as InviteAuth;
  }
  await prisma.room.update({
    where: { roomId: room.roomId },
    data: dataToUpdate,
  });
};

/**
 * 방 설정을 조회합니다.
 * @param roomId 방 ID
 * @param userId 요청을 보낸 사용자 ID
 * @returns 방 설정 데이터
 */
export const getRoomSettings = async (
  roomId: string,
  userId: number,
): Promise<{
  maxParticipants: number;
  isPrivate: boolean;
  autoArchiving: boolean;
  invitePermission: InviteAuth;
}> => {
  const room = await findRoomAndCheckParticipant(roomId, userId);

  return {
    maxParticipants: room.maxParticipants,
    isPrivate: !room.isPublic,
    autoArchiving: room.autoArchive,
    invitePermission: room.inviteAuth,
  };
};
