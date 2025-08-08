// 📁 frontend/src/app/pridat-recept/page.tsx
"use client";

import RecipeForm from "@/components/RecipeForm";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

type Role = "SUPERADMIN" | "ADMIN" | "USER";

function getRoleFromStorage(): Role {
  // primárně čti uloženou roli (nový login)
  const role = typeof window !== "undefined" ? localStorage.getItem("userRole") : null;
  if (role === "SUPERADMIN" || role === "ADMIN" || role === "USER") return role;

  // fallback pro starší login, kde se ukládal jen isAdmin
  const isAdmin = typeof window !== "undefined" ? localStorage.getItem("isAdmin") : null;
  if (isAdmin === "true") return "ADMIN";

  return "USER";
}

export default function AddRecipePage() {
  const handleSubmit = async (formData: FormData) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const role = getRoleFromStorage();

      if (!token) {
        throw new Error("Musíte být přihlášen, abyste mohli přidat recept.");
      }

      // USER → návrh receptu (moderace), ADMIN/SUPERADMIN → rovnou publikace
      const isModerator = role === "ADMIN" || role === "SUPERADMIN";
      const endpoint = isModerator ? "/api/recipes" : "/api/recipes/submit";

      // Pozn.: FormData si boundary a Content-Type nastaví sám
      const headers: Record<string, string> = { Authorization: `Bearer ${token}` };

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        body: formData,
        headers,
      });

      if (!res.ok) {
        // Bezpečně načteme JSON i plain text
        const text = await res.text();
        try {
          const data = JSON.parse(text) as { error?: string; message?: string };
          throw new Error(data.error || data.message || `Chyba serveru: ${res.status}`);
        } catch {
          throw new Error(text || `Chyba serveru: ${res.status}`);
        }
      }

      const data = await res.json();

      if (isModerator) {
        alert("✅ Recept byl přidán a je veřejně dostupný.");
      } else {
        alert("✅ Návrh receptu byl odeslán. Po schválení administrátorem se objeví mezi recepty.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Neznámá chyba při ukládání.";
      console.error("❌ Chyba při ukládání:", err);
      alert("❌ " + msg);
    }
  };

  const role = getRoleFromStorage();
  const submitLabel = role === "ADMIN" || role === "SUPERADMIN" ? "Přidat recept" : "Odeslat ke schválení";

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
          submitLabel={submitLabel}
        />
        <p className="text-sm text-gray-500 mt-4">
          Pozn.: Pokud nejste administrátor, recept nejdříve půjde ke schválení.
        </p>
      </div>
    </main>
  );
}