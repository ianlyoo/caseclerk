"use client";
// The evidence pack as raised paper sheets, read in place. The pages carry the same text, in the same order,
// as buildEvidencePdf (src/lib/evidence/pdf.ts) writes into the PDF, from the same input object.
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { EvidencePdfInput } from "@/lib/evidence/pdf";
import { useT } from "./motion";
import { OPEN_PACK } from "./Sheet";
import s from "../b.module.css";

// Mirrors of the PDF builder's formatters (kept here so the page bundle doesn't carry pdf-lib).
const REASONS: Record<string, string> = {
  MERCHANDISE_OR_SERVICE_NOT_RECEIVED: "Item not received",
  MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED: "Item not as described",
  UNAUTHORISED: "Unauthorized transaction",
  DUPLICATE_TRANSACTION: "Duplicate transaction",
};
const reasonLabel = (r: string) => REASONS[r] ?? r.toLowerCase().replace(/_/g, " ");
function fm(m?: { value: string; currency_code: string }) {
  if (!m) return "-";
  const v = Number(m.value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return m.currency_code === "USD" ? `$${v} USD` : `${v} ${m.currency_code}`;
}
function fd(iso?: string, withTime = false) {
  if (!iso) return "-";
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
  if (!withTime) return date;
  return `${date}, ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" })} UTC`;
}

function pages(input: EvidencePdfInput) {
  const sn = input.case.snapshot;
  const o = input.order;
  const facts: [string, string][] = [
    ["Case ID", sn.id],
    ["Reason", reasonLabel(sn.reason)],
    ["Disputed amount", fm(sn.amount)],
    ["Stage / status", `${sn.stage} / ${sn.status.replace(/_/g, " ")}`],
    ["PayPal transaction", sn.sellerTransactionId ?? o.captureId ?? "-"],
  ];
  if (o.orderId) facts.push(["Order", o.orderId]);
  if (sn.invoiceId) facts.push(["Invoice", sn.invoiceId]);
  if (sn.sellerResponseDueDate) facts.push(["Response due", fd(sn.sellerResponseDueDate, true)]);
  if (input.seller) facts.push(["Seller", input.seller.name]);
  const tl: { at: string; label: string }[] = [];
  if (o.paidAt) tl.push({ at: o.paidAt, label: "Order paid" });
  for (const sh of o.shipping ?? []) if (sh.deliveredAt) tl.push({ at: sh.deliveredAt, label: `Delivered (${sh.carrier} ${sh.trackingNumber})` });
  tl.push({ at: sn.createTime, label: `Dispute opened: ${reasonLabel(sn.reason)}` });
  tl.sort((a, b) => a.at.localeCompare(b.at));
  if (sn.sellerResponseDueDate) tl.push({ at: sn.sellerResponseDueDate, label: "Seller response due" });
  const cur = o.items[0]?.unitAmount.currency_code ?? "USD";
  const itemsTotal = o.items.reduce((n, i) => n + Number(i.unitAmount.value) * i.quantity, 0);
  const extra = input.amountCharged ? Number(input.amountCharged.value) - itemsTotal : 0;
  return { sn, o, facts, tl, cur, itemsTotal, extra };
}

function Page({ n, of, id, children, title }: { n: number; of: number; id: string; children: React.ReactNode; title: string }) {
  return (
    <article className={s.page} aria-label={`Page ${n}, ${title}`}>
      <div className={s.pageBody}>{children}</div>
      <p className={s.pageFoot}>
        <span>PayPal case {id}</span>
        <span>
          Section {n} of {of}
        </span>
      </p>
    </article>
  );
}

function Pack({ input }: { input: EvidencePdfInput }) {
  const { sn, o, facts, tl, cur, itemsTotal, extra } = pages(input);
  const paras = input.narrative.trim().split(/\n\s*\n/);
  const id = sn.id;
  return [
    <Page key="1" n={1} of={4} id={id} title="Cover">
      <div className={s.pgBand}>
        <p className={s.pgKicker}>SELLER RESPONSE AND EVIDENCE</p>
        <p className={s.pgTitle}>PayPal case {id}</p>
        <p className={s.pgSub}>
          {reasonLabel(sn.reason)} | {fm(sn.amount)}
        </p>
      </div>
      <dl className={s.pgFacts}>
        {facts.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <p className={s.pgH}>Timeline</p>
      <dl className={s.pgFacts}>
        {tl.map((t) => (
          <div key={t.label}>
            <dt>{fd(t.at, true)}</dt>
            <dd>{t.label}</dd>
          </div>
        ))}
      </dl>
    </Page>,
    <Page key="2" n={2} of={4} id={id} title="Order details">
      <p className={s.pgH}>1. Order details</p>
      <table className={s.pgTable}>
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Unit price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {o.items.map((i) => (
            <tr key={i.name}>
              <td>
                {i.name}
                {i.description ? <span className={s.pgMuted}>{i.description}</span> : null}
              </td>
              <td>{i.quantity}</td>
              <td>{fm(i.unitAmount)}</td>
              <td>{fm({ currency_code: i.unitAmount.currency_code, value: (Number(i.unitAmount.value) * i.quantity).toFixed(2) })}</td>
            </tr>
          ))}
          {extra > 0.004 ? (
            <tr>
              <td>Shipping and other charges</td>
              <td />
              <td />
              <td>{fm({ currency_code: cur, value: extra.toFixed(2) })}</td>
            </tr>
          ) : null}
        </tbody>
        <tfoot>
          <tr>
            <td>{input.amountCharged ? "Total charged" : "Items subtotal"}</td>
            <td />
            <td />
            <td>{fm(input.amountCharged ?? { currency_code: cur, value: itemsTotal.toFixed(2) })}</td>
          </tr>
        </tfoot>
      </table>
      <dl className={s.pgFacts}>
        {o.paidAt ? (
          <div>
            <dt>Paid</dt>
            <dd>{fd(o.paidAt, true)}</dd>
          </div>
        ) : null}
        {o.buyerCountry ? (
          <div>
            <dt>Ship-to country</dt>
            <dd>{o.buyerCountry}</dd>
          </div>
        ) : null}
      </dl>
      <p className={s.pgH}>2. Shipping and delivery</p>
      {o.shipping?.length ? (
        <>
          <p className={s.pgMuted}>Tracking was uploaded to PayPal on the original transaction and is visible in the case.</p>
          {o.shipping.map((sh) => (
            <dl className={s.pgFacts} key={sh.trackingNumber}>
              <div>
                <dt>Carrier</dt>
                <dd>{sh.carrier}</dd>
              </div>
              <div>
                <dt>Tracking number</dt>
                <dd>{sh.trackingNumber}</dd>
              </div>
              <div>
                <dt>Carrier status</dt>
                <dd>{sh.status ? sh.status.replace(/_/g, " ") : "-"}</dd>
              </div>
              {sh.deliveredAt ? (
                <div>
                  <dt>Delivered</dt>
                  <dd>{fd(sh.deliveredAt, true)}</dd>
                </div>
              ) : null}
              {sh.trackingUrl ? (
                <div>
                  <dt>Tracking link</dt>
                  <dd className={s.pgBreak}>{sh.trackingUrl}</dd>
                </div>
              ) : null}
            </dl>
          ))}
        </>
      ) : (
        <p className={s.pgMuted}>No shipment tracking is on file for this order.</p>
      )}
    </Page>,
    <Page key="3" n={3} of={4} id={id} title="Seller statement">
      <p className={s.pgH}>3. Seller statement</p>
      {paras.map((p, i) => (
        <p key={i} className={s.pgP}>
          {p.split("\n").join(" ")}
        </p>
      ))}
    </Page>,
    <Page key="4" n={4} of={4} id={id} title="Exhibits">
      <p className={s.pgH}>4. Exhibits</p>
      {input.exhibits.map((e, i) => (
        <div key={e.title} className={s.pgEx}>
          <p className={s.pgExT}>
            Exhibit {String.fromCharCode(65 + i)}: {e.title}
          </p>
          <p className={`${s.pgP} ${s.pgBreak}`}>{e.body}</p>
        </div>
      ))}
    </Page>,
  ];
}

const TITLES = ["Cover and timeline", "Order and delivery", "Seller statement", "Exhibits"];

export function Dossier({ input, real, note }: { input: EvidencePdfInput; real: boolean; note?: string }) {
  const T = useT();
  const [open, setOpen] = useState<number | null>(null);
  const [dl, setDl] = useState<"idle" | "building" | "error">("idle");
  const readerRef = useRef<HTMLDivElement>(null);
  const all = Pack({ input });
  useEffect(() => {
    const go = () => setOpen(0);
    document.addEventListener(OPEN_PACK, go);
    return () => document.removeEventListener(OPEN_PACK, go);
  }, []);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    const el = readerRef.current?.querySelectorAll("article")[open] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "start" });
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const download = useCallback(async () => {
    setDl("building");
    try {
      const { buildEvidencePdf } = await import("@/lib/evidence/pdf");
      const bytes = await buildEvidencePdf(input);
      const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${input.case.id}-evidence.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setDl("idle");
    } catch {
      setDl("error");
    }
  }, [input]);

  return (
    <section className={s.dossier} aria-label="Evidence pack">
      <div className={s.secHead}>
        <h2 className={s.h2}>The evidence pack</h2>
        {note ? <p className={s.secNote}>{note}</p> : null}
      </div>
      <ul className={s.sheets}>
        {all.map((p, i) => (
          <li key={i}>
            <div
              role="button"
              tabIndex={0}
              className={s.sheetBtn}
              onClick={() => setOpen(i)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setOpen(i))}
              aria-label={`Read page ${i + 1}, ${TITLES[i]}`}
            >
              <div className={s.sheet} aria-hidden data-object>
                {p}
              </div>
              <span className={s.sheetCap}>
                {i + 1}. {TITLES[i]}
              </span>
            </div>
          </li>
        ))}
      </ul>
      <AnimatePresence>
        {open !== null ? (
          <motion.div
            className={s.readerScrim}
            onClick={() => setOpen(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={T({ duration: 0.32 })}
            data-cause="nav"
          >
            <motion.div
              className={s.reader}
              data-object
              role="dialog"
              aria-modal="true"
              aria-label="Evidence pack reader"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12 }}
              transition={T({ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] })}
              data-cause="nav"
            >
              <div className={s.readerBar}>
                <button type="button" className={s.textBtn} onClick={download} disabled={dl === "building"}>
                  {dl === "building" ? "Building the PDF" : real ? "Download the PDF of the filed evidence" : "Download this sample PDF"}
                </button>
                {dl === "error" ? <span className={s.err}>The PDF could not be built here. Nothing else changed.</span> : null}
                <button type="button" className={s.textBtn} onClick={() => setOpen(null)}>
                  Close
                </button>
              </div>
              <div className={s.readerPages} ref={readerRef}>
                {all}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
