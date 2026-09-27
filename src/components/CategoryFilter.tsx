import React from "react";
import { Button } from "./ui/button";

interface CategoryFilterProps {
  categories: { slug: string; name: string }[];
  activeCategory: string;
  onNavigate: (slug: string) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  activeCategory,
  onNavigate,
}) => {
  return (
    <div className="space-y-2">
      {categories.map((category) => (
        <Button
          key={category.slug}
          type="button"
          onClick={() => onNavigate(category.slug)}
          aria-current={activeCategory === category.slug ? "true" : "false"}
          variant={activeCategory === category.slug ? "default" : "secondary"}
          className="w-full justify-start min-h-[44px] rounded-lg font-semibold whitespace-nowrap truncate px-4 py-3"
          title={category.name}
        >
          <span className="truncate">{category.name}</span>
        </Button>
      ))}
    </div>
  );
};

export default CategoryFilter;
