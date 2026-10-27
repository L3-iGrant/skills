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
  const { consentRecord } = await client.consentRecords.read(individualId, dataAgreementId);
  return consentRecord ?? null;
}

/**
 * Give or withdraw consent for a data agreement. Creates the record on first use,
 * otherwise updates it. `optIn` true = allow, false = withdraw. A new record is
 * always opted in, so a first withdraw is a create and then an update.
 * `revisionId` applies only to a new record: an update always moves the record
 * to the latest revision of the data agreement.
 */
export async function setConsent(
  client: ConsentClient,
  individualId: string,
  dataAgreementId: string,
  optIn: boolean,
  opts: { revisionId?: string } = {},
): Promise<ConsentRecord> {
  const existing = await readConsent(client, individualId, dataAgreementId);

  let record = existing;
  if (!record?.id) {
    ({ consentRecord: record } = await client.consentRecords.create(individualId, dataAgreementId, {
      revisionId: opts.revisionId,
    }));
    if (!record.id) throw new Error("Create consent record returned no id");
    if (record.optIn === optIn) return record;
  }

  const { consentRecord } = await client.consentRecords.update(individualId, record.id, { optIn });
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
