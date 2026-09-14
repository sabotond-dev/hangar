// The Lua VM gate: a SECOND gate beside padReady() (src/lib/pad/ready.ts gates the ~628 KB Lua
// formatter; this gates the ~271 KB Lua VM, glue.wasm), so a browse-only visitor downloads neither.
// Nothing awaits this at boot; it resolves the first time a Lua-backed card needs an engine. The
// only module in HANGAR permitted to name the VM package, wasmoon: a dynamic import for the value, an
// `import type` for the types and a type-only re-export, so the lazy-chunk guard stays a one-module
// rule. The explicit glue URI: given no customWasmUri the factory falls back to a third-party CDN
// fetch for a binary that is part of the Corresponding Source this site must serve itself; Vite
// rewrites `new URL(..., import.meta.url)` into a fingerprinted asset under HANGAR's own origin
// (measured at 8-02-01: no other form emits the asset). Under Node the URI is left undefined so the
// emscripten glue resolves glue.wasm off disk.
// Decided at 08-02; see .planning/phases/08-new-configurations/08-02-SUMMARY.md
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import type { LuaEngine, LuaFactory } from "wasmoon";

// A type-only re-export, erased at build, so lua-host.ts is typed without naming the package.
export type { LuaEngine, LuaFactory };

let gate: Promise<LuaFactory> | undefined;

/** Where the VM's WebAssembly lives, or undefined to let the glue resolve it itself (correct in Node, wrong everywhere else). */
function glueWasmUri(): string | undefined {
  const isNode =
    typeof process !== "undefined" &&
    typeof process.versions?.node === "string";
  if (isNode) return undefined;
  return new URL("wasmoon/dist/glue.wasm", import.meta.url).href;
}

/** Resolves the Lua VM factory. Memoised: every caller awaits one WASM load. */
export function luaReady(): Promise<LuaFactory> {
  gate ??= (async () => {
    // Dynamic on purpose: the production-build e2e asserts a cold catalog load fetches no WebAssembly.
    const { LuaFactory: Factory } = await import("wasmoon");
    return new Factory(glueWasmUri());
  })();
  return gate;
}

/** Test-only. Drops the memo so a spec can observe a cold load. Never call this from app code. */
export function resetLuaReadyForTests(): void {
  gate = undefined;
}
