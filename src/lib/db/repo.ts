// Repo interface shared by the in-memory and Postgres implementations. Owner: W4.
// All timestamps are ISO strings. Implementations never log PII or message bodies.
import type {
  ActionStatus,
  AgentAction,
  AuditActor,
  AuditEntry,
  CaseRecord,
  CaseStatus,
  Decision,
  DisputeSnapshot,
  OrderContext,
  SellerPolicy,
  SpendTotals,
  Triage,
} from "@/lib/types";

export type UpsertResult = {
  record: CaseRecord;
  created: boolean;
  /** false when the snapshot was not newer than the stored one (stale or duplicate delivery). */
  changed: boolean;
};

export type CaseListQuery = {
  status?: CaseStatus[];
  /** true: only disputes PayPal hasn't resolved; false: only resolved ones. */
  open?: boolean;
  isTestDispute?: boolean;
  limit?: number; // default 100, max 500
};

export type CasesRepo = {
  /**
   * Inserts or refreshes a case from a PayPal snapshot. Snapshots older than the stored one
   * are ignored. A new case is marked `isTestDispute` when its capture id was recorded by
   * `testCaptures.record` (and gets that capture's order context). A RESOLVED snapshot sets status "resolved".
   */
  upsertFromSnapshot(snapshot: DisputeSnapshot, opts?: { isTestDispute?: boolean }): Promise<UpsertResult>;
  get(id: string): Promise<CaseRecord | null>;
  /** Newest activity first. */
  list(q?: CaseListQuery): Promise<CaseRecord[]>;
  setTriage(id: string, triage: Triage): Promise<CaseRecord | null>;
  setDecision(id: string, decision: Decision): Promise<CaseRecord | null>;
  setStatus(id: string, status: CaseStatus): Promise<CaseRecord | null>;
  setOrder(id: string, order: OrderContext): Promise<CaseRecord | null>;
};

export type NewAction = Omit<AgentAction, "id" | "createdAt" | "updatedAt" | "status"> & {
  id?: string;
  status?: ActionStatus; // default "proposed"
};

export type ActionPatch = Partial<
  Pick<AgentAction, "status" | "result" | "params" | "rationale" | "amountUsd" | "requiresApproval">
>;

export type ActionsRepo = {
  insert(a: NewAction): Promise<AgentAction>;
  /**
   * Patches an action. With `ifStatus`, the update is a compare-and-set: it applies only if the
   * current status is one of them, else returns null (use it so a double-click can't run twice).
   */
  update(id: string, patch: ActionPatch, opts?: { ifStatus?: ActionStatus[] }): Promise<AgentAction | null>;
  get(id: string): Promise<AgentAction | null>;
  /** Oldest first. */
  listByCase(caseId: string): Promise<AgentAction[]>;
  /** Oldest first, all cases. */
  listAwaitingApproval(): Promise<AgentAction[]>;
};

export type NewAuditEntry = {
  caseId: string;
  actor: AuditActor;
  kind: string;
  summary: string;
  data?: Record<string, unknown>;
  costUsd?: number;
  at?: string; // default now
};

export type AuditRepo = {
  append(e: NewAuditEntry): Promise<AuditEntry>;
  /** Oldest first (timeline order). */
  listByCase(caseId: string, opts?: { limit?: number }): Promise<AuditEntry[]>;
};

export type PolicyRepo = {
  /** The seller policy; DEFAULT_POLICY until one is saved. */
  get(): Promise<SellerPolicy>;
  set(p: SellerPolicy): Promise<SellerPolicy>;
};

export type SpendEntry = {
  /** "llm": one model call (costUsd > 0); "run": one agent run started (counts toward AGENT_RUNS_PER_DAY). */
  kind: "llm" | "run";
  costUsd: number;
  caseId?: string;
  model?: string;
  usage?: Record<string, number>; // token counts from the API's usage, numbers only
  at?: string;
};

