import React, { useState } from "react";
import {
  useStripe,
  useElements,
  CardElement,
  Elements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useAuth } from "@/contexts/AuthContext";
import { useCart, useOrderTracking } from "@/contexts";
import { useAddress } from "@/contexts/AddressContext";
import { Button } from "./ui/button";
import { buildApiUrl } from "@/lib/api";

const stripePromise = loadStripe(
  import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
);

interface CheckoutFormProps {
  total: number;
}

// Bu, asıl ödeme mantığını içeren "araba" component'imiz.
const PaymentForm: React.FC<CheckoutFormProps> = ({ total }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { token } = useAuth();
  const { cartItems, clearCart } = useCart();
  const { trackOrder, refreshOrders } = useOrderTracking();
  const { activeAddress } = useAddress();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements || !activeAddress) return;
    setIsProcessing(true);
    setError(null);
    try {
      const res = await fetch(buildApiUrl("/api/checkout"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token!}`,
        },
        body: JSON.stringify({ cartItems, addressId: activeAddress.id }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to create payment intent.");
      const { clientSecret } = data;
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error("Card element not found.");
      const { error: stripeError } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: { card: cardElement },
        },
      );
      if (stripeError) throw new Error(stripeError.message);

      if (!data.order?.id) throw new Error("Order confirmation is missing.");
      const confirmationResponse = await fetch(
        buildApiUrl(`/api/checkout/${data.order.id}/confirm`),
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const confirmationData = await confirmationResponse.json();
      if (!confirmationResponse.ok) {
        throw new Error(
          confirmationData.message || "Payment confirmation failed.",
        );
      }

      clearCart();
      trackOrder(confirmationData.order);
      void refreshOrders();

      window.location.href = "/order-success";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement
        options={{
          style: {
            base: {
              color: "#2C2C2C",
              fontFamily: "Roboto, sans-serif",
              fontSize: "16px",
              "::placeholder": { color: "#8D8D8D" },
            },
          },
        }}
      />
      {error && (
        <p className="text-primary text-sm mt-4 text-center">{error}</p>
      )}
      <Button
        type="submit"
        size="lg"
        className="w-full font-bold text-lg mt-8"
        disabled={isProcessing || !stripe}
      >
        {isProcessing ? "Processing..." : `Pay $${total.toFixed(2)}`}
      </Button>
    </form>
  );
};

// Bu, "otoparkı" ve "arabayı" birleştiren ana component.
const CheckoutForm: React.FC<CheckoutFormProps> = ({ total }) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm total={total} />
    </Elements>
  );
};

export default CheckoutForm;
