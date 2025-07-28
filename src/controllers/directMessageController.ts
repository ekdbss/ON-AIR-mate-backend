import { Request, Response, NextFunction } from 'express';
import * as messageService from '../services/messageServices';
import { sendSuccess, sendError } from '../utils/response.js';

export const postDirectMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content, messageType } = req.body;
    const receiverId = Number(req.params.friendId);
    const userId = Number(req.user?.userId);

    const message = await messageService.saveDirectMessage(userId, {
      receiverId,
      content,
      type: messageType,
    });

    sendSuccess(
      res,
      {
        messageId: message.messageId,
        content: message.content,
        message: '채팅이 전송되었습니다.',
      },
      201,
    );
  } catch (error) {
    next(error);
  }
};

export const getDirectMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const receiverId = Number(req.params.friendId);
    const userId = Number(req.user?.userId);

    if (isNaN(userId)) {
      return sendError(res, '유저 인증에 실패했습니다.', 409);
    }

    if (isNaN(receiverId)) {
      return sendError(res, '친구가 아닙니다.', 409);
    }

    const messages = await messageService.getDirectMessages(userId, receiverId);

    sendSuccess(res, messages, 201);
  } catch (error) {
    next(error);
  }
};
