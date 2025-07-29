export const ERROR_CODES = {
  // 인증 관련 (AUTH_XXX)
  AUTH_001: { message: '입력하신 정보가 잘못되었습니다.', statusCode: 401 },
  AUTH_002: { message: '사용할 수 없는 닉네임입니다.', statusCode: 409 },
  AUTH_003: { message: '사용할 수 없는 아이디입니다.', statusCode: 409 },
  AUTH_004: { message: '8~16자의 영문 대/소문자, 숫자, 특수문자를 사용해주세요.', statusCode: 400 },
  AUTH_005: { message: '토큰이 만료되었습니다.', statusCode: 401 },
  AUTH_006: { message: '유효하지 않은 토큰입니다.', statusCode: 401 },
  AUTH_007: { message: '인증이 필요합니다.', statusCode: 401 },

  // 방 관련 (ROOM_XXX)
  ROOM_001: { message: '방이 존재하지 않습니다.', statusCode: 404 },
  ROOM_002: { message: '방이 가득 찼습니다.', statusCode: 403 },
  ROOM_003: { message: '비공개 방입니다.', statusCode: 403 },
  ROOM_004: { message: '방장 권한이 필요합니다.', statusCode: 403 },
  ROOM_005: { message: '이미 참여 중인 방입니다.', statusCode: 409 },
  ROOM_006: { message: '방에 참여하지 않았습니다.', statusCode: 403 },
  ROOM_007: { message: '유튜브 영상을 찾을 수 없습니다.', statusCode: 404 },

  // 친구 관련 (FRIEND_XXX)
  FRIEND_001: { message: '이미 친구입니다.', statusCode: 409 },
  FRIEND_002: { message: '이미 친구 요청을 보냈습니다.', statusCode: 409 },
  FRIEND_003: { message: '자신에게는 친구 요청을 보낼 수 없습니다.', statusCode: 400 },
  FRIEND_004: { message: '차단된 사용자입니다.', statusCode: 403 },
  FRIEND_005: { message: '존재하지 않는 사용자입니다.', statusCode: 404 },

  // 컬렉션 관련 (COLLECTION_XXX)
  COLLECTION_001: { message: '컬렉션이 존재하지 않습니다.', statusCode: 404 },
  COLLECTION_002: { message: '컬렉션 소유자가 아닙니다.', statusCode: 403 },
  COLLECTION_003: { message: '공유하려면 공개 범위를 변경해주세요.', statusCode: 403 },
  COLLECTION_004: { message: '북마크가 존재하지 않습니다.', statusCode: 404 },

  // 추천 관련 (RECOMMEND_XXX)
  RECOMMEND_001: { message: '오늘 이미 추천했습니다.', statusCode: 409 },
  RECOMMEND_002: { message: '자신에게는 추천할 수 없습니다.', statusCode: 400 },

  // 유저 관련 (USER_XXX)
  USER_001: { message: '사용자를 찾을 수 없습니다.', statusCode: 404 },
  USER_002: { message: '이미 사용 중인 닉네임입니다.', statusCode: 409 },
  USER_003: { message: '알림 설정을 찾을 수 없습니다.', statusCode: 404 },
  USER_004: { message: '수정할 정보를 입력해주세요.', statusCode: 400 },
  USER_005: { message: '의견 내용을 입력해주세요.', statusCode: 400 },
  USER_006: { message: '참여한 방 기록이 없습니다.', statusCode: 404 },
  USER_007: { message: '검색 기록이 없습니다.', statusCode: 404 },

  // 검색 관련
  SEARCH_001: { message: '검색어를 입력해주세요.', statusCode: 400 },

  // 일반 에러
  GENERAL_001: { message: '잘못된 요청입니다.', statusCode: 400 },
  GENERAL_002: { message: '권한이 없습니다.', statusCode: 403 },
  GENERAL_003: { message: '리소스를 찾을 수 없습니다.', statusCode: 404 },
  GENERAL_004: { message: '서버 내부 오류가 발생했습니다.', statusCode: 500 },
  GENERAL_005: { message: '데이터베이스 오류가 발생했습니다.', statusCode: 500 },
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;
