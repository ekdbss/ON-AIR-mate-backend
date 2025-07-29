import { Request, Response, NextFunction } from 'express';
import * as roomService from '../services/roomServices.js';
import * as messageService from '../services/messageServices.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const createRoom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roomName, isPublic, maxParticipants, videoId } = req.body;
    const hostId = req.user?.userId;
    console.log('user:', req.user?.userId, ', ', req.user?.nickname);

    //유튜브 비디오에 대한 정보 받아와야함.
    if (!videoId) {
      return sendError(res, 'no video data', 409);
    }

    //req body 검증
    if (!hostId) {
      return sendError(res, 'unauthorized', 409);
    }
    if (!roomName) {
      return sendError(res, 'roomName이 없습니다.', 409);
    }

    //room db 생성
    const newRoom = await roomService.createRoom({
      hostId,
      roomName,
      isPublic,
      maxParticipants,
      videoId,
    });
    sendSuccess(
      res,
      {
        roomId: newRoom.roomId,
        message: '방이 생성되었습니다.',
      },
      201,
    );
  } catch (error) {
    next(error);
  }
};

export const joinRoom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roomId = Number(req.params.roomId);
    const userId = Number(req.user?.userId);
    const nickname = req.user?.nickname ?? '알 수 없음';
    console.log('roomId:', roomId, ', userId: ', userId, ', nickname: ', nickname);

    //방 존재하는지 체크
    const isExisting = await roomService.checkParticipant(roomId, userId);
    if (isExisting) {
      return sendError(res, '이미 가입되어 있는 room입니다.', 409);
    }

    //방 참가자 목록에 추가
    await roomService.addParticipant(roomId, { userId, nickname });
    //성공 응답
    sendSuccess(res, '방에 입장 가능합니다.', 201);
  } catch (error) {
    next(error);
  }
};

export const leaveRoom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roomId = Number(req.params.roomId);
    const userId = Number(req.user?.userId);
    const isExisting = await roomService.checkParticipant(roomId, userId);

    if (!isExisting) {
      return sendError(res, 'room에 소속되어 있지 않습니다.', 409);
    }

    const message = await roomService.outRoom(roomId, userId);

    sendSuccess(res, message, 201);
  } catch (error) {
    next(error);
  }
};

export const getRoomParticipants = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roomId = Number(req.params.roomId);
    const participants = await roomService.getParticipants(roomId);

    sendSuccess(res, participants, 201);
  } catch (error) {
    next(error);
  }
};

export const postRoomMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content, messageType } = req.body;
    const roomId = Number(req.params.roomId);
    const userId = Number(req.user?.userId);
    console.log(`userId: ${userId}`);

    const message = await messageService.saveRoomMessage({ roomId, userId, content, messageType });

    sendSuccess(
      res,
      {
        messageId: message.messageId,
        message: '채팅이 전송되었습니다.',
      },
      201,
    );
  } catch (error) {
    next(error);
  }
};

export const getRoomMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roomId = Number(req.params.roomId);
    if (isNaN(roomId)) {
      return sendError(res, '유효한 roomId가 필요합니다.', 409);
    }

    //const limit = parseInt(req.query.limit as string, 10) || 50;
    //const before = req.query.before ? new Date(req.query.before as string) : undefined;

    const messages = await messageService.getRoomMessages(roomId);

    sendSuccess(res, messages, 201);
  } catch (error) {
    next(error);
  }
};
