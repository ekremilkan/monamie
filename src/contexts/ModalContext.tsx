import React, { createContext, useState, useContext } from "react";
import type { ReactNode, FC } from "react";
import type { Product, Order } from "@/types";

interface ModalContextType {
  // Product Detail Modal
  productToShow: Product | null;
  openProductDetailModal: (product: Product) => void;
  closeProductDetailModal: () => void;

  // Address Modal
  isAddressModalOpen: boolean;
  openAddressModal: () => void;
  closeAddressModal: () => void;

  // Auth Modal (moved from AuthContext)
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;

  // Order Details Modal (mobile/tablet)
  orderToShow: Order | null;
  openOrderDetailsModal: (order: Order) => void;
  closeOrderDetailsModal: () => void;

  // Assistant Modal
  isAssistantModalOpen: boolean;
  assistantAnchor: DOMRect | null;
  openAssistantModal: (anchor: DOMRect) => void;
  closeAssistantModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [productToShow, setProductToShow] = useState<Product | null>(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [orderToShow, setOrderToShow] = useState<Order | null>(null);
  const [isAssistantModalOpen, setIsAssistantModalOpen] = useState(false);
  const [assistantAnchor, setAssistantAnchor] = useState<DOMRect | null>(null);

  const openProductDetailModal = (product: Product) => {
    setProductToShow(product);
  };

  const closeProductDetailModal = () => {
    setProductToShow(null);
  };

  const openAddressModal = () => setIsAddressModalOpen(true);
  const closeAddressModal = () => setIsAddressModalOpen(false);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const openOrderDetailsModal = (order: Order) => setOrderToShow(order);
  const closeOrderDetailsModal = () => setOrderToShow(null);
  const openAssistantModal = (anchor: DOMRect) => {
    setAssistantAnchor(anchor);
    setIsAssistantModalOpen(true);
  };
  const closeAssistantModal = () => {
    setIsAssistantModalOpen(false);
    setAssistantAnchor(null);
  };

  const value = {
    productToShow,
    openProductDetailModal,
    closeProductDetailModal,
    isAddressModalOpen,
    openAddressModal,
    closeAddressModal,
    isAuthModalOpen,
    openAuthModal,
    closeAuthModal,
    orderToShow,
    openOrderDetailsModal,
    closeOrderDetailsModal,
    isAssistantModalOpen,
    assistantAnchor,
    openAssistantModal,
    closeAssistantModal,
  };

  return (
    <ModalContext.Provider value={value}>{children}</ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};
