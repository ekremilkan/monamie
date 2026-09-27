import dotenv from 'dotenv';
import axios from 'axios';
import prisma from '../lib/prisma';
import bcrypt from 'bcrypt';
import { generateJWT, JWTPayload } from './jwtService';

interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
  email_verified: boolean;
}

interface GoogleTokens {
  access_token: string;
  id_token: string;
  expires_in: number;
  token_type: string;
}

class GoogleOAuthService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID!;
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    this.redirectUri = process.env.GOOGLE_REDIRECT_URI!;

    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      throw new Error('Google OAuth environment variables are not configured');
    }
  }

  /**
   * Google OAuth authorization URL oluştur
   */
  getAuthorizationUrl(state: string, redirectUriOverride?: string): string {
    const redirectUri = redirectUriOverride || this.redirectUri;
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      scope: 'openid email profile',
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      state: state,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Authorization code ile access token al
   */
  async exchangeCodeForTokens(code: string, redirectUriOverride?: string): Promise<GoogleTokens> {
    const redirectUri = redirectUriOverride || this.redirectUri;
    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Google token exchange failed: ${error.response?.data?.error_description || error.message}`);
      }
      throw new Error('Failed to exchange code for tokens');
    }
  }

  /**
   * Google'dan kullanıcı bilgilerini al
   */
  async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    try {
      const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to get user info from Google: ${error.response?.data?.error?.message || error.message}`);
      }
      throw new Error('Failed to get user info from Google');
    }
  }

  /**
   * Google kullanıcısını veritabanında bul veya oluştur
   */
  async findOrCreateUser(googleUser: GoogleUserInfo): Promise<{
    user: any;
    isNewUser: boolean;
  }> {
    try {
      // Önce Google provider ID ile kullanıcıyı ara
      let user = await prisma.user.findFirst({
        where: {
          provider: 'google',
          providerId: googleUser.id,
        },
      });

      if (user) {
        // Mevcut kullanıcı - son giriş zamanını güncelle
        user = await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });
        return { user, isNewUser: false };
      }

      // Email ile kullanıcıyı ara (Google hesabını bağlamak isteyen mevcut kullanıcı)
      user = await prisma.user.findUnique({
        where: { email: googleUser.email },
      });

      if (user) {
        // Mevcut kullanıcı - Google hesabını bağla
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            provider: 'google',
            providerId: googleUser.id,
            pictureUrl: googleUser.picture,
            emailVerified: googleUser.email_verified,
            lastLoginAt: new Date(),
          },
        });
        return { user, isNewUser: false };
      }

      // Yeni kullanıcı oluştur
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name,
          provider: 'google',
          providerId: googleUser.id,
          pictureUrl: googleUser.picture,
          emailVerified: googleUser.email_verified,
          lastLoginAt: new Date(),
        },
      });

      return { user, isNewUser: true };
    } catch (error) {
      console.error('findOrCreateUser error:', error);
      throw error;
    }
  }

  /**
   * JWT token oluştur
   */
  async generateJWT(user: any): Promise<string> {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      provider: user.provider,
    };

    return generateJWT(payload);
  }

  /**
   * Google hesabını mevcut kullanıcıya bağla
   */
  async linkGoogleAccount(userId: number, googleUser: GoogleUserInfo): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          provider: 'google',
          providerId: googleUser.id,
          pictureUrl: googleUser.picture,
          emailVerified: googleUser.email_verified,
        },
      });
    } catch (error) {
      throw new Error('Failed to link Google account');
    }
  }

  /**
   * Google hesabı bağlantısını kaldır
   */
  async unlinkGoogleAccount(userId: number): Promise<void> {
    try {
      // Kullanıcının email doğrulaması var mı kontrol et (alternatif giriş yöntemi)
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { emailVerified: true },
      });

      if (!user?.emailVerified) {
        throw new Error('Cannot unlink Google account without verified email');
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          provider: null,
          providerId: null,
          pictureUrl: null,
        },
      });
    } catch (error) {
      throw error; // Hata mesajını aynen ilet
    }
  }
}

export const googleOAuthService = new GoogleOAuthService();
export type { GoogleUserInfo, GoogleTokens };
