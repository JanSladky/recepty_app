"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Recipe = {
  id: number;
  title: string;
  image_url: string;
  meal_types?: string[];
};

type ShoppingListItem = {
    name: string;
    amount: number;
    unit: string;
};

// --- Komponenta pro zobrazení nákupního seznamu ---
function ShoppingList({ items, onClear }: { items: ShoppingListItem[], onClear: () => void }) {
    const [checkedItems, setCheckedItems] = useState<string[]>([]);

    const toggleChecked = (name: string) => {
        setCheckedItems(prev => 
            prev.includes(name) ? prev.filter(item => item !== name) : [...prev, name]
        );
    };

    const handleCopyToClipboard = () => {
        const listText = items.map(item => `${item.amount} ${item.unit} ${item.name}`).join('\n');
        navigator.clipboard.writeText(listText)
            .then(() => alert('Nákupní seznam zkopírován!'))
            .catch(() => alert('Nepodařilo se zkopírovat seznam.'));
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg mt-8 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Váš nákupní seznam</h2>
                <div>
                    <button 
                        onClick={handleCopyToClipboard}
                        className="bg-blue-100 text-blue-800 hover:bg-blue-200 font-semibold px-4 py-2 rounded-lg text-sm transition mr-2"
                    >
                        Kopírovat
                    </button>
                    <button 
                        onClick={onClear}
                        className="bg-gray-100 text-gray-800 hover:bg-gray-200 font-semibold px-4 py-2 rounded-lg text-sm transition"
                    >
                        Zavřít
                    </button>
                </div>
            </div>
            <ul className="space-y-3">
                {items.map(item => (
                    <li key={item.name} className="flex items-center bg-gray-50 p-3 rounded-lg">
                        <input 
                            type="checkbox"
                            id={`item-${item.name}`}
                            checked={checkedItems.includes(item.name)}
                            onChange={() => toggleChecked(item.name)}
                            className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <label 
                            htmlFor={`item-${item.name}`}
                            className={`ml-3 text-gray-700 flex-grow cursor-pointer ${checkedItems.includes(item.name) ? 'line-through text-gray-400' : ''}`}
                        >
                            <span className="font-bold">{item.amount} {item.unit}</span> {item.name}
                        </label>
                    </li>
                ))}
            </ul>
        </div>
    );
}


// --- Hlavní komponenta stránky ---
export default function DashboardPage() {
  const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([]);
  const [selectedForShopping, setSelectedForShopping] = useState<number[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Načteme email až na klientovi, abychom se vyhnuli chybám při renderování na serveru
    const email = localStorage.getItem("userEmail");
    setUserEmail(email);

    const fetchFavorites = async () => {
      if (!email) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/user/favorites`, {
          headers: { "x-user-email": email },
        });
        const data = await res.json();
        if (res.ok) {
          setFavoriteRecipes(data.favorites);
        } else {
          throw new Error(data.error);
        }
      } catch (error) {
        console.error("Chyba při načítání oblíbených:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
  }, []);

  const toggleSelection = (recipeId: number) => {
    setSelectedForShopping(prev => 
        prev.includes(recipeId) ? prev.filter(id => id !== recipeId) : [...prev, recipeId]
    );
  };

  const handleGenerateList = async () => {
    if (selectedForShopping.length === 0) {
        alert("Vyberte alespoň jeden recept pro vygenerování seznamu.");
        return;
    }
    try {
        const res = await fetch(`${API_URL}/api/user/shopping-list`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipeIds: selectedForShopping })
        });
        const data = await res.json();
        if (res.ok) {
            setShoppingList(data);
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error("Chyba při generování seznamu:", error);
        alert("Nepodařilo se vygenerovat nákupní seznam.");
    }
  };

  if (loading) return <p className="text-center p-10">Načítání...</p>;

  if (!userEmail) {
    return (
        <div className="text-center p-10">
            <h1 className="text-2xl font-bold text-gray-800">Přihlaste se</h1>
            <p className="text-gray-500 mt-2">Pro zobrazení oblíbených receptů a vytváření nákupních seznamů se musíte přihlásit.</p>
        </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-800">Můj dashboard</h1>
            <p className="text-lg text-gray-500 mt-2">Tvoje oblíbené recepty a nákupní seznam na jednom místě.</p>
        </div>
        
        {favoriteRecipes.length > 0 ? (
            <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {favoriteRecipes.map((recipe) => (
                    <div 
                        key={recipe.id} 
                        onClick={() => toggleSelection(recipe.id)}
                        className={`group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden block transform hover:-translate-y-1 cursor-pointer
                                    ${selectedForShopping.includes(recipe.id) ? 'ring-4 ring-green-500' : ''}`}
                    >
                        <Link href={`/recepty/${recipe.id}`} className="block">
                            <div className="relative w-full h-48">
                                <Image
                                    src={recipe.image_url && recipe.image_url.startsWith("http") ? recipe.image_url : `${API_URL}${recipe.image_url}`}
                                    alt={recipe.title}
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                <div className={`absolute top-2 left-2 h-6 w-6 rounded-full border-2 bg-white flex items-center justify-center
                                                ${selectedForShopping.includes(recipe.id) ? 'bg-green-500 border-white' : 'border-gray-400'}`}>
                                    {selectedForShopping.includes(recipe.id) && <span className="text-white">✓</span>}
                                </div>
                            </div>
                            <div className="p-4">
                                <h2 className="text-lg font-bold text-gray-800 truncate">{recipe.title}</h2>
                            </div>
                        </Link>
                    </div>
                ))}
                </div>
                <div className="text-center mt-8">
                    <button 
                        onClick={handleGenerateList}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-4 rounded-lg transition-transform transform hover:scale-105 text-lg disabled:bg-gray-400"
                        disabled={selectedForShopping.length === 0}
                    >
                        Vygenerovat nákupní seznam
                    </button>
                </div>
            </>
        ) : (
            <p className="text-center text-gray-500 mt-10">Zatím nemáte žádné oblíbené recepty. Přidejte si nějaký kliknutím na srdíčko u receptu!</p>
        )}

        {shoppingList && <ShoppingList items={shoppingList} onClear={() => setShoppingList(null)} />}
      </main>
    </div>
  );
}