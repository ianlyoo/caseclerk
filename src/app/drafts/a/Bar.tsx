import Link from "next/link";
import { CASES, SELLER } from "../_data";
import s from "./a.module.css";

const approvals = CASES.filter((c) => c.state === "approval").length;

export function Bar({ active }: { active: "inbox" | "case" }) {
  return (
    <header className={s.bar}>
      <Link href="/drafts/a/inbox" className={s.mark}>
        CaseClerk
      </Link>
      <nav className={s.nav}>
        <Link href="/drafts/a/inbox" className={active === "inbox" ? s.on : undefined}>
          Disputes
        </Link>
        <Link href="/drafts/a/case">
          Approvals <span className={s.count}>{approvals}</span>
        </Link>
        <a href="/board">Deadlines</a>
        <a href="#policy">Policy</a>
      </nav>
      <span className={s.seller}>
        {SELLER.name}
        <span className={s.sandbox}>Sandbox</span>
      </span>
    </header>
  );
}
