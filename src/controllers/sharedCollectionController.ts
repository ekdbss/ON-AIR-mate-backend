import { Request, Response } from 'express';
import { SharedCollectionService } from '../services/sharedCollectionService.js';

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
