import { prisma } from '../lib/prisma.js';
/**
 * 닉네임으로 유저 찾기
 */
export const findUserByNickname = async (nickname: string) => {
  return await prisma.user.findUnique({
    where: { nickname },
  });
};

/**
 * 아이디(username)로 유저 찾기
 * API 명세서에서는 username이지만 DB 필드는 loginId
 */
export const findUserByUsername = async (username: string) => {
  return await prisma.user.findUnique({
    where: { loginId: username },
  });
};

/**
 * loginId로 유저 찾기 (기존 함수 유지 - 하위 호환성)
 */
export const findUserByLoginId = async (loginId: string) => {
  return await prisma.user.findUnique({
    where: { loginId },
  });
};

/**
 * userId로 유저 찾기
 */
export const findUserById = async (userId: number) => {
  return await prisma.user.findUnique({
    where: { userId },
  });
};

/**
 * 토큰으로 유저 찾기
 */
export const findUserByToken = async (token: string) => {
  return await prisma.user.findFirst({
    where: {
      refreshToken: token, // refreshToken 필드를 토큰 저장에 사용
    },
  });
};

/**
 * 유저 생성 (회원가입)
 */
export const createUser = async (userData: {
  loginId: string;
  password: string;
  nickname: string;
  profileImage?: string | null;
}) => {
  return await prisma.user.create({
    data: {
      loginId: userData.loginId,
      password: userData.password,
      nickname: userData.nickname,
      profileImage: userData.profileImage || null,
    },
  });
};

/**
 * 유저 약관 동의 정보 저장
 */
export const createUserAgreements = async (
  userId: number,
  agreements: {
    serviceTerms: boolean;
    privacyCollection: boolean;
    privacyPolicy: boolean;
    marketingConsent?: boolean;
    eventPromotion?: boolean;
    serviceNotification?: boolean;
    advertisementNotification?: boolean;
    nightNotification?: boolean;
  },
) => {
  return await prisma.userAgreement.create({
    data: {
      userId,
      serviceTerms: agreements.serviceTerms,
      privacyCollection: agreements.privacyCollection,
      privacyPolicy: agreements.privacyPolicy,
      marketingConsent: agreements.marketingConsent || false,
      eventPromotion: agreements.eventPromotion || false,
      serviceNotification: agreements.serviceNotification ?? true, // 기본값 true
      advertisingNotification: agreements.advertisementNotification || false,
      nightNotification: agreements.nightNotification || false,
    },
  });
};

/**
 * 유저 토큰 업데이트
 */
export const updateUserToken = async (userId: number, token: string | null) => {
  return await prisma.user.update({
    where: { userId },
    data: {
      refreshToken: token, // refreshToken 필드를 토큰 저장에 사용
    },
  });
};

/**
 * 유저 토큰 삭제 (로그아웃)
 */
export const clearUserToken = async (userId: number) => {
  return await prisma.user.update({
    where: { userId },
    data: { refreshToken: null },
  });
};
