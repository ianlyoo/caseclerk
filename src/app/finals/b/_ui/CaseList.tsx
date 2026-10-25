"use client";
// The slim persistent case list on the left of the case page.
import Link from "next/link";
import { countdown, hoursLeft, isOpen, sorted, usd, type Case } from "../_lib/data";
import { useDesk } from "./store";
import s from "../b.module.css";

export function deskLine(c: Case, phase?: string): string {
  if (c.desk === "approval" && (phase === "sent" || phase === "sending")) return "Evidence filed, PayPal is deciding";
  if (phase === "resolved") return "PayPal decided for you";
  return {
    new: "Just arrived",
    working: "Agent working",
    approval: "Needs your answer",
    paypal: "With PayPal",
    won: "Decided for you",
    settled: `Settled, kept ${usd(c.kept ?? "0")}`,
  }[c.desk];
}

export function CaseList({ current }: { current: string }) {
  const { phase, real } = useDesk();
  const list = sorted(real);
  return (
    <aside className={s.list} aria-label="Your disputes">
      <p className={s.listHead}>
        {list.filter(isOpen).length} open, {list.length - list.filter(isOpen).length} closed
      </p>
      <ol>
        {list.map((c) => {
          const p = phase(c.id);
          const urgent = c.dueAt && isOpen(c) && hoursLeft(c.dueAt) < 72 && p !== "sent" && p !== "resolved";
          const needs = c.desk === "approval" && (!p || p === "pending" || p === "undo" || p === "failed");
          return (
            <li key={c.id}>
              <Link href={`/finals/b/case/${c.id}`} className={c.id === current ? s.listOn : undefined} aria-current={c.id === current ? "page" : undefined}>
                <span className={s.listItem}>{c.short}</span>
                <span className={s.listAmt}>{usd(c.amount)}</span>
                <span className={`${s.listMeta} ${needs ? s.listNeeds : ""}`} data-cause="approve">
                  {deskLine(c, p)}
                  {c.dueAt && isOpen(c) && p !== "sent" && p !== "resolved" ? (
                    <span className={urgent ? s.urgent : undefined}>, {countdown(c.dueAt)} left</span>
                  ) : null}
                </span>
                <span className={s.listTag}>{c.real ? "Real sandbox case" : "Staged sample"}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
