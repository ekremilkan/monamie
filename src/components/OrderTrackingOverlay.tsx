import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck,
  ChefHat,
  PackageCheck,
  TimerReset,
  Truck,
} from "lucide-react";
import { Button } from "./ui/button";
import { useOrderTracking, normalizeOrderStatus } from "@/contexts/OrderTrackingContext";
import type { OrderStatus } from "@/types";
import { getOrderTrackingCopy } from "@/lib/i18n/orderTracking";
import type { SupportedLocale } from "@/lib/i18n/shared";
import { useLanguage } from "@/contexts";

type StepKey = "order_received" | "preparing" | "on_the_way" | "delivered";
type StepStatus = Exclude<
  OrderStatus,
  "pending_payment" | "processing" | "shipped"
>;

const STEP_SEQUENCE: StepKey[] = [
  "order_received",
  "preparing",
  "on_the_way",
  "delivered",
];

const STATUS_ICONS: Record<
  StepKey,
  React.ComponentType<{ className?: string }>
> = {
  order_received: PackageCheck,
  preparing: ChefHat,
  on_the_way: Truck,
  delivered: BadgeCheck,
};

const intlLocale = (locale: SupportedLocale) =>
  locale === "de" ? "de-DE" : "en-GB";

const formatTime = (
  iso: string | null | undefined,
  locale: SupportedLocale
) => {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleTimeString(intlLocale(locale), {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (value: number, locale: SupportedLocale) =>
  new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency: "EUR",
  }).format(value);

const formatRemaining = (ms: number) => {
  if (ms <= 0) return "gleich";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) {
    return `${minutes} Min ${seconds.toString().padStart(2, "0")} s`;
  }
  return `${seconds} s`;
};

const OrderTrackingOverlay: React.FC = () => {
  const { activeOrder, dismissOrder } = useOrderTracking();
  const [now, setNow] = useState(Date.now());
  const { locale } = useLanguage();
  const copy = useMemo(() => getOrderTrackingCopy(locale), [locale]);
  const stepDefinitions = useMemo(
    () =>
      STEP_SEQUENCE.map((key) => ({
        status: key,
        title: copy.steps[key].title,
        description: copy.steps[key].description,
        icon: STATUS_ICONS[key],
      })),
    [copy]
  );

  useEffect(() => {
    if (!activeOrder?.autoDismissAt) {
      return;
    }
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(id);
    };
  }, [activeOrder?.autoDismissAt]);

  const normalizedStatus = useMemo<StepStatus>(() => {
    if (!activeOrder) {
      return "order_received";
    }
    return normalizeOrderStatus(activeOrder.status) as StepStatus;
  }, [activeOrder]);

  const isCancelled = normalizedStatus === "cancelled";

  const currentIndex = useMemo(() => {
    if (isCancelled) {
      return -1;
    }
    return stepDefinitions.findIndex(
      (step) => step.status === normalizedStatus
    );
  }, [isCancelled, normalizedStatus, stepDefinitions]);

  const progress =
    stepDefinitions.length > 1
      ? Math.max(currentIndex, 0) / (stepDefinitions.length - 1)
      : 0;

  const remainingMs =
    activeOrder?.autoDismissAt != null ? activeOrder.autoDismissAt - now : null;

  const showCountdown =
    normalizedStatus === "delivered" && remainingMs != null && remainingMs > 0;

  const statusTitle =
    stepDefinitions.find((step) => step.status === normalizedStatus)?.title ??
    copy.overlay.heading;

  const bannerTitle = isCancelled ? copy.badges.cancelled : statusTitle;

  return (
    <AnimatePresence>
      {activeOrder && (
        <motion.aside
          key={activeOrder.id}
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          role="status"
          aria-live="polite"
          className="fixed bottom-24 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl border border-primary/20 bg-background/90 p-4 shadow-xl backdrop-blur-md sm:right-6 sm:bottom-6 sm:left-auto sm:max-w-lg sm:p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-primary">
                {copy.overlay.heading}
              </p>
              <h2 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">
                {bannerTitle}
              </h2>
              {activeOrder.orderNumber && (
                <p className="text-sm text-muted-foreground">
                  {copy.overlay.orderNumberLabel}: {activeOrder.orderNumber}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Statusanzeige schließen"
              className="h-8 w-8 rounded-full text-muted-foreground"
              onClick={() => dismissOrder(activeOrder.id)}
            >
              <TimerReset className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <span>
              {copy.overlay.totalLabel}:{" "}
              <span className="text-foreground">
                {formatCurrency(activeOrder.totalPrice, locale)}
              </span>
            </span>
            <span>
              {copy.overlay.orderedAtLabel}{" "}
              {formatTime(activeOrder.createdAt, locale) ?? "--:--"}
            </span>
          </div>

          <div className="mt-4">
            <div className="relative h-2 w-full rounded-full bg-primary/15">
              <motion.div
                className="absolute left-0 top-0 h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.max(0, Math.min(progress, 1)) * 100}%`,
                }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              {stepDefinitions.map((step, index) => {
                const achieved = currentIndex > -1 && index <= currentIndex;
                const Icon = step.icon;
                const timestamp =
                  activeOrder.milestones[step.status] &&
                  formatTime(activeOrder.milestones[step.status], locale);
                return (
                  <div
                    key={step.status}
                    className="flex flex-col items-start gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-full border ${
                          achieved
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-muted text-muted-foreground"
                        }`}
                        aria-hidden="true"
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p
                          className={`text-xs font-medium ${
                            achieved
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {step.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {timestamp ?? "--:--"}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-muted-foreground">
              {isCancelled ? (
                <span>{copy.overlay.cancelledInfo}</span>
              ) : showCountdown && remainingMs ? (
                <span>
                  {copy.overlay.autoDismissLabel}{" "}
                  <span className="font-medium text-foreground">
                    {formatRemaining(remainingMs)}
                  </span>
                </span>
              ) : (
                <span>{copy.overlay.defaultInfo}</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="min-w-[140px]"
                onClick={() => {
                  window.location.href = "/order-history";
                }}
              >
                {copy.overlay.historyButton}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dismissOrder(activeOrder.id)}
              >
                {copy.overlay.hideButton}
              </Button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default OrderTrackingOverlay;
