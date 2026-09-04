// The Lua VM gate.
//
// This is a SECOND gate, deliberately separate from padReady() in
// src/lib/pad/ready.ts. That one gates the ~628 KB Lua *formatter*
// (lua_fmt_bg.wasm), which HANGAR needs to measure and validate a config.
// This one gates the ~271 KB Lua *VM* (glue.wasm), which HANGAR needs to RUN
// one. A browse-only visitor should download neither, and fusing the two would
// make either one imply the other.
//
// Nothing awaits this at boot. It resolves the first time a Lua-backed card
// actually needs an engine.
//
// This is the only module in HANGAR permitted to name the VM package: a dynamic
// import for the value, an `import type` for the types, and a type-only
// re-export so every other module (lua-host.ts included) is typed without
// naming it. That keeps the lazy-chunk guard a one-module rule rather than a
// rule with exemptions.
//
// Why the explicit glue URI. wasmoon's LuaFactory, given no customWasmUri,
// detects a browser and falls back to
// `https://unpkg.com/wasmoon@<version>/dist/glue.wasm` - a third-party CDN
// fetch on every visitor, for a binary that is part of the Corresponding Source
// this site is obliged to serve itself. Measured branch (task 8-02-01): neither
// a bare dynamic import nor an optimizeDeps.exclude entry emits the asset, so
// the plan's branch (c) is not a fallback here, it is the only correct form.
// Vite rewrites `new URL(..., import.meta.url)` into a fingerprinted asset the
// same way it already does for lua_fmt_bg.wasm, so glue.<hash>.wasm lands in
// build/_app/immutable/assets/ and is served from HANGAR's own origin.
//
// Under Node (Vitest, prerender, build-time frame rendering) the URI is left
// undefined on purpose: wasmoon's emscripten glue then resolves glue.wasm off
// the filesystem next to its own dist/index.js, which is both correct and
// faster than any URL HANGAR could hand it.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import type { LuaEngine, LuaFactory } from "wasmoon";

// A TYPE-ONLY re-export. It is erased at build time and creates no runtime
// edge, so lua-host.ts can be typed without naming the package.
export type { LuaEngine, LuaFactory };

let gate: Promise<LuaFactory> | undefined;

/**
 * Where the VM's WebAssembly lives, or undefined to let wasmoon resolve it
 * itself. Undefined is correct in Node and wrong everywhere else - see the
 * module comment on the unpkg fallback.
 */
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
    // Dynamic on purpose. A static import would put the VM in whatever chunk
    // imports this module, and the production-build e2e asserts that a cold
    // catalog load fetches no WebAssembly at all.
    const { LuaFactory: Factory } = await import("wasmoon");
    return new Factory(glueWasmUri());
  })();
  return gate;
}

/** Test-only. Drops the memo so a spec can observe a cold load. Never call this from app code. */
export function resetLuaReadyForTests(): void {
  gate = undefined;
}
