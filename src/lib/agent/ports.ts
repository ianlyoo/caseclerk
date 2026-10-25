// What the agent needs from the rest of the app. The real implementations are W1's PayPal
// functions (src/lib/paypal, src/lib/evidence) and W4's repo (src/lib/db); tests pass fakes.
import type Anthropic from "@anthropic-ai/sdk";
import type {
  ActionStatus,
  AgentAction,
  AuditActor,
  AuditEntry,
  CaseRecord,
  CaseStatus,
  Decision,
  DisputeSnapshot,
  Money,
  OrderContext,
  SellerPolicy,
  Triage,
} from "../types";
import type { Spend } from "../spend";

export type ActionResult = { status: number; debugId?: string };

export type EvidenceItem = {
  evidenceType: string;
  notes?: string;
  trackingInfo?: { carrierName: string; trackingNumber: string; carrierNameOther?: string }[];
  refundIds?: string[];
};

export type OfferType = "REFUND" | "REFUND_WITH_RETURN" | "REFUND_WITH_REPLACEMENT" | "REPLACEMENT_WITHOUT_REFUND";

export type TrackingInfo = NonNullable<OrderContext["shipping"]>[number];

/** Order facts for a capture: items, payer country, paid time. Shipping comes from get_tracking. */
export type OrderFacts = Omit<OrderContext, "shipping">;

export type TransactionFacts = {
  transactionId: string;
  status?: string;
  amount?: Money;
  fee?: Money;
  at?: string;
  eventCode?: string;
};

export type PaypalPort = {
  getDispute(id: string): Promise<DisputeSnapshot>;
  /** Order + items for the disputed capture; null when PayPal has no order for it. */
  getOrderForCapture(captureId: string): Promise<OrderFacts | null>;
  getTracking(captureId: string): Promise<TrackingInfo[]>;
  /** Absent when Transaction Search isn't enabled on the PayPal app. */
  searchTransactions?: (q: { transactionId: string }) => Promise<TransactionFacts[]>;
  sendMessage(id: string, text: string): Promise<ActionResult>;
  makeOffer(id: string, o: { offerType: OfferType; amount?: Money; note: string }): Promise<ActionResult>;
  provideEvidence(
    id: string,
    req: {
      evidences: EvidenceItem[];
      files: { name: string; bytes: Uint8Array; contentType: string }[];
      /** Saves PayPal a dispute lookup when tracking is filed. */
      captureId?: string;
      /** Runs the post-filing tracker restore later (after the response) instead of inline. */
      deferRestore?: (task: () => Promise<void>) => void;
    },
  ): Promise<ActionResult>;
  acceptClaim(id: string, o: { note: string; refundAmount?: Money }): Promise<ActionResult>;
  acknowledgeReturn(id: string, note: string): Promise<ActionResult>;
};

export type EvidencePort = {
  buildEvidencePdf(input: {
    case: CaseRecord;
    order: OrderContext;
    narrative: string;
    exhibits: { title: string; body: string }[];
    generatedAt?: Date;
  }): Promise<Uint8Array>;
};

/** Structural subset of W4's Repo (src/lib/db/repo.ts). */
export type DbPort = {
  cases: {
    get(id: string): Promise<CaseRecord | null>;
    setTriage(id: string, triage: Triage): Promise<CaseRecord | null>;
    setDecision(id: string, decision: Decision): Promise<CaseRecord | null>;
    setStatus(id: string, status: CaseStatus): Promise<CaseRecord | null>;
    setOrder(id: string, order: OrderContext): Promise<CaseRecord | null>;
    upsertFromSnapshot(snapshot: DisputeSnapshot, opts?: { isTestDispute?: boolean }): Promise<{ record: CaseRecord }>;
  };
  actions: {
    insert(
      a: Omit<AgentAction, "id" | "createdAt" | "updatedAt" | "status"> & { id?: string; status?: ActionStatus },
    ): Promise<AgentAction>;
    update(
      id: string,
      patch: Partial<Pick<AgentAction, "status" | "result" | "params" | "rationale" | "amountUsd" | "requiresApproval">>,
      opts?: { ifStatus?: ActionStatus[] },
    ): Promise<AgentAction | null>;
    get(id: string): Promise<AgentAction | null>;
    listByCase(caseId: string): Promise<AgentAction[]>;
  };
  audit: {
    append(e: {
      caseId: string;
      actor: AuditActor;
      kind: string;
      summary: string;
      data?: Record<string, unknown>;
      costUsd?: number;
    }): Promise<AuditEntry>;
    listByCase(caseId: string, opts?: { limit?: number }): Promise<AuditEntry[]>;
  };
  policy: { get(): Promise<SellerPolicy> };
  locks: {
    withCaseLock<T>(
      caseId: string,
      fn: () => Promise<T>,
      opts?: { ttlS?: number },
    ): Promise<{ acquired: true; value: T } | { acquired: false }>;
  };
};

/** The one Messages API method the agent uses (real client or a recorded fake). */
export type LlmPort = {
  create(params: Anthropic.MessageCreateParamsNonStreaming): Promise<Anthropic.Message>;
};

export type AgentDeps = {
  db: DbPort;
  paypal: PaypalPort;
  evidence: EvidencePort;
  llm: LlmPort;
  spend: Spend;
  /** Model settings; defaults in config.ts. */
  config?: Partial<import("./config").AgentConfig>;
  now?: () => Date;
};
