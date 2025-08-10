"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X,
  Plus,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Trash2,
  ShoppingCart,
  Search,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const PLAN_KEY = "meal_plan_v1";
const CART_KEY = "shopping_cart_v1";

type CartItem = { id: number; title: string; ingredients: Ingredient[] };
type Ingredient = { name: string; unit?: string; amount?: number };
type Recipe = { id: number; title: string; image_url?: string; ingredients?: Ingredient[] };

type PlanItem =
  | { id: string; type: "recipe"; recipeId: number; title: string }
  | { id: string; type: "ingredient"; title: string; ingredient: Ingredient };

type MealSlot = "snídaně" | "svačina 1" | "oběd" | "svačina 2" | "večeře";
const MEAL_SLOTS: MealSlot[] = ["snídaně", "svačina 1", "oběd", "svačina 2", "večeře"];
const CZ_DAYS = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota", "Neděle"];

/* ---------- storage helpers ---------- */
type PlanStorage = Record<string /* YYYY-MM-DD */, Record<MealSlot, PlanItem[]>>;
function readPlan(): PlanStorage {
  try {
    const raw = localStorage.getItem(PLAN_KEY);
    return raw ? (JSON.parse(raw) as PlanStorage) : {};
  } catch {
    return {};
  }
}
function writePlan(p: PlanStorage) {
  localStorage.setItem(PLAN_KEY, JSON.stringify(p));
}
function readCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function writeCart(items: any[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  if (typeof window !== "undefined") window.dispatchEvent(new Event("cartUpdated"));
}
const getCartCount = () => {
  const c = readCart();
  return Array.isArray(c) ? c.length : 0;
};
const notifyCart = () => {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("cartUpdated"));
};

