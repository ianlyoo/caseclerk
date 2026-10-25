// Usage (all sandbox):
//   node disputes.mjs list [disputed_transaction_id]
//   node disputes.mjs get <id>
//   node disputes.mjs create <buyer_transaction_id> [amount] [reason]   (a) buyer-side create-dispute simulator
//   node disputes.mjs chargeback <seller_transaction_id> <merchant_id> [amount]   (b) process-chargeback simulator
//   node disputes.mjs send-message <id> "<text>"
//   node disputes.mjs make-offer <id> <amount> [offer_type]
//   node disputes.mjs provide-evidence <id> [evidence_type]           multipart: input JSON + generated PDF
//   node disputes.mjs require-evidence <id> [SELLER_EVIDENCE|BUYER_EVIDENCE]
//   node disputes.mjs adjudicate <id> [SELLER_FAVOR|BUYER_FAVOR]
//   node disputes.mjs escalate <id> "<note>"
//   node disputes.mjs watch <id> [seconds]                            poll status/stage/links until it changes
import { api, show } from "./lib.mjs";
import { PDFDocument, StandardFonts } from "pdf-lib";

const [cmd, ...args] = process.argv.slice(2);
const D = "/v1/customer/disputes";

function summary(d) {
  if (!d || typeof d !== "object") return d;
  return {
    dispute_id: d.dispute_id, reason: d.reason, status: d.status, stage: d.dispute_life_cycle_stage,
    channel: d.dispute_channel, amount: d.dispute_amount, outcome: d.dispute_outcome?.outcome_code,
    seller_response_due_date: d.seller_response_due_date, create_time: d.create_time, update_time: d.update_time,
    txn: d.disputed_transactions?.map((t) => ({ seller_transaction_id: t.seller_transaction_id, buyer_transaction_id: t.buyer_transaction_id })),
    evidences_requested: d.evidences?.map((e) => `${e.evidence_type}/${e.source}`),
    allowed_offer_types: d.allowed_response_options?.make_offer?.offer_types,
    links: d.links?.map((l) => l.rel),
  };
}

function multipart(input, files = []) {
  const form = new FormData();
  form.append("input", new Blob([JSON.stringify(input)], { type: "application/json" }));
  files.forEach((f, i) => form.append(`file${i + 1}`, new Blob([f.bytes], { type: f.type }), f.name));
  return form;
}

async function evidencePdf(disputeId) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const lines = [
    "CaseClerk evidence pack (sandbox spike)",
    `Dispute: ${disputeId}`,
    `Generated: ${new Date().toISOString()}`,
    "Proof of fulfilment: shipped via USPS, tracking 9400111899223817000000.",
    "Delivered to the address on the PayPal transaction.",
  ];
  lines.forEach((t, i) => page.drawText(t, { x: 50, y: 790 - i * 22, size: 12, font }));
  return { bytes: await pdf.save(), type: "application/pdf", name: `evidence-${disputeId}.pdf` };
}

// Buyer-side assertion per PayPal's sandbox guide: unsigned JWT {iss: client_id, email: buyer email}.
function authAssertion() {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const email = process.env.PAYPAL_SANDBOX_BUYER_EMAIL;
  if (!email) throw new Error("PAYPAL_SANDBOX_BUYER_EMAIL not set");
  return `${b64({ alg: "none", typ: "JWT" })}.${b64({ iss: process.env.PAYPAL_CLIENT_ID, email })}.`;
}

