// Evidence pack PDF for a PayPal dispute: a short, plain document a human reviewer can read in a minute.
// Cover (case facts + timeline), order details, shipping proof, seller statement, exhibits.
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { CaseRecord, Money, OrderContext } from "../types";

export type EvidencePdfInput = {
  case: CaseRecord;
  order: OrderContext;
  narrative: string; // seller statement; blank lines split paragraphs, "- " starts a bullet
  exhibits: { title: string; body: string }[];
  seller?: { name: string; website?: string; contact?: string };
  /** Total the buyer paid (items + shipping/tax). Adds a shipping-and-other row when above the items subtotal. */
  amountCharged?: Money;
  generatedAt?: Date;
};

const PAGE = { w: 612, h: 792 }; // US Letter
const M = { x: 54, top: 54, bottom: 60 };
const CONTENT_W = PAGE.w - M.x * 2;
const C = {
  ink: rgb(0.11, 0.13, 0.17),
  muted: rgb(0.42, 0.45, 0.5),
  rule: rgb(0.85, 0.87, 0.9),
  band: rgb(0.09, 0.2, 0.37),
  accent: rgb(0.0, 0.44, 0.73),
  zebra: rgb(0.96, 0.97, 0.98),
  white: rgb(1, 1, 1),
};

const REASONS: Record<string, string> = {
  MERCHANDISE_OR_SERVICE_NOT_RECEIVED: "Item not received",
  MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED: "Item not as described",
  UNAUTHORISED: "Unauthorized transaction",
  CREDIT_NOT_PROCESSED: "Credit not processed",
  DUPLICATE_TRANSACTION: "Duplicate transaction",
  INCORRECT_AMOUNT: "Incorrect amount",
  PAYMENT_BY_OTHER_MEANS: "Paid by other means",
  CANCELED_RECURRING_BILLING: "Canceled recurring billing",
  PROBLEM_WITH_REMITTANCE: "Problem with remittance",
  OTHER: "Other",
};

export function reasonLabel(reason: string): string {
  return REASONS[reason] ?? reason.toLowerCase().replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

/** Standard fonts are WinAnsi only: map common Unicode punctuation and drop anything else. */
export function winAnsi(text: string): string {
  return text
    .replace(/[‘’‚′]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/[→⇒]/g, "->")
    .replace(/[←]/g, "<-")
    .replace(/[≤]/g, "<=")
    .replace(/[≥]/g, ">=")
    .replace(/[   ]/g, " ")
    .replace(/\t/g, "    ")
    .replace(/[^\n\x20-\x7E¡-ÿ–—•…€™]/g, "");
}

export function formatMoney(m?: Money): string {
  if (!m) return "-";
  const n = Number(m.value);
  const sym = m.currency_code === "USD" ? "$" : m.currency_code === "EUR" ? "€" : "";
  const v = n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return sym ? `${sym}${v} ${m.currency_code}` : `${v} ${m.currency_code}`;
}

export function formatDate(iso?: string, withTime = false): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const date = d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
  if (!withTime) return date;
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" });
  return `${date}, ${time} UTC`;
}

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const out: string[] = [];
  for (const para of winAnsi(text).split("\n")) {
    const words = para.split(/ +/);
    let line = "";
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) <= width) {
        line = next;
        continue;
      }
      if (line) out.push(line);
      // Break words longer than the line (tracking URLs, ids).
      let w = word;
      while (font.widthOfTextAtSize(w, size) > width) {
        let i = w.length;
        while (i > 1 && font.widthOfTextAtSize(w.slice(0, i), size) > width) i--;
        out.push(w.slice(0, i));
        w = w.slice(i);
      }
      line = w;
    }
    out.push(line);
  }
  return out;
}

