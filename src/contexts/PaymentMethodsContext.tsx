import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { PaymentMethod } from "@/types";
import { useAuth } from "./AuthContext";
import { buildApiUrl } from "@/lib/api";

interface PaymentMethodsContextType {
  paymentMethods: PaymentMethod[];
  loading: boolean;
  error: string | null;
  fetchPaymentMethods: () => Promise<void>;
  addPaymentMethod: (paymentMethodId: string) => Promise<void>;
  deletePaymentMethod: (id: number) => Promise<void>;
  setDefaultPaymentMethod: (id: number) => Promise<void>;
  createSetupIntent: () => Promise<string>;
}

const PaymentMethodsContext = createContext<PaymentMethodsContextType | undefined>(undefined);

export const PaymentMethodsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const fetchPaymentMethods = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(buildApiUrl("/api/payment-methods"), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch payment methods");
      }

      const data = await response.json();
      setPaymentMethods(data);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      setError("Zahlungsmethoden konnten nicht geladen werden");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createSetupIntent = useCallback(async (): Promise<string> => {
    if (!token) {
      throw new Error("Not authenticated");
    }

    try {
      const response = await fetch(buildApiUrl("/api/payment-methods/setup"), {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to create setup intent");
      }

      const data = await response.json();
      return data.clientSecret;
    } catch (error) {
      console.error("Error creating setup intent:", error);
      throw new Error("Setup Intent konnte nicht erstellt werden");
    }
  }, [token]);

  const addPaymentMethod = useCallback(async (paymentMethodId: string) => {
    if (!token) return;

    try {
      const response = await fetch(buildApiUrl("/api/payment-methods"), {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paymentMethodId }),
      });

      if (!response.ok) {
        throw new Error("Failed to add payment method");
      }

      const newPaymentMethod = await response.json();
      setPaymentMethods(prev => [newPaymentMethod, ...prev]);
    } catch (error) {
      console.error("Error adding payment method:", error);
      throw new Error("Zahlungsmethode konnte nicht hinzugefügt werden");
    }
  }, [token]);

  const deletePaymentMethod = useCallback(async (id: number) => {
    if (!token) return;

    try {
      const response = await fetch(buildApiUrl(`/api/payment-methods/${id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to delete payment method");
      }

      setPaymentMethods(prev => prev.filter(method => method.id !== id));
    } catch (error) {
      console.error("Error deleting payment method:", error);
      throw new Error("Zahlungsmethode konnte nicht gelöscht werden");
    }
  }, [token]);

  const setDefaultPaymentMethod = useCallback(async (id: number) => {
    if (!token) return;

    try {
      const response = await fetch(buildApiUrl(`/api/payment-methods/${id}/default`), {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to set default payment method");
      }

      // Tüm payment methods'ları güncelle
      setPaymentMethods(prev => 
        prev.map(method => ({
          ...method,
          isDefault: method.id === id
        }))
      );
    } catch (error) {
      console.error("Error setting default payment method:", error);
      throw new Error("Standard-Zahlungsmethode konnte nicht gesetzt werden");
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchPaymentMethods();
    }
  }, [token, fetchPaymentMethods]);

  const value: PaymentMethodsContextType = {
    paymentMethods,
    loading,
    error,
    fetchPaymentMethods,
    addPaymentMethod,
    deletePaymentMethod,
    setDefaultPaymentMethod,
    createSetupIntent,
  };

  return (
    <PaymentMethodsContext.Provider value={value}>
      {children}
    </PaymentMethodsContext.Provider>
  );
};

export const usePaymentMethods = () => {
  const context = useContext(PaymentMethodsContext);
  if (context === undefined) {
    throw new Error("usePaymentMethods must be used within a PaymentMethodsProvider");
  }
  return context;
};
