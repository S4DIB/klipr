"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo, BoltMark } from "@/components/ui/logo";
import { IconLogin } from "@/components/icons";
import { cn } from "@/lib/cn";

const links = [
  { label: "Watch", href: "#demo" },
  { label: "How it works", href: "#how" },
  { label: "Features", href: "#features" },
  { label: "For brands", href: "#brands" },
  { label: "FAQ", href: "#faq" },
];

/** Floating capsule nav — frosted ivory Klipr Glass over the page, Dark
 *  Amethyst logo + Royal-Violet CTA (matches the product app chrome). */
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
      {/* Width collapses inward on scroll: wide + transparent at the top of the
          page, then a compact floating glass pill once scrolled. */}
      <div
        className={cn(
          "mx-auto w-full px-4 transition-[max-width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] sm:px-6",
          scrolled ? "max-w-[1080px]" : "max-w-[1240px]",
        )}
      >
        <nav
          className={cn(
            "relative flex h-14 items-center justify-between overflow-hidden rounded-full transition-[background-color,border-color,box-shadow,padding] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
            scrolled
              ? "border border-[rgba(53,5,90,0.06)] bg-white/85 pl-5 pr-2 shadow-[0_16px_40px_-18px_rgba(31,3,53,0.22)] backdrop-blur-2xl backdrop-saturate-[1.4] sm:pl-7"
              : "border-0 bg-transparent pl-2 pr-2 shadow-none",
          )}
        >
          {/* glass sheen — light catching the top rim of the pill; fades in once
              the nav collapses on scroll */}
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-full bg-gradient-to-b from-white/80 to-transparent transition-opacity duration-500",
              scrolled ? "opacity-100" : "opacity-0",
            )}
          />

          <Link
            href="/"
            aria-label="Klipr home"
            className="relative z-10 rounded-full text-text-hi transition-opacity hover:opacity-80"
          >
            <Logo className="text-text-hi" />
          </Link>

          {/* Centered section links. Shown only from the width where the
              collapsed pill still fits links + both actions without overlap —
              so they never collide with the CTA and never vanish on scroll. */}
          <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 min-[1120px]:flex">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="whitespace-nowrap text-sm text-text-mid transition-colors hover:text-text-hi"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="relative z-10 flex items-center gap-1 sm:gap-1.5">
            <Link
              href="/login"
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[rgba(125,4,215,0.35)] bg-white/50 px-4 text-sm font-semibold tracking-tight text-volt-600 transition-all duration-200 hover:border-volt-500 hover:bg-[rgba(125,4,215,0.07)] hover:text-volt-500 active:scale-[0.98] sm:px-5"
            >
              <IconLogin size={16} strokeWidth={1.4} />
              Sign in
            </Link>
            <a
              href="#waitlist"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-volt-500 px-5 text-sm font-semibold tracking-tight text-white shadow-[0_2px_6px_-2px_rgba(125,4,215,0.35)] transition-all duration-200 hover:bg-violet-700 hover:shadow-[0_4px_12px_-3px_rgba(125,4,215,0.4)] active:scale-[0.98]"
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
