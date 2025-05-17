"use client";

import React, { useState, useImperativeHandle, forwardRef } from "react";

export type Ingredient = {
  name: string;
  amount: number;
  unit: string;
};

export type IngredientAutocompleteHandle = {
  getIngredients: () => Ingredient[];
};

export const INGREDIENT_SUGGESTIONS = [
  // 🥩 Maso a uzeniny
  "Hovězí maso mleté",
  "Hovězí svíčková",
  "Hovězí žebra",
  "Vepřová panenka",
  "Vepřová plec",
  "Vepřový bok",
  "Kuřecí prsa",
  "Kuřecí stehna",
  "Kuřecí křídla",
  "Krůtí maso",
  "Kachna",
  "Husí maso",
  "Klobása",
  "Šunka",
  "Slanina",
  "Salám",
  "Uzené maso",
  "Zvěřina",
  "Jehněčí maso",
  "Tlačenka",
  "Párky",

  // 🐟 Ryby a mořské plody
  "Losos",
  "Tuňák",
  "Treska",
  "Makrela",
  "Sardinky",
  "Sledi",
  "Pstruh",
  "Kapří maso",
  "Krevety",
  "Kalmáry",
  "Mušle",
  "Ančovičky",

  // 🥚 Mléčné výrobky a vejce
  "Vejce",
  "Máslo",
  "Margarín",
  "Mléko",
  "Kondenzované mléko",
  "Smetana ke šlehání",
  "Smetana na vaření",
  "Zakysaná smetana",
  "Jogurt bílý",
  "Jogurt ovocný",
  "Tvaroh měkký",
  "Tvaroh tvrdý",
  "Sýr Eidam",
  "Sýr čedar",
  "Sýr niva",
  "Mozzarella",
  "Parmezán",
  "Ricotta",
  "Cottage",
  "Mascarpone",
  "Termizovaný sýr",
  "Sýr Lučina",
  "Kefír",
  "Podmáslí",

  // 🥖 Pečivo a obiloviny
  "Chléb",
  "Rohlík",
  "Houska",
  "Bageta",
  "Celozrnný chléb",
  "Toastový chléb",
  "Croissant",
  "Lavaš",
  "Tortilla",
  "Piškoty",
  "Sušenky",
  "Strouhanka",
  "Těstoviny",
  "Špagety",
  "Penne",
  "Fusilli",
  "Lasagne",
  "Rýže",
  "Jasmínová rýže",
  "Basmati rýže",
  "Kuskus",
  "Bulgur",
  "Quinoa",
  "Jáhly",
  "Pohanka",
  "Polenta",
  "Cizrna",
  "Čočka červená",
  "Čočka zelená",
  "Fazole červené",
  "Fazole bílé",
  "Hrách",
  "Ovesné vločky",
  "Müsli",
  "Mouka hladká",
  "Mouka polohrubá",
  "Mouka celozrnná",
  "Kukuřičná mouka",
  "Rýžová mouka",
  "Pšeničná krupice",

  // 🥦 Zelenina
  "Cibule",
  "Česnek",
  "Jarní cibulka",
  "Pórek",
  "Mrkev",
  "Petržel",
  "Celer",
  "Řapíkatý celer",
  "Brambory",
  "Batáty",
  "Paprika červená",
  "Paprika zelená",
  "Rajče",
  "Cherry rajčata",
  "Okurka",
  "Salát",
  "Kukuřice",
  "Hrášek",
  "Špenát",
  "Zelí bílé",
  "Zelí červené",
  "Kapusta",
  "Kedlubna",
  "Avokádo",
  "Ředkvička",
  "Řepa",
  "Brokolice",
  "Květák",
  "Dýně",
  "Lilek",
  "Cuketa",
  "Houby",
  "Žampiony",
  "Hlíva ústřičná",

  // 🍎 Ovoce
  "Jablko",
  "Hruška",
  "Banán",
  "Pomeranč",
  "Mandarinka",
  "Citron",
  "Limetka",
  "Grep",
  "Jahody",
  "Maliny",
  "Borůvky",
  "Třešně",
  "Višně",
  "Meruňky",
  "Švestky",
  "Mango",
  "Ananas",
  "Meloun",
  "Hroznové víno",
  "Granátové jablko",
  "Kiwi",
  "Fíky",
  "Datle",
  "Rozinky",
  "Kokos",
  "Ličí",
  "Marakuja",

  // 🧂 Koření a dochucovadla
  "Sůl",
  "Pepř",
  "Oregano",
  "Bazalka",
  "Tymián",
  "Rozmarýn",
  "Koriandr",
  "Kmín",
  "Majoránka",
  "Paprika sladká",
  "Paprika pálivá",
  "Chilli",
  "Kari",
  "Muškátový oříšek",
  "Bobkový list",
  "Skořice",
  "Hřebíček",
  "Zázvor",
  "Vanilka",
  "Sojová omáčka",
  "Worcester",
  "Kečup",
  "Hořčice",
  "Majonéza",
  "Tatarka",
  "Česnekový dresink",
  "Med",
  "Cukr",
  "Třtinový cukr",
  "Javorový sirup",
  "Vanilkový cukr",
  "Kakaový prášek",
  "Prášek do pečiva",
  "Jedlá soda",
  "Droždí",

  // 🧁 Dezerty a sladkosti
  "Čokoláda",
  "Bílá čokoláda",
  "Tmavá čokoláda",
  "Zmrzlina",
  "Marmeláda",
  "Nutella",
  "Pudink vanilkový",
  "Pudink čokoládový",
  "Dortový korpus",
  "Marcipán",
  "Piškoty",
  "Dětské piškoty",
  "Zdobení na dort",
  "Poleva",
  "Želatina",

  // 🥜 Ořechy a semínka
  "Vlašské ořechy",
  "Lískové ořechy",
  "Mandle",
  "Kešu",
  "Pistácie",
  "Arašídy",
  "Slunečnicová semínka",
  "Dýňová semínka",
  "Chia semínka",
  "Lněné semínko",
  "Sezam",

  // 🥤 Nápoje
  "Voda",
  "Minerálka",
  "Soda",
  "Pomerančový džus",
  "Jablečný džus",
  "Káva",
  "Čaj černý",
  "Čaj zelený",
  "Kakao",
  "Cola",
  "Tonik",
  "Energetický nápoj",

  // 🧊 Mražené potraviny
  "Mražená zelenina",
  "Mražené ovoce",
  "Mražená pizza",
  "Mražené hranolky",
  "Mražené kuřecí řízky",
  "Mražený špenát",
  "Zmrzlé krevety",
];

