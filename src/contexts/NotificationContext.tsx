import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { buildApiUrl } from "@/lib/api";
import {
    fetchVapidPublicKey,
    getActiveSubscription,
    getStoredSubscriptionStatus,
    isPushSupported,
    registerServiceWorker,
    serializeSubscription,
    setStoredSubscriptionStatus,
    subscribeForPush,
    unsubscribeFromPush,
  } from "@/lib/notificationClient";

type PermissionState = NotificationPermission | "unsupported";

interface NotificationContextValue {
  isSupported: boolean;
  permission: PermissionState;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  requestPermission: () => Promise<NotificationPermission>;
  shouldShowPrompt: boolean;
  shouldShowDeniedReminder: boolean;
  snoozePrompt: (hours?: number) => void;
  snoozeDeniedReminder: (hours?: number) => void;
  resetPrompt: () => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined
);

const PROMPT_STATE_KEY = "monAmieChicken.notificationPromptState";
const DEFAULT_PROMPT_COOLDOWN_HOURS = 6;
const DEFAULT_DENIED_REMINDER_HOURS = 24;

type PromptState = {
  promptDismissedUntil: number;
  deniedReminderUntil: number;
};

const readPromptState = (): PromptState => {
  if (typeof window === "undefined") {
    return { promptDismissedUntil: 0, deniedReminderUntil: 0 };
  }
  try {
    const stored = window.localStorage.getItem(PROMPT_STATE_KEY);
    if (!stored) {
      return { promptDismissedUntil: 0, deniedReminderUntil: 0 };
    }
    const parsed = JSON.parse(stored) as PromptState;
    return {
      promptDismissedUntil: parsed.promptDismissedUntil ?? 0,
      deniedReminderUntil: parsed.deniedReminderUntil ?? 0,
    };
  } catch (_error) {
    return { promptDismissedUntil: 0, deniedReminderUntil: 0 };
  }
};

const storePromptState = (state: PromptState) => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(PROMPT_STATE_KEY, JSON.stringify(state));
  } catch (_error) {
    // ignore storage failures
  }
};

