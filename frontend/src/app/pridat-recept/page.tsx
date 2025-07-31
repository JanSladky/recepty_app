"use client";

import RecipeForm from "@/components/RecipeForm";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AddRecipePage() {
  const handleSubmit = async (formData: FormData) => {
    try {
      // Získání tokenu a e-mailu z localStorage
      const userEmail = localStorage.getItem("userEmail");
      const token = localStorage.getItem("token");

      if (userEmail) {
        formData.append("email", userEmail); // ✅ nutné pro backend
      }

      console.log("📦 Přidávám recept jako:", userEmail);

      const res = await fetch(`${API_URL}/api/recipes`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`, // ✅ potřebné pro admin přístup
          // Poznámka: FormData sám nastaví Content-Type včetně boundary
        },
      });

      if (!res.ok) {
        const resClone = res.clone(); // Umožní přečíst response dvakrát

        try {
          const errorData = await res.json();
          throw new Error(errorData.message || errorData.error || "Neznámá chyba serveru");
        } catch (jsonError) {
          const errorText = await resClone.text();
          throw new Error(errorText || `Chyba serveru: ${res.status}`);
        }
      }

      const data = await res.json();
      alert("✅ Recept přidán!" + (data.image_url ? ` Obrázek: ${data.image_url}` : ""));
    } catch (err) {
      console.error("❌ Chyba při ukládání:", err);
      alert("❌ Chyba při ukládání: " + (err as Error).message);
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