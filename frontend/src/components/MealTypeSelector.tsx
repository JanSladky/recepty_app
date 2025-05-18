// src/components/MealTypeSelector.tsx
"use client";

import React from "react";
import { ALL_MEAL_TYPES } from "@/constants/categories";

interface MealTypeSelectorProps {
  selected: string[];
  onToggle: (type: string) => void;
}

const MealTypeSelector: React.FC<MealTypeSelectorProps> = ({ selected, onToggle }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {ALL_MEAL_TYPES.map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onToggle(type)}
          className={`px-3 py-1 rounded-full border text-sm transition-all ${
            selected.includes(type)
              ? "bg-green-600 text-white"
              : "bg-white text-gray-800 border-gray-300 hover:bg-gray-100"
          }`}
        >
          {type}
        </button>
      ))}
    </div>
  );
};

export default MealTypeSelector;