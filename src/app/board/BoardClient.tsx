"use client";

import dynamic from "next/dynamic";

// Bryntum touches window/document at import time, so it must never render on the server.
const DisputeScheduler = dynamic(() => import("./DisputeScheduler"), {
  ssr: false,
  loading: () => <p style={{ padding: 16 }}>Loading board…</p>,
});

export default function BoardClient() {
  return <DisputeScheduler />;
}
