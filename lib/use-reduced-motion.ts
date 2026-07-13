"use client";

import { useSyncExternalStore } from "react";

/**
 * Hydration-stable reduced-motion + low-power detection.
 * Returns true when motion should be suppressed (DESIGN.md §6 accessibility).
 * Uses useSyncExternalStore so SSR and first client render agree.
 */
function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Low-power heuristic — treat weak devices like reduced-motion for heavy effects.
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  const lowPower =
    (nav.deviceMemory !== undefined && nav.deviceMemory < 4) ||
    (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency <= 4) ||
    nav.connection?.saveData === true;
  return reduce || lowPower;
}

/** Server snapshot — always false so first paint matches server HTML. */
function getServerSnapshot(): boolean {
  return false;
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
