"use client";

import { ChangeEvent } from "react";

type Props = {
  query: string;
  onQueryChange: (value: string) => void;
};

export default function SearchBar({ query, onQueryChange }: Props) {
  return (
    <div className="mb-4">
      <input
        type="text"
        placeholder="Hledat recept..."
        value={query}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          onQueryChange(e.target.value)
        }
        className="w-full p-2 border rounded-md"
      />
    </div>
  );
}