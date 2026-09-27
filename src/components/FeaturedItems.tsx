import React, { useState, useEffect } from "react";
import { useModal } from "@/contexts/ModalContext";
import type { Product } from "@/types";
import ProductCard from "./ProductCard";
import { buildApiUrl } from "@/lib/api";
import { useLanguage } from "@/contexts";

const FeaturedItems: React.FC = () => {
  const { openProductDetailModal } = useModal();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const { t } = useLanguage();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(buildApiUrl("/api/products"));
        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }
        const allProducts: Product[] = await response.json();
        // Sadece ilk 4 ürünü alıyoruz.
        setProducts(allProducts.slice(0, 4));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // TODO: ProductCard'a tıklandığında modal'ı açacak mantığı buraya eklememiz gerekecek.
  // Şimdilik onProductClick prop'una boş bir fonksiyon veriyoruz.
  const handleProductClick = (product: Product) => {
    openProductDetailModal(product); // Global fonksiyonu çağır
  };

  if (loading) {
    return (
      <p className="text-center text-muted">
        {t("home.featuredItems.loading")}
      </p>
    );
  }

  return (
    <section className="my-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-heading text-2xl font-bold text-foreground">
          {t("home.featuredItems.title")}
        </h2>
        <a
          href="/menu"
          className="font-semibold text-sm text-primary hover:underline"
        >
          {t("home.featuredItems.cta")}
        </a>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onProductClick={() => handleProductClick(product)}
          />
        ))}
      </div>
    </section>
  );
};

export default FeaturedItems;