const detectPlatform = (): string => {
  if (typeof navigator === "undefined") {
    return "unknown";
  }
  const userAgent = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/.test(userAgent)) {
    return "ios";
  }
  if (/Android/.test(userAgent)) {
    return "android";
  }
  return "web";
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { token } = useAuth();
  const [permission, setPermission] = useState<PermissionState>(() => {
    if (!isPushSupported()) {
      return "unsupported";
    }
    return Notification.permission;
  });
  const [isSubscribed, setIsSubscribed] = useState<boolean>(() =>
    isPushSupported() ? getStoredSubscriptionStatus() : false
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promptState, setPromptState] = useState<PromptState>(() =>
    readPromptState()
  );

  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const ensureRegistration = useCallback(async () => {
    if (!isPushSupported()) {
      return null;
    }
    if (registrationRef.current) {
      return registrationRef.current;
    }

    try {
      const ready = await navigator.serviceWorker.ready;
      if (ready) {
        registrationRef.current = ready;
        return ready;
      }
    } catch (_error) {
      // ignore and attempt manual registration below
    }

    const registration = await registerServiceWorker();
    if (!registration) {
      return null;
    }

    try {
      const ready = await navigator.serviceWorker.ready;
      registrationRef.current = ready ?? registration;
      return registrationRef.current;
    } catch (_error) {
      registrationRef.current = registration;
      return registration;
    }
  }, []);

  const updatePromptState = useCallback((updater: (state: PromptState) => PromptState) => {
    setPromptState((prev) => {
      const updated = updater(prev);
      storePromptState(updated);
      return updated;
    });
  }, []);

  const snoozePrompt = useCallback(
    (hours = DEFAULT_PROMPT_COOLDOWN_HOURS) => {
      const until = Date.now() + hours * 60 * 60 * 1000;
      updatePromptState((state) => ({
        ...state,
        promptDismissedUntil: Math.max(state.promptDismissedUntil, until),
      }));
    },
    [updatePromptState]
  );

  const snoozeDeniedReminder = useCallback(
    (hours = DEFAULT_DENIED_REMINDER_HOURS) => {
      const until = Date.now() + hours * 60 * 60 * 1000;
      updatePromptState((state) => ({
        ...state,
        deniedReminderUntil: Math.max(state.deniedReminderUntil, until),
      }));
    },
    [updatePromptState]
  );

  const resetPrompt = useCallback(() => {
    updatePromptState(() => ({ promptDismissedUntil: 0, deniedReminderUntil: 0 }));
  }, [updatePromptState]);

  const syncSubscriptionToServer = useCallback(
    async (subscription: PushSubscription) => {
      if (!token) {
        return;
      }
      try {
        const payload = serializeSubscription(subscription);
        const response = await fetch(buildApiUrl("/api/notifications/subscribe"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            subscription: payload,
            platform: detectPlatform(),
            locale: navigator.language,
          }),
        });
        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || "Subscription konnte nicht gespeichert werden.");
        }
        setIsSubscribed(true);
        setStoredSubscriptionStatus(true);
        setError(null);
      } catch (err) {
        console.error("[notifications] Failed to sync subscription", err);
        setError(
          err instanceof Error
            ? err.message
            : "Push-Benachrichtigungen konnten nicht aktiviert werden."
        );
        throw err;
      }
    },
    [token]
  );

  const requestPermission = useCallback(async () => {
    if (!isPushSupported()) {
      setPermission("unsupported");
      return "denied";
    }
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "denied") {
        snoozeDeniedReminder();
      }
      return result;
    } catch (error) {
      console.error("[notifications] Permission request failed", error);
      setPermission(Notification.permission);
      return Notification.permission;
    }
  }, [snoozeDeniedReminder]);

  const subscribe = useCallback(async () => {
    if (!isPushSupported()) {
      setPermission("unsupported");
      setError("Push-Benachrichtigungen werden von diesem Gerät nicht unterstützt.");
      return;
    }
    if (!token) {
      setError("Bitte melde dich an, um Benachrichtigungen zu aktivieren.");
      return;
    }

    setIsLoading(true);
    try {
      let permissionState = Notification.permission;
      if (permissionState === "default") {
        permissionState = await requestPermission();
      }

      setPermission(permissionState);
      if (permissionState !== "granted") {
        throw new Error(
          "Ohne Berechtigung können keine Push-Benachrichtigungen gesendet werden."
        );
      }

      const registration = await ensureRegistration();
      if (!registration) {
        throw new Error("Service Worker konnte nicht registriert werden.");
      }

      let subscription = await getActiveSubscription(registration);
      if (!subscription) {
        const vapidPublicKey = await fetchVapidPublicKey();
        if (!vapidPublicKey) {
          throw new Error(
            "VAPID-Schlüssel ist nicht konfiguriert. Bitte später erneut versuchen."
          );
        }
        subscription = await subscribeForPush(registration, vapidPublicKey);
      }

      if (!subscription) {
        throw new Error("Push-Subscription konnte nicht erstellt werden.");
      }

      await syncSubscriptionToServer(subscription);
    } catch (err) {
      console.error("[notifications] subscribe() failed", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Push-Benachrichtigungen konnten nicht aktiviert werden.");
      }
      setIsSubscribed(false);
      setStoredSubscriptionStatus(false);
    } finally {
      setIsLoading(false);
    }
  }, [ensureRegistration, requestPermission, syncSubscriptionToServer, token]);

  const unsubscribe = useCallback(async () => {
    const registration = await ensureRegistration();
    if (!registration) return;
    const subscription = await getActiveSubscription(registration);
    if (!subscription) {
      setIsSubscribed(false);
      setStoredSubscriptionStatus(false);
      return;
    }

    setIsLoading(true);
    try {
      const endpoint = subscription.endpoint;
      const success = await unsubscribeFromPush(registration);
      if (!success) {
        throw new Error("Abmeldung von Push-Benachrichtigungen fehlgeschlagen.");
      }

      if (token) {
        await fetch(buildApiUrl("/api/notifications/subscribe"), {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ endpoint }),
        }).catch((error) => {
          console.warn("[notifications] Server unsubscribe failed", error);
        });
      }

      setIsSubscribed(false);
      setStoredSubscriptionStatus(false);
    } catch (error) {
      console.error("[notifications] unsubscribe() failed", error);
    } finally {
      setIsLoading(false);
    }
  }, [ensureRegistration, token]);

  const ensureSubscriptionIfPossible = useCallback(async () => {
    if (!isPushSupported()) {
      return;
    }
    const registration = await ensureRegistration();
    if (!registration) {
      return;
    }
    const currentPermission = Notification.permission;
    setPermission(currentPermission);
    const existing = await getActiveSubscription(registration);
    if (existing) {
      setIsSubscribed(true);
      setStoredSubscriptionStatus(true);
      if (token) {
        await syncSubscriptionToServer(existing).catch(() => {
          // handled in sync
        });
      }
      return;
    }
    setIsSubscribed(false);
    setStoredSubscriptionStatus(false);
    if (currentPermission === "granted" && token) {
      const vapidPublicKey = await fetchVapidPublicKey();
      if (!vapidPublicKey) {
        return;
      }
      const newSubscription = await subscribeForPush(registration, vapidPublicKey);
      if (newSubscription) {
        await syncSubscriptionToServer(newSubscription).catch(() => undefined);
      }
    }
  }, [ensureRegistration, syncSubscriptionToServer, token]);

  useEffect(() => {
    if (!isPushSupported()) {
      setPermission("unsupported");
      return;
    }
    let isMounted = true;
    ensureRegistration()
      .then(() => {
        if (isMounted) {
          void ensureSubscriptionIfPossible();
        }
      })
      .catch((error) => {
        console.error("[notifications] Initial registration failed", error);
      });
    return () => {
      isMounted = false;
    };
  }, [ensureRegistration, ensureSubscriptionIfPossible]);

  useEffect(() => {
    if (!isPushSupported()) {
      return;
    }
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "PUSH_SUBSCRIPTION_EXPIRED") {
        setIsSubscribed(false);
        setStoredSubscriptionStatus(false);
        if (Notification.permission === "granted" && token) {
          void ensureSubscriptionIfPossible();
        }
      }
    };
    navigator.serviceWorker.addEventListener("message", handler);
    return () => {
      navigator.serviceWorker.removeEventListener("message", handler);
    };
  }, [ensureSubscriptionIfPossible, token]);

  useEffect(() => {
    if (token) {
      void ensureSubscriptionIfPossible();
    }
  }, [token, ensureSubscriptionIfPossible]);

  const now = Date.now();
  const shouldShowPrompt =
    permission === "default" && now > promptState.promptDismissedUntil;
  const shouldShowDeniedReminder =
    permission === "denied" && now > promptState.deniedReminderUntil;
  const isSupported = permission !== "unsupported";

  const value = useMemo<NotificationContextValue>(
    () => ({
      isSupported,
      permission,
      isSubscribed,
      isLoading,
      error,
      subscribe,
      unsubscribe,
      requestPermission,
      shouldShowPrompt,
      shouldShowDeniedReminder,
      snoozePrompt,
      snoozeDeniedReminder,
      resetPrompt,
    }),
    [
      error,
      isLoading,
      isSubscribed,
      isSupported,
      permission,
      requestPermission,
      resetPrompt,
      shouldShowDeniedReminder,
      shouldShowPrompt,
      snoozeDeniedReminder,
      snoozePrompt,
      subscribe,
      unsubscribe,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextValue => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};
