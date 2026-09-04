#!/usr/bin/env node
/**
 * Compare a Vitest or Playwright summary read from stdin against an expected
 * file count and test count.
 *
 * Usage:
 *   npm run test:quick 2>&1 | node scripts/check-counts.mjs <files> <tests>
 *   npm run test:sweep  2>&1 | node scripts/check-counts.mjs 1 9
 *   npm run test:e2e    2>&1 | node scripts/check-counts.mjs --playwright <tests>
 *
 * Why it exists (D-17): no plan in this repository may carry a literal suite
 * total. Phases interleave in one tree - Phase 4 depends only on plan 08-01 and
 * lands specs while Phase 8 runs - so every count assertion is an observed
 * baseline plus a stated delta. The arithmetic and the parsing belong in one
 * reviewed place rather than in a fragile extended regular expression pasted
 * into eight plans.
 *
 * The todo count is reported and never asserted. A todo opening or closing
 * elsewhere in the tree is not any one phase's business.
 *
 * Every regular expression below uses [0-9] rather than the shorthand class,
 * and the whole file is free of backslashes, so any line of it can be quoted
 * into a plan or a SUMMARY without a shell transport halving an escape.
 *
 * Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
 */

const NEWLINE = String.fromCharCode(10);
const ESC = String.fromCharCode(27);

// Vitest prints "Test Files  26 passed (26)" and
// "Tests  453 passed | 1 todo (454)". Playwright prints "  10 passed (21.9s)".
const FILES_PASSED = /Test Files[ ]+([0-9]+) passed/;
const FILES_FAILED = /Test Files[ ]+([0-9]+) failed/;
const TESTS_PASSED = /Tests[ ]+([0-9]+) passed/;
const TESTS_FAILED = /Tests[ ]+([0-9]+) failed/;
const TESTS_TODO = /([0-9]+) todo/;
const RUNNER_PASSED = /^[ ]*([0-9]+) passed/;
const RUNNER_FAILED = /^[ ]*([0-9]+) failed/;

function die(message) {
  console.error("check-counts: " + message);
  process.exit(1);
}

/**
 * Remove CSI colour sequences without a regular expression, so the file stays
 * free of escapes. Vitest emits none when its stdout is a pipe, but a CI shim
 * or a --color flag would otherwise make every match silently miss.
 */
function stripAnsi(text) {
  let out = "";
  let i = 0;
  while (i < text.length) {
    if (text[i] === ESC) {
      i += 1;
      if (text[i] === "[") {
        i += 1;
        while (i < text.length && "0123456789;".includes(text[i])) i += 1;
        i += 1;
      }
      continue;
    }
    out += text[i];
    i += 1;
  }
  return out;
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

function firstNumber(lines, pattern) {
  for (const line of lines) {
    const match = pattern.exec(line);
    if (match) return Number.parseInt(match[1], 10);
  }
  return null;
}

function lastNumber(lines, pattern) {
  let found = null;
  for (const line of lines) {
    const match = pattern.exec(line);
    if (match) found = Number.parseInt(match[1], 10);
  }
  return found;
}

const argv = process.argv.slice(2);
const playwright = argv[0] === "--playwright";
const rest = playwright ? argv.slice(1) : argv;
const wanted = playwright ? 1 : 2;

if (rest.length !== wanted) {
  die(
    "usage: check-counts.mjs <expectedFiles> <expectedTests>" +
      "  |  check-counts.mjs --playwright <expectedTests>",
  );
}

const expected = rest.map((value) => Number.parseInt(value, 10));
if (expected.some((n) => !Number.isInteger(n) || n < 0)) {
  die("expected counts must be non-negative integers, got: " + rest.join(" "));
}

const lines = stripAnsi(await readStdin())
  .split(NEWLINE)
  .map((line) => line.trimEnd());

const problems = [];

if (playwright) {
  const [expectedTests] = expected;
  const failed = lastNumber(lines, RUNNER_FAILED);
  const passed = lastNumber(lines, RUNNER_PASSED);

  if (passed === null && failed === null) {
    die(
      "no Playwright summary line found on stdin. A run that printed no " +
        "summary proves nothing, so this is a failure, not a pass.",
    );
  }

  console.log(
    "check-counts: observed " +
      (passed === null ? 0 : passed) +
      " tests passed" +
      (failed ? ", " + failed + " failed" : ""),
  );

  if (failed) problems.push(failed + " test(s) failed");
  if (passed !== expectedTests) {
    problems.push("tests: observed " + passed + ", expected " + expectedTests);
  }
} else {
  const [expectedFiles, expectedTests] = expected;
  const filesFailed = firstNumber(lines, FILES_FAILED);
  const testsFailed = firstNumber(lines, TESTS_FAILED);
  const files = firstNumber(lines, FILES_PASSED);
  const tests = firstNumber(lines, TESTS_PASSED);
  const todo = firstNumber(lines, TESTS_TODO);

  if (files === null && tests === null) {
    die(
      "no Vitest summary lines found on stdin. A run that printed no " +
        "summary proves nothing, so this is a failure, not a pass.",
    );
  }

  console.log(
    "check-counts: observed " +
      files +
      " files, " +
      tests +
      " tests passed, " +
      (todo === null ? 0 : todo) +
      " todo (todo is reported, never asserted)" +
      (filesFailed || testsFailed
        ? " - " + testsFailed + " test(s) failed in " + filesFailed + " file(s)"
        : ""),
  );

  if (filesFailed || testsFailed) {
    problems.push(
      testsFailed + " test(s) failed in " + filesFailed + " file(s)",
    );
  }
  if (files !== expectedFiles) {
    problems.push("files: observed " + files + ", expected " + expectedFiles);
  }
  if (tests !== expectedTests) {
    problems.push("tests: observed " + tests + ", expected " + expectedTests);
  }
}

if (problems.length > 0) die(problems.join("; "));

console.log("check-counts: matches the expected counts");
