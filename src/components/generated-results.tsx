"use client";

import { Download, RefreshCw, Loader2, Eye, Lock, ExternalLink } from "lucide-react";
import { PRODUCTS } from "@/lib/products";

export type ViewType = "logo" | "front" | "back";

export type ImageView = {
  viewType: ViewType;
  label: string;
  imageUrl: string;
  loading: boolean;
  error?: string;
};

export type GeneratedProduct = {
  productId: string;
  views: ImageView[];
};

export function GeneratedResults({
  products,
  brandName,
  unlocked,
  onRegenerate,
  onDownload,
  onRequestUnlock,
  sourcingUrl,
}: {
  products: GeneratedProduct[];
  brandName: string;
  unlocked: boolean;
  onRegenerate: (productId: string, viewType: ViewType) => void;
  onDownload: (imageUrl: string, productId: string, viewType: ViewType) => void;
  onRequestUnlock: () => void;
  sourcingUrl: string;
}) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-terracotta mb-2">
          Your Brand, Visualized
        </p>
        <h2 className="font-display text-2xl md:text-3xl text-burgundy">
          {brandName ? `${brandName} Merchandise` : "Your Merchandise"}
        </h2>
        {!unlocked && (
          <p className="text-sm text-dark-brown/50 mt-2">
            Your mockups are ready — unlock them to view in full quality.
          </p>
        )}
      </div>

      <div className="space-y-8">
        {products.map((product) => {
          const productInfo = PRODUCTS.find((p) => p.id === product.productId);

          return (
            <div key={product.productId} className="space-y-3">
              <div>
                <p className="font-semibold text-sm text-burgundy">
                  {productInfo?.name}
                </p>
                <p className="text-xs text-dark-brown/50">
                  {productInfo?.description}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {product.views.map((view) => {
                  const showBlur =
                    !unlocked && !view.loading && !view.error && view.imageUrl;

                  return (
                    <div
                      key={view.viewType}
                      className="rounded-lg border border-line bg-white overflow-hidden"
                    >
                      <div className="aspect-square relative bg-surface flex items-center justify-center overflow-hidden">
                        {view.loading ? (
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-5 h-5 text-terracotta animate-spin" />
                            <p className="text-[10px] text-dark-brown/60">
                              Generating...
                            </p>
                          </div>
                        ) : view.error ? (
                          <div className="flex flex-col items-center gap-2 px-3 text-center">
                            <p className="text-[10px] text-terracotta leading-snug">
                              {view.error}
                            </p>
                            <button
                              onClick={() =>
                                onRegenerate(product.productId, view.viewType)
                              }
                              className="text-[10px] text-dark-brown/60 hover:text-terracotta flex items-center gap-1 transition-colors"
                            >
                              <RefreshCw className="w-2.5 h-2.5" />
                              Retry
                            </button>
                          </div>
                        ) : (
                          <>
                            <img
                              src={view.imageUrl}
                              alt={`${brandName} ${productInfo?.name} ${view.label}`}
                              className={`w-full h-full object-cover transition-all duration-500 ${
                                showBlur
                                  ? "blur-xl scale-105 select-none pointer-events-none"
                                  : "blur-0 scale-100"
                              }`}
                              draggable={false}
                            />
                            {showBlur && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-burgundy/10 backdrop-blur-sm">
                                <div className="w-10 h-10 rounded-full bg-white/90 shadow-warm-md flex items-center justify-center mb-2">
                                  <Lock className="w-4 h-4 text-terracotta" />
                                </div>
                                <button
                                  onClick={onRequestUnlock}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-terracotta text-cream font-medium text-xs hover:bg-terracotta-hover active:scale-[0.98] transition-all shadow-warm-md"
                                >
                                  <Eye className="w-3 h-3" />
                                  View
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      <div className="px-2.5 py-2 flex items-center justify-between">
                        <p className="text-[10px] font-mono uppercase tracking-[0.1em] text-dark-brown/50">
                          {view.label}
                        </p>
                        {unlocked &&
                          !view.loading &&
                          !view.error &&
                          view.imageUrl && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() =>
                                  onRegenerate(product.productId, view.viewType)
                                }
                                className="w-5 h-5 rounded-full bg-surface hover:bg-line flex items-center justify-center transition-colors"
                                title="Regenerate"
                              >
                                <RefreshCw className="w-2.5 h-2.5 text-dark-brown" />
                              </button>
                              <button
                                onClick={() =>
                                  onDownload(
                                    view.imageUrl,
                                    product.productId,
                                    view.viewType
                                  )
                                }
                                className="w-5 h-5 rounded-full bg-surface hover:bg-line flex items-center justify-center transition-colors"
                                title="Download"
                              >
                                <Download className="w-2.5 h-2.5 text-dark-brown" />
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
        })}
      </div>

      {/* Sourcy free sample CTA */}
      <div className="rounded-xl border border-line bg-surface overflow-hidden">
        <div className="px-6 py-5 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 text-center sm:text-left">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-terracotta mb-1">
              Ready to make it real?
            </p>
            <p className="font-display text-lg text-burgundy leading-snug">
              Get a free sample from Sourcy
            </p>
            <p className="text-xs text-dark-brown/60 mt-1">
              We&apos;ll source and ship you a physical branded sample — no commitment needed.
            </p>
          </div>
          <a
            href={sourcingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-burgundy text-cream font-medium text-sm hover:bg-burgundy/90 active:scale-[0.98] transition-all whitespace-nowrap"
          >
            Get Free Sample
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
