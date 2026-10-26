import type { ReactNode } from "react";

export const metadata = {
  title: "CaseClerk",
  description: "CaseClerk answers PayPal disputes for small sellers and asks before it moves money.",
};

// Plain on purpose: the product pages bring their own frame (d2/_ui/Shell); /board brings Bryntum's.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>{children}</body>
    </html>
  );
}
