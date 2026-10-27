import { ConsentApiError, type ConsentClient, type Individual } from "./consentClient";
import type { IndividualMappingStore } from "./mappingStore";

export interface OnboardProfile {
  name: string;
  /** With an email the service also makes a login account for the individual. */
  email?: string;
  phone?: string;
  /** Defaults to "app_user_id"; override if you use a different external id type. */
  externalIdType?: string;
  [k: string]: unknown;
}

/**
 * Idempotently ensure a Consent BB individual exists for your user and return
 * its individualId. Resolution order:
 *   1. local mapping (your DB)       - fast path, no API call
 *   2. create with externalId = userId
 *   3. on HTTP 409 (an individual already has that externalId), look it up
 *      by externalId - it was created before but is not mapped
 * The mapping is persisted so later calls are O(1). Call this from your
 * authenticated signup/onboarding handler; `userId` MUST come from your session,
 * never from untrusted input.
 */
export async function ensureIndividual(
  client: ConsentClient,
  store: IndividualMappingStore,
  userId: string,
  profile: OnboardProfile,
): Promise<string> {
  const mapped = await store.getIndividualId(userId);
  if (mapped) return mapped;

  const payload: Individual = {
    externalIdType: "app_user_id",
    ...profile,
    externalId: userId,
  };
  let individualId: string | undefined;
  try {
    ({ individual: { id: individualId } } = await client.individuals.create(payload));
  } catch (e) {
    if (!(e instanceof ConsentApiError && e.status === 409)) throw e;
    // The externalId is taken: reuse the individual created before with this userId.
    const { individuals } = await client.individuals.list({ externalIndividualId: userId });
    individualId = individuals[0]?.id;
  }
  if (!individualId) throw new Error(`No individual id for user ${userId}`);
  await store.set(userId, individualId);
  return individualId;
}
