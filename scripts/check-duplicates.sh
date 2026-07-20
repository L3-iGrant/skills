#!/usr/bin/env bash
# Verify that intentionally duplicated reference files stay byte-identical.
# The FIRST path in each group is the canonical copy (see CONTRIBUTING.md).
set -u
fail=0

check() {
  canonical="$1"; shift
  for copy in "$@"; do
    if [ ! -f "$canonical" ]; then echo "MISSING canonical: $canonical"; fail=1; continue; fi
    if [ ! -f "$copy" ]; then echo "MISSING copy: $copy"; fail=1; continue; fi
    if ! cmp -s "$canonical" "$copy"; then
      echo "DRIFT: $copy differs from canonical $canonical"
      fail=1
    fi
  done
}

# Backend building blocks (canonical) vs composed issuer/verifier backends
check ows/igrantio-backend-proxy/references/config.ts \
      ows/igrantio-backend-webhooks/references/config.ts \
      ows/igrantio-issuer-backend/references/src/config.ts \
      ows/igrantio-verifier-backend/references/src/config.ts
check ows/igrantio-backend-proxy/references/proxy.ts \
      ows/igrantio-issuer-backend/references/src/proxy.ts \
      ows/igrantio-verifier-backend/references/src/proxy.ts
check ows/igrantio-backend-proxy/references/tenants.ts \
      ows/igrantio-issuer-backend/references/src/tenants.ts \
      ows/igrantio-verifier-backend/references/src/tenants.ts
check ows/igrantio-backend-sse/references/eventStore.ts \
      ows/igrantio-backend-webhooks/references/eventStore.ts \
      ows/igrantio-issuer-backend/references/src/eventStore.ts \
      ows/igrantio-verifier-backend/references/src/eventStore.ts
check ows/igrantio-backend-sse/references/sse.ts \
      ows/igrantio-issuer-backend/references/src/sse.ts \
      ows/igrantio-verifier-backend/references/src/sse.ts
check ows/igrantio-backend-webhooks/references/webhooks.ts \
      ows/igrantio-issuer-backend/references/src/webhooks.ts \
      ows/igrantio-verifier-backend/references/src/webhooks.ts
check ows/igrantio-backend-webhooks/references/topics.ts \
      ows/igrantio-issuer-backend/references/src/topics.ts \
      ows/igrantio-verifier-backend/references/src/topics.ts
check ows/igrantio-backend-webhooks/references/registerWebhook.ts \
      ows/igrantio-issuer-backend/references/src/registerWebhook.ts \
      ows/igrantio-verifier-backend/references/src/registerWebhook.ts

# Frontend client library (canonical) vendored into issuer/verifier frontends
CANON=ows/igrantio-frontend-client/references/lib/ows
while IFS= read -r f; do
  rel="${f#"$CANON"/}"
  check "$f" \
        "ows/igrantio-issuer-frontend/references/lib/ows/$rel" \
        "ows/igrantio-verifier-frontend/references/lib/ows/$rel"
done < <(find "$CANON" -type f | sort)

# Consent BB client (canonical in consent-records)
check consent/igrantio-consent-records/references/src/consentClient.ts \
      consent/igrantio-individuals/references/src/consentClient.ts

if [ "$fail" -ne 0 ]; then
  echo "Duplicated reference files have drifted. Update the canonical copy and re-sync."
  exit 1
fi
echo "OK: all duplicated reference files are in sync."
