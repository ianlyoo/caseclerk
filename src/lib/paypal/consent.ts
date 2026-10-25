// Buyer consent (Log in with PayPal) for the sandbox buyer-side dispute simulators.
// Consent lets the app act for the buyer via PayPal-Auth-Assertion; no buyer token is stored.
export const CONSENT_SCOPES = ["openid", "https://uri.paypal.com/services/disputes/create"];
export const STATE_COOKIE = "pp_consent_state";

const AUTH_BASE = process.env.PAYPAL_API_BASE?.includes("sandbox") === false
  ? "https://www.paypal.com"
  : "https://www.sandbox.paypal.com";

/** Must equal the Return URL saved under Log in with PayPal → Advanced Settings, byte for byte. */
export function consentRedirectUri(requestUrl: string): string {
  return process.env.PAYPAL_CONSENT_REDIRECT_URI ?? new URL("/api/paypal/consent-callback", requestUrl).toString();
}

export function consentUrl(clientId: string, redirectUri: string, state: string, scopes = CONSENT_SCOPES): string {
  const q = new URLSearchParams({
    flowEntry: "static",
    client_id: clientId,
    response_type: "code",
    scope: scopes.join(" "),
    redirect_uri: redirectUri,
    state,
    fullPage: "true",
  });
  return `${AUTH_BASE}/connect/?${q.toString()}`;
}
