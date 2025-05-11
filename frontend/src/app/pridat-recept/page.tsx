"use client";

import RecipeForm from "@/components/RecipeForm";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AddRecipePage() {
  const handleSubmit = async (formData: FormData) => {
    const res = await fetch(`${API_URL}/api/recipes`, {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      alert("Recept přidán!");
    } else {
      const error = await res.json();
      alert("Chyba při ukládání: " + error.error);
    }
  };

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-4">Přidat recept</h1>
      <RecipeForm
        onSubmit={handleSubmit}
        initialMealTypes={[]} // ✅ důležité pro multiselect
      />
    </main>
  );
}