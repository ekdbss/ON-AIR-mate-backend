import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import dotenv from 'dotenv';
dotenv.config();
const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || 'your_jwt_secret',
};
passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
    try {
        const user = { id: jwt_payload.id, nickname: jwt_payload.nickname };
        return done(null, user);
    }
    catch (error) {
        return done(error, false);
    }
}));
export default passport;
