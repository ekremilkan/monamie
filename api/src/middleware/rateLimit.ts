import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

interface RateLimitConfig {
  windowMs: number; // Zaman penceresi (ms)
  max: number; // Maksimum istek sayısı
  keyGenerator?: (req: Request) => string; // Anahtar üretici fonksiyon
  message?: string; // Hata mesajı
  skipSuccessfulRequests?: boolean; // Başarılı istekleri saymaz
  skipFailedRequests?: boolean; // Başarısız istekleri saymaz
}

/**
 * Rate limiting middleware
 */
export function rateLimit(config: RateLimitConfig) {
  const {
    windowMs,
    max,
    keyGenerator = (req: Request) => req.ip || 'unknown',
    message = 'Zu viele Anfragen, bitte versuchen Sie es später erneut.',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = config;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = keyGenerator(req);
      const now = new Date();
      const windowStart = new Date(now.getTime() - windowMs);

      // Eski kayıtları temizle
      await prisma.rateLimit.deleteMany({
        where: {
          key,
          createdAt: {
            lt: windowStart,
          },
        },
      });

      // Mevcut istek sayısını al
      const requestCount = await prisma.rateLimit.count({
        where: {
          key,
          createdAt: {
            gte: windowStart,
          },
        },
      });

      // Rate limit aşıldı mı?
      if (requestCount >= max) {
        res.status(429).json({
          error: 'Rate limit exceeded',
          message,
          retryAfter: Math.ceil(windowMs / 1000),
        });
        return;
      }

      // İsteği kaydet (sonradan kontrol etmek için)
      const originalSend = res.send;
      let responseSent = false;

      res.send = function(body: any): Response {
        if (!responseSent) {
          responseSent = true;
          
          const shouldSkip = 
            (skipSuccessfulRequests && res.statusCode < 400) ||
            (skipFailedRequests && res.statusCode >= 400);

          if (!shouldSkip) {
            // İsteği kaydet (asenkron olarak)
            prisma.rateLimit.create({
              data: {
                key,
                ip: req.ip || 'unknown',
                userAgent: req.get('User-Agent') || 'unknown',
                statusCode: res.statusCode,
                path: req.path,
                method: req.method,
              },
            }).catch((error: Error) => {
              console.error('Rate limit kaydı hatası:', error);
            });
          }
        }

        return originalSend.call(this, body);
      };

      next();
    } catch (error) {
      console.error('Rate limiting hatası:', error);
      next(); // Rate limiting hatası uygulamayı durdurmamalı
    }
  };
}

/**
 * Özel rate limiting middleware'leri
 */

// OTP gönderim rate limiting (dakikada 3)
export const otpRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 dakika
  max: 3,
  keyGenerator: (req: Request) => {
    // Email adresine göre rate limiting
    const email = req.body.email || req.body.email;
    return `otp:${email || req.ip}`;
  },
  message: 'Zu viele OTP-Anfragen. Bitte warten Sie eine Minute.',
});

// Genel API rate limiting (saniyede 10)
export const apiRateLimit = rateLimit({
  windowMs: 1000, // 1 saniye
  max: 10,
  keyGenerator: (req: Request) => req.ip || 'unknown',
  message: 'Zu viele Anfragen. Bitte verlangsamen Sie.',
});

// Login denemesi rate limiting (15 dakikada 5)
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 5,
  keyGenerator: (req: Request) => {
    const email = req.body.email;
    return `login:${email || req.ip}`;
  },
  message: 'Zu viele Login-Versuche. Bitte warten Sie 15 Minuten.',
  skipSuccessfulRequests: true, // Başarılı girişleri sayma
});

// Brute-force koruması için IP tabanlı rate limiting
export const bruteForceProtection = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 dakika
  max: 20,
  keyGenerator: (req: Request) => req.ip || 'unknown',
  message: 'Verdächtige Aktivität erkannt. Bitte warten Sie.',
});