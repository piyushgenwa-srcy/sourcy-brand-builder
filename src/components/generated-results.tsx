"use client";

import { Download, RefreshCw, Loader2, Eye, Lock } from "lucide-react";
import { PRODUCTS } from "@/lib/products";

export type GeneratedImage = {
  productId: string;
  imageUrl: string;
  loading: boolean;
  error?: string;
};

export function GeneratedResults({
  images,
  brandName,
  unlocked,
  onRegenerate,
  onDownload,
  onRequestUnlock,
}: {
  images: GeneratedImage[];
  brandName: string;
  unlocked: boolean;
  onRegenerate: (productId: string) => void;
  onDownload: (imageUrl: string, productId: string) => void;
  onRequestUnlock: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-terracotta mb-2">
          Your Brand, Visualized
        </p>
        <h2 className="font-display text-2xl md:text-3xl text-burgundy">
          {brandName} Merchandise
        </h2>
        {!unlocked && (
          <p className="text-sm text-dark-brown/50 mt-2">
            Your mockups are ready — unlock them to view in full quality.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {images.map((img) => {
          const product = PRODUCTS.find((p) => p.id === img.productId);
          const showBlur = !unlocked && !img.loading && !img.error && img.imageUrl;

          return (
            <div
              key={img.productId}
              className="rounded-lg border border-line bg-white overflow-hidden group"
            >
              <div className="aspect-square relative bg-surface flex items-center justify-center overflow-hidden">
                {img.loading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-terracotta animate-spin" />
                    <p className="text-sm text-dark-brown/60">Generating...</p>
                  </div>
                ) : img.error ? (
                  <div className="flex flex-col items-center gap-3 px-6 text-center">
                    <p className="text-sm text-terracotta">{img.error}</p>
                    <button
                      onClick={() => onRegenerate(img.productId)}
                      className="text-xs text-dark-brown/60 hover:text-terracotta flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Try again
                    </button>
                  </div>
                ) : (
                  <>
                    <img
                      src={img.imageUrl}
                      alt={`${brandName} ${product?.name}`}
                      className={`w-full h-full object-cover transition-all duration-500 ${
                        showBlur
                          ? "blur-xl scale-105 select-none pointer-events-none"
                          : "blur-0 scale-100"
                      }`}
                      draggable={false}
                    />
                    {showBlur && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-burgundy/10 backdrop-blur-sm">
                        <div className="w-14 h-14 rounded-full bg-white/90 shadow-warm-md flex items-center justify-center mb-3">
                          <Lock className="w-6 h-6 text-terracotta" />
                        </div>
                        <button
                          onClick={onRequestUnlock}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-terracotta text-cream font-medium text-sm hover:bg-terracotta-hover active:scale-[0.98] transition-all shadow-warm-md"
                        >
                          <Eye className="w-4 h-4" />
                          View Mockup
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-burgundy">
                    {product?.name}
                  </p>
                  <p className="text-xs text-dark-brown/50">
                    {product?.description}
                  </p>
                </div>
                {unlocked && !img.loading && !img.error && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onRegenerate(img.productId)}
                      className="w-8 h-8 rounded-full bg-surface hover:bg-line flex items-center justify-center transition-colors"
                      title="Regenerate"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-dark-brown" />
                    </button>
                    <button
                      onClick={() => onDownload(img.imageUrl, img.productId)}
                      className="w-8 h-8 rounded-full bg-surface hover:bg-line flex items-center justify-center transition-colors"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5 text-dark-brown" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
