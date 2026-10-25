"use client";
import { useReducedMotion, type Transition } from "motion/react";

/** Under reduced motion every transition becomes a 120 ms fade; the caller's transition otherwise. */
export function useT(): (t: Transition) => Transition {
  const reduce = useReducedMotion();
  return (t) => (reduce ? { duration: 0.12, ease: "linear" } : t);
}
