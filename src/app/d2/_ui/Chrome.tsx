// Shared shell pieces: the engraved wordmark and the top bar with the product's places.
import Link from "next/link";
import type { ReactNode } from "react";
import { href } from "../_lib/routes";

export function Wordmark() {
  return (
    <Link href={href.home()} className="wm" aria-label="CaseClerk home">
      <svg className="wm-mark" width="14" height="12" viewBox="0 0 14 12" aria-hidden="true">
        <path d="M0 0h14L7 12z" />
      </svg>
      <span className="wm-text">CaseClerk</span>
    </Link>
  );
}

type Place = "cases" | "policy" | "home";

export function TopBar({ here, children }: { here?: Place; children?: ReactNode }) {
  return (
    <header className="bar">
      <div className="bar-in">
        <Wordmark />
        <nav className="bar-nav" aria-label="Main">
          {children}
          <Link href={href.cases()} aria-current={here === "cases" ? "page" : undefined}>
            Cases
          </Link>
          <Link href={href.policy()} aria-current={here === "policy" ? "page" : undefined}>
            Rules
          </Link>
        </nav>
        <p className="bar-env">PayPal sandbox, live data</p>
      </div>
    </header>
  );
}
