import React from "react";

interface SearchOverlayProps {
  isActive: boolean;
  onClose: () => void;
}

const SearchOverlay: React.FC<SearchOverlayProps> = ({ isActive, onClose }) => {
  return (
    <div
      onClick={onClose}
      className={`
        fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300
        ${isActive ? "opacity-100 z-30" : "opacity-0 pointer-events-none -z-10"}
      `}
    />
  );
};

export default SearchOverlay;
