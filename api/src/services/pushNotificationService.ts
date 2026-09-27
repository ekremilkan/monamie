import webPush, { PushSubscription } from "web-push";
import prisma from "../lib/prisma";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT =
  process.env.WEB_PUSH_SUBJECT || "mailto:notifications@monamiechicken.de";

let isConfigured = false;

const ensureConfigured = (): boolean => {
  if (isConfigured) {
    return true;
  }

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn(
      "[push] VAPID keys are not set. Push notifications will not work."
    );
    return false;
  }

  webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  isConfigured = true;
  return true;
};

export const getVapidPublicKey = (): string | null => {
  return VAPID_PUBLIC_KEY ?? null;
};

type SubscriptionPayload = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  expirationTime?: number | null;
};

export const upsertSubscription = async (
  userId: number | undefined,
  subscription: SubscriptionPayload,
  meta: {
    userAgent?: string;
    platform?: string;
    locale?: string;
  } = {}
) => {
  if (!subscription?.endpoint || !subscription?.keys) {
    throw new Error("Ungültige Subscription-Daten");
  }

  await prisma.pushSubscription.upsert({
    where: {
      endpoint: subscription.endpoint,
    },
    update: {
      keys: subscription.keys,
      expirationTime: subscription.expirationTime
        ? new Date(subscription.expirationTime)
        : null,
      userId: userId ?? null,
      userAgent: meta.userAgent ?? null,
      platform: meta.platform ?? null,
      locale: meta.locale ?? null,
    },
    create: {
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      expirationTime: subscription.expirationTime
        ? new Date(subscription.expirationTime)
        : null,
      userId: userId ?? null,
      userAgent: meta.userAgent ?? null,
      platform: meta.platform ?? null,
      locale: meta.locale ?? "de-DE",
    },
  });
};

export const removeSubscription = async (endpoint: string, userId?: number) => {
  if (!endpoint) {
    return;
  }

  try {
    await prisma.pushSubscription.delete({
      where: {
        endpoint,
      },
    });
  } catch (error: any) {
    if (error?.code === "P2025") {
      // Already removed
      return;
    }
    throw error;
  }

  if (userId) {
    await prisma.pushSubscription.deleteMany({
      where: {
        userId,
        endpoint,
      },
    });
  }
};

const sendToSubscription = async (
  storedSubscription: {
    endpoint: string;
    keys: any;
  },
  payload: Record<string, unknown>
) => {
  if (!ensureConfigured()) {
    return;
  }

  const pushSubscription: PushSubscription = {
    endpoint: storedSubscription.endpoint,
    keys: storedSubscription.keys,
  };

  try {
    await webPush.sendNotification(pushSubscription, JSON.stringify(payload));
  } catch (error: any) {
    const status = error?.statusCode;
    if (status === 404 || status === 410) {
      console.info(
        "[push] Subscription expired or is gone. Cleaning up.",
        storedSubscription.endpoint,
        status,
        error.body ?? error.message
      );
      await prisma.pushSubscription.deleteMany({
        where: { endpoint: storedSubscription.endpoint },
      });
      return;
    }
    console.error("[push] Failed to send notification:", error);
  }
};

type OrderStatusPayload = {
  orderId: number;
  status: string;
  message: string;
  locale?: string;
  progress?: number;
};

const ORDER_STATUS_TRANSLATIONS: Record<
  string,
  { title: string; body: string; progress: number }
> = {
  order_received: {
    title: "Bestellung erhalten",
    body: "Wir haben deine Bestellung erhalten und beginnen bald mit der Zubereitung.",
    progress: 0.25,
  },
  preparing: {
    title: "Wir bereiten deine Bestellung vor",
    body: "Unser Team arbeitet daran, alles frisch und lecker zu machen.",
    progress: 0.5,
  },
  on_the_way: {
    title: "Deine Bestellung ist unterwegs",
    body: "Der Fahrer ist auf dem Weg zu dir. Bitte halte dich bereit.",
    progress: 0.75,
  },
  delivered: {
    title: "Bestellung zugestellt",
    body: "Guten Appetit! Wir hoffen, es schmeckt dir.",
    progress: 1,
  },
};

const normalizeOrderStatus = (
  status: string
): keyof typeof ORDER_STATUS_TRANSLATIONS => {
  switch (status) {
    case "pending_payment":
    case "order_received":
      return "order_received";
    case "processing":
    case "preparing":
      return "preparing";
    case "shipped":
    case "on_the_way":
      return "on_the_way";
    case "delivered":
      return "delivered";
    default:
      return "order_received";
  }
};

export const sendOrderStatusNotification = async (
  userId: number,
  payload: OrderStatusPayload
) => {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (!subscriptions.length) {
    return;
  }

  const normalizedStatus = normalizeOrderStatus(payload.status);
  const translation =
    ORDER_STATUS_TRANSLATIONS[normalizedStatus] ??
    ORDER_STATUS_TRANSLATIONS.order_received;

  await Promise.all(
    subscriptions.map((subscription) =>
      sendToSubscription(subscription, {
        type: "order_status",
        orderId: payload.orderId,
        status: normalizedStatus,
        title: translation.title,
        body: translation.body,
        progress: translation.progress,
        timestamp: new Date().toISOString(),
      })
    )
  );
};

export const sendGenericNotificationToUser = async (
  userId: number,
  notification: {
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }
) => {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (!subscriptions.length) {
    return;
  }

  await Promise.all(
    subscriptions.map((subscription) =>
      sendToSubscription(subscription, {
        type: "generic",
        title: notification.title,
        body: notification.body,
        ...notification.data,
        timestamp: new Date().toISOString(),
      })
    )
  );
};
