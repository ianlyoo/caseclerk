// Opens a sandbox test dispute end to end and prints the ids.
//   scripts/run.sh scripts/open-test-dispute.ts [not_received|not_as_described]
import { openTestDispute, TEST_SCENARIOS, type TestScenario } from "../src/lib/paypal/testDispute";

const scenario = (process.argv[2] ?? "not_received") as TestScenario;
if (!TEST_SCENARIOS[scenario]) {
  console.error(`scenario must be one of: ${Object.keys(TEST_SCENARIOS).join(", ")}`);
  process.exit(2);
}
const r = await openTestDispute({ scenario });
console.log(JSON.stringify({ scenario, disputeId: r.disputeId, orderId: r.orderId, captureId: r.captureId, amount: r.amount, items: r.order.items.map((i) => i.name), tracking: r.order.shipping?.[0]?.trackingNumber, debugIds: r.debugIds }, null, 2));
if (!r.disputeId) process.exitCode = 1;
