// src/components/CategorySelector.tsx
import React from "react";
import { CUISINE_CATEGORIES, MEALTYPE_CATEGORIES } from "@/constants/categories";

interface CategorySelectorProps {
  selected: string[];
  onToggle: (category: string) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ selected, onToggle }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {[...CUISINE_CATEGORIES, ...MEALTYPE_CATEGORIES].map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => onToggle(cat)}
          className={`px-3 py-1 rounded-full border text-sm transition-all ${
            selected.includes(cat)
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-800 border-gray-300 hover:bg-gray-100"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
};

export default CategorySelector;