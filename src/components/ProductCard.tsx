import React from "react";
import type { Product } from "@/types";
import { Heart } from "lucide-react";
import { clsx } from "clsx";
import { useFavorites } from "@/contexts";

interface ProductCardProps {
  product: Product;
  onProductClick: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onProductClick,
}) => {
  const name = product.translations[0]?.name;
  const description = product.translations[0]?.description;
  const rating = 4.8;
  const { isFavorite, toggleFavorite } = useFavorites();
  const isProductFavorite = isFavorite(product.id);

  const fallbackImage = "https://placehold.co/400x400/png?text=Product";
  const resolvedImage = fallbackImage; // Always use placeholder as requested

  const handleFavoriteToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    toggleFavorite(product);
  };

  return (
    <div
      onClick={onProductClick}
      className={clsx(
        "relative h-full bg-card rounded-2xl shadow-subtle flex sm:flex-row p-4 gap-4 transition-transform hover:scale-[1.02] duration-300 cursor-pointer",
        isProductFavorite && "ring-2 ring-primary/40"
      )}
    >
      <button
        type="button"
        aria-label={
          isProductFavorite
            ? `${name ?? "Bu ürün"} favorilerden çıkar`
            : `${name ?? "Bu ürün"} favorilere ekle`
        }
        aria-pressed={isProductFavorite}
        onClick={handleFavoriteToggle}
        className={clsx(
          "absolute top-4 right-4 w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-transparent flex items-center justify-center transition-all duration-300 shadow-md backdrop-blur",
          "hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/60",
          isProductFavorite
            ? "bg-rose-500 text-white hover:bg-rose-600 scale-105"
            : "bg-background/80 text-muted-foreground border-border hover:text-rose-500"
        )}
      >
        <Heart
          className="h-5 w-5"
          fill={isProductFavorite ? "currentColor" : "none"}
        />
      </button>

      {isProductFavorite && (
        <span className="absolute top-4 left-4 bg-primary/15 text-primary text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full pointer-events-none shadow-sm">
          Favori
        </span>
      )}

      {/* Görsel */}
      <img
        src={resolvedImage}
        alt={name}
        width={112}
        height={112}
        loading="lazy"
        decoding="async"
        className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover flex-shrink-0"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = fallbackImage;
        }}
      />

      {/* İçerik */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="min-w-0 pr-12 sm:pr-16">
          <h2 className="font-heading font-bold text-base sm:text-lg text-foreground leading-tight line-clamp-2">
            {name}
          </h2>
          <p className="text-muted text-sm mt-1 line-clamp-2">{description}</p>
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-2">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-accent"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-foreground text-sm font-semibold ml-1">
                  {rating}
                </span>
              </div>
              <p className="font-heading text-xl sm:text-2xl text-value mt-1">
                ${Number(product.price).toFixed(2)}
              </p>
            </div>

            <button className="bg-primary text-primary-foreground rounded-full w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center font-bold text-2xl hover:bg-primary/90 transition-all duration-300 shadow-md hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary">
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
