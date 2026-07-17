"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { ArrowLeft, ArrowRight, Wand2 } from "lucide-react";
import { DesignPicker } from "@/components/pickleball/design-picker";
import { BrandInput } from "@/components/brand-input";
import {
  BagGeneratedResults,
  type ImageView,
  type ViewType,
} from "@/components/pickleball/bag-generated-results";
import { Stepper } from "@/components/stepper";
import { BAG_DESIGNS } from "@/lib/pickleball-products";
import Image from "next/image";
import Link from "next/link";

const STEPS = [
  { label: "Design & Color", mono: "01" },
  { label: "Brand", mono: "02" },
  { label: "Preview", mono: "03" },
];

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

export default function PickleballBuilder() {
  const [step, setStep] = useState(0);
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [brandName, setBrandName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [views, setViews] = useState<ImageView[]>([]);

  // Ref so regenerate always sees the latest state without being recreated on every update
  const viewsRef = useRef(views);
  useEffect(() => {
    viewsRef.current = views;
  }, [views]);

  const design = useMemo(
    () => BAG_DESIGNS.find((d) => d.id === selectedDesignId) ?? null,
    [selectedDesignId]
  );
  const color = useMemo(
    () => design?.colors.find((c) => c.id === selectedColorId) ?? null,
    [design, selectedColorId]
  );
  const material = useMemo(
    () => design?.materials.find((m) => m.id === selectedMaterialId) ?? null,
    [design, selectedMaterialId]
  );

  const canProceedStep0 = !!design && !!color && !!material;
  const canProceedStep1 = brandName.trim().length > 0 || logoFile !== null;

  const sourcingUrl = useMemo(() => {
    const designName = design?.name ?? "pickleball bag";
    const details = [color?.name, material?.name].filter(Boolean).join(", ");
    const suffix = details ? ` (${details})` : "";
    const query = brandName.trim()
      ? `Custom ${brandName} ${designName}${suffix}`
      : `Custom branded ${designName}${suffix}`;
    return `https://www.sourcy.ai/onboard?q=${encodeURIComponent(query)}`;
  }, [design, color, material, brandName]);

  const fetchView = useCallback(
    async (viewType: ViewType, referenceImage?: File | null): Promise<string> => {
      if (!design || !color || !material) throw new Error("No design selected");
      const formData = new FormData();
      formData.append("designId", design.id);
      formData.append("colorId", color.id);
      formData.append("materialId", material.id);
      formData.append("brandName", brandName);
      formData.append("viewType", viewType);
      if (logoFile) formData.append("logo", logoFile);
      if (referenceImage) formData.append("referenceImage", referenceImage);

      const res = await fetch("/api/generate-bag", { method: "POST", body: formData });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data.imageUrl as string;
    },
    [design, color, material, brandName, logoFile]
  );

  const setView = useCallback(
    (viewType: ViewType, patch: Partial<ImageView>) => {
      setViews((prev) =>
        prev.map((v) => (v.viewType === viewType ? { ...v, ...patch } : v))
      );
    },
    []
  );

  const generateImages = useCallback(async () => {
    if (!design || !color || !material) return;
    setStep(2);

    setViews(
      VIEWS.map(({ viewType, label }) => ({
        viewType,
        label,
        imageUrl: "",
        loading: true,
      }))
    );

    // Front restyles the real reference photo into the chosen color/material + logo.
    let frontImageUrl: string | null = null;
    try {
      frontImageUrl = await fetchView("front");
      setView("front", { loading: false, imageUrl: frontImageUrl });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error — please try again";
      setView("front", { loading: false, error: message });
    }

    // Logo and back both derive from the restyled front as a reference — logo for
    // consistency, back only as a fallback for designs with no real back photo
    // (the API uses the real back photo directly when one exists).
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
        try {
          const imageUrl = await fetchView(viewType, referenceFile);
          setView(viewType, { loading: false, imageUrl });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Network error — please try again";
          setView(viewType, { loading: false, error: message });
        }
      })
    );
  }, [design, color, material, fetchView, setView]);

  const regenerate = useCallback(
    async (viewType: ViewType) => {
      if (!design || !color || !material) return;

      setView(viewType, { loading: true, error: undefined });

      // Logo/back derive from the current front image as a reference for consistency
      let referenceFile: File | null = null;
      if (viewType !== "front") {
        const frontView = viewsRef.current.find((v) => v.viewType === "front");
        if (frontView?.imageUrl && !frontView.error) {
          try {
            referenceFile = dataUrlToFile(frontView.imageUrl, "reference.png");
          } catch {
            // reference unavailable
          }
        }
      }

      try {
        const imageUrl = await fetchView(viewType, referenceFile);
        setView(viewType, { loading: false, imageUrl, error: undefined });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Network error — please try again";
        setView(viewType, { loading: false, error: message });
      }
    },
    [design, color, material, fetchView, setView]
  );

  const downloadImage = useCallback(
    (imageUrl: string, viewType: ViewType) => {
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = `${brandName.toLowerCase().replace(/\s+/g, "-") || "brand"}-${design?.id}-${viewType}.png`;
      link.click();
    },
    [brandName, design]
  );

  return (
    <div className="min-h-screen bg-cream">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-cream/80 backdrop-blur-md border-b border-line/60">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image
              src="/assets/sourcy-wordmark-color.png"
              alt="Sourcy"
              width={100}
              height={28}
              className="h-7 w-auto"
            />
          </Link>
          <span className="font-mono text-xs uppercase tracking-[0.15em] text-dark-brown/50">
            Pickleball &amp; Padel Bag Builder
          </span>
        </div>
      </header>

      <main className="max-w-[800px] mx-auto px-6 py-12 md:py-20">
        {/* Hero - only on step 0 */}
        {step === 0 && (
          <div className="text-center mb-12">
            <p className="font-mono text-xs uppercase tracking-[0.15em] text-terracotta mb-3">
              Custom Court Bags
            </p>
            <h1 className="font-display text-3xl md:text-[44px] leading-[1.1] text-burgundy mb-4">
              Design your own <em className="text-terracotta italic">pickleball & padel bag</em>
            </h1>
            <p className="text-dark-brown/60 max-w-lg mx-auto text-base md:text-lg">
              Pick a real, sourceable bag, choose your color and material, add
              your logo, and get production-ready mockups in seconds. Powered
              by AI, produced by Sourcy.
            </p>
          </div>
        )}

        {/* Stepper */}
        <div className="mb-10">
          <Stepper currentStep={step} steps={STEPS} />
        </div>

        {/* Step 0: Pick Design & Color */}
        {step === 0 && (
          <div className="space-y-8">
            <div>
              <h2 className="font-display text-xl md:text-2xl text-burgundy mb-2">
                Pick a bag, colorway & material
              </h2>
              <p className="text-sm text-dark-brown/60">
                Choose a real base design, then make it yours.
              </p>
            </div>
            <DesignPicker
              selectedDesignId={selectedDesignId}
              selectedColorId={selectedColorId}
              selectedMaterialId={selectedMaterialId}
              onSelectDesign={setSelectedDesignId}
              onSelectColor={setSelectedColorId}
              onSelectMaterial={setSelectedMaterialId}
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
        {step === 2 && design && color && material && (
          <div className="space-y-10">
            <BagGeneratedResults
              designName={design.name}
              colorName={color.name}
              materialName={material.name}
              exwPrice={design.exwPrice}
              moq={design.moq}
              views={views}
              brandName={brandName}
              onRegenerate={regenerate}
              onDownload={downloadImage}
              sourcingUrl={sourcingUrl}
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
                  setSelectedDesignId(null);
                  setSelectedColorId(null);
                  setSelectedMaterialId(null);
                  setBrandName("");
                  setLogoFile(null);
                  setLogoPreview(null);
                  setViews([]);
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
