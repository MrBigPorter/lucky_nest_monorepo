#!/usr/bin/env bash
# ============================================================
# Cloudflare DNS 正向切流脚本（默认 dry-run）
# ============================================================
# 用法:
#   bash deploy/switch-admin-cloudflare.sh
#   bash deploy/switch-admin-cloudflare.sh --execute
#
# 必填环境变量:
#   CLOUDFLARE_API_TOKEN
#   CLOUDFLARE_ZONE_ID
#   CLOUDFLARE_DNS_RECORD_ID
#   CF_SWITCH_TARGET
#
# 可选环境变量:
#   CF_RECORD_NAME=admin.joyminis.com
#   CF_SWITCH_TYPE=CNAME   # A 或 CNAME
# ============================================================
set -euo pipefail

API_BASE="https://api.cloudflare.com/client/v4"
DRY_RUN=true
CF_RECORD_NAME="${CF_RECORD_NAME:-admin.joyminis.com}"
CF_SWITCH_TYPE="${CF_SWITCH_TYPE:-CNAME}"

for arg in "$@"; do
  case "$arg" in
    --execute) DRY_RUN=false ;;
    --help)
      echo "Usage: bash deploy/switch-admin-cloudflare.sh [--execute]"
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
  "CF_SWITCH_TARGET"
)

for v in "${required_vars[@]}"; do
  if [ -z "${!v:-}" ]; then
    echo "[ERROR] Missing env var: $v"
    exit 1
  fi
done

if [ "$CF_SWITCH_TYPE" != "A" ] && [ "$CF_SWITCH_TYPE" != "CNAME" ]; then
  echo "[ERROR] CF_SWITCH_TYPE must be A or CNAME"
  exit 1
fi

if [ "$CF_SWITCH_TYPE" = "A" ]; then
  if ! echo "$CF_SWITCH_TARGET" | grep -Eq '^([0-9]{1,3}\.){3}[0-9]{1,3}$'; then
    echo "[ERROR] CF_SWITCH_TARGET must be IPv4 when CF_SWITCH_TYPE=A"
    exit 1
  fi
else
  if ! echo "$CF_SWITCH_TARGET" | grep -Eq '^[a-zA-Z0-9.-]+$'; then
    echo "[ERROR] Invalid CNAME target: $CF_SWITCH_TARGET"
    exit 1
  fi
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
echo "[INFO] Switch target: $CF_RECORD_NAME $CF_SWITCH_TYPE -> $CF_SWITCH_TARGET"

payload=$(python3 - <<PY
import json
print(json.dumps({
  "type": "${CF_SWITCH_TYPE}",
  "name": "${CF_RECORD_NAME}",
  "content": "${CF_SWITCH_TARGET}",
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

if [ "$new_content" != "$CF_SWITCH_TARGET" ]; then
  echo "[ERROR] DNS content mismatch after switch: expected $CF_SWITCH_TARGET, got $new_content"
  exit 1
fi

echo "[OK] DNS switch completed: $CF_RECORD_NAME $new_type -> $new_content"

