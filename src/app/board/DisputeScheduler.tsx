"use client";

import { BryntumScheduler } from "@bryntum/scheduler-react";
import "@bryntum/scheduler/scheduler.css";
import "@bryntum/scheduler/stockholm-light.css";
import "@bryntum/scheduler/fontawesome/css/fontawesome.css";
import "@bryntum/scheduler/fontawesome/css/solid.css";

const day = 24 * 60 * 60 * 1000;
const today = new Date(new Date().toDateString());
const at = (offsetDays: number) => new Date(today.getTime() + offsetDays * day);

// Dummy rows for the spike: one resource per dispute, one bar from "opened" to "seller response due".
const resources = [
  { id: "PP-D-1001", name: "PP-D-1001 · Item not received · $48.00" },
  { id: "PP-D-1002", name: "PP-D-1002 · Not as described · $120.00" },
  { id: "PP-D-1003", name: "PP-D-1003 · Unauthorised · $15.50" },
];

const events = [
  { id: 1, resourceId: "PP-D-1001", name: "Respond (INQUIRY)", startDate: at(-3), endDate: at(7), eventColor: "orange" },
  { id: 2, resourceId: "PP-D-1002", name: "Evidence due (CHARGEBACK)", startDate: at(-8), endDate: at(2), eventColor: "red" },
  { id: 3, resourceId: "PP-D-1003", name: "Offer pending", startDate: at(-1), endDate: at(12), eventColor: "green" },
];

export default function DisputeScheduler() {
  return (
    <BryntumScheduler
      startDate={at(-9)}
      endDate={at(14)}
      viewPreset="weekAndDay"
      tickSize={50}
      rowHeight={48}
      columns={[{ text: "Dispute", field: "name", width: 320 }]}
      resources={resources}
      events={events}
    />
  );
}
