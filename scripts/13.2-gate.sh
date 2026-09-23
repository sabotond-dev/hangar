#!/usr/bin/env bash
# Phase 13.2's gate (13.2-CONTEXT D-09, 13.2-VALIDATION "The gate"): the proof that a readability
# plan changed no behaviour, run before a plan's first edit and after its last source commit.
#
#   bash scripts/13.2-gate.sh --before <tag>
#   bash scripts/13.2-gate.sh --after <tag> --against <before-tag> --check <n> [--js-equal]
#
# --before <tag> records into .planning/phases/13.2-readability/gate/<tag>.* and REFUSES (exit 2)
# when gate/<tag>.wire.json exists: plan 01's record is the phase baseline 13.2-06 compares against,
# and a resumed plan compares against the record that exists. --after <tag> records into
# gate/<tag>-after.* and compares against gate/<against>.*; it exits 1 on the first inequality with
# the term named. The `.txt` beside each record is what the plan's SUMMARY pastes.
#
# Terms, in the order they run: HEAD and the dirty flag and the free memory; the wire (set,
# --full and, from plan 02 on, the --sandbox set over every Sandbox fixture the two specs build -
# a before-record without one reads "not recorded", stated; scripts/gate/hash-wire.mjs); the
# three string hashes (hash-strings.mjs); the per-file
# comment-line record (comment-lines.mjs); svelte-check's last line, asserted at --check <n>; lint;
# the quick suite through check-counts.mjs 95 999 with the JSON reporter for the titles; the build;
# the fixtures' git status and hash-objects; the raw built CSS (recorded, expected to move - Tailwind
# scans comments, D-21) and the SCOPED CSS with the utilities delta by name (css-terms.mjs); the OG
# count and bytes; the normalised built JS (recorded; asserted equal only under --js-equal); the sorted
# test titles (vitest JSON + playwright --list); the name-status and the --stat of src/ against the
# before-record's HEAD. The sweep and the e2e chunks are not in the script (13.2-CONTEXT D-18 says
# where they run).
#
# Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
set -u
export MSYS_NO_PATHCONV=1
cd "$(dirname "$0")/.." || exit 2

GATE=".planning/phases/13.2-readability/gate"
QUICK_FILES=96
QUICK_TESTS=1059
FIXTURES="src/lib/catalog/frames.json src/lib/fidelity/golden-frames.json src/lib/fidelity/preset-baseline.json src/lib/transport/fixtures/synthetic-zona.json"
REFUSED_PATHS="src/vendor src/lib/fidelity/upstream-manifest.json src/lib/ui/Knob.svelte src/lib/ui/ColourPicker.svelte"

mode=""
tag=""
against=""
check=""
jsequal=0
while [ $# -gt 0 ]; do
  case "$1" in
    --before) mode=before; tag="$2"; shift 2 ;;
    --after) mode=after; tag="$2"; shift 2 ;;
    --against) against="$2"; shift 2 ;;
    --check) check="$2"; shift 2 ;;
    --js-equal) jsequal=1; shift ;;
    *) echo "13.2-gate: unknown argument $1" >&2; exit 2 ;;
  esac
done
if [ -z "$mode" ] || [ -z "$tag" ]; then
  echo "usage: 13.2-gate.sh --before <tag> | --after <tag> --against <tag> --check <n> [--js-equal]" >&2
  exit 2
fi
if [ "$mode" = after ] && { [ -z "$against" ] || [ -z "$check" ]; }; then
  echo "13.2-gate: --after needs --against <tag> and --check <n>" >&2
  exit 2
fi
mkdir -p "$GATE"

if [ "$mode" = before ]; then
  REC="$GATE/$tag"
  if [ -s "$REC.wire.json" ]; then
    echo "13.2-gate: record exists ($REC.wire.json) - a --before record is a baseline and is never rewritten" >&2
    exit 2
  fi
  BEFORE=""
