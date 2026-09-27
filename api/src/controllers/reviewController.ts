import { Request, Response } from 'express';
import { PrismaClient, OrderStatus } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { JWTPayload } from '../services/jwtService';

const prisma = new PrismaClient();

interface ReviewInput {
  orderId: number;
  productId?: number; // Artık opsiyonel
  rating: number;
  comment: string;
}

interface OrderReviewInput {
  orderId: number;
  rating: number;
  comment: string;
}

interface AuthRequest extends Request {
  user?: JWTPayload & { role?: string };
};

const toClientOrderStatus = (status: OrderStatus | null | undefined): string | null => {
  if (!status) {
    return null;
  }
  return status.toLowerCase();
};

// Kullanıcı yorum oluşturma
export const createReview = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId, productId, rating, comment } = req.body as ReviewInput;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    // Validasyon
    if (!orderId || !rating || !comment) {
      return res.status(400).json({ error: 'Alle Felder sind erforderlich' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Bewertung muss zwischen 1 und 5 liegen' });
    }

    if (comment.length > 500) {
      return res.status(400).json({ error: 'Kommentar darf maximal 500 Zeichen haben' });
    }

    // Sipariş kontrolü - kullanıcının siparişi mi?
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: userId,
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Bestellung nicht gefunden' });
    }

    // Sipariş durumu kontrolü - sadece teslim edilmiş siparişler
    if (order.status !== OrderStatus.DELIVERED) {
      return res.status(403).json({ error: 'Nur für gelieferte Bestellungen möglich' });
    }

    // Ürün bu siparişte var mı? (sadece productId verildiyse kontrol et)
    if (productId) {
      const orderItem = await prisma.orderItem.findFirst({
        where: {
          orderId: orderId,
          productId: productId,
        },
      });

      if (!orderItem) {
        return res.status(404).json({ error: 'Produkt nicht in dieser Bestellung' });
      }
    }

    // Daha önce yorum yapılmış mı? (sipariş bazlı kontrol)
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_orderId: {
          userId: userId,
          orderId: orderId,
        },
      },
    });

    if (existingReview) {
      return res.status(409).json({ error: 'Sie haben diese Bestellung bereits bewertet' });
    }

    // Yorum oluştur
    const review = await prisma.review.create({
      data: {
        userId,
        orderId,
        productId,
        rating,
        comment,
        status: 'pending',
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            translations: {
              where: { language: 'de' },
              select: { name: true },
            },
          },
        },
      },
    });

    res.status(201).json({
      id: review.id,
      status: review.status,
      createdAt: review.createdAt,
      message: 'Bewertung erfolgreich erstellt und wartet auf Genehmigung',
    });
  } catch (error) {
    console.error('Fehler beim Erstellen der Bewertung:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

// Ürün yorumlarını getir (sadece published olanlar)
export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    if (!productId || isNaN(parseInt(productId))) {
      return res.status(400).json({ error: 'Ungültige Produkt-ID' });
    }

    const reviews: any[] = await prisma.review.findMany({
      where: {
        productId: parseInt(productId),
        status: 'published',
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        order: {
          select: {
            id: true,
            items: {
              select: {
                productId: true,
                product: {
                  select: {
                    translations: {
                      where: { language: 'de' },
                      select: { name: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format response
    const formattedReviews = reviews.map((review: any) => ({
      id: review.id,
      user: {
        name: review.user?.name || review.user?.email?.split('@')[0] || 'Anonym',
        avatar: null, // TODO: Add avatar support if needed
      },
      rating: review.rating,
      comment: review.comment,
      orderedProducts: review.order?.items?.map((item: any) => ({
        id: item.productId,
        name: item.product?.translations?.[0]?.name || 'Unbekanntes Produkt',
      })) || [],
      createdAt: review.createdAt,
    }));

    res.json({ reviews: formattedReviews });
  } catch (error) {
    console.error('Fehler beim Abrufen der Bewertungen:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

// Kullanıcı yorum yapabilir mi kontrolü
export const canUserReview = async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    if (!productId || isNaN(parseInt(productId))) {
      return res.status(400).json({ error: 'Ungültige Produkt-ID' });
    }

    // Kullanıcının bu ürünü sipariş etmiş mi kontrolü
    const order = await prisma.order.findFirst({
      where: {
        userId: userId,
        status: OrderStatus.DELIVERED,
        items: {
          some: {
            productId: parseInt(productId),
          },
        },
      },
      include: {
        items: {
          where: {
            productId: parseInt(productId),
          },
        },
      },
    });

    if (!order) {
      return res.json({
        canReview: false,
        hasOrdered: false,
        orderStatus: null,
        message: 'Sie haben dieses Produkt noch nicht bestellt oder es wurde noch nicht geliefert',
      });
    }

    // Daha önce yorum yapılmış mı? (sipariş bazlı kontrol)
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: userId,
        orderId: order.id,
      },
    });

    if (existingReview) {
      const orderStatus = toClientOrderStatus(order.status);
      return res.json({
        canReview: false,
        hasOrdered: true,
        orderStatus,
        message: 'Sie haben dieses Produkt bereits bewertet',
      });
    }

    const orderStatus = toClientOrderStatus(order.status);
    res.json({
      canReview: true,
      hasOrdered: true,
      orderStatus,
      orderId: order.id,
      message: 'Sie können dieses Produkt bewerten',
    });
  } catch (error) {
    console.error('Fehler bei der Überprüfung der Bewertungsberechtigung:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

// Admin - Yorum onaylama
export const approveReview = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Nur Admins können Bewertungen genehmigen' });
    }

    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      return res.status(404).json({ error: 'Bewertung nicht gefunden' });
    }

    if (review.status !== 'pending') {
      return res.status(400).json({ error: 'Bewertung wurde bereits bearbeitet' });
    }

    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        status: 'published',
        approvedAt: new Date(),
      },
    });

    res.json({
      id: updatedReview.id,
      status: updatedReview.status,
      approvedAt: updatedReview.approvedAt,
      message: 'Bewertung erfolgreich genehmigt',
    });
  } catch (error) {
    console.error('Fehler bei der Genehmigung der Bewertung:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

// Admin - Yorum reddetme
export const rejectReview = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Nur Admins können Bewertungen ablehnen' });
    }

    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      return res.status(404).json({ error: 'Bewertung nicht gefunden' });
    }

    if (review.status !== 'pending') {
      return res.status(400).json({ error: 'Bewertung wurde bereits bearbeitet' });
    }

    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        status: 'rejected',
      },
    });

    res.json({
      id: updatedReview.id,
      status: updatedReview.status,
      message: 'Bewertung erfolgreich abgelehnt',
    });
  } catch (error) {
    console.error('Fehler bei der Ablehnung der Bewertung:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

// Tüm pending yorumları getir (admin için)
export const getPendingReviews = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Nur Admins können alle ausstehenden Bewertungen sehen' });
    }

    const reviews = await prisma.review.findMany({
      where: {
        status: 'pending',
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            translations: {
              where: { language: 'de' },
              select: { name: true },
            },
          },
        },
        order: {
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ reviews });
  } catch (error) {
    console.error('Fehler beim Abrufen der ausstehenden Bewertungen:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

// Öne çıkan yorumları getir (anasayfa için) - sadece 5 yıldızlı ve onaylanmış yorumlar
export const getFeaturedReviews = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 6; // Varsayılan 6 yorum

    const reviews: any[] = await prisma.review.findMany({
      where: {
        status: 'published',
        rating: { gte: 4 }, // 4 ve 5 yıldızlı yorumlar
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            translations: {
              where: { language: 'de' },
              select: { name: true },
            },
          },
        },
        order: {
          select: {
            id: true,
            items: {
              select: {
                productId: true,
                product: {
                  select: {
                    translations: {
                      where: { language: 'de' },
                      select: { name: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    // Format response
    const formattedReviews = reviews.map(review => ({
      id: review.id,
      user: {
        name: review.user.name || review.user.email?.split('@')[0] || 'Anonym',
        avatar: null,
      },
      rating: review.rating,
      comment: review.comment,
      productName: review.product?.translations?.[0]?.name || 'Unbekanntes Produkt',
      productId: review.product?.id,
      orderedProducts: review.order?.items?.map((item: any) => ({
        id: item.productId,
        name: item.product?.translations?.[0]?.name || 'Unbekanntes Produkt',
      })) || [],
      createdAt: review.createdAt,
    }));

    res.json({ reviews: formattedReviews });
  } catch (error) {
    console.error('Fehler beim Abrufen der vorgestellten Bewertungen:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

// Sipariş bazlı yorum oluşturma
export const createOrderReview = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId, rating, comment } = req.body as OrderReviewInput;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    // Validasyon
    if (!orderId || !rating || !comment) {
      return res.status(400).json({ error: 'Alle Felder sind erforderlich' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Bewertung muss zwischen 1 und 5 liegen' });
    }

    if (comment.length > 500) {
      return res.status(400).json({ error: 'Kommentar darf maximal 500 Zeichen haben' });
    }

    // Sipariş kontrolü - kullanıcının siparişi mi?
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: userId,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                translations: {
                  where: { language: 'de' },
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Bestellung nicht gefunden' });
    }

    // Sipariş durumu kontrolü - sadece teslim edilmiş siparişler
    if (order.status !== OrderStatus.DELIVERED) {
      return res.status(403).json({ error: 'Nur für gelieferte Bestellungen möglich' });
    }

    // Daha önce bu sipariş için yorum yapılmış mı?
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_orderId: {
          userId: userId,
          orderId: orderId,
        },
      },
    });

    if (existingReview) {
      return res.status(409).json({ error: 'Sie haben diese Bestellung bereits bewertet' });
    }

    // Sipariş bazlı yorum oluştur (productId olmadan)
    const review = await prisma.review.create({
      data: {
        userId,
        orderId,
        rating,
        comment,
        status: 'pending',
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        order: {
          include: {
            items: {
              include: {
                product: {
                  select: {
                    translations: {
                      where: { language: 'de' },
                      select: { name: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    res.status(201).json({
      id: review.id,
      status: review.status,
      createdAt: review.createdAt,
      message: 'Bewertung erfolgreich erstellt und wartet auf Genehmigung',
    });
  } catch (error) {
    console.error('Fehler beim Erstellen der Bestellungsbewertung:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

// Sipariş yorum durumu kontrolü
export const getOrderReviewStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    if (!orderId || isNaN(parseInt(orderId))) {
      return res.status(400).json({ error: 'Ungültige Bestellungs-ID' });
    }

    // Sipariş kontrolü
    const order = await prisma.order.findFirst({
      where: {
        id: parseInt(orderId),
        userId: userId,
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Bestellung nicht gefunden' });
    }

    // Sipariş durumu kontrolü
    const orderStatus = toClientOrderStatus(order.status);
    const canReview = order.status === OrderStatus.DELIVERED;

    // Daha önce yorum yapılmış mı?
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_orderId: {
          userId: userId,
          orderId: parseInt(orderId),
        },
      },
    });

    res.json({
      orderId: parseInt(orderId),
      canReview,
      hasReview: !!existingReview,
      reviewStatus: existingReview?.status || null,
      orderStatus,
      message: canReview 
        ? existingReview 
          ? 'Sie haben diese Bestellung bereits bewertet' 
          : 'Sie können diese Bestellung bewerten'
        : 'Diese Bestellung kann noch nicht bewertet werden',
    });
  } catch (error) {
    console.error('Fehler beim Abrufen des Bewertungsstatus:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};
