import type { ReactNode } from "react";

export const metadata = {
  title: "CaseClerk",
  description: "AI dispute desk for small PayPal sellers (sandbox spike)",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>{children}</body>
    </html>
  );
}
