// THE UTILITY BUTTON ALWAYS CHANGES PAGE (change 22, BENCH-2026-09-16.txt section 22). The
// firmware's default for the system element's utility event (255/4) is `--[[@cb]]gpl(gpn())`
// (grid-fw `grid_ui_system.h:38`): a press of the button goes to the next page. Until change 22
// every Sandbox store replaced it with the runtime, and the button stopped changing pages. The
// rule, the user's word: never remove that function. This spec runs EVERY string HANGAR can write
// to 255/4 in a real Lua VM (wasmoon, Lua 5.4 as on the module), inside the firmware's own
// registration wrapper (`grid_ui.c:374`, `ele[n].map = function (self) ... end`), and fires it
// twice: as a real PRESS fires it (`events.lua:13-16`, `eve(element)` - `self` the system
// element), where `gpl(gpn())` must run exactly once and nothing else - no call, no global
// defined or replaced, no error; and as the touch Setup's PULL-IN calls it (the emitted Setup's own
// `ele[#ele].map()`, no `self`), where the parts 255/4 carries must be defined and the page must not
// change. The sources: every Sandbox gate fixture (scripts/gate/sandbox-fixtures.mjs) landed at two,
// three and five slots and at the picker corner; every catalog card's tuner at its defaults and at
// its corner, through the store's substitution; Clear's and every Store's defaults leg; the Grid
// Editor profile file for a surface and for a card; the /dev/install/ probe's starting string; and
// since change 23 the two writers of a stored copy - the probe's put-back and the walking skeleton's
// write-back - over every 255/4 a Sandbox store wrote before change 22 (BENCH-2026-09-16.txt section 24).
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync } from "node:fs";
import { GridScript } from "@intechstudio/grid-protocol";
import { beforeAll, describe, expect, it } from "vitest";
import { CATALOG } from "$lib/catalog";
import { padReady } from "$lib/pad/ready";
import {
  ELEMENT_SYSTEM,
  EVENT_UTILITY,
  type GridRequest,
  PRE_GUARD_UTILITY_HEAD,
  SYSTEM_DEFAULT_SETUP,
  SYSTEM_DEFAULT_TIMER,
  SYSTEM_DEFAULT_UTILITY,
  defaultFor,
  systemSlotString,
} from "$lib/protocol";
import { atPickerCorner, canonical } from "$lib/sandbox/cost";
import { PULL_IN_MAPMODE, emitSurface } from "$lib/sandbox/emit";
import { landSurface } from "$lib/sandbox/land";
import type { Surface } from "$lib/sandbox/model";
import {
  MARKER,
  PAGE_NEXT,
  STATE,
  UTILITY_DEFAULT,
  UTILITY_GUARD,
} from "$lib/sandbox/runtime";
import type { RequestQueue } from "$lib/transport/queue";
import { type Identity, writeBack } from "$lib/transport/sequence";
import { buildProfile } from "$lib/share/profile";
import { stampKnobs } from "$lib/share/stamp";
import type { SimEngine } from "$lib/sim/engine";
import { luaReady } from "$lib/sim/ready";
import { buildTuner } from "$lib/tune/model";
import type { ConfigStrings } from "./install.svelte";

/**
 * The gate's Sandbox fixtures, read at run time through a URL: a static import would put the plain
 * .mjs under svelte-check's strict `checkJs`, which it was never written for.
 */
let FIXTURES: Record<string, Surface> = {};

/** What the stub `gpn` answers: the page after the active one. */
const NEXT_PAGE = 3;

/**
 * The module as a 255/4 body meets it: the page calls recorded (`gpn` answering NEXT_PAGE), every
 * other firmware call the library or the runtime makes recorded by name (`gms` the MIDI send, the
 * LED writes, the timer), EFN as the firmware keeps it, the touch element 0 and the system element
 * last, and the body registered in `grid_ui.c:374`'s wrapper - `__body` is set from JS, so nothing
 * is escaped. After the prelude every read of an undefined global is recorded too.
 */
