// The share URL's spec. Four tests, and two of them are held-against checks
// rather than behaviour: `url.ts` restates two literals that live elsewhere, so
// the spec is what stops the two copies drifting.
//
// This is the `src/lib/protocol-pin.ts` pattern, used three times already in
// this repository: a module a component may import statically cannot import the
// vendored tree, so it restates the constant and a spec - which may import
// anything - holds the restatement against its source.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { STAMP_PREFIX as VENDORED_STAMP_PREFIX } from "../../vendor/botor/_pad";
import { SITE_ORIGIN, STAMP_PREFIX, shareUrl } from "./url";
import { stripComments } from "../../test-support/source";

const root = (file: string) => new URL(`../../../${file}`, import.meta.url);
const text = (file: string) => readFileSync(root(file), "utf8");

describe("the share URL", () => {
  it("is the canonical trailing-slash path, with no fragment at the defaults", () => {
    // SHARE-01: a URL with no fragment IS the base configuration. And
    // trailingSlash = "always" (src/routes/+layout.ts) makes /playground/aurora/ the
    // canonical path - resolve()'s slash-less form is not what a shared link
    // should carry.
    expect(shareUrl("aurora", undefined)).toBe(
      "https://hangar.sabotond.workers.dev/playground/aurora/",
    );
    expect(shareUrl("aurora", undefined)).not.toContain("#");
    expect(shareUrl("aurora", undefined)).not.toContain("?");
    expect(text("src/routes/+layout.ts")).toContain('trailingSlash = "always"');
  });

  it("puts a stamp in the hash, exactly once, and never in the query string", () => {
    const url = shareUrl("aurora", "at7ghh1pv8j00");
    expect(url).toBe(
      "https://hangar.sabotond.workers.dev/playground/aurora/#z.at7ghh1pv8j00",
    );
    expect(url.split("#"), "exactly one fragment separator").toHaveLength(2);
    // D-12: the hash, never the query string.
    expect(url).not.toContain("?");
    expect(url.slice(url.indexOf("#") + 1)).toBe("z.at7ghh1pv8j00");
    // A Lua entry's format-x payload rides the same envelope.
    expect(shareUrl("euclid", "x5a1b2c3d")).toBe(
      "https://hangar.sabotond.workers.dev/playground/euclid/#z.x5a1b2c3d",
    );
  });

  it("agrees with the origin the deploy script publishes to", () => {
    // Read out of scripts/deploy.mjs at test time rather than restated, so a
    // deploy that moved the site turns this red instead of shipping links to
    // an origin nobody serves. No backslashes in the extraction.
    const deploy = text("scripts/deploy.mjs");
    const line = deploy
      .split("\n")
      .map((each) => each.trim())
      .find((each) => each.startsWith("const SITE = "));
    expect(line, "scripts/deploy.mjs declares a SITE constant").toEqual(
      expect.any(String),
    );
    const source = line ?? "";
    const opened = source.indexOf('"');
    const closed = source.lastIndexOf('"');
    expect(
      closed - opened,
      "the SITE constant is a non-empty double-quoted literal",
    ).toBeGreaterThan(1);
    const origin = source.slice(opened + 1, closed);
    expect(origin.startsWith("https://"), `${origin} is an https origin`).toBe(
      true,
    );
    expect(SITE_ORIGIN, "url.ts and scripts/deploy.mjs disagree").toBe(origin);
  });

  it("imports nothing, and cannot navigate", () => {
    // Zero imports is the WHOLE POINT of this module: Phase 4's chunk guard
    // (config-shape.spec.ts test 13) matches specifier TEXT, so a component may
    // name a module only if that module names nothing heavy. url.ts names
    // nothing at all.
    const source = stripComments(text("src/lib/share/url.ts"));
    expect(source, "url.ts imports something").not.toContain("import");
    expect(source, "url.ts requires something").not.toContain("require(");

    // Phase 5 never writes the URL hash (D-13, D-20). Nothing here navigates,
    // so svelte/no-navigation-without-resolve is never engaged and Safari's
    // activation window is never crossed by an await.
    for (const forbidden of [
      "replaceState",
      "pushState",
      "location",
      "history",
      "goto",
      "await",
    ]) {
      expect(source, `url.ts names ${forbidden}`).not.toContain(forbidden);
    }

    // The prefix is BOTOR's, restated here only because this module may not
    // import the vendored tree.
    expect(STAMP_PREFIX, "url.ts drifted from the vendored prefix").toBe(
      VENDORED_STAMP_PREFIX,
    );
  });
});
