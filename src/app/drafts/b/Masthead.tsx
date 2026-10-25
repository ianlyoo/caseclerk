import Link from "next/link";
import { CASES, SELLER } from "../_data";
import s from "./b.module.css";

const approvals = CASES.filter((c) => c.state === "approval").length;

export function Masthead({ here }: { here: "inbox" | "case" }) {
  return (
    <header className={s.mast}>
      <Link href="/drafts/b/inbox" className={s.mark}>
        CaseClerk
      </Link>
      <nav className={s.mastNav}>
        <Link href="/drafts/b/inbox" className={here === "inbox" ? s.lit : undefined}>
          Disputes
        </Link>
        <Link href="/drafts/b/case">Waiting for you, {approvals}</Link>
        <a href="/board">Deadlines</a>
        <a href="#policy">Policy</a>
      </nav>
      <span className={s.mastSeller}>{SELLER.name}, PayPal sandbox</span>
    </header>
  );
}
