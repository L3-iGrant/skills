---
name: igrantio-schema-discovery
description: 'How to find a credential schema or a DCQL query for the iGrant.io Organisation Wallet Suite. Start with the iGrant.io verifiable data registry (claim path pointer schemas and DCQL query templates), which the API also serves through its template operations. If the credential type you need is not there, check the EUDI Wallet attestation rulebooks catalog for a rulebook that defines it, and build the claim path pointer document from the rulebook. Use this skill when no igrantio-credential-schema-* or igrantio-dcql-query-* skill matches the credential you must issue or verify.'
license: Apache-2.0
metadata:
  categories: [credential-schema]
  provider: iGrant.io
  keywords: credential schema, claim path pointer, DCQL query, schema discovery, verifiable data registry, attestation rulebook, ARF, EUDIW, eIDAS2
  version: 2026.10.01
  source-doc: https://github.com/decentralised-dataexchange/verifiable-data-registry
---

# Find a credential schema or DCQL query

## When to use
Use this skill when you must issue or verify a credential type and no
`igrantio-credential-schema-*` or `igrantio-dcql-query-*` skill covers it.
The steps below tell you where to look, in order.

## Prerequisites
- An **iGrant.io Organisation Wallet Suite (OWS) API key**. Get it from
  [support@igrant.io](mailto:support@igrant.io). Keep it on the server, in
  an environment variable or a secret manager. The browser never sees it.
- The **OWS environment** the key belongs to. The default is **demo**
  (`https://demo-api.igrant.io`). Use **staging**
  (`https://staging-api.igrant.io`) only when the integrator asks for it.
  A key works only in its own environment.

## Ask the integrator first
Ask one question at a time. Wait for the answer. Give the recommended
default with each question. Look up facts in the project (framework,
environment variables, an existing backend) instead of asking for them.
Record the answers before you write code.

1. **Environment** - demo or staging? _Default demo
   (`https://demo-api.igrant.io`); a switch later is a configuration
   change._
2. **API key** - do you have the OWS API key for that environment? If not,
   request it from [support@igrant.io](mailto:support@igrant.io) before you
   continue.
3. **Credential type** - the name or rule book of the credential?
4. **Role** - issue it, verify it, or both?
5. **Format** - `dc+sd-jwt`, `jwt_vc_json` or `mso_mdoc`? _Recommend
   `dc+sd-jwt` unless the rule book requires mdoc._
6. **Trust list** - is your certificate registered in the trust list (the
   trust anchor for an issuer, the WRPAC for a relying party)? If not, contact
   [support@igrant.io](mailto:support@igrant.io) and follow
   <https://docs.igrant.io/docs/trust-relying-party-registration/>.

## Step 1: the iGrant.io verifiable data registry
The registry is the source for the template skills in this collection:

- Credential schemas (claim path pointer documents):
  <https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/credentialSchemas/claimPathPointer>
- DCQL query templates:
  <https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/presentationDefinitions/dcqlQuery>

Each template holds one directory per version. Take the latest version
directory. It holds one schema file and one metadata file per credential
format. The registry can hold templates that are newer than the skills in
this collection, so check it even when a skill exists.

The API serves the latest version of each template, with your API key:

- `GET /v2/config/digital-wallet/openid/sdjwt/credential-definition/templates`
- `GET /v2/config/digital-wallet/openid/sdjwt/presentation-definition/templates`

Each answer holds a `templates` array and a `pagination` object (`offset` and
`limit` query parameters, 10 items by default). In the first answer, use the
entries with `type: claimPathPointer`. In the second, use the entries whose
format metadata has `isDcqlQuery: true`. The answers fill in placeholders such
as `{baseUrl}` for your environment.

## Step 2: the EUDI Wallet attestation rulebooks catalog
**If the credential type is not in the iGrant.io registry, check the EUDI
Wallet attestation rulebooks catalog of the ARF:**

<https://github.com/eu-digital-identity-wallet/eudi-doc-attestation-rulebooks-catalog>

A rulebook defines the attestation: its attribute names, formats, and
namespaces. The WE BUILD consortium catalog
(<https://github.com/webuild-consortium/webuild-attestation-rulebooks-catalog>)
holds draft rulebooks for the European Business Wallet. Treat those as drafts,
not as binding rules. When you find a rulebook for your credential type, build
the claim path pointer document from its attribute definitions:

- One `claims[]` entry per attribute.
- For `mso_mdoc`, the first element of each `path` array is the namespace
  from the rulebook; the second is the attribute name.
- For `dc+sd-jwt`, the `path` array holds the claim name path and the
  rulebook gives the `vct` value.
- Set `mandatory` and `limitDisclosure` per attribute as the rulebook
  requires.

Then create the credential definition with one `credentialDefinitions[]` entry
per format, `version: version_01` and `cryptographicKeyFormat: x509`. Read
`igrantio-api-issuer` for the operation, or `igrantio-api-verifier` to build
the matching DCQL query.

## Step 3: no rulebook exists
If neither source covers the credential type, define your own claim path
pointer document with the fields above, and propose it to the registry with
a pull request.

## Sources are the truth
Both catalogs move faster than this skill. Always fetch the linked
repositories to check for new or updated templates and rulebooks before you
conclude that a schema does not exist.
