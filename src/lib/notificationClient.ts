import { buildApiUrl } from "./api";

const VAPID_CACHE_KEY = "monAmieChicken.vapidPublicKey";
const SUBSCRIPTION_CACHE_KEY = "monAmieChicken.pushSubscribed";

export type SubscriptionPayload = PushSubscriptionJSON & {
  endpoint: string;
  expirationTime: number | null;
};

export const isPushSupported = (): boolean => {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
};

export const getStoredSubscriptionStatus = (): boolean => {
  try {
    return window.localStorage.getItem(SUBSCRIPTION_CACHE_KEY) === "true";
  } catch (_error) {
    return false;
  }
};

export const setStoredSubscriptionStatus = (value: boolean) => {
  try {
    window.localStorage.setItem(SUBSCRIPTION_CACHE_KEY, value ? "true" : "false");
  } catch (_error) {
    // ignore storage errors
  }
};

export const registerServiceWorker = async (): Promise<
  ServiceWorkerRegistration | null
> => {
  if (!isPushSupported()) {
    return null;
  }

  const existing = await navigator.serviceWorker
    .getRegistration("/sw.js")
    .catch(() => null);
  if (existing) {
    return existing;
  }

  try {
    return await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
  } catch (error) {
    console.error("[notifications] SW registration failed", error);
    return null;
  }
};

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const fetchVapidPublicKey = async (): Promise<string | null> => {
  if (!isPushSupported()) {
    return null;
  }

  try {
    const cached = window.localStorage.getItem(VAPID_CACHE_KEY);
    if (cached) {
      return cached;
    }
  } catch (_error) {
    // ignore read errors
  }

  try {
    const response = await fetch(buildApiUrl("/api/notifications/vapid-public-key"));
    if (!response.ok) {
      return null;
    }
    const body = await response.json();
    const key = body?.publicKey;
    if (typeof key === "string") {
      try {
        window.localStorage.setItem(VAPID_CACHE_KEY, key);
      } catch (_error) {
        // ignore
      }
      return key;
    }
    return null;
  } catch (error) {
    console.error("[notifications] Failed to fetch VAPID key", error);
    return null;
  }
};

export const subscribeForPush = async (
  registration: ServiceWorkerRegistration,
  vapidPublicKey: string
): Promise<PushSubscription | null> => {
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as unknown as BufferSource,
    });
    setStoredSubscriptionStatus(true);
    return subscription;
  } catch (error) {
    console.warn("[notifications] Failed to subscribe for push", error);
    setStoredSubscriptionStatus(false);
    return null;
  }
};

export const getActiveSubscription = async (
  registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> => {
  try {
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.warn("[notifications] Could not read existing subscription", error);
    return null;
  }
};

export const unsubscribeFromPush = async (
  registration: ServiceWorkerRegistration
): Promise<boolean> => {
  try {
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      const success = await subscription.unsubscribe();
      if (success) {
        setStoredSubscriptionStatus(false);
      }
      return success;
    }
    setStoredSubscriptionStatus(false);
    return true;
  } catch (error) {
    console.warn("[notifications] Failed to unsubscribe", error);
    return false;
  }
};

export const serializeSubscription = (
  subscription: PushSubscription
): SubscriptionPayload => {
  const json = subscription.toJSON();
  return {
    ...json,
    endpoint: subscription.endpoint,
    expirationTime: subscription.expirationTime ?? null,
  };
};