else
  REC="$GATE/$tag-after"
  BEFORE="$GATE/$against"
  for f in "$BEFORE.wire.json" "$BEFORE.strings.json" "$BEFORE.lines.json" "$BEFORE.utilities.txt" "$BEFORE.txt"; do
    if [ ! -s "$f" ]; then echo "13.2-gate: no before-record $f" >&2; exit 2; fi
  done
fi
TXT="$REC.txt"
: > "$TXT"
log() { printf '%s\n' "$*" | tee -a "$TXT"; }
TMP=$(mktemp -d)

free_gb() {
  powershell -NoProfile -Command "[math]::Round((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory/1MB,2)" | tr -d '\r'
}

HEAD_SHORT=$(git rev-parse --short HEAD)
HEAD_FULL=$(git rev-parse HEAD)
DIRTY=$(git status --porcelain -- src e2e scripts docs | wc -l | tr -d ' ')
log "# 13.2 gate --$mode $tag$( [ "$mode" = after ] && echo " --against $against --check $check$( [ $jsequal = 1 ] && echo ' --js-equal')")"
log "HEAD $HEAD_SHORT ($HEAD_FULL); dirty (src e2e scripts docs) $DIRTY; free memory $(free_gb) GB; $(date -u +%Y-%m-%dT%H:%M:%SZ)"
if [ "$mode" = after ]; then
  BEFORE_HEAD=$(sed -nE 's/^HEAD ([0-9a-f]+) \(([0-9a-f]{40})\).*/\2/p' "$BEFORE.txt" | head -1)
  log "before-record HEAD $BEFORE_HEAD"
fi

# ---- the wire ---------------------------------------------------------------------------------------
log ""
log "## the wire"
node --import ./scripts/gate/ts-ext-register.mjs scripts/gate/hash-wire.mjs --out "$REC.wire-set.json" > "$TMP/wire-set.log" 2>&1
log "$(tail -2 "$TMP/wire-set.log" | sed -nE '1p')"
log "WIRE SET $(sed -nE 's/^SET sha256 ([0-9a-f]+).*/\1/p' "$TMP/wire-set.log")"
node --import ./scripts/gate/ts-ext-register.mjs scripts/gate/hash-wire.mjs --full --sandbox --out "$REC.wire.json" > "$TMP/wire-full.log" 2>&1
log "$(tail -2 "$TMP/wire-full.log" | sed -nE '1p')"
WIRE_FULL=$(sed -nE 's/^SET sha256 ([0-9a-f]+).*/\1/p' "$TMP/wire-full.log")
log "WIRE FULL $WIRE_FULL"
WIRE_SET=$(sed -nE 's/^SET sha256 ([0-9a-f]+).*/\1/p' "$TMP/wire-set.log")
log "$(grep -E '^[0-9]+ Sandbox strings from' "$TMP/wire-full.log")"
SANDBOX_SET=$(sed -nE 's/^SANDBOX SET sha256 ([0-9a-f]+).*/\1/p' "$TMP/wire-full.log")
log "WIRE SANDBOX SET $SANDBOX_SET"

# ---- the strings ------------------------------------------------------------------------------------
log ""
log "## the strings"
if [ "$mode" = after ]; then
  node scripts/gate/hash-strings.mjs --out "$REC.strings.json" --diff "$BEFORE.strings.json" > "$TMP/strings.log" 2>&1
else
  node scripts/gate/hash-strings.mjs --out "$REC.strings.json" > "$TMP/strings.log" 2>&1
fi
grep -vE '^-> ' "$TMP/strings.log" | while IFS= read -r l; do log "$l"; done
CENSUS=$(sed -nE 's/^literal census sha256 ([0-9a-f]+).*/\1/p' "$TMP/strings.log")
COPYX=$(sed -nE 's/^copy exports +sha256 ([0-9a-f]+).*/\1/p' "$TMP/strings.log")
TESTIDS=$(sed -nE 's/^data-testids +sha256 ([0-9a-f]+).*/\1/p' "$TMP/strings.log")

