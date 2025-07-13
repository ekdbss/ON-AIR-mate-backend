import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import dotenv from 'dotenv';

dotenv.config();

interface JwtPayload {
  id: string;
  nickname: string;
}

const opts: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'your_jwt_secret',
};

passport.use(
  new JwtStrategy(
    opts,
    (jwt_payload: JwtPayload, done: (error: Error | null, user?: any) => void) => {
      try {
        const user = { id: jwt_payload.id, nickname: jwt_payload.nickname };
        return done(null, user);
      } catch (error) {
        return done(error instanceof Error ? error : new Error('Authentication failed'), false);
      }
    },
  ),
);

export default passport;
