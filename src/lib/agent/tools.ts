// Tool schemas (strict) offered to the decision model. Write tools appear only when PayPal's
// HATEOAS links on the dispute allow the matching action.
import type Anthropic from "@anthropic-ai/sdk";
import type { DisputeLinkRel } from "../types";

type Tool = Anthropic.Tool;

const obj = (properties: Record<string, unknown>, required = Object.keys(properties)) => ({
  type: "object" as const,
  properties,
  required,
  additionalProperties: false,
});

export const EVIDENCE_TYPES = [
  "PROOF_OF_FULFILLMENT",
  "PROOF_OF_REFUND",
  "ITEM_DESCRIPTION",
  "DETAILS_OF_PURCHASE",
  "RETURN_POLICY",
  "OTHER",
] as const;

export const READ_TOOLS: Tool[] = [
  {
    name: "get_order",
    description:
      "Order behind the disputed payment: items (name, quantity, price, description), paid time, buyer country. Returns found:false when PayPal has no order for this capture.",
    input_schema: obj({}),
    strict: true,
  },
  {
    name: "get_tracking",
    description:
      "Shipment tracking the seller added to the disputed payment in PayPal: carrier, tracking number, status. Returns an empty list when no tracking was added.",
    input_schema: obj({}),
    strict: true,
  },
  {
    name: "get_dispute",
    description:
      "Fresh copy of the dispute from PayPal: status, stage, allowed actions, requested evidence, messages, due dates. Use only if the brief may be out of date.",
    input_schema: obj({}),
    strict: true,
  },
];

export const SEARCH_TRANSACTIONS: Tool = {
  name: "search_transactions",
  description: "PayPal transaction records for the disputed payment: status, amount, fee, refunds or reversals.",
  input_schema: obj({}),
  strict: true,
};

export const RECORD_DECISION: Tool = {
  name: "record_decision",
  description:
    "Record your decision before any write action. The system computes expected values (amount, PayPal fees, seller time) from your win probability, applies the seller's policy and returns the final strategy and the actions you may take.",
  input_schema: obj({
    strategy: {
      type: "string",
      enum: ["fight", "refund_full", "offer_partial", "accept_claim", "message_buyer", "wait"],
      description:
        "fight = submit evidence; accept_claim = accept and refund (chargebacks/claims); refund_full = refund at inquiry stage; offer_partial = partial refund offer (inquiry only); message_buyer = reply to the buyer; wait = nothing to do now.",
    },
    win_probability: { type: "number", description: "0..1, chance PayPal/the issuer rules for the seller if we fight." },
    evidence_strength: { type: "string", enum: ["strong", "medium", "weak"] },
    offer_percent: { type: "number", description: "Partial offer as % of the disputed amount; 0 when not offering." },
    rationale: { type: "string", description: "At most 2 sentences for the seller's timeline." },
  }),
  strict: true,
};

const WRITE_TOOLS: Record<string, { rel: DisputeLinkRel; tool: Tool }> = {
  provide_evidence: {
    rel: "provide_evidence",
    tool: {
      name: "provide_evidence",
      description:
        "Submit evidence to PayPal: your narrative and exhibits become the evidence pack PDF; tracking from get_tracking is attached automatically to PROOF_OF_FULFILLMENT. Strategy must be fight.",
      input_schema: obj({
        evidence_types: { type: "array", items: { type: "string", enum: [...EVIDENCE_TYPES] } },
        narrative: { type: "string", description: "120-220 words, facts from tools only." },
        exhibits: {
          type: "array",
          items: obj({ title: { type: "string" }, body: { type: "string" } }),
          description: "2-4 short fact blocks.",
        },
      }),
      strict: true,
    },
  },
  accept_claim: {
    rel: "accept_claim",
    tool: {
      name: "accept_claim",
      description: "Accept the claim: PayPal refunds the buyer the disputed amount. Strategy must be accept_claim or refund_full.",
      input_schema: obj({ note: { type: "string", description: "Short note to PayPal, under 60 words." } }),
      strict: true,
    },
  },
  make_offer: {
    rel: "make_offer",
    tool: {
      name: "make_offer",
      description: "Offer the buyer a resolution (inquiry stage). Strategy must be offer_partial or refund_full.",
      input_schema: obj({
        offer_type: { type: "string", enum: ["REFUND", "REFUND_WITH_RETURN", "REFUND_WITH_REPLACEMENT", "REPLACEMENT_WITHOUT_REFUND"] },
        amount_usd: { type: "number", description: "Refund amount in USD; 0 for REPLACEMENT_WITHOUT_REFUND." },
        note: { type: "string", description: "To the buyer, seller's voice, under 80 words." },
      }),
      strict: true,
    },
  },
  send_message: {
    rel: "send_message",
    tool: {
      name: "send_message",
      description: "Message the buyer in the dispute thread (inquiry stage), in the seller's voice, under 80 words.",
      input_schema: obj({ message: { type: "string" } }),
      strict: true,
    },
  },
  acknowledge_return_item: {
    rel: "acknowledge_return_item",
    tool: {
      name: "acknowledge_return_item",
      description: "Confirm the seller received the returned item, so PayPal can close the return.",
      input_schema: obj({ note: { type: "string" } }),
      strict: true,
    },
  },
};

export const WRITE_TOOL_NAMES = Object.keys(WRITE_TOOLS);
export const READ_TOOL_NAMES = [...READ_TOOLS.map((t) => t.name), SEARCH_TRANSACTIONS.name];

/** Tools for this run, in a fixed order (stable order keeps the prompt cache warm). */
export function toolsFor(allowed: readonly DisputeLinkRel[], opts: { transactionSearch: boolean }): Tool[] {
  const tools = [...READ_TOOLS];
  if (opts.transactionSearch) tools.push(SEARCH_TRANSACTIONS);
  tools.push(RECORD_DECISION);
  for (const name of WRITE_TOOL_NAMES) {
    if (allowed.includes(WRITE_TOOLS[name].rel)) tools.push(WRITE_TOOLS[name].tool);
  }
  return tools;
}

/** Link rels the agent can act on (simulators and appeals excluded). */
export const ACTIONABLE_RELS: readonly DisputeLinkRel[] = Object.values(WRITE_TOOLS).map((w) => w.rel);
