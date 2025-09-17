type Inflect = { one?: string; few?: string; many?: string };

export function czPlural(n: number, forms: Inflect | string) {
  const F = (typeof forms === 'string') ? { one: forms, few: forms, many: forms } : forms;
  const i = Math.abs(n);
  if (i === 1) return F.one ?? F.many ?? "";
  if (i >= 2 && i <= 4) return F.few ?? F.many ?? "";
  return F.many ?? "";
}

/** Vrátí „10 ks stroužků česneku (30 g)“ nebo fallback „10 ks Česnek…“ */
export function formatIngredientLabel(opts: {
  amount: number;
  unit: string;
  name: string;
  nameGenitive?: string | null;
  gramsRounded?: number | null;
  selectedPresetLabel?: string | null;
  selectedPresetInflect?: Inflect | null; // volitelné skloňování presetů
}) {
  const { amount, unit, name, nameGenitive, gramsRounded, selectedPresetLabel, selectedPresetInflect } = opts;

  const base = unit.toLowerCase() === "ks" && selectedPresetLabel
    ? `${amount} ks ${czPlural(amount, selectedPresetInflect ?? { one: selectedPresetLabel, few: selectedPresetLabel + "y", many: selectedPresetLabel + "ů" })}`
    : `${amount} ${unit} ${name}`;

  if (unit.toLowerCase() === "ks" && nameGenitive) {
    // „… česneku“, „… pomeranče“
    const withGen = selectedPresetLabel ? `${base} ${nameGenitive}` : `${amount} ks ${nameGenitive}`;
    return gramsRounded ? `${withGen} (${gramsRounded} g)` : withGen;
  }
  return gramsRounded ? `${base} (${gramsRounded} g)` : base;
}