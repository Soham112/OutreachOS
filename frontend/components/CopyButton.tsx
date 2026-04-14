"use client";
import { useState } from "react";

interface CopyButtonProps {
  text: string;
  label?: string;
  small?: boolean;
}

export default function CopyButton({ text, label = "Copy", small }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (small) {
    return (
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-1 text-xs font-medium text-[#64748B] hover:text-[#1B3A6B] transition-colors"
      >
        {copied ? (
          <>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="#8FAF8F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Copied!
          </>
        ) : (
          <>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="4" y="4" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M3 8H2a1 1 0 01-1-1V2a1 1 0 011-1h5a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
            {label}
          </>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150 ${
        copied
          ? "border-[#8FAF8F] text-[#2d6a2d] bg-[#f4f9f4]"
          : "border-[#CBD5E1] text-[#64748B] bg-white hover:border-[#1B3A6B] hover:text-[#1B3A6B]"
      }`}
    >
      {copied ? (
        <>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2.5 7l3 3 6-6" stroke="#8FAF8F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="4.5" y="4.5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M3.5 9.5H2a1.5 1.5 0 01-1.5-1.5V2A1.5 1.5 0 012 .5h6A1.5 1.5 0 019.5 2v1.5" stroke="currentColor" strokeWidth="1.3"/>
          </svg>
          {label}
        </>
      )}
    </button>
  );
}
