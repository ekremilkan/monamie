import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { OtpService } from '../services/otpService';
import { EmailService } from '../services/emailService';
import { generateJWT, invalidateAllUserSessions } from '../services/jwtService';
import { AuthenticatedRequest } from '../middleware/auth';
import { trackFailedAttempt, checkAccountLock } from '../middleware/security';

/**
 * OTP kodu iste
 */
export const requestOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validasyon hatalarını kontrol et
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Ungültige E-Mail-Adresse',
        errors: errors.array(),
      });
      return;
    }

    const { email } = req.body;

    // Kullanıcı var mı kontrol et
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'Benutzer nicht gefunden',
      });
      return;
    }

    // Google ile giriş yapmış kullanıcılar için OTP gönderme
    if (user.provider === 'google') {
      res.status(400).json({
        success: false,
        error: 'Bitte verwenden Sie Google Login',
      });
      return;
    }

    // OTP kodu oluştur ve gönder
    const code = await OtpService.createOtpCode(email, 'login', user.id);
    await EmailService.sendOtpEmail(email, code, 'login');

    res.json({
      success: true,
      message: 'Einmalpasswort wurde an Ihre E-Mail gesendet',
      data: {
        email,
        expiresIn: 120, // 2 dakika
      },
    });
  } catch (error) {
    console.error('OTP request error:', error);
    
    if (error instanceof Error && error.message.includes('Rate limit')) {
      res.status(429).json({
        success: false,
        error: 'Zu viele Anfragen. Bitte warten Sie eine Minute.',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Ein Fehler ist aufgetreten',
    });
  }
};

/**
 * OTP kodunu doğrula ve giriş yap
 */
export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Ungültige Eingaben',
        errors: errors.array(),
      });
      return;
    }

    const { email, code } = req.body;
    const ip = req.realIp || req.ip || req.connection.remoteAddress || 'unknown';

    // Brute force koruması - hesap kilitli mi?
    const isLocked = await checkAccountLock(email, ip);
    if (isLocked) {
      res.status(423).json({
        success: false,
        error: 'Konto vorübergehend gesperrt. Bitte versuchen Sie es später erneut.',
      });
      return;
    }

    // OTP kodunu doğrula
    const isValid = await OtpService.verifyOtpCode(email, code, 'login');

    if (!isValid) {
      // Başarısız giriş denemesini kaydet
      await trackFailedAttempt(email, ip, req.get('User-Agent') || '');
      
      res.status(400).json({
        success: false,
        error: 'Ungültiger oder abgelaufener Code',
      });
      return;
    }

    // Kullanıcı bilgilerini al
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'Benutzer nicht gefunden',
      });
      return;
    }

    // Son giriş zamanını güncelle
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // JWT token oluştur
    const token = await generateJWT(
      {
        userId: user.id,
        email: user.email,
        name: user.name || '',
        provider: user.provider,
      },
      req.ip,
      req.get('User-Agent')
    );

    res.json({
      success: true,
      message: 'Erfolgreich angemeldet',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          provider: user.provider,
          pictureUrl: user.pictureUrl,
          emailVerified: user.emailVerified,
        },
      },
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Ein Fehler ist aufgetreten',
    });
  }
};

/**
 * Yeni kullanıcı kaydı için OTP iste
 */
export const registerRequestOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Ungültige Eingaben',
        errors: errors.array(),
      });
      return;
    }

    const { email, firstName, lastName } = req.body;
    const name = `${firstName} ${lastName}`.trim();

    // Kullanıcı zaten var mı?
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        error: 'E-Mail-Adresse bereits registriert',
      });
      return;
    }

    // OTP kodu oluştur ve gönder
    const code = await OtpService.createOtpCode(email, 'register');
    await EmailService.sendOtpEmail(email, code, 'register');

    res.json({
      success: true,
      message: 'Einmalpasswort wurde an Ihre E-Mail gesendet',
      data: {
        email,
        name,
        expiresIn: 120, // 2 dakika
      },
    });
  } catch (error) {
    console.error('Registration OTP request error:', error);
    
    if (error instanceof Error && error.message.includes('Rate limit')) {
      res.status(429).json({
        success: false,
        error: 'Zu viele Anfragen. Bitte warten Sie eine Minute.',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Ein Fehler ist aufgetreten',
    });
  }
};

/**
 * Kayıt OTP kodunu doğrula ve kullanıcıyı oluştur
 */
export const registerVerifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Ungültige Eingaben',
        errors: errors.array(),
      });
      return;
    }

    const { email, code, firstName, lastName } = req.body;
    const name = `${firstName} ${lastName}`.trim();
    const ip = req.realIp || req.ip || req.connection.remoteAddress || 'unknown';

    // Brute force koruması - hesap kilitli mi?
    const isLocked = await checkAccountLock(email, ip);
    if (isLocked) {
      res.status(423).json({
        success: false,
        error: 'Konto vorübergehend gesperrt. Bitte versuchen Sie es später erneut.',
      });
      return;
    }

    // OTP kodunu doğrula
    const isValid = await OtpService.verifyOtpCode(email, code, 'register');

    if (!isValid) {
      // Başarısız giriş denemesini kaydet
      await trackFailedAttempt(email, ip, req.get('User-Agent') || '');
      
      res.status(400).json({
        success: false,
        error: 'Ungültiger oder abgelaufener Code',
      });
      return;
    }

    // Kullanıcı zaten var mı kontrol et (tekrar)
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        error: 'E-Mail-Adresse bereits registriert',
      });
      return;
    }

    // Yeni kullanıcı oluştur
    const user = await prisma.user.create({
      data: {
        email,
        name,
        emailVerified: true, // OTP doğrulandı
        lastLoginAt: new Date(),
      },
    });

    // JWT token oluştur
    const token = await generateJWT(
      {
        userId: user.id,
        email: user.email,
        name: user.name || '',
        provider: null,
      },
      req.ip,
      req.get('User-Agent')
    );

    res.json({
      success: true,
      message: 'Registrierung erfolgreich',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          provider: user.provider,
          emailVerified: user.emailVerified,
        },
      },
   });
  } catch (error) {
    console.error('Registration verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Ein Fehler ist aufgetreten',
    });
  }
};

/**
 * Çıkış yap
 */
export const logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Nicht autorisiert',
      });
      return;
    }

    // Session'ı sonlandır
    if (req.user.sessionId) {
      const { invalidateSession } = await import('../services/jwtService');
      await invalidateSession(req.user.sessionId);
    }

    res.json({
      success: true,
      message: 'Erfolgreich abgemeldet',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Ein Fehler ist aufgetreten',
    });
  }
};

/**
* Tüm cihazlardan çıkış yap
*/
export const logoutAll = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Nicht autorisiert',
      });
      return;
    }

    // Kullanıcının tüm session'larını sonlandır
    await invalidateAllUserSessions(req.user.userId);

    res.json({
      success: true,
      message: 'Von allen Geräten abgemeldet',
    });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({
      success: false,
      error: 'Ein Fehler ist aufgetreten',
    });
  }
};