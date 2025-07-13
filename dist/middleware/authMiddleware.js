import passport from 'passport';
export const authenticateJWT = passport.authenticate('jwt', { session: false });
export const requireAuth = (req, res, next) => {
    authenticateJWT(req, res, (err) => {
        if (err || !req.user) {
            res.status(401).json({
                success: false,
                data: null,
                error: {
                    code: 'UNAUTHORIZED',
                    message: '인증이 필요합니다.',
                },
            });
            return;
        }
        next();
    });
};
