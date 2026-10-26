// The product's frame: Archivo (with its width axis) and the top-plate styles, around any route that shows CaseClerk.
// The root layout stays plain because /board (Bryntum) shares it.
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Archivo } from "next/font/google";
import "../d2.css";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });

export const SITE: Metadata = {
  title: "CaseClerk: PayPal disputes, answered",
  description:
    "CaseClerk answers PayPal disputes for small sellers, within the limits they set. Built on real PayPal sandbox disputes.",
};

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className={`d2 ${archivo.variable}`} data-space-root>
      {children}
    </div>
  );
}
