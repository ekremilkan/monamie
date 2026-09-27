import React from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { AddressProvider } from "@/contexts/AddressContext";
import {
  CartProvider,
  ReviewProvider,
  NotificationProvider,
  OrderTrackingProvider,
  FavoritesProvider,
  LanguageProvider,
} from "@/contexts";
import { ModalProvider } from "@/contexts/ModalContext";
import { SearchProvider } from "@/contexts/SearchContext";
import AppLayout from "./AppLayout";
import OrderHistoryPage from "./OrderHistoryPage";
import OrderDetailsModal from "./OrderDetailsModal";

const OrderHistoryPageWrapper: React.FC = () => (
  <LanguageProvider>
    <AuthProvider>
      <FavoritesProvider>
        <NotificationProvider>
          <OrderTrackingProvider>
            <AddressProvider>
              <CartProvider>
                <SearchProvider>
                  <ModalProvider>
                    <ReviewProvider>
                      <AppLayout>
                        <OrderHistoryPage />
                      </AppLayout>
                      {/* Global modals as siblings of AppLayout */}
                      <OrderDetailsModal />
                    </ReviewProvider>
                  </ModalProvider>
                </SearchProvider>
              </CartProvider>
            </AddressProvider>
          </OrderTrackingProvider>
        </NotificationProvider>
      </FavoritesProvider>
    </AuthProvider>
  </LanguageProvider>
);

export default OrderHistoryPageWrapper;
