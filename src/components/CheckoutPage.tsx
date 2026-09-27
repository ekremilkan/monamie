import React, { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts";
import { useAddress } from "@/contexts/AddressContext";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import CheckoutForm from "./CheckoutForm"; // The new component that handles payment
import {
  DELIVERY_FEE,
  getCartItemTotal,
  getCartSubtotal,
} from "@/lib/cartPricing";

const CheckoutPage: React.FC = () => {
  const { token } = useAuth();
  const { cartItems, isLoading: isCartLoading } = useCart();
  const { activeAddress, openAddressModal } = useAddress();

  useEffect(() => {
    if (isCartLoading) return;
    if (!token || cartItems.length === 0) {
      window.location.href = "/";
    }
  }, [token, cartItems, isCartLoading]);

  const subtotal = getCartSubtotal(cartItems);
  const deliveryFee = DELIVERY_FEE;
  const total = subtotal + deliveryFee;

  // This function is now only for opening the address modal if no address is selected.
  const handleCheckoutClick = () => {
    if (!activeAddress) {
      openAddressModal();
    }
  };

  if (isCartLoading || cartItems.length === 0) {
    return (
      <p className="text-center text-foreground p-8">Loading Checkout...</p>
    );
  }

  return (
    <div className="text-foreground max-w-2xl mx-auto">
      <h1 className="font-heading text-4xl font-bold mb-8">Checkout</h1>

      <Card className="bg-card shadow-subtle mb-6">
        <CardHeader>
          <CardTitle className="font-heading text-xl">
            Delivery Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeAddress ? (
            <div>
              <p className="font-semibold">{activeAddress.street}</p>
              <p className="text-sm text-muted">
                {activeAddress.zipCode} {activeAddress.city}
              </p>
            </div>
          ) : (
            <p className="text-muted">
              Please select or add a delivery address.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card shadow-subtle">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Your Order</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {cartItems.map((item) => (
              <div
                key={item.cartItemId}
                className="flex justify-between text-sm"
              >
                <span>
                  {item.quantity}x {item.translations[0].name}
                </span>
                <span>${getCartItemTotal(item).toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-secondary pt-3 mt-3 font-semibold">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card shadow-subtle mt-6">
        <CardHeader>
          <CardTitle className="font-heading text-xl">
            Payment Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* If an address is selected, show the payment form. Otherwise, show a button to add an address. */}
          {activeAddress ? (
            <CheckoutForm total={total} />
          ) : (
            <Button
              onClick={handleCheckoutClick}
              size="lg"
              className="w-full font-bold text-lg"
            >
              Please Select an Address to Continue
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckoutPage;
