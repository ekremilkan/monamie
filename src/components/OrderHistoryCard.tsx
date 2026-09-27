import React, { useMemo } from "react";
import { Button } from "./ui/button";
import { ChevronRight, RefreshCw } from "lucide-react";
import type { Order } from "@/types";
import { normalizeOrderStatus } from "@/contexts/OrderTrackingContext";
import { useModal } from "@/contexts/ModalContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useReorder } from "@/hooks/useReorder";
import { getOrderTrackingCopy } from "@/lib/i18n/orderTracking";
import type { SupportedLocale } from "@/lib/i18n/shared";
import { useLanguage } from "@/contexts";

interface OrderHistoryCardProps {
  order: Order;
  onSelect: () => void;
  isSelected: boolean;
}

const intlLocale = (locale: SupportedLocale) =>
  locale === "de" ? "de-DE" : "en-GB";

const formatEuro = (value: string | number, locale: SupportedLocale) =>
  new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency: "EUR",
  }).format(typeof value === "string" ? Number(value) : value);

const OrderHistoryCard: React.FC<OrderHistoryCardProps> = ({
  order,
  onSelect,
  isSelected,
}) => {
  const { locale } = useLanguage();
  const summary = order.items
    .slice(0, 2)
    .map((item) => `${item.quantity}x ${item.product.translations[0]?.name}`)
    .join(", ");
  const hasMoreItems = order.items.length > 2;

  const { openOrderDetailsModal } = useModal();
  const isTabletOrMobile = useMediaQuery("(max-width: 1024px)");
  const reorder = useReorder();

  const translations = useMemo(
    () => getOrderTrackingCopy(locale),
    [locale]
  );

  const handleDetailsClick = () => {
    if (isTabletOrMobile) {
      openOrderDetailsModal(order);
    } else {
      onSelect();
    }
  };

  const handleReorder = () => reorder(order);

  const orderDate = new Date(order.createdAt).toLocaleDateString(intlLocale(locale), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const orderStatus = normalizeOrderStatus(order.status);
  const badgeLabel =
    translations.badges[orderStatus] ?? translations.badges.order_received;

  return (
    <div
      className={`bg-card shadow-subtle p-4 rounded-lg transition-colors ${
        isSelected ? "bg-secondary" : "hover:bg-secondary/50"
      }`}
    >
      <div className="flex justify-between items-center text-xs text-muted mb-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground text-sm">
            {translations.history.orderLabel} #{order.id}
          </span>
          <span className="hidden sm:inline">•</span>
          <span>{orderDate}</span>
        </div>
        <Button
          variant="link"
          className="p-0 h-auto text-primary font-semibold flex items-center"
          onClick={handleDetailsClick}
          aria-label={`${translations.history.detailsLabel} für Bestellung #${order.id}`}
        >
          {translations.history.detailsLabel} <ChevronRight size={16} />
        </Button>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium bg-primary/10 text-primary">
          {badgeLabel}
        </span>
      </div>
      <p className="mt-2 font-semibold text-foreground truncate">
        {summary}
        {hasMoreItems && "..."}
      </p>

      <div className="mt-4 flex items-center justify-between">
        <Button
          variant="ghost"
          className="text-primary hover:bg-primary/10 hover:text-primary p-2 h-auto text-sm"
          onClick={handleReorder}
        >
          <RefreshCw size={14} className="mr-2" />
          {translations.history.reorderLabel}
        </Button>
        <p className="font-heading font-semibold text-lg text-foreground">
          {formatEuro(order.totalPrice, locale)}
        </p>
      </div>
    </div>
  );
};

export default OrderHistoryCard;
