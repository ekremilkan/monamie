import prisma from '../lib/prisma';
import crypto from 'crypto';

export class OtpService {
  private static readonly OTP_LENGTH = 6;
  private static readonly OTP_EXPIRY_MINUTES = 2;
  private static readonly MAX_ATTEMPTS = 3;
  private static readonly RATE_LIMIT_MINUTES = 1;
  private static readonly MAX_REQUESTS_PER_MINUTE = 3;

  /**
   * 6 haneli OTP kodu üretir
   */
  static generateOtpCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * OTP kodu oluşturur ve veritabanına kaydeder
   */
  static async createOtpCode(email: string, type: 'login' | 'register' | 'password_reset', userId?: number): Promise<string> {
    // Rate limiting kontrolü
    await this.checkRateLimit(email, type);

    // Eski kullanılmamış kodları temizle
    await this.cleanupOldOtpCodes(email, type);

    const code = this.generateOtpCode();
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

    await prisma.otpCode.create({
      data: {
        code,
        email,
        type,
        expiresAt,
        userId,
      },
    });

    return code;
  }

  /**
   * OTP kodunu doğrular
   */
  static async verifyOtpCode(email: string, code: string, type: 'login' | 'register' | 'password_reset'): Promise<boolean> {
    const otpCode = await prisma.otpCode.findFirst({
      where: {
        email,
        code,
        type,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!otpCode) {
      // Başarısız denemeyi artır
      await this.incrementFailedAttempts(email, type);
      return false;
    }

    // Maksimum deneme sayısını kontrol et
    if (otpCode.attempts >= this.MAX_ATTEMPTS) {
      await this.markOtpAsUsed(otpCode.id);
      return false;
    }

    // Kodu kullanılmış olarak işaretle
    await this.markOtpAsUsed(otpCode.id);
    return true;
  }

  /**
   * Başarısız doğrulama denemesini artırır
   */
  private static async incrementFailedAttempts(email: string, type: 'login' | 'register' | 'password_reset'): Promise<void> {
    const recentOtp = await prisma.otpCode.findFirst({
      where: {
        email,
        type,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (recentOtp) {
      await prisma.otpCode.update({
        where: { id: recentOtp.id },
        data: { attempts: recentOtp.attempts + 1 },
      });
    }
  }

  /**
   * Kodu kullanılmış olarak işaretler
   */
  private static async markOtpAsUsed(otpId: number): Promise<void> {
    await prisma.otpCode.update({
      where: { id: otpId },
      data: { used: true },
    });
  }

  /**
   * Rate limiting kontrolü yapar
   */
  private static async checkRateLimit(email: string, type: string): Promise<void> {
    const oneMinuteAgo = new Date(Date.now() - this.RATE_LIMIT_MINUTES * 60 * 1000);
    
    const recentRequests = await prisma.otpCode.count({
      where: {
        email,
        type,
        createdAt: {
          gte: oneMinuteAgo,
        },
      },
    });

    if (recentRequests >= this.MAX_REQUESTS_PER_MINUTE) {
      throw new Error(`Rate limit exceeded. Maximum ${this.MAX_REQUESTS_PER_MINUTE} requests per minute allowed.`);
    }
  }

  /**
   * Eski kullanılmamış kodları temizler
   */
  private static async cleanupOldOtpCodes(email: string, type: string): Promise<void> {
    await prisma.otpCode.updateMany({
      where: {
        email,
        type,
        used: false,
        expiresAt: {
          lt: new Date(),
        },
      },
      data: { used: true },
    });
  }

  /**
   * Kullanıcının aktif OTP kodunu getirir
   */
  static async getActiveOtpCode(email: string, type: 'login' | 'register' | 'password_reset'): Promise<any> {
    return await prisma.otpCode.findFirst({
      where: {
        email,
        type,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Kodun kalan süresini saniye cinsinden döndürür
   */
  static getRemainingTime(otpCode: any): number {
    if (!otpCode || otpCode.used) {
      return 0;
    }
    
    const now = new Date();
    const expiry = new Date(otpCode.expiresAt);
    const remainingSeconds = Math.floor((expiry.getTime() - now.getTime()) / 1000);
    
    return Math.max(0, remainingSeconds);
  }
}