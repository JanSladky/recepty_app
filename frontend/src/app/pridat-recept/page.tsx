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
    <main className="px-4 sm:px-6 md:px-8 lg:px-12 py-6 w-full mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center sm:text-left">Přidat recept</h1>
      <div className="bg-white shadow rounded-lg p-4 sm:p-6">
        <RecipeForm
          onSubmit={handleSubmit}
          initialTitle=""
          initialNotes=""
          initialImageUrl={undefined}
          initialCategories={[]}
          initialMealTypes={[]}
          submitLabel="Přidat recept"
        />
      </div>
    </main>
  );
}