switch (cmd) {
  case "list": {
    const q = args[0] ? `?disputed_transaction_id=${args[0]}` : "?page_size=20";
    const r = await api("GET", `${D}${q}`, { step: "disputes.list" });
    show(r.data?.items?.map(summary) ?? r.data);
    break;
  }
  case "get": {
    const r = await api("GET", `${D}/${args[0]}`, { step: "disputes.get" });
    show(r.ok ? summary(r.data) : r.data);
    break;
  }
  case "create": {
    const [txn, amount = "12.00", reason = "MERCHANDISE_OR_SERVICE_NOT_RECEIVED"] = args;
    const input = {
      disputed_transactions: [{ buyer_transaction_id: txn }],
      reason,
      dispute_amount: { currency_code: "USD", value: amount },
      extensions: { merchant_contacted: true, merchant_contacted_outcome: "NO_RESPONSE", merchandize_dispute_properties: { issue_type: "PRODUCT" } },
    };
    const r = await api("POST", D, { step: "disputes.create(simulator)", form: multipart(input), headers: { "PayPal-Auth-Assertion": authAssertion() } });
    show(r.data);
    break;
  }
  case "chargeback": {
    const [txn, merchantId, amount = "12.00"] = args;
    const now = new Date();
    const due = new Date(now.getTime() + 10 * 86400_000);
    const body = {
      adjacency: "PAYPAL", file_layout: "ATCK_CB", merchant_id: merchantId,
      financial_institution: { processor: "FDMS" },
      transaction: { id_enc: txn, amount: { currency_code: "USD", value: amount } },
      instrument: { instrument_type: "CARD", card_brand: "VISA", credit_card_transaction_id: String(Date.now()), external: false },
      dispute: {
        id: null, stage: "CHARGEBACK", response_date: due.toISOString(), status: "2",
        amount: { currency_code: "USD", value: amount }, receive_date: now.toISOString(),
        event_code: "CHARGEBACK_INITIATED", money_movement_date: now.toISOString(), event_type: "DEBIT",
        chargeback_type: "REPORTED_TO_PROCESSOR",
        processor_info: { reference_number: String(Date.now()).padEnd(23, "0"), reason_code: "C2", notes: "TEST_MEMO" },
      },
    };
    const r = await api("POST", "/v2/customer-support/process-chargeback", { step: "process-chargeback", json: body });
    show(r.data);
    break;
  }
  case "send-message": {
    const r = await api("POST", `${D}/${args[0]}/send-message`, { step: "disputes.send-message", json: { message: args[1] ?? "Hi, your parcel shipped with USPS; tracking 9400111899223817000000." } });
    show(r.data);
    break;
  }
  case "make-offer": {
    const [id, amount = "3.00", offer_type = "REFUND"] = args;
    const r = await api("POST", `${D}/${id}/make-offer`, { step: "disputes.make-offer", json: { note: "Partial refund offered to settle.", offer_amount: { currency_code: "USD", value: amount }, offer_type } });
    show(r.data);
    break;
  }
  case "provide-evidence": {
    const [id, type = "PROOF_OF_FULFILLMENT"] = args;
    const ev = { evidence_type: type, notes: "Shipped with tracking; delivery confirmed. See attached evidence pack." };
    if (type === "PROOF_OF_FULFILLMENT") ev.evidence_info = { tracking_info: [{ carrier_name: "USPS", tracking_number: "9400111899223817000000" }] };
    const r = await api("POST", `${D}/${id}/provide-evidence`, { step: "disputes.provide-evidence", form: multipart({ evidences: [ev] }, [await evidencePdf(id)]) });
    show(r.data);
    break;
  }
  case "require-evidence": {
    const r = await api("POST", `${D}/${args[0]}/require-evidence`, { step: "disputes.require-evidence(simulator)", json: { action: args[1] ?? "SELLER_EVIDENCE" } });
    show(r.data);
    break;
  }
  case "adjudicate": {
    const r = await api("POST", `${D}/${args[0]}/adjudicate`, { step: "disputes.adjudicate(simulator)", json: { adjudication_outcome: args[1] ?? "SELLER_FAVOR" } });
    show(r.data);
    break;
  }
  case "escalate": {
    const r = await api("POST", `${D}/${args[0]}/escalate`, { step: "disputes.escalate", json: { note: args[1] ?? "Escalating for PayPal review." } });
    show(r.data);
    break;
  }
  case "watch": {
    const [id, secs = "600"] = args;
    const end = Date.now() + Number(secs) * 1000;
    let last = "";
    while (Date.now() < end) {
      const r = await api("GET", `${D}/${id}`, { step: "disputes.watch" });
      const s = summary(r.data);
      const key = JSON.stringify([s?.status, s?.stage, s?.links]);
      if (key !== last) { console.log(new Date().toISOString(), key); last = key; }
      await new Promise((res) => setTimeout(res, 30_000));
    }
    break;
  }
  default:
    console.error("unknown command; see header");
    process.exit(2);
}
