import { Request, Response, NextFunction } from 'express';
import { sendError, sendSuccess } from '../utils/response.js';
import AppError from '../middleware/errors/AppError.js';
import * as bookmarkService from '../services/bookmarkService.js';
import { tryParseBookmarkMessage } from '../utils/parseBookmark.js';

// 1. 북마크 생성 API (POST /api/bookmarks)
export const createBookmark = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roomId, message } = req.body;
    const userId = req.user?.userId;

    if (userId === undefined) {
      return sendError(res, '유저 정보가 없습니다.', 401);
    }

    if (!roomId || typeof roomId !== 'number') {
      return sendError(res, '유효한 방 ID가 필요합니다.', 400);
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return sendError(res, '메시지가 필요합니다.', 400);
    }

    const result = tryParseBookmarkMessage(message);
    if (!result) {
      return sendError(res, '메시지에서 유효한 타임라인을 찾을 수 없습니다.', 400);
    }
    const { timeline, content } = result;

    const bookmark = await bookmarkService.createBookmark(userId, roomId, content, timeline);

    sendSuccess(res, {
      bookmarkId: bookmark.bookmarkId,
      message: '북마크가 생성되었습니다.',
    });
  } catch (err) {
    if (err instanceof Error) {
      return next(new AppError(err.message));
    }
    next(new AppError('북마크 생성 중 알 수 없는 오류가 발생했습니다.'));
  }
};

// 2. 북마크 목록 조회 API (GET /api/bookmarks)
export const getBookmarks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { collectionId, uncategorized } = req.query;

    if (userId === undefined) {
      return sendError(res, '유저 정보가 없습니다.', 401);
    }

    let parsedCollectionId: number | undefined;
    if (collectionId) {
      const num = Number(collectionId);
      if (isNaN(num)) {
        return sendError(res, '유효하지 않은 컬렉션 ID입니다.', 400);
      }
      parsedCollectionId = num;
    }

    const result = await bookmarkService.getBookmarks(userId, {
      collectionId: parsedCollectionId,
      uncategorized: uncategorized === 'true',
    });

    sendSuccess(res, result);
  } catch (err) {
    if (err instanceof Error) {
      return next(new AppError(err.message));
    }
    next(new AppError('북마크 목록 조회 중 알 수 없는 오류가 발생했습니다.'));
  }
};

// 3. 북마크 삭제 API (DELETE /api/bookmarks/:bookmarkId)
export const deleteBookmark = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const bookmarkId = Number(req.params.bookmarkId);

    if (isNaN(bookmarkId)) {
      return sendError(res, '유효하지 않은 북마크 ID입니다.', 400);
    }

    if (userId === undefined) {
      return sendError(res, '유저 정보가 없습니다.', 401);
    }

    await bookmarkService.deleteBookmark(userId, bookmarkId);

    sendSuccess(res, {
      message: '북마크가 삭제되었습니다.',
    });
  } catch (err) {
    if (err instanceof Error) {
      return next(new AppError(err.message));
    }
    next(new AppError('북마크 삭제 중 알 수 없는 오류가 발생했습니다.'));
  }
};

// 4. 북마크 컬렉션 이동 API (PUT /api/bookmarks/:bookmarkId/collection)
export const moveBookmarkToCollection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const bookmarkId = Number(req.params.bookmarkId);
    const { collectionId } = req.body;

    if (userId === undefined) {
      return sendError(res, '유저 정보가 없습니다.', 401);
    }

    if (isNaN(bookmarkId)) {
      return sendError(res, '유효하지 않은 북마크 ID입니다.', 400);
    }

    if (
      collectionId !== null &&
      collectionId !== undefined &&
      (typeof collectionId !== 'number' || isNaN(collectionId))
    ) {
      return sendError(res, '유효하지 않은 컬렉션 ID입니다.', 400);
    }

    await bookmarkService.moveBookmarkToCollection(userId, bookmarkId, collectionId);

    sendSuccess(res, { message: '북마크가 이동되었습니다.' });
  } catch (err) {
    if (err instanceof Error) {
      return next(new AppError(err.message));
    }
    next(new AppError('북마크 컬렉션 이동 중 알 수 없는 오류가 발생했습니다.'));
  }
};

// 5. 북마크로 방 생성 API (POST /api/bookmarks/:bookmarkId/create-room)
export const createRoomFromBookmark = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const bookmarkId = Number(req.params.bookmarkId);
    const { roomTitle, maxParticipants, isPublic, startFrom } = req.body;

    if (userId === undefined) {
      return sendError(res, '유저 정보가 없습니다.', 401);
    }

    if (isNaN(bookmarkId)) {
      return sendError(res, '유효하지 않은 북마크 ID입니다.', 400);
    }

    if (!roomTitle || typeof roomTitle !== 'string' || roomTitle.trim().length === 0) {
      return sendError(res, '방 제목이 필요합니다.', 400);
    }

    if (typeof maxParticipants !== 'number' || ![8, 15, 30].includes(maxParticipants)) {
      return sendError(res, '최대 참가자 수는 8, 15, 30 중 하나여야 합니다.', 400);
    }

    if (typeof isPublic !== 'boolean') {
      return sendError(res, '방 공개 여부는 불린 타입이어야 합니다.', 400);
    }

    const newRoom = await bookmarkService.createRoomFromBookmark(
      userId,
      bookmarkId,
      roomTitle,
      maxParticipants,
      isPublic,
      startFrom ?? 'BOOKMARK',
    );

    sendSuccess(res, {
      roomId: newRoom.roomId,
      thumbnail: newRoom.thumbnail,
      message: '방이 생성되었습니다.',
    });
  } catch (err) {
    if (err instanceof Error) {
      return next(new AppError(err.message));
    }
    next(new AppError('북마크로 방 생성 중 알 수 없는 오류가 발생했습니다.'));
  }
};