/* ---------- date helpers (lokální čas, žádné UTC) ---------- */
const localISO = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
// zobrazení: DD-MM-YYYY
const fmtCZ = (d: Date) => {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};
function mondayOfWeek(anchor: Date) {
  const d = new Date(anchor);
  const day = (d.getDay() + 6) % 7; // 0=Mon
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(d: Date, n: number) {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}
const normalize = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/* ---------- Modal ---------- */
type AddModalProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (items: PlanItem[]) => void;
  recipes: Recipe[];
};
function AddItemModal({ open, onClose, onAdd, recipes }: AddModalProps) {
  const [tab, setTab] = useState<"recipe" | "ingredient">("recipe");
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState<number | null>(null);
  const [ingName, setIngName] = useState("");
  const [ingAmt, setIngAmt] = useState<string>("");
  const [ingUnit, setIngUnit] = useState("");

  useEffect(() => {
    if (!open) {
      setTab("recipe");
      setQuery("");
      setSel(null);
      setIngName("");
      setIngAmt("");
      setIngUnit("");
    }
  }, [open]);

  const filtered = useMemo(() => {
    if (!query) return recipes;
    const q = normalize(query);
    return recipes.filter((r) => normalize(r.title).includes(q));
  }, [recipes, query]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2 font-semibold">
            <CalendarDays className="w-5 h-5 text-green-600" />
            Přidat do jídelníčku
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100">
            <X />
          </button>
        </div>

        <div className="px-4 pt-4">
          <div className="inline-flex rounded-lg border overflow-hidden">
            <button
              onClick={() => setTab("recipe")}
              className={`px-4 py-2 text-sm font-medium ${
                tab === "recipe" ? "bg-green-600 text-white" : "bg-white"
              }`}
            >
              Recept
            </button>
            <button
              onClick={() => setTab("ingredient")}
              className={`px-4 py-2 text-sm font-medium ${
                tab === "ingredient" ? "bg-green-600 text-white" : "bg-white"
              }`}
            >
              Surovina
            </button>
          </div>
        </div>

        {tab === "recipe" ? (
          <div className="p-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Hledat recept…"
                className="pl-9 pr-3 py-2 w-full border rounded-lg"
              />
            </div>

            <div className="mt-3 max-h-72 overflow-auto divide-y rounded-lg border">
              {filtered.length === 0 && (
                <div className="p-4 text-gray-500">Nic nenalezeno.</div>
              )}
              {filtered.map((r) => {
                const active = sel === r.id;
                return (
                  <label
                    key={r.id}
                    className={`flex items-center gap-3 p-3 cursor-pointer ${
                      active ? "bg-green-50" : ""
                    }`}
                    onClick={() => setSel(r.id)}
                  >
                    <input type="radio" checked={active} readOnly className="accent-green-600" />
                    <span className="font-medium">{r.title}</span>
                  </label>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button onClick={onClose} className="px-4 py-2 rounded-lg border">
                Zrušit
              </button>
              <button
                onClick={() => {
                  if (sel == null) return;
                  const r = recipes.find((x) => x.id === sel);
                  if (!r) return;
                  onAdd([
                    {
                      id: crypto.randomUUID(),
                      type: "recipe",
                      recipeId: r.id,
                      title: r.title,
                    },
                  ]);
                  onClose();
                }}
                className="px-4 py-2 rounded-lg bg-green-600 text-white"
              >
                Přidat
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-sm text-gray-600">Název suroviny</label>
                <input
                  value={ingName}
                  onChange={(e) => setIngName(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="např. Banán"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Množství</label>
                <div className="flex gap-2">
                  <input
                    value={ingAmt}
                    onChange={(e) => setIngAmt(e.target.value)}
                    className="w-24 border rounded-lg px-3 py-2"
                    placeholder="1"
                    inputMode="decimal"
                  />
                  <input
                    value={ingUnit}
                    onChange={(e) => setIngUnit(e.target.value)}
                    className="flex-1 border rounded-lg px-3 py-2"
                    placeholder="ks / g / ml…"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button onClick={onClose} className="px-4 py-2 rounded-lg border">
                Zrušit
              </button>
              <button
                onClick={() => {
                  if (!ingName.trim()) return;
                  const amount = ingAmt ? Number(ingAmt.replace(",", ".")) : undefined;
                  onAdd([
                    {
                      id: crypto.randomUUID(),
                      type: "ingredient",
                      title: ingName.trim(),
                      ingredient: {
                        name: ingName.trim(),
                        amount,
                        unit: ingUnit.trim() || undefined,
                      },
                    },
                  ]);
                  onClose();
                }}
                className="px-4 py-2 rounded-lg bg-green-600 text-white"
              >
                Přidat
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Page ---------- */
export default function MealPlanPage() {
  const router = useRouter();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [plan, setPlan] = useState<PlanStorage>({});
  const [weekStart, setWeekStart] = useState<Date>(() => mondayOfWeek(new Date()));
  const [selectedDayISO, setSelectedDayISO] = useState<string>(() => localISO(new Date()));
  const [modalOpen, setModalOpen] =
    useState<false | { dayISO: string; slot: MealSlot }>(false);
  const [cartCount, setCartCount] = useState<number>(0);

  // načti plán a košík
  useEffect(() => {
    setPlan(readPlan());
    setCartCount(getCartCount());
  }, []);

  // posluchače pro badge
  useEffect(() => {
    const update = () => setCartCount(getCartCount());
    const onCartUpdated = () => update();
    const onStorage = (e: StorageEvent) => {
      if (e.key === CART_KEY) update();
    };
    const onVisibility = () => update();
    const onFocus = () => update();

    window.addEventListener("cartUpdated", onCartUpdated as EventListener);
    window.addEventListener("storage", onStorage);
    window.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("cartUpdated", onCartUpdated as EventListener);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  // načti recepty
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/recipes`);
        const data = await res.json();
        setRecipes(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Načtení receptů selhalo:", e);
      }
    })();
  }, []);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  // změna dne (posouvá i týden, když přejdeš hranici)
  const changeSelectedDay = (delta: number) => {
    const current = new Date(selectedDayISO);
    const next = addDays(current, delta);
    setSelectedDayISO(localISO(next));
    const ms = mondayOfWeek(next);
    if (localISO(ms) !== localISO(weekStart)) setWeekStart(ms);
  };

  const goToToday = () => {
    const today = new Date();
    setSelectedDayISO(localISO(today));
    setWeekStart(mondayOfWeek(today));
  };

  // mutace plánu + auto-add do košíku (✅ bez deduplikace → násobí se suroviny)
  const addItems = (dayISO: string, slot: MealSlot, items: PlanItem[]) => {
    setPlan((prev) => {
      const next = structuredClone(prev ?? {});
      next[dayISO] ??= {
        "snídaně": [],
        "svačina 1": [],
        "oběd": [],
        "svačina 2": [],
        "večeře": [],
      };
      next[dayISO][slot].push(...items);
      writePlan(next);
      return next;
    });

    (async () => {
      try {
        const current = readCart();
        const toAdd: CartItem[] = [];

        for (const it of items) {
          if (it.type === "recipe") {
            const res = await fetch(`${API_URL}/api/recipes/${it.recipeId}`);
            if (!res.ok) continue;
            const full: Recipe = await res.json();
            // přidáme KAŽDOU porci zvlášť
            toAdd.push({
              id: full.id,
              title: full.title,
              ingredients: (full.ingredients || []) as Ingredient[],
            });
          } else {
            // agregujeme volné suroviny do jedné položky s id -1
            const id = -1;
            const existing =
              toAdd.find((x) => x.id === id) || current.find((x: any) => x.id === id);
            if (existing) {
              existing.title = "Vlastní položky";
              existing.ingredients = existing.ingredients || [];
              existing.ingredients.push(it.ingredient);
            } else {
              toAdd.push({ id, title: "Vlastní položky", ingredients: [it.ingredient] });
            }
          }
        }

        if (toAdd.length > 0) {
          const next = [...current, ...toAdd];
          writeCart(next);
          notifyCart();
          setCartCount(next.length);
        }
      } catch (e) {
        console.error("Auto add do košíku selhalo:", e);
      }
    })();
  };

  const removeItem = (dayISO: string, slot: MealSlot, id: string) => {
    setPlan((prev) => {
      const next = structuredClone(prev ?? {});
      if (next[dayISO]) {
        next[dayISO][slot] = next[dayISO][slot].filter((i) => i.id !== id);
        writePlan(next);
      }
      return next;
    });
  };

  // přidat celý týden do košíku (✅ bez deduplikace) a přesměrovat

const pushWeekToCart = async () => {
  try {
    // 1) vyber dny aktuálního týdne (lokální čas)
    const wantDays: string[] = days.map((d) => localISO(d));

    // spočti kolikrát se který recept v týdnu objeví, a posbírej volné suroviny
    const counts = new Map<number, number>();
    const looseIngs: Ingredient[] = [];

    for (const d of wantDays) {
      const dayData = plan[d];
      if (!dayData) continue;
      for (const slot of MEAL_SLOTS) {
        for (const it of (dayData[slot] || [])) {
          if (it.type === "recipe") {
            counts.set(it.recipeId, (counts.get(it.recipeId) ?? 0) + 1);
          } else {
            looseIngs.push(it.ingredient);
          }
        }
      }
    }

    if (counts.size === 0 && looseIngs.length === 0) {
      router.push("/nakupni-seznam");
      return;
    }

    // 2) začni z aktuálního košíku, ale vyhoď recepty,
    // které budeme nově přepisovat z plánovaného týdne
    const current = readCart();
    const recipeIds = new Set(counts.keys());
    const cleaned = current.filter((x: any) => !recipeIds.has(x.id));

    // 3) helper – normalizace množství/jednotek (150 g, 0,15 kg, "150g"…)
    const normalize = (rawAmount: unknown, unitRaw?: string) => {
      let unit = (unitRaw ?? "").toString().trim();
      let num: number;

      if (typeof rawAmount === "number") {
        num = rawAmount;
      } else {
        const s = String(rawAmount ?? "").replace(",", ".");
        const mNum = s.match(/[\d.]+/);
        num = mNum ? parseFloat(mNum[0]) : 0;
        if (!unit) {
          const mU = s.match(/[a-zA-Z]+/);
          if (mU) unit = mU[0];
        }
      }

      const u = unit.toLowerCase();
      if (u === "kg") return { amount: num * 1000, unit: "g" };
      if (u === "g")  return { amount: num,        unit: "g" };
      if (u === "l")  return { amount: num * 1000, unit: "ml" };
      if (u === "ml") return { amount: num,        unit: "ml" };
      if (["ks","kus","kusy"].includes(u)) return { amount: num, unit: "ks" };
      return { amount: isFinite(num) ? num : 0, unit: unit };
    };

    // 4) načti každý recept jednou a vynásob ingredience dle počtu výskytů v týdnu
    const additions: any[] = [];
    for (const [recipeId, count] of counts.entries()) {
      const res = await fetch(`${API_URL}/api/recipes/${recipeId}`);
      if (!res.ok) continue;
      const full: Recipe = await res.json();

      const multiplied = (full.ingredients || []).map((ing) => {
        const { amount, unit } = normalize(ing.amount, ing.unit);
        return { ...ing, amount: amount * count, unit };
      });

      additions.push({ id: full.id, title: full.title, ingredients: multiplied });
    }

    // 5) volné (ručně přidané) suroviny jako jeden pseudo-recept
    if (looseIngs.length) {
      additions.push({ id: -1, title: "Vlastní položky", ingredients: looseIngs });
    }

    // 6) ulož, pingni badge a přesměruj do košíku
    const next = [...cleaned, ...additions];
    writeCart(next);
    notifyCart();
    setCartCount(next.length);
    router.push("/nakupni-seznam");
  } catch (e) {
    console.error("pushWeekToCart failed:", e);
    alert("Nepodařilo se přidat do košíku.");
  }
};

  // view-data
  const selectedDate = new Date(selectedDayISO);
  const selectedDayData =
    plan[selectedDayISO] ??
    { "snídaně": [], "svačina 1": [], "oběd": [], "svačina 2": [], "večeře": [] };

  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Týdenní jídelníček</h1>
            <p className="text-gray-500 mt-1">
              Sestav si plán: snídaně, dvě svačiny, oběd a večeře.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/recepty" className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50">
              Procházet recepty
            </Link>
            <button
              onClick={pushWeekToCart}
              className="relative inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
              title="Přidat vše do nákupního seznamu a otevřít košík"
            >
              <ShoppingCart className="w-5 h-5" />
              Do košíku
              {cartCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center text-xs font-bold bg-white text-green-700 rounded-full w-6 h-6">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Week controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="inline-flex items-center gap-2">
            <button
              onClick={() => setWeekStart(addDays(weekStart, -7))}
              className="p-2 rounded-lg border bg-white hover:bg-gray-50"
            >
              <ChevronLeft />
            </button>
            <div className="px-3 py-2 rounded-lg border bg-white font-medium">
              {fmtCZ(weekStart)} – {fmtCZ(addDays(weekStart, 6))}
            </div>
            <button
              onClick={() => setWeekStart(addDays(weekStart, 7))}
              className="p-2 rounded-lg border bg-white hover:bg-gray-50"
            >
              <ChevronRight />
            </button>
          </div>
          <button onClick={goToToday} className="text-sm text-gray-600 hover:underline">
            Dnes
          </button>
        </div>

        {/* ====== MOBILE: jen vybraný den ====== */}
        <section className="md:hidden space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => changeSelectedDay(-1)}
              className="p-2 rounded-lg border bg-white hover:bg-gray-50"
            >
              <ChevronLeft />
            </button>
            <div className="text-center">
              <div className="text-lg font-semibold">
                {CZ_DAYS[(selectedDate.getDay() + 6) % 7]}
              </div>
              <div className="text-sm text-gray-500">{fmtCZ(selectedDate)}</div>
            </div>
            <button
              onClick={() => changeSelectedDay(1)}
              className="p-2 rounded-lg border bg-white hover:bg-gray-50"
            >
              <ChevronRight />
            </button>
          </div>

          {MEAL_SLOTS.map((slot) => (
            <div key={slot} className="bg-white rounded-xl shadow-sm border p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold capitalize">{slot}</h3>
                <button
                  onClick={() => setModalOpen({ dayISO: selectedDayISO, slot })}
                  className="inline-flex items-center gap-2 rounded-lg border border-dashed px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                >
                  <Plus className="w-4 h-4 text-green-600" />
                  Přidat
                </button>
              </div>

              {(selectedDayData[slot] || []).length === 0 ? (
                <div className="text-gray-400">Zatím nic přidaného.</div>
              ) : (
                <div className="space-y-2">
                  {selectedDayData[slot].map((it) => (
                    <div
                      key={it.id}
                      className="flex items-center justify-between gap-3 rounded-lg border bg-white px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">
                          {it.title}
                          {it.type === "ingredient" && (
                            <span className="text-gray-500 font-normal">
                              {" "}
                              {it.ingredient.amount ?? ""} {it.ingredient.unit ?? ""}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {it.type === "recipe" ? "Recept" : "Surovina"}
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(selectedDayISO, slot, it.id)}
                        className="text-red-600 hover:text-red-700"
                        title="Odebrat"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </section>

        {/* ====== DESKTOP/TABLET: celý týden ====== */}
        <section className="hidden md:block overflow-auto mt-6">
          <table className="min-w-[900px] w-full border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="sticky left-0 bg-gray-50 z-10 w-40 text-left px-3 py-2 border-b font-semibold text-gray-700">
                  Den / Jídlo
                </th>
                {MEAL_SLOTS.map((m) => (
                  <th key={m} className="px-3 py-2 border-b text-left font-semibold text-gray-700">
                    {m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((d, rowIdx) => {
                const dayISO = localISO(d);
                const dayData =
                  plan[dayISO] ?? {
                    "snídaně": [],
                    "svačina 1": [],
                    "oběd": [],
                    "svačina 2": [],
                    "večeře": [],
                  };
                const isToday = dayISO === localISO(new Date());

                return (
                  <tr key={dayISO} className="align-top">
                    <td
                      className={`sticky left-0 bg-white z-10 border-b font-medium px-3 py-3 ${
                        isToday ? "ring-1 ring-green-500 rounded-l" : ""
                      }`}
                    >
                      <div className="text-gray-800">{CZ_DAYS[rowIdx]}</div>
                      <div className="text-xs text-gray-500">{fmtCZ(d)}</div>
                    </td>

                    {MEAL_SLOTS.map((slot) => (
                      <td key={slot} className="border-b px-3 py-3">
                        <div className="flex flex-col gap-2">
                          {(dayData[slot] || []).map((it) => (
                            <div
                              key={it.id}
                              className="group flex items-center justify-between gap-3 rounded-lg border bg-white px-3 py-2 shadow-sm"
                            >
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-gray-800 truncate">
                                  {it.title}
                                  {it.type === "ingredient" && (
                                    <span className="text-gray-500 font-normal">
                                      {" "}
                                      {it.ingredient.amount ?? ""} {it.ingredient.unit ?? ""}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {it.type === "recipe" ? "Recept" : "Surovina"}
                                </div>
                              </div>
                              <button
                                onClick={() => removeItem(dayISO, slot, it.id)}
                                className="opacity-70 hover:opacity-100 text-red-600"
                                title="Odebrat"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => setModalOpen({ dayISO, slot })}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                          >
                            <Plus className="w-4 h-4 text-green-600" />
                            Přidat
                          </button>
                        </div>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        {/* Modal */}
        <AddItemModal
          open={!!modalOpen}
          onClose={() => setModalOpen(false)}
          recipes={recipes}
          onAdd={(items) => {
            if (!modalOpen) return;
            addItems(modalOpen.dayISO, modalOpen.slot, items);
          }}
        />
      </main>
    </div>
  );
}