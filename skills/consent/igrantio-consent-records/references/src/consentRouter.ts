import express, { Router, type Request, type Response } from "express";
import type { ConsentClient } from "./consentClient";
import { readConsent, setConsent } from "./consent";

/**
 * Resolve the current request's individualId server-side. Typically:
 * session -> userId -> IndividualMappingStore (see igrantio-individuals).
 * NEVER trust an individualId sent by the browser.
 */
export type IndividualIdResolver = (req: Request) => Promise<string | undefined> | string | undefined;

/**
 * Express router exposing clean consent endpoints to a frontend. The individualId
 * and the org API key are supplied server-side; the browser only names the data
 * agreement and the opt-in choice.
 *
 *   GET    /consents                     list the user's consent records
 *   GET    /consents/:dataAgreementId    read consent for one data agreement
 *   PUT    /consents/:dataAgreementId    body { optIn, revisionId? } — allow/withdraw
 *   GET    /history                      consent-record change history
 *   DELETE /consents                     erase all records (right to be forgotten)
 */
export function consentRouter(client: ConsentClient, resolveIndividualId: IndividualIdResolver): Router {
  const r = Router();
  r.use(express.json());

  async function requireIndividual(req: Request, res: Response): Promise<string | null> {
    const id = await resolveIndividualId(req);
    if (!id) {
      res.status(401).json({ error: "no individual mapped for the current user" });
      return null;
    }
    return id;
  }

  const fail = (res: Response, e: unknown) =>
    res.status(502).json({ error: e instanceof Error ? e.message : String(e) });

  r.get("/consents", async (req, res) => {
    const id = await requireIndividual(req, res);
    if (!id) return;
    try {
      res.json(
        await client.consentRecords.list(id, {
          limit: Number(req.query.limit ?? 10),
          offset: Number(req.query.offset ?? 0),
        }),
      );
    } catch (e) {
      fail(res, e);
    }
  });

  r.get("/consents/:dataAgreementId", async (req, res) => {
    const id = await requireIndividual(req, res);
    if (!id) return;
    try {
      res.json({ consentRecord: await readConsent(client, id, req.params.dataAgreementId) });
    } catch (e) {
      fail(res, e);
    }
  });

  r.put("/consents/:dataAgreementId", async (req, res) => {
    const id = await requireIndividual(req, res);
    if (!id) return;
    try {
      const record = await setConsent(client, id, req.params.dataAgreementId, !!req.body?.optIn, {
        revisionId: req.body?.revisionId,
      });
      res.json({ consentRecord: record });
    } catch (e) {
      fail(res, e);
    }
  });

  r.get("/history", async (req, res) => {
    const id = await requireIndividual(req, res);
    if (!id) return;
    try {
      res.json(
        await client.consentRecords.history(id, {
          limit: Number(req.query.limit ?? 10),
          offset: Number(req.query.offset ?? 0),
        }),
      );
    } catch (e) {
      fail(res, e);
    }
  });

  r.delete("/consents", async (req, res) => {
    const id = await requireIndividual(req, res);
    if (!id) return;
    try {
      await client.consentRecords.deleteAll(id);
      res.json({ ok: true });
    } catch (e) {
      fail(res, e);
    }
  });

  return r;
}
