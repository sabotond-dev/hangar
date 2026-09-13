#!/usr/bin/env bash
# The e2e chunk runner (12.1-08's copy of e2e-chunks.sh, 13-07 deviation 9), in the tree since
# 13.2-01 so a later session can run it: a fresh detached wrangler dev per chunk on 4173, the
# "N passed" line per chunk, the server stopped through PowerShell (taskkill's /F and /T are
# rewritten to F:/ and T:/ by Git Bash's path conversion, so every server outlived its chunk and
# held build/). Nothing here touches the tree.
#
#   E2E_LOG_DIR=<dir> bash scripts/gate/e2e-chunks.sh                 c1 c2 c3 c4 c5
#   E2E_LOG_DIR=<dir> bash scripts/gate/e2e-chunks.sh <name> <files...> one chunk
#
# E2E_LOG_DIR is required and is where the playwright and wrangler logs go (outside the tree - the
# scratchpad, usually). The free memory is printed beside each chunk.
#
# Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
set -u
export MSYS_NO_PATHCONV=1
if [ -z "${E2E_LOG_DIR:-}" ]; then
  echo "e2e-chunks.sh: set E2E_LOG_DIR to a directory outside the tree for the logs" >&2
  exit 2
fi
S="$E2E_LOG_DIR"
mkdir -p "$S" || exit 2
# cmd.exe redirects to a Windows path; cygpath is Git Bash's.
SW=$(cygpath -w "$S" 2>/dev/null || echo "$S")
cd "$(dirname "$0")/../.." || exit 2

free_gb() {
  powershell -NoProfile -Command "[math]::Round((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory/1MB,2)" | tr -d '\r'
}

start_server() {
  local log="$1"
  local pid
  pid=$(powershell -NoProfile -Command "\$p = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c','npx wrangler dev --port 4173 --ip 127.0.0.1 > $log 2>&1' -WindowStyle Hidden -PassThru; Write-Output \$p.Id" | tr -d '\r')
  for i in $(seq 1 40); do
    code=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:4173/ 2>/dev/null)
    if [ "$code" = "401" ]; then echo "server pid $pid ready after $i s"; echo "$pid"; return 0; fi
    sleep 1
  done
  echo "server did not come up"; echo "$pid"; return 1
}

stop_server() {
  # Every process whose command line names wrangler dev on 4173, plus workerd.
  powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { (\$_.CommandLine -match 'wrangler.*dev --port 4173') -or (\$_.Name -eq 'workerd.exe') } | ForEach-Object { Stop-Process -Id \$_.ProcessId -Force -ErrorAction SilentlyContinue }" >/dev/null 2>&1
  sleep 2
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://127.0.0.1:4173/ 2>/dev/null)
  echo "   server after stop: HTTP ${code:-000}"
}

run_chunk() {
  local name="$1"; shift
  local log="$S/e2e-chunk-$name.log"
  local wlog="$SW\\wrangler-chunk-$name.log"
  local out pid
  echo "== chunk $name: free memory $(free_gb) GB"
  out=$(start_server "$wlog")
  pid=$(echo "$out" | tail -1)
  echo "   $(echo "$out" | head -1)"
  npx playwright test --workers 3 "$@" > "$log" 2>&1
  echo "   playwright exit $?; $(grep -E '^\s+[0-9]+ (passed|failed|flaky|skipped)' "$log" | tr -s ' ' | tr '\n' ';')"
  stop_server "$pid"
}

if [ $# -gt 0 ]; then
  run_chunk "$@"
else
  run_chunk c1 e2e/install.e2e.ts e2e/session.e2e.ts
  run_chunk c2 e2e/browse.e2e.ts e2e/browse-webkit.e2e.ts
  run_chunk c3 e2e/tuning.e2e.ts e2e/tuning-webkit.e2e.ts
  run_chunk c4 e2e/catalog.e2e.ts e2e/fidelity.e2e.ts e2e/first-experience.e2e.ts e2e/library.e2e.ts e2e/sandbox.e2e.ts
  run_chunk c5 e2e/artifacts.e2e.ts e2e/radius.e2e.ts e2e/skeleton.e2e.ts e2e/smoke.e2e.ts
fi
