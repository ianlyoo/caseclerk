import type { ReactNode } from "react";
import { Newsreader, Spline_Sans_Mono } from "next/font/google";
import s from "./b.module.css";

const serif = Newsreader({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--b-serif",
});
const mono = Spline_Sans_Mono({ subsets: ["latin"], weight: ["400"], variable: "--b-mono" });

export const metadata = { title: "CaseClerk, draft B", robots: { index: false } };

export default function DraftBLayout({ children }: { children: ReactNode }) {
  return <div className={`${serif.variable} ${mono.variable} ${s.root}`}>{children}</div>;
}
