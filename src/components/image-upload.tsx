"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, X, ImagePlus } from "lucide-react";

export function ImageUpload({
  image,
  imagePreview,
  onImageChange,
}: {
  image: File | null;
  imagePreview: string | null;
  onImageChange: (file: File | null, preview: string | null) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        onImageChange(file, e.target?.result as string);
      };
      reader.readAsDataURL(file);
    },
    [onImageChange]
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
    <div>
      <label className="block font-mono text-xs uppercase tracking-[0.15em] text-dark-brown/60 mb-2">
        Custom Product Image (Optional)
      </label>
      <p className="text-sm text-dark-brown/60 mb-4">
        Upload your own product photo and we&apos;ll place your logo on it.
      </p>
      {imagePreview ? (
        <div className="relative w-full rounded-lg border border-line bg-white p-6 flex items-center justify-center">
          <img
            src={imagePreview}
            alt="Custom image preview"
            className="max-h-48 max-w-full object-contain rounded"
          />
          <button
            onClick={() => onImageChange(null, null)}
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
            w-full rounded-lg border-2 border-dashed p-10 flex flex-col items-center gap-3 cursor-pointer transition-all
            ${
              isDragging
                ? "border-terracotta bg-terracotta/5"
                : "border-line hover:border-dark-brown/40 bg-surface/50"
            }
          `}
        >
          <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center">
            <ImagePlus className="w-5 h-5 text-dark-brown/60" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-burgundy">
              Upload your own product photo
            </p>
            <p className="text-xs text-dark-brown/50 mt-1">
              We&apos;ll add your logo to it — great for existing samples or mockups
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
  );
}