const PRELUDE = [
  "__log={}",
  'EFN="init"',
  `gpn=function()__log[#__log+1]="gpn" return ${NEXT_PAGE} end`,
  'gpl=function(p)__log[#__log+1]="gpl "..tostring(p)end',
  'for _,n in ipairs({"gms","glc","glp","glag","glim","glpfs","glt","gtt","grxm","print"})do ' +
    "_G[n]=function()__log[#__log+1]=n end end",
  "ele={[0]={}}ele[1]={}",
  'ele[1].map=load("return function (self) local _efn = EFN; EFN = \\"map\\"; "..__body.." EFN = _efn end")()',
  'setmetatable(_G,{__index=function(_,k)__log[#__log+1]="read "..k end})',
].join(" ");

/** The harness's own names, never compared. */
const HARNESS = "__H={__H=1,__before=1,__log=1,__err=1}";

/** The globals, by identity: a table name -> value, compared after. */
const SNAPSHOT =
  HARNESS +
  " __before={}for k,v in pairs(_G)do if not __H[k] then __before[k]=v end end";

/** The names whose value is not the snapshot's (added, replaced or removed), sorted. */
const CHANGED =
  "local out={}for k,v in pairs(_G)do if not __H[k] and __before[k]~=v then out[#out+1]=k end end " +
  "for k in pairs(__before)do if rawget(_G,k)==nil then out[#out+1]=k end end table.sort(out)return table.concat(out,',')";

/** A real press, as `events.lua` makes it: the event looked up on the element and called with it. */
const PRESS =
  "local element=ele[#ele]local eve=element.map local ok,err=true,nil " +
  "if eve then ok,err=pcall(eve,element)end __err=ok and '' or tostring(err)";

type Run = {
  /** Every recorded call and undefined read, in order. */
  readonly log: string[];
  /** The globals the run added, replaced or removed. */
  readonly changed: string[];
  /** The error the run raised, or "". */
  readonly error: string;
};

async function engineWith(body: string) {
  const factory = await luaReady();
  const lua = await factory.createEngine();
  lua.global.set("__body", body);
  lua.doStringSync(PRELUDE);
  return lua;
}

function read(lua: Awaited<ReturnType<typeof engineWith>>): Run {
  const log = String(lua.doStringSync("return table.concat(__log,'|')"));
  const changed = String(lua.doStringSync(CHANGED));
  const error = String(lua.doStringSync("return __err or ''"));
  return {
    log: log === "" ? [] : log.split("|"),
    changed: changed === "" ? [] : changed.split(","),
    error,
  };
}

/** The body pressed on a module that has not run the Setup since. */
async function press(body: string): Promise<Run> {
  const lua = await engineWith(body);
  try {
    lua.doStringSync(SNAPSHOT + " __log={}");
    lua.doStringSync(PRESS);
    return read(lua);
  } finally {
    lua.global.close();
  }
}

/**
 * The Setup's pull-in, then a press on the module it left: the pull-in's own run (its log, the
 * names it defined, whether each part named is there), and the press after it - which must find
 * every definition where the pull-in left it (a second `O` would fail `Y`'s `s.touch_cb~=O`).
 */
async function pullInThenPress(
  body: string,
  names: readonly string[],
): Promise<{
  pullIn: Run;
  defined: Record<string, boolean>;
  press: Run;
}> {
  const lua = await engineWith(body);
  try {
    lua.doStringSync(SNAPSHOT + " __log={}");
    lua.doStringSync(
      `local ok,err=pcall(function()${PULL_IN_MAPMODE} end)__err=ok and '' or tostring(err)`,
    );
    const pullIn = read(lua);
    const defined: Record<string, boolean> = {};
    for (const name of names) {
      defined[name] = lua.doStringSync(
        `local ok,v=pcall(function()return ${name}~=nil end)return ok and v`,
      ) as boolean;
    }
    lua.doStringSync("__err=nil " + SNAPSHOT + " __log={}");
    lua.doStringSync(PRESS);
    return { pullIn, defined, press: read(lua) };
  } finally {
    lua.global.close();
  }
}

