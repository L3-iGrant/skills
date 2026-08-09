---
name: igrantio-schema-discovery
description: 'How to find a credential schema or a DCQL query for the iGrant.io Organisation Wallet Suite. Start with the iGrant.io verifiable data registry (claim path pointer schemas and DCQL query templates). If the credential type you need is not there, check the WE BUILD attestation rulebooks catalog for a rulebook that defines it, and build the claim path pointer document from the rulebook. Use this skill when no igrantio-credential-schema-* or igrantio-dcql-query-* skill matches the credential you must issue or verify.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: credential schema, claim path pointer, DCQL query, schema discovery, verifiable data registry, WE BUILD, attestation rulebook, EUDIW, eIDAS2
  version: 2026.08.01
  source-doc: https://github.com/decentralised-dataexchange/verifiable-data-registry
---

# Find a credential schema or DCQL query

## When to use
Use this skill when you must issue or verify a credential type and no
`igrantio-credential-schema-*` or `igrantio-dcql-query-*` skill covers it.
The steps below tell you where to look, in order.

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

## Step 2: the WE BUILD attestation rulebooks catalog
**If the credential type is not in the iGrant.io registry, check the WE BUILD
attestation rulebooks catalog:**

<https://github.com/webuild-consortium/webuild-attestation-rulebooks-catalog>

The catalog collects attestation rulebooks for the European Business Wallet
ecosystem. A rulebook defines the attestation: its attribute names, formats,
and namespaces. When you find a rulebook for your credential type, build the
claim path pointer document from its attribute definitions:

- One `claims[]` entry per attribute.
- For `mso_mdoc`, the first element of each `path` array is the namespace
  from the rulebook; the second is the attribute name.
- For `dc+sd-jwt`, the `path` array holds the claim name path and the
  rulebook gives the `vct` value.
- Set `mandatory` and `limitDisclosure` per attribute as the rulebook
  requires.

Then create the credential definition with the `credentialDefinitions[]`
approach and `version: version_01`. Read `igrantio-api-issuer` for the
operation, or `igrantio-api-verifier` to build the matching DCQL query.

## Step 3: no rulebook exists
If neither source covers the credential type, define your own claim path
pointer document with the fields above, and propose it to the registry with
a pull request.

## Sources are the truth
Both catalogs move faster than this skill. Always fetch the linked
repositories to check for new or updated templates and rulebooks before you
conclude that a schema does not exist.
