"use client";

import { BAG_DESIGNS, bagImagePath } from "@/lib/pickleball-products";
import { Check } from "lucide-react";
import Image from "next/image";

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
  const selectedDesign = BAG_DESIGNS.find((d) => d.id === selectedDesignId);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {BAG_DESIGNS.map((design) => {
          const isSelected = design.id === selectedDesignId;
          const previewColor =
            (isSelected &&
              design.colors.find((c) => c.id === selectedColorId)) ||
            design.colors[0];

          return (
            <button
              key={design.id}
              onClick={() => {
                onSelectDesign(design.id);
                if (!isSelected) onSelectColor(design.colors[0].id);
              }}
              className={`
                group relative flex flex-col gap-3 rounded-lg border text-left overflow-hidden transition-all duration-150
                ${
                  isSelected
                    ? "border-terracotta bg-white shadow-warm-md ring-2 ring-terracotta/20"
                    : "border-line bg-surface hover:border-dark-brown/30 hover:shadow-warm-sm"
                }
              `}
              style={{ cursor: "pointer" }}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 z-10 w-6 h-6 rounded-full bg-terracotta flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-cream" />
                </div>
              )}
              <div className="relative aspect-square w-full bg-white">
                <Image
                  src={bagImagePath(design.id, previewColor.id, "front")}
                  alt={`${design.name} in ${previewColor.name}`}
                  fill
                  sizes="(max-width: 640px) 50vw, 33vw"
                  className="object-cover"
                />
              </div>
              <div className="px-4 pb-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-terracotta/80">
                  {design.collection}
                </span>
                <p className="font-display text-lg text-burgundy">
                  {design.name}
                </p>
                <p className="text-xs text-dark-brown/60 mt-0.5">
                  {design.description}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  {design.colors.map((color) => (
                    <span
                      key={color.id}
                      className="w-4 h-4 rounded-full border border-line/60"
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedDesign && (
        <div className="border-t border-line pt-6">
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-dark-brown/60 mb-3">
            Choose a colorway
          </p>
          <div className="flex flex-wrap gap-3">
            {selectedDesign.colors.map((color) => {
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
            })}
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