type Props = {
  initialIngredients?: Ingredient[];
};

const IngredientAutocomplete = forwardRef<IngredientAutocompleteHandle, Props>(({ initialIngredients = [] }, ref) => {
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients);
  const [input, setInput] = useState("");
  const [filtered, setFiltered] = useState<string[]>([]);
  const [amount, setAmount] = useState<number>(0);
  const [unit, setUnit] = useState<string>("g");

  useImperativeHandle(ref, () => ({
    getIngredients: () => ingredients,
  }));

  const normalize = (str: string) =>
    str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    if (value.length > 0) {
      const normalized = normalize(value);
      const matches = INGREDIENT_SUGGESTIONS.filter((s) => normalize(s).includes(normalized));
      setFiltered(matches.slice(0, 10));
    } else {
      setFiltered([]);
    }
  };

  const handleSelect = () => {
    if (input.trim() === "" || amount <= 0) return;

    setIngredients((prev) => [...prev, { name: input.trim(), amount, unit }]);
    setInput("");
    setAmount(0);
    setUnit("g");
    setFiltered([]);
  };

  const removeIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <input type="text" value={input} onChange={handleInputChange} placeholder="Název suroviny" className="flex-1 p-2 border rounded" />
        <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} placeholder="Množství" className="w-24 p-2 border rounded" />
        <select value={unit} onChange={(e) => setUnit(e.target.value)} className="w-24 p-2 border rounded">
          <option value="g">g</option>
          <option value="ml">ml</option>
          <option value="ks">ks</option>
        </select>
        <button onClick={handleSelect} className="bg-blue-600 text-white px-3 py-2 rounded">
          ➕ Přidat
        </button>
      </div>

      {filtered.length > 0 && (
        <ul className="border rounded p-2 bg-white shadow">
          {filtered.map((suggestion) => (
            <li
              key={suggestion}
              className="cursor-pointer px-2 py-1 hover:bg-gray-100"
              onClick={() => {
                setInput(suggestion); // ✅ doplní text
                setFiltered([]);
              }}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}

      <div>
        <h3 className="font-semibold mb-2">Zvolené suroviny:</h3>
        <ul className="space-y-1 text-sm">
          {ingredients.map((ing, i) => (
            <li key={i} className="flex justify-between items-center">
              <span>
                {ing.name} – {ing.amount} {ing.unit}
              </span>
              <button onClick={() => removeIngredient(i)} className="text-red-600 text-xs hover:underline">
                Odebrat
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
});

IngredientAutocomplete.displayName = "IngredientAutocomplete";
export default IngredientAutocomplete;
