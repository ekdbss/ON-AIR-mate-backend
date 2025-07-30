import { Request, Response, NextFunction } from 'express';
import { sendError, sendSuccess } from '../utils/response.js';
import AppError from '../middleware/errors/AppError.js';
import * as bookmarkService from '../services/bookmarkService.js';
import { tryParseBookmarkMessage } from '../utils/parseBookmark.js';

// 1. 북마크 생성 API (POST /bookmarks)
export const createBookmark = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roomId, message } = req.body;
    const userId = req.user?.userId;

    if (userId === undefined) {
      return sendError(res, '유저 정보가 없습니다.', 401);
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

// 2. 북마크 목록 조회 API (GET /bookmarks)
export const getBookmarks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { collectionId, uncategorized } = req.query;

    if (userId === undefined) {
      return sendError(res, '유저 정보가 없습니다.', 401);
    }

    const result = await bookmarkService.getBookmarks(userId, {
      collectionId: collectionId ? Number(collectionId) : undefined,
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

// 3. 북마크 삭제 API (DELETE /bookmarks/:bookmarkId)
export const deleteBookmark = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const bookmarkId = Number(req.params.bookmarkId);

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

// 4. 북마크 컬렉션 이동 API (PUT /bookmarks/:bookmarkId/collection)
export const moveBookmarkToCollection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const bookmarkId = Number(req.params.bookmarkId);
    const { collectionId } = req.body;

    if (userId === undefined) {
      return sendError(res, '유저 정보가 없습니다.', 401);
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

// 5. 북마크로 방 생성 API (POST /bookmarks/:bookmarkId/create-room)
export const createRoomFromBookmark = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const bookmarkId = Number(req.params.bookmarkId);
    const { videoId, roomTitle, maxParticipants, isPrivate } = req.body;

    if (userId === undefined) {
      return sendError(res, '유저 정보가 없습니다.', 401);
    }

    const newRoom = await bookmarkService.createRoomFromBookmark(
      userId,
      bookmarkId,
      videoId,
      roomTitle,
      maxParticipants,
      isPrivate,
    );

    sendSuccess(res, {
      roomId: newRoom.roomId,
      message: '방이 생성되었습니다.',
    });
  } catch (err) {
    if (err instanceof Error) {
      return next(new AppError(err.message));
    }
    next(new AppError('북마크로 방 생성 중 알 수 없는 오류가 발생했습니다.'));
  }
};
