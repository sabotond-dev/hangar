// The one record that is the way back.
//
// Four tests, one per behaviour: a round trip, every malformed shape degrading
// to undefined without throwing, the clear, and the no-store case that makes the
// module safe on a prerendered page.
//
// There is no jsdom in this repository and there is no browser Vitest project
// (04-RESEARCH Pitfall 6), so the store is a three-method object over a Map -
// the same injection HostDeps uses in src/lib/sim/host.ts, and for the same
// reason: it is the only thing that makes the module testable at all.
//
// Test 2 carries the mutation on the record: make readBrowseReturn trust
// JSON.parse's result without checking the shape, and a record with no scrollY
// reaches the caller. That is the failure worth a test - a broken record must
// degrade to "no way back offered", never to a crash or to a scroll restore
// against undefined, on a page whose job is to paint.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  BROWSE_RETURN_KEY,
  clearBrowseReturn,
  readBrowseReturn,
  writeBrowseReturn,
  type ReturnStore,
} from "./return";
import { stripComments } from "../../test-support/source";

const SOURCE_PATH = fileURLToPath(new URL("./return.ts", import.meta.url));

/** Everything a Storage is, for this module's purposes, over a Map. */
function fakeStore() {
  const map = new Map<string, string>();
  const store: ReturnStore = {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
  };
  return { map, store };
}

/**
 * Safari in private mode, and a storage over quota: every method throws. The
 * module must survive it, because a visitor whose browser refuses storage is
 * still owed a page that paints.
 */
const HOSTILE_STORE: ReturnStore = {
  getItem: () => {
    throw new DOMException("The operation is insecure.", "SecurityError");
  },
  setItem: () => {
    throw new DOMException(
      "The quota has been exceeded.",
      "QuotaExceededError",
    );
  },
  removeItem: () => {
    throw new DOMException("The operation is insecure.", "SecurityError");
  },
};

