/**
 * The webhook event types of the wallet that the issuer and verifier backends
 * subscribe to.
 *
 * Register ISSUER_TOPICS if you issue, VERIFIER_TOPICS if you verify, or both.
 * The create webhook call refuses an unknown event type (400), an event type
 * whose service is not installed (400 `service_not_installed`) and an event type
 * whose feature is off for the organisation (403 `feature_disabled`).
 * `GET /v4/config/platform/webhooks/event-types` lists the types that the
 * organisation can subscribe to. The SSE key of an event is its `subject.id`:
 * the credential exchange id of an issuance history, or the
 * presentationExchangeId of a verification.
 */
export const ISSUER_TOPICS = [
  "ows.issuer.issuance_history.offer_retrieved",
  "ows.issuer.issuance_history.token_issued",
  "ows.issuer.issuance_history.credential_deferred",
  "ows.issuer.issuance_history.credential_issued",
  "ows.issuer.issuance_history.credential_accepted",
  "ows.issuer.issuance_history.denied",
  "ows.issuer.issuance_history.expired",
] as const;

export const VERIFIER_TOPICS = [
  "ows.verifier.verification.request_retrieved",
  "ows.verifier.verification.presentation_received",
  "ows.verifier.verification.declined",
] as const;

export const ALL_TOPICS: string[] = [...ISSUER_TOPICS, ...VERIFIER_TOPICS];

const SUPPORTED = new Set<string>(ALL_TOPICS);

export function isSupportedTopic(type: unknown): type is string {
  return typeof type === "string" && SUPPORTED.has(type);
}