# ---- the comment lines ------------------------------------------------------------------------------
log ""
log "## the comment lines"
if [ "$mode" = after ]; then
  node scripts/gate/comment-lines.mjs --out "$REC.lines.json" --against "$BEFORE.lines.json" > "$TMP/lines.log" 2>&1
else
  node scripts/gate/comment-lines.mjs --out "$REC.lines.json" > "$TMP/lines.log" 2>&1
fi
while IFS= read -r l; do log "$l"; done < "$TMP/lines.log"

# ---- check and lint ---------------------------------------------------------------------------------
log ""
log "## check and lint"
CHECK_LINE=$(npm run check 2>&1 | tail -1 | tr -d '\r')
log "check: $CHECK_LINE"
npm run lint > "$TMP/lint.log" 2>&1
LINT_EXIT=$?
log "lint exit $LINT_EXIT"
if [ $LINT_EXIT -ne 0 ]; then tail -20 "$TMP/lint.log" | while IFS= read -r l; do log "  $l"; done; fi

# ---- the quick suite --------------------------------------------------------------------------------
log ""
log "## the quick suite (--maxWorkers=2, JSON reporter for the titles)"
npx vitest run --project server --maxWorkers=2 --reporter=default --reporter=json --outputFile.json="$REC.vitest.json" 2>&1 | node scripts/check-counts.mjs $QUICK_FILES $QUICK_TESTS > "$TMP/quick.log" 2>&1
QUICK_EXIT=$?
tail -3 "$TMP/quick.log" | while IFS= read -r l; do log "$l"; done
log "quick exit $QUICK_EXIT"

# ---- the build --------------------------------------------------------------------------------------
log ""
log "## the build"
npm run build > "$TMP/build.log" 2>&1
BUILD_EXIT=$?
log "build exit $BUILD_EXIT; stamp $(ls build/source-*.tar.gz 2>/dev/null | sed -E 's/.*source-([0-9a-f]+)\.tar\.gz/\1/' | cut -c1-7)"
if [ $BUILD_EXIT -ne 0 ]; then tail -20 "$TMP/build.log" | while IFS= read -r l; do log "  $l"; done; fi

