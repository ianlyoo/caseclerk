import type { ReactNode } from "react";
import { Hanken_Grotesk, JetBrains_Mono, Newsreader } from "next/font/google";
import { Store } from "./_ui/store";
import s from "./b.module.css";

const serif = Newsreader({ subsets: ["latin"], weight: ["400"], style: ["normal", "italic"], variable: "--f-serif", display: "swap" });
const sans = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "500"], variable: "--f-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400"], variable: "--f-mono", display: "swap" });

export const metadata = {
  title: "CaseClerk, Final B",
  description: "An AI dispute desk for small PayPal sellers, working on a real PayPal sandbox.",
};

export default function FinalBLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${s.root} ${serif.variable} ${sans.variable} ${mono.variable}`}>
      <Store>{children}</Store>
    </div>
  );
}