class Writer {
  page!: PDFPage;
  y = 0;
  readonly doc: PDFDocument;
  readonly font: PDFFont;
  readonly bold: PDFFont;
  constructor(doc: PDFDocument, font: PDFFont, bold: PDFFont) {
    this.doc = doc;
    this.font = font;
    this.bold = bold;
    this.newPage();
  }
  newPage() {
    this.page = this.doc.addPage([PAGE.w, PAGE.h]);
    this.y = PAGE.h - M.top;
  }
  ensure(h: number) {
    if (this.y - h < M.bottom) this.newPage();
  }
  text(s: string, o: { x?: number; size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; width?: number; lineGap?: number } = {}) {
    const size = o.size ?? 10;
    const f = o.bold ? this.bold : this.font;
    const lh = size * (o.lineGap ?? 1.4);
    for (const line of wrap(s, f, size, o.width ?? CONTENT_W - ((o.x ?? M.x) - M.x))) {
      this.ensure(lh);
      this.page.drawText(line, { x: o.x ?? M.x, y: this.y - size, size, font: f, color: o.color ?? C.ink });
      this.y -= lh;
    }
  }
  gap(h: number) {
    this.y -= h;
  }
  rule(color = C.rule) {
    this.page.drawLine({ start: { x: M.x, y: this.y }, end: { x: PAGE.w - M.x, y: this.y }, thickness: 0.75, color });
  }
  heading(n: number, title: string) {
    this.ensure(48);
    this.gap(14);
    this.page.drawText(winAnsi(`${n}. ${title}`), { x: M.x, y: this.y - 13, size: 13, font: this.bold, color: C.band });
    this.y -= 19;
    this.rule(C.accent);
    this.gap(8);
  }
  /** Two-column key/value table with zebra rows. */
  facts(rows: [string, string][], keyW = 150) {
    const size = 9.5;
    rows.forEach(([k, v], i) => {
      const lines = wrap(v, this.font, size, CONTENT_W - keyW - 12);
      const h = lines.length * size * 1.35 + 7;
      this.ensure(h);
      if (i % 2 === 0) this.page.drawRectangle({ x: M.x, y: this.y - h, width: CONTENT_W, height: h, color: C.zebra });
      this.page.drawText(winAnsi(k), { x: M.x + 6, y: this.y - size - 3.5, size, font: this.bold, color: C.muted });
      lines.forEach((l, j) => this.page.drawText(l, { x: M.x + keyW, y: this.y - size - 3.5 - j * size * 1.35, size, font: this.font, color: C.ink }));
      this.y -= h;
    });
  }
  /** Table with header row; columns are [title, width, align]. */
  table(cols: [string, number, "left" | "right"][], rows: string[][], footer?: string[]) {
    const size = 9.5;
    const rowH = 18;
    const drawRow = (cells: string[], f: PDFFont, fill?: ReturnType<typeof rgb>, color = C.ink) => {
      const wrapped = cells.map((c, i) => wrap(c, f, size, cols[i][1] - 12));
      const h = Math.max(rowH, Math.max(...wrapped.map((w) => w.length)) * size * 1.35 + 7);
      this.ensure(h);
      if (fill) this.page.drawRectangle({ x: M.x, y: this.y - h, width: CONTENT_W, height: h, color: fill });
      let x = M.x;
      wrapped.forEach((lines, i) => {
        const [, w, align] = cols[i];
        lines.forEach((l, j) => {
          const tx = align === "right" ? x + w - 6 - f.widthOfTextAtSize(l, size) : x + 6;
          this.page.drawText(l, { x: tx, y: this.y - size - 4 - j * size * 1.35, size, font: f, color });
        });
        x += w;
      });
      this.y -= h;
    };
    drawRow(cols.map((c) => c[0]), this.bold, C.band, C.white);
    rows.forEach((r, i) => drawRow(r, this.font, i % 2 ? C.zebra : undefined));
    if (footer) {
      this.rule();
      drawRow(footer, this.bold);
    }
  }
  bullets(items: string[], size = 10) {
    for (const item of items) {
      const lines = wrap(item, this.font, size, CONTENT_W - 16);
      lines.forEach((l, j) => {
        this.ensure(size * 1.45);
        if (j === 0) this.page.drawText("•", { x: M.x + 2, y: this.y - size, size, font: this.font, color: C.accent });
        this.page.drawText(l, { x: M.x + 14, y: this.y - size, size, font: this.font, color: C.ink });
        this.y -= size * 1.45;
      });
    }
  }
}

type TimelineEntry = { at: string; label: string };

