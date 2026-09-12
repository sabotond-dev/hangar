/**
 * THE INTRO, FIVE TESTS (plan 13-07; 13-CONTEXT.md D-01, D-05, D-09, D-14 Q2;
 * PDF page 1; 13-RESEARCH.md sections 1 and 8; test 5 from plan 13.1-01,
 * 13.1-CONTEXT.md D-01).
 *
 * TEST 5 IS A SOURCE SCAN AND SAYS SO. It holds that the intro DECLARES its
 * height rule - the centre a 100dvh column's remainder, the intro's unit read
 * off it in cq units, the headline clamped locally, the stacked band opting
 * out - and that the numbers come from layout.ts. It cannot hold that the
 * page fits: a stylesheet can promise a fit it does not deliver, and the fit
 * itself is e2e/first-experience.e2e.ts's four-viewport title in chromium,
 * measured off rendered boxes (13.1-CONTEXT D-11 j; 13.1-PLAN-CHECK W-02).
 *
 * RENDERED AND SCANNED, in the house style 13-05 set for src/lib/ui/ specs:
 * svelte/server's render() runs in the vitest server project, so the page's
 * structure, its two card variants and the hero's markup are read off the
 * rendered tree, and the rules that are about the SOURCE - no navigation
 * anywhere on the route, the host's wake margin, the pointer handlers - are
 * comment-blanked scans of the files themselves.
 *
 * WHAT "ZERO NAVIGATIONS" MEANS HERE, said plainly. onMount does not run
 * under svelte/server, so the mount path is exercised through the pure
 * function it calls (card.ts's introCardFor) rather than through a browser,
 * and the navigation count is a count of navigation CALLS in the route's
 * source - goto, redirect, location, pushState, replaceState, a meta refresh
 * - which is zero in both branches because the branches are one function
 * that returns a card and nothing else. The scan proves itself on a planted
 * line before it is trusted on the real files.
 *
 * Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createRawSnippet } from "svelte";
import { render } from "svelte/server";
import { describe, expect, it } from "vitest";
import { byId } from "$lib/catalog";
import {
  FRONT_DOOR,
  FRONT_DOOR_HERO,
  heroOf,
  type FrontDoorEntry,
} from "$lib/catalog/front-door";
import { listingById } from "$lib/catalog/listing";
import { writeDraft } from "$lib/store/drafts";
import { hasSeenIntro, markIntroSeen } from "$lib/store/intro";
import type { LocalStore } from "$lib/store/local";
import type { Draft } from "$lib/store/schema";
import Layout from "../../routes/+layout.svelte";
import Intro from "./intro/Intro.svelte";
import {
  INTRO_FIT_H,
  INTRO_GAP,
  INTRO_PAD_BOTTOM,
  INTRO_PAD_TOP,
  INTRO_SQUEEZE_FROM,
  INTRO_STRIP_PAD,
  INTRO_WORDS_MIN_W,
} from "./shell/layout";
import {
  RESUME_EYEBROW,
  heroDescription,
  introCardFor,
  relativeTime,
  resumeLine,
  type IntroCard,
} from "./intro/card";
import { REPO_ROOT, blankComments } from "./radius-allowlist";

// ---------------------------------------------------------------------------
// Helpers.
// ---------------------------------------------------------------------------

const source = (rel: string) =>
  blankComments(readFileSync(join(REPO_ROOT, rel), "utf8"));

/** The route and its components: every file a navigation could hide in. */
const ROUTE_FILES = [
  "src/routes/+page.svelte",
  "src/routes/+page.ts",
  "src/lib/ui/intro/Intro.svelte",
  "src/lib/ui/intro/StartCard.svelte",
  "src/lib/ui/intro/HeroSurface.svelte",
  "src/lib/ui/intro/card.ts",
];

/** Every way a page can navigate on its own. */
const NAVIGATION_MARKERS = [
  "goto(",
  "$app/navigation",
  "location.assign",
  "location.replace",
  "location.href",
  "pushState(",
  "replaceState(",
  "redirect(",
  "http-equiv",
  "window.open(",
];

