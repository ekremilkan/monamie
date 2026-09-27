import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
} from "react";
import type { ReactNode, FC } from "react";
import type { Product } from "@/types";
import { buildApiUrl } from "@/lib/api";

interface SearchContextType {
  searchTerm: string;
  results: Product[];
  isLoading: boolean;
  isSearchActive: boolean; // YENİ: Arama arayüzü aktif mi?
  setSearchTerm: (term: string) => void;
  openSearch: () => void; // YENİ: Arama arayüzünü açar
  closeSearch: () => void; // YENİ: Arama arayüzünü kapatır
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [searchTerm, setSearchTermState] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const performSearch = async (term: string) => {
    if (term.length > 2) {
      setIsLoading(true);
      try {
        const response = await fetch(
          buildApiUrl(`/api/products/search?q=${term}`)
        );
        if (!response.ok) throw new Error("Search failed");
        const data = await response.json();
        setResults(data);
      } catch (error) {
        console.error(error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    } else {
      setResults([]);
    }
  };

  const setSearchTerm = (term: string) => {
    setSearchTermState(term);
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      performSearch(term);
    }, 500); // 500ms debounce
  };

  const openSearch = () => setIsSearchActive(true);
  const closeSearch = () => {
    setIsSearchActive(false);
    setSearchTermState("");
    setResults([]);
  };

  const value = {
    searchTerm,
    results,
    isLoading,
    isSearchActive,
    setSearchTerm,
    openSearch,
    closeSearch,
  };

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
};
