import http from "http";
import express, { Request, Response, NextFunction } from "express";
import cors, { CorsOptions } from "cors";
import prisma from "./lib/prisma"; // Paylaşımlı client'ı import et
import { OrderStatus } from "../generated/prisma/client";
// import bcrypt from "bcrypt"; // OTP sisteminde artık gerekli değil
import jwt from "jsonwebtoken";
import Stripe from "stripe";
import oauthRoutes from "./routes/oauthRoutes";
import authRoutes from "./routes/auth";
import reviewRoutes from "./routes/reviewRoutes"; // Review routes import
import paymentRoutes from "./routes/paymentRoutes";
import {
  authenticateToken as newAuthenticateToken,
  AuthenticatedRequest,
} from "./middleware/auth";
import { securityMiddleware, ipBlocker } from "./middleware/security";
import dotenv from "dotenv";
import {
  updateOrderStatus,
  getAllOrders,
  getAllReviews,
  approveReview as adminApproveReview,
  rejectReview as adminRejectReview,
} from "./controllers/adminController";
import notificationRoutes from "./routes/notificationRoutes";
import adminCategoryRoutes from "./routes/adminCategoryRoutes";
import adminProductRoutes from "./routes/adminProductRoutes";
import { sendOrderStatusNotification } from "./services/pushNotificationService";
import {
  initializeSocketServer,
  broadcastOrderStatus,
} from "./realtime/socket";
import { calculateCheckout } from "./services/checkout";
dotenv.config();

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const mapOrderStatusToClient = (status: OrderStatus | string): string => {
  const normalized = (status ?? "").toString();
  switch (normalized) {
    case OrderStatus.PENDING_PAYMENT:
      return "pending_payment";
    case OrderStatus.ORDER_RECEIVED:
      return "order_received";
    case OrderStatus.PREPARING:
      return "preparing";
    case OrderStatus.ON_THE_WAY:
      return "on_the_way";
    case OrderStatus.DELIVERED:
      return "delivered";
    case OrderStatus.CANCELLED:
      return "cancelled";
    default:
      return normalized.toLowerCase();
  }
};

// CORS - whitelist frontend origin and handle preflight
const defaultAllowedOrigins = [
  "http://localhost:4321",
  "http://127.0.0.1:4321",
  "http://localhost:4322",
  "http://127.0.0.1:4322",
];
const envAllowedOrigins = process.env.FRONTEND_URLS
  ? process.env.FRONTEND_URLS.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  : [];
const allowedOrigins = [
  ...defaultAllowedOrigins,
  ...envAllowedOrigins,
  process.env.FRONTEND_URL?.trim(),
  process.env.FRONTEND_LAN_URL?.trim(),
].filter((origin): origin is string => Boolean(origin));
const allowedOriginsSet = new Set(allowedOrigins);
const allowedOriginsArray = Array.from(allowedOriginsSet);

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOriginsSet.has(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Stripe-Signature"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(securityMiddleware);
app.use(ipBlocker);
app.use("/api/webhooks/stripe", express.raw({ type: "application/json" }));
app.use(express.json());
app.use("/api", paymentRoutes);
app.use("/api/oauth", oauthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin/categories", adminCategoryRoutes);
app.use("/api/admin/products", adminProductRoutes);

const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET!, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// TÜM ÜRÜNLERİ GETİREN ENDPOINT
app.get("/api/products", async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        translations: { where: { language: "de" } },
        category: { include: { translations: { where: { language: "de" } } } },
        // YENİ: Malzemeleri de sorguya dahil et
        ingredients: {
          include: {
            ingredient: true, // Her ilişkinin malzeme detayını da getir
          },
        },
      },
    });
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Produkte konnten nicht abgerufen werden." });
  }
});

// ESKİ KAYIT ENDPOINT'İ - OTP SİSTEMİNE GÜNCELLENDİ
// app.post("/api/register", async (req: Request, res: Response) => {
//   // OTP tabanlı kayıt için /api/auth/register endpoint'ini kullanın
// });