function timeline(input: EvidencePdfInput): TimelineEntry[] {
  const s = input.case.snapshot;
  const raw = (s.raw ?? {}) as { evidences?: { source?: string; date?: string; evidence_type?: string }[] };
  const out: TimelineEntry[] = [];
  if (input.order.paidAt) out.push({ at: input.order.paidAt, label: "Order paid" });
  for (const sh of input.order.shipping ?? []) {
    if (sh.deliveredAt) out.push({ at: sh.deliveredAt, label: `Delivered (${sh.carrier} ${sh.trackingNumber})` });
  }
  out.push({ at: s.createTime, label: `Dispute opened: ${reasonLabel(s.reason)}` });
  for (const e of raw.evidences ?? []) {
    if (e.source === "SUBMITTED_BY_SELLER" && e.date) out.push({ at: e.date, label: `Seller evidence submitted (${(e.evidence_type ?? "").toLowerCase().replace(/_/g, " ")})` });
  }
  out.sort((a, b) => a.at.localeCompare(b.at));
  if (s.sellerResponseDueDate) out.push({ at: s.sellerResponseDueDate, label: "Seller response due" });
  return out;
}

function lineTotal(i: OrderContext["items"][number]): Money {
  return { currency_code: i.unitAmount.currency_code, value: (Number(i.unitAmount.value) * i.quantity).toFixed(2) };
}

