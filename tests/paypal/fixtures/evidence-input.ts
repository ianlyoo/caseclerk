import type { DisputeSnapshot } from "../../../src/lib/types";
import type { EvidencePdfInput } from "../../../src/lib/evidence/pdf";

/** A realistic evidence-pack input (handmade-goods shop, item-not-received chargeback). */
export function sampleEvidenceInput(probe: DisputeSnapshot): EvidencePdfInput {
  // The fixture dispute was a $5 probe; the sample tells the full $49.95 order story.
  const snapshot: DisputeSnapshot = { ...probe, amount: { currency_code: "USD", value: "49.95" } };
  const paidAt = snapshot.createTime ? new Date(new Date(snapshot.createTime).getTime() - 6 * 86_400_000).toISOString() : undefined;
  const deliveredAt = paidAt ? new Date(new Date(paidAt).getTime() + 3 * 86_400_000 + 5 * 3_600_000).toISOString() : undefined;
  return {
    case: {
      id: snapshot.id,
      snapshot,
      status: "acting",
      isTestDispute: true,
      createdAt: snapshot.createTime,
      updatedAt: snapshot.updateTime,
    },
    order: {
      orderId: "7ET421671U3950247",
      captureId: snapshot.sellerTransactionId,
      items: [
        { name: "Hand-thrown stoneware mug, speckled oat", quantity: 1, unitAmount: { currency_code: "USD", value: "28.00" }, description: "12 oz, wheel-thrown, food safe glaze" },
        { name: "Beeswax taper candles (pair)", quantity: 1, unitAmount: { currency_code: "USD", value: "16.00" }, description: "Hand-dipped, 10 in, unscented" },
      ],
      shipping: [
        {
          carrier: "USPS",
          trackingNumber: "9400111899223900695580",
          status: "DELIVERED",
          deliveredAt,
          trackingUrl: "https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899223900695580",
        },
      ],
      buyerCountry: "US",
      paidAt,
    },
    seller: { name: "Juniper & Clay Studio", website: "juniperandclay.example" },
    amountCharged: { currency_code: "USD", value: "49.95" },
    narrative: [
      "The buyer ordered a stoneware mug and a pair of beeswax taper candles from our shop. We packed the order the next business day and shipped it with USPS Ground Advantage to the address the buyer entered at checkout.",
      "USPS tracking 9400111899223900695580 shows the parcel delivered to that address three days after purchase. The tracking number was uploaded to PayPal on the original transaction before the dispute was opened.",
      "- Shipped to the address on the PayPal transaction, unchanged since checkout\n- Delivered status confirmed by the carrier\n- The buyer did not contact us before filing the chargeback",
      "We ask that the chargeback be reversed in the seller's favor. We remain happy to help the buyer locate the parcel with USPS.",
    ].join("\n\n"),
    exhibits: [
      { title: "Carrier tracking record", body: "USPS 9400111899223900695580: Accepted at origin facility; In transit; Out for delivery; Delivered, front door/porch." },
      { title: "Order confirmation", body: "Order 7ET421671U3950247 paid by card through PayPal checkout. Items: stoneware mug ($28.00), beeswax taper candles ($16.00); shipping $5.95." },
      { title: "Buyer communication", body: "No messages were received from the buyer between purchase and the chargeback." },
    ],
    generatedAt: new Date("2026-10-25T06:00:00Z"),
  };
}
