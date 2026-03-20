#!/usr/bin/env bash
# ============================================================
# Cloudflare DNS 回滚脚本（默认 dry-run）
# ============================================================
# 用法:
#   bash deploy/cloudflare-rollback.sh
#   bash deploy/cloudflare-rollback.sh --execute
#
# 必填环境变量:
#   CLOUDFLARE_API_TOKEN
#   CLOUDFLARE_ZONE_ID
#   CLOUDFLARE_DNS_RECORD_ID
#   CF_ROLLBACK_TARGET
#
# 可选环境变量:
#   CF_RECORD_NAME=admin.joyminis.com
#   CF_ROLLBACK_TYPE=CNAME   # A 或 CNAME
# ============================================================
set -euo pipefail

API_BASE="https://api.cloudflare.com/client/v4"
DRY_RUN=true
CF_RECORD_NAME="${CF_RECORD_NAME:-admin.joyminis.com}"
CF_ROLLBACK_TYPE="${CF_ROLLBACK_TYPE:-CNAME}"

for arg in "$@"; do
  case "$arg" in
    --execute) DRY_RUN=false ;;
    --help)
      echo "Usage: bash deploy/cloudflare-rollback.sh [--execute]"
      exit 0
      ;;
    *)
      echo "[ERROR] Unknown argument: $arg"
      exit 1
      ;;
  esac
done

required_vars=(
  "CLOUDFLARE_API_TOKEN"
  "CLOUDFLARE_ZONE_ID"
  "CLOUDFLARE_DNS_RECORD_ID"
  "CF_ROLLBACK_TARGET"
)

for v in "${required_vars[@]}"; do
  if [ -z "${!v:-}" ]; then
    echo "[ERROR] Missing env var: $v"
    exit 1
  fi
done

if [ "$CF_ROLLBACK_TYPE" != "A" ] && [ "$CF_ROLLBACK_TYPE" != "CNAME" ]; then
  echo "[ERROR] CF_ROLLBACK_TYPE must be A or CNAME"
  exit 1
fi

if [ "$CF_ROLLBACK_TYPE" = "A" ]; then
  if ! echo "$CF_ROLLBACK_TARGET" | grep -Eq '^([0-9]{1,3}\.){3}[0-9]{1,3}$'; then
    echo "[ERROR] CF_ROLLBACK_TARGET must be IPv4 when CF_ROLLBACK_TYPE=A"
    exit 1
  fi
else
  if ! echo "$CF_ROLLBACK_TARGET" | grep -Eq '^[a-zA-Z0-9.-]+$'; then
    echo "[ERROR] Invalid CNAME target: $CF_ROLLBACK_TARGET"
    exit 1
  fi
fi

if [ "$CF_ROLLBACK_TARGET" = "api.joyminis.com" ]; then
  echo "[ERROR] Refuse to set admin record target to api.joyminis.com"
  exit 1
fi

record_resp=$(curl -sS \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  "$API_BASE/zones/$CLOUDFLARE_ZONE_ID/dns_records/$CLOUDFLARE_DNS_RECORD_ID")

if ! echo "$record_resp" | python3 -c 'import json,sys; d=json.load(sys.stdin); sys.exit(0 if d.get("success") else 1)'; then
  echo "[ERROR] Failed to fetch DNS record"
  echo "$record_resp"
  exit 1
fi

current_name=$(echo "$record_resp" | python3 -c 'import json,sys; print(json.load(sys.stdin)["result"]["name"])')
current_type=$(echo "$record_resp" | python3 -c 'import json,sys; print(json.load(sys.stdin)["result"]["type"])')
current_content=$(echo "$record_resp" | python3 -c 'import json,sys; print(json.load(sys.stdin)["result"]["content"])')
current_ttl=$(echo "$record_resp" | python3 -c 'import json,sys; print(json.load(sys.stdin)["result"]["ttl"])')
current_proxied=$(echo "$record_resp" | python3 -c 'import json,sys; print(str(json.load(sys.stdin)["result"].get("proxied", True)).lower())')

if [ "$current_name" != "$CF_RECORD_NAME" ]; then
  echo "[ERROR] DNS record name mismatch: expected $CF_RECORD_NAME, got $current_name"
  exit 1
fi

echo "[INFO] Current record: $current_name $current_type -> $current_content"
echo "[INFO] Rollback target: $CF_RECORD_NAME $CF_ROLLBACK_TYPE -> $CF_ROLLBACK_TARGET"

payload=$(python3 - <<PY
import json
print(json.dumps({
  "type": "${CF_ROLLBACK_TYPE}",
  "name": "${CF_RECORD_NAME}",
  "content": "${CF_ROLLBACK_TARGET}",
  "ttl": int("${current_ttl}"),
  "proxied": "${current_proxied}" == "true"
}))
PY
)

if [ "$DRY_RUN" = true ]; then
  echo "[DRY-RUN] No changes applied."
  echo "[DRY-RUN] PATCH $API_BASE/zones/$CLOUDFLARE_ZONE_ID/dns_records/$CLOUDFLARE_DNS_RECORD_ID"
  echo "[DRY-RUN] Payload: $payload"
  exit 0
fi

update_resp=$(curl -sS -X PATCH \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  "$API_BASE/zones/$CLOUDFLARE_ZONE_ID/dns_records/$CLOUDFLARE_DNS_RECORD_ID" \
  --data "$payload")

if ! echo "$update_resp" | python3 -c 'import json,sys; d=json.load(sys.stdin); sys.exit(0 if d.get("success") else 1)'; then
  echo "[ERROR] Failed to update DNS record"
  echo "$update_resp"
  exit 1
fi

new_type=$(echo "$update_resp" | python3 -c 'import json,sys; print(json.load(sys.stdin)["result"]["type"])')
new_content=$(echo "$update_resp" | python3 -c 'import json,sys; print(json.load(sys.stdin)["result"]["content"])')

echo "[OK] DNS rollback completed: $CF_RECORD_NAME $new_type -> $new_content"

