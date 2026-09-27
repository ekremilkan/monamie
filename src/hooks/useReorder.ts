import { useCallback } from "react";
import { toast } from "sonner";
import { useCart } from "@/contexts";
import type { Order, Product } from "@/types";

interface ReorderOptions {
  onSuccess?: () => void;
}

// Shared reorder helper hook for copying a full order into the cart.
export const useReorder = () => {
  const { addToCart } = useCart();

  return useCallback(
    (order: Order | null, options?: ReorderOptions) => {
      if (!order) {
        return;
      }

      if (!order.items || order.items.length === 0) {
        toast.error("Sipariş yeniden oluşturulamadı", {
          description: "Bu siparişe ait ürün bulunamadı.",
        });
        return;
      }

      order.items.forEach((item) => {
        const price =
          typeof item.product.price === "string"
            ? item.product.price
            : item.product.price !== undefined
            ? String(item.product.price)
            : item.priceAtPurchase;

        const productForCart: Product = {
          ...item.product,
          price,
          category:
            item.product.category ?? {
              translations: [],
            },
          ingredients: Array.isArray(item.product.ingredients)
            ? item.product.ingredients
            : [],
          translations: Array.isArray(item.product.translations)
            ? item.product.translations
            : [],
        };

        addToCart(productForCart, item.quantity, item.selectedIngredientIds);
      });

      toast.success("Sipariş sepete eklendi", {
        description: `#${order.id} numaralı siparişinizdeki ürünler sepete taşındı.`,
      });

      options?.onSuccess?.();
    },
    [addToCart]
  );
};
