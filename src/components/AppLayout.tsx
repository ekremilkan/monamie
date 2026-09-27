import React, { useEffect, useState } from "react";
import type { ReactNode } from "react";
import SideNavbar from "./SideNavbar";
import BottomNavbar from "./BottomNavbar";
import MobileHeader from "./MobileHeader";
import DesktopHeader from "./DesktopHeader";
import AuthModal from "./AuthModal";
import AddressModal from "./AddressModal";
import AssistantModal from "./AssistantModal";
import ProductDetail from "./ProductDetail";
import { useModal } from "@/contexts/ModalContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Toaster } from "sonner";

const GlobalModals: React.FC = () => {
  const {
    productToShow,
    closeProductDetailModal,
    isAddressModalOpen,
    closeAddressModal,
  } = useModal();

  return (
    <>
      <AuthModal />
      <AddressModal />
      <AssistantModal />
      <Dialog open={!!productToShow} onOpenChange={closeProductDetailModal}>
        <DialogContent className="bg-card border-none text-foreground p-0">
          {productToShow && (
            <ProductDetail
              product={productToShow}
              onClose={closeProductDetailModal}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [currentPath, setCurrentPath] = useState(
    typeof window !== "undefined" ? window.location.pathname : ""
  );

  useEffect(() => {
    const onRouteChange = () => {
      setCurrentPath(window.location.pathname);
    };
    document.addEventListener("astro:after-swap", onRouteChange);
    return () => {
      document.removeEventListener("astro:after-swap", onRouteChange);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="md:hidden">
        <MobileHeader />
        <main className="container mx-auto p-4 pb-24" data-scroll-container>
          <div className="space-y-4">{children}</div>
        </main>
        <BottomNavbar currentPath={currentPath} />
      </div>
      <div className="hidden md:grid md:grid-cols-[250px_1fr] md:grid-rows-[auto_1fr] h-screen">
        <div className="col-span-2">
          <DesktopHeader />
        </div>
        <div className="row-start-2">
          <SideNavbar currentPath={currentPath} className="h-full" />
        </div>
        <main className="row-start-2 overflow-y-auto p-8" data-scroll-container>
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>

      <GlobalModals />
      <Toaster richColors position="top-center" />
    </div>
  );
};

export default AppLayout;
