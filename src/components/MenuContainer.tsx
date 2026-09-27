import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "@/types";
import { useModal } from "@/contexts/ModalContext";
import ProductCard from "./ProductCard";
import { useLanguage } from "@/contexts";

const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

interface MenuContainerProps {
  products: Product[];
}

const MenuContainer: React.FC<MenuContainerProps> = ({ products }) => {
  const { openProductDetailModal } = useModal();
  const { t } = useLanguage();

  const categories = useMemo(() => {
    const names = Array.from(
      new Set(
        products.map(
          (p) =>
            p.category.translations[0]?.name ||
            t("menu.categoryFallback") as string
        )
      )
    );
    return names.map((name) => ({ slug: slugify(name), name }));
  }, [products, t]);

  const productsByCategory = useMemo(() => {
    const map: Record<string, Product[]> = {};
    for (const p of products) {
      const name =
        p.category.translations[0]?.name ||
        (t("menu.categoryFallback") as string);
      const slug = slugify(name);
      if (!map[slug]) map[slug] = [];
      map[slug].push(p);
    }
    return map;
  }, [products, t]);

  const [activeCategory, setActiveCategory] = useState(
    categories[0]?.slug || ""
  );
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const categoryButtonRefs = useRef<Record<string, HTMLButtonElement | null>>(
    {}
  );
  const menuBarRef = useRef<HTMLDivElement | null>(null);

  // Scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const slug = entry.target.getAttribute("data-category");
            if (slug) setActiveCategory(slug);
          }
        }
      },
      { rootMargin: "-120px 0px -60% 0px", threshold: 0.2 }
    );

    categories.forEach((c) => {
      const el = sectionRefs.current[c.slug];
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [categories]);

  useEffect(() => {
    const btn = categoryButtonRefs.current[activeCategory];
    if (!btn) return;
    btn.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeCategory]);

  const handleNavigate = (slug: string) => {
    setActiveCategory(slug);
    const el = sectionRefs.current[slug];
    if (!el) return;

    // Menü çubuğunun yüksekliğini al
    const menuEl = menuBarRef.current;
    const menuHeight = menuEl?.offsetHeight ?? 0;

    // Mobil mi desktop mı kontrol et
    const isMobile = window.innerWidth < 768;

    // Sticky pozisyonunu hesaba kat
    const stickyOffset = isMobile ? 88 : 0; // mobile header height veya 0

    // Element pozisyonunu al ve scroll yap
    const elementTop = el.getBoundingClientRect().top + window.scrollY;
    const scrollTarget = elementTop - stickyOffset - menuHeight - 24;

    window.scrollTo({ top: scrollTarget, behavior: "smooth" });
  };

  return (
    <div className="text-foreground max-w-7xl mx-auto">
      {/* Video placeholder alanı */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gray-900 text-white aspect-[9/15] max-h-[70vh] sm:max-h-none sm:aspect-video flex items-center justify-center shadow-2xl">
          <video
            className="absolute inset-0 h-full w-full object-cover block sm:hidden"
            playsInline
            autoPlay
            muted
            loop
          >
            <source src="/videos/mobile-video.mp4" type="video/mp4" />
          </video>
          <video
            className="absolute inset-0 h-full w-full object-cover hidden sm:block"
            playsInline
            autoPlay
            muted
            loop
          >
            <source src="/videos/desktop-video.mp4" type="video/mp4" />
          </video>
        </div>
      </div>

      {/* Ana Menü Bölümü */}
      <div className="p-3 sm:p-4 md:p-8">
        <h1
          id="menu-section"
          className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold pb-6 text-primary"
        >
          {t("menu.heading")}
        </h1>

        {/* ✅ Sticky yatay kategori menüsü */}
        <div
          ref={menuBarRef}
          className="sticky top-[var(--mobile-header-height,5.5rem)] md:-top-8 z-10 mb-6"
        >
          <div className="bg-white rounded-xl shadow-sm border p-3 overflow-x-auto no-scrollbar">
            <div className="flex gap-3 min-w-max">
              {categories.map((c) => (
                <button
                  key={c.slug}
                  ref={(el) =>
                    (categoryButtonRefs.current[c.slug] =
                      el as HTMLButtonElement | null)
                  }
                  onClick={() => handleNavigate(c.slug)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    activeCategory === c.slug
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ✅ Ürün listesi */}
        <main className="space-y-10 sm:space-y-12">
          {categories.map((c) => {
            const list = productsByCategory[c.slug] || [];
            return (
              <section
                key={c.slug}
                data-category={c.slug}
                ref={(el) =>
                  (sectionRefs.current[c.slug] = el as HTMLDivElement | null)
                }
              >
                <h3 className="font-heading text-xl sm:text-2xl font-bold mb-4 text-foreground">
                  {c.name}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-6">
                  {list.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      onProductClick={() => openProductDetailModal(p)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </main>
      </div>
    </div>
  );
};

export default MenuContainer;
