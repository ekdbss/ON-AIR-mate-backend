/**
 * Passport JWT 인증 전략 설정
 */
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import dotenv from 'dotenv';

dotenv.config();

const opts: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'your_jwt_secret', // .env에 설정 권장
};

passport.use(
  new JwtStrategy(opts, (jwt_payload: any, done: any) => {
    try {
      // 여기에 DB 조회 등 추가 가능
      const user = { id: jwt_payload.id, nickname: jwt_payload.nickname }; // 임시 사용자 객체
      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  }),
);

export default passport;
