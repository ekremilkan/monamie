import React from "react";
import { useSearch } from "@/contexts/SearchContext";
import ProductCard from "./ProductCard"; // ProductCard'ı burada kullanacağız!
import { useModal } from "@/contexts/ModalContext";

const SearchResults: React.FC = () => {
  const { results, isLoading, searchTerm } = useSearch();
  const { openProductDetailModal } = useModal();

  const handleResultClick = (product: any) => {
    openProductDetailModal(product);
  };

  if (isLoading) {
    return (
      <p className="p-6 sm:p-8 text-center text-muted text-sm sm:text-base">
        Searching for delicious food...
      </p>
    );
  }

  if (searchTerm.length > 2 && results.length === 0) {
    return (
      <p className="p-6 sm:p-8 text-center text-muted text-sm sm:text-base">
        No results found for "{searchTerm}"
      </p>
    );
  }

  if (results.length > 0) {
    return (
      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
        {results.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onProductClick={() => handleResultClick(product)}
          />
        ))}
      </div>
    );
  }

  // Arama başlamadan önceki "iştah açıcı" ekran
  return (
    <div className="p-6 sm:p-8 text-center">
      <h3 className="font-heading text-lg sm:text-xl md:text-2xl font-bold text-foreground">
        Find Your Craving
      </h3>
      <p className="text-muted mt-2 text-sm sm:text-base">
        Search for burgers, tenders, or anything else you desire.
      </p>
    </div>
  );
};

export default SearchResults;
