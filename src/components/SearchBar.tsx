import React, { forwardRef } from "react";
import { useSearch } from "@/contexts/SearchContext";
import { Search } from "lucide-react";
import SearchResults from "./SearchResults";
import { Input } from "./ui/input";

interface SearchBarProps {
  isMobile?: boolean;
  forceClose?: boolean; // YENİ: Desktop'ta dışarı tıklandığında kapanması için
}

const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  ({ isMobile = false, forceClose = false }, ref) => {
    const { searchTerm, setSearchTerm, isSearchActive, openSearch } =
      useSearch();

    return (
      <div className="relative w-full">
        <Input
          ref={ref}
          type="search"
          label="Was möchtest du heute essen?"
          containerClassName="w-full"
          leadingIcon={<Search className="h-4 w-4 sm:h-5 sm:w-5" />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={openSearch}
        />

        {!isMobile && isSearchActive && !forceClose && (
          <div className="absolute top-full mt-2 w-full max-h-[70vh] overflow-y-auto rounded-lg border border-secondary bg-card shadow-lg z-50">
            <SearchResults />
          </div>
        )}
      </div>
    );
  }
);

export default SearchBar;
