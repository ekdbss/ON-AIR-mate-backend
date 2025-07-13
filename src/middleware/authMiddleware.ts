import { Request, Response, NextFunction } from 'express';
import passport from 'passport';

export const authenticateJWT = passport.authenticate('jwt', { session: false });

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  authenticateJWT(req, res, (err: Error | null) => {
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