import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Archivo } from "next/font/google";
import "./d2.css";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });

export const metadata: Metadata = {
  title: "CaseClerk: PayPal disputes, answered",
  description:
    "CaseClerk answers PayPal disputes for small sellers and asks before it moves money. Built on real PayPal sandbox disputes.",
};

export default function D2Layout({ children }: { children: ReactNode }) {
  return (
    <div className={`d2 ${archivo.variable}`} data-space-root>
      {children}
    </div>
  );
}
