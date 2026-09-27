import dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

export interface JWTPayload {
  userId: number;
  email: string;
  name: string;
  provider?: string | null;
  sessionId?: string;
}

/**
 * JWT token oluştur ve session'ı veritabanına kaydet
 */
export const generateJWT = async (payload: JWTPayload, ipAddress?: string, userAgent?: string): Promise<string> => {
  const sessionId = generateSessionId();
  const token = jwt.sign(
    { ...payload, sessionId },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as jwt.SignOptions
  );

  // Session'ı veritabanına kaydet
  await prisma.session.create({
    data: {
      id: sessionId,
      userId: payload.userId,
      token,
      expiresAt: new Date(Date.now() + (24 * 60 * 60 * 1000)), // 24 saat
      ipAddress,
      userAgent,
      isActive: true,
    },
  });

  return token;
};

/**
 * JWT token doğrula ve session kontrolü yap
 */
export const verifyJWT = async (token: string): Promise<JWTPayload> => {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    
    // Session'ı kontrol et
    if (payload.sessionId) {
      const session = await prisma.session.findUnique({
        where: { id: payload.sessionId },
      });

      if (!session || !session.isActive || session.expiresAt < new Date()) {
        throw new Error('Session geçersiz veya süresi dolmuş');
      }

      // Son kullanım zamanını güncelle
      await prisma.session.update({
        where: { id: payload.sessionId },
        data: { lastUsedAt: new Date() },
      });
    }

    return payload;
  } catch (error) {
    throw new Error('Geçersiz token');
  }
};

/**
 * JWT token süresini kontrol et
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) {
      return true;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
};

/**
 * Session'ı sonlandır (logout)
 */
export const invalidateSession = async (sessionId: string): Promise<void> => {
  await prisma.session.update({
    where: { id: sessionId },
    data: { isActive: false },
  });
};

/**
 * Kullanıcının tüm session'larını sonlandır
 */
export const invalidateAllUserSessions = async (userId: number): Promise<void> => {
  await prisma.session.updateMany({
    where: { 
      userId,
      isActive: true 
    },
    data: { isActive: false },
  });
};

/**
* Session ID oluştur
*/
function generateSessionId(): string {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Token'dan session ID al
 */
export const getSessionIdFromToken = (token: string): string | null => {
  try {
    const decoded = jwt.decode(token) as any;
    return decoded?.sessionId || null;
  } catch (error) {
    return null;
  }
};;