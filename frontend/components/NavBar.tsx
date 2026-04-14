"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Upload & Analyze" },
  { href: "/generate", label: "Generate" },
  { href: "/history", label: "History" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-[#E2E8F0] sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-[#1B3A6B] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 11L7 3L12 11" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 8h6" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </span>
          <span className="font-semibold text-[#1B3A6B] text-base tracking-tight">OutreachOS</span>
        </div>

        <div className="flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === l.href
                  ? "bg-[#1B3A6B] text-white"
                  : "text-[#64748B] hover:text-[#1B3A6B] hover:bg-[#f0f4fb]"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