const navigations = (text: string): string[] =>
  NAVIGATION_MARKERS.filter((marker) => text.includes(marker));

/** Text nodes of a rendered body, comments removed, in document order. */
function textNodes(body: string): string[] {
  // Split on TAGS, never on newlines: Prettier reflows element text across
  // source lines and the browser collapses that whitespace, so a node is
  // whatever sits between two tags with its whitespace collapsed.
  const boundary = String.fromCharCode(0);
  return body
    .replace(/<!--[^]*?-->/g, "")
    .replace(/<[^>]*>/g, boundary)
    .split(boundary)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 0);
}

const renderIntro = (card: IntroCard) =>
  render(Intro, { props: { card, hero: FRONT_DOOR_HERO } }).body;

/** A Map-backed store with Storage's three methods. */
function memoryStore(): LocalStore & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
}

const T0 = "2026-09-11T08:00:00.000Z";
const at = (minutesLater: number) =>
  new Date(Date.parse(T0) + minutesLater * 60_000);

const DRAFT: Draft = {
  schema: 1,
  id: "playground:aurora",
  name: "Aurora, my way",
  kind: "playground",
  source: "aurora",
  knobIndices: [0, 1, 2],
  createdAt: T0,
  editedAt: T0,
};

describe("the intro (src/lib/ui/intro.spec.ts)", () => {
  it("1. the page renders PDF page 1 - eyebrow, the two headline lines with the second in the action colour, both sub-lines, both cards, the import line and the three steps - and the only uppercase strings are the short labels the PDF sets in uppercase", () => {
    const body = renderIntro({ kind: "explore" });
    const nodes = textNodes(body);

    // The PDF's strings, verbatim.
    for (const line of [
      "WELCOME TO YOUR CONFIGURATION STUDIO",
      "Make ZONA",
      "your own.",
      "Find a gesture you love.",
      "Build a surface that works the way you do.",
      "START WITH AN IDEA",
      "Explore Playground",
      "Discover configurations. Try one. Make it yours.",
      "START WITH A BLANK SURFACE",
      "Build in Sandbox",
      "Arrange controls and choose what each gesture does.",
      "Already have a configuration?",
      "TRY THE SURFACE",
      "BROWSER PREVIEW",
      "Drag across the surface to preview",
      "Explore",
      "Find a configuration or start from scratch.",
      "Shape",
      "Tune the behavior, color, and MIDI mapping.",
      "Apply",
      "Send your configuration to ZONA.",
    ]) {
      expect(nodes, `the page says "${line}"`).toContain(line);
    }
    expect(
      nodes.some((node) => node.startsWith("Import config")),
      "the import link",
    ).toBe(true);
    expect(
      nodes.some((node) =>
        node.includes(
          "Start in browser preview. Connect ZONA when you’re ready.",
        ),
      ),
      "the bulleted line, with a real apostrophe",
    ).toBe(true);
    expect(body, "no straight-quote contraction").not.toContain("you're");
    for (const step of ["01", "02", "03"]) {
      expect(nodes, `step ${step}`).toContain(step);
    }

    // One level-1 heading, and it is the headline; the second line carries
    // the class whose one rule is the action colour.
    expect(body.split("<h1").length - 1, "exactly one h1").toBe(1);
    expect(body).toMatch(/class="line own[^"]*"[^>]*>your own\./);
    const style = source("src/lib/ui/intro/Intro.svelte");
    expect(style).toMatch(/\.own\s*\{\s*color:\s*var\(--color-action\);\s*\}/);

    // D-05's rule, asserted: uppercase only on the short labels. The
    // eyebrow, the two card eyebrows, the panel label, the chip - the five
    // the plan named - and the hero's caption, which the PDF sets in
    // uppercase too (`ARC / MODULATION`) and the plan's list omitted.
    const hero = FRONT_DOOR_HERO;
    const term = listingById(hero.id)?.tags[0] ?? "";
    expect(
      term.length,
      "the hero has a FOR term for its caption",
    ).toBeGreaterThan(0);
    const uppercase = nodes.filter(
      (node) => /[A-Za-z]/.test(node) && node === node.toUpperCase(),
    );
    expect(uppercase.sort()).toEqual(
      [
        "WELCOME TO YOUR CONFIGURATION STUDIO",
        "START WITH AN IDEA",
        "START WITH A BLANK SURFACE",
        "TRY THE SURFACE",
        "BROWSER PREVIEW",
        `${hero.name.toUpperCase()} / ${term.toUpperCase()}`,
      ].sort(),
    );

    // The prerendered document carries the intro header: the layout reads
    // the shape the route declares as page data when no effect has filled
    // the shell, which is the server's only path (src/routes/+page.ts).
    const child = createRawSnippet(() => ({
      render: () => `<span data-testid="page">the page</span>`,
    }));
    const ssr = render(Layout, {
      props: { children: child },
      context: new Map<string, unknown>([
        ["__request__", { page: { data: { shell: { variant: "intro" } } } }],
      ]),
    }).body;
    expect(ssr, "the intro header is in the server render").toContain(
      'data-testid="shell-header" data-variant="intro"',
    );
    expect(ssr).toMatch(/<main class="centre intro[^"]*"/);
    expect(ssr, "no nav on the intro").not.toContain("<nav");
    const unfilled = render(Layout, {
      props: { children: child },
      context: new Map<string, unknown>([
        ["__request__", { page: { data: {} } }],
      ]),
    }).body;
    expect(
      unfilled,
      "a page that declares nothing gets no header",
    ).not.toContain('data-testid="shell-header"');
  });

  it("2. Card A is Explore Playground for a first visit and Resume draft, named and dated in words, for a returning one - and the route performs zero navigations in both cases", () => {
    // A first visit: nothing stored.
    const fresh = memoryStore();
    expect(introCardFor(fresh, at(0))).toEqual({ kind: "explore" });
    const first = renderIntro(introCardFor(fresh, at(0)));
    expect(first).toContain('data-testid="start-explore"');
    expect(first).not.toContain('data-testid="start-resume"');
    expect(first).toContain("Explore Playground");

    // The flag alone is not a draft: a visitor who looked and left still
    // gets the way in.
    const looked = memoryStore();
    expect(markIntroSeen(looked, T0)).toBe(true);
    expect(hasSeenIntro(looked)).toBe(true);
    expect(introCardFor(looked, at(5))).toEqual({ kind: "explore" });

    // A returning visitor with a draft, twelve minutes on.
    const returning = memoryStore();
    expect(markIntroSeen(returning, T0)).toBe(true);
    expect(writeDraft(returning, DRAFT, T0)).toBe(true);
    const card = introCardFor(returning, at(12));
    expect(card.kind).toBe("resume");
    if (card.kind !== "resume") throw new Error("unreachable");
    expect(card.draft.name).toBe(DRAFT.name);
    expect(card.edited).toBe("12 minutes ago");
    const back = renderIntro(card);
    expect(back).toContain('data-testid="start-resume"');
    expect(back).not.toContain('data-testid="start-explore"');
    expect(back).toContain("Resume draft");
    expect(back).toContain(RESUME_EYEBROW);
    expect(back).toContain(resumeLine(DRAFT.name, "12 minutes ago"));
    expect(back, "the card points at the draft's own address").toMatch(
      /data-testid="start-resume"[^>]*|href="[^"]*\/playground\/aurora[^"]*"[^>]*data-testid="start-resume"/,
    );
    expect(back).toMatch(/href="[^"]*\/playground\/aurora\/?"/);
    // The second card is the same in both branches.
    expect(back).toContain('data-testid="start-sandbox"');
    expect(first).toContain('data-testid="start-sandbox"');

    // The words, at a few ages.
    expect(relativeTime(T0, at(0))).toBe("just now");
    expect(relativeTime(T0, at(1))).toBe("a minute ago");
    expect(relativeTime(T0, at(12))).toBe("12 minutes ago");
    expect(relativeTime(T0, at(60))).toBe("an hour ago");
    expect(relativeTime(T0, at(5 * 60))).toBe("5 hours ago");
    expect(relativeTime(T0, at(24 * 60))).toBe("a day ago");
    expect(relativeTime(T0, at(3 * 24 * 60))).toBe("3 days ago");
    expect(relativeTime("not a moment", at(0))).toBe("earlier");

    // ZERO NAVIGATIONS. The scan proves itself on a plant first.
    expect(navigations('onMount(() => goto("/playground/"))')).toEqual([
      "goto(",
    ]);
    expect(navigations('import { goto } from "$app/navigation";')).toEqual([
      "$app/navigation",
    ]);
    let scanned = 0;
    for (const rel of ROUTE_FILES) {
      const text = source(rel);
      expect(text.length, `${rel} was read`).toBeGreaterThan(0);
      scanned += 1;
      expect(
        navigations(text),
        `${rel} navigates: the flag changes one card and nothing else (D-14 Q2)`,
      ).toEqual([]);
    }
    expect(scanned).toBe(ROUTE_FILES.length);
    // And the mount path reads storage from onMount, never at module scope.
    const route = source("src/routes/+page.svelte");
    const mountAt = route.indexOf("onMount(() =>");
    expect(mountAt, "the route has an onMount").toBeGreaterThan(-1);
    expect(
      route.indexOf("introCardFor(store"),
      "the store is read inside onMount",
    ).toBeGreaterThan(mountAt);
    expect(
      route.indexOf("markIntroSeen(store"),
      "the flag is written inside onMount, after the read",
    ).toBeGreaterThan(route.indexOf("introCardFor(store"));
    // The browser store is named exactly once, inside the guarded accessor
    // (the property access inside its try), and that accessor is called
    // from onMount and nowhere else - never at module scope.
    expect(
      route.split("localStorage").length - 1,
      "window.localStorage is named once, in the accessor",
    ).toBe(1);
    expect(route).toMatch(/try\s*\{\s*return window\.localStorage;/);
    const calls = [...route.matchAll(/= storage\(\)/g)].map((m) => m.index);
    expect(calls, "the accessor is called once").toHaveLength(1);
    expect(calls[0], "and that call is inside onMount").toBeGreaterThan(
      mountAt,
    );
  });

  it("3. a storage that throws on access renders the first-visit page - the safe direction - and does not throw", () => {
    // Throws on every property ACCESS, not only on use (07-RESEARCH pitfall 9).
    const hostile = new Proxy({} as LocalStore, {
      get() {
        throw new Error("storage refused");
      },
    });
    expect(() => hostile.getItem, "the fake is not vacuous").toThrow();

    expect(() => introCardFor(hostile, at(0))).not.toThrow();
    expect(introCardFor(hostile, at(0))).toEqual({ kind: "explore" });
    expect(
      markIntroSeen(hostile, T0),
      "the write is dropped, and reported",
    ).toBe(false);

    // Throws on use.
    const onUse: LocalStore = {
      getItem: () => {
        throw new Error("no");
      },
      setItem: () => {
        throw new Error("no");
      },
      removeItem: () => {
        throw new Error("no");
      },
    };
    expect(introCardFor(onUse, at(0))).toEqual({ kind: "explore" });

    // Absent (the server), and corrupt.
    expect(introCardFor(undefined, at(0))).toEqual({ kind: "explore" });
    const corrupt = memoryStore();
    corrupt.map.set("hangar.intro.v1", "{not json");
    corrupt.map.set("hangar.drafts.v1", '{"schema":1,"drafts":"no"}');
    expect(introCardFor(corrupt, at(0))).toEqual({ kind: "explore" });

    // And the page it renders is the first-visit page.
    const body = renderIntro(introCardFor(hostile, at(0)));
    expect(body).toContain('data-testid="start-explore"');
    expect(body).not.toContain("Resume draft");
  });

  it("4. the hero is one live pad through the shared host with the 200px wake margin, is interactive, and resolves to a non-dark front-door member", () => {
    const hero = FRONT_DOOR_HERO;
    console.log(
      `intro hero: ${hero.id} (${hero.name}), motion ${hero.motion}; ARC on the PDF, ${hero.id === "arc" ? "ARC here too" : "not ARC here"}`,
    );

    // Derived, in list order, and not dark.
    expect(hero).toBe(heroOf(FRONT_DOOR));
    expect(hero).toBe(FRONT_DOOR.find((entry) => entry.motion !== "dark"));
    expect(hero.motion).not.toBe("dark");
    const entry = byId(hero.id);
    expect(entry, "the hero is a catalog entry").toBeDefined();
    expect(entry?.restsBlack, "the hero does not rest black").toBe(false);
    expect(
      entry?.preview,
      "the hero is a padsim entry, so / fetches no WebAssembly",
    ).toBe("padsim");

    // The derivation on rows this list does not have: a dark opener is
    // skipped, and a row of nothing but dark is a stop, not a black square.
    const dark: FrontDoorEntry = {
      id: "x",
      name: "X",
      description: "d",
      motion: "dark",
    };
    expect(heroOf([dark, hero])).toBe(hero);
    expect(() => heroOf([dark])).toThrow(/rests black/);

    // One pad, through PadFrame and PadCanvas, named and described.
    const body = renderIntro({ kind: "explore" });
    expect(body.split('data-testid="pad-canvas-').length - 1, "one pad").toBe(
      1,
    );
    expect(body).toContain(`data-testid="pad-canvas-${hero.id}"`);
    expect(body).toContain(`aria-label="${hero.name}, live pad simulation"`);
    expect(body).toContain('aria-describedby="intro-hero-description"');
    expect(body).toContain(heroDescription(hero.name));

    // The shared host, the ambient-motion fold, the observer's wake margin.
    const surface = source("src/lib/ui/intro/HeroSurface.svelte");
    expect(surface).toContain('import { SimHost } from "$lib/sim/host"');
    expect(surface).toContain("new SimHost(motionDeps())");
    expect(surface).toContain(".register(entry.id, canvas, engine)");
    expect(surface).toContain(".setHero(entry.id)");
    const host = source("src/lib/sim/host.ts");
    expect(host).toContain('rootMargin: "200px"');
    expect(host).toContain("threshold: 0");
    // The engine and the catalog arrive dynamically, inside onMount.
    expect(surface).toContain('import("$lib/sim/engine")');
    expect(surface).toContain('import("$lib/catalog")');
    expect(surface).not.toMatch(/import\s*\{[^}]*\}\s*from\s*"\$lib\/catalog"/);
    expect(surface).not.toMatch(
      /import\s*\{[^}]*\}\s*from\s*"\$lib\/sim\/engine"/,
    );

    // Interactive: a finger, mapped onto the engine's own range and
    // delivered through the host.
    for (const handler of ["onpointerdown", "onpointermove", "onpointerup"]) {
      expect(body, `the surface takes ${handler}`).toMatch(
        new RegExp(`data-testid="intro-surface"[^>]*`),
      );
      expect(surface).toContain(`${handler}=`);
    }
    for (const call of ["touchDown(", "touchMove(", "touchEnd(", "mapAxis("]) {
      expect(surface).toContain(call);
    }
  });

  it("5. the intro declares its height rule (13.1-01, D-01): the layout's intro centre is a 100dvh column's remainder and a size container with overflow hidden, the intro reads it in cq units through layout.ts's numbers, the headline is clamped locally with .type-display untouched, the hero's square is bounded by its stage, and the stacked band opts out - a scan, never the fit itself", () => {
    const layout = source("src/routes/+layout.svelte");
    const intro = source("src/lib/ui/intro/Intro.svelte");
    const hero = source("src/lib/ui/intro/HeroSurface.svelte");
    const card = source("src/lib/ui/intro/StartCard.svelte");
    const app = readFileSync(join(REPO_ROOT, "src/app.css"), "utf8");

    /** The first rule whose selector list is exactly `selector`, in the text from `from` on. */
    const escapeRe = (text: string) =>
      text.replace(/[.*+?^{}$()|[\]\\]/g, "\\$&");
    const ruleOf = (text: string, selector: string, from = 0): string => {
      const re = new RegExp(
        "(^|[}\\n])\\s*" + escapeRe(selector) + "\\s*\\{([^}]*)\\}",
        "g",
      );
      re.lastIndex = from;
      const m = re.exec(text);
      return m ? m[2] : "";
    };
    const stackedAt = (text: string) =>
      text.indexOf("@media (max-width: 1023.98px)");

    // THE LAYOUT. The site root is a 100dvh flex column under the intro
    // variant; the centre takes the remainder, clips, and is a size
    // container. Neither HEADER_H nor FOOTER_H is in the arithmetic: the
    // footer renders taller than FOOTER_H (its licence row), and a calc on
    // the constant would leave a document scroll. The stacked band undoes
    // both, so a phone flows and may scroll (13-07's stack, D.10 open).
    expect(layout).toContain('class:intro={fill?.variant === "intro"}');
    const site = ruleOf(layout, ".site.intro");
    expect(site, ".site.intro is a 100dvh column").toContain(
      "block-size: 100dvh",
    );
    expect(site).toContain("flex-direction: column");
    const centre = ruleOf(layout, ".centre.intro");
    for (const decl of [
      "flex: 1 1 0",
      "min-block-size: 0",
      "overflow: hidden",
      "container-type: size",
    ]) {
      expect(centre, `.centre.intro declares ${decl}`).toContain(decl);
    }
    expect(
      centre,
      "the centre's height is never a calc on the constants",
    ).not.toMatch(/var\(--(header|footer)-h\)/);
    const layoutStacked = stackedAt(layout);
    expect(layoutStacked).toBeGreaterThan(-1);
    expect(ruleOf(layout, ".site.intro", layoutStacked)).toContain(
      "display: contents",
    );
    const centreStacked = ruleOf(layout, ".centre.intro", layoutStacked);
    expect(centreStacked).toContain("overflow: visible");
    expect(centreStacked).toContain("container-type: normal");

    // THE INTRO. The numbers come from layout.ts as unitless custom
    // properties (rendered, below); the unit is one PDF pixel at the
    // centre's height, capped at 1px; the ramp reads the unit; the root is
    // two rows with the strip at the foot; the headline is clamped here and
    // .type-display is still 60. The stacked band pins both scales at 1px.
    const root = ruleOf(intro, ".intro");
    expect(root).toContain(
      "--intro-unit: min(1px, calc(100cqh / var(--intro-fit-h)))",
    );
    expect(root).toMatch(
      /--intro-squeeze:\s*clamp\(\s*0px,[^;]*var\(--intro-unit\)[^;]*var\(--intro-squeeze-from\)[^;]*1px\s*\)/,
    );
    expect(root).toContain("grid-template-rows: minmax(0, 1fr) auto");
    expect(root).toContain("block-size: 100%");
    expect(root).toContain("var(--intro-pad-top) * var(--intro-squeeze)");
    expect(root).toContain("var(--intro-pad-bottom) * var(--intro-squeeze)");
    expect(root).toContain("var(--intro-gap) * var(--intro-squeeze)");
    const headline = ruleOf(intro, ".headline");
    expect(
      headline,
      "the headline clamps locally: 60 at the PDF's height, never below 34",
    ).toContain("font-size: max(34px, calc(60 * var(--intro-unit)))");
    expect(ruleOf(intro, ".sub")).toContain(
      "max(15px, calc(19 * var(--intro-unit)))",
    );
    expect(ruleOf(intro, ".cards")).toContain(
      "--start-card-title: max(18px, calc(24 * var(--intro-unit)))",
    );
    expect(ruleOf(intro, ".columns")).toContain(
      "minmax(min(100%, var(--intro-words-min-w)), 638fr)",
    );
    expect(ruleOf(intro, ".steps")).toContain(
      "var(--intro-strip-pad) * var(--intro-squeeze)",
    );
    const display = /\.type-display\s*\{([^}]*)\}/.exec(app)?.[1] ?? "";
    expect(
      display,
      "app.css's .type-display role is untouched (D-17)",
    ).toContain("font-size: 60px");
    expect(intro, "the intro never edits the role").not.toContain(
      ".type-display {",
    );
    const introStacked = stackedAt(intro);
    expect(introStacked).toBeGreaterThan(-1);
    const rootStacked = ruleOf(intro, ".intro", introStacked);
    expect(rootStacked).toContain("--intro-unit: 1px");
    expect(rootStacked).toContain("--intro-squeeze: 1px");
    expect(rootStacked).toContain("block-size: auto");

    // THE HERO. The stage is its own size container and the square is the
    // smaller of its two sides; the stacked band is the column's width.
    expect(ruleOf(hero, ".stage")).toContain("container-type: size");
    expect(ruleOf(hero, ".surface")).toContain(
      "inline-size: min(100cqw, 100cqh)",
    );
    expect(ruleOf(hero, ".surface")).toContain("aspect-ratio: 1");
    expect(ruleOf(hero, ".stage", stackedAt(hero))).toContain(
      "container-type: normal",
    );
    expect(ruleOf(hero, ".surface", stackedAt(hero))).toContain(
      "inline-size: 100%",
    );

    // THE CARD reads the intro's properties with the PDF's fallbacks.
    const cardRule = ruleOf(card, ".card");
    expect(cardRule).toContain("min-block-size: var(--start-card-min, 108px)");
    expect(cardRule).toContain("padding: var(--start-card-pad, 16px) 24px");
    expect(ruleOf(card, ".title")).toContain(
      "font-size: var(--start-card-title, 24px)",
    );

    // RENDERED: the numbers on the root are layout.ts's, unitless where the
    // CSS multiplies, and the layout still puts the class on the root.
    const body = renderIntro({ kind: "explore" });
    const open = /<div class="intro[^"]*"[^>]*>/.exec(body)?.[0] ?? "";
    expect(open, "the intro root is rendered").not.toBe("");
    for (const [name, value] of [
      ["--intro-fit-h", String(INTRO_FIT_H)],
      ["--intro-squeeze-from", String(INTRO_SQUEEZE_FROM)],
      ["--intro-pad-top", String(INTRO_PAD_TOP)],
      ["--intro-pad-bottom", String(INTRO_PAD_BOTTOM)],
      ["--intro-gap", String(INTRO_GAP)],
      ["--intro-strip-pad", String(INTRO_STRIP_PAD)],
      ["--intro-words-min-w", `${INTRO_WORDS_MIN_W}px`],
    ]) {
      expect(open, `${name} is layout.ts's`).toContain(`${name}: ${value}`);
    }
    expect(INTRO_SQUEEZE_FROM).toBeGreaterThan(0);
    expect(INTRO_SQUEEZE_FROM).toBeLessThan(1);
    expect(INTRO_FIT_H).toBeGreaterThan(
      INTRO_PAD_TOP + INTRO_GAP + INTRO_PAD_BOTTOM,
    );
    const child = createRawSnippet(() => ({
      render: () => `<span data-testid="page">the page</span>`,
    }));
    const ssr = render(Layout, {
      props: { children: child },
      context: new Map<string, unknown>([
        ["__request__", { page: { data: { shell: { variant: "intro" } } } }],
      ]),
    }).body;
    expect(ssr, "the site root carries the intro class").toMatch(
      /<div class="site(?: svelte-[a-z0-9]+)? intro"/,
    );
    const app_ = render(Layout, {
      props: { children: child },
      context: new Map<string, unknown>([
        ["__request__", { page: { data: { shell: { variant: "app" } } } }],
      ]),
    }).body;
    expect(app_, "and only under the intro variant").not.toMatch(
      /<div class="site(?: svelte-[a-z0-9]+)? intro"/,
    );
  });
});
