// Shared shell pieces: the engraved wordmark and the top bar.
import Link from "next/link";
import type { ReactNode } from "react";

export function Wordmark() {
  return (
    <Link href="/d2" className="wm" aria-label="CaseClerk home">
      <svg className="wm-mark" width="14" height="12" viewBox="0 0 14 12" aria-hidden="true">
        <path d="M0 0h14L7 12z" />
      </svg>
      <span className="wm-text">CaseClerk</span>
    </Link>
  );
}

export function TopBar({ children }: { children?: ReactNode }) {
  return (
    <header className="bar">
      <div className="bar-in">
        <Wordmark />
        <nav className="bar-nav" aria-label="Main">
          {children}
        </nav>
        <p className="bar-env">PayPal sandbox, live data</p>
      </div>
    </header>
  );
}
