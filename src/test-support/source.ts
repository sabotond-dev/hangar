// The specs' shared source readers: the repository root, a repo-relative read,
// and the one comment stripper (13.2-CONTEXT D-13; 33 specs import it).
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** The repository root, resolved from this file: src/test-support/ is two levels down. */
export const REPO_ROOT: string = fileURLToPath(
  new URL("../../", import.meta.url),
);

/** Read a repo-relative file as text. */
export function readSource(rel: string): string {
  return readFileSync(new URL(rel, new URL("../../", import.meta.url)), "utf8");
}

/**
 * Remove whole-line // comments, block comments and HTML comments before a
 * spec scans source for a needle. REMOVES, so line numbers do not hold - the
 * radius gate's line-preserving blankComments (ui/radius-allowlist.ts) is a
 * different contract and stays where it is. Twenty-four specs carried this
 * exact body since Phase 4; nine carried it without the HTML clause.
 */
export const stripComments = (source: string): string =>
  source
    .replace(/^[ ]*[/][/].*$/gm, "")
    .replace(/[/][*][^]*?[*][/]/g, "")
    .replace(/<!--[^]*?-->/g, "");
