"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { ArrowLeft, ArrowRight, Wand2 } from "lucide-react";
import { ProductPicker } from "@/components/product-picker";
import { BrandInput } from "@/components/brand-input";
import { ImageUpload } from "@/components/image-upload";
import {
  GeneratedResults,
  type GeneratedProduct,
  type ViewType,
} from "@/components/generated-results";
import { UnlockModal, type LeadData } from "@/components/lead-capture";
import { Stepper } from "@/components/stepper";
import { PRODUCTS } from "@/lib/products";
import Image from "next/image";

const VIEWS: Array<{ viewType: ViewType; label: string }> = [
  { viewType: "logo", label: "Logo" },
  { viewType: "front", label: "Front" },
  { viewType: "back", label: "Back" },
];

function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, data] = dataUrl.split(",");
  const mimeType = header.match(/:(.*?);/)?.[1] ?? "image/png";
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: mimeType });
}

export default function Home() {
  const [step, setStep] = useState(0);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [brandName, setBrandName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [customImage, setCustomImage] = useState<File | null>(null);
  const [customImagePreview, setCustomImagePreview] = useState<string | null>(null);
  const [generatedProducts, setGeneratedProducts] = useState<GeneratedProduct[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  // Ref so regenerate always sees the latest state without being recreated on every update
  const generatedProductsRef = useRef(generatedProducts);
  generatedProductsRef.current = generatedProducts;

  const canProceedStep0 = selectedProducts.length > 0;
  const canProceedStep1 = brandName.trim().length > 0 || logoFile !== null;

  const sourcingUrl = useMemo(() => {
    const product = PRODUCTS.find((p) => p.id === selectedProducts[0]);
    const productName = product?.name ?? "product";
    const query = brandName.trim()
      ? `Custom ${brandName} ${productName}`
      : `Custom branded ${productName}`;
    return `https://www.sourcy.ai/onboard?q=${encodeURIComponent(query)}`;
  }, [selectedProducts, brandName]);

  const fetchView = useCallback(
    async (
      productId: string,
      viewType: ViewType,
      referenceImage?: File | null
    ): Promise<string> => {
      const formData = new FormData();
      formData.append("productId", productId);
      formData.append("brandName", brandName);
      formData.append("viewType", viewType);
      if (logoFile) formData.append("logo", logoFile);
      if (customImage) formData.append("customImage", customImage);
      if (referenceImage) formData.append("referenceImage", referenceImage);

      const res = await fetch("/api/generate", { method: "POST", body: formData });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data.imageUrl as string;
    },
    [brandName, logoFile, customImage]
  );

  const setView = useCallback(
    (
      productId: string,
      viewType: ViewType,
      patch: Partial<GeneratedProduct["views"][number]>
    ) => {
      setGeneratedProducts((prev) =>
        prev.map((p) =>
          p.productId === productId
            ? { ...p, views: p.views.map((v) => (v.viewType === viewType ? { ...v, ...patch } : v)) }
            : p
        )
      );
    },
    []
  );

  const generateImages = useCallback(async () => {
    setIsGenerating(true);
    setStep(2);

    setGeneratedProducts(
      selectedProducts.map((id) => ({
        productId: id,
        views: VIEWS.map(({ viewType, label }) => ({
          viewType,
          label,
          imageUrl: "",
          loading: true,
        })),
      }))
    );

    for (const productId of selectedProducts) {
      // Phase 1: generate front first — sets the visual baseline for the other two views
      let frontImageUrl: string | null = null;
      try {
        frontImageUrl = await fetchView(productId, "front");
        setView(productId, "front", { loading: false, imageUrl: frontImageUrl });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Network error — please try again";
        setView(productId, "front", { loading: false, error: message });
      }

      // Phase 2: generate logo + back in parallel, passing the front as a reference
      // so the AI reproduces the same product/logo/style in both derived views.
      let referenceFile: File | null = null;
      if (frontImageUrl) {
        try {
          referenceFile = dataUrlToFile(frontImageUrl, "reference.png");
        } catch {
          // reference unavailable — generate independently
        }
      }

      await Promise.all(
        (["logo", "back"] as ViewType[]).map(async (viewType) => {
          const label = VIEWS.find((v) => v.viewType === viewType)!.label;
          try {
            const imageUrl = await fetchView(productId, viewType, referenceFile);
            setView(productId, viewType, { loading: false, imageUrl });
          } catch (err) {
            const message = err instanceof Error ? err.message : "Network error — please try again";
            setView(productId, viewType, { loading: false, error: message, label });
          }
        })
      );
    }

    setIsGenerating(false);
  }, [selectedProducts, fetchView, setView]);

  const regenerate = useCallback(
    async (productId: string, viewType: ViewType) => {
      setView(productId, viewType, { loading: true, error: undefined });

      // For logo/back, pass the current front image as reference for consistency
      let referenceFile: File | null = null;
      if (viewType !== "front") {
        const frontView = generatedProductsRef.current
          .find((p) => p.productId === productId)
          ?.views.find((v) => v.viewType === "front");
        if (frontView?.imageUrl && !frontView.error) {
          try {
            referenceFile = dataUrlToFile(frontView.imageUrl, "reference.png");
          } catch {
            // reference unavailable
          }
        }
      }

      try {
        const imageUrl = await fetchView(productId, viewType, referenceFile);
        setView(productId, viewType, { loading: false, imageUrl, error: undefined });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Network error — please try again";
        setView(productId, viewType, { loading: false, error: message });
      }
    },
    [fetchView, setView]
  );

  const downloadImage = useCallback(
    (imageUrl: string, productId: string, viewType: ViewType) => {
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = `${brandName.toLowerCase().replace(/\s+/g, "-")}-${productId}-${viewType}.png`;
      link.click();
    },
    [brandName]
  );

  const handleUnlock = useCallback(
    (data: LeadData) => {
      console.log("Lead captured:", { ...data, brandName, selectedProducts });
      setUnlocked(true);
      setShowUnlockModal(false);
    },
    [brandName, selectedProducts]
  );

  return (
    <div className="min-h-screen bg-cream">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-cream/80 backdrop-blur-md border-b border-line/60">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <Image
            src="/assets/sourcy-wordmark-color.png"
            alt="Sourcy"
            width={100}
            height={28}
            className="h-7 w-auto"
          />
          <span className="font-mono text-xs uppercase tracking-[0.15em] text-dark-brown/50">
            Brand Builder
          </span>
        </div>
      </header>

      <main className="max-w-[800px] mx-auto px-6 py-12 md:py-20">
        {/* Hero - only on step 0 */}
        {step === 0 && (
          <div className="text-center mb-12">
            <p className="font-mono text-xs uppercase tracking-[0.15em] text-terracotta mb-3">
              Custom Merchandise
            </p>
            <h1 className="font-display text-3xl md:text-[44px] leading-[1.1] text-burgundy mb-4">
              See your brand on <em className="text-terracotta italic">real products</em>
            </h1>
            <p className="text-dark-brown/60 max-w-lg mx-auto text-base md:text-lg">
              Pick your products, upload your logo, and get production-ready
              mockups in seconds. Powered by AI, produced by Sourcy.
            </p>
          </div>
        )}

        {/* Stepper */}
        <div className="mb-10">
          <Stepper currentStep={step} />
        </div>

        {/* Step 0: Pick Products */}
        {step === 0 && (
          <div className="space-y-8">
            <div>
              <h2 className="font-display text-xl md:text-2xl text-burgundy mb-2">
                What are you building?
              </h2>
              <p className="text-sm text-dark-brown/60">
                Select one or more products for your brand.
              </p>
            </div>
            <ProductPicker
              selected={selectedProducts}
              onSelect={setSelectedProducts}
            />
            <div className="flex justify-end">
              <button
                onClick={() => setStep(1)}
                disabled={!canProceedStep0}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-terracotta text-cream font-medium text-sm hover:bg-terracotta-hover active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Brand Info */}
        {step === 1 && (
          <div className="space-y-8">
            <div>
              <h2 className="font-display text-xl md:text-2xl text-burgundy mb-2">
                Tell us about your brand
              </h2>
              <p className="text-sm text-dark-brown/60">
                Add your brand name, logo, or both — whatever you have is enough.
              </p>
            </div>

            <BrandInput
              brandName={brandName}
              onBrandNameChange={setBrandName}
              logoFile={logoFile}
              onLogoChange={(file, preview) => {
                setLogoFile(file);
                setLogoPreview(preview);
              }}
              logoPreview={logoPreview}
            />

            <div className="border-t border-line pt-8">
              <ImageUpload
                image={customImage}
                imagePreview={customImagePreview}
                onImageChange={(file, preview) => {
                  setCustomImage(file);
                  setCustomImagePreview(preview);
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep(0)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-line text-dark-brown text-sm hover:bg-surface transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={generateImages}
                disabled={!canProceedStep1}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-terracotta text-cream font-medium text-sm hover:bg-terracotta-hover active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Wand2 className="w-4 h-4" />
                Generate Mockups
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Results */}
        {step === 2 && (
          <div className="space-y-10">
            <GeneratedResults
              products={generatedProducts}
              brandName={brandName}
              unlocked={unlocked}
              onRegenerate={regenerate}
              onDownload={downloadImage}
              onRequestUnlock={() => setShowUnlockModal(true)}
              sourcingUrl={sourcingUrl}
            />

            <UnlockModal
              open={showUnlockModal}
              onClose={() => setShowUnlockModal(false)}
              onSubmit={handleUnlock}
            />

            <div className="flex items-center justify-between pt-4 border-t border-line">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-line text-dark-brown text-sm hover:bg-surface transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Edit Brand
              </button>
              <button
                onClick={() => {
                  setStep(0);
                  setSelectedProducts([]);
                  setBrandName("");
                  setLogoFile(null);
                  setLogoPreview(null);
                  setCustomImage(null);
                  setCustomImagePreview(null);
                  setGeneratedProducts([]);
                  setUnlocked(false);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-line text-dark-brown text-sm hover:bg-surface transition-all"
              >
                Start Over
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-line/60 mt-auto">
        <div className="max-w-[1200px] mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-dark-brown/40">
            Sourcy Brand Builder — your sourcing partner, the team you&apos;d
            have hired.
          </p>
          <p className="font-mono text-xs text-dark-brown/30 tracking-[0.05em]">
            Powered by Sourcy &times; Gemini
          </p>
        </div>
      </footer>
    </div>
  );
}
