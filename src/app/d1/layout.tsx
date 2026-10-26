import type { Metadata } from "next";
import localFont from "next/font/local";
import "./desk.css";

const publicSans = localFont({
  src: "../../../public/d1/fonts/PublicSans.ttf",
  display: "swap",
  variable: "--font-desk",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Dispute desk — CaseClerk",
  description: "An AI dispute desk for PayPal sellers. Review real sandbox cases and prepared evidence.",
};

export default function DeskLayout({ children }: { children: React.ReactNode }) {
  return <div className={`desk ${publicSans.variable}`}>{children}</div>;
}
