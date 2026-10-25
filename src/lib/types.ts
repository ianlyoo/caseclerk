// Shared domain types for CaseClerk. Owner: W2 (agent). Others propose changes in their report.
// Money is always a decimal string + ISO currency, as PayPal sends it.

export type Money = { value: string; currency_code: string };

/** The PayPal actions currently allowed on a dispute, from its HATEOAS links (rel names). */
export type DisputeLinkRel =
  | "send_message"
  | "make_offer"
  | "provide_evidence"
  | "accept_claim"
  | "acknowledge_return_item"
  | "appeal"
  | "escalate"
  | "provide_supporting_info"
  | "require_evidence" // sandbox simulator
  | "adjudicate"; // sandbox simulator

export type DisputeStatus =
  | "OPEN"
  | "WAITING_FOR_BUYER_RESPONSE"
  | "WAITING_FOR_SELLER_RESPONSE"
  | "UNDER_REVIEW"
  | "RESOLVED"
  | "OTHER";

export type DisputeStage = "INQUIRY" | "CHARGEBACK" | "PRE_ARBITRATION" | "ARBITRATION" | string;

export type DisputeMessage = { postedBy: "BUYER" | "SELLER" | "ARBITER" | string; at: string; content: string };

/** Normalized view of GET /v1/customer/disputes/{id}. `raw` keeps the full payload server-side only. */
export type DisputeSnapshot = {
  id: string; // PP-R-...
  reason: string; // e.g. MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED, MERCHANDISE_OR_SERVICE_NOT_RECEIVED
  status: DisputeStatus;
  stage: DisputeStage;
  channel?: string; // INTERNAL | EXTERNAL
  amount: Money;
  createTime: string;
  updateTime: string;
  sellerResponseDueDate?: string;
  buyerResponseDueDate?: string;
  sellerTransactionId?: string; // capture id
  buyerTransactionId?: string;
  invoiceId?: string;
  outcome?: string; // RESOLVED_SELLER_FAVOUR | RESOLVED_BUYER_FAVOUR | RESOLVED_WITH_PAYOUT | ...
  requestedEvidence?: string[]; // evidence types PayPal asks for
  messages: DisputeMessage[];
  allowed: DisputeLinkRel[];
  raw?: unknown;
};

/** What the seller sold and shipped, gathered by tools (orders, tracking, transactions). */
export type OrderContext = {
  orderId?: string;
  captureId?: string;
  items: { name: string; quantity: number; unitAmount: Money; description?: string }[];
  shipping?: { carrier: string; trackingNumber: string; status?: string; deliveredAt?: string; trackingUrl?: string }[];
  buyerCountry?: string;
  paidAt?: string;
  /** Total the buyer paid (items + shipping/tax), from the capture. */
  amountCharged?: Money;
};

export type TriageCategory = "not_received" | "not_as_described" | "unauthorized" | "duplicate_or_billing" | "other";

export type Triage = {
  category: TriageCategory;
  summary: string; // one sentence, plain English
  model: string;
  at: string;
};

export type Decision = {
  strategy: "fight" | "refund_full" | "offer_partial" | "accept_claim" | "message_buyer" | "wait";
  winProbability: number; // 0..1, the agent's estimate
  /** Expected result in USD vs. keeping the full amount (0 = no loss; negative = expected loss). */
  expectedValueUsd: { fight: number; refund: number; offer?: number };
  rationale: string; // short, shown in the UI
  evidenceStrength?: "strong" | "medium" | "weak";
  /** Set when the seller policy changed the agent's proposed strategy. */
  policyNote?: string;
  model: string;
  at: string;
};

export type CaseStatus =
  | "new"
  | "triaged"
  | "awaiting_approval"
  | "acting"
  | "waiting_on_paypal"
  | "waiting_on_buyer"
  | "resolved"
  | "error";

export type CaseRecord = {
  id: string; // = dispute id
  snapshot: DisputeSnapshot;
  order?: OrderContext;
  triage?: Triage;
  decision?: Decision;
  status: CaseStatus;
  isTestDispute: boolean; // created by "Open test dispute"
  createdAt: string;
  updatedAt: string;
};

export type ActionKind =
  | "send_message"
  | "make_offer"
  | "provide_evidence"
  | "accept_claim"
  | "acknowledge_return_item"
  | "refund_capture"
  | "require_evidence" // sandbox simulator (demo controls only)
  | "adjudicate"; // sandbox simulator (demo controls only)

export type ActionStatus = "proposed" | "awaiting_approval" | "approved" | "denied" | "executing" | "executed" | "failed";

export type AgentAction = {
  id: string; // uuid
  caseId: string;
  kind: ActionKind;
  params: Record<string, unknown>; // the PayPal request body, minus files
  rationale: string;
  amountUsd?: number; // money moved by this action, if any
  requiresApproval: boolean;
  status: ActionStatus;
  result?: { httpStatus?: number; debugId?: string; error?: string };
  createdAt: string;
  updatedAt: string;
};

export type SellerPolicy = {
  autoRefundMaxUsd: number; // refunds/offers at or below run without asking
  approvalAboveUsd: number; // any money action above this waits for the seller
  minWinProbabilityToFight: number; // below this, prefer refund/offer when cheaper
  maxOfferPercent: number; // cap for partial-refund offers, % of dispute amount
  dryRun: boolean; // propose only, never call PayPal write endpoints
  voice: string; // tone notes for buyer messages
};

export const DEFAULT_POLICY: SellerPolicy = {
  autoRefundMaxUsd: 15,
  approvalAboveUsd: 50,
  minWinProbabilityToFight: 0.45,
  maxOfferPercent: 40,
  dryRun: false,
  voice: "Friendly, brief, specific. Never blame the buyer.",
};

export type AuditActor = "agent" | "seller" | "paypal" | "system";

export type AuditEntry = {
  id: string;
  caseId: string;
  at: string;
  actor: AuditActor;
  kind: string; // e.g. webhook.received, tool.get_tracking, decision, action.executed, spend.blocked
  summary: string; // one line, shown in the case timeline
  data?: Record<string, unknown>; // no secrets, no full PII
  costUsd?: number; // LLM cost of this step, if any
};

/** What started an agent run. */
export type AgentTrigger = { kind: "webhook" | "approval" | "manual"; eventType?: string };

export type SpendTotals = { totalUsd: number; todayUsd: number; runsToday: number };
