import React from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { AddressProvider } from "@/contexts/AddressContext";
import {
  CartProvider,
  FavoritesProvider,
  NotificationProvider,
  OrderTrackingProvider,
  ReviewProvider,
  LanguageProvider,
} from "@/contexts";
import { ModalProvider, useModal } from "@/contexts/ModalContext";
import { SearchProvider } from "@/contexts/SearchContext";
import AppLayout from "./AppLayout";
import FavoritesPage from "./FavoritesPage";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import ProductDetail from "./ProductDetail";

const GlobalProductModal: React.FC = () => {
  const { productToShow, closeProductDetailModal } = useModal();
  return (
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
  );
};

const FavoritesPageWrapper: React.FC = () => (
  <LanguageProvider>
    <AuthProvider>
      <FavoritesProvider>
        <NotificationProvider>
          <OrderTrackingProvider>
            <AddressProvider>
              <CartProvider>
                <ModalProvider>
                  <SearchProvider>
                    <ReviewProvider>
                      <AppLayout>
                        <FavoritesPage />
                      </AppLayout>
                      <GlobalProductModal />
                    </ReviewProvider>
                  </SearchProvider>
                </ModalProvider>
              </CartProvider>
            </AddressProvider>
          </OrderTrackingProvider>
        </NotificationProvider>
      </FavoritesProvider>
    </AuthProvider>
  </LanguageProvider>
);

export default FavoritesPageWrapper;
