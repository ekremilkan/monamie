import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./ui/button";
import {
  RefreshCw,
  CreditCard,
  Home,
  ThumbsUp,
  XCircle,
  MessageCircle,
} from "lucide-react";
import type { Order, Address } from "@/types";
import OrderHistoryCard from "./OrderHistoryCard";
import { useReorder } from "@/hooks/useReorder";
import ReviewButton from "./ReviewButton";
import OrderReviewFormModal from "./OrderReviewFormModal";
import { useReview } from "@/contexts/ReviewContext";
import { useOrderTracking, normalizeOrderStatus } from "@/contexts/OrderTrackingContext";
import { buildApiUrl } from "@/lib/api";
import OrderProgressStepper, { StepKey } from "./OrderProgressStepper";
import { getOrderTrackingCopy } from "@/lib/i18n/orderTracking";
import type { SupportedLocale } from "@/lib/i18n/shared";
import { useLanguage } from "@/contexts";

type TrackedOrder = ReturnType<typeof useOrderTracking>["orders"][number];

const STEP_SEQUENCE: StepKey[] = [
  "order_received",
  "preparing",
  "on_the_way",
  "delivered",
];

const intlLocale = (locale: SupportedLocale) =>
  locale === "de" ? "de-DE" : "en-GB";

const formatEuro = (value: string | number, locale: SupportedLocale) =>
  new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency: "EUR",
  }).format(typeof value === "string" ? Number(value) : value);

