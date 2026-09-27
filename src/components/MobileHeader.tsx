import React, { useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAddress } from "@/contexts/AddressContext";
import { useModal } from "@/contexts/ModalContext";
import { MapPin, Bot } from "lucide-react";
import { Button } from "./ui/button";
import SearchBar from "./SearchBar";
import { useSearch } from "@/contexts/SearchContext";
import SearchResults from "./SearchResults";
import { useLanguage } from "@/contexts";

const MobileHeader: React.FC = () => {
  const { token } = useAuth();
  const { activeAddress } = useAddress();
  const { openAddressModal, openAssistantModal } = useModal();
  const { isSearchActive, closeSearch } = useSearch();
  const { t } = useLanguage();

  const label = activeAddress
    ? activeAddress.title || activeAddress.street
    : t("navigation.mobile.selectAddress");

  // Input ref for mobile search focus
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  const handleAssistantOpen = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    openAssistantModal(event.currentTarget.getBoundingClientRect());
  };

  // Focus the search input when search becomes active
  useEffect(() => {
    if (isSearchActive) {
      setTimeout(() => {
        mobileInputRef.current?.focus();
      }, 100);
    }
  }, [isSearchActive]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (isSearchActive) {
      document.documentElement.style.removeProperty("--mobile-header-height");
      return;
    }

    const headerEl = headerRef.current;
    if (!headerEl) {
      return;
    }

    const updateHeaderHeight = () => {
      document.documentElement.style.setProperty(
        "--mobile-header-height",
        `${headerEl.offsetHeight}px`
      );
    };

    updateHeaderHeight();

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver((_entries) => {
            updateHeaderHeight();
          })
        : null;

    resizeObserver?.observe(headerEl);
    window.addEventListener("resize", updateHeaderHeight);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateHeaderHeight);
      document.documentElement.style.removeProperty("--mobile-header-height");
    };
  }, [isSearchActive]);

  // If search mode is active, render the full-screen search UI
  if (isSearchActive) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <div className="flex items-center gap-2 bg-primary p-3 sm:p-4 shadow-md flex-shrink-0">
          <div className="flex-grow">
            <SearchBar ref={mobileInputRef} isMobile={true} />
          </div>
          <Button
            variant="ghost"
            onClick={closeSearch}
            className="text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground min-h-[40px] sm:min-h-[44px] px-3"
          >
            {t("navigation.mobile.cancelSearch")}
          </Button>
        </div>

        <div className="flex-grow mt-4 overflow-y-auto px-4">
          <SearchResults />
        </div>
      </div>
    );
  }

  // Otherwise, render the standard mobile header
  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 w-full border-b border-secondary bg-background/95 backdrop-blur-sm"
    >
      <div className="container mx-auto flex flex-col gap-3 sm:gap-4 p-3 sm:p-4">
        <div className="flex justify-between items-center">
          <img
            src="/images/logo.jpg"
            alt="Mon Amie Chicken Logo"
            width={282}
            height={113}
            loading="eager"
            decoding="async"
            className="h-16 w-auto"
          />

          {token && (
            <Button
              variant="ghost"
              className="flex items-center gap-2 text-foreground hover:bg-secondary rounded-full h-auto py-2 px-3 min-h-[44px]"
              onClick={openAddressModal}
            >
              <MapPin className="h-5 w-5 text-primary" />
              <div className="text-left min-w-0 whitespace-nowrap">
                <span className="text-xs text-muted">
                  {t("navigation.mobile.deliverTo")}
                </span>
                <p className="font-heading font-semibold -mt-1 truncate max-w-[160px] sm:max-w-[200px]">
                  {label}
                </p>
              </div>
            </Button>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:bg-secondary"
              onClick={handleAssistantOpen}
              aria-label={t("navigation.mobile.assistantAria")}
            >
              <Bot className="h-6 w-6" />
            </Button>
          </div>
        </div>

        <div className="mt-2">
          <SearchBar isMobile={true} />
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;
