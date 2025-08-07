import { Request, Response, NextFunction } from 'express';
import { ActiveRoomService } from '../services/activeRoomsService.js';
import {
  GetRoomsQueryDto,
  SortByOption,
  isSearchTypeOption,
  VALID_SORT_BY_OPTIONS,
} from '../dtos/activeRoomsDto.js';
import { sendSuccess } from '../utils/response.js';
import AppError from '../middleware/errors/AppError.js';

export class ActiveRoomController {
  constructor(private activeRoomService: ActiveRoomService) {}

  /**
   * GET /rooms: 활성화된 방 목록 조회
   */
  public getRooms = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { searchType: rawSearchType, keyword, sortBy: rawSortBy } = req.query;
      const sortBy = (rawSortBy as SortByOption) || 'latest';
      const searchType = (rawSearchType as GetRoomsQueryDto['searchType']) || 'videoTitle';

      // sortBy 값 유효성 검사
      if (!VALID_SORT_BY_OPTIONS.includes(sortBy)) {
        throw new AppError(
          'GENERAL_001',
          `'sortBy' 파라미터는 [${VALID_SORT_BY_OPTIONS.join(', ')}] 중 하나여야 합니다.`,
        );
      }

      // searchType 유효성 검사
      if (!isSearchTypeOption(searchType)) {
        throw new AppError('GENERAL_001', `'searchType' 파라미터가 유효하지 않습니다.`);
      }

      const query: GetRoomsQueryDto = {
        sortBy,
        searchType,
        keyword: keyword as string | undefined,
      };

      const userId = req.user?.userId;
      const roomsData = await this.activeRoomService.findAll(query, userId);

      sendSuccess(res, roomsData);
    } catch (error) {
      console.error('활성화된 방 목록 조회 중 오류 발생:', error);
      if (!(error instanceof AppError)) {
        return next(
          new AppError('GENERAL_004', '방 목록을 조회하는 중 예상치 못한 오류가 발생했습니다.'),
        );
      }
      next(error);
    }
  };
}
