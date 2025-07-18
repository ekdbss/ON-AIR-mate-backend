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
  secretOrKey: process.env.JWT_ACCESS_SECRET || 'your_jwt_secret',
};

passport.use(
  new JwtStrategy(opts, (jwt_payload: JwtPayload, done) => {
    try {
      const user = { id: jwt_payload.id, nickname: jwt_payload.nickname };
      console.log('user:', user.id, ' ,', user.nickname);
      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  }),
);

export default passport;
