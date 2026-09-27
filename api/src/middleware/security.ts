import { Request, Response, NextFunction } from "express";
import rateLimit, { ipKeyGenerator, MemoryStore } from "express-rate-limit";
import prisma from "../lib/prisma";

const otpRequestStore = new MemoryStore();
const otpVerifyStore = new MemoryStore();
const generalStore = new MemoryStore();

const otpRateLimitKey = (req: Request, action: string): string => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const normalizedIp = ip === "unknown" ? ip : ipKeyGenerator(ip);
  const email =
    typeof req.body?.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";
  return `${action}:${normalizedIp}:${email}`;
};

// OTP isteği için rate limiting - dakikada 10 istek
export const otpRequestLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 dakika
  max: 10,
  message: {
    error: "Zu viele Anfragen. Bitte versuchen Sie es in einer Minute erneut.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => otpRateLimitKey(req, "otp_request"),
  store: otpRequestStore,
});

// OTP doğrulama için rate limiting - dakikada 20 deneme
export const otpVerifyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 dakika
  max: 20,
  message: {
    error: "Zu viele Versuche. Bitte versuchen Sie es in einer Minute erneut.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => otpRateLimitKey(req, "otp_verify"),
  store: otpVerifyStore,
});

// Genel API rate limiting (15 dakikada 1000 istek)
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 1000,
  message: {
    error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) =>
    ipKeyGenerator(req.ip || req.socket.remoteAddress || "0.0.0.0"),
  // Preflight isteklerini (OPTIONS) sayma: geliştirirken gereksiz 429’ları önler
  skip: (req: Request) => req.method === "OPTIONS",
  store: generalStore,
});

// Güvenlik middleware'i
export const securityMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // Güvenlik başlıkları
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains",
  );

  // IP adresini al
  const ip = req.ip || req.connection.remoteAddress || "unknown";
  req.realIp = ip;

  next();
};

// Request validation middleware
export const validateRequest = (requiredFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missingFields: string[] = [];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      res.status(400).json({
        error: "Fehlende Pflichtfelder",
        missingFields,
      });
      return;
    }

    next();
  };
};

// IP tabanlı engelleme middleware'i
export const ipBlocker = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const ip = req.realIp || req.ip || req.connection.remoteAddress || "unknown";

  // IP adresini kontrol et (örnek: localhost'u engelleme)
  if (ip === "::1" || ip === "127.0.0.1") {
    next();
    return;
  }

  // Burada IP tabanlı engelleme mantığı eklenebilir
  // Örneğin: VPN/Proxy kontrolü, ülke bazlı engelleme vb.

  next();
};

// Extend Request interface
declare global {
  namespace Express {
    interface Request {
      realIp?: string;
    }
  }
}

// Başarısız giriş denemesini kaydet
export const trackFailedAttempt = async (
  email: string,
  ipAddress: string,
  userAgent: string,
): Promise<void> => {
  await prisma.failedAttempt.create({
    data: {
      email,
      ipAddress,
      userAgent,
      timestamp: new Date(),
    },
  });
};

// Hesap kilitleme kontrolü
export const checkAccountLock = async (
  email: string,
  ipAddress: string,
): Promise<boolean> => {
  const now = new Date();
  const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

  // Son 15 dakikadaki başarısız denemeleri say
  const failedAttempts = await prisma.failedAttempt.count({
    where: {
      OR: [{ email }, { ipAddress }],
      timestamp: {
        gte: fifteenMinutesAgo,
      },
    },
  });

  // 10'dan fazla başarısız deneme varsa hesap kilitli
  return failedAttempts >= 10;
};
