/**
 * The webhook event types of the wallet that the issuer and verifier backends
 * subscribe to.
 *
 * Register ISSUER_TOPICS if you issue, VERIFIER_TOPICS if you verify, or both.
 * OWS refuses a webhook with an event type that it does not know (400), so
 * register only names of `GET /v2/config/webhooks/event-types`. The SSE key of
 * an event is its `subject.id`: the issuance id or the verification id.
 */
export const ISSUER_TOPICS = [
  "ows.issuer.issuance.offer_retrieved",
  "ows.issuer.issuance.token_issued",
  "ows.issuer.issuance.credential_deferred",
  "ows.issuer.issuance.credential_issued",
  "ows.issuer.issuance.credential_accepted",
  "ows.issuer.issuance.denied",
  "ows.issuer.issuance.expired",
] as const;

export const VERIFIER_TOPICS = [
  "ows.verifier.verification.presentation_received",
  "ows.verifier.verification.declined",
] as const;

export const ALL_TOPICS: string[] = [...ISSUER_TOPICS, ...VERIFIER_TOPICS];

const SUPPORTED = new Set<string>(ALL_TOPICS);

export function isSupportedTopic(type: unknown): type is string {
  return typeof type === "string" && SUPPORTED.has(type);
}
