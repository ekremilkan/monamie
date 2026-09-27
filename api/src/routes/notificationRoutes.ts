import { Router } from "express";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth";
import {
  getVapidPublicKey,
  removeSubscription,
  sendOrderStatusNotification,
  sendGenericNotificationToUser,
  upsertSubscription,
} from "../services/pushNotificationService";

const router = Router();

router.get("/vapid-public-key", (_req, res) => {
  const key = getVapidPublicKey();
  if (!key) {
    return res.status(503).json({
      success: false,
      error:
        "VAPID-Schlüssel ist nicht konfiguriert. Bitte kontaktiere den Support.",
    });
  }

  return res.json({ success: true, publicKey: key });
});

router.post(
  "/subscribe",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    const { subscription, platform, locale } = req.body ?? {};
    if (!subscription) {
      return res
        .status(400)
        .json({ success: false, error: "Subscription-Daten fehlen." });
    }
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Eine Anmeldung ist erforderlich, um Benachrichtigungen zu nutzen.",
      });
    }

    await upsertSubscription(userId, subscription, {
      userAgent: req.headers["user-agent"],
      platform,
      locale,
    });

    return res.status(201).json({ success: true });
  }
);

router.delete(
  "/subscribe",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    const endpoint = req.body?.endpoint;
    const userId = req.user?.userId;
    if (!endpoint || !userId) {
      return res.status(400).json({
        success: false,
        error: "Endpoint und Benutzer müssen angegeben werden.",
      });
    }

    await removeSubscription(endpoint, userId);
    return res.json({ success: true });
  }
);

router.post(
  "/preview",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.userId;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "Nicht authentifiziert." });
    }

    const { title, body, orderId, status } = req.body ?? {};

    if (orderId && status) {
      await sendOrderStatusNotification(userId, {
        orderId,
        status,
        message: body ?? "",
      });
    } else {
      await sendGenericNotificationToUser(userId, {
        title: title ?? "Testbenachrichtigung",
        body: body ?? "So sehen deine Push-Benachrichtigungen aus.",
      });
    }

    return res.json({ success: true });
  }
);

export default router;
