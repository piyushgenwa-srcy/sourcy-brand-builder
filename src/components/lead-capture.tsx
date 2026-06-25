"use client";

import { useState, useRef, useEffect } from "react";
import { Eye, X } from "lucide-react";

export type LeadData = {
  email: string;
  phone: string;
  company: string;
};

export function UnlockModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: LeadData) => void;
}) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) emailRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-burgundy/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-xl border border-line bg-white shadow-warm-lg p-8 animate-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface hover:bg-line flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-dark-brown" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-terracotta/10 mx-auto flex items-center justify-center mb-3">
            <Eye className="w-5 h-5 text-terracotta" />
          </div>
          <h3 className="font-display text-xl text-burgundy mb-1">
            Unlock your mockups
          </h3>
          <p className="text-sm text-dark-brown/60">
            Enter your details to view and download your branded product visuals.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({ email, phone, company });
          }}
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="unlock-email"
              className="block font-mono text-xs uppercase tracking-[0.15em] text-dark-brown/60 mb-1.5"
            >
              Work Email
            </label>
            <input
              ref={emailRef}
              id="unlock-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-cream text-burgundy text-sm placeholder:text-dark-brown/30 focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta transition-all"
            />
          </div>
          <div>
            <label
              htmlFor="unlock-phone"
              className="block font-mono text-xs uppercase tracking-[0.15em] text-dark-brown/60 mb-1.5"
            >
              Phone Number
            </label>
            <input
              id="unlock-phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+63 912 345 6789"
              className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-cream text-burgundy text-sm placeholder:text-dark-brown/30 focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta transition-all"
            />
          </div>
          <div>
            <label
              htmlFor="unlock-company"
              className="block font-mono text-xs uppercase tracking-[0.15em] text-dark-brown/60 mb-1.5"
            >
              Company Name
            </label>
            <input
              id="unlock-company"
              type="text"
              required
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Your company"
              className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-cream text-burgundy text-sm placeholder:text-dark-brown/30 focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta transition-all"
            />
          </div>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-terracotta text-cream font-medium text-sm hover:bg-terracotta-hover active:scale-[0.98] transition-all mt-2"
          >
            <Eye className="w-4 h-4" />
            View My Mockups
          </button>
          <p className="text-xs text-dark-brown/40 text-center">
            We&apos;ll reach out to discuss your merch project. No spam.
          </p>
        </form>
      </div>
    </div>
  );
}
