import { Request, Response, NextFunction } from 'express';
import { verifyJWT, JWTPayload } from '../services/jwtService';

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
  realIp?: string;
}

/**
 * Authentication middleware: Authorization header'daki JWT'yi doğrular.
 * Başarısız olduğunda uygun HTTP kodu ve Almanca mesaj döner.
 */
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.substring('Bearer '.length)
    : undefined;

  if (!token) {
    res.status(401).json({ success: false, error: 'Nicht autorisiert' });
    return;
  }

  try {
    const payload: JWTPayload = await verifyJWT(token);
    req.user = payload;
    next();
  } catch (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _error
  ) {
    res.status(403).json({ success: false, error: 'Zugriff verweigert' });
  }
};