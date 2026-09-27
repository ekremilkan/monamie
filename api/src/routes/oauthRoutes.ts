import { Router } from 'express';
import {
  getGoogleAuthUrl,
  handleGoogleCallback,
  linkGoogleAccount,
  unlinkGoogleAccount,
  checkGoogleAccountStatus,
} from '../controllers/oauthController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * @route   GET /api/oauth/google/auth-url
 * @desc    Google OAuth authorization URL al
 * @access  Public
 */
router.get('/google/auth-url', getGoogleAuthUrl);

/**
 * @route   GET /api/oauth/google/callback
 * @desc    Google OAuth callback - kullanıcı girişi
 * @access  Public
 */
router.get('/google/callback', handleGoogleCallback);

/**
 * @route   POST /api/oauth/google/link
 * @desc    Mevcut kullanıcıya Google hesabı bağla
 * @access  Private (authentication required)
 */
router.post('/google/link', authenticateToken, linkGoogleAccount);

/**
 * @route   DELETE /api/oauth/google/unlink
 * @desc    Google hesabı bağlantısını kaldır
 * @access  Private (authentication required)
 */
router.delete('/google/unlink', authenticateToken, unlinkGoogleAccount);

/**
 * @route   GET /api/oauth/google/status
 * @desc    Google hesabı bağlantı durumunu kontrol et
 * @access  Private (authentication required)
 */
router.get('/google/status', authenticateToken, checkGoogleAccountStatus);

// Kısa yol: /api/oauth/google -> auth-url döndürür
router.get('/google', getGoogleAuthUrl);

export default router;