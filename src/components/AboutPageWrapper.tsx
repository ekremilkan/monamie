import React from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { AddressProvider } from "@/contexts/AddressContext";
import {
  CartProvider,
  NotificationProvider,
  OrderTrackingProvider,
  ReviewProvider,
  FavoritesProvider,
  LanguageProvider,
} from "@/contexts";
import { ModalProvider } from "@/contexts/ModalContext";
import { SearchProvider } from "@/contexts/SearchContext";
import AppLayout from "./AppLayout";
import AboutPage from "./AboutPage";

const AboutPageWrapper: React.FC = () => (
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
                        <AboutPage />
                      </AppLayout>
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

export default AboutPageWrapper;
