import React, { useMemo } from "react";
import { useCart, useLanguage } from "@/contexts";
import { Button } from "./ui/button";
import { ShoppingBag, Truck } from "lucide-react";
import {
  DELIVERY_FEE,
  getCartItemTotal,
  getCartSubtotal,
} from "@/lib/cartPricing";

const OrderSummary: React.FC = () => {
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

  const subtotal = getCartSubtotal(cartItems);
  const deliveryFee = DELIVERY_FEE;
  const total = subtotal + deliveryFee;

  if (cartItems.length === 0) {
    return null;
  }

  return (
    <div className="bg-card shadow-lg sm:shadow-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-border">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
          <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        </div>
        <h2 className="font-heading text-lg sm:text-2xl font-bold text-foreground">
          {t("cart.summary.heading")}
        </h2>
      </div>

      <div className="mb-4 sm:mb-6">
        <p className="text-xs sm:text-sm text-muted mb-2 sm:mb-3">
          {t("cart.summary.itemsLabel", { count: cartItems.length })}
        </p>
        <div className="space-y-1 sm:space-y-2 max-h-24 sm:max-h-32 overflow-y-auto">
          {cartItems.map((item) => (
            <div
              key={item.cartItemId}
              className="flex justify-between text-xs sm:text-sm"
            >
              <span className="text-muted truncate mr-2">
                {item.quantity}x {item.translations[0].name}
              </span>
              <span className="text-foreground font-medium whitespace-nowrap">
                {formatCurrency(getCartItemTotal(item))}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2 sm:space-y-4 mb-4 sm:mb-6">
        <div className="flex justify-between text-xs sm:text-sm text-muted">
          <span>{t("cart.summary.subtotal")}</span>
          <span className="text-foreground font-medium">
            {formatCurrency(subtotal)}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs sm:text-sm text-muted">
          <div className="flex items-center gap-1 sm:gap-2">
            <Truck className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>{t("cart.summary.deliveryFee")}</span>
          </div>
          <span className="text-foreground font-medium">
            {formatCurrency(deliveryFee)}
          </span>
        </div>

        <div className="flex justify-between text-foreground font-heading font-bold text-base sm:text-xl border-t border-secondary pt-3 sm:pt-4 mt-3 sm:mt-4">
          <span>{t("cart.summary.total")}</span>
          <span className="text-primary text-lg sm:text-2xl">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      <a href="/checkout" className="block">
        <Button
          size="lg"
          className="w-full font-bold text-base sm:text-lg h-11 sm:h-14 rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all"
        >
          {t("cart.summary.checkout")}
        </Button>
      </a>

      <p className="text-xs text-muted text-center mt-3 sm:mt-4">
        {t("cart.summary.footer")}
      </p>
    </div>
  );
};

export default OrderSummary;
