import Link from "next/link";
import { SELLER } from "../_data";
import { ApprovalCount } from "./Controls";
import s from "./a.module.css";

export function Bar({ active }: { active: "inbox" | "case" | "approvals" | "deadlines" }) {
  return (
    <header className={s.bar}>
      <Link href="/drafts/a/inbox" className={s.mark}>
        CaseClerk
      </Link>
      <nav className={s.nav}>
        <Link href="/drafts/a/inbox" className={active === "inbox" ? s.on : undefined}>
          Disputes
        </Link>
        <Link href="/drafts/a/inbox?f=approval" className={active === "approvals" ? s.on : undefined}>
          Approvals <ApprovalCount className={s.count} />
        </Link>
        <Link href="/drafts/a/deadlines" className={active === "deadlines" ? s.on : undefined}>
          Deadlines
        </Link>
      </nav>
      <span className={s.seller}>
        {SELLER.name}
        <span className={s.sandbox}>PayPal sandbox</span>
      </span>
    </header>
  );
}
