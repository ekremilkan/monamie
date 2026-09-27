import React from "react";
import { LayoutGrid, List, Sparkles, Heart, ArrowRight } from "lucide-react";
import { clsx } from "clsx";
import ProductCard from "./ProductCard";
import { Button } from "./ui/button";
import { useFavorites } from "@/contexts";
import { useModal } from "@/contexts/ModalContext";

type ViewMode = "grid" | "list";

const FavoritesPage: React.FC = () => {
  const { favoriteProducts, clearFavorites } = useFavorites();
  const { openProductDetailModal } = useModal();
  const [viewMode, setViewMode] = React.useState<ViewMode>("grid");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");

  const isEmpty = favoriteProducts.length === 0;

  const categories = React.useMemo(() => {
    const counts = favoriteProducts.reduce<Record<string, number>>(
      (acc, product) => {
        const label = product.category?.translations?.[0]?.name ?? "Diğer";
        acc[label] = (acc[label] ?? 0) + 1;
        return acc;
      },
      {}
    );
    return Object.entries(counts)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => a.label.localeCompare(b.label, "tr"));
  }, [favoriteProducts]);

  const filteredProducts = React.useMemo(() => {
    if (selectedCategory === "all") {
      return favoriteProducts;
    }
    return favoriteProducts.filter((product) => {
      const label = product.category?.translations?.[0]?.name ?? "Diğer";
      return label === selectedCategory;
    });
  }, [favoriteProducts, selectedCategory]);

  const handleClearFavorites = () => {
    if (favoriteProducts.length === 0) {
      return;
    }
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(
        "Tüm favorilerini temizlemek istediğine emin misin?"
      );
      if (!confirmed) {
        return;
      }
    }
    clearFavorites();
    setSelectedCategory("all");
  };

  const renderCards = () =>
    filteredProducts.map((product) => (
      <ProductCard
        key={product.id}
        product={product}
        onProductClick={() => openProductDetailModal(product)}
      />
    ));

  return (
    <div className="space-y-10 pb-16">
      {isEmpty ? (
        <section className="rounded-3xl border-2 border-dashed border-border/60 bg-card/50 p-10 text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Heart className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="font-heading text-2xl">
              Favori ürün eklemek için kalp ikonuna tıkla
            </h2>
            <p className="text-muted max-w-xl mx-auto">
              Beğendiğin her ürün için kalp ikonuna dokunduğunda, burada sana
              özel bir liste oluşturuyoruz. Hazırsan menüye uğrayıp ilk favorini
              seçebilirsin.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <a href="/menu">
                Menüye git
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </section>
      ) : (
        <>
          <section className="rounded-3xl border border-border/40 bg-card/70 p-4 sm:p-6 lg:flex lg:items-center lg:justify-between lg:gap-6">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={clsx(
                  "px-4 py-2 text-sm font-medium rounded-full transition-colors",
                  selectedCategory === "all"
                    ? "bg-primary text-primary-foreground shadow"
                    : "bg-background/80 border border-border/60 text-muted-foreground hover:text-foreground"
                )}
              >
                Tümü
                <span className="ml-2 text-xs text-muted-foreground">
                  {favoriteProducts.length}
                </span>
              </button>
              {categories.map(({ label, count }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setSelectedCategory(label)}
                  className={clsx(
                    "px-4 py-2 text-sm font-medium rounded-full transition-colors",
                    selectedCategory === label
                      ? "bg-primary text-primary-foreground shadow"
                      : "bg-background/80 border border-border/60 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {count}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 lg:mt-0">
              <div className="flex items-center rounded-full border border-border/60 bg-background/80 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={clsx(
                    "flex items-center justify-center gap-2 rounded-full px-3 py-1 text-sm transition-colors",
                    viewMode === "grid"
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                  Grid
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={clsx(
                    "flex items-center justify-center gap-2 rounded-full px-3 py-1 text-sm transition-colors",
                    viewMode === "list"
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <List className="h-4 w-4" />
                  Liste
                </button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={handleClearFavorites}
              >
                Listeyi temizle
              </Button>
            </div>
          </section>

          {filteredProducts.length === 0 ? (
            <section className="rounded-3xl border border-dashed border-border/60 bg-card/60 p-8 text-center space-y-4">
              <h3 className="font-heading text-xl">
                Bu kategoride henüz favorin yok
              </h3>
              <p className="text-muted max-w-lg mx-auto">
                {selectedCategory} kategorisinde favori eklediğinde burada
                göreceksin. Diğer kategorilerdeki favorilerini inceleyebilir ya
                da yeni lezzetler keşfedebilirsin.
              </p>
              <div className="flex justify-center">
                <Button
                  onClick={() => setSelectedCategory("all")}
                  variant="outline"
                >
                  Filtreyi sıfırla
                </Button>
              </div>
            </section>
          ) : viewMode === "grid" ? (
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {renderCards()}
            </section>
          ) : (
            <section className="space-y-4">{renderCards()}</section>
          )}
        </>
      )}

      <section className="rounded-3xl border border-border/40 bg-card/80 p-6 sm:p-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h3 className="font-heading text-2xl text-foreground">
            Bir sonraki siparişin için ilham al
          </h3>
          <p className="text-muted max-w-xl">
            Favorilerinde sakladığın ürünleri sepete ekle, yanında önerilen sos
            ve menülerle deneyimini tamamla. Hızlı sipariş için favorilerini
            doğrudan Checkout&apos;a taşıyabilirsin.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <a href="/cart">Sepeti görüntüle</a>
          </Button>
          <Button asChild>
            <a href="/checkout">
              Sipariş vermeye başla
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default FavoritesPage;
