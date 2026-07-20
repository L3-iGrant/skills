import type { ConsentClient, Individual } from "./consentClient";
import type { IndividualMappingStore } from "./mappingStore";

export interface OnboardProfile {
  name: string;
  email: string;
  phone: string;
  /** Defaults to "app_user_id"; override if you use a different external id type. */
  externalIdType?: string;
  [k: string]: unknown;
}

/**
 * Idempotently ensure a Consent BB individual exists for your user and return
 * its individualId. Resolution order:
 *   1. local mapping (your DB)         - fast path, no API call
 *   2. lookup by externalId (= userId) - reuse if created before but unmapped
 *   3. create a new individual
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

  // Reuse an individual previously created with this userId as its externalId.
  try {
    const { individuals } = await client.individuals.list({
      externalIndividualId: userId,
      limit: 1,
      offset: 0,
    });
    const found = individuals?.[0]?.id;
    if (found) {
      await store.set(userId, found);
      return found;
    }
  } catch {
    // list may error/empty for a new externalId - fall through to create
  }

  const payload: Individual = {
    externalIdType: "app_user_id",
    ...profile,
    externalId: userId,
  };
  const { individual } = await client.individuals.create(payload);
  if (!individual?.id) throw new Error("Create individual returned no id");
  await store.set(userId, individual.id);
  return individual.id;
}
