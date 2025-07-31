// src/controllers/friendController.ts
import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response.js';
import AppError from '../middleware/errors/AppError.js';
import * as friendService from '../services/friendServices.js';

/**
 * 친구 목록 조회
 */
export const getFriends = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('AUTH_007');
    }

    const friends = await friendService.getFriendsList(userId);
    sendSuccess(res, friends);
  } catch (error) {
    next(error);
  }
};

/**
 * 친구 요청 전송
 */
export const sendFriendRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { targetUserId } = req.body;

    if (!userId) {
      throw new AppError('AUTH_007');
    }

    if (!targetUserId || typeof targetUserId !== 'number') {
      throw new AppError('GENERAL_001', '대상 사용자 ID를 입력해주세요.');
    }

    await friendService.sendFriendRequest(userId, targetUserId);
    sendSuccess(res, { message: '친구 요청을 보냈습니다.' });
  } catch (error) {
    next(error);
  }
};

/**
 * 친구 요청 목록 조회
 */
export const getFriendRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('AUTH_007');
    }

    const requests = await friendService.getFriendRequests(userId);
    sendSuccess(res, requests);
  } catch (error) {
    next(error);
  }
};

/**
 * 친구 요청 수락/거절
 */
export const handleFriendRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const requestId = parseInt(req.params.requestId);
    const { action } = req.body;

    if (!userId) {
      throw new AppError('AUTH_007');
    }

    if (isNaN(requestId)) {
      throw new AppError('GENERAL_001', '유효하지 않은 요청 ID입니다.');
    }

    if (!action || !['ACCEPT', 'REJECT'].includes(action)) {
      throw new AppError('GENERAL_001', 'action은 ACCEPT 또는 REJECT여야 합니다.');
    }

    const message = await friendService.handleFriendRequest(userId, requestId, action);
    sendSuccess(res, { message });
  } catch (error) {
    next(error);
  }
};

/**
 * 친구 삭제
 */
export const deleteFriend = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const friendId = parseInt(req.params.userId);

    if (!userId) {
      throw new AppError('AUTH_007');
    }

    if (isNaN(friendId)) {
      throw new AppError('GENERAL_001', '유효하지 않은 사용자 ID입니다.');
    }

    await friendService.deleteFriend(userId, friendId);
    sendSuccess(res, { message: '친구가 삭제되었습니다.' });
  } catch (error) {
    next(error);
  }
};

/**
 * 친구 검색
 */
export const searchFriends = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { nickname } = req.query;

    if (!userId) {
      throw new AppError('AUTH_007');
    }

    if (!nickname || typeof nickname !== 'string') {
      throw new AppError('GENERAL_001', '검색할 닉네임을 입력해주세요.');
    }

    const users = await friendService.searchUserByNickname(nickname, userId);
    sendSuccess(res, users);
  } catch (error) {
    next(error);
  }
};

/**
 * 친구 방 초대
 */
export const inviteFriend = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const friendId = parseInt(req.params.friendId);
    const { roomId } = req.body;

    if (!userId) {
      throw new AppError('AUTH_007');
    }

    if (isNaN(friendId)) {
      throw new AppError('GENERAL_001', '유효하지 않은 친구 ID입니다.');
    }

    if (!roomId || typeof roomId !== 'number') {
      throw new AppError('GENERAL_001', '방 ID를 입력해주세요.');
    }

    await friendService.inviteFriendToRoom(userId, friendId, roomId);
    sendSuccess(res, { message: '친구에게 방 초대를 보냈습니다.' });
  } catch (error) {
    next(error);
  }
};

/**
 * 친구 라운지 조회
 */
export const getFriendLounge = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const friendId = parseInt(req.params.userId);

    if (!userId) {
      throw new AppError('AUTH_007');
    }

    if (isNaN(friendId)) {
      throw new AppError('GENERAL_001', '유효하지 않은 사용자 ID입니다.');
    }

    const collections = await friendService.getFriendLounge(userId, friendId);
    sendSuccess(res, collections);
  } catch (error) {
    next(error);
  }
};
