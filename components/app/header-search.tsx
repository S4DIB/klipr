"use client";

import { useSearchParams } from "next/navigation";
import { IconSearch } from "@/components/icons";

/**
 * Desktop header search — a plain GET form (works without JS) that lands on
 * /campaigns?q=…, where the marketplace filters by name, brand, and niche.
 */
export function HeaderSearch({ placeholder }: { placeholder: string }) {
  const q = useSearchParams().get("q") ?? "";
  return (
    <form
      action="/campaigns"
      role="search"
      className="hidden h-10 w-[240px] items-center gap-2 rounded-full bg-[rgba(53,5,90,0.05)] pl-4 pr-3 transition-colors focus-within:bg-[rgba(53,5,90,0.08)] lg:flex xl:w-[320px]"
    >
      <IconSearch size={15} strokeWidth={1.5} className="shrink-0 text-ink-400" />
      <input
        type="search"
        name="q"
        key={q}
        defaultValue={q}
        placeholder={placeholder}
        className="w-full bg-transparent text-[13.5px] text-ink-900 outline-none placeholder:text-ink-500"
      />
    </form>
  );
}
