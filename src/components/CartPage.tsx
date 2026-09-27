import React, { useMemo } from "react";
import { useCart, useLanguage } from "@/contexts";
import CartItem from "./CartItem";
import OrderSummary from "./OrderSummary";
import { Button } from "./ui/button";
import { DELIVERY_FEE, getCartSubtotal } from "@/lib/cartPricing";

const CartPage: React.FC = () => {
  const { cartItems } = useCart();
  const { locale, t } = useLanguage();
  const intlLocale = locale === "de" ? "de-DE" : "en-GB";
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(intlLocale, {
        style: "currency",
        currency: "EUR",
      }),
    [intlLocale],
  );
  const formatCurrency = (value: number) => currencyFormatter.format(value);

  // Toplam fiyat hesaplama
  const subtotal = getCartSubtotal(cartItems);
  const deliveryFee = DELIVERY_FEE;
  const total = subtotal + deliveryFee;

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <div className="p-3 sm:p-4 md:p-8 max-w-7xl mx-auto">
        <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 md:mb-8 text-primary">
          {t("cart.title")}
        </h1>

        {cartItems.length > 0 ? (
          <>
            {/* Desktop Layout */}
            <div className="hidden lg:grid lg:grid-cols-3 lg:gap-8">
              {/* Cart Items List - Sol taraf */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                {cartItems.map((item, index) => (
                  <CartItem key={item.id + "-" + index} item={item} />
                ))}
              </div>

              {/* Order Summary - Sağ taraf (Desktop'ta sticky) */}
              <div className="lg:col-span-1">
                <div className="sticky top-8">
                  <OrderSummary />
                </div>
              </div>
            </div>

            {/* Mobile Layout */}
            <div className="lg:hidden">
              {/* Cart Items List - Scroll edilebilir alan */}
              <div className="space-y-4 mb-6">
                {cartItems.map((item, index) => (
                  <CartItem key={item.id + "-" + index} item={item} />
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center bg-gradient-to-br from-primary/5 to-accent/10 shadow-lg p-8 sm:p-12 md:p-16 rounded-2xl max-w-3xl mx-auto border border-primary/20">
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t("cart.empty.heading")}
            </h2>
            <h3 className="font-heading text-xl sm:text-2xl md:text-3xl font-bold text-primary mb-6">
              {t("cart.empty.subheading")}
            </h3>

            <p className="text-muted text-base sm:text-lg md:text-xl mb-8 max-w-2xl mx-auto leading-relaxed">
              {t("cart.empty.description")}
            </p>

            <a href="/menu" className="block">
              <Button
                size="lg"
                className="w-full sm:w-auto px-8 py-4 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                {t("cart.empty.cta")}
              </Button>
            </a>
          </div>
        )}
      </div>

      {/* Mobile Sticky Checkout - Sadece mobilde ve ürün varsa */}
      {cartItems.length > 0 && (
        <div className="lg:hidden fixed bottom-16 left-0 right-0 bg-background border-t border-border p-4 shadow-lg">
          <div className="flex justify-between items-center mb-3">
            <span className="text-foreground font-medium">
              {t("cart.mobile.totalLabel")}
            </span>
            <span className="font-heading font-bold text-xl text-foreground">
              {formatCurrency(total)}
            </span>
          </div>
          <a href="/checkout" className="block w-full">
            <Button size="lg" className="w-full font-bold">
              {t("cart.mobile.checkout")}
            </Button>
          </a>
        </div>
      )}
    </div>
  );
};

export default CartPage;
