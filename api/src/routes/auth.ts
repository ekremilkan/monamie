import { Router } from 'express';
import { body } from 'express-validator';
import {
  requestOtp,
  verifyOtp,
  registerRequestOtp,
  registerVerifyOtp,
  logout,
  logoutAll,
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { otpRequestLimiter, otpVerifyLimiter, validateRequest } from '../middleware/security';

const router = Router();

/**
 * @route   POST /api/auth/request-otp
 * @desc    OTP kodu iste (giriş için)
 * @access  Public
 */
router.post(
  '/request-otp',
  otpRequestLimiter,
  validateRequest(['email']),
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Ungültige E-Mail-Adresse'),
  ],
  requestOtp
);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    OTP kodunu doğrula ve giriş yap
 * @access  Public
 */
router.post(
  '/verify-otp',
  otpVerifyLimiter,
  validateRequest(['email', 'code']),
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Ungültige E-Mail-Adresse'),
    body('code')
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage('Code muss 6 Ziffern haben'),
  ],
  verifyOtp
);

/**
 * @route   POST /api/auth/register
 * @desc    Kayıt için OTP kodu iste
 * @access  Public
 */
router.post(
  '/register',
  otpRequestLimiter,
  validateRequest(['email', 'firstName', 'lastName']),
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Ungültige E-Mail-Adresse'),
    body('firstName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Vorname ist erforderlich'),
    body('lastName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Nachname ist erforderlich'),
  ],
  registerRequestOtp
);

/**
 * @route   POST /api/auth/verify-registration
 * @desc    Kayıt OTP kodunu doğrula ve kullanıcı oluştur
 * @access  Public
 */
router.post(
  '/verify-registration',
  otpVerifyLimiter,
  validateRequest(['email', 'code', 'firstName', 'lastName']),
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Ungültige E-Mail-Adresse'),
    body('code')
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage('Code muss 6 Ziffern haben'),
    body('firstName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Vorname ist erforderlich'),
    body('lastName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Nachname ist erforderlich'),
  ],
  registerVerifyOtp
);

/**
 * @route   POST /api/auth/logout
 * @desc    Çıkış yap
 * @access  Private
 */
router.post('/logout', authenticateToken, logout);

/**
 * @route   POST /api/auth/logout-all
 * @desc    Tüm cihazlardan çıkış yap
 * @access  Private
 */
router.post('/logout-all', authenticateToken, logoutAll);

export default router;