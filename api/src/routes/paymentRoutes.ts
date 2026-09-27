import { Router, Request, Response } from "express";
import Stripe from "stripe";
import { AuthenticatedRequest, authenticateToken } from "../middleware/auth";
import prisma from "../lib/prisma";
import {
  markOrderAsPaid,
  markOrderAsPaymentFailed,
} from "../services/orderPayment";

const router = Router();

router.post("/webhooks/stripe", async (req: Request, res: Response) => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.get("stripe-signature");
  if (!secretKey || !webhookSecret) {
    res.sendStatus(503);
    return;
  }
  if (!signature || !Buffer.isBuffer(req.body)) {
    res.sendStatus(400);
    return;
  }

  const stripe = new Stripe(secretKey);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch {
    res.status(400).send("Invalid Stripe signature");
    return;
  }

  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  try {
    if (event.type === "payment_intent.succeeded") {
      await markOrderAsPaid(paymentIntent);
    } else if (
      event.type === "payment_intent.payment_failed" ||
      event.type === "payment_intent.canceled"
    ) {
      await markOrderAsPaymentFailed(paymentIntent);
    }
    res.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing failed:", error);
    res.sendStatus(500);
  }
});

router.post(
  "/checkout/:orderId/confirm",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const orderId = Number.parseInt(req.params.orderId, 10);
    const userId = req.user?.userId;
    if (!secretKey) {
      res.sendStatus(503);
      return;
    }
    if (!Number.isSafeInteger(orderId) || orderId <= 0 || !userId) {
      res.status(400).json({ message: "Invalid order" });
      return;
    }

    try {
      const order = await prisma.order.findFirst({
        where: { id: orderId, userId },
      });
      if (!order?.paymentIntentId) {
        res.sendStatus(404);
        return;
      }

      const stripe = new Stripe(secretKey);
      const paymentIntent = await stripe.paymentIntents.retrieve(
        order.paymentIntentId,
      );
      if (paymentIntent.metadata.orderId !== order.id.toString()) {
        res.status(400).json({ message: "Payment does not match order" });
        return;
      }
      if (paymentIntent.status !== "succeeded") {
        res.status(409).json({ message: "Payment is not complete" });
        return;
      }

      const paidOrder = await markOrderAsPaid(paymentIntent);
      const confirmedOrder =
        paidOrder ??
        (await prisma.order.findUnique({
          where: { id: order.id },
        }));
      if (!confirmedOrder || confirmedOrder.paymentStatus !== "succeeded") {
        res.status(409).json({ message: "Payment confirmation is pending" });
        return;
      }

      res.json({
        order: {
          id: confirmedOrder.id,
          status: "order_received",
          createdAt: confirmedOrder.createdAt,
          totalPrice: confirmedOrder.totalPrice.toString(),
          orderNumber: confirmedOrder.orderNumber,
          deliveredAt: confirmedOrder.deliveredAt,
        },
      });
    } catch (error) {
      console.error("Payment confirmation failed:", error);
      res.sendStatus(500);
    }
  },
);

export default router;
