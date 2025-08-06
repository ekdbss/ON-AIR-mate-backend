/**
 * @file 활성화된 방 조회 관련 DTO
 */

/**
 * 정렬 기준
 * - 'latest': 최신순
 * - 'popularity': 방장 인기순
 */
export type SortByOption = 'latest' | 'popularity';
export const VALID_SORT_BY_OPTIONS: SortByOption[] = ['latest', 'popularity'];

/**
 * 검색 기준
 * - 'videoTitle': 영상 제목
 * - 'roomTitle': 방 제목
 * - 'hostNickname': 방장 닉네임
 */
export type SearchTypeOption = 'videoTitle' | 'roomTitle' | 'hostNickname';
export const VALID_SEARCH_TYPE_OPTIONS: SearchTypeOption[] = [
  'videoTitle',
  'roomTitle',
  'hostNickname',
];

/**
 * searchType 문자열이 유효한 SearchTypeOption인지 확인하는 타입 가드 함수
 * @param value - 검사할 문자열
 */
export function isSearchTypeOption(value: unknown): value is SearchTypeOption {
  return VALID_SEARCH_TYPE_OPTIONS.includes(value as SearchTypeOption);
}

/**
 * GET /rooms API 요청 시 사용하는 쿼리 파라미터 DTO
 */
export interface GetRoomsQueryDto {
  sortBy?: SortByOption;
  searchType?: SearchTypeOption;
  keyword?: string;
}

/**
 * API 응답에 포함된 개별 방의 정보 DTO
 */
export interface RoomDto {
  roomId: number;
  roomTitle: string;
  videoTitle: string;
  videoThumbnail: string;
  hostNickname: string;
  hostProfileImage: string;
  hostPopularity: number;
  currentParticipants: number;
  maxParticipants: number;
  duration: string; // "HH:mm:ss" format
  isPrivate: boolean;
}

/**
 * GET /rooms API의 `data` 필드 DTO
 */
export interface RoomsDataDto {
  continueWatching: RoomDto[];
  onAirRooms: RoomDto[];
}
