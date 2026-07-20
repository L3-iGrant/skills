# Security policy

## Reporting a vulnerability

Please do not report security vulnerabilities through public GitHub issues.

Report them privately by email to **support@igrant.io** with the subject line
"Security: skills repository". Include a description of the issue, the affected
skill or reference file, and reproduction steps where possible. We aim to
acknowledge reports within five working days.

## Scope

The reference implementations in this repository are examples intended to be
adapted by AI coding agents. They are not hosted services. Vulnerabilities in
the iGrant.io platform itself should be reported through the same address, and
are handled under the iGrant.io responsible disclosure process.

## Good practice for integrators

The skills in this repository are designed so that organisation API keys stay
server-side and webhook payloads are HMAC-verified. If you adapt the reference
code, keep those properties intact.
