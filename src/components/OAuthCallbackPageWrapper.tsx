import React from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import {
  NotificationProvider,
  OrderTrackingProvider,
  LanguageProvider,
} from "@/contexts";
import OAuthCallbackWrapper from "@/components/OAuthCallbackWrapper";

const OAuthCallbackPageWrapper: React.FC = () => (
  <LanguageProvider>
    <AuthProvider>
      <NotificationProvider>
        <OrderTrackingProvider>
          <OAuthCallbackWrapper />
        </OrderTrackingProvider>
      </NotificationProvider>
    </AuthProvider>
  </LanguageProvider>
);

export default OAuthCallbackPageWrapper;
