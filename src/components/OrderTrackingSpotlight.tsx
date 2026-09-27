import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { useOrderTracking, normalizeOrderStatus } from "@/contexts/OrderTrackingContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { getOrderTrackingCopy } from "@/lib/i18n/orderTracking";
import type { SupportedLocale } from "@/lib/i18n/shared";
import { useLanguage } from "@/contexts";
import { Button } from "./ui/button";
import {
  BellRing,
  ChevronRight,
  Bike,
  ChefHat,
  MessageCircle,
  BadgeCheck,
  ThumbsUp,
  XCircle,
} from "lucide-react";
import OrderProgressStepper, { StepKey } from "./OrderProgressStepper";

const STEP_SEQUENCE: StepKey[] = [
  "order_received",
  "preparing",
  "on_the_way",
  "delivered",
];

const STATUS_ICON_MAP: Record<
  StepKey,
  React.ComponentType<{ className?: string }>
> = {
  order_received: ThumbsUp,
  preparing: ChefHat,
  on_the_way: Bike,
  delivered: BadgeCheck,
};

const intlLocale = (locale: SupportedLocale) =>
  locale === "de" ? "de-DE" : "en-GB";

const formatCurrency = (value: number, locale: SupportedLocale) =>
  new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency: "EUR",
  }).format(value);

