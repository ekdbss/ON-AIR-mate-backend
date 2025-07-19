import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 닉네임 중복 검사
 */
export const findUserByNickname = async (nickname: string) => {
  return await prisma.user.findUnique({
    where: { nickname },
  });
};

/**
 * 아아디 중복 검사
 */
export const findUserByLoginId = async (loginId: string) => {
  return await prisma.user.findUnique({
    where: { loginId },
  });
};

/**
 * 유저 생성 (회원가입)
 */
export const createUser = async (userData: {
  loginId: string;
  password: string;
  nickname: string;
  profileImage?: string;
}) => {
  return await prisma.user.create({
    data: userData,
  });
};
