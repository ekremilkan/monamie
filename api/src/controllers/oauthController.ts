import { Request, Response } from 'express';
import { googleOAuthService } from '../services/googleOAuthService';
import prisma from '../lib/prisma';
import dotenv from 'dotenv';
dotenv.config();

const defaultFrontendOrigins = [
  'http://localhost:4321',
  'http://127.0.0.1:4321',
];

const collectAllowedFrontendOrigins = (): string[] => {
  const envList = process.env.FRONTEND_URLS
    ? process.env.FRONTEND_URLS.split(',').map((origin) => origin.trim()).filter(Boolean)
    : [];
  const lan = process.env.FRONTEND_LAN_URL?.trim();
  const single = process.env.FRONTEND_URL?.trim();

  const origins = new Set<string>(defaultFrontendOrigins);
  envList.forEach((origin) => origins.add(origin));
  if (lan) origins.add(lan);
  if (single) origins.add(single);
  return Array.from(origins);
};

const resolveFrontendBaseUrl = (): string => {
  const allowedOrigins = collectAllowedFrontendOrigins();
  if (allowedOrigins.length > 0) {
    return allowedOrigins[0];
  }
  return 'http://localhost:4321';
};

const isPrivateHost = (hostname: string): boolean => {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
  );
};

const tryUseUrl = (urlCandidate: string): string | undefined => {
  try {
    const parsed = new URL(urlCandidate);
    if (['http:', 'https:'].includes(parsed.protocol)) {
      const allowedOrigins = collectAllowedFrontendOrigins();
      if (
        allowedOrigins.includes(parsed.origin) ||
        isPrivateHost(parsed.hostname)
      ) {
        return parsed.origin;
      }
    }
  } catch {
    // ignore parse errors
  }
  return undefined;
};

const sanitizeOrigin = (origin: string): string => origin.replace(/\/+$/, '');
const sanitizeUrl = (url: string): string => url.replace(/\/+$/, '');

const getRequestProtocol = (req: Request): string => {
  const forwardedProto = (req.headers['x-forwarded-proto'] as string | undefined)?.split(',')[0]?.trim();
  if (forwardedProto) {
    return forwardedProto;
  }
  if (req.protocol) {
    return req.protocol;
  }
  return 'http';
};

const getRequestHost = (req: Request): string => {
  const forwardedHost = (req.headers['x-forwarded-host'] as string | undefined)?.split(',')[0]?.trim();
  if (forwardedHost) {
    return forwardedHost;
  }
  return req.headers.host ?? 'localhost:3000';
};

const getBackendOrigin = (req: Request): string => {
  const protocol = getRequestProtocol(req);
  const host = getRequestHost(req);
  return sanitizeOrigin(`${protocol}://${host}`);
};

const FALLBACK_CALLBACK_URL = (() => {
  const envCallback = process.env.GOOGLE_REDIRECT_URI;
  if (envCallback) {
    return sanitizeUrl(envCallback);
  }
  return 'http://localhost:3000/api/oauth/google/callback';
})();

const buildBackendCallbackUrl = (req: Request): string => {
  const overrideBase = process.env.GOOGLE_CALLBACK_BASE_URL?.trim();
  if (overrideBase) {
    return `${sanitizeOrigin(overrideBase)}/api/oauth/google/callback`;
  }

  const origin = getBackendOrigin(req);

  try {
    const parsed = new URL(origin);
    if (isPrivateHost(parsed.hostname)) {
      return FALLBACK_CALLBACK_URL;
    }
  } catch {
    // ignore parse errors, fall back
  }

  return `${origin}/api/oauth/google/callback`;
};

const getStateString = (stateParam: unknown): string => {
  if (Array.isArray(stateParam)) {
    const first = stateParam[0];
    return typeof first === 'string' && first.length > 0
      ? first
      : 'default_state';
  }
  if (typeof stateParam === 'string' && stateParam.length > 0) {
    return stateParam;
  }
  return 'default_state';
};

const extractRedirectBaseFromState = (stateParam: unknown): string | undefined => {
  if (stateParam == null) {
    return undefined;
  }

  let stateValue: unknown = stateParam;
  if (Array.isArray(stateParam)) {
    stateValue = stateParam[0];
  }

  if (stateValue == null) {
    return undefined;
  }

  const tryUseUrl = (urlCandidate: string): string | undefined => {
    try {
      const parsed = new URL(urlCandidate);
      if (['http:', 'https:'].includes(parsed.protocol)) {
        const allowedOrigins = collectAllowedFrontendOrigins();
        if (
          allowedOrigins.includes(parsed.origin) ||
          isPrivateHost(parsed.hostname)
        ) {
          return parsed.origin;
        }
      }
    } catch {
      // ignore parse errors
    }
    return undefined;
  };

  if (typeof stateValue === 'string') {
    const tryParseJson = (raw: string): string | undefined => {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && typeof (parsed as any).redirectBase === 'string') {
          return tryUseUrl((parsed as any).redirectBase);
        }
      } catch {
        // ignore
      }
      return undefined;
    };

    const fromJson = tryParseJson(stateValue);
    if (fromJson) {
      return fromJson;
    }

    try {
      const decoded = Buffer.from(stateValue, 'base64').toString('utf-8');
      const fromDecodedJson = tryParseJson(decoded);
      if (fromDecodedJson) {
        return fromDecodedJson;
      }
    } catch {
      // ignore base64 errors
    }

    return tryUseUrl(stateValue);
  }

  return undefined;
};

