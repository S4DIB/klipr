"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo, BoltMark } from "@/components/ui/logo";
import { cn } from "@/lib/cn";

const links = [
  { label: "Watch", href: "#demo" },
  { label: "How it works", href: "#how" },
  { label: "Features", href: "#features" },
  { label: "FAQ", href: "#faq" },
];

/** Floating capsule nav — frosted-glass Dark Amethyst over the page, yellow
 *  logo + CTA (the primary logo colorway from the brand guideline). */
export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-3 z-50 sm:top-5">
      <div className="mx-auto w-full max-w-[1100px] px-4 sm:px-6">
        <nav
          className={cn(
            "relative flex h-14 items-center justify-between overflow-hidden rounded-full border border-white/15 pl-5 pr-2 backdrop-blur-2xl backdrop-saturate-150 transition-all duration-300 sm:pl-7",
            scrolled
              ? "bg-[#210338]/55 shadow-[0_18px_44px_-14px_rgba(20,2,38,0.5)]"
              : "bg-[#210338]/30 shadow-[0_10px_34px_-18px_rgba(20,2,38,0.45)]",
          )}
        >
          {/* glass sheen — light catching the top rim of the capsule */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-full bg-gradient-to-b from-white/12 to-transparent"
          />

          <Link
            href="/"
            aria-label="Klipr home"
            className="relative z-10 rounded-full text-yellow transition-opacity hover:opacity-90"
          >
            <Logo className="text-yellow" />
          </Link>

          <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-white/70 transition-colors hover:text-white"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="relative z-10 flex items-center">
            <a
              href="#waitlist"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-yellow px-5 text-sm font-semibold tracking-tight text-volt-600 transition-all duration-200 hover:brightness-95 active:scale-[0.98]"
            >
              <BoltMark className="h-[0.85em]" />
              Join the waitlist
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