export type SpendRepo = {
  add(e: SpendEntry): Promise<void>;
  /** "today" is the UTC calendar day. */
  totals(): Promise<SpendTotals>;
};

export type WebhookEventsRepo = {
  /** true if this event id was not seen before (and is now recorded). */
  insertIfNew(eventId: string, meta?: { eventType?: string; resourceId?: string }): Promise<boolean>;
  /** Forget an event so PayPal's retry is processed again (call when handling failed after insertIfNew). */
  remove(eventId: string): Promise<void>;
};

export type RateLimitResult = { allowed: boolean; count: number; limit: number; resetAt: string };

export type RateLimitRepo = {
  /** Fixed window: counts this hit and says whether it is within `limit` per `windowS` seconds. */
  hit(key: string, limit: number, windowS: number): Promise<RateLimitResult>;
};

export type LockResult<T> = { acquired: true; value: T } | { acquired: false };

export type LocksRepo = {
  /**
   * Runs fn while holding a per-case lock (row lease, released in finally; expires after ttlS
   * so a crashed function can't hold it forever). If another holder has it, returns
   * { acquired: false } without running fn.
   */
  withCaseLock<T>(caseId: string, fn: () => Promise<T>, opts?: { ttlS?: number }): Promise<LockResult<T>>;
};

export type TestCapture = {
  captureId: string;
  orderId?: string;
  disputeId?: string;
  scenario?: string;
  /** Order context from openTestDispute; copied onto the case when it is created. */
  order?: OrderContext;
  createdAt: string;
};

export type TestCapturesRepo = {
  /** Called by api/test-dispute so the webhook can mark the case `isTestDispute`. */
  record(c: Omit<TestCapture, "createdAt">): Promise<TestCapture>;
  get(captureId: string): Promise<TestCapture | null>;
};

export type WireOrigin = "agent" | "webhook" | "seller" | "cron" | "system";

/**
 * One PayPal call (kind "call") or webhook delivery (kind "event") on the wire log.
 * Never holds request bodies, headers or secrets: ids, paths, statuses and timings only.
 */
export type WireEntry = {
  id: string;
  at: string;
  kind: "call" | "event";
  origin: WireOrigin;
  caseId?: string;
  /** Correlation key before a case exists (the test capture id); linked to the case later. */
  ref?: string;
  method?: string;
  /** API path without query string. */
  path?: string;
  /** Call: PayPal's HTTP status (0 = network error). Event: the status we answered PayPal with. */
  status?: number;
  debugId?: string;
  durationMs?: number;
  eventId?: string;
  eventType?: string;
  /** Webhook signature verification result, e.g. SUCCESS, FAILURE. */
  verify?: string;
  detail?: Record<string, unknown>;
};

export type NewWireEntry = Omit<WireEntry, "id" | "at"> & { at?: string };

export type WireRepo = {
  append(e: NewWireEntry): Promise<WireEntry>;
  /** Oldest first (time order); the latest `limit` rows (default 500). */
  listByCase(caseId: string, opts?: { limit?: number }): Promise<WireEntry[]>;
  /** The latest `limit` rows (default 50, max 200) across cases, after `since` if given; returned oldest first. */
  listRecent(opts?: { since?: string; limit?: number }): Promise<WireEntry[]>;
  /** Sets `ref` (and the case, if known) on rows written before the case existed. */
  tag(ids: string[], patch: { ref?: string; caseId?: string }): Promise<void>;
  /** Attaches rows tagged with `ref` and no case yet to `caseId`. */
  linkRef(ref: string, caseId: string): Promise<void>;
};

export type Repo = {
  kind: "memory" | "postgres";
  cases: CasesRepo;
  actions: ActionsRepo;
  audit: AuditRepo;
  policy: PolicyRepo;
  spend: SpendRepo;
  webhookEvents: WebhookEventsRepo;
  rateLimit: RateLimitRepo;
  locks: LocksRepo;
  testCaptures: TestCapturesRepo;
  wire: WireRepo;
};
