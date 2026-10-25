// Guard against invented facts: identifiers in agent-written text must come from tool results.

/** Tokens that look like tracking numbers / PayPal ids: 10+ uppercase letters and digits with at least 4 digits. */
const ID_LIKE = /\b(?=(?:[A-Z-]*\d){4})[A-Z0-9][A-Z0-9-]{8,38}[A-Z0-9]\b/g;

/** Identifier-like tokens in `text` that aren't among the known ids (case-insensitive, dashes ignored). */
export function unknownIdentifiers(text: string, known: Iterable<string>): string[] {
  const norm = (s: string) => s.toUpperCase().replace(/[-\s]/g, "");
  const ok = new Set([...known].filter(Boolean).map(norm));
  const found = new Set<string>();
  for (const m of text.toUpperCase().matchAll(ID_LIKE)) {
    const tok = m[0];
    if (/^\d{4}-\d{2}-\d{2}/.test(tok)) continue; // ISO dates
    if (!ok.has(norm(tok))) found.add(tok);
  }
  return [...found];
}
