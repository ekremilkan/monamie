import React, { createContext, useState, useContext, useEffect } from "react";
import type { ReactNode, FC } from "react";
import type { Product } from "@/types";
import { useAuth } from "./AuthContext";
import { buildApiUrl } from "@/lib/api";

// 1. ADIM: CartItem TİPİNİ GÜNCELLEME
export interface CartItem extends Product {
  cartItemId: string;
  quantity: number;
  selectedIngredients: number[];
}

// 2. ADIM: SÖZLEŞMEYİ YENİ VERİ YAPISINA GÖRE GÜNCELLEME
interface CartContextType {
  cartItems: CartItem[];
  isLoading: boolean; // YENİ: Yükleme durumunu dışarıya açıyoruz
  addToCart: (
    product: Product,
    quantity: number,
    selectedIngredients: number[]
  ) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, amount: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const GUEST_CART_STORAGE_KEY = "mon-amie-chicken-cart";

export const CartProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { token } = useAuth(); // Kullanıcının kimliğini buradan alıyoruz
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Veri yüklenirken durumu yönetmek için

  // --- MANTIK 1: GİRİŞ DURUMU DEĞİŞTİĞİNDE SEPETİ YÜKLEME ---
  useEffect(() => {
    const loadCart = async () => {
      setIsLoading(true);
      try {
        if (token) {
          // KULLANICI GİRİŞ YAPMIŞSA:
          // 1. Sunucudaki sepeti çek
          const serverResponse = await fetch(buildApiUrl("/api/cart"), {
            headers: { Authorization: `Bearer ${token}` },
          });
          const serverCart = await serverResponse.json();

          // 2. Misafir sepetini localStorage'dan al
          const guestCartJSON = window.localStorage.getItem(
            GUEST_CART_STORAGE_KEY
          );
          const guestCart: CartItem[] = guestCartJSON
            ? JSON.parse(guestCartJSON)
            : [];

          // 3. İki sepeti birleştir (varsa)
          const mergedCart = [...serverCart, ...guestCart]; // Basit bir birleştirme
          // TODO: Daha gelişmiş bir birleştirme (aynı ürünlerin adetlerini toplama) yapılabilir.

          setCartItems(mergedCart);

          // 4. Birleştirilmiş sepeti sunucuya geri kaydet ve misafir sepetini temizle
          if (guestCart.length > 0) {
            await fetch(buildApiUrl("/api/cart"), {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(mergedCart),
            });
            window.localStorage.removeItem(GUEST_CART_STORAGE_KEY);
          }
        } else {
          // KULLANICI MİSAFİRSE:
          const guestCartJSON = window.localStorage.getItem(
            GUEST_CART_STORAGE_KEY
          );
          setCartItems(guestCartJSON ? JSON.parse(guestCartJSON) : []);
        }
      } catch (error) {
        console.error("Failed to load cart:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCart();
  }, [token]); // Bu etki, sadece 'token' değiştiğinde (giriş/çıkış yapıldığında) çalışır.

  // --- MANTIK 2: SEPET DEĞİŞTİĞİNDE KAYDETME ---
  useEffect(() => {
    // Yükleme devam ederken veya ilk render'da kaydetme yapma.
    if (isLoading) return;

    const saveCart = async () => {
      try {
        if (token) {
          // Giriş yapmış kullanıcı için sunucuya kaydet
          await fetch(buildApiUrl("/api/cart"), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(cartItems),
          });
        } else {
          // Misafir kullanıcı için localStorage'a kaydet
          window.localStorage.setItem(
            GUEST_CART_STORAGE_KEY,
            JSON.stringify(cartItems)
          );
        }
      } catch (error) {
        console.error("Failed to save cart:", error);
      }
    };

    saveCart();
  }, [cartItems, token, isLoading]);

  // 3. ADIM: addToCart FONKSİYONUNU TAMAMEN YENİDEN YAZMA
  const addToCart = (
    product: Product,
    quantity: number,
    selectedIngredients: number[]
  ) => {
    setCartItems((prevItems) => {
      // Her özelleştirme için benzersiz bir kimlik oluşturuyoruz.
      const cartItemId = `${product.id}-${JSON.stringify(
        selectedIngredients.sort()
      )}`;

      const existingItem = prevItems.find(
        (item) => item.cartItemId === cartItemId
      );

      if (existingItem) {
        // Eğer aynı ürün ve aynı özelleştirme zaten varsa, sadece miktarını artır.
        return prevItems.map((item) =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Eğer yoksa, yeni bir sepet öğesi olarak ekle.
        const newItem: CartItem = {
          ...product,
          cartItemId,
          quantity: quantity,
          selectedIngredients: selectedIngredients,
        };
        return [...prevItems, newItem];
      }
    });
  };

  // 4. ADIM: Diğer fonksiyonları 'cartItemId' kullanacak şekilde güncelleme
  const removeFromCart = (cartItemId: string) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.cartItemId !== cartItemId)
    );
  };

  const updateQuantity = (cartItemId: string, amount: number) => {
    setCartItems((prevItems) =>
      prevItems
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            return { ...item, quantity: item.quantity + amount };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const value = {
    cartItems,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
