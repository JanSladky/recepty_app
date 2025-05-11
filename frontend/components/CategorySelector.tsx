import React from "react";

interface CategorySelectorProps {
  selected: string[];
  onToggle: (category: string) => void;
}

const ALL_CATEGORIES = [
  "Americká", "Asijská", "Bagety", "Bowls", "Burgery", "Česká", "Čínská",
  "Curry", "Dezerty", "Dorty", "Evropská", "Fast Food", "Indická", "Italská",
  "Japonská", "Jihoamerická", "Káva", "Kebab", "Mexická", "Nápoje", "Nudle", "Polévka",
  "Pečivo", "Pizza", "Poke Bowl", "Saláty", "Sendviče", "Smažený sýr", "Steak", "Maso", "Ryby", "Mořské plody",
  "Sushi", "Světová", "Těstoviny", "Thajská", "Turecká", "Vegetarián", "Východní"
];

const CategorySelector: React.FC<CategorySelectorProps> = ({ selected, onToggle }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {ALL_CATEGORIES.map((cat) => (
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
