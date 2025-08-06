import { Request, Response } from 'express';
import { SharedCollectionService } from '../services/sharedCollectionService.js';
import { SharedCollectionActionDto } from '../dtos/sharedCollectionDto.js';

const service = new SharedCollectionService();

// 1. 공유받은 컬렉션 목록 조회
export const getReceivedCollections = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId; // 인증 미들웨어에서 주입된 userId

    if (!userId) {
      res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
      return;
    }

    const result = await service.getReceivedCollections(userId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Internal Server Error';
    res.status(500).json({ success: false, message: errorMessage });
  }
};

// 2. 공유 컬렉션 수락/거절 처리
export const respondToSharedCollection = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const sharedCollectionId = Number(req.params.sharedCollectionId);
    const { action }: SharedCollectionActionDto = req.body;

    if (!userId) {
      res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
      return;
    }

    if (!['ACCEPT', 'REJECT'].includes(action)) {
      res.status(400).json({ success: false, message: '유효하지 않은 action입니다.' });
      return;
    }

    const message = await service.respondToSharedCollection(
      userId,
      Number(sharedCollectionId),
      action,
    );
    res.status(200).json({ success: true, message });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Internal Server Error';
    res.status(500).json({ success: false, message: errorMessage });
  }
};
