"use client";

import { Check } from "lucide-react";

const STEPS = [
  { label: "Products", mono: "01" },
  { label: "Brand", mono: "02" },
  { label: "Preview", mono: "03" },
];

export function Stepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-0">
      {STEPS.map((step, i) => {
        const isCompleted = i < currentStep;
        const isCurrent = i === currentStep;

        return (
          <div key={step.mono} className="flex items-center">
            {i > 0 && (
              <div
                className={`w-12 md:w-20 h-px mx-2 transition-colors ${
                  isCompleted ? "bg-terracotta" : "bg-line"
                }`}
              />
            )}
            <div className="flex items-center gap-2.5">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-medium transition-all
                  ${
                    isCompleted
                      ? "bg-terracotta text-cream"
                      : isCurrent
                        ? "bg-burgundy text-cream"
                        : "bg-surface text-dark-brown/40 border border-line"
                  }
                `}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  step.mono
                )}
              </div>
              <span
                className={`text-sm hidden md:block transition-colors ${
                  isCurrent
                    ? "text-burgundy font-medium"
                    : isCompleted
                      ? "text-terracotta"
                      : "text-dark-brown/40"
                }`}
              >
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
