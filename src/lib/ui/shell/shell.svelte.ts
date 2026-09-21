/**
 * THE BRIDGE BETWEEN A ROUTE AND THE SHELL. The shell is mounted once, in
 * src/routes/+layout.svelte, and renders named slots; a layout cannot take
 * snippets from the page it wraps, so a route calls fillShell() from an
 * effect (and gets back the function that empties it) and the layout reads
 * `shell.fill`. Three shapes: `variant: "app"` is the PDF's frame on pages 2
 * to 5, `variant: "intro"` is page 1's exception, and an unfilled shell is
 * the announcer, the page and the footer - the seven /dev/ instruments' shape.
 * The fill is one module-level $state.raw VARIABLE behind a getter, reassigned
 * whole: a property write on a raw-state object is not tracked (13-09's find).
 * The device chrome left the fill at 13-11 - the layout mounts it on every page.
 * Decided at 13-05 and 13-09; see .planning/phases/13-gui-overhaul/13-09-SUMMARY.md
 *
 * Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
 */
import type { Snippet } from "svelte";
import { resolve } from "$app/paths";
import type { ResolvedPathname } from "$app/types";
import type { InstallPhase } from "$lib/device/install.svelte";

/** The three sections of the primary nav (Bible section 4). */
export type Section = "playground" | "sandbox" | "my-configs";

export interface NavItem {
  id: Section;
  /** The PDF's own label, uppercase because it is a short navigation label (D-05). */
  label: string;
  href: ResolvedPathname;
}

/**
 * The nav's three destinations, section 4's routes with the site's trailing
 * slash, every one a resolve() call now that every route exists on disk:
 * /playground/ since 13-08, /my-configs/ since 13-13 and /sandbox/ since
 * 13-16, which swapped the last typed literal for the call in the commit
 * that landed the route.
 */
export const SECTIONS: readonly NavItem[] = [
  { id: "playground", label: "PLAYGROUND", href: resolve("/playground/") },
  { id: "sandbox", label: "SANDBOX", href: resolve("/sandbox/") },
  { id: "my-configs", label: "MY CONFIGS", href: resolve("/my-configs/") },
];

export interface ShellFill {
  variant: "intro" | "app";
  /** Which nav item is current. Unused by the intro. */
  section?: Section;
  /** The context bar's left zone, as the PDF writes it: ["PLAYGROUND", "CONFIGURATIONS"]. */
  breadcrumb?: readonly string[];
  /** The context bar's centre zone on pages 2 and 4: a sentence, or a snippet. */
  status?: string | Snippet;
  /**
   * The context bar's centre zone on pages 3 and 5 (plan 13-11): the dotted
   * status line's TWO clauses, from two sources, as two fields - the draft's
   * (the drafts store, 13-06; the words are 13-18's and the wiring is
   * 13-13's, so no route sets it yet) and the device's (the install store's
   * phase, read by the route and passed through). Section 9 says the draft,
   * the saved copy and the device state are three objects and never one
   * generic indicator; one merged field here would be that mistake with a
   * type signature, so there are two and ContextBar.svelte takes two.
   */
  draft?: string | Snippet;
  device?: InstallPhase;
  /** The page the device clause names, as the module reports it: the install store's snapshotPage. Read beside `device`; absent means no page is known yet. */
  page?: number;
  /**
   * The context bar's right zone. When absent the bar renders the PDF's
   * sentence "Preview without hardware" (pages 2 and 4) - the zone is a
   * destination or a sentence, never empty.
   */
  destination?: Snippet;
  /** The left rail. Absent on the intro; the app frame draws an empty column without it. */
  rail?: Snippet;
  /** The right inspector. Absent on page 2 and page 4, where the centre takes its width. */
  inspector?: Snippet;
  /** The tool rail between the centre and the inspector (change 15): the Sandbox's twelve icon boxes. Absent elsewhere; the column is not drawn without it. */
  tools?: Snippet;
  /** The intro header's secondary link (page 1's Quick guide). 13-07's. */
  secondary?: Snippet;
}

let current = $state.raw<ShellFill | undefined>(undefined);

/** The one fill, reactive through the raw-state variable behind it. */
export const shell = {
  get fill(): ShellFill | undefined {
    return current;
  },
  set fill(next: ShellFill | undefined) {
    current = next;
  },
};

/**
 * Fill the shell for the life of the caller's effect. Returns the cleanup
 * that empties it, and empties only if the fill is still the caller's own,
 * so two routes crossing during navigation cannot blank each other.
 */
export function fillShell(fill: ShellFill): () => void {
  shell.fill = fill;
  return () => {
    if (shell.fill === fill) shell.fill = undefined;
  };
}

/**
 * THE SERVER'S HALF OF THE FILL (plan 13-07). fillShell() runs from an
 * effect, and an effect never runs on the server - while the layout's
 * `{#if fill}` is evaluated before the page's script runs at all, because
 * the page renders as the layout's children. So a route that wants its
 * frame in the PRERENDERED document declares the shape as data from its
 * +page.ts (`{ shell: { variant, section?, breadcrumb?, status? } }`), and
 * the layout reads it here when no effect has filled the shell yet. Strings
 * travel as data - the breadcrumb and a sentence status, so the prerendered
 * context bar carries its words (13-08); snippets cannot, and arrive with
 * the effect, and the frame does not move when they do. Anything that is not
 * a declared shape reads as no shape: the layout then renders the unfilled
 * form it always did.
 */
export function shellFromData(data: unknown): ShellFill | undefined {
  if (typeof data !== "object" || data === null) return undefined;
  const declared = (data as { shell?: unknown }).shell;
  if (typeof declared !== "object" || declared === null) return undefined;
  const variant = (declared as { variant?: unknown }).variant;
  if (variant !== "intro" && variant !== "app") return undefined;
  const section = (declared as { section?: unknown }).section;
  const known = SECTIONS.find((item) => item.id === section);
  const crumbs = (declared as { breadcrumb?: unknown }).breadcrumb;
  const breadcrumb =
    Array.isArray(crumbs) && crumbs.every((c) => typeof c === "string")
      ? (crumbs as string[])
      : undefined;
  const status = (declared as { status?: unknown }).status;
  return {
    variant,
    section: known?.id,
    breadcrumb,
    status: typeof status === "string" ? status : undefined,
  };
}