const formatTimestamp = (iso: string | null | undefined, locale: SupportedLocale) => {
  if (!iso) {
    return null;
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleTimeString(intlLocale(locale), {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const OrderDetails: React.FC<{
  order: Order;
  trackedOrder?: TrackedOrder | null;
  copy: ReturnType<typeof getOrderTrackingCopy>;
  locale: SupportedLocale;
}> = ({ order, trackedOrder, copy, locale }) => {
  const reorder = useReorder();
  const { reviewStatuses, checkOrderReviewStatus, submitOrderReview } =
    useReview();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const { t } = useLanguage();

  // TODO: Adresse aus dem Backend beziehen, sobald verfügbar.
  const mockAddress: Address = {
    id: 1,
    street: "Musterstraße 15",
    city: "Hamburg",
    zipCode: "20095",
    details: "Erdgeschoss, Klingel 3",
    userId: order.id,
  };

  const reviewStatus = reviewStatuses.find(
    (status) => status.orderId === order.id
  );

  useEffect(() => {
    setShowReviewForm(false);
    setReviewSubmitting(false);
  }, [order.id]);

  useEffect(() => {
    if (order.status === "delivered" && !reviewStatus) {
      checkOrderReviewStatus(order.id).catch(() => {
        // Toast ReviewContext içinde tetikleniyor.
      });
    }
  }, [order.id, order.status, reviewStatus, checkOrderReviewStatus]);

  const handleReviewClick = () => {
    setShowReviewForm(true);
  };

  const handleCloseReviewForm = () => {
    setShowReviewForm(false);
  };

  const handleSubmitReview = async ({
    rating,
    comment,
  }: {
    rating: number;
    comment: string;
  }) => {
    try {
      setReviewSubmitting(true);
      await submitOrderReview(order.id, rating, comment);
      setShowReviewForm(false);
    } catch {
      // Hata ReviewContext içinde yönetiliyor
    } finally {
      setReviewSubmitting(false);
    }
  };

  const normalizedStatus = normalizeOrderStatus(
    trackedOrder?.status ?? order.status
  );

  const activeStepIndex =
    normalizedStatus === "cancelled"
      ? -1
      : STEP_SEQUENCE.indexOf(normalizedStatus as StepKey);

  const activeStepTitle =
    normalizedStatus === "cancelled"
      ? copy.badges.cancelled
      : activeStepIndex > -1
      ? copy.steps[STEP_SEQUENCE[activeStepIndex]].title
      : copy.overlay.heading;

  const activeStepDescription =
    normalizedStatus === "cancelled"
      ? copy.overlay.cancelledInfo
      : activeStepIndex > -1
      ? copy.steps[STEP_SEQUENCE[activeStepIndex]].description
      : copy.overlay.defaultInfo;

  const getStepContent = (key: StepKey) => ({
    key,
    title: copy.steps[key].title,
    description: copy.steps[key].description,
    timestamp: formatTimestamp(trackedOrder?.milestones[key] ?? null, locale),
  });

  return (
    <div className="bg-card shadow-subtle p-6 rounded-lg sticky top-28">
      <div className="flex justify-between items-start mb-6 border-b border-secondary pb-4">
        <div>
          <h2 className="font-heading text-2xl font-bold">
            {t("orderHistory.details.title", { orderId: order.id })}
          </h2>
          <p className="text-sm text-muted">
            {new Date(order.createdAt).toLocaleDateString(intlLocale(locale), {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}{" "}
            {new Date(order.createdAt).toLocaleTimeString(intlLocale(locale), {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ReviewButton
            orderId={order.id}
            orderStatus={order.status}
            hasReview={reviewStatus?.hasReview ?? false}
            reviewStatus={reviewStatus?.reviewStatus}
            onClick={handleReviewClick}
            loading={reviewSubmitting}
          />
          <Button
            variant="outline"
            className="text-primary hover:bg-primary/10 hover:text-primary p-2 h-auto text-sm"
            onClick={() => reorder(order)}
          >
            <RefreshCw size={16} className="mr-2" />
            {copy.history.reorderLabel}
          </Button>
        </div>
      </div>

      <div className="mb-6 space-y-5">
        <OrderProgressStepper
          status={trackedOrder?.status ?? order.status}
          getStepContent={getStepContent}
        />
      </div>

      <div className="space-y-4 mb-6">
        {order.items.map((item, index) => {
          const allIngredientsMap = new Map(
            item.product.ingredients.map((i) => [
              i.ingredient.id,
              i.ingredient.name,
            ])
          );
          return (
            <div
              key={index}
              className="text-sm pb-4 border-b border-secondary/50 last:border-b-0"
            >
              <div className="flex justify-between items-center font-semibold">
                <span className="text-foreground">
                  {item.quantity}x{" "}
                  {item.product.translations[0]?.name ||
                    t("orderHistory.details.unknownProduct")}
                </span>
                <span className="text-foreground">
                  {formatEuro(Number(item.priceAtPurchase) * item.quantity, locale)}
                </span>
              </div>
              <div className="pl-4 text-xs text-muted mt-1">
                {item.selectedIngredientIds.length > 0 ? (
                  item.selectedIngredientIds.map((id) => (
                    <div key={id}>
                      +{" "}
                      {allIngredientsMap.get(id) ||
                        t("orderHistory.details.customizationFallback")}
                    </div>
                  ))
                ) : (
                  <div className="italic">
                    {t("orderHistory.details.noCustomizations")}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-secondary p-3 rounded-md mb-6">
        <p className="font-semibold text-foreground text-sm mb-1">
          {t("orderHistory.details.noteHeading")}
        </p>
        <p className="text-muted text-xs italic">
          {t("orderHistory.details.noNotes")}
        </p>
      </div>

      <div className="flex justify-between items-end border-t border-secondary pt-6 mt-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-2 text-sm text-muted">
            <Home size={16} className="mt-1" />
            <div>
              <p className="font-semibold text-foreground">
                {mockAddress.street}
              </p>
              <p>
                {mockAddress.zipCode} {mockAddress.city}
              </p>
              {mockAddress.details && (
                <p className="text-xs">{mockAddress.details}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted">
            <CreditCard size={16} />
            <span>
              {order.paymentMethod ||
                t("orderHistory.details.defaultPaymentMethod")}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-sm text-muted">
            {t("orderHistory.details.totalLabel")}
          </span>
          <p className="font-heading font-semibold text-3xl text-foreground">
            {formatEuro(order.totalPrice, locale)}
          </p>
        </div>
      </div>

      <OrderReviewFormModal
        open={showReviewForm}
        onClose={handleCloseReviewForm}
        onSubmit={handleSubmitReview}
        orderId={order.id}
        loading={reviewSubmitting}
      />
    </div>
  );
};

// Ana sayfa component'i (yapısı bozulmadı)
const OrderHistoryPage: React.FC = () => {
  const { token, logout } = useAuth();
  const { locale, t } = useLanguage();
  const { orders: trackedOrders } = useOrderTracking();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const trackingCopy = useMemo(
    () => getOrderTrackingCopy(locale),
    [locale]
  );

  useEffect(() => {
    if (!token) {
      window.location.href = "/";
      return;
    }
    const fetchOrders = async () => {
      try {
        const response = await fetch(buildApiUrl("/api/orders"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch orders");
        const data = await response.json();
        setOrders(data);
        if (data.length > 0) {
          setSelectedOrder(data[0]);
        }
      } catch (error) {
        console.error(error);
        logout();
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [token, logout]);

  useEffect(() => {
    if (!trackedOrders.length) {
      return;
    }

    setOrders((prev) =>
      prev.map((order) => {
        const tracked = trackedOrders.find((t) => t.id === order.id);
        if (!tracked) return order;
        return {
          ...order,
          status: tracked.status,
          deliveredAt:
            tracked.milestones.delivered ?? order.deliveredAt ?? null,
        };
      })
    );

    setSelectedOrder((prevSelected) => {
      if (!prevSelected) return prevSelected;
      const tracked = trackedOrders.find((t) => t.id === prevSelected.id);
      if (!tracked) return prevSelected;
      return {
        ...prevSelected,
        status: tracked.status,
        deliveredAt:
          tracked.milestones.delivered ?? prevSelected.deliveredAt ?? null,
      };
    });
  }, [trackedOrders]);

  const selectedTrackedOrder = useMemo(() => {
    if (!selectedOrder) return null;
    return trackedOrders.find((order) => order.id === selectedOrder.id) ?? null;
  }, [selectedOrder, trackedOrders]);

  if (loading) {
    return (
      <p className="text-foreground text-center p-8">
        {t("orderHistory.loading")}
      </p>
    );
  }

  return (
    <div className="text-foreground p-3 sm:p-4 md:p-8 max-w-7xl mx-auto">
      <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 md:mb-8 text-primary">
        {t("orderHistory.heading")}
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-4">
          {orders.length > 0 ? (
            orders.map((order) => (
              <OrderHistoryCard
                key={order.id}
                order={order}
                isSelected={selectedOrder?.id === order.id}
                onSelect={() => setSelectedOrder(order)}
              />
            ))
          ) : (
            <div className="bg-card shadow-subtle p-8 rounded-lg text-center">
              <p className="text-muted">
                {t("orderHistory.empty")}
              </p>
            </div>
          )}
        </div>
        <div className="hidden lg:block">
          {selectedOrder ? (
            <OrderDetails
              order={selectedOrder}
              trackedOrder={selectedTrackedOrder}
              copy={trackingCopy}
              locale={locale}
            />
          ) : (
            <div className="bg-card shadow-subtle p-6 rounded-lg sticky top-28 text-center">
              <p className="text-muted">
                {t("orderHistory.selectPrompt")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderHistoryPage;
