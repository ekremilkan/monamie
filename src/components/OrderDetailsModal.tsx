import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useModal } from "@/contexts/ModalContext";
import { Button } from "@/components/ui/button";
import { X, RefreshCw, Home, CreditCard } from "lucide-react";
import type { Address } from "@/types";
import { useReorder } from "@/hooks/useReorder";
import { useReview } from "@/contexts/ReviewContext";
import ReviewButton from "./ReviewButton";
import OrderReviewFormModal from "./OrderReviewFormModal";
import { useLanguage } from "@/contexts";
import { getOrderTrackingCopy } from "@/lib/i18n/orderTracking";
import { normalizeOrderStatus } from "@/contexts/OrderTrackingContext";

const OrderDetailsModal: React.FC = () => {
  const { orderToShow, closeOrderDetailsModal } = useModal();
  const reorder = useReorder();
  const { reviewStatuses, checkOrderReviewStatus, submitOrderReview } =
    useReview();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const { locale, t } = useLanguage();
  const intlLocale = locale === "de" ? "de-DE" : "en-GB";
  const trackingCopy = useMemo(() => getOrderTrackingCopy(locale), [locale]);
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(intlLocale, {
        style: "currency",
        currency: "EUR",
      }),
    [intlLocale]
  );
  const formatCurrency = (value: number) => currencyFormatter.format(value);

  const reviewStatus = orderToShow
    ? reviewStatuses.find((status) => status.orderId === orderToShow.id)
    : undefined;

  useEffect(() => {
    setShowReviewForm(false);
    setReviewSubmitting(false);
  }, [orderToShow?.id]);

  useEffect(() => {
    if (orderToShow && orderToShow.status === "delivered" && !reviewStatus) {
      checkOrderReviewStatus(orderToShow.id).catch(() => {
        // Toast ReviewContext içinde tetikleniyor.
      });
    }
  }, [
    orderToShow?.id,
    orderToShow?.status,
    reviewStatus,
    checkOrderReviewStatus,
  ]);

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
    if (!orderToShow) return;
    try {
      setReviewSubmitting(true);
      await submitOrderReview(orderToShow.id, rating, comment);
      setShowReviewForm(false);
    } catch {
      // Hata ReviewContext içinde yönetiliyor
    } finally {
      setReviewSubmitting(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    const normalized = normalizeOrderStatus(status);
    const label =
      trackingCopy.badges[normalized] ?? trackingCopy.badges.order_received;
    return (
      <span
        className="inline-flex items-center px-2 py-1 rounded bg-secondary text-secondary-foreground text-xs font-medium"
        title={`${t("orderHistory.modal.statusPrefix")} ${label}`}
      >
        {label}
      </span>
    );
  };

  return (
    <Dialog open={!!orderToShow} onOpenChange={closeOrderDetailsModal}>
      {/* Fullscreen modal */}
      <DialogContent className="p-0 w-[100vw] h-[100vh] max-w-none max-h-none rounded-none inset-0 top-0 left-0 translate-x-0 translate-y-0 overflow-hidden flex flex-col sm:inset-auto sm:left-1/2 sm:top-1/2 sm:translate-x-[-50%] sm:translate-y-[-50%] sm:w-full sm:max-w-xl sm:max-h-[90vh] sm:rounded-lg">
        <DialogHeader className="sticky top-0 bg-background z-10 border-b border-border px-4 py-3 shadow-md">
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="font-heading text-base sm:text-lg">
              {orderToShow
                ? t("orderHistory.modal.titleWithNumber", {
                    orderId: orderToShow.id,
                  })
                : t("orderHistory.modal.title")}
            </DialogTitle>
            <Button
              variant="secondary"
              size="icon"
              onClick={closeOrderDetailsModal}
              className="h-9 w-9 rounded-full transition-transform hover:scale-105"
              aria-label={t("orderHistory.modal.closeAria")}
              title={t("orderHistory.modal.closeTooltip")}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        {orderToShow && (
          <div className="relative flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-4">
            {/* Main card container */}
            <div className="bg-card shadow-subtle rounded-lg p-4 sm:p-6">
              {/* Top meta */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-6 pb-4 border-b border-secondary/60">
                <div className="space-y-1 w-full">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-heading text-lg sm:text-xl font-bold tracking-tight">
                      {t("orderHistory.modal.sectionHeading")}
                    </h2>
                    <div className="sm:hidden">
                      <ReviewButton
                        orderId={orderToShow.id}
                        orderStatus={orderToShow.status}
                        hasReview={reviewStatus?.hasReview ?? false}
                        reviewStatus={reviewStatus?.reviewStatus}
                        onClick={handleReviewClick}
                        loading={reviewSubmitting}
                      />
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-muted">
                    {t("orderHistory.modal.orderNumber", {
                      orderId: orderToShow.id,
                    })}
                  </p>
                  <p className="text-xs sm:text-sm text-muted">
                    {new Date(orderToShow.createdAt).toLocaleDateString(
                      intlLocale,
                      {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      }
                    )}{" "}
                    {new Date(orderToShow.createdAt).toLocaleTimeString(
                      intlLocale,
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </p>
                </div>
                <div className="flex items-center flex-wrap gap-2 sm:gap-3">
                  {renderStatusBadge(orderToShow.status)}
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-4 mb-6">
                {orderToShow.items.map((item, index) => {
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
                      <div className="grid grid-cols-[1fr_auto] items-center gap-2 font-medium">
                        <span className="text-foreground break-words">
                          {item.quantity}x{" "}
                          {item.product.translations[0]?.name ||
                            t("orderHistory.details.unknownProduct")}
                        </span>
                        <span className="text-foreground whitespace-nowrap">
                          {formatCurrency(
                            Number(item.priceAtPurchase) * item.quantity
                          )}
                        </span>
                      </div>

                      <div className="pl-4 text-xs text-muted mt-1 space-y-1">
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

              {/* Order Note */}
              <div className="bg-secondary p-3 rounded-md mb-6">
                <p className="font-semibold text-foreground text-sm mb-1">
                  {t("orderHistory.details.noteHeading")}
                </p>
                <p className="text-muted text-xs italic">
                  {t("orderHistory.details.noNotes")}
                </p>
              </div>

              {/* Footer: Address, Payment, Total */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 border-t border-secondary pt-6 mt-6">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-2 text-sm text-muted">
                    <Home size={16} className="mt-0.5" />
                    <div className="min-w-0">
                      {(() => {
                        const mockAddress: Address = {
                          id: 1,
                          street: "Musterstraße 15",
                          city: "Hamburg",
                          zipCode: "20095",
                          details: "Erdgeschoss, Klingel 3",
                          userId: orderToShow.id,
                        };
                        return (
                          <>
                            <p className="font-semibold text-foreground break-words">
                              {mockAddress.street}
                            </p>
                            <p className="break-words">
                              {mockAddress.zipCode} {mockAddress.city}
                            </p>
                            {mockAddress.details && (
                              <p className="text-xs break-words">
                                {mockAddress.details}
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted">
                    <CreditCard size={16} />
                    <span className="break-words">
                      {orderToShow.paymentMethod ||
                        t("orderHistory.details.defaultPaymentMethod")}
                    </span>
                  </div>
                </div>

                <div className="flex sm:items-end sm:justify-end">
                  <div className="text-right sm:text-right w-full">
                    <span className="text-sm text-muted">
                      {t("orderHistory.modal.totalLabel")}
                    </span>
                    <p className="font-heading font-semibold text-2xl sm:text-3xl text-primary">
                      {formatCurrency(Number(orderToShow.totalPrice))}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 left-0 right-0 bg-background border-t border-border pt-4 pb-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="hidden sm:flex sm:flex-1">
                  <ReviewButton
                    orderId={orderToShow.id}
                    orderStatus={orderToShow.status}
                    hasReview={reviewStatus?.hasReview ?? false}
                    reviewStatus={reviewStatus?.reviewStatus}
                    onClick={handleReviewClick}
                    loading={reviewSubmitting}
                    className="w-full"
                  />
                </div>
                <Button
                  variant="default"
                  className="w-full sm:flex-1 bg-primary text-white hover:bg-primary/90 font-medium transition-transform active:scale-[0.98]"
                  onClick={() =>
                    reorder(orderToShow, { onSuccess: closeOrderDetailsModal })
                  }
                >
                  <RefreshCw size={16} className="mr-2" />
                  {trackingCopy.history.reorderLabel}
                </Button>
              </div>
            </div>
          </div>
        )}
        <OrderReviewFormModal
          open={showReviewForm}
          onClose={handleCloseReviewForm}
          onSubmit={handleSubmitReview}
          orderId={orderToShow?.id ?? 0}
          loading={reviewSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsModal;
