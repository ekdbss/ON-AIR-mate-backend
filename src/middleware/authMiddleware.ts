import { Request, Response, NextFunction } from 'express';
import passport from 'passport';

export const authenticateJWT = passport.authenticate('jwt', { session: false });

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  authenticateJWT(req, res, (err: any) => {
    if (err || !req.user) {
      return res.status(401).json({
        success: false,
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: '인증이 필요합니다.',
        },
      });
    }
    next();
  });
};
