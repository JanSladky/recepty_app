import React from "react";

interface CategorySelectorProps {
  selected: string[];
  onToggle: (category: string) => void;
}

/**
 * Kategorie kuchyní pro rozbalovací výběr.
 */
export const CUISINE_CATEGORIES = [
  "Italská", "Česká", "Asijská", "Mexická", "Indická", "Japonská",
  "Americká", "Evropská", "Thajská", "Turecká", "Čínská"
];

/**
 * Kategorie typu jídla (např. suroviny, forma pokrmu) pro rozbalovací výběr.
 */
export const MEALTYPE_CATEGORIES = [
  "Maso", "Ryby", "Mořské plody", "Sýr", "Sendviče", "Těstoviny",
  "Pizza", "Polévka", "Pečivo", "Dezerty", "Káva", "Nápoje"
];

/**
 * Komponenta pro výběr kategorií pomocí tlačítek.
 * (volitelně můžeš později použít např. při editaci receptu)
 */
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