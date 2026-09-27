import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, Plus, Minus } from "lucide-react";
import type { Product } from "@/types";
import { useCart, useLanguage } from "@/contexts";

interface ProductDetailProps {
  product: Product;
  onClose: () => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product, onClose }) => {
  const { addToCart } = useCart();
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

  const ingredients = Array.isArray(product.ingredients)
    ? product.ingredients
    : [];
  const translation = product.translations?.[0];
  const productName = translation?.name ?? t("productDetail.fallbackName");
  const productDescription = translation?.description;

  const [selectedIngredients, setSelectedIngredients] = useState<number[]>(() =>
    ingredients
      .filter((item) => item.isDefaultSelected)
      .map((item) => item.ingredientId)
  );

  const [quantity, setQuantity] = useState(1);

  const handleIngredientToggle = (ingredientId: number) => {
    setSelectedIngredients((prevSelected) => {
      if (prevSelected.includes(ingredientId)) {
        return prevSelected.filter((id) => id !== ingredientId);
      }
      return [...prevSelected, ingredientId];
    });
  };

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedIngredients);
    onClose();
  };

  const requiredIngredients = ingredients.filter((i) => i.isRequired);
  const extraIngredients = ingredients.filter((i) => !i.isRequired);

  return (
    <div className="flex h-full flex-col text-foreground">
      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
        <div className="space-y-6">
          {product.imageUrl && (
            <img
              src="https://placehold.co/800x400/png?text=Product"
              alt={productName}
              width={720}
              height={320}
              loading="lazy"
              decoding="async"
              className="h-48 w-full rounded-xl object-cover shadow-sm md:h-56"
            />
          )}

          <div className="space-y-3 border-b border-border/60 pb-4">
            <h2 className="font-heading font-bold text-xl leading-snug tracking-tight text-primary sm:text-2xl break-words line-clamp-3">
              {productName}
            </h2>
            {productDescription && (
              <p className="text-sm italic leading-relaxed text-muted-foreground sm:text-base">
                {productDescription}
              </p>
            )}
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-heading text-xl font-bold text-foreground">
                {t("productDetail.ingredients.title")}
              </h3>
            </div>
            <div className="space-y-2">
              {requiredIngredients.map((item) => {
                const isSelected = selectedIngredients.includes(
                  item.ingredientId
                );
                return (
                  <div
                    key={item.ingredientId}
                    className={`group flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors
                        ${
                          isSelected
                            ? "border-border bg-transparent"
                            : "border-primary bg-primary/10"
                        }`}
                    onClick={() => handleIngredientToggle(item.ingredientId)}
                    role="button"
                    aria-pressed={isSelected}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`font-medium ${
                          isSelected
                            ? "text-foreground"
                            : "text-primary line-through decoration-primary"
                        }`}
                      >
                        {item.ingredient.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {isSelected ? (
                        <Check className="h-5 w-5 text-value" />
                      ) : (
                        <X className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {extraIngredients.length > 0 && (
            <div>
              <h3 className="mb-3 font-heading text-xl font-bold text-foreground">
                {t("productDetail.extra.title")}
              </h3>
              <div className="space-y-2">
                {extraIngredients.map((item) => {
                  const isSelected = selectedIngredients.includes(
                    item.ingredientId
                  );
                  return (
                    <div
                      key={item.ingredientId}
                      className={`group flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors
                          ${
                            isSelected
                              ? "border-value bg-value/10"
                              : "border-border"
                          }`}
                      onClick={() => handleIngredientToggle(item.ingredientId)}
                      role="button"
                      aria-pressed={isSelected}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {item.ingredient.name}
                        </span>
                        <span className="font-semibold text-value">
                          +{formatCurrency(Number(item.ingredient.price))}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {isSelected ? (
                          <Check className="h-5 w-5 text-value" />
                        ) : (
                          <Plus className="h-5 w-5 text-muted" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 z-10 border-t border-border/70 bg-background px-4 py-4 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] md:px-6 md:py-5 rounded-full">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-full bg-secondary p-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full text-foreground hover:bg-secondary"
              aria-label={t("productDetail.quantity.decreaseAria")}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center font-semibold text-foreground">
              {quantity}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full text-foreground hover:bg-secondary"
              aria-label={t("productDetail.quantity.increaseAria")}
              onClick={() => setQuantity((q) => q + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <Button
            onClick={handleAddToCart}
            size="lg"
            className="flex-1 text-lg font-bold"
          >
            {t("productDetail.addToCart")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
