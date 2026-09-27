import type Stripe from "stripe";
import { OrderStatus } from "../../generated/prisma/client";
import prisma from "../lib/prisma";
import { broadcastOrderStatus } from "../realtime/socket";
import { sendOrderStatusNotification } from "./pushNotificationService";

export const markOrderAsPaid = async (paymentIntent: Stripe.PaymentIntent) => {
  if (
    paymentIntent.status !== "succeeded" ||
    paymentIntent.currency !== "eur"
  ) {
    return null;
  }

  const metadataOrderId = Number(paymentIntent.metadata.orderId);
  const order =
    (await prisma.order.findFirst({
      where: { paymentIntentId: paymentIntent.id },
    })) ??
    (Number.isSafeInteger(metadataOrderId)
      ? await prisma.order.findUnique({ where: { id: metadataOrderId } })
      : null);

  if (
    !order ||
    order.status !== OrderStatus.PENDING_PAYMENT ||
    (order.paymentIntentId && order.paymentIntentId !== paymentIntent.id) ||
    Math.round(Number(order.totalPrice) * 100) !== paymentIntent.amount_received
  ) {
    return null;
  }

  const updated = await prisma.order.updateMany({
    where: { id: order.id, status: OrderStatus.PENDING_PAYMENT },
    data: {
      status: OrderStatus.ORDER_RECEIVED,
      paymentStatus: "succeeded",
      paymentIntentId: paymentIntent.id,
    },
  });
  if (updated.count === 0) return null;

  const paidOrder = await prisma.order.findUnique({ where: { id: order.id } });
  if (!paidOrder) return null;

  broadcastOrderStatus({
    id: paidOrder.id,
    status: "order_received",
    userId: paidOrder.userId,
    totalPrice: String(paidOrder.totalPrice),
    updatedAt: new Date().toISOString(),
  });
  void sendOrderStatusNotification(paidOrder.userId, {
    orderId: paidOrder.id,
    status: "order_received",
    message: "Neue Bestellung erhalten",
  }).catch((error) => {
    console.error("[push] Failed to send paid order notification", error);
  });

  return paidOrder;
};

export const markOrderAsPaymentFailed = async (
  paymentIntent: Stripe.PaymentIntent,
): Promise<void> => {
  const metadataOrderId = Number(paymentIntent.metadata.orderId);
  const order =
    (await prisma.order.findFirst({
      where: { paymentIntentId: paymentIntent.id },
    })) ??
    (Number.isSafeInteger(metadataOrderId)
      ? await prisma.order.findUnique({ where: { id: metadataOrderId } })
      : null);

  if (
    !order ||
    order.status !== OrderStatus.PENDING_PAYMENT ||
    (order.paymentIntentId && order.paymentIntentId !== paymentIntent.id)
  ) {
    return;
  }

  await prisma.order.updateMany({
    where: { id: order.id, status: OrderStatus.PENDING_PAYMENT },
    data: { status: OrderStatus.CANCELLED, paymentStatus: "failed" },
  });
};
