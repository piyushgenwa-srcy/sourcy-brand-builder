"use client";

import { PRODUCTS, type ProductCategory } from "@/lib/products";
import {
  Shirt,
  HardHat,
  ShoppingBag,
  CupSoda,
  BookOpen,
  Sticker,
  Package,
  Check,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  shirt: Shirt,
  "hard-hat": HardHat,
  "shopping-bag": ShoppingBag,
  "cup-soda": CupSoda,
  "book-open": BookOpen,
  sticker: Sticker,
  package: Package,
};

export function ProductPicker({
  selected,
  onSelect,
}: {
  selected: string[];
  onSelect: (ids: string[]) => void;
}) {
  function toggle(id: string) {
    if (selected.includes(id)) {
      onSelect(selected.filter((s) => s !== id));
    } else {
      onSelect([...selected, id]);
    }
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {PRODUCTS.map((product) => {
        const isSelected = selected.includes(product.id);
        const Icon = iconMap[product.icon] || Package;

        return (
          <button
            key={product.id}
            onClick={() => toggle(product.id)}
            className={`
              group relative flex flex-col items-center gap-3 p-6 rounded-lg border transition-all duration-150
              ${
                isSelected
                  ? "border-terracotta bg-white shadow-warm-md ring-2 ring-terracotta/20"
                  : "border-line bg-surface hover:border-dark-brown/30 hover:shadow-warm-sm"
              }
            `}
            style={{ cursor: "pointer" }}
          >
            {isSelected && (
              <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-terracotta flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-cream" />
              </div>
            )}
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                isSelected ? "bg-terracotta/10 text-terracotta" : "bg-line/60 text-dark-brown"
              }`}
            >
              <Icon className="w-6 h-6" />
            </div>
            <div className="text-center">
              <p className="font-medium text-burgundy text-sm">{product.name}</p>
              <p className="text-xs text-dark-brown/60 mt-0.5">{product.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
