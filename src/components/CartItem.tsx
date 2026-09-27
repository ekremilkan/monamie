import React, { useMemo } from "react";
import { useCart, type CartItem as CartItemType, useLanguage } from "@/contexts";
import { Button } from "./ui/button";
import { Trash2, Plus, Minus } from "lucide-react";

interface CartItemProps {
  item: CartItemType;
}

const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const { removeFromCart, updateQuantity } = useCart();
  const { locale, t } = useLanguage();
  const intlLocale = locale === "de" ? "de-DE" : "en-GB";
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(intlLocale, {
        style: "currency",
        currency: "EUR",
      }),
    [intlLocale]
  );
  const formatCurrency = (value: number) => currencyFormatter.format(value);

  // Seçili malzemeleri bul
  const selectedIngredients = item.ingredients.filter(ing => 
    item.selectedIngredients.includes(ing.ingredientId)
  );

  // Ekstra malzemeler (opsiyonel ve seçili olanlar)
  const extraIngredients = selectedIngredients.filter(ing => !ing.isRequired);
  
  // Temel zorunlu malzemeler
  const baseIngredients = selectedIngredients.filter(ing => ing.isRequired);

  return (
    <div className="bg-card shadow-md hover:shadow-lg transition-shadow duration-200 p-3 sm:p-4 md:p-6 rounded-lg border border-border">
      <div className="flex gap-3 sm:gap-4">
        {/* Ürün Görseli */}
        <img
          src="https://placehold.co/400x400/png?text=Product"
          alt={item.translations[0].name}
          width={96}
          height={96}
          loading="lazy"
          decoding="async"
          className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-md object-cover flex-shrink-0 shadow-sm"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "https://placehold.co/400x400/png?text=Product";
          }}
        />

        {/* Ürün Detayları */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Üst Kısım - İsim ve Fiyat */}
          <div className="flex justify-between items-start mb-2 sm:mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-heading font-bold text-foreground text-base sm:text-lg md:text-xl leading-tight truncate">
                {item.translations[0].name}
              </h3>
              {item.translations[0].description && (
                <p className="text-muted text-xs sm:text-sm mt-1 line-clamp-2 hidden sm:block">
                  {item.translations[0].description}
                </p>
              )}
            </div>
            <p className="font-heading font-bold text-foreground text-base sm:text-lg md:text-xl whitespace-nowrap ml-2 sm:ml-4">
              {formatCurrency(Number(item.price))}
            </p>
          </div>

          {/* Özelleştirmeler - Mobilde sadeleştirilmiş */}
          {selectedIngredients.length > 0 && (
            <div className="mb-2 sm:mb-4">
              <p className="text-xs sm:text-sm font-medium text-muted mb-1 sm:mb-2">
                {t("cart.item.ingredientsLabel")}
              </p>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {baseIngredients.map((ing) => (
                  <span 
                    key={ing.ingredientId}
                    className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs font-medium bg-secondary text-secondary-foreground"
                  >
                    {ing.ingredient.name}
                  </span>
                ))}
                {extraIngredients.map((ing) => (
                  <span 
                    key={ing.ingredientId}
                    className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs font-medium bg-accent text-accent-foreground border border-accent-foreground/20"
                  >
                    + {ing.ingredient.name}
                   {ing.ingredient.price && Number(ing.ingredient.price) > 0 && (
                      <span className="ml-0.5 sm:ml-1 font-semibold">
                        ({formatCurrency(Number(ing.ingredient.price))})
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Alt Kısım - Miktar Kontrolü ve Sil */}
          <div className="flex justify-between items-center mt-auto">
            {/* Miktar Kontrolü - Mobilde daha kompakt */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                size="icon"
                variant="outline"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors p-0"
                onClick={() => updateQuantity(item.cartItemId, -1)}
              >
                <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <span className="text-foreground font-bold text-base sm:text-lg w-8 sm:w-10 text-center">
                {item.quantity}
              </span>
              <Button
                size="icon"
                variant="outline"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors p-0"
                onClick={() => updateQuantity(item.cartItemId, 1)}
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>

            {/* Sil Butonu - Mobilde sadece ikon */}
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors px-2 sm:px-3"
              onClick={() => removeFromCart(item.cartItemId)}
            >
              <Trash2 className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">
                {t("cart.item.remove")}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
