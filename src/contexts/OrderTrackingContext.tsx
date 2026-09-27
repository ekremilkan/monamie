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
import { io, type Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import type { Order } from "@/types";
import { buildApiUrl, getApiBaseUrl } from "../lib/api";

type NormalizedStatus =
  | "order_received"
  | "preparing"
  | "on_the_way"
  | "delivered"
  | "cancelled";

const AUTO_DISMISS_MS = 10 * 60 * 1000;
const POLL_INTERVAL_MS = 45_000;

interface StatusMilestones {
  order_received: string | null;
  preparing: string | null;
  on_the_way: string | null;
  delivered: string | null;
}

interface TrackedOrder {
  id: number;
  orderNumber?: string;
  createdAt: string;
  totalPrice: number;
  status: NormalizedStatus;
  lastUpdatedAt: string;
  milestones: StatusMilestones;
  autoDismissAt?: number;
}

interface OrderTrackingContextValue {
  orders: TrackedOrder[];
  activeOrder: TrackedOrder | null;
  trackOrder: (order: Order) => void;
  dismissOrder: (orderId: number) => void;
  refreshOrders: () => Promise<void>;
}

const OrderTrackingContext = createContext<OrderTrackingContextValue | null>(
  null
);

export const normalizeOrderStatus = (status: string): NormalizedStatus => {
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
    case "cancelled":
      return "cancelled";
    default:
      return "order_received";
  }
};

const createInitialMilestones = (
  createdAt: string,
  status: NormalizedStatus
): StatusMilestones => ({
  order_received: createdAt,
  preparing: status === "preparing" || status === "on_the_way" || status === "delivered" ? createdAt : null,
  on_the_way: status === "on_the_way" || status === "delivered" ? createdAt : null,
  delivered: status === "delivered" ? createdAt : null,
});

const decodeUserId = (token: string | null): number | null => {
  if (!token) return null;
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    return typeof payload?.userId === "number" ? payload.userId : null;
  } catch (_error) {
    return null;
  }
};

const shouldAutoDismiss = (status: NormalizedStatus) => status === "delivered";

const mutateMilestones = (
  milestones: StatusMilestones,
  status: NormalizedStatus,
  timestamp: string
): StatusMilestones => {
  const updated: StatusMilestones = { ...milestones };
  switch (status) {
    case "order_received":
      updated.order_received = updated.order_received ?? timestamp;
      break;
    case "preparing":
      updated.preparing = updated.preparing ?? timestamp;
      break;
    case "on_the_way":
      updated.preparing = updated.preparing ?? timestamp;
      updated.on_the_way = updated.on_the_way ?? timestamp;
      break;
    case "delivered":
      updated.preparing = updated.preparing ?? timestamp;
      updated.on_the_way = updated.on_the_way ?? timestamp;
      updated.delivered = updated.delivered ?? timestamp;
      break;
    default:
      break;
  }
  return updated;
};

const orderToTracked = (order: Order): TrackedOrder => {
  const status = normalizeOrderStatus(order.status);
  const createdAt = order.createdAt ?? new Date().toISOString();
  const totalPrice = Number(order.totalPrice);
  return {
    id: order.id,
    orderNumber: (order as any).orderNumber ?? undefined,
    createdAt,
    totalPrice: Number.isNaN(totalPrice) ? 0 : totalPrice,
    status,
    lastUpdatedAt: new Date().toISOString(),
    milestones: createInitialMilestones(createdAt, status),
  };
};