# ---- the fixtures -----------------------------------------------------------------------------------
log ""
log "## the fixtures"
# shellcheck disable=SC2086
FIX_STATUS=$(git status --porcelain $FIXTURES src/lib/fidelity/*.json src/lib/transport/fixtures/*.json static/og/ src/vendor/ 2>/dev/null)
log "git status --porcelain over the fixture paths: $( [ -z "$FIX_STATUS" ] && echo "(empty)" || echo "$FIX_STATUS")"
for f in $FIXTURES; do log "hash-object $(git hash-object "$f") $f"; done
OG_N=$(ls static/og | wc -l | tr -d ' ')
OG_BYTES=$(cat static/og/*.png | wc -c | tr -d ' ')
OG_SHA=$(cat static/og/*.png | sha256sum | cut -d' ' -f1)
log "OG $OG_N files, $OG_BYTES B, sha256 $OG_SHA"

# ---- the built CSS ----------------------------------------------------------------------------------
log ""
log "## the built CSS"
CSS_N=$(ls build/_app/immutable/assets/*.css | wc -l | tr -d ' ')
log "cat build/_app/immutable/assets/*.css | sha256sum: $(cat build/_app/immutable/assets/*.css | sha256sum | cut -d' ' -f1) ($CSS_N stylesheets)"
if [ "$mode" = after ]; then
  node scripts/gate/css-terms.mjs --out "$REC.utilities.txt" --against "$BEFORE.utilities.txt" > "$TMP/css.log" 2>&1
else
  node scripts/gate/css-terms.mjs --out "$REC.utilities.txt" > "$TMP/css.log" 2>&1
fi
CSS_EXIT=$?
while IFS= read -r l; do log "$l"; done < "$TMP/css.log"
SCOPED=$(sed -nE 's/^SCOPED CSS sha256 ([0-9a-f]+).*/\1/p' "$TMP/css.log")

# ---- the normalised built JS ------------------------------------------------------------------------
log ""
log "## the normalised built JS"
# Every build/_app/immutable/**/*.js: the 40-hex commit sha -> SHA, every .<8>.js / .css / .wasm /
# .woff2 reference -> .HASH.<ext>, a bare /<8>.js chunk reference -> /HASH.js, the 13-digit version
# stamp -> VERSION, kit's per-build global `__sveltekit_<hash(version)>` -> __sveltekit_HASH (found
# by 02: it moved between two builds of the same src); hashed per file, the per-file hashes sorted
# (chunk filenames are content hashes, so filename order is not stable) and hashed together.
: > "$REC.js.txt"
find build/_app/immutable -name '*.js' | sort | while IFS= read -r f; do
  n=$(echo "$f" | sed -E 's/\.[A-Za-z0-9_-]{8}\.js$/.HASH.js/; s#/[A-Za-z0-9_-]{8}\.js$#/HASH.js#')
  h=$(sed -E 's/[0-9a-f]{40}/SHA/g; s/\.[A-Za-z0-9_-]{8}\.(js|css|wasm|woff2)/.HASH.\1/g; s#/[A-Za-z0-9_-]{8}\.js#/HASH.js#g; s/`[0-9]{13}`/`VERSION`/g; s/__sveltekit_[a-z0-9]+/__sveltekit_HASH/g' "$f" | sha256sum | cut -d' ' -f1)
  echo "$h $n" >> "$REC.js.txt"
done
JS_N=$(wc -l < "$REC.js.txt" | tr -d ' ')
NORM_JS=$(cut -d' ' -f1 "$REC.js.txt" | sort | sha256sum | cut -d' ' -f1)
log "NORMALISED JS sha256 $NORM_JS ($JS_N files)"

# ---- the titles -------------------------------------------------------------------------------------
log ""
log "## the titles"
node -e '
const j = JSON.parse(require("node:fs").readFileSync(process.argv[1], "utf8"));
const t = [];
for (const f of j.testResults) for (const a of f.assertionResults) t.push("vitest " + a.fullName);
t.sort();
process.stdout.write(t.join("\n") + "\n");
' "$REC.vitest.json" > "$REC.titles.txt"
VT_N=$(wc -l < "$REC.titles.txt" | tr -d ' ')
npx playwright test --list 2>/dev/null | grep -E '^\s+\[' | sed -E 's/^\s+//; s/:[0-9]+:[0-9]+ / /' | sed -E 's/^/playwright /' | sort >> "$REC.titles.txt"
PW_N=$(grep -c '^playwright ' "$REC.titles.txt")
TITLES=$(sha256sum "$REC.titles.txt" | cut -d' ' -f1)
log "TITLES sha256 $TITLES ($VT_N vitest titles incl. todo, $PW_N playwright runs)"

# ---- the name-status of src/ --------------------------------------------------------------------------
if [ "$mode" = after ]; then
  log ""
  log "## src/ against the before-record's HEAD $BEFORE_HEAD"
  NAME_STATUS=$(git diff --name-status "$BEFORE_HEAD"..HEAD -- src)
  log "git diff --name-status: $(echo "$NAME_STATUS" | grep -cE '^M') modified, $(echo "$NAME_STATUS" | grep -cE '^A') added, $(echo "$NAME_STATUS" | grep -cE '^D') deleted, $(echo "$NAME_STATUS" | grep -cE '^R') renamed"
  echo "$NAME_STATUS" | grep -vE '^M' | while IFS= read -r l; do [ -n "$l" ] && log "  $l"; done
  # shellcheck disable=SC2086
  REFUSED_STAT=$(git diff --stat "$BEFORE_HEAD"..HEAD -- $REFUSED_PATHS)
  log "git diff --stat over src/vendor, the manifest, Knob.svelte, ColourPicker.svelte: $( [ -z "$REFUSED_STAT" ] && echo "(empty)" || echo "$REFUSED_STAT")"
fi

rm -rf "$TMP"

# ---- the comparison ---------------------------------------------------------------------------------
if [ "$mode" = before ]; then
  log ""
  log "recorded: $REC.{txt,wire.json,wire-set.json,strings.json,lines.json,vitest.json,titles.txt,utilities.txt,js.txt}"
  exit 0
fi

log ""
log "## comparison against $against"
fail() { log "FAIL: $*"; exit 1; }
field() { sed -nE "s/^$1 ([0-9a-f]{64}).*/\1/p" "$BEFORE.txt" | head -1; }

B_WIRE_SET=$(field "WIRE SET"); B_WIRE_FULL=$(field "WIRE FULL")
if [ "$WIRE_SET" != "$B_WIRE_SET" ] || [ "$WIRE_FULL" != "$B_WIRE_FULL" ]; then
  log "wire moved: set $B_WIRE_SET -> $WIRE_SET; full $B_WIRE_FULL -> $WIRE_FULL"
  node -e '
const fs = require("node:fs");
const a = JSON.parse(fs.readFileSync(process.argv[1], "utf8")).record, b = JSON.parse(fs.readFileSync(process.argv[2], "utf8")).record;
for (const k of Object.keys(a)) if (!b[k]) console.log("- " + k); else if (a[k].sha256 !== b[k].sha256) console.log("~ " + k + " " + a[k].sha256.slice(0, 16) + " -> " + b[k].sha256.slice(0, 16));
for (const k of Object.keys(b)) if (!a[k]) console.log("+ " + k);
' "$BEFORE.wire.json" "$REC.wire.json" | while IFS= read -r l; do log "  $l"; done
  fail "the wire"
fi
log "wire: equal (set $WIRE_SET, full $WIRE_FULL)"
B_SANDBOX=$(field "WIRE SANDBOX SET")
if [ -z "$B_SANDBOX" ]; then
  log "sandbox set: not recorded on the before side ($against predates --sandbox); recorded now ($SANDBOX_SET), not compared"
elif [ "$SANDBOX_SET" != "$B_SANDBOX" ]; then
  node -e '
const fs = require("node:fs");
const a = JSON.parse(fs.readFileSync(process.argv[1], "utf8")).sandbox ?? {}, b = JSON.parse(fs.readFileSync(process.argv[2], "utf8")).sandbox ?? {};
for (const k of Object.keys(a)) if (!b[k]) console.log("- " + k); else if (a[k].sha256 !== b[k].sha256) console.log("~ " + k + " " + a[k].sha256.slice(0, 16) + " -> " + b[k].sha256.slice(0, 16));
for (const k of Object.keys(b)) if (!a[k]) console.log("+ " + k);
' "$BEFORE.wire.json" "$REC.wire.json" | while IFS= read -r l; do log "  $l"; done
  fail "the sandbox set ($B_SANDBOX -> $SANDBOX_SET)"
else
  log "sandbox set: equal ($SANDBOX_SET)"
fi

B_CENSUS=$(sed -nE 's/^literal census sha256 ([0-9a-f]+).*/\1/p' "$BEFORE.txt" | head -1)
B_COPYX=$(sed -nE 's/^copy exports +sha256 ([0-9a-f]+).*/\1/p' "$BEFORE.txt" | head -1)
B_TESTIDS=$(sed -nE 's/^data-testids +sha256 ([0-9a-f]+).*/\1/p' "$BEFORE.txt" | head -1)
[ "$CENSUS" = "$B_CENSUS" ] || fail "the literal census ($B_CENSUS -> $CENSUS; the -/+ lines above name every literal whose count moved)"
[ "$COPYX" = "$B_COPYX" ] || fail "the copy exports ($B_COPYX -> $COPYX)"
[ "$TESTIDS" = "$B_TESTIDS" ] || fail "the data-testids ($B_TESTIDS -> $TESTIDS)"
log "strings: equal (census $CENSUS, copy exports $COPYX, testids $TESTIDS)"

B_SCOPED=$(field "SCOPED CSS sha256")
[ "$SCOPED" = "$B_SCOPED" ] || fail "the SCOPED CSS ($B_SCOPED -> $SCOPED)"
[ $CSS_EXIT -eq 0 ] || fail "a markup-named utility is no longer emitted (css-terms exit $CSS_EXIT)"
log "scoped CSS: equal ($SCOPED); the utilities delta is printed above by name"

B_OG=$(sed -nE 's/^OG ([0-9]+) files, ([0-9]+) B, sha256 ([0-9a-f]+).*/\1 \2 \3/p' "$BEFORE.txt" | head -1)
[ "$OG_N $OG_BYTES $OG_SHA" = "$B_OG" ] || fail "the OG images ($B_OG -> $OG_N $OG_BYTES $OG_SHA)"
log "OG: equal ($OG_N files, $OG_BYTES B, $OG_SHA)"
for f in $FIXTURES; do
  b=$(sed -nE "s#^hash-object ([0-9a-f]+) $f\$#\1#p" "$BEFORE.txt" | head -1)
  n=$(git hash-object "$f")
  [ "$n" = "$b" ] || fail "the fixture $f ($b -> $n)"
done
log "fixtures: equal"
[ -z "$FIX_STATUS" ] || fail "the fixture paths are dirty after the build"

B_TITLES=$(field "TITLES sha256")
if [ "$TITLES" != "$B_TITLES" ]; then
  diff "$BEFORE.titles.txt" "$REC.titles.txt" | grep -E '^[<>]' | while IFS= read -r l; do log "  $l"; done
  fail "the titles ($B_TITLES -> $TITLES)"
fi
log "titles: equal ($TITLES)"

echo "$NAME_STATUS" | grep -qE '^R' && fail "a rename under src/"
echo "$NAME_STATUS" | grep -qE '^D' && fail "a deletion under src/"
ADDED=$(echo "$NAME_STATUS" | grep -E '^A' | awk '{print $2}' | grep -vx 'src/test-support/source.ts')
[ -z "$ADDED" ] || fail "an addition under src/ other than src/test-support/source.ts: $ADDED"
[ -z "$REFUSED_STAT" ] || fail "the refuse-list paths moved"
log "name-status: no R, no D, A only for src/test-support/source.ts"

# svelte-check's machine-readable last line when piped: "<stamp> COMPLETED <n> FILES 0 ERRORS 0 WARNINGS ..."
echo "$CHECK_LINE" | grep -qE " COMPLETED $check FILES 0 ERRORS 0 WARNINGS " || fail "check: expected COMPLETED $check FILES 0 ERRORS 0 WARNINGS; got: $CHECK_LINE"
log "check: $check files, 0 errors, 0 warnings"
[ $LINT_EXIT -eq 0 ] || fail "lint"
[ $QUICK_EXIT -eq 0 ] || fail "the quick suite"
[ $BUILD_EXIT -eq 0 ] || fail "the build"
log "lint, quick, build: green"

if [ $jsequal -eq 1 ]; then
  B_JS=$(field "NORMALISED JS sha256")
  if [ "$NORM_JS" != "$B_JS" ]; then
    diff <(sort "$BEFORE.js.txt") <(sort "$REC.js.txt") | grep -E '^[<>]' | while IFS= read -r l; do log "  $l"; done
    fail "the normalised JS ($B_JS -> $NORM_JS)"
  fi
  log "normalised JS: equal ($NORM_JS)"
else
  log "normalised JS: recorded ($NORM_JS), not compared (no --js-equal)"
fi

log ""
log "GATE --after $tag against $against: every compared term equal"
exit 0
