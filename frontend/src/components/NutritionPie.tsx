"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Label,
  Sector,
} from "recharts";

/* ========= Typy ========= */

type NutritionTotals = {
  kcal: number;
  proteins: number;
  carbs: number;
  sugars: number;
  fat: number;
  saturated_fat: number;
  fiber: number;
  sodium: number; // g
};

type PieDatum = {
  key: string;
  name: string;
  value: number;
  color: string;
};

type SliceShapeProps = {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill: string;
};

type Props = { totals: NutritionTotals };

/* ========= Barvy a popisky ========= */

const COLORS: Record<string, string> = {
  proteins: "#FF4D4F",
  carbs: "#1890FF",
  sugars: "#0050B3",
  fat: "#FAAD14",
  saturated_fat: "#FFC53D",
  fiber: "#52C41A",
  sodium: "#A0D911",
};

const LABELS: Record<string, string> = {
  proteins: "Bílkoviny",
  carbs: "Sacharidy",
  sugars: "Cukry",
  fat: "Tuky",
  saturated_fat: "Nasycené mastné kyseliny",
  fiber: "Vláknina",
  sodium: "Sodík",
};

/* ========= Data helper ========= */

function buildPieData(t: NutritionTotals): PieDatum[] {
  const rows: PieDatum[] = [
    { key: "proteins", name: LABELS.proteins, value: t.proteins, color: COLORS.proteins },
    { key: "carbs", name: LABELS.carbs, value: t.carbs, color: COLORS.carbs },
    { key: "sugars", name: LABELS.sugars, value: t.sugars, color: COLORS.sugars },
    { key: "fat", name: LABELS.fat, value: t.fat, color: COLORS.fat },
    { key: "saturated_fat", name: LABELS.saturated_fat, value: t.saturated_fat, color: COLORS.saturated_fat },
    { key: "fiber", name: LABELS.fiber, value: t.fiber, color: COLORS.fiber },
    { key: "sodium", name: LABELS.sodium, value: t.sodium, color: COLORS.sodium },
  ].map((r) => ({ ...r, value: Number.isFinite(r.value) ? Math.max(0, r.value) : 0 }));

  const sum = rows.reduce((a, b) => a + b.value, 0);
  return sum > 0 ? rows : [{ key: "empty", name: "Žádná data", value: 1, color: "#E5E7EB" }];
}

/* ========= Aktivní (zvětšená) výseč ========= */

function ActiveSlice(props: SliceShapeProps) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius + 8}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
    />
  );
}

/* ========= Typovaný wrapper Pie s activeIndex/activeShape ========= */

type PieWithActiveProps = React.ComponentProps<typeof Pie> & {
  activeIndex?: number | number[];
  activeShape?: React.ComponentType<SliceShapeProps> | SliceShapeProps;
};

const PieWithActive = Pie as unknown as React.FC<PieWithActiveProps>;

/* ========= Komponenta ========= */

export default function NutritionPie({ totals }: Props) {
  const data = buildPieData(totals);

  const gramSum =
    (totals.proteins > 0 ? totals.proteins : 0) +
    (totals.carbs > 0 ? totals.carbs : 0) +
    (totals.sugars > 0 ? totals.sugars : 0) +
    (totals.fat > 0 ? totals.fat : 0) +
    (totals.saturated_fat > 0 ? totals.saturated_fat : 0) +
    (totals.fiber > 0 ? totals.fiber : 0) +
    (totals.sodium > 0 ? totals.sodium : 0);

  const toPct = (v: number) =>
    gramSum > 0 ? `${Math.round((v / gramSum) * 100)} %` : "0 %";

  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  return (
    <div
      className="nutrition-pie bg-white rounded-xl shadow p-6"
      tabIndex={-1}
      onMouseDown={(e) => e.preventDefault()}
      onFocusCapture={(e) => (e.target as HTMLElement).blur()}
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      <style jsx global>{`
        .nutrition-pie :focus,
        .nutrition-pie :focus-visible,
        .nutrition-pie svg:focus,
        .nutrition-pie .recharts-wrapper:focus,
        .nutrition-pie .recharts-surface:focus,
        .nutrition-pie .recharts-layer:focus,
        .nutrition-pie .recharts-pie-sector:focus,
        .nutrition-pie path:focus {
          outline: none !important;
        }
      `}</style>

      <h2 className="text-3xl font-bold mb-6">Složení nutričních hodnot</h2>

      <div className="flex flex-col items-center gap-6">
        <div className="w-full h-80">
          <ResponsiveContainer>
            <PieChart>
              <PieWithActive
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={120}
                strokeWidth={2}
                isAnimationActive
                activeIndex={activeIndex}
                activeShape={ActiveSlice}
                onMouseEnter={(_e: unknown, idx: number) => setActiveIndex(idx)}
                onMouseLeave={() => setActiveIndex(undefined)}
                onClick={(_e: unknown, idx: number) => setActiveIndex(idx)}
              >
                {data.map((entry) => (
                  <Cell key={entry.key} fill={entry.color} />
                ))}
                <Label
                  value={`${Math.round(Math.max(0, totals.kcal))} kcal`}
                  position="center"
                  style={{ fontSize: 16, fontWeight: 700, fill: "#111827" }}
                />
              </PieWithActive>

              <Tooltip
                formatter={(value: unknown, name: unknown) => [
                  `${Number(value)} g`,
                  String(name),
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <ul className="w-full max-w-xl space-y-3">
          {data.map((d, idx) => (
            <li
              key={d.key}
              className="flex items-center justify-between cursor-pointer select-none"
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(undefined)}
              onClick={() => setActiveIndex(idx)}
            >
              <div className="flex items-center gap-3">
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{ backgroundColor: d.color }}
                />
                <span className="text-lg">{d.name}</span>
              </div>
              <span className="text-xl font-semibold tabular-nums">
                {toPct(d.value)}
              </span>
            </li>
          ))}
        </ul>

        <div className="border-t pt-4 text-sm text-gray-500 w-full max-w-xl">
          Podíly jsou počítány z gramových hodnot.
        </div>
      </div>
    </div>
  );
}