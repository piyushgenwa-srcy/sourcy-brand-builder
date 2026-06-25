"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, X, ImageIcon } from "lucide-react";

export function BrandInput({
  brandName,
  onBrandNameChange,
  logoFile,
  onLogoChange,
  logoPreview,
}: {
  brandName: string;
  onBrandNameChange: (name: string) => void;
  logoFile: File | null;
  onLogoChange: (file: File | null, preview: string | null) => void;
  logoPreview: string | null;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        onLogoChange(file, e.target?.result as string);
      };
      reader.readAsDataURL(file);
    },
    [onLogoChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="space-y-8">
      <div>
        <label
          htmlFor="brand-name"
          className="block font-mono text-xs uppercase tracking-[0.15em] text-dark-brown/60 mb-2"
        >
          Brand Name
        </label>
        <input
          id="brand-name"
          type="text"
          value={brandName}
          onChange={(e) => onBrandNameChange(e.target.value)}
          placeholder="Enter your brand name"
          className="w-full px-4 py-3.5 rounded-lg border border-line bg-white text-burgundy font-display text-xl placeholder:text-dark-brown/30 focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta transition-all"
        />
      </div>

      <div>
        <label className="block font-mono text-xs uppercase tracking-[0.15em] text-dark-brown/60 mb-2">
          Brand Logo
        </label>
        {logoPreview ? (
          <div className="relative w-full rounded-lg border border-line bg-white p-8 flex items-center justify-center">
            <img
              src={logoPreview}
              alt="Logo preview"
              className="max-h-32 max-w-full object-contain"
            />
            <button
              onClick={() => onLogoChange(null, null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-surface hover:bg-line flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-dark-brown" />
            </button>
          </div>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              w-full rounded-lg border-2 border-dashed p-12 flex flex-col items-center gap-3 cursor-pointer transition-all
              ${
                isDragging
                  ? "border-terracotta bg-terracotta/5"
                  : "border-line hover:border-dark-brown/40 bg-surface/50"
              }
            `}
          >
            <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center">
              <Upload className="w-5 h-5 text-dark-brown/60" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-burgundy">
                Drop your logo here, or click to upload
              </p>
              <p className="text-xs text-dark-brown/50 mt-1">
                PNG, SVG, or JPG — transparent background works best
              </p>
            </div>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>
    </div>
  );
}
