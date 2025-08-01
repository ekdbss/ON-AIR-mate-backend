import { Request, Response, NextFunction } from 'express';
import { ActiveRoomService } from '../services/activeRoomsService.js';
import {
  GetRoomsQueryDto,
  SortByOption,
  isSearchTypeOption, // isSearchTypeOption 타입 가드 임포트
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

      // sortBy 값 유효성 검사
      if (!VALID_SORT_BY_OPTIONS.includes(sortBy)) {
        throw new AppError(
          'GENERAL_001',
          `'sortBy' 파라미터는 [${VALID_SORT_BY_OPTIONS.join(', ')}] 중 하나여야 합니다.`,
        );
      }

      // searchType 및 keyword 조합 유효성 검사
      let searchType: GetRoomsQueryDto['searchType'];
      if (rawSearchType) {
        if (!isSearchTypeOption(rawSearchType)) {
          throw new AppError('GENERAL_001', `'searchType' 파라미터가 유효하지 않습니다.`);
        }
        if (!keyword) {
          throw new AppError(
            'GENERAL_001',
            '검색 타입(searchType)을 지정하려면 검색어(keyword)가 필요합니다.',
          );
        }
        searchType = rawSearchType;
      } else if (keyword) {
        throw new AppError(
          'GENERAL_001',
          '검색어(keyword)를 사용하려면 검색 타입(searchType)을 지정해야 합니다.',
        );
      }

      const query: GetRoomsQueryDto = {
        sortBy,
        searchType,
        keyword: keyword as string | undefined,
      };

      // 인증된 사용자인 경우 userId를 전달하여 개인화된 결과를 얻습니다.
      const userId = req.user?.userId;
      const roomsData = await this.activeRoomService.findAll(query, userId);

      sendSuccess(res, roomsData);
    } catch (error) {
      console.error('활성화된 방 목록 조회 중 오류 발생:', error);
      if (!(error instanceof AppError)) {
        // ROOM_007: 방 목록 조회 실패
        return next(
          new AppError('ROOM_007', '방 목록을 조회하는 중 예상치 못한 오류가 발생했습니다.'),
        );
      }
      next(error);
    }
  };
}
