import { fetchRealCases } from "../_real/fetch";
import { InboxView } from "./InboxView";

export const dynamic = "force-dynamic";

export default async function FinalAInbox() {
  return <InboxView real={await fetchRealCases()} />;
}
