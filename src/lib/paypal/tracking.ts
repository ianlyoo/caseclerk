// Add Tracking API v1: tracking numbers attached to a capture (PayPal uses them as proof of shipment).
import { PayPalError, paypalFetch } from "./client";

export type TrackerStatus = "SHIPPED" | "ON_HOLD" | "DELIVERED" | "CANCELLED";

export type Tracker = {
  captureId: string;
  trackingNumber: string;
  carrier: string;
  status: TrackerStatus | string;
  shipmentDate?: string;
  lastUpdated?: string;
  trackingUrl?: string;
};

type RawTracker = {
  transaction_id: string;
  tracking_number: string;
  carrier: string;
  carrier_name_other?: string;
  status: string;
  shipment_date?: string;
  last_updated_time?: string;
  tracking_number_type?: string;
  links?: { rel: string; href: string }[];
};

const CARRIER_URLS: Record<string, (n: string) => string> = {
  USPS: (n) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${n}`,
  UPS: (n) => `https://www.ups.com/track?tracknum=${n}`,
  FEDEX: (n) => `https://www.fedex.com/fedextrack/?trknbr=${n}`,
  DHL: (n) => `https://www.dhl.com/en/express/tracking.html?AWB=${n}`,
};

export function trackingUrl(carrier: string, trackingNumber: string): string | undefined {
  return CARRIER_URLS[carrier.toUpperCase()]?.(encodeURIComponent(trackingNumber));
}

// PayPal sends last_updated_time as epoch milliseconds in a string.
function epochToIso(v?: string): string | undefined {
  if (!v) return undefined;
  return /^\d+$/.test(v) ? new Date(Number(v)).toISOString() : v;
}

const toTracker = (t: RawTracker): Tracker => ({
  captureId: t.transaction_id,
  trackingNumber: t.tracking_number,
  carrier: t.carrier === "OTHER" && t.carrier_name_other ? t.carrier_name_other : t.carrier,
  status: t.status,
  shipmentDate: t.shipment_date,
  lastUpdated: epochToIso(t.last_updated_time),
  trackingUrl: trackingUrl(t.carrier, t.tracking_number),
});

/** POST /v1/shipping/trackers-batch with one tracker. Throws PayPalError when PayPal rejects it. */
export async function addTracking(
  captureId: string,
  t: { carrier: string; trackingNumber: string; status: TrackerStatus; shipmentDate?: string },
): Promise<{ status: number; debugId?: string }> {
  const res = await paypalFetch<{ tracker_identifiers?: unknown[]; errors?: { name?: string; message?: string; details?: { issue?: string }[] }[] }>(
    "/v1/shipping/trackers-batch",
    {
      method: "POST",
      body: JSON.stringify({
        trackers: [
          {
            transaction_id: captureId,
            tracking_number: t.trackingNumber,
            status: t.status,
            carrier: t.carrier,
            shipment_date: t.shipmentDate,
          },
        ],
      }),
    },
  );
  // The batch endpoint answers 200 even when the single tracker failed; surface that as an error.
  const err = res.json?.errors?.[0];
  if (err && !res.json?.tracker_identifiers?.length) {
    throw new PayPalError({ status: res.status, debugId: res.debugId, method: "POST", path: "/v1/shipping/trackers-batch", body: err });
  }
  return { status: res.status, debugId: res.debugId };
}

/** Trackers on a capture. Empty when none were added. */
export async function getTracking(captureId: string, trackingNumber?: string): Promise<Tracker[]> {
  if (trackingNumber) {
    const { json } = await paypalFetch<RawTracker>(`/v1/shipping/trackers/${encodeURIComponent(`${captureId}-${trackingNumber}`)}`);
    return [toTracker(json)];
  }
  try {
    const { json } = await paypalFetch<{ trackers?: RawTracker[] }>(`/v1/shipping/trackers?transaction_id=${encodeURIComponent(captureId)}`);
    return (json?.trackers ?? []).map(toTracker);
  } catch (err) {
    if (err instanceof PayPalError && err.status === 404) return [];
    throw err;
  }
}
