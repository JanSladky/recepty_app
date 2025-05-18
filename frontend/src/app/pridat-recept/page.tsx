"use client";

import RecipeForm from "@/components/RecipeForm";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AddRecipePage() {
  const handleSubmit = async (formData: FormData) => {
    try {
      const res = await fetch(`${API_URL}/api/recipes`, {
        method: "POST",
        headers: {
          "x-user-email": localStorage.getItem("userEmail") || "",
          // ❗️Nepřidávej `Content-Type`, protože FormData si nastaví vlastní
        },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        alert("✅ Recept přidán!" + (data.image_url ? ` Obrázek: ${data.image_url}` : ""));
      } else {
        const errorText = await res.text();
        console.error("❌ Chyba při ukládání:", errorText);
        alert("❌ Chyba při ukládání: " + errorText);
      }
    } catch (err) {
      if (err instanceof Error) {
        console.error("❌ Neznámá chyba:", err.message);
      } else {
        console.error("❌ Neznámá chyba:", err);
      }
      alert("❌ Nastala neznámá chyba při ukládání receptu.");
    }
  };

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Přidat recept</h1>
      <RecipeForm
        onSubmit={handleSubmit}
        initialTitle=""
        initialDescription=""
        initialImageUrl={undefined}
        initialCategories={[]}
        initialMealTypes={[]}
        submitLabel="Přidat recept"
      />
    </main>
  );
}
