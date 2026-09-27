import { getBrowserLocale, resolveLocale, type SupportedLocale } from "./shared";

interface NotificationPromptCopy {
  headlineGranted: string;
  headlineDenied: string;
  descriptionGranted: string;
  descriptionDenied: string;
  iosHint: string;
  enableButton: string;
  maybeLaterButton: string;
  helpButton: string;
  helpCloseButton: string;
  helpTitle: string;
  helpSteps: string[];
  remindLaterButton: string;
  loadingLabel: string;
  loginRequired: string;
  genericError: string;
}

const PROMPT_TRANSLATIONS: Record<SupportedLocale, NotificationPromptCopy> = {
  de: {
    headlineGranted: "Bleib über deine Bestellung auf dem Laufenden",
    headlineDenied: "Push-Benachrichtigungen aktuell deaktiviert",
    descriptionGranted:
      "Erlaube Push-Benachrichtigungen und erhalte Echtzeit-Updates zu Lieferstatus, Abholzeit und exklusiven Angeboten.",
    descriptionDenied:
      "Aktiviere Benachrichtigungen in deinen Browser-Einstellungen, damit wir dich sofort informieren können, sobald sich etwas ändert.",
    iosHint:
      "iOS-Tipp: Füge unsere Seite über das Teilen-Menü zu deinem Home-Bildschirm hinzu. Anschließend kannst du Benachrichtigungen aktivieren.",
    enableButton: "Benachrichtigungen aktivieren",
    maybeLaterButton: "Vielleicht später",
    helpButton: "Hilfe anzeigen",
    helpCloseButton: "Hinweis schließen",
    helpTitle: "So aktivierst du Benachrichtigungen:",
    helpSteps: [
      "Öffne die Einstellungen deines Browsers oder Geräts.",
      'Suche nach "Benachrichtigungen" und erlaube sie für Mon Amie Chicken.',
      "Lade die Seite danach neu, damit die Änderung aktiv wird.",
    ],
    remindLaterButton: "Später erinnern",
    loadingLabel: "Aktivieren…",
    loginRequired: "Bitte melde dich an, um Benachrichtigungen zu aktivieren.",
    genericError:
      "Push-Benachrichtigungen konnten nicht aktiviert werden. Bitte versuche es später erneut.",
  },
  en: {
    headlineGranted: "Stay informed about your order",
    headlineDenied: "Push notifications are currently disabled",
    descriptionGranted:
      "Allow push notifications to receive live updates about delivery status, pickup time, and exclusive offers.",
    descriptionDenied:
      "Enable notifications in your browser settings so we can notify you the moment the status changes.",
    iosHint:
      "iOS tip: Add our site to your home screen via the share menu. Afterwards you can enable notifications.",
    enableButton: "Enable notifications",
    maybeLaterButton: "Maybe later",
    helpButton: "Show help",
    helpCloseButton: "Close help",
    helpTitle: "How to enable notifications:",
    helpSteps: [
      "Open your browser or device settings.",
      'Find "Notifications" and allow them for Mon Amie Chicken.',
      "Reload the page afterwards so the change takes effect.",
    ],
    remindLaterButton: "Remind me later",
    loadingLabel: "Enabling…",
    loginRequired: "Please sign in to enable notifications.",
    genericError:
      "We were unable to enable push notifications. Please try again later.",
  },
};

export const getNotificationPromptCopy = (
  locale?: string | null
): NotificationPromptCopy => {
  return PROMPT_TRANSLATIONS[resolveLocale(locale)];
};

export const getDefaultNotificationPromptCopy =
  (): NotificationPromptCopy => getNotificationPromptCopy(getBrowserLocale());