export const OrderTrackingProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { token } = useAuth();
  const [orders, setOrders] = useState<TrackedOrder[]>([]);
  const ordersRef = useRef<TrackedOrder[]>([]);
  const removalTimers = useRef<Map<number, number>>(new Map());
  const socketRef = useRef<Socket | null>(null);
  const pollTimerRef = useRef<number | null>(null);

  const userId = useMemo(() => decodeUserId(token), [token]);

  const cleanupTimer = useCallback((orderId: number) => {
    const handle = removalTimers.current.get(orderId);
    if (handle) {
      clearTimeout(handle);
      removalTimers.current.delete(orderId);
    }
  }, []);

  const scheduleDismiss = useCallback(
    (orderId: number) => {
      cleanupTimer(orderId);
      const handle = window.setTimeout(() => {
        setOrders((prev) => prev.filter((order) => order.id !== orderId));
        removalTimers.current.delete(orderId);
      }, AUTO_DISMISS_MS);
      removalTimers.current.set(orderId, handle);
    },
    [cleanupTimer]
  );

  const applyOrders = useCallback(
    (next: TrackedOrder[] | ((prev: TrackedOrder[]) => TrackedOrder[])) => {
      if (typeof next === "function") {
        setOrders((prev) => {
          const computed = (next as (prev: TrackedOrder[]) => TrackedOrder[])(prev);
          ordersRef.current = computed;
          return computed;
        });
      } else {
        ordersRef.current = next;
        setOrders(next);
      }
    },
    []
  );

  const upsertOrder = useCallback(
    (incoming: TrackedOrder) => {
      applyOrders((prev) => {
        const existingIndex = prev.findIndex((order) => order.id === incoming.id);
        if (existingIndex === -1) {
          return [incoming, ...prev].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
        const copy = [...prev];
        copy[existingIndex] = incoming;
        return copy;
      });
    },
    [applyOrders]
  );

  const handleStatusUpdate = useCallback(
    (payload: { orderId: number; status: string; updatedAt?: string }) => {
      const normalized = normalizeOrderStatus(payload.status);
      const timestamp = payload.updatedAt ?? new Date().toISOString();

      applyOrders((prev) => {
        const index = prev.findIndex((order) => order.id === payload.orderId);
        if (index === -1) {
          // Unknown order, create placeholder
          const fresh: TrackedOrder = {
            id: payload.orderId,
            orderNumber: undefined,
            createdAt: timestamp,
            totalPrice: 0,
            status: normalized,
            lastUpdatedAt: timestamp,
            milestones: mutateMilestones(createInitialMilestones(timestamp, normalized), normalized, timestamp),
          };
          if (shouldAutoDismiss(normalized)) {
            fresh.autoDismissAt = Date.now() + AUTO_DISMISS_MS;
          }
          if (shouldAutoDismiss(normalized)) {
            scheduleDismiss(fresh.id);
          }
          return [fresh, ...prev];
        }

        const current = prev[index];
        if (current.status === normalized) {
          return prev;
        }

        const updated: TrackedOrder = {
          ...current,
          status: normalized,
          lastUpdatedAt: timestamp,
          milestones: mutateMilestones(current.milestones, normalized, timestamp),
        };
        if (shouldAutoDismiss(normalized)) {
          updated.autoDismissAt = Date.now() + AUTO_DISMISS_MS;
          scheduleDismiss(updated.id);
        }

        const next = [...prev];
        next[index] = updated;
        return next;
      });
    },
    [applyOrders, scheduleDismiss]
  );

  const trackOrder = useCallback(
    (order: Order) => {
      const tracked = orderToTracked(order);
      upsertOrder(tracked);
      socketRef.current?.emit("join:order", order.id);
      if (shouldAutoDismiss(tracked.status)) {
        scheduleDismiss(order.id);
      } else {
        cleanupTimer(order.id);
      }
    },
    [cleanupTimer, scheduleDismiss, upsertOrder]
  );

  const dismissOrder = useCallback(
    (orderId: number) => {
      cleanupTimer(orderId);
      applyOrders((prev) => prev.filter((order) => order.id !== orderId));
    },
    [applyOrders, cleanupTimer]
  );

  const refreshOrders = useCallback(async () => {
    if (!token) {
      applyOrders([]);
      return;
    }
    try {
      const response = await fetch(buildApiUrl("/api/orders"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Bestellungen konnten nicht geladen werden.");
      }
      const ordersFromApi = (await response.json()) as Order[];
      const activeOrders = ordersFromApi
        .filter((order) => {
          const status = normalizeOrderStatus(order.status);
          return status !== "delivered" && status !== "cancelled";
        })
        .map(orderToTracked);

      applyOrders((prev) => {
        const merged = [...prev];
        activeOrders.forEach((incoming) => {
          const index = merged.findIndex((order) => order.id === incoming.id);
          if (index === -1) {
            merged.push(incoming);
          } else {
            merged[index] = {
              ...merged[index],
              status: incoming.status,
              milestones: incoming.milestones,
            };
          }
        });
        return merged
          .filter(
            (order) =>
              activeOrders.some((item) => item.id === order.id) ||
              (order.status === "delivered" &&
                order.autoDismissAt &&
                order.autoDismissAt > Date.now())
          )
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      });
    } catch (error) {
      console.error("[order-tracking] Failed to refresh orders", error);
    }
  }, [applyOrders, token]);

  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  useEffect(() => {
    if (!token || !userId) {
      applyOrders([]);
      socketRef.current?.disconnect();
      socketRef.current = null;
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      return;
    }

    const socket = io(getApiBaseUrl(), {
      transports: ["websocket"],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join:user", userId);
      ordersRef.current.forEach((order) => {
        socket.emit("join:order", order.id);
      });
    });

    socket.on("order:status", handleStatusUpdate);

    socket.on("disconnect", () => {
      console.info("[order-tracking] Socket disconnected");
    });

    void refreshOrders();

    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
    }
    pollTimerRef.current = window.setInterval(() => {
      void refreshOrders();
    }, POLL_INTERVAL_MS);

    return () => {
      socket.off("order:status", handleStatusUpdate);
      socket.disconnect();
      socketRef.current = null;
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [handleStatusUpdate, refreshOrders, token, userId, applyOrders]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const payload = event.data;
      if (payload?.type === "ORDER_FOCUS" && payload.orderId) {
        const orderId = Number(payload.orderId);
        if (!Number.isNaN(orderId)) {
          socketRef.current?.emit("join:order", orderId);
          void refreshOrders();
        }
      }
    };

    if (typeof navigator !== "undefined" && navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener("message", handler);
      return () => {
        navigator.serviceWorker.removeEventListener("message", handler);
      };
    }
    return undefined;
  }, [refreshOrders]);

  useEffect(() => {
    return () => {
      removalTimers.current.forEach((timeout) => clearTimeout(timeout));
      removalTimers.current.clear();
    };
  }, []);

  const activeOrder = useMemo(() => {
    const candidates = orders.filter(
      (order) => order.status !== "cancelled" && order.status !== "delivered"
    );
    if (candidates.length === 0) {
      const recentDelivered = orders
        .filter(
          (order) =>
            order.status === "delivered" &&
            order.autoDismissAt &&
            order.autoDismissAt > Date.now()
        )
        .sort(
          (a, b) =>
            (b.autoDismissAt ?? 0) - (a.autoDismissAt ?? 0)
        );
      return recentDelivered[0] ?? null;
    }
    return candidates.sort(
      (a, b) =>
        new Date(b.lastUpdatedAt).getTime() -
        new Date(a.lastUpdatedAt).getTime()
    )[0];
  }, [orders]);

  const value = useMemo<OrderTrackingContextValue>(
    () => ({
      orders,
      activeOrder,
      trackOrder,
      dismissOrder,
      refreshOrders,
    }),
    [activeOrder, dismissOrder, orders, refreshOrders, trackOrder]
  );

  return (
    <OrderTrackingContext.Provider value={value}>
      {children}
    </OrderTrackingContext.Provider>
  );
};

export const useOrderTracking = (): OrderTrackingContextValue => {
  const context = useContext(OrderTrackingContext);
  if (!context) {
    throw new Error(
      "useOrderTracking must be used within an OrderTrackingProvider"
    );
  }
  return context;
};