const formatTimestamp = (
  iso: string | null | undefined,
  locale: SupportedLocale
) => {
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

const OrderTrackingSpotlight: React.FC = () => {
  const { activeOrder } = useOrderTracking();
  const {
    permission,
    isSubscribed,
    isSupported,
    subscribe,
    isLoading: notificationLoading,
  } = useNotifications();
  const { locale } = useLanguage();

  const copy = useMemo(() => getOrderTrackingCopy(locale), [locale]);

  if (!activeOrder) {
    return null;
  }

  const normalizedStatus = normalizeOrderStatus(activeOrder.status) as
    | StepKey
    | "cancelled";

  const activeStepIndex =
    normalizedStatus === "cancelled"
      ? -1
      : STEP_SEQUENCE.indexOf(normalizedStatus as StepKey);

  const isNotificationPromptVisible =
    isSupported && (!isSubscribed || permission !== "granted");

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

  const progress =
    activeStepIndex > -1 && STEP_SEQUENCE.length > 1
      ? activeStepIndex / (STEP_SEQUENCE.length - 1)
      : 0;

  const StatusIcon =
    normalizedStatus === "cancelled"
      ? XCircle
      : activeStepIndex > -1
      ? STATUS_ICON_MAP[STEP_SEQUENCE[activeStepIndex]]
      : ThumbsUp;

  return (
    <motion.section
      layout
      className="mt-6 w-full sm:mt-8 sm:rounded-3xl sm:border sm:border-primary/20 sm:bg-gradient-to-br sm:from-primary/5 sm:via-background sm:to-background sm:p-6 sm:shadow-lg"
      aria-live="polite"
    >
      <div className="sm:hidden">
        <div className="overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-md">
          <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
            <div>
              <p className="text-[11px] uppercase tracking-wide opacity-90">
                Aktive Bestellung
              </p>
              <p className="font-heading text-lg font-semibold">
                {activeOrder.orderNumber
                  ? `Bestellung ${activeOrder.orderNumber}`
                  : copy.overlay.heading}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 opacity-80" />
          </div>

          <div className="space-y-4 px-4 py-5">
            {isNotificationPromptVisible && (
              <div className="flex flex-col gap-3 rounded-xl bg-primary/10 px-4 py-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <BellRing className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      Benachrichtigungen aktivieren
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      Bestellung im Blick behalten
                    </p>
                  </div>
                </div>
                <Button
                  onClick={async () => {
                    try {
                      await subscribe();
                    } catch {
                      /* handled im Kontext */
                    }
                  }}
                  disabled={notificationLoading}
                  className="self-start rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                  {notificationLoading
                    ? "Wird aktiviert ..."
                    : "Benachrichtigungen aktivieren"}
                </Button>
              </div>
            )}

            <div className="space-y-3 rounded-xl bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <StatusIcon className="h-5 w-5" />
                </span>
                <div className="space-y-1">
                  <p className="text-base font-semibold text-foreground">
                    {activeStepTitle}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {activeStepDescription}
                  </p>
                </div>
              </div>
              <div className="mt-2">
                <div className="h-1.5 w-full rounded-full bg-primary/15">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    animate={{
                      width: `${Math.max(0, Math.min(progress, 1)) * 100}%`,
                    }}
                    initial={false}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {copy.overlay.orderedAtLabel}:{" "}
                {formatTimestamp(activeOrder.createdAt, locale) ?? "--:--"}
              </p>
            </div>

            <OrderProgressStepper
              status={normalizedStatus}
              getStepContent={(key) => ({
                key,
                title: copy.steps[key].title,
                description: copy.steps[key].description,
                timestamp: formatTimestamp(activeOrder.milestones[key], locale),
              })}
              showMobileVariant={false}
            />

            <div className="flex flex-col gap-2 pt-2">
              <Button
                variant="secondary"
                disabled
                aria-disabled="true"
                className="flex items-center justify-center gap-2 rounded-full border border-destructive/30 bg-background text-destructive shadow-none transition-none"
              >
                <XCircle className="h-4 w-4" />
                Bestellung stornieren
              </Button>
              <Button
                variant="outline"
                disabled
                aria-disabled="true"
                className="flex items-center justify-center gap-2 rounded-full border-primary/40 text-primary opacity-80"
              >
                <MessageCircle className="h-4 w-4" />
                Mit Assistent:in verbinden
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden flex-col gap-6 sm:flex">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-primary">
              {copy.overlay.heading}
            </p>
            <h2 className="font-heading text-2xl font-semibold text-foreground">
              {activeStepTitle}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {copy.overlay.totalLabel}:{" "}
              <span className="font-semibold text-foreground">
                {formatCurrency(Number(activeOrder.totalPrice), locale)}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              {copy.overlay.orderedAtLabel}:{" "}
              {formatTimestamp(activeOrder.createdAt, locale) ?? "--:--"}
            </p>
          </div>
          <Button
            variant="ghost"
            className="self-start"
            onClick={() => (window.location.href = "/order-history")}
          >
            {copy.overlay.historyButton}
          </Button>
        </header>

        {isNotificationPromptVisible && (
          <div className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                <BellRing className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-foreground">
                  Benachrichtigungen aktivieren und Bestellung im Blick behalten
                </p>
                <p className="text-sm text-muted-foreground">
                  Erlaube Push-Mitteilungen, damit wir dich bei Statusänderungen
                  sofort informieren können.
                </p>
              </div>
            </div>
            <Button
              onClick={async () => {
                try {
                  await subscribe();
                } catch {
                  // Fehler wird im NotificationContext behandelt
                }
              }}
              disabled={notificationLoading}
              className="min-w-[160px]"
            >
              {notificationLoading
                ? "Wird aktiviert ..."
                : "Benachrichtigungen aktivieren"}
            </Button>
          </div>
        )}

        <OrderProgressStepper
          status={normalizedStatus}
          getStepContent={(key) => ({
            key,
            title: copy.steps[key].title,
            description: copy.steps[key].description,
            timestamp: formatTimestamp(activeOrder.milestones[key], locale),
          })}
        />

        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-background/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-1 hidden rounded-full bg-primary/15 p-2 text-primary sm:flex">
              <ThumbsUp className="h-4 w-4" />
            </span>
            <div className="space-y-1">
              <p className="font-semibold text-foreground">{activeStepTitle}</p>
              <p className="text-sm text-muted-foreground">
                {activeStepDescription}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              disabled
              aria-disabled="true"
              className="cursor-not-allowed opacity-70"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Bestellung stornieren
            </Button>
            <Button
              variant="ghost"
              disabled
              aria-disabled="true"
              className="cursor-not-allowed opacity-70"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Mit Assistent:in verbinden
            </Button>
          </div>
        </div>

      </div>
    </motion.section>
  );
};

export default OrderTrackingSpotlight;