/** The one outcome a press may have. */
function expectPageSwitch(run: Run, what: string): void {
  expect(run.error, `${what}: the press raised`).toBe("");
  expect(run.log, `${what}: the press ran gpl(gpn()) and nothing else`).toEqual(
    ["gpn", `gpl ${NEXT_PAGE}`],
  );
  expect(
    run.changed,
    `${what}: the press defined or replaced a global`,
  ).toEqual([]);
}

/** Every string pressed, by source - the coverage the report states. */
const covered: Record<string, number> = {};
const distinct = new Set<string>();
async function expectPressTurnsPage(
  source: string,
  body: string,
  what: string,
): Promise<void> {
  covered[source] = (covered[source] ?? 0) + 1;
  distinct.add(body);
  expect(body.startsWith(MARKER), `${what}: the marker kept`).toBe(true);
  expectPageSwitch(await press(body), what);
}

beforeAll(async () => {
  await padReady();
  const url = new URL(
    "../../../scripts/gate/sandbox-fixtures.mjs",
    import.meta.url,
  ).href;
  const loaded = (await import(/* @vite-ignore */ url)) as {
    SANDBOX_FIXTURES: Record<string, Surface>;
  };
  FIXTURES = loaded.SANDBOX_FIXTURES;
});

describe("the utility button always changes page (change 22, BENCH-2026-09-16.txt section 22)", () => {
  it("1. the page switch is the firmware's own: MARKER + PAGE_NEXT is the pinned package's 255/4 default, a fixed point of the minifier, and a press of it runs gpl(gpn()) once", async () => {
    expect(UTILITY_DEFAULT).toBe(MARKER + PAGE_NEXT);
    expect(UTILITY_DEFAULT).toBe(SYSTEM_DEFAULT_UTILITY);
    expect(UTILITY_DEFAULT).toBe(defaultFor(ELEMENT_SYSTEM, EVENT_UTILITY));
    expect(GridScript.compressScript(UTILITY_DEFAULT)).toBe(UTILITY_DEFAULT);
    expect(UTILITY_GUARD).toBe("if self then");
    await expectPressTurnsPage(
      "the firmware default",
      UTILITY_DEFAULT,
      "the default",
    );
    // A NEGATIVE CHECK: the bug, as it shipped - 255/4 the runtime with no guard. A press of it
    // runs the definitions and never the page switch; this harness says so by name.
    const guarded = emitSurface(FIXTURES["emit/page3"], { slots: 5 })
      .mapmode as string;
    const head = `${MARKER}${UTILITY_GUARD} ${PAGE_NEXT}else `;
    expect(guarded.startsWith(head)).toBe(true);
    const bug = await press(
      MARKER + guarded.slice(head.length).replace(/ ?end$/, ""),
    );
    expect(bug.log, "a guard-less body never turns the page").not.toContain(
      `gpl ${NEXT_PAGE}`,
    );
    expect(
      bug.changed.length,
      "and it defines the runtime again",
    ).toBeGreaterThan(0);
  });

  it("2. every Sandbox gate fixture landed at two, three and five slots and at the picker corner: 255/4 is the page switch behind the guard or the firmware's default verbatim; a press runs gpl(gpn()) once and nothing else, before the Setup ran and after; the Setup pulls 255/4 in exactly when it carries parts, and its pull-in defines them and changes no page", async () => {
    const names = Object.keys(FIXTURES);
    expect(names.length, "the gate's Sandbox fixtures").toBe(62);
    let guarded = 0;
    let bare = 0;
    for (const name of names) {
      const fixture = FIXTURES[name];
      const landings = [
        { label: "2 slots", surface: fixture, slots: 2 as const },
        { label: "3 slots", surface: fixture, slots: 3 as const },
        { label: "5 slots", surface: fixture, slots: 5 as const },
        {
          label: "the corner",
          surface: atPickerCorner(fixture),
          slots: 5 as const,
        },
      ];
      for (const { label, surface, slots } of landings) {
        const what = `${name} at ${label}`;
        const landed = await landSurface(surface, { slots });
        // What the store writes: the landing's own string through the one substitution rule.
        const body = systemSlotString(landed.config, 4);
        expect(body, `${what}: the landing is written verbatim`).toBe(
          landed.config.systemUtility,
        );
        expect((await canonical(body)).rounds, `${what}: canonical`).toBe(0);
        await expectPressTurnsPage("Sandbox", body, what);
        const setup = landed.config.setup;
        if (body === UTILITY_DEFAULT) {
          bare += 1;
          expect(setup, `${what}: no pull-in of the page switch`).not.toContain(
            "map()",
          );
          continue;
        }
        guarded += 1;
        expect(
          body.startsWith(`${MARKER}${UTILITY_GUARD} ${PAGE_NEXT}else `),
          `${what}: the page switch first, behind the guard`,
        ).toBe(true);
        expect(body.endsWith("end"), what).toBe(true);
        expect(
          setup.split(PULL_IN_MAPMODE).length - 1,
          `${what}: the Setup pulls 255/4 in once`,
        ).toBe(1);
        expect(setup, `${what}: never the method call`).not.toContain(
          "ele[#ele]:map()",
        );
        const parts = emitSurface(surface, { slots })
          .runtime.placement.filter((p) => p.slot === "mapmode")
          .map((p) => p.name);
        expect(parts.length, `${what}: parts in 255/4`).toBeGreaterThan(0);
        const run = await pullInThenPress(body, parts);
        expect(run.pullIn.error, `${what}: the pull-in raised`).toBe("");
        expect(
          run.pullIn.log.filter((l) => l.startsWith("gp")),
          `${what}: the pull-in changed no page`,
        ).toEqual([]);
        for (const part of parts) {
          expect(
            run.defined[part],
            `${what}: the pull-in defined ${part}`,
          ).toBe(true);
        }
        expectPageSwitch(run.press, `${what}, pressed after the pull-in`);
      }
    }
    console.log(
      `the Sandbox: ${names.length} fixtures x 4 landings = ${names.length * 4} strings, ${guarded} the guarded runtime, ${bare} the firmware default`,
    );
    expect(guarded + bare).toBe(names.length * 4);
  }, 600_000);

  it("3. every catalog card at its defaults and at its corner: the card publishes no 255/4 of its own, and what the store writes there - the firmware's page-next - turns the page", async () => {
    const cards: string[] = [];
    for (const entry of CATALOG) {
      const corner: Record<string, number> = {};
      for (const knob of stampKnobs(entry))
        corner[knob.id] = knob.options.length - 1;
      for (const [label, indices] of [
        ["defaults", undefined],
        ["the corner", corner],
      ] as const) {
        const what = `${entry.id} at ${label}`;
        const config = await firstLanding(entry.id, indices);
        expect(config.systemUtility, `${what}: none of its own`).toBe("");
        const body = systemSlotString(config, 4);
        expect(body, what).toBe(SYSTEM_DEFAULT_UTILITY);
        await expectPressTurnsPage("catalog", body, what);
        cards.push(what);
      }
    }
    expect(cards.length).toBe(CATALOG.length * 2);
    console.log(
      `the catalog: ${CATALOG.length} cards x 2 = ${cards.length} strings, every one the firmware's page-next`,
    );
  }, 600_000);

  it("4. Clear's defaults leg and the defaults leg of every Store write the firmware's page-next to 255/4, and it turns the page", async () => {
    // install.spec.ts pins the wire (the CLEAR test: "255/4 is the 19-character page-next"); here
    // the source names the one string at all three places the store writes a default into 255/4 -
    // a snapshot from before 13-17, Clear, and the defaults leg of Store on ZONA.
    const store = readFileSync(
      new URL("./install.svelte.ts", import.meta.url),
      "utf8",
    );
    expect(
      store.match(/systemUtility: protocolLib\.SYSTEM_DEFAULT_UTILITY,/g)
        ?.length,
    ).toBe(3);
    await expectPressTurnsPage(
      "Clear and the Store's defaults",
      SYSTEM_DEFAULT_UTILITY,
      "Clear",
    );
  });

  it("5. the Grid Editor profile file, for a Sandbox surface and for a catalog card, and the install probe's starting string: 255/4 turns the page", async () => {
    const utilityOf = (strings: ConfigStrings): string => {
      const profile = buildProfile({
        id: "00000000-0000-4000-8000-000000000000",
        name: "Utility",
        description: "",
        strings,
        at: "2026-09-27T00:00:00.000Z",
      });
      const system = profile.configs.find(
        (c) => c.controlElementNumber === ELEMENT_SYSTEM,
      );
      const event = system?.events.find((e) => e.event === EVENT_UTILITY);
      return event?.config as string;
    };
    const surface = await landSurface(FIXTURES["emit/page3"]);
    const fromSurface = utilityOf(surface.config);
    expect(fromSurface).toBe(surface.config.systemUtility);
    await expectPressTurnsPage("profile", fromSurface, "a surface's profile");
    const card = await firstLanding("aurora", undefined);
    const fromCard = utilityOf(card);
    expect(fromCard, "a card's profile carries the page-next").toBe(
      SYSTEM_DEFAULT_UTILITY,
    );
    await expectPressTurnsPage("profile", fromCard, "a card's profile");
    const probe = readFileSync(
      new URL("../../routes/dev/install/+page.svelte", import.meta.url),
      "utf8",
    );
    const start = /let systemUtility = \$state\("(.*)"\);/.exec(probe)?.[1];
    expect(start).toBeDefined();
    await expectPressTurnsPage(
      "the install probe",
      start as string,
      "the probe's starting string",
    );
    console.log(
      `every string pressed, by source: ${Object.entries(covered)
        .map(([k, v]) => `${k} ${v}`)
        .join(
          ", ",
        )}; ${Object.values(covered).reduce((a, b) => a + b, 0)} in all, ${distinct.size} distinct`,
    );
  }, 120_000);

  it("6. every write of a stored copy - the probe's put-back and the walking skeleton's write-back - goes through systemSlotString: a module's own 255/4 from a Sandbox store made before change 22 is written as the page switch, and a press of what is written turns the page (change 23)", async () => {
    // BENCH-2026-09-16.txt section 24, change 22's third question, decided: a restore must not bring
    // the broken button back. The strings a module can hold from before change 22: every gate fixture
    // at three and five slots as the runtime wrote it then - the guard taken off, the branch table's
    // head at the front (`f10b49c`'s diff: `joinLua([MARKER, STATE, ...parts])`) - and the head alone.
    const head = `${MARKER}${UTILITY_GUARD} ${PAGE_NEXT}else `;
    const preGuard = new Set<string>([PRE_GUARD_UTILITY_HEAD]);
    for (const name of Object.keys(FIXTURES)) {
      for (const slots of [3, 5] as const) {
        const body = emitSurface(FIXTURES[name], { slots }).mapmode as string;
        if (!body.startsWith(head)) continue;
        const parts = body
          .slice(head.length)
          .replace(/ ?end$/, "")
          .replace(/^I=I or\{\}/, "");
        preGuard.add(`${PRE_GUARD_UTILITY_HEAD}${parts}`);
      }
    }
    expect(preGuard.size, "the pre-change-22 strings").toBeGreaterThan(10);
    expect(PRE_GUARD_UTILITY_HEAD).toBe(`${MARKER}${STATE}`);
    // The negative check, as test 1 has it: pressed as written, not one turns the page.
    for (const old of [...preGuard].slice(0, 3)) {
      expect((await press(old)).log).not.toContain(`gpl ${NEXT_PAGE}`);
    }

    // THE PUT-BACK: the install store's restore writes its three system slots through
    // #systemStringOr, which is systemSlotString; the source says so, and the one rule turns every
    // pre-change-22 string into the page switch.
    const store = readFileSync(
      new URL("./install.svelte.ts", import.meta.url),
      "utf8",
    );
    const putBack = store.slice(store.indexOf("async putBack()"));
    expect(
      putBack.slice(0, putBack.indexOf("#ramLeg(")),
      "the put-back's utility goes through the one rule",
    ).toContain(
      "systemUtility: this.#systemStringOr(snapshot, 4, protocolLib)",
    );
    expect(store).toContain(
      "if (lib) return lib.systemSlotString(config, event);",
    );
    for (const old of preGuard) {
      const written = systemSlotString(
        { system: "", systemTimer: "", systemUtility: old },
        4,
      );
      expect(written).toBe(SYSTEM_DEFAULT_UTILITY);
      await expectPressTurnsPage(
        "the put-back",
        written,
        "a restored pre-change-22 255/4",
      );
    }

    // THE WALKING SKELETON'S WRITE-BACK (sequence.ts writeBack, the no-op cycle's write): what it puts
    // on the wire at 255/4, read off the frames, for a module holding each of those strings - and for
    // a module whose own 255/4 turns the page, written back as it came.
    const identity: Identity = {
      zona: {
        sx: 0,
        sy: 0,
        rot: 0,
        hwcfg: 0,
        moduleType: undefined,
        revision: undefined,
        heartbeatType: 1,
        firmware: { major: 1, minor: 5, patch: 5 },
        lastSeen: 0,
      },
      activePage: 1,
      otherModules: [],
      storeAllowed: true,
    };
    const utilityWrittenBack = async (own: string): Promise<string> => {
      const sent: GridRequest[] = [];
      const queue = {
        request: async (req: GridRequest) => {
          sent.push(req);
          return {} as never;
        },
      } as unknown as RequestQueue;
      const at = (event: number, actionString: string) => ({
        event,
        label: "System utility" as const,
        actionString,
        actionLength: actionString.length,
      });
      await writeBack(queue, identity, {
        systemTimer: at(6, SYSTEM_DEFAULT_TIMER),
        system: at(0, SYSTEM_DEFAULT_SETUP),
        systemUtility: at(EVENT_UTILITY, own),
        timer: at(6, "--[[@cb]]print(2)"),
        setup: at(0, "--[[@cb]]print(1)"),
      });
      const utility = sent.find(
        (r) =>
          r.descr.class_parameters.ELEMENTNUMBER === ELEMENT_SYSTEM &&
          r.descr.class_parameters.EVENTTYPE === EVENT_UTILITY,
      );
      return String(utility?.descr.class_parameters.ACTIONSTRING);
    };
    for (const old of [...preGuard].slice(0, 8)) {
      const written = await utilityWrittenBack(old);
      expect(written).toBe(SYSTEM_DEFAULT_UTILITY);
      await expectPressTurnsPage(
        "the skeleton's write-back",
        written,
        "a written-back pre-change-22 255/4",
      );
    }
    const guarded = emitSurface(FIXTURES["emit/page3"], { slots: 5 })
      .mapmode as string;
    expect(
      await utilityWrittenBack(guarded),
      "a guarded 255/4, as it came",
    ).toBe(guarded);
    expect(await utilityWrittenBack(SYSTEM_DEFAULT_UTILITY)).toBe(
      SYSTEM_DEFAULT_UTILITY,
    );
    console.log(
      `the restore writers: ${preGuard.size} pre-change-22 strings through the put-back's rule, 8 through the skeleton's write-back, every one written as the page switch`,
    );
  }, 120_000);
});

/**
 * A tuner at the given knob positions, resolved on its FIRST defined onconfig - the landing of the
 * first measurement (wire-pin.spec.ts's `landing`, trimmed to the pair). The preview engines it
 * published are closed: nothing owns them here.
 */
function firstLanding(
  entryId: string,
  indices: Readonly<Record<string, number>> | undefined,
): Promise<ConfigStrings> {
  return new Promise<ConfigStrings>((resolve, reject) => {
    const engines: SimEngine[] = [];
    let config: ConfigStrings | undefined;
    let tuner: { destroy(): void } | undefined;
    const finish = (): void => {
      if (config === undefined || tuner === undefined) return;
      tuner.destroy();
      for (const engine of engines)
        (engine as SimEngine & { close?: () => void }).close?.();
      resolve(config);
    };
    buildTuner({
      entryId,
      indices,
      onview: () => undefined,
      onpreview: (engine) => void engines.push(engine),
      onladder: () => undefined,
      onover: () => undefined,
      onconfig: (next) => {
        if (next && !config) {
          config = next;
          finish();
        }
      },
    }).then((built) => {
      tuner = built;
      finish();
    }, reject);
  });
}
