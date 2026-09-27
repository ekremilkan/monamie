import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { Product } from "@/types";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

type FavoriteItem = {
  product: Product;
  addedAt: number;
};

interface FavoritesContextValue {
  favorites: FavoriteItem[];
  favoriteProducts: Product[];
  isFavorite: (productId: number) => boolean;
  toggleFavorite: (product: Product) => void;
  addFavorite: (product: Product) => void;
  removeFavorite: (productId: number, productName?: string) => void;
  clearFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(
  undefined
);

const STORAGE_PREFIX = "monAmieChicken.favorites";

const resolveProductName = (product: Product): string =>
  product.translations[0]?.name ?? `Ürün #${product.id}`;

const buildStorageKey = (token: string | null): string =>
  `${STORAGE_PREFIX}:${token ?? "guest"}`;

const parseFavorites = (rawValue: string | null): FavoriteItem[] => {
  if (!rawValue) {
    return [];
  }
  try {
    const parsed = JSON.parse(rawValue) as FavoriteItem[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((entry) => ({
        product: entry.product,
        addedAt: entry.addedAt ?? Date.now(),
      }))
      .filter((entry) => Boolean(entry.product?.id));
  } catch (_error) {
    return [];
  }
};

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { token } = useAuth();
  const storageKey = useMemo(() => buildStorageKey(token), [token]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      setFavorites([]);
      setIsInitialized(true);
      return;
    }

    setIsInitialized(false);
    const storedValue = window.localStorage.getItem(storageKey);
    const parsedFavorites = parseFavorites(storedValue);
    setFavorites(parsedFavorites);
    setIsInitialized(true);
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === "undefined" || !isInitialized) {
      return;
    }
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(favorites));
    } catch (error) {
      console.warn("[favorites] LocalStorage write failed:", error);
    }
  }, [favorites, storageKey, isInitialized]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) {
        return;
      }
      setFavorites(parseFavorites(event.newValue));
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [storageKey]);

  const isFavorite = useCallback(
    (productId: number) =>
      favorites.some((item) => item.product.id === productId),
    [favorites]
  );

  const addFavorite = useCallback((product: Product) => {
    setFavorites((prev) => {
      if (prev.some((item) => item.product.id === product.id)) {
        toast.info(`${resolveProductName(product)} zaten favorilerinde`, {
          description: "Dilersen favoriler sayfasından düzenleyebilirsin.",
        });
        return prev;
      }
      const updated = [
        ...prev,
        {
          product,
          addedAt: Date.now(),
        },
      ];
      toast.success(`${resolveProductName(product)} favorilere eklendi`, {
        description: "Favoriler sayfasından kolayca erişebilirsin.",
      });
      return updated;
    });
  }, []);

  const removeFavorite = useCallback(
    (productId: number, productName?: string) => {
      setFavorites((prev) => {
        const updated = prev.filter((item) => item.product.id !== productId);
        if (updated.length !== prev.length) {
          toast("Favorilerden çıkarıldı", {
            description: `${
              productName ?? `Ürün #${productId}`
            } favorilerinden kaldırıldı.`,
          });
        }
        return updated;
      });
    },
    []
  );

  const toggleFavorite = useCallback(
    (product: Product) => {
      setFavorites((prev) => {
        const exists = prev.some((item) => item.product.id === product.id);
        if (exists) {
          const updated = prev.filter(
            (item) => item.product.id !== product.id
          );
          toast("Favorilerden çıkarıldı", {
            description: `${resolveProductName(product)} favorilerinden kaldırıldı.`,
          });
          return updated;
        }
        const updated = [
          ...prev,
          {
            product,
            addedAt: Date.now(),
          },
        ];
        toast.success(`${resolveProductName(product)} favorilere eklendi`, {
          description: "Favoriler sayfasından kolayca yönetebilirsin.",
        });
        return updated;
      });
    },
    []
  );

  const clearFavorites = useCallback(() => {
    setFavorites([]);
    toast("Favoriler temizlendi", {
      description: "Favori listen tertemiz oldu.",
    });
  }, []);

  const favoriteProducts = useMemo(
    () => favorites.map((item) => item.product),
    [favorites]
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favorites,
      favoriteProducts,
      isFavorite,
      toggleFavorite,
      addFavorite,
      removeFavorite,
      clearFavorites,
    }),
    [
      favorites,
      favoriteProducts,
      isFavorite,
      toggleFavorite,
      addFavorite,
      removeFavorite,
      clearFavorites,
    ]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = (): FavoritesContextValue => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error(
      "useFavorites must be used within a FavoritesProvider. Favori butonlarını göstereceğin bileşeni FavoritesProvider ile sarmaladığından emin ol."
    );
  }
  return context;
};
