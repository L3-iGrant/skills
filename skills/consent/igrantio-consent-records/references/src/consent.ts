import type { ConsentClient, ConsentRecord } from "./consentClient";

/**
 * Convenience helpers over the raw consent-record client. All take the
 * `individualId` (resolve it server-side from your userId ↔ individualId mapping;
 * see igrantio-individuals) and a `dataAgreementId`.
 */

/** Read the individual's current consent for a data agreement, or null if none yet. */
export async function readConsent(
  client: ConsentClient,
  individualId: string,
  dataAgreementId: string,
): Promise<ConsentRecord | null> {
  try {
    const { consentRecord } = await client.consentRecords.read(individualId, dataAgreementId);
    return consentRecord ?? null;
  } catch {
    return null;
  }
}

/**
 * Give or withdraw consent for a data agreement. Creates the record on first use,
 * otherwise updates it. `optIn` true = allow, false = withdraw.
 */
export async function setConsent(
  client: ConsentClient,
  individualId: string,
  dataAgreementId: string,
  optIn: boolean,
  opts: { revisionId?: string } = {},
): Promise<ConsentRecord> {
  const existing = await readConsent(client, individualId, dataAgreementId);

  if (!existing?.id) {
    const { consentRecord } = await client.consentRecords.create(
      individualId,
      dataAgreementId,
      { optIn },
      { revisionId: opts.revisionId },
    );
    return consentRecord;
  }

  const revisionId = opts.revisionId ?? existing.dataAgreementRevisionId ?? "";
  const { consentRecord } = await client.consentRecords.update(
    individualId,
    existing.id,
    { optIn },
    { dataAgreementId, revisionId },
  );
  return consentRecord;
}

export const giveConsent = (
  client: ConsentClient,
  individualId: string,
  dataAgreementId: string,
  opts?: { revisionId?: string },
): Promise<ConsentRecord> => setConsent(client, individualId, dataAgreementId, true, opts);

export const withdrawConsent = (
  client: ConsentClient,
  individualId: string,
  dataAgreementId: string,
  opts?: { revisionId?: string },
): Promise<ConsentRecord> => setConsent(client, individualId, dataAgreementId, false, opts);
