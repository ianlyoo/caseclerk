import type { ReactNode } from "react";
import { Hanken_Grotesk, IBM_Plex_Mono } from "next/font/google";
import s from "./a.module.css";

const sans = Hanken_Grotesk({ subsets: ["latin"], weight: ["300", "400", "500"], variable: "--a-sans" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400"], variable: "--a-mono" });

export const metadata = { title: "CaseClerk, draft A", robots: { index: false } };

export default function DraftALayout({ children }: { children: ReactNode }) {
  return <div className={`${sans.variable} ${mono.variable} ${s.root}`}>{children}</div>;
}
