import React, { useEffect, useMemo, useState } from "react";
import { BellPlus, BellRing, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "@/contexts/NotificationContext";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { getNotificationPromptCopy } from "@/lib/i18n/notifications";
import { useLanguage } from "@/contexts";

const NotificationOptInBanner: React.FC = () => {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    shouldShowPrompt,
    shouldShowDeniedReminder,
    snoozePrompt,
    snoozeDeniedReminder,
  } = useNotifications();

  const { locale } = useLanguage();
  const promptCopy = useMemo(
    () => getNotificationPromptCopy(locale),
    [locale]
  );

  const [showHelp, setShowHelp] = useState(false);
  const [iosInstallHint, setIosInstallHint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = window.navigator.userAgent || "";
    const isIosDevice = /iPad|iPhone|iPod/.test(ua);
    const isStandalone = (window.navigator as unknown as { standalone?: boolean })?.standalone;
    const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua) && !/CriOS/.test(ua);

    if (isIosDevice && isSafari && !isStandalone) {
      setIosInstallHint(true);
    }
  }, []);

  const shouldDisplay = useMemo(() => {
    if (!isSupported) return false;
    if (isSubscribed) return false;
    if (permission === "granted") return false;
    return shouldShowPrompt || shouldShowDeniedReminder;
  }, [isSupported, isSubscribed, permission, shouldShowDeniedReminder, shouldShowPrompt]);

  const handleSubscribe = async () => {
    await subscribe();
  };

  const handleDismiss = () => {
    if (permission === "denied") {
      snoozeDeniedReminder();
    } else {
      snoozePrompt();
    }
  };

  const handleHelpToggle = () => {
    setShowHelp((prev) => !prev);
  };

  const combinedError = error;

  return (
    <AnimatePresence>
      {shouldDisplay && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={cn(
            "relative rounded-xl border px-4 py-4 sm:px-6 sm:py-5 shadow-lg transition-colors",
            permission === "denied"
              ? "border-destructive/40 bg-destructive/10 text-destructive-foreground"
              : "border-primary/30 bg-primary/10 text-foreground"
          )}
          role="status"
          aria-live="polite"
        >
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:bg-background/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={promptCopy.helpCloseButton}
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-1 hidden rounded-full bg-primary/15 p-2 text-primary sm:block">
                {permission === "denied" ? (
                  <BellRing className="h-5 w-5" />
                ) : (
                  <BellPlus className="h-5 w-5" />
                )}
              </span>
              <div className="space-y-2">
                <div>
                  <p className="font-heading text-base sm:text-lg">
                    {permission === "denied"
                      ? promptCopy.headlineDenied
                      : promptCopy.headlineGranted}
                  </p>
                  <p className="text-sm text-muted-foreground sm:text-sm">
                    {permission === "denied"
                      ? promptCopy.descriptionDenied
                      : promptCopy.descriptionGranted}
                  </p>
                  {iosInstallHint && permission !== "denied" && (
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {promptCopy.iosHint}
                    </p>
                  )}
                </div>

                {combinedError && (
                  <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {combinedError}
                  </p>
                )}

                {permission === "denied" && showHelp && (
                  <div className="rounded-md bg-background/70 px-3 py-2 text-sm text-muted-foreground">
                    <p className="font-semibold text-foreground">
                      {promptCopy.helpTitle}
                    </p>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      {promptCopy.helpSteps.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {permission === "denied" ? (
                <>
                  <Button
                    onClick={handleHelpToggle}
                    variant="secondary"
                    className="min-h-[44px]"
                  >
                    {showHelp ? promptCopy.helpCloseButton : promptCopy.helpButton}
                  </Button>
                  <Button
                    onClick={() => snoozeDeniedReminder(72)}
                    variant="ghost"
                    className="min-h-[44px]"
                  >
                    {promptCopy.remindLaterButton}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleSubscribe}
                    disabled={isLoading}
                    className="min-h-[44px]"
                  >
                    {isLoading ? promptCopy.loadingLabel : promptCopy.enableButton}
                  </Button>
                  <Button
                    onClick={() => snoozePrompt(12)}
                    variant="ghost"
                    className="min-h-[44px]"
                  >
                    {promptCopy.maybeLaterButton}
                  </Button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationOptInBanner;
