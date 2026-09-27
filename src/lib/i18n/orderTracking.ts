import {
  getBrowserLocale,
  resolveLocale,
  type SupportedLocale,
} from "./shared";

type StepKey = "order_received" | "preparing" | "on_the_way" | "delivered";

interface OrderTrackingCopy {
  badges: Record<string, string>;
  steps: Record<StepKey, { title: string; description: string }>;
  overlay: {
    heading: string;
    orderNumberLabel: string;
    totalLabel: string;
    orderedAtLabel: string;
    autoDismissLabel: string;
    autoDismissFallback: string;
    cancelledInfo: string;
    defaultInfo: string;
    historyButton: string;
    hideButton: string;
  };
  history: {
    reorderLabel: string;
    detailsLabel: string;
    orderLabel: string;
  };
}

const ORDER_TRACKING_TRANSLATIONS: Record<SupportedLocale, OrderTrackingCopy> =
  {
    de: {
      badges: {
        order_received: "Bestellung erhalten",
        preparing: "Wird zubereitet",
        on_the_way: "Unterwegs",
        delivered: "Zugestellt",
        cancelled: "Storniert",
        pending_payment: "Zahlung ausstehend",
        processing: "Wird verarbeitet",
        shipped: "Unterwegs",
      },
      steps: {
        order_received: {
          title: "Bestellung erhalten",
          description:
            "Wir haben deine Bestellung erhalten und bestätigen sie gerade.",
        },
        preparing: {
          title: "Wird zubereitet",
          description:
            "Unser Team bereitet deine Speisen frisch in der Küche zu.",
        },
        on_the_way: {
          title: "Unterwegs",
          description: "Deine Bestellung wurde abgeholt und ist auf dem Weg.",
        },
        delivered: {
          title: "Zugestellt",
          description: "Guten Appetit! Wir hoffen, alles schmeckt dir.",
        },
      },
      overlay: {
        heading: "Live-Status deiner Bestellung",
        orderNumberLabel: "Bestellnummer",
        totalLabel: "Gesamt",
        orderedAtLabel: "Bestellt um",
        autoDismissLabel: "Automatisches Ausblenden in",
        autoDismissFallback:
          "Wir aktualisieren den Status automatisch, sobald sich etwas ändert.",
        cancelledInfo:
          "Diese Bestellung wurde storniert. Bitte wende dich bei Fragen an unser Team.",
        historyButton: "Zur Bestellübersicht",
        hideButton: "Ausblenden",
        defaultInfo:
          "Wir aktualisieren den Status automatisch, sobald sich etwas ändert.",
      },
      history: {
        reorderLabel: "Erneut bestellen",
        detailsLabel: "Details",
        orderLabel: "Bestellung",
      },
    },
    en: {
      badges: {
        order_received: "Order received",
        preparing: "Being prepared",
        on_the_way: "On the way",
        delivered: "Delivered",
        cancelled: "Cancelled",
        pending_payment: "Payment pending",
        processing: "Processing",
        shipped: "On the way",
      },
      steps: {
        order_received: {
          title: "Order received",
          description: "We’ve received your order and are confirming it now.",
        },
        preparing: {
          title: "Being prepared",
          description: "Our kitchen is preparing everything fresh for you.",
        },
        on_the_way: {
          title: "On the way",
          description: "Your order has been picked up and is heading to you.",
        },
        delivered: {
          title: "Delivered",
          description: "Enjoy your meal! We hope you love it.",
        },
      },
      overlay: {
        heading: "Live status of your order",
        orderNumberLabel: "Order number",
        totalLabel: "Total",
        orderedAtLabel: "Ordered at",
        autoDismissLabel: "Automatically hiding in",
        autoDismissFallback:
          "We’ll update the status automatically as soon as something changes.",
        cancelledInfo:
          "This order was cancelled. Please contact our team if you have any questions.",
        historyButton: "Order history",
        hideButton: "Hide",
        defaultInfo:
          "We’ll update the status automatically as soon as something changes.",
      },
      history: {
        reorderLabel: "Order again",
        detailsLabel: "Details",
        orderLabel: "Order",
      },
    },
  };

export const getOrderTrackingCopy = (
  locale?: string | null
): OrderTrackingCopy => {
  return ORDER_TRACKING_TRANSLATIONS[resolveLocale(locale)];
};

export const getDefaultOrderTrackingCopy = (): OrderTrackingCopy =>
  getOrderTrackingCopy(getBrowserLocale());
