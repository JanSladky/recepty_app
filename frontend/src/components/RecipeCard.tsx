type Ingredient = {
  id: number;
  name: string;
  amount: number;
  unit: string;
};

type Recipe = {
  id: number;
  title: string;
  category: string;
  ingredients?: Ingredient[]; // ← přidáme otazník = může chybět
};

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <div className="border rounded-md p-4 shadow bg-white">
      <h2 className="text-xl font-bold">{recipe.title}</h2>
      <p className="text-gray-600">{recipe.category}</p>
      <ul className="mt-2 text-sm">
        {recipe.ingredients?.map((ing) => (
          <li key={ing.id}>
            {ing.name} – {ing.amount} {ing.unit}
          </li>
        ))}
      </ul>
    </div>
  );
}
