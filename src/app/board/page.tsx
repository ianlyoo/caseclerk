import type { Metadata } from "next";
import { getCase, listCases, type CaseBundle } from "../d2/_lib/api";
import { boardOf } from "../d2/_lib/board";
import { TopBar } from "../d2/_ui/Chrome";
import BoardClient from "./BoardClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Deadlines: CaseClerk" };

export default async function BoardPage({ searchParams }: { searchParams: Promise<{ span?: string }> }) {
  const span = (await searchParams).span === "hours" ? "hours" : "deadlines";
  const list = await listCases();
  if (!list) {
    return (
      <div className="metal page-error">
        <TopBar here="board" />
        <div className="wrap">
          <h1 className="h-section">CaseClerk can&rsquo;t reach its case data right now.</h1>
          <p className="body">Try again in a minute.</p>
        </div>
      </div>
    );
  }
  // every case's own record (audit and wire), for the moments on its bar
  const bundles = new Map<string, CaseBundle | null>(await Promise.all(list.map(async (c) => [c.id, await getCase(c.id)] as const)));
  const board = boardOf(list, bundles, new Date().toISOString());
  const { waiting, open, closed } = board.counts;

  return (
    <div className="bd-page">
      <div className="metal bd-top">
        <TopBar here="board" />
        <header className="wrap bd-head">
          <h1 className="bd-title">{list.length} disputes, opened to deadline</h1>
          <p className="bd-counts">
            {waiting} waiting for your yes, {open} open, {closed} closed.
            {board.nearest ? ` The nearest PayPal deadline: ${board.nearest.words}.` : " No open case has a PayPal deadline right now."}
          </p>
        </header>
      </div>
      <BoardClient board={board} span={span} />
    </div>
  );
}
