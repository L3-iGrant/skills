# Agent Skills

[![Install via skills.sh](https://img.shields.io/badge/skills.sh-install-green)](https://skills.sh/decentralised-dataexchange/skills)

This repository contains [Agent Skills](https://agentskills.io/home) for
[iGrant.io](https://igrant.io) products and technologies, including the
[Organisation Wallet Suite (OWS)](https://docs.igrant.io/docs/openid4vc-api) and
the [Consent Building Block](https://docs.igrant.io/docs/category/consent-management-admin-api).

> [!NOTE]
> This repository is under active development.

## Installation

```bash
npx skills add decentralised-dataexchange/skills
```

From the `npx install` command, you can select the specific skills from this
repo to install.

## Available Skills

<!-- BEGIN SKILLS -->
- **Getting started with iGrant.io**
  -   [**iGrant.io Organisation Wallet Suite overview**](./skills/ows/igrantio-ows-overview)
- **Credential issuance (OpenID4VCI)**
  -   [**Issuer backend**](./skills/ows/igrantio-issuer-backend)
  -   [**Issuer frontend**](./skills/ows/igrantio-issuer-frontend)
- **Credential verification (OpenID4VP + DCQL)**
  -   [**Verifier backend**](./skills/ows/igrantio-verifier-backend)
  -   [**Verifier frontend**](./skills/ows/igrantio-verifier-frontend)
- **Consent management**
  -   [**Consent records**](./skills/consent/igrantio-consent-records)
  -   [**Individuals onboarding**](./skills/consent/igrantio-individuals)
- **Composable building blocks**
  -   [**Backend proxy (API-key hiding, multi-tenant)**](./skills/ows/igrantio-backend-proxy)
  -   [**Backend Server-Sent Events**](./skills/ows/igrantio-backend-sse)
  -   [**Backend webhooks**](./skills/ows/igrantio-backend-webhooks)
  -   [**Frontend client**](./skills/ows/igrantio-frontend-client)
<!-- END SKILLS -->

## Support

If you need help or encounter issues with these skills, search for existing
issues or open a new one in the
[GitHub Issue Tracker](https://github.com/decentralised-dataexchange/skills/issues).

## Contributing

We welcome contributions to improve our skills. You can help by:

*   [Reporting bugs or inaccuracies](https://github.com/decentralised-dataexchange/skills/issues)
    in the skill Markdown files.
*   Suggesting new skills to add to this repository (for example, iGrant.io
    technologies or recipes) by filing a feature request.

## License

You are free to copy, modify, and distribute these skills under the terms of the
Apache 2.0 license. See the `LICENSE` file for details.
