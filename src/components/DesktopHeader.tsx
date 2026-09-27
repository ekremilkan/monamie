import React, { useRef, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAddress } from "@/contexts/AddressContext";
import { useModal } from "@/contexts/ModalContext";
import { MapPin, LifeBuoy } from "lucide-react";
import { Button } from "./ui/button";
import SearchBar from "./SearchBar";
import { useLanguage } from "@/contexts";

const DesktopHeader: React.FC = () => {
  const { token } = useAuth();
  const { activeAddress } = useAddress();
  const { openAddressModal, openAssistantModal } = useModal();
  const { t } = useLanguage();

  const handleAssistantOpen = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    openAssistantModal(event.currentTarget.getBoundingClientRect());
  };
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [forceCloseSearch, setForceCloseSearch] = useState(false);

  const label = activeAddress
    ? activeAddress.title || activeAddress.street
    : t("navigation.desktop.selectAddress");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setForceCloseSearch(true);
      } else {
        setForceCloseSearch(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="flex h-16 items-center justify-between gap-4 sm:gap-6 border-b border-secondary bg-card px-4 sm:px-6">
      {/* Logo */}
      {/* <div className="flex-shrink-0 text-primary font-bold font-heading text-xl sm:text-2xl">
        Mon Amie Chicken
      </div> */}

      <img
        src="/images/logo.jpg"
        alt="Mon Amie Chicken Logo"
        width={282}
        height={113}
        loading="eager"
        decoding="async"
        className="h-16 w-auto"
      />

      {/* Adres ve Arama */}
      <div className="flex flex-grow items-center gap-3 sm:gap-4">
        {token && (
          <Button
            variant="ghost"
            className="flex flex-shrink-0 items-center gap-2 rounded-full text-foreground hover:bg-secondary h-auto py-2 px-3 min-h-[44px]"
            onClick={openAddressModal}
          >
            <MapPin className="h-5 w-5 text-primary" />
            <div className="text-left min-w-0 whitespace-nowrap">
              <span className="text-xs text-muted">
                {t("navigation.desktop.deliverTo")}
              </span>
              <p className="font-heading font-semibold -mt-1 truncate max-w-[220px]">
                {label}
              </p>
            </div>
          </Button>
        )}

        <div className="flex-grow" ref={searchContainerRef}>
          <SearchBar forceClose={forceCloseSearch} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          className="flex-shrink-0 text-muted-foreground hover:bg-secondary h-auto py-2 px-3 min-h-[40px]"
          onClick={handleAssistantOpen}
        >
          <LifeBuoy className="h-6 w-6 mr-2" />
          <div className="text-left">
            <p className="font-semibold text-sm">
              {t("navigation.desktop.help")}
            </p>
          </div>
        </Button>
      </div>
    </header>
  );
};

export default DesktopHeader;