export async function buildEvidencePdf(input: EvidencePdfInput): Promise<Uint8Array> {
  const s = input.case.snapshot;
  const { order } = input;
  const generated = input.generatedAt ?? new Date();
  const doc = await PDFDocument.create();
  doc.setTitle(`Evidence for PayPal case ${s.id}`);
  doc.setSubject(`${reasonLabel(s.reason)}, ${formatMoney(s.amount)}`);
  doc.setAuthor(input.seller?.name ?? "Seller");
  doc.setProducer("CaseClerk");
  doc.setCreator("CaseClerk");
  doc.setCreationDate(generated);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const w = new Writer(doc, font, bold);

  // Cover band
  const bandH = 86;
  w.page.drawRectangle({ x: 0, y: PAGE.h - bandH, width: PAGE.w, height: bandH, color: C.band });
  w.page.drawText("SELLER RESPONSE AND EVIDENCE", { x: M.x, y: PAGE.h - 32, size: 9, font: bold, color: rgb(0.7, 0.8, 0.92) });
  w.page.drawText(winAnsi(`PayPal case ${s.id}`), { x: M.x, y: PAGE.h - 56, size: 20, font: bold, color: C.white });
  w.page.drawText(winAnsi(`${reasonLabel(s.reason)}  |  ${formatMoney(s.amount)}`), { x: M.x, y: PAGE.h - 74, size: 11, font, color: rgb(0.85, 0.9, 0.96) });
  if (input.seller?.name) {
    const t = winAnsi(input.seller.name);
    w.page.drawText(t, { x: PAGE.w - M.x - bold.widthOfTextAtSize(t, 11), y: PAGE.h - 56, size: 11, font: bold, color: C.white });
  }
  w.y = PAGE.h - bandH - 22;

  const raw = (s.raw ?? {}) as { external_reason_code?: string };
  const facts: [string, string][] = [
    ["Case ID", s.id],
    ["Reason", `${reasonLabel(s.reason)}${raw.external_reason_code ? ` (card network code ${raw.external_reason_code})` : ""}`],
    ["Disputed amount", formatMoney(s.amount)],
    ["Stage / status", `${s.stage} / ${s.status.replace(/_/g, " ")}`],
    ["PayPal transaction", s.sellerTransactionId ?? order.captureId ?? "-"],
  ];
  if (order.orderId) facts.push(["Order", order.orderId]);
  if (s.invoiceId) facts.push(["Invoice", s.invoiceId]);
  if (s.sellerResponseDueDate) facts.push(["Response due", formatDate(s.sellerResponseDueDate, true)]);
  if (input.seller) facts.push(["Seller", [input.seller.name, input.seller.website, input.seller.contact].filter(Boolean).join("  |  ")]);
  w.facts(facts);

  w.gap(14);
  w.text("Timeline", { size: 11, bold: true, color: C.band });
  w.gap(2);
  for (const t of timeline(input)) {
    w.ensure(16);
    w.page.drawCircle({ x: M.x + 4, y: w.y - 6, size: 2.5, color: C.accent });
    w.page.drawText(winAnsi(formatDate(t.at, true)), { x: M.x + 14, y: w.y - 9.5, size: 9.5, font: bold, color: C.muted });
    w.text(t.label, { x: M.x + 150, size: 9.5 });
  }

  // 1. Order
  w.heading(1, "Order details");
  const currency = order.items[0]?.unitAmount.currency_code ?? s.amount.currency_code;
  const itemsTotal = order.items.reduce((n, i) => n + Number(i.unitAmount.value) * i.quantity, 0);
  const rows = order.items.map((i) => [i.description ? `${i.name}\n${i.description}` : i.name, String(i.quantity), formatMoney(i.unitAmount), formatMoney(lineTotal(i))]);
  const charged = input.amountCharged;
  const extra = charged ? Number(charged.value) - itemsTotal : 0;
  if (extra > 0.004) rows.push(["Shipping and other charges", "", "", formatMoney({ currency_code: currency, value: extra.toFixed(2) })]);
  w.table(
    [
      ["Item", CONTENT_W - 210, "left"],
      ["Qty", 50, "right"],
      ["Unit price", 80, "right"],
      ["Total", 80, "right"],
    ],
    rows,
    [charged ? "Total charged" : "Items subtotal", "", "", formatMoney(charged ?? { currency_code: currency, value: itemsTotal.toFixed(2) })],
  );
  w.gap(6);
  const orderFacts: [string, string][] = [];
  if (order.paidAt) orderFacts.push(["Paid", formatDate(order.paidAt, true)]);
  if (charged && charged.value !== s.amount.value) orderFacts.push(["Disputed amount", formatMoney(s.amount)]);
  if (order.buyerCountry) orderFacts.push(["Ship-to country", order.buyerCountry]);
  if (orderFacts.length) w.facts(orderFacts);

  // 2. Shipping
  w.heading(2, "Shipping and delivery");
  if (order.shipping?.length) {
    w.text("Tracking was uploaded to PayPal on the original transaction and is visible in the case.", { size: 9, color: C.muted });
    w.gap(4);
    for (const sh of order.shipping) {
      const rows: [string, string][] = [
        ["Carrier", sh.carrier],
        ["Tracking number", sh.trackingNumber],
        ["Carrier status", sh.status ? sh.status.replace(/_/g, " ") : "-"],
      ];
      if (sh.deliveredAt) rows.push(["Delivered", formatDate(sh.deliveredAt, true)]);
      if (sh.trackingUrl) rows.push(["Tracking link", sh.trackingUrl]);
      w.facts(rows);
      w.gap(6);
    }
  } else {
    w.text("No shipment tracking is on file for this order.", { size: 10, color: C.muted });
  }

  // 3. Statement
  w.heading(3, "Seller statement");
  for (const para of input.narrative.trim().split(/\n\s*\n/)) {
    const lines = para.split("\n");
    if (lines.every((l) => /^\s*[-*•]\s+/.test(l))) {
      w.bullets(lines.map((l) => l.replace(/^\s*[-*•]\s+/, "")));
    } else {
      w.text(lines.join(" "), { size: 10, lineGap: 1.45 });
    }
    w.gap(6);
  }

  // 4. Exhibits
  if (input.exhibits.length) {
    w.heading(4, "Exhibits");
    input.exhibits.forEach((e, i) => {
      w.ensure(40);
      w.text(`Exhibit ${String.fromCharCode(65 + (i % 26))}: ${e.title}`, { size: 10.5, bold: true });
      w.gap(1);
      w.text(e.body, { size: 9.5, x: M.x + 12, color: C.ink });
      w.gap(8);
    });
  }

  // Footer on every page
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    p.drawLine({ start: { x: M.x, y: 40 }, end: { x: PAGE.w - M.x, y: 40 }, thickness: 0.5, color: C.rule });
    const left = winAnsi(`PayPal case ${s.id}  |  Generated ${formatDate(generated.toISOString(), true)}`);
    const right = `Page ${i + 1} of ${pages.length}`;
    p.drawText(left, { x: M.x, y: 28, size: 8, font, color: C.muted });
    p.drawText(right, { x: PAGE.w - M.x - font.widthOfTextAtSize(right, 8), y: 28, size: 8, font, color: C.muted });
  });

  return doc.save();
}
