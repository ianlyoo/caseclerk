import Link from "next/link";
import { SELLER } from "../_data";
import { WaitingCount } from "./Controls";
import s from "./b.module.css";

export function Masthead({ here }: { here: "inbox" | "case" | "deadlines" }) {
  return (
    <header className={s.mast}>
      <Link href="/drafts/b/inbox" className={s.mark}>
        CaseClerk
      </Link>
      <nav className={s.mastNav}>
        <Link href="/drafts/b/inbox" className={here === "inbox" ? s.lit : undefined}>
          Disputes
        </Link>
        <Link href="/drafts/b/inbox#waiting">
          Waiting for you, <WaitingCount />
        </Link>
        <Link href="/drafts/b/deadlines" className={here === "deadlines" ? s.lit : undefined}>
          Deadlines
        </Link>
      </nav>
      <span className={s.mastSeller}>{SELLER.name}, PayPal sandbox</span>
    </header>
  );
}
