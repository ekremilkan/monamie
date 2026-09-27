import React from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { AddressProvider } from "@/contexts/AddressContext";
import {
  CartProvider,
  NotificationProvider,
  OrderTrackingProvider,
  FavoritesProvider,
  LanguageProvider,
} from "@/contexts";
import { ModalProvider } from "@/contexts/ModalContext";
import { SearchProvider } from "@/contexts/SearchContext";
import { ReviewProvider } from "@/contexts";
import AppLayout from "./AppLayout";
import MenuContainer from "./MenuContainer";
import type { Product } from "@/types";

// GlobalProductModal'ı AppLayout'tan buraya taşıdık
import { Dialog, DialogContent } from "@/components/ui/dialog";
import ProductDetail from "./ProductDetail";
import { useModal } from "@/contexts/ModalContext";

// GlobalProductModal'ı buraya, kendi dosyası yerine, direkt Wrapper'ın içine koyabiliriz.
const GlobalProductModal: React.FC = () => {
  const { productToShow, closeProductDetailModal } = useModal();
  return (
    <Dialog open={!!productToShow} onOpenChange={closeProductDetailModal}>
      <DialogContent className="bg-card border-none text-foreground p-0 flex flex-col overflow-hidden">
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

interface MenuAppProps {
  products: Product[];
}

const MenuApp: React.FC<MenuAppProps> = ({ products }) => {
  return (
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
                          <MenuContainer products={products} />
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
};

export default MenuApp;
