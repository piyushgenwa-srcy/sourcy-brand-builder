"use client";

import { BAG_DESIGNS } from "@/lib/pickleball-products";
import { Check } from "lucide-react";

export function DesignPicker({
  selectedDesignId,
  selectedColorId,
  onSelectDesign,
  onSelectColor,
}: {
  selectedDesignId: string | null;
  selectedColorId: string | null;
  onSelectDesign: (id: string) => void;
  onSelectColor: (id: string) => void;
}) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {BAG_DESIGNS.map((design) => {
          const isSelected = design.id === selectedDesignId;

          return (
            <button
              key={design.id}
              onClick={() => {
                onSelectDesign(design.id);
                if (!isSelected) onSelectColor(design.colors[0].id);
              }}
              className={`
                group relative flex flex-col gap-3 p-5 rounded-lg border text-left transition-all duration-150
                ${
                  isSelected
                    ? "border-terracotta bg-white shadow-warm-md ring-2 ring-terracotta/20"
                    : "border-line bg-surface hover:border-dark-brown/30 hover:shadow-warm-sm"
                }
              `}
              style={{ cursor: "pointer" }}
            >
              {isSelected && (
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-terracotta flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-cream" />
                </div>
              )}
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-terracotta/80">
                {design.collection}
              </span>
              <div>
                <p className="font-display text-lg text-burgundy">
                  {design.name}
                </p>
                <p className="text-xs text-dark-brown/60 mt-0.5">
                  {design.description}
                </p>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                {design.colors.map((color) => (
                  <span
                    key={color.id}
                    className="w-4 h-4 rounded-full border border-line/60"
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {selectedDesignId && (
        <div className="border-t border-line pt-6">
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-dark-brown/60 mb-3">
            Choose a colorway
          </p>
          <div className="flex flex-wrap gap-3">
            {BAG_DESIGNS.find((d) => d.id === selectedDesignId)?.colors.map(
              (color) => {
                const isSelected = color.id === selectedColorId;
                return (
                  <button
                    key={color.id}
                    onClick={() => onSelectColor(color.id)}
                    className={`
                      flex items-center gap-2.5 pl-2 pr-4 py-2 rounded-full border transition-all
                      ${
                        isSelected
                          ? "border-terracotta bg-white shadow-warm-sm ring-2 ring-terracotta/20"
                          : "border-line bg-surface hover:border-dark-brown/30"
                      }
                    `}
                    style={{ cursor: "pointer" }}
                  >
                    <span
                      className="w-6 h-6 rounded-full border border-line/60 flex items-center justify-center shrink-0"
                      style={{ backgroundColor: color.hex }}
                    >
                      {isSelected && (
                        <Check
                          className="w-3.5 h-3.5"
                          style={{
                            color: isLight(color.hex) ? "#212223" : "#F7F5F1",
                          }}
                        />
                      )}
                    </span>
                    <span className="text-sm text-burgundy font-medium">
                      {color.name}
                    </span>
                  </button>
                );
              }
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function isLight(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}
