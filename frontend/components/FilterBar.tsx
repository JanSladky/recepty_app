"use client";

type Props = {
  selected: string[];
  onChange: (selected: string[]) => void;
};

const categories = ["Asie", "Pizza", "Kebab", "Salát", "Maso", "Vegan", "Ryby"];

export default function FilterBar({ selected, onChange }: Props) {
  const toggle = (category: string) => {
    if (selected.includes(category)) {
      onChange(selected.filter((c) => c !== category));
    } else {
      onChange([...selected, category]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => toggle(category)}
          className={`px-3 py-1 rounded-full border ${
            selected.includes(category)
              ? "bg-blue-500 text-white"
              : "bg-white text-black"
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}