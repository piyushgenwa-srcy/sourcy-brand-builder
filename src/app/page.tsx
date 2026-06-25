"use client";

import { useState, useCallback } from "react";
import { ArrowLeft, ArrowRight, Wand2 } from "lucide-react";
import { ProductPicker } from "@/components/product-picker";
import { BrandInput } from "@/components/brand-input";
import { ImageUpload } from "@/components/image-upload";
import { GeneratedResults, type GeneratedImage } from "@/components/generated-results";
import { UnlockModal, type LeadData } from "@/components/lead-capture";
import { Stepper } from "@/components/stepper";
import Image from "next/image";

export default function Home() {
  const [step, setStep] = useState(0);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [brandName, setBrandName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [customImage, setCustomImage] = useState<File | null>(null);
  const [customImagePreview, setCustomImagePreview] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  const canProceedStep0 = selectedProducts.length > 0;
  const canProceedStep1 = brandName.trim().length > 0;

  const generateImages = useCallback(async () => {
    setIsGenerating(true);
    setStep(2);

    const initial: GeneratedImage[] = selectedProducts.map((id) => ({
      productId: id,
      imageUrl: "",
      loading: true,
    }));
    setGeneratedImages(initial);

    for (const productId of selectedProducts) {
      try {
        const formData = new FormData();
        formData.append("productId", productId);
        formData.append("brandName", brandName);
        if (logoFile) formData.append("logo", logoFile);
        if (customImage) formData.append("customImage", customImage);

        const res = await fetch("/api/generate", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        if (data.error) {
          setGeneratedImages((prev) =>
            prev.map((img) =>
              img.productId === productId
                ? { ...img, loading: false, error: data.error }
                : img
            )
          );
        } else {
          setGeneratedImages((prev) =>
            prev.map((img) =>
              img.productId === productId
                ? { ...img, loading: false, imageUrl: data.imageUrl }
                : img
            )
          );
        }
      } catch {
        setGeneratedImages((prev) =>
          prev.map((img) =>
            img.productId === productId
              ? { ...img, loading: false, error: "Network error — please try again" }
              : img
          )
        );
      }
    }

    setIsGenerating(false);
  }, [selectedProducts, brandName, logoFile, customImage]);

  const regenerate = useCallback(
    async (productId: string) => {
      setGeneratedImages((prev) =>
        prev.map((img) =>
          img.productId === productId
            ? { ...img, loading: true, error: undefined }
            : img
        )
      );

      try {
        const formData = new FormData();
        formData.append("productId", productId);
        formData.append("brandName", brandName);
        if (logoFile) formData.append("logo", logoFile);
        if (customImage) formData.append("customImage", customImage);

        const res = await fetch("/api/generate", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        if (data.error) {
          setGeneratedImages((prev) =>
            prev.map((img) =>
              img.productId === productId
                ? { ...img, loading: false, error: data.error }
                : img
            )
          );
        } else {
          setGeneratedImages((prev) =>
            prev.map((img) =>
              img.productId === productId
                ? { ...img, loading: false, imageUrl: data.imageUrl }
                : img
            )
          );
        }
      } catch {
        setGeneratedImages((prev) =>
          prev.map((img) =>
            img.productId === productId
              ? { ...img, loading: false, error: "Network error — please try again" }
              : img
          )
        );
      }
    },
    [brandName, logoFile, customImage]
  );

  const downloadImage = useCallback(
    (imageUrl: string, productId: string) => {
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = `${brandName.toLowerCase().replace(/\s+/g, "-")}-${productId}.png`;
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
                Your brand name and logo will be applied to each product.
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
              images={generatedImages}
              brandName={brandName}
              unlocked={unlocked}
              onRegenerate={regenerate}
              onDownload={downloadImage}
              onRequestUnlock={() => setShowUnlockModal(true)}
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
                  setGeneratedImages([]);
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
