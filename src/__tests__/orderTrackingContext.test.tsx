import React, { useEffect } from "react";
import { render, waitFor, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { OrderTrackingProvider, useOrderTracking, normalizeOrderStatus } from "../contexts/OrderTrackingContext";
import type { Order } from "../types";

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({ token: "test-token" }),
}));

vi.mock("socket.io-client", () => {
  const mockSocket = {
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
  };
  return {
    io: vi.fn(() => mockSocket),
  };
});

const createOrder = (overrides: Partial<Order>): Order => ({
  id: overrides.id ?? Math.floor(Math.random() * 1000),
  createdAt: overrides.createdAt ?? new Date().toISOString(),
  totalPrice: overrides.totalPrice ?? "19.99",
  paymentMethod: overrides.paymentMethod ?? "card",
  status: overrides.status ?? "order_received",
  items: overrides.items ?? [],
});

const OrderTrackingHarness: React.FC<{ onReady: (value: ReturnType<typeof useOrderTracking>) => void }> = ({ onReady }) => {
  const value = useOrderTracking();
  useEffect(() => {
    onReady(value);
  }, [value, onReady]);
  return null;
};

describe("OrderTrackingProvider", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.useRealTimers();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response);
  });

  afterEach(() => {
    vi.useRealTimers();
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it("normalizes status transitions server -> client", () => {
    const statuses = [
      ["pending_payment", "order_received"],
      ["processing", "preparing"],
      ["shipped", "on_the_way"],
      ["delivered", "delivered"],
      ["unknown", "order_received"],
    ] as const;

    statuses.forEach(([input, expected]) => {
      expect(normalizeOrderStatus(input)).toBe(expected);
    });
  });

  it("tracks orders and normalizes pending status to order_received", async () => {
    let context: ReturnType<typeof useOrderTracking> | null = null;

    render(
      <OrderTrackingProvider>
        <OrderTrackingHarness onReady={(value) => (context = value)} />
      </OrderTrackingProvider>
    );

    await waitFor(() => expect(context).not.toBeNull());
    const order = createOrder({ status: "pending_payment" });

    await act(async () => {
      context!.trackOrder(order);
    });

    await waitFor(() => {
      expect(context!.orders[0].status).toBe("order_received");
    });
  });

  it("auto-dismisses delivered orders after 10 minutes", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    let context: ReturnType<typeof useOrderTracking> | null = null;

    render(
      <OrderTrackingProvider>
        <OrderTrackingHarness onReady={(value) => (context = value)} />
      </OrderTrackingProvider>
    );

    await waitFor(() => expect(context).not.toBeNull());
    const order = createOrder({ status: "delivered" });

    await act(async () => {
      context!.trackOrder(order);
    });

    await waitFor(() => {
      expect(context!.orders).toHaveLength(1);
    });

    await act(async () => {
      vi.advanceTimersByTime(10 * 60 * 1000 + 500);
      await vi.runAllTimersAsync();
    });

    await waitFor(() => {
      expect(context!.orders).toHaveLength(0);
    });

    vi.useRealTimers();
  });

  it("handles offline refresh gracefully", async () => {
    let context: ReturnType<typeof useOrderTracking> | null = null;
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Network down"));

    render(
      <OrderTrackingProvider>
        <OrderTrackingHarness onReady={(value) => (context = value)} />
      </OrderTrackingProvider>
    );

    await waitFor(() => expect(context).not.toBeNull());

    await expect(context!.refreshOrders()).resolves.not.toThrow();
    await waitFor(() => {
      expect(context!.orders).toEqual([]);
    });
  });
});
