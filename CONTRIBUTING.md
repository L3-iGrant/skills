# Contributing

Thank you for helping improve the iGrant.io Agent Skills. The two most useful
contributions are reporting inaccuracies in the skill files and proposing new
skills; issue templates exist for both.

## Working on reference implementations

Each skill's `references/` folder is self-contained. For the folders that ship
a `package.json`, validate changes with:

```bash
cd <skill>/references
npm install
npm run typecheck
```

## Duplicated files and canonical copies

Some reference files are intentionally duplicated so that every skill is
self-contained when installed on its own. Always edit the canonical copy first,
then copy it byte-for-byte to the other locations. CI runs
`scripts/check-duplicates.sh` and fails if the copies drift.

| File(s) | Canonical location |
| --- | --- |
| `config.ts`, `proxy.ts`, `tenants.ts` | `ows/igrantio-backend-proxy/references/` |
| `eventStore.ts`, `sse.ts` | `ows/igrantio-backend-sse/references/` |
| `webhooks.ts`, `topics.ts`, `registerWebhook.ts` | `ows/igrantio-backend-webhooks/references/` |
| `lib/ows/` (client and React hooks) | `ows/igrantio-frontend-client/references/lib/ows/` |
| `consentClient.ts` | `consent/igrantio-consent-records/references/src/` |

## Versioning

Each skill carries a `metadata.version` field in its `SKILL.md` frontmatter,
following the `yyyy.mm.NN` scheme, where `yyyy.mm` is the year and month of
the release and `NN` is the release number within that month (for example
`2026.07.01`). Bump it whenever the skill's contract changes (endpoints,
payloads, file layout, or the steps an agent is told to follow).

## Commit style

Follow the existing conventional-commit style: `docs:`, `fix:`, `feat:`,
`refactor:`, `chore:`.

## Licence

By contributing you agree that your contributions are licensed under the
Apache 2.0 licence that covers this repository.
