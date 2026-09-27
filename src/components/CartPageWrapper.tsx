import React from "react";
import {
  CartProvider,
  NotificationProvider,
  OrderTrackingProvider,
  ReviewProvider,
  FavoritesProvider,
  LanguageProvider,
} from "@/contexts";
import { AuthProvider } from "@/contexts/AuthContext";
import { AddressProvider } from "@/contexts/AddressContext";
import CartPage from "./CartPage";
import AppLayout from "./AppLayout";
import { ModalProvider } from "@/contexts/ModalContext";
import { SearchProvider } from "@/contexts/SearchContext";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import ProductDetail from "./ProductDetail";
import { useModal } from "@/contexts/ModalContext";

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

const CartPageWrapper: React.FC = () => (
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
                        <CartPage />
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

export default CartPageWrapper;
