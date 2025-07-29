"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// --- Helper Icon ---
const IconHeart = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
);

type Recipe = {
  id: number;
  title: string;
  image_url: string;
};

export default function FavoritesPage() {
    const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [userEmail, setUserEmail] = useState<string | null>(null);

    useEffect(() => {
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

    const handleRemoveFavorite = async (recipeId: number) => {
        if (!userEmail) return;

        // Okamžitá vizuální odezva - odebereme recept ze seznamu
        const originalRecipes = [...favoriteRecipes];
        setFavoriteRecipes(prev => prev.filter(recipe => recipe.id !== recipeId));

        try {
            await fetch(`${API_URL}/api/user/favorites/${recipeId}`, {
                method: 'POST', // Náš backend toggle endpoint
                headers: { "x-user-email": userEmail },
            });
        } catch (error) {
            console.error("Chyba při odebírání z oblíbených:", error);
            // V případě chyby vrátíme recept zpět do seznamu
            setFavoriteRecipes(originalRecipes);
            alert("Odebrání se nezdařilo, zkuste to prosím znovu.");
        }
    };

    if (loading) return <p className="text-center p-10">Načítání...</p>;

    if (!userEmail) {
        return (
            <div className="text-center p-10">
                <h1 className="text-2xl font-bold text-gray-800">Přístup odepřen</h1>
                <p className="text-gray-500 mt-2">Pro zobrazení této stránky se musíte přihlásit.</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-4xl sm:text-5xl font-bold text-gray-800">Moje oblíbené recepty</h1>
                    <p className="text-lg text-gray-500 mt-2">Tvoje uložené recepty na jednom místě.</p>
                </div>

                {favoriteRecipes.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {favoriteRecipes.map((recipe) => (
                            <div key={recipe.id} className="group block bg-white p-4 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative">
                                <Link href={`/recepty/${recipe.id}`}>
                                    <div className="relative w-full h-48 rounded-xl overflow-hidden">
                                        <Image
                                            src={recipe.image_url && recipe.image_url.startsWith("http") ? recipe.image_url : `${API_URL}${recipe.image_url}`}
                                            alt={recipe.title}
                                            fill
                                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                                        />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800 mt-4 truncate">{recipe.title}</h3>
                                </Link>
                                {/* --- ZDE JE OPRAVA --- */}
                                {/* Tlačítko pro odebrání je nyní samostatné a zabraňuje navigaci */}
                                <button
                                    onClick={(e) => {
                                        e.preventDefault(); // Zabrání přechodu na detail
                                        handleRemoveFavorite(recipe.id);
                                    }}
                                    className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm p-2 rounded-full hover:bg-white transition z-10"
                                    aria-label="Odebrat z oblíbených"
                                >
                                    <IconHeart />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 mt-10">Zatím nemáš žádné oblíbené recepty.</p>
                )}
            </main>
        </div>
    );
}