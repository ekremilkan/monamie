import React, { Fragment, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { normalizeOrderStatus } from "@/contexts/OrderTrackingContext";
import { BadgeCheck, Bike, ChefHat, ThumbsUp } from "lucide-react";
import type { OrderStatus } from "@/types";

const STEP_SEQUENCE = [
  "order_received",
  "preparing",
  "on_the_way",
  "delivered",
] as const;

export type StepKey = (typeof STEP_SEQUENCE)[number];

const STEP_ICONS: Record<
  StepKey,
  React.ComponentType<{ className?: string }>
> = {
  order_received: ThumbsUp,
  preparing: ChefHat,
  on_the_way: Bike,
  delivered: BadgeCheck,
};

export interface StepContent {
  key: StepKey;
  title: string;
  description: string;
  timestamp: string | null;
}

interface OrderProgressStepperProps {
  status: OrderStatus | StepKey | "cancelled";
  getStepContent: (key: StepKey) => StepContent;
  className?: string;
  showMobileVariant?: boolean;
}

const circleStyles: Record<"completed" | "active" | "upcoming", string> = {
  completed:
    "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/30",
  active:
    "border-primary bg-primary/90 text-primary-foreground shadow-lg shadow-primary/40",
  upcoming: "border-border bg-background text-muted-foreground",
};

const OrderProgressStepper: React.FC<OrderProgressStepperProps> = ({
  status,
  getStepContent,
  className,
  showMobileVariant = true,
}) => {
  const normalized = useMemo(() => {
    if (
      status === "order_received" ||
      status === "preparing" ||
      status === "on_the_way" ||
      status === "delivered" ||
      status === "cancelled"
    ) {
      return status;
    }
    return normalizeOrderStatus(status);
  }, [status]);

  const activeIndex = useMemo(() => {
    if (normalized === "cancelled") {
      return -1;
    }
    return STEP_SEQUENCE.indexOf(normalized as StepKey);
  }, [normalized]);

  const activeStepContent =
    activeIndex >= 0 ? getStepContent(STEP_SEQUENCE[activeIndex]) : null;
  const ActiveIcon =
    activeIndex >= 0 ? STEP_ICONS[STEP_SEQUENCE[activeIndex]] : null;

  return (
    <div className={cn("space-y-4", className)}>
      <div
        className="hidden w-full max-w-3xl sm:mx-auto sm:grid"
        style={{
          gridTemplateColumns: `repeat(${STEP_SEQUENCE.length * 2 - 1}, minmax(0, 1fr))`,
          gridTemplateRows: "auto auto",
          columnGap: "0.75rem",
          rowGap: "0.5rem",
        }}
      >
        {STEP_SEQUENCE.map((key, index) => {
          const state =
            activeIndex > index
              ? "completed"
              : activeIndex === index
              ? "active"
              : "upcoming";
          const content = getStepContent(key);
          const iconColumn = index * 2 + 1;
          return (
            <Fragment key={key}>
              <div
                className="flex items-center justify-center"
                style={{ gridColumn: iconColumn, gridRow: 1 }}
              >
                <span
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300",
                    circleStyles[state]
                  )}
                >
                  {React.createElement(STEP_ICONS[key], {
                    className: "h-5 w-5",
                  })}
                </span>
              </div>

              {index < STEP_SEQUENCE.length - 1 && (
                <div
                  className="relative flex items-center"
                  style={{ gridColumn: iconColumn + 1, gridRow: 1 }}
                >
                  <div className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-border" />
                  <motion.div
                    className="absolute left-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-primary"
                    initial={false}
                    animate={{
                      width: activeIndex >= index + 1 ? "100%" : "0%",
                    }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                  />
                </div>
              )}

              <div
                className="flex flex-col items-center gap-1 text-center"
                style={{ gridColumn: iconColumn, gridRow: 2 }}
              >
                <p
                  className={cn(
                    "text-xs font-medium",
                    state === "completed" || state === "active"
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {content.title}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {content.timestamp ?? "--:--"}
                </p>
              </div>
            </Fragment>
          );
        })}
      </div>
      {/* Mobile active-only variant (optional) */}
      {showMobileVariant && (
        <div className="flex flex-col gap-3 rounded-2xl border border-primary/15 bg-primary/5 p-3 sm:hidden">
          {normalized === "cancelled" ? (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-destructive">
                Bestellung storniert
              </p>
              <p className="text-xs text-muted-foreground">
                Diese Bestellung wurde storniert und wird nicht weiter verfolgt.
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 bg-background",
                  activeIndex >= 0 ? circleStyles.active : circleStyles.upcoming
                )}
              >
                {ActiveIcon && <ActiveIcon className="h-4 w-4" />}
              </span>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  {activeStepContent?.title ?? "--"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {activeStepContent?.description ?? ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {activeStepContent?.timestamp ?? "--:--"}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
      {normalized === "cancelled" && (
        <p className="text-center text-xs font-medium text-destructive sm:text-sm">
          Bestellung wurde storniert.
        </p>
      )}
    </div>
  );
};

export default OrderProgressStepper;
