"use client";
import dynamic from "next/dynamic";
import type { Board, Span } from "../d2/_lib/board";

// Bryntum touches window/document at import time, so it must never render on the server.
const DisputeScheduler = dynamic(() => import("./DisputeScheduler"), { ssr: false, loading: () => <div className="bd-board bd-loading" aria-busy="true" /> });

export default function BoardClient({ board, span }: { board: Board; span: Span }) {
  return <DisputeScheduler board={board} span={span} />;
}
