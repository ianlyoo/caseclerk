// Where the product's pages live. One place, so moving the app between /d2 and the root is one line.
export const BASE = "";

export const href = {
  home: () => BASE || "/",
  cases: () => `${BASE}/cases`,
  case: (id: string) => `${BASE}/case/${encodeURIComponent(id)}`,
  policy: () => `${BASE}/policy`,
  /** The Bryntum deadline board stays at the root, outside this app's shell. */
  board: () => "/board",
};

/** Cases kept waiting for the owner's demo recording: never approved or denied from these pages. */
export const RESERVED_CASES: readonly string[] = ["PP-R-VPY-10194485"];
export const RESERVED_ACTIONS: readonly string[] = ["dce5fede-e03a-4d4e-8e99-d88af7bb177d"];
