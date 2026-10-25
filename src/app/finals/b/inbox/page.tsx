import { Suspense } from "react";
import { Inbox } from "../_ui/Inbox";

export const metadata = { title: "Disputes: CaseClerk" };

export default function InboxPage() {
  return (
    <Suspense>
      <Inbox />
    </Suspense>
  );
}
