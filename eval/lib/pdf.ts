// Plain evidence pack for eval/run-live.ts until W1's src/lib/evidence/pdf.ts is on main.
import { PDFDocument, StandardFonts } from "pdf-lib";
import type { EvidencePort } from "../../src/lib/agent/ports";

function wrap(text: string, max = 92): string[] {
  const out: string[] = [];
  for (const para of text.split(/\n+/)) {
    let line = "";
    for (const w of para.split(/\s+/)) {
      if ((line + " " + w).trim().length > max) {
        out.push(line);
        line = w;
      } else line = (line + " " + w).trim();
    }
    out.push(line, "");
  }
  return out;
}

export const evalEvidence: EvidencePort = {
  async buildEvidencePdf({ case: c, order, narrative, exhibits }) {
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    let page = pdf.addPage([595, 842]);
    let y = 800;
    const put = (s: string, f = font, size = 10) => {
      if (y < 50) {
        page = pdf.addPage([595, 842]);
        y = 800;
      }
      // Helvetica (WinAnsi) can't encode every character; keep the pack printable.
      page.drawText(s.replace(/[^\x20-\x7E]/g, "?"), { x: 48, y, size, font: f });
      y -= size + 5;
    };
    put("Seller evidence pack", bold, 16);
    put(`Dispute ${c.id} · ${c.snapshot.reason} · ${c.snapshot.amount.value} ${c.snapshot.amount.currency_code}`);
    if (order.orderId) put(`Order ${order.orderId}${order.captureId ? ` · capture ${order.captureId}` : ""}`);
    y -= 8;
    put("Seller statement", bold, 12);
    wrap(narrative).forEach((l) => put(l));
    for (const e of exhibits) {
      put(e.title, bold, 12);
      wrap(e.body).forEach((l) => put(l));
    }
    return pdf.save();
  },
};