// ESKİ GİRİŞ ENDPOINT'İ - OTP SİSTEMİNE GÜNCELLENDİ
// app.post("/api/login", async (req: Request, res: Response) => {
//   // OTP tabanlı giriş için /api/auth/request-otp ve /api/auth/verify-otp endpoint'lerini kullanın
// });

// YENİ KORUMALI ENDPOINT: GİRİŞ YAPMIŞ KULLANICININ BİLGİLERİNİ GETİRİR
app.get(
  "/api/me",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found in token" });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

// 1. GİRİŞ YAPMIŞ KULLANICININ ADRESLERİNİ GETİR
app.get(
  "/api/addresses",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.sendStatus(401);

      const addresses = await prisma.address.findMany({
        where: {
          userId: userId, // Sadece bu kullanıcıya ait adresleri bul
        },
      });

      res.json(addresses);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

// 2. GİRİŞ YAPMIŞ KULLANICI İÇİN YENİ BİR ADRES EKLE
app.post(
  "/api/addresses",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.sendStatus(401);

      const { street, city, zipCode, details } = req.body;

      // Temel doğrulama
      if (!street || !city || !zipCode) {
        return res
          .status(400)
          .json({ message: "Street, city, and zip code are required" });
      }

      const newAddress = await prisma.address.create({
        data: {
          street,
          city,
          zipCode,
          details,
          userId: userId, // Adresi, token'dan gelen kullanıcı ID'si ile ilişkilendir
        },
      });

      res.status(201).json(newAddress);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

// 3. BELİRLİ BİR ADRESİ SİL
// Not: URL'de ':id' kullanarak dinamik bir parametre alıyoruz.
app.delete(
  "/api/addresses/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.sendStatus(401);

      // URL'den gelen adres ID'sini al ve sayıya çevir
      const addressId = parseInt(req.params.id, 10);

      // GÜVENLİK KONTROLÜ: Kullanıcının, başkasının adresini silmesini engelle
      const address = await prisma.address.findUnique({
        where: { id: addressId },
      });

      if (!address) {
        return res.status(404).json({ message: "Address not found" });
      }

      if (address.userId !== userId) {
        // Eğer adres bu kullanıcıya ait değilse, "Yasaklı" hatası döndür.
        return res.status(403).json({ message: "Forbidden" });
      }

      // Her şey yolundaysa, adresi sil.
      await prisma.address.delete({
        where: { id: addressId },
      });

      res.status(200).json({ message: "Address deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

// YENİ KORUMALI ENDPOINT: GİRİŞ YAPMIŞ KULLANICININ SİPARİŞ GEÇMİŞİNİ GETİRİR
app.get(
  "/api/orders",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.sendStatus(401);

      const orders = await prisma.order.findMany({
        where: {
          userId: userId, // Sadece bu kullanıcıya ait siparişleri bul
          NOT: { status: OrderStatus.PENDING_PAYMENT },
        },
        orderBy: {
          createdAt: "desc", // En yeni siparişleri en üstte göster
        },
        // --- DEĞİŞİLİK BURADA: SORGUMUZU ZENGİNLEŞTİRİYORUZ ---
        include: {
          items: {
            include: {
              product: {
                include: {
                  translations: {
                    where: { language: "de" },
                  },
                  // YENİ: Ürünün olası tüm malzemelerini de getiriyoruz.
                  // Bu sayede frontend, 'selectedIngredientIds' listesindeki ID'lerin
                  // hangi malzemelere karşılık geldiğini bilebilir.
                  ingredients: {
                    include: {
                      ingredient: true, // Her malzemenin 'name', 'price' gibi detaylarını al.
                    },
                  },
                },
              },
            },
          },
        },
      });

      const normalizedOrders = orders.map((order) => ({
        ...order,
        status: mapOrderStatusToClient(order.status),
      }));

      res.json(normalizedOrders);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

// --- KALICI SEPET ENDPOINT'LERİ ---

// 1. GİRİŞ YAPMIŞ KULLANICININ SEPETİNİ GETİR
app.get(
  "/api/cart",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.sendStatus(401);

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { cart: true }, // Sadece 'cart' alanını seçiyoruz
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Eğer kullanıcının kayıtlı bir sepeti yoksa (null), boş bir dizi döndür.
      res.json(user.cart || []);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

// 2. GİRİŞ YAPMIŞ KULLANICININ SEPETİNİ GÜNCELLE/KAYDET
app.post(
  "/api/cart",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.sendStatus(401);

      // Frontend'den gelen sepet dizisinin tamamını body'den alıyoruz.
      const cartItems = req.body;

      await prisma.user.update({
        where: { id: userId },
        data: {
          cart: cartItems, // Gelen sepeti olduğu gibi 'cart' alanına kaydet.
        },
      });

      res.status(200).json({ message: "Cart updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

// --- SİPARİŞİ TAMAMLAMA ENDPOINT'İ ---
app.post(
  "/api/checkout",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    if (!stripe) {
      return res
        .status(503)
        .json({ message: "Payment service is not configured" });
    }

    let pendingOrderId: number | null = null;
    try {
      const userId = req.user?.userId;
      if (!userId) return res.sendStatus(401);

      // 1. Frontend'den gelen sepeti ve seçilen adres ID'sini al
      const { cartItems, addressId } = req.body;

      if (
        !Array.isArray(cartItems) ||
        cartItems.length === 0 ||
        cartItems.length > 50 ||
        !Number.isSafeInteger(addressId) ||
        addressId <= 0
      ) {
        return res
          .status(400)
          .json({ message: "Cart items and address are required." });
      }

      const address = await prisma.address.findFirst({
        where: { id: addressId, userId },
      });
      if (!address) {
        return res.status(404).json({ message: "Address not found" });
      }

      const productIds = cartItems.map((item: unknown) =>
        item && typeof item === "object" ? (item as { id?: unknown }).id : null,
      );
      if (
        !productIds.every(
          (id) => Number.isSafeInteger(id) && (id as number) > 0,
        )
      ) {
        return res.status(400).json({ message: "Invalid cart items" });
      }
      const validProductIds = productIds as number[];

      const productsFromDb = await prisma.product.findMany({
        where: { id: { in: validProductIds } },
        include: {
          ingredients: {
            include: { ingredient: true },
          },
        },
      });

      let checkout;
      try {
        checkout = calculateCheckout(cartItems, productsFromDb);
      } catch {
        return res.status(400).json({ message: "Invalid cart items" });
      }

      const orderItemsData = checkout.lines.map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
        priceAtPurchase: line.unitPriceCents / 100,
        selectedIngredientIds: line.selectedIngredientIds,
      }));
      const calculatedTotalPrice = checkout.totalCents / 100;

      // Simple order number generator
      const generateOrderNumber = (): string => {
        const now = new Date();
        const y = now.getFullYear().toString().slice(-2);
        const m = (now.getMonth() + 1).toString().padStart(2, "0");
        const d = now.getDate().toString().padStart(2, "0");
        const t = now.getTime().toString().slice(-6);
        const r = Math.random().toString(36).toUpperCase().slice(-4);
        return `ORD-${y}${m}${d}-${t}${r}`;
      };

      // 1. Önce veritabanında siparişi "ödeme bekleniyor" durumuyla oluşturuyoruz.
      const newOrder = await prisma.order.create({
        data: {
          userId: userId,
          orderNumber: generateOrderNumber(),
          totalPrice: calculatedTotalPrice,
          status: OrderStatus.PENDING_PAYMENT,
          paymentStatus: "pending",
          paymentMethod: "stripe",
          deliveryStreet: address.street,
          deliveryCity: address.city,
          deliveryZipCode: address.zipCode,
          deliveryDetails: address.details,
          items: {
            create: orderItemsData,
          },
        },
      });
      pendingOrderId = newOrder.id;

      const orderForResponse = await prisma.order.findUnique({
        where: { id: newOrder.id },
        select: {
          id: true,
          status: true,
          createdAt: true,
          totalPrice: true,
          orderNumber: true,
          deliveredAt: true,
        },
      });

      const serializedOrder = orderForResponse
        ? {
            ...orderForResponse,
            status: mapOrderStatusToClient(orderForResponse.status),
            totalPrice: orderForResponse.totalPrice.toString(),
            createdAt: orderForResponse.createdAt.toISOString(),
            deliveredAt: orderForResponse.deliveredAt
              ? orderForResponse.deliveredAt.toISOString()
              : null,
          }
        : null;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: checkout.totalCents,
        currency: "eur",
        metadata: { orderId: newOrder.id.toString() },
      });
      await prisma.order.update({
        where: { id: newOrder.id },
        data: { paymentIntentId: paymentIntent.id },
      });

      res.status(201).json({
        order: serializedOrder,
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error) {
      console.error("Checkout failed:", error);
      if (pendingOrderId !== null) {
        await prisma.order.updateMany({
          where: { id: pendingOrderId, status: OrderStatus.PENDING_PAYMENT },
          data: { status: OrderStatus.CANCELLED, paymentStatus: "failed" },
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

app.get("/api/products/search", async (req: Request, res: Response) => {
  try {
    // 1. URL'den arama sorgusunu ('q') alıyoruz. Örn: ?q=burger
    const query = req.query.q as string;

    if (!query) {
      return res.json([]); // Eğer arama sorgusu boşsa, boş bir dizi döndür.
    }

    // 2. Prisma ile veritabanında arama yapıyoruz.
    const products = await prisma.product.findMany({
      where: {
        // 'OR' ile birden fazla alanda arama yapmasını söylüyoruz.
        OR: [
          {
            // Ürünün çevirilerinden ('ProductTranslation') herhangi birinin 'name' alanı,
            // bizim arama sorgumuzu içeriyor mu diye bak.
            translations: {
              some: {
                name: {
                  contains: query,
                  mode: "insensitive", // Büyük/küçük harf duyarsız
                },
              },
            },
          },
          {
            // Aynı şekilde, açıklama alanında da arama yap.
            translations: {
              some: {
                description: {
                  contains: query,
                  mode: "insensitive",
                },
              },
            },
          },
        ],
      },
      // Arama sonuçlarında da, diğer endpoint'lerde olduğu gibi,
      // tutarlı bir veri yapısı göndermek için 'include' kullanıyoruz.
      include: {
        translations: {
          where: { language: "de" },
        },
        category: {
          include: {
            translations: { where: { language: "de" } },
          },
        },
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
      take: 10, // Arama sonucunu 10 ile sınırlayalım ki çok fazla veri gelmesin.
    });

    res.json(products);
  } catch (error) {
    console.error("Product search failed:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.put(
  "/api/admin/orders/:orderId/status",
  newAuthenticateToken,
  updateOrderStatus,
);

app.get(
  "/api/admin/orders",
  newAuthenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    return getAllOrders(req, res);
  },
);

// Admin: Reviews list (with filters & pagination)
app.get(
  "/api/admin/reviews",
  newAuthenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    return getAllReviews(req, res);
  },
);

// Admin: Approve review
app.patch(
  "/api/admin/reviews/:id/approve",
  newAuthenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    return adminApproveReview(req, res);
  },
);

// Admin: Reject review
app.patch(
  "/api/admin/reviews/:id/reject",
  newAuthenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    return adminRejectReview(req, res);
  },
);

const server = http.createServer(app);
initializeSocketServer(server, { allowedOrigins: allowedOriginsArray });

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Sunucu ${PORT} portunda başarıyla başlatıldı.`);
});