/**
 * Google OAuth giriş URL'i oluştur
 */
export const getGoogleAuthUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    // CSRF koruması için state parametresi
    const state = getStateString(req.query.state);
    const callbackUrl = buildBackendCallbackUrl(req);
    
    const authUrl = googleOAuthService.getAuthorizationUrl(state, callbackUrl);
    
    res.json({
      success: true,
      data: {
        authUrl,
      },
    });
  } catch (error) {
    console.error('Google Auth URL error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate Google auth URL',
    });
  }
};

/**
 * Google OAuth callback - kullanıcı girişi
 */
export const handleGoogleCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, state } = req.query;

    if (!code || typeof code !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Authorization code is required',
      });
      return;
    }

    // Authorization code ile token al
    const callbackUrl = buildBackendCallbackUrl(req);
    const tokens = await googleOAuthService.exchangeCodeForTokens(code, callbackUrl);
    
    // Google'dan kullanıcı bilgilerini al
    const googleUser = await googleOAuthService.getUserInfo(tokens.access_token);
    
    // Kullanıcıyı bul veya oluştur
    const { user, isNewUser } = await googleOAuthService.findOrCreateUser(googleUser);
    
    // JWT token oluştur
    const jwtToken = await googleOAuthService.generateJWT(user);

    // Frontend'e yönlendirme yap
    const frontendUrl =
      extractRedirectBaseFromState(state) || resolveFrontendBaseUrl();
    const redirectUrl = new URL('/oauth/callback', frontendUrl);
    
    // Token ve kullanıcı bilgilerini URL parametreleri olarak ekle
    redirectUrl.searchParams.set('token', jwtToken);
    redirectUrl.searchParams.set('userId', user.id.toString());
    redirectUrl.searchParams.set('email', user.email);
    redirectUrl.searchParams.set('name', user.name);
    redirectUrl.searchParams.set('isNewUser', isNewUser.toString());
    
    if (user.pictureUrl) {
      redirectUrl.searchParams.set('pictureUrl', user.pictureUrl);
    }

    // Başarılı giriş için yönlendir
    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('Google callback error:', error);
    
    // Hata durumunda frontend'e hata ile yönlendir
    const frontendUrl =
      extractRedirectBaseFromState(req.query.state) || resolveFrontendBaseUrl();
    const errorUrl = new URL('/oauth/error', frontendUrl);
    errorUrl.searchParams.set('error', 'Google authentication failed');
    
    res.redirect(errorUrl.toString());
  }
};

/**
 * Mevcut kullanıcıya Google hesabı bağla
 */
export const linkGoogleAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const { code } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
      return;
    }

    if (!code) {
      res.status(400).json({
        success: false,
        error: 'Authorization code is required',
      });
      return;
    }

    // Authorization code ile token al
    const tokens = await googleOAuthService.exchangeCodeForTokens(code);
    
    // Google'dan kullanıcı bilgilerini al
    const googleUser = await googleOAuthService.getUserInfo(tokens.access_token);
    
    // Bu Google hesabı başka kullanıcıya ait mi kontrol et
    const existingUser = await prisma.user.findFirst({
      where: {
        provider: 'google',
        providerId: googleUser.id,
      },
    });

    if (existingUser && existingUser.id !== userId) {
      res.status(400).json({
        success: false,
        error: 'This Google account is already linked to another user',
      });
      return;
    }

    // Google hesabını kullanıcıya bağla
    await googleOAuthService.linkGoogleAccount(userId, googleUser);
    
    // Güncellenmiş kullanıcı bilgilerini al
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        pictureUrl: true,
        provider: true,
        emailVerified: true,
      },
    });

    res.json({
      success: true,
      data: {
        user: updatedUser,
        message: 'Google account linked successfully',
      },
    });
  } catch (error) {
    console.error('Link Google account error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to link Google account',
    });
  }
};

/**
 * Google hesabı bağlantısını kaldır
 */
export const unlinkGoogleAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
      return;
    }

    // Google hesabı bağlantısını kaldır
    await googleOAuthService.unlinkGoogleAccount(userId);
    
    // Güncellenmiş kullanıcı bilgilerini al
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        pictureUrl: true,
        provider: true,
        emailVerified: true,
      },
    });

    res.json({
      success: true,
      data: {
        user: updatedUser,
        message: 'Google account unlinked successfully',
      },
    });
  } catch (error: any) {
    console.error('Unlink Google account error:', error);
    
    if (error.message.includes('alternative login method')) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to unlink Google account',
    });
  }
};

/**
 * Google hesabı bağlantı durumunu kontrol et
 */
export const checkGoogleAccountStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        provider: true,
        providerId: true,
        pictureUrl: true,
        emailVerified: true,
      },
    });

    const isLinked = user?.provider === 'google' && !!user?.providerId;

    res.json({
      success: true,
      data: {
        isLinked,
        pictureUrl: user?.pictureUrl,
        emailVerified: user?.emailVerified,
      },
    });
  } catch (error) {
    console.error('Check Google account status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check Google account status',
    });
  }
};