describe("the browse return record (src/lib/browse/return.ts)", () => {
  it("writes a record that reads back identical", () => {
    const { map, store } = fakeStore();
    // The sample address moved in 10-07 and NOTHING ELSE IN THIS FILE DID.
    // return.ts never parses the href - it stores a string and hands it back -
    // so the old value was harmless and it was also unproducible: D-11 retired
    // ?sort=newest and A-20 retired the written ?tag=. A round trip proved
    // against an address the serialiser can no longer emit is weaker evidence
    // than one proved against an address it does.
    const record = { href: "/playground/?sort=name&for=drums", scrollY: 1847 };

    expect(readBrowseReturn(store), "nothing was recorded yet").toBeUndefined();

    writeBrowseReturn(store, record);

    expect(map.size, "exactly one key was written").toBe(1);
    expect([...map.keys()], "the record is not under the agreed key").toEqual([
      BROWSE_RETURN_KEY,
    ]);
    expect(BROWSE_RETURN_KEY, "the key is the one the UI spec names").toBe(
      "hangar:browse-return",
    );
    expect(
      readBrowseReturn(store),
      "the record did not survive the round trip",
    ).toEqual(record);

    // A plain scroll offset of zero is a real recorded position - the visitor
    // was at the top - and must not read as "nothing recorded".
    writeBrowseReturn(store, { href: "/playground/", scrollY: 0 });
    expect(
      readBrowseReturn(store),
      "a scroll offset of zero read as no record at all",
    ).toEqual({ href: "/playground/", scrollY: 0 });
    expect(map.size, "the second write replaced the first").toBe(1);

    // The href carries its whole query string, encoding included: this is what
    // makes sort, query and every active chip come back (D-08). The sample
    // names two facet terms under the two parameters the toolbar writes since
    // A-20; it used to name `gestural` and `generative` under one `tag`, and
    // D-10 retired the first of those words entirely.
    const encoded = {
      href: "/playground/?q=caf%C3%A9+noir&for=drums&feels=generative",
      scrollY: 12.5,
    };
    writeBrowseReturn(store, encoded);
    expect(
      readBrowseReturn(store),
      "an encoded href or a fractional offset was mangled",
    ).toEqual(encoded);
  });

  it("degrades to undefined on anything malformed, and never throws", () => {
    const { store } = fakeStore();

    const broken: readonly { readonly what: string; readonly raw: string }[] = [
      { what: "not JSON at all", raw: "not json" },
      { what: "a truncated object", raw: '{"href":"/playground/",' },
      { what: "JSON null", raw: "null" },
      { what: "a JSON string", raw: '"/playground/"' },
      { what: "a JSON number", raw: "1847" },
      { what: "an array", raw: '["/playground/",1847]' },
      { what: "no scrollY at all", raw: '{"href":"/playground/"}' },
      { what: "no href at all", raw: '{"scrollY":1847}' },
      { what: "a numeric href", raw: '{"href":7,"scrollY":1847}' },
      { what: "an empty href", raw: '{"href":"","scrollY":1847}' },
      {
        what: "a scrollY as text",
        raw: '{"href":"/playground/","scrollY":"1847"}',
      },
      { what: "a null scrollY", raw: '{"href":"/playground/","scrollY":null}' },
      {
        what: "a non-finite scrollY",
        raw: '{"href":"/playground/","scrollY":1e999}',
      },
    ];

    for (const { what, raw } of broken) {
      store.setItem(BROWSE_RETURN_KEY, raw);
      let got: ReturnType<typeof readBrowseReturn>;
      expect(() => {
        got = readBrowseReturn(store);
      }, `${what}: a broken record threw instead of degrading`).not.toThrow();
      expect(
        got,
        `${what}: a broken record reached the caller`,
      ).toBeUndefined();
    }

    // An absent key is the ordinary case, not a malformed one, and is the same
    // answer: no way back is offered.
    clearBrowseReturn(store);
    expect(readBrowseReturn(store), "an absent key is not undefined").toBe(
      undefined,
    );

    // A NaN written through the typed API round-trips as JSON null and is
    // rejected on the way back out, so the bad value can never reach a scroll.
    writeBrowseReturn(store, { href: "/playground/", scrollY: Number.NaN });
    expect(
      readBrowseReturn(store),
      "a NaN offset came back as a record",
    ).toBeUndefined();

    // A store that throws on every call is a real browser state (Safari private
    // mode, a storage over quota). None of the three may propagate it.
    expect(
      () =>
        writeBrowseReturn(HOSTILE_STORE, { href: "/playground/", scrollY: 1 }),
      "a refusing store threw out of writeBrowseReturn",
    ).not.toThrow();
    expect(
      () => clearBrowseReturn(HOSTILE_STORE),
      "a refusing store threw out of clearBrowseReturn",
    ).not.toThrow();
    expect(
      () => readBrowseReturn(HOSTILE_STORE),
      "a refusing store threw out of readBrowseReturn",
    ).not.toThrow();
    expect(
      readBrowseReturn(HOSTILE_STORE),
      "a refusing store produced a record",
    ).toBeUndefined();
  });

  it("clears the record, and a read after a clear offers no way back", () => {
    const { map, store } = fakeStore();
    map.set("hangar:something-else", "left alone");
    writeBrowseReturn(store, { href: "/playground/?sort=name", scrollY: 640 });
    expect(readBrowseReturn(store), "the record was written").toBeDefined();

    clearBrowseReturn(store);

    expect(map.has(BROWSE_RETURN_KEY), "the key was not removed").toBe(false);
    expect(
      readBrowseReturn(store),
      "a read after a clear still offered a way back",
    ).toBeUndefined();
    expect(
      map.get("hangar:something-else"),
      "the clear took a key that was not its own",
    ).toBe("left alone");

    // Clearing twice, and clearing what was never written, are both no-ops:
    // the detail page clears on the way out whether or not it ever arrived
    // from browse.
    expect(() => {
      clearBrowseReturn(store);
      clearBrowseReturn(store);
    }, "clearing an absent record threw").not.toThrow();
    expect(map.size, "the unrelated key survived every clear").toBe(1);
  });

  it("is a no-op with no store at all, and never names sessionStorage in code", () => {
    // The page is prerendered. On the server there is no storage of any kind,
    // and the module is imported by a component that renders there.
    expect(
      readBrowseReturn(undefined),
      "no store must read as no record",
    ).toBeUndefined();
    expect(
      () => writeBrowseReturn(undefined, { href: "/playground/", scrollY: 42 }),
      "writing with no store threw during prerender",
    ).not.toThrow();
    expect(
      () => clearBrowseReturn(undefined),
      "clearing with no store threw during prerender",
    ).not.toThrow();

    // The other half of the same rule: the module takes a Storage-shaped
    // argument and never reaches for the global. That is what makes the three
    // assertions above true by construction rather than by a guard somebody can
    // delete, and it is why this file needs no jsdom.
    const source = readFileSync(SOURCE_PATH, "utf8");
    const stripped = stripComments(source);

    expect(
      source.length,
      "the scan read a real module, not an empty file",
    ).toBeGreaterThan(1000);
    expect(
      stripped,
      "the stripper ate the code as well as the comments",
    ).toContain("export function writeBrowseReturn");
    expect(
      source,
      "return.ts must name sessionStorage in a comment, or the scan is vacuous",
    ).toContain("sessionStorage");

    for (const name of [
      "sessionStorage",
      "localStorage",
      "window",
      "document",
    ]) {
      expect(stripped, `return.ts names ${name} in CODE`).not.toContain(name);
    }

    const specifiers = [...stripped.matchAll(/from[ ]+["']([^"']+)["']/g)].map(
      (match) => match[1],
    );
    expect(specifiers, "return.ts imports nothing at all").toEqual([]);
  });
});
