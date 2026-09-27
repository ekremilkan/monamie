import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { broadcastOrderStatus } from '../realtime/socket';
import { sendOrderStatusNotification } from '../services/pushNotificationService';
import { OrderStatus } from '../../generated/prisma/client';

const ALLOWED_STATUSES = ['preparing', 'order_received', 'on_the_way', 'delivered', 'cancelled'] as const;
const ALLOWED_STATUS_MESSAGE = ALLOWED_STATUSES.join(', ');

type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

const mapClientStatusToEnum = (status: AllowedStatus): OrderStatus => {
  switch (status) {
    case 'preparing':
      return OrderStatus.PREPARING;
    case 'order_received':
      return OrderStatus.ORDER_RECEIVED;
    case 'on_the_way':
      return OrderStatus.ON_THE_WAY;
    case 'delivered':
      return OrderStatus.DELIVERED;
    case 'cancelled':
      return OrderStatus.CANCELLED;
    default:
      return OrderStatus.ORDER_RECEIVED;
  }
};

const mapEnumStatusToClient = (status: OrderStatus): AllowedStatus => {
  switch (status) {
    case OrderStatus.PREPARING:
      return 'preparing';
    case OrderStatus.ORDER_RECEIVED:
      return 'order_received';
    case OrderStatus.ON_THE_WAY:
      return 'on_the_way';
    case OrderStatus.DELIVERED:
      return 'delivered';
    case OrderStatus.CANCELLED:
      return 'cancelled';
    default:
      return 'order_received';
  }
};

/**
 * Admin: Bestellstatus aktualisieren
 * PUT /api/admin/orders/:orderId/status
 */
