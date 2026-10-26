"use client";
// Re-reads a server-rendered list now and then, so cases PayPal delivers while the page is open show up.
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function Refresh({ every }: { every: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, every);
    return () => window.clearInterval(id);
  }, [every, router]);
  return null;
}
