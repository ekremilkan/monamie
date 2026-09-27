import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import type { ReactNode, FC } from "react";
import type { Address } from "@/types";
import { useAuth } from "./AuthContext";
import { buildApiUrl } from "@/lib/api";

const ACTIVE_ADDRESS_STORAGE_KEY = "activeAddressId";

const getStoredActiveAddressId = () => {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(ACTIVE_ADDRESS_STORAGE_KEY);
  if (!stored) return null;
  const parsed = parseInt(stored, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

// 1. SÖZLEŞMEYE YENİ FONKSİYONU EKLE
interface AddressContextType {
  addresses: Address[];
  activeAddress: Address | null;
  isAddressModalOpen: boolean;
  setActiveAddress: (address: Address) => void;
  openAddressModal: () => void;
  closeAddressModal: () => void;
  addAddress: (newAddressData: Omit<Address, "id" | "userId">) => Promise<void>;
  deleteAddress: (addressId: number) => Promise<void>; // Silme fonksiyonunun sözleşmesi
  updateAddress: (address: Address) => Promise<void>; // YENİ
}

const AddressContext = createContext<AddressContextType | undefined>(undefined);

export const AddressProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { token } = useAuth();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [activeAddress, setActiveAddressState] = useState<Address | null>(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  const fetchAddresses = useCallback(async () => {
    if (!token) {
      setAddresses([]);
      setActiveAddressState(null);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(ACTIVE_ADDRESS_STORAGE_KEY);
      }
      return;
    }
    try {
      const response = await fetch(buildApiUrl("/api/addresses"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch addresses");
      const data: Address[] = await response.json();
      setAddresses(data);

      // Daha önce seçilen adresi localStorage üzerinden geri yükle
      if (typeof window !== "undefined") {
        const storedActiveId = getStoredActiveAddressId();
        if (storedActiveId) {
          const matchingAddress = data.find(
            (addr) => addr.id === storedActiveId
          );
          if (matchingAddress) {
            setActiveAddressState(matchingAddress);
            return;
          }
        }
      }

      if (data.length === 0) {
        setActiveAddressState(null);
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(ACTIVE_ADDRESS_STORAGE_KEY);
        }
        return;
      }

      if (!activeAddress && data.length > 0) {
        setActiveAddressState(data[0]);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            ACTIVE_ADDRESS_STORAGE_KEY,
            data[0].id.toString()
          );
        }
      }
    } catch (error) {
      console.error(error);
    }
  }, [token, activeAddress]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const openAddressModal = () => setIsAddressModalOpen(true);
  const closeAddressModal = () => setIsAddressModalOpen(false);

  const setActiveAddress = (address: Address) => {
    setActiveAddressState(address);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        ACTIVE_ADDRESS_STORAGE_KEY,
        address.id.toString()
      );
    }
  };

  const addAddress = async (newAddressData: Omit<Address, "id" | "userId">) => {
    console.log("Gönderilen adres verisi:", newAddressData); // BUNU EKLEYİN
    if (!token) return;
    if (addresses.length >= 5) {
      throw new Error(
        "Sie können nicht mehr als 5 Adressen hinzufügen. Bitte löschen Sie eine bestehende Adresse, um eine neue hinzuzufügen."
      );
    }
    try {
      const response = await fetch(buildApiUrl("/api/addresses"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newAddressData),
      });
      if (!response.ok) throw new Error("Failed to add address");
      const createdAddress: Address = await response.json();
      const enhancedAddress: Address = {
        ...createdAddress,
        ...newAddressData,
        id: createdAddress.id,
        userId: createdAddress.userId,
      };
      setAddresses((prev) => [...prev, enhancedAddress]);
      setActiveAddress(enhancedAddress);
      await fetchAddresses();
      closeAddressModal();
    } catch (error) {
      console.error(error);
      throw error; // Hatanın UI tarafında yakalanabilmesi için yeniden fırlat
    }
  };

  const deleteAddress = async (addressId: number) => {
    if (!token) return;
    try {
      const response = await fetch(
        buildApiUrl(`/api/addresses/${addressId}`),
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error("Failed to delete address");

      // Başarılı olursa, adresi frontend'deki listeden de anında kaldır.
      setAddresses((prev) => {
        const updated = prev.filter((addr) => addr.id !== addressId);
        if (activeAddress?.id === addressId) {
          const fallback = updated[0] ?? null;
          setActiveAddressState(fallback);
          if (typeof window !== "undefined") {
            if (fallback) {
              window.localStorage.setItem(
                ACTIVE_ADDRESS_STORAGE_KEY,
                fallback.id.toString()
              );
            } else {
              window.localStorage.removeItem(ACTIVE_ADDRESS_STORAGE_KEY);
            }
          }
        }
        return updated;
      });
    } catch (error) {
      console.error(error);
      throw error; // Hatanın UI tarafında yakalanabilmesi için yeniden fırlat
    }
  };

  const updateAddress = async (addressToUpdate: Address) => {
    if (!token) return;
    try {
      const response = await fetch(
        buildApiUrl(`/api/addresses/${addressToUpdate.id}`),
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            street: addressToUpdate.street,
            city: addressToUpdate.city,
            zipCode: addressToUpdate.zipCode,
            details: addressToUpdate.details,
            title: addressToUpdate.title,
          }),
        }
      );
      if (!response.ok) throw new Error("Failed to update address");
      await fetchAddresses();
      closeAddressModal();
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  // 3. YENİ FONKSİYONU YAYINA EKLE
  const value = {
    addresses,
    activeAddress,
    isAddressModalOpen,
    setActiveAddress,
    openAddressModal,
    closeAddressModal,
    addAddress,
    deleteAddress,
    updateAddress,
  };

  return (
    <AddressContext.Provider value={value}>{children}</AddressContext.Provider>
  );
};

export const useAddress = () => {
  const context = useContext(AddressContext);
  if (context === undefined) {
    throw new Error("useAddress must be used within an AddressProvider");
  }
  return context;
};