export const updateOrderStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orderIdParam = req.params.orderId;
    const { status } = req.body as { status?: AllowedStatus };

    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const role = (req.user as { role?: string } | undefined)?.role;
    const adminEmail = process.env.ADMIN_EMAIL;
    const isAdmin = role === 'admin' || (adminEmail && req.user.email === adminEmail);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Nur Admins können den Bestellstatus ändern' });
    }

    if (!orderIdParam || isNaN(parseInt(orderIdParam))) {
      return res.status(400).json({ error: 'Ungültige Bestell-ID' });
    }

    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Ungültiger Status. Erlaubt: ${ALLOWED_STATUS_MESSAGE}` });
    }

    const orderId = parseInt(orderIdParam);
    const nextStatus = mapClientStatusToEnum(status);

    const existing = await prisma.order.findUnique({ where: { id: orderId } });
    if (!existing) {
      return res.status(404).json({ error: 'Bestellung nicht gefunden' });
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: nextStatus,
        deliveredAt: nextStatus === OrderStatus.DELIVERED ? new Date() : null,
      },
    });

    const normalizedStatus = mapEnumStatusToClient(updated.status);

    broadcastOrderStatus({
      id: updated.id,
      status: normalizedStatus,
      userId: updated.userId,
      updatedAt: new Date().toISOString(),
    });

    sendOrderStatusNotification(updated.userId, {
      orderId: updated.id,
      status: normalizedStatus,
      message: 'Status aktualisiert',
    }).catch((error) => {
      console.error('[push] Failed to deliver order status notification', error);
    });

    return res.json({
      order: { ...updated, status: normalizedStatus },
      message: 'Bestellstatus erfolgreich aktualisiert',
    });
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Bestellstatus:', error);
    return res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

export const getAllOrders = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const role = (req.user as { role?: string } | undefined)?.role;
    const adminEmail = process.env.ADMIN_EMAIL;
    const isAdmin = role === 'admin' || (adminEmail && req.user.email === adminEmail);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Nur Admins können alle Bestellungen sehen' });
    }

    // Query-Parameter
    const { userId, status, dateFrom, dateTo, page = '1', pageSize = '20' } = req.query as {
      userId?: string;
      status?: string;
      dateFrom?: string;
      dateTo?: string;
      page?: string;
      pageSize?: string;
    };

    // Validierung
    let userIdNumber: number | undefined = undefined;
    if (userId !== undefined) {
      const parsed = parseInt(userId, 10);
      if (isNaN(parsed)) {
        return res.status(400).json({ error: 'Ungültige userId; Zahl erwartet' });
      }
      userIdNumber = parsed;
    }

    let statusFilter: AllowedStatus | undefined = undefined;
    let statusEnum: OrderStatus | undefined = undefined;
    if (status !== undefined) {
      if (!ALLOWED_STATUSES.includes(status as AllowedStatus)) {
        return res.status(400).json({ error: `Ungültiger Status. Erlaubt: ${ALLOWED_STATUS_MESSAGE}` });
      }
      statusFilter = status as AllowedStatus;
      statusEnum = mapClientStatusToEnum(statusFilter);
    }

    let fromDate: Date | undefined = undefined;
    if (dateFrom !== undefined) {
      const d = new Date(dateFrom);
      if (isNaN(d.getTime())) {
        return res.status(400).json({ error: 'Ungültiges Datumsformat für dateFrom. Erwartet ISO (YYYY-MM-DD oder ISO 8601).' });
      }
      // Start des Tages
      fromDate = new Date(d);
      fromDate.setHours(0, 0, 0, 0);
    }

    let toDate: Date | undefined = undefined;
    if (dateTo !== undefined) {
      const d = new Date(dateTo);
      if (isNaN(d.getTime())) {
        return res.status(400).json({ error: 'Ungültiges Datumsformat für dateTo. Erwartet ISO (YYYY-MM-DD oder ISO 8601).' });
      }
      // Ende des Tages
      toDate = new Date(d);
      toDate.setHours(23, 59, 59, 999);
    }

    const pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum <= 0) {
      return res.status(400).json({ error: 'page muss eine positive Zahl sein' });
    }

    const pageSizeNum = parseInt(pageSize, 10);
    if (isNaN(pageSizeNum) || pageSizeNum <= 0 || pageSizeNum > 100) {
      return res.status(400).json({ error: 'pageSize muss eine Zahl zwischen 1 und 100 sein' });
    }

    // Dynamische Where-Bedingungen
    const where: any = {};
    if (userIdNumber !== undefined) where.userId = userIdNumber;
    if (statusEnum !== undefined) where.status = statusEnum;
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = fromDate;
      if (toDate) where.createdAt.lte = toDate;
    }

    const total = await prisma.order.count({ where });

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * pageSizeNum,
      take: pageSizeNum,
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: {
              include: {
                translations: {
                  where: { language: 'de' },
                  select: { name: true, description: true },
                },
              },
            },
          },
        },
      },
    });

    const totalPages = Math.ceil(total / pageSizeNum) || 1;

    const normalizedOrders = orders.map((order) => ({
      ...order,
      status: mapEnumStatusToClient(order.status),
    }));

    return res.json({
      orders: normalizedOrders,
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        total,
        totalPages,
      },
      filters: {
        userId: userIdNumber,
        status: statusFilter,
        dateFrom: dateFrom,
        dateTo: dateTo,
      },
    });
  } catch (error) {
    console.error('Fehler beim Abrufen aller Bestellungen:', error);
    return res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

export const getAllReviews = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const role = (req.user as { role?: string } | undefined)?.role;
    const adminEmail = process.env.ADMIN_EMAIL;
    const isAdmin = role === 'admin' || (adminEmail && req.user.email === adminEmail);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Nur Admins können Bewertungen verwalten' });
    }

    const {
      status,
      productId,
      userId,
      dateFrom,
      dateTo,
      ratingMin,
      ratingMax,
      page = '1',
      pageSize = '20',
    } = req.query as {
      status?: string;
      productId?: string;
      userId?: string;
      dateFrom?: string;
      dateTo?: string;
      ratingMin?: string;
      ratingMax?: string;
      page?: string;
      pageSize?: string;
    };

    const ALLOWED_REVIEW_STATUS = ['pending', 'published', 'rejected'] as const;
    type AllowedReviewStatus = typeof ALLOWED_REVIEW_STATUS[number];

    let where: any = {};

    if (status) {
      if (!ALLOWED_REVIEW_STATUS.includes(status as AllowedReviewStatus)) {
        return res.status(400).json({ error: 'Ungültiger Bewertungsstatus. Erlaubt: pending, published, rejected' });
      }
      where.status = status as AllowedReviewStatus;
    }

    if (productId !== undefined) {
      const pid = parseInt(productId, 10);
      if (isNaN(pid)) {
        return res.status(400).json({ error: 'Ungültige Produkt-ID' });
      }
      where.productId = pid;
    }

    if (userId !== undefined) {
      const uid = parseInt(userId, 10);
      if (isNaN(uid)) {
        return res.status(400).json({ error: 'Ungültige Benutzer-ID' });
      }
      where.userId = uid;
    }

    let fromDate: Date | undefined = undefined;
    if (dateFrom !== undefined) {
      const d = new Date(dateFrom);
      if (isNaN(d.getTime())) {
        return res.status(400).json({ error: 'Ungültiges Datumsformat für dateFrom. Erwartet ISO (YYYY-MM-DD oder ISO 8601).' });
      }
      fromDate = new Date(d);
      fromDate.setHours(0, 0, 0, 0);
    }

    let toDate: Date | undefined = undefined;
    if (dateTo !== undefined) {
      const d = new Date(dateTo);
      if (isNaN(d.getTime())) {
        return res.status(400).json({ error: 'Ungültiges Datumsformat für dateTo. Erwartet ISO (YYYY-MM-DD oder ISO 8601).' });
      }
      toDate = new Date(d);
      toDate.setHours(23, 59, 59, 999);
    }

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = fromDate;
      if (toDate) where.createdAt.lte = toDate;
    }

    if (ratingMin !== undefined) {
      const rmin = parseInt(ratingMin, 10);
      if (isNaN(rmin) || rmin < 1 || rmin > 5) {
        return res.status(400).json({ error: 'ratingMin muss zwischen 1 und 5 liegen' });
      }
      where.rating = { ...(where.rating || {}), gte: rmin };
    }

    if (ratingMax !== undefined) {
      const rmax = parseInt(ratingMax, 10);
      if (isNaN(rmax) || rmax < 1 || rmax > 5) {
        return res.status(400).json({ error: 'ratingMax muss zwischen 1 und 5 liegen' });
      }
      where.rating = { ...(where.rating || {}), lte: rmax };
    }

    const pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum <= 0) {
      return res.status(400).json({ error: 'page muss eine positive Zahl sein' });
    }

    const pageSizeNum = parseInt(pageSize, 10);
    if (isNaN(pageSizeNum) || pageSizeNum <= 0 || pageSizeNum > 100) {
      return res.status(400).json({ error: 'pageSize muss eine Zahl zwischen 1 und 100 sein' });
    }

    const total = await prisma.review.count({ where });

    const reviews = await prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * pageSizeNum,
      take: pageSizeNum,
      include: {
        user: { select: { id: true, name: true, email: true } },
        product: {
          select: {
            id: true,
            translations: {
              where: { language: 'de' },
              select: { name: true },
            },
          },
        },
        order: { select: { id: true, createdAt: true } },
      },
    });

    const totalPages = Math.ceil(total / pageSizeNum) || 1;

    return res.json({
      reviews,
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        total,
        totalPages,
      },
      filters: {
        status: where.status || undefined,
        productId: productId ? parseInt(productId, 10) : undefined,
        userId: userId ? parseInt(userId, 10) : undefined,
        dateFrom,
        dateTo,
        ratingMin: ratingMin ? parseInt(ratingMin, 10) : undefined,
        ratingMax: ratingMax ? parseInt(ratingMax, 10) : undefined,
      },
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Bewertungen:', error);
    return res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

export const approveReview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const role = (req.user as { role?: string } | undefined)?.role;
    const adminEmail = process.env.ADMIN_EMAIL;
    const isAdmin = role === 'admin' || (adminEmail && req.user.email === adminEmail);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Nur Admins können Bewertungen genehmigen' });
    }

    const { id } = req.params;
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return res.status(404).json({ error: 'Bewertung nicht gefunden' });
    }

    if (review.status !== 'pending') {
      return res.status(400).json({ error: 'Bewertung wurde bereits bearbeitet' });
    }

    const updatedReview = await prisma.review.update({
      where: { id },
      data: { status: 'published', approvedAt: new Date() },
    });

    return res.json({
      id: updatedReview.id,
      status: updatedReview.status,
      approvedAt: updatedReview.approvedAt,
      message: 'Bewertung erfolgreich genehmigt',
    });
  } catch (error) {
    console.error('Fehler bei der Genehmigung der Bewertung:', error);
    return res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

export const rejectReview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const role = (req.user as { role?: string } | undefined)?.role;
    const adminEmail = process.env.ADMIN_EMAIL;
    const isAdmin = role === 'admin' || (adminEmail && req.user.email === adminEmail);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Nur Admins können Bewertungen ablehnen' });
    }

    const { id } = req.params;
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return res.status(404).json({ error: 'Bewertung nicht gefunden' });
    }

    if (review.status !== 'pending') {
      return res.status(400).json({ error: 'Bewertung wurde bereits bearbeitet' });
    }

    const updatedReview = await prisma.review.update({
      where: { id },
      data: { status: 'rejected' },
    });

    return res.json({
      id: updatedReview.id,
      status: updatedReview.status,
      message: 'Bewertung erfolgreich abgelehnt',
    });
  } catch (error) {
    console.error('Fehler bei der Ablehnung der Bewertung:', error);
    return res.status(500).json({ error: 'Interner Serverfehler' });
  }
};
