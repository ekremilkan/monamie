import express from 'express';
import {
  createReview,
  getProductReviews,
  canUserReview,
  approveReview,
  rejectReview,
  getPendingReviews,
  getFeaturedReviews,
  createOrderReview,
  getOrderReviewStatus,
} from '../controllers/reviewController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Kullanıcı yorum oluşturma
router.post('/', authenticateToken, createReview);

// Sipariş bazlı yorum oluşturma
router.post('/order', authenticateToken, createOrderReview);

// Sipariş yorum durumu kontrolü
router.get('/order/:orderId/status', authenticateToken, getOrderReviewStatus);

// Ürün yorumlarını getirme
router.get('/product/:productId', getProductReviews);

// Öne çıkan yorumları getir (anasayfa için)
router.get('/featured', getFeaturedReviews);

// Kullanıcı yorum yapabilir mi kontrolü
router.get('/can-review/:productId', authenticateToken, canUserReview);

// Admin işlemleri
router.patch('/:id/approve', authenticateToken, approveReview);
router.patch('/:id/reject', authenticateToken, rejectReview);
router.get('/pending', authenticateToken, getPendingReviews);

export default router;