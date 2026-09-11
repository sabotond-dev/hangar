/**
 * THE BRIDGE BETWEEN A ROUTE AND THE SHELL (plan 13-05).
 *
 * The shell is mounted ONCE, in src/routes/+layout.svelte, and knows nothing
 * about configurations: it renders named slots. A SvelteKit layout cannot
 * take snippets from the page it wraps - the page is the layout's children
 * and nothing else - so the slots are filled through this module. A route
 * calls fillShell() from an effect and gets back the function that empties
 * it; the layout reads `shell` and renders what it finds. Snippets are
 * values in Svelte 5, so a route can hand its rail, its inspector and its
 * destination zone over as snippets without the shell learning what is in
 * them.
 *
 * THREE SHAPES, AND THE THIRD DIES WITH THE OLD ROUTES. `variant: "app"` is
 * the frame the PDF draws on pages 2 to 5 (header with nav, context bar,
 * rail, centre, inspector, footer). `variant: "intro"` is page 1's exception
 * (a header with the wordmark, a secondary link and the connection slot, no
 * nav, no context bar, no rail, no inspector). When NO route has filled the
 * shell the layout renders the announcer, the page and the footer and
 * nothing more - which is what `/playground/[id]` (the workspace, at /playground/[id]
 * until 13-08 moved it under D-20) needs until 13-09 rewrites it, because it
 * still draws a header of its own (13-VALIDATION.md D-5), and a second
 * header above it would be a visible defect on the live site. / (13-07) and
 * /playground/ (13-08) fill the shell; once the workspace does too the
 * unfilled shape has no caller, and 13-09 removes it.
 *
 * $state.raw rather than $state: the fill is replaced whole, never mutated
 * a field at a time, and a deep proxy over snippet functions buys nothing.
 *
 * Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
 */
import type { Snippet } from "svelte";
import { resolve } from "$app/paths";
import type { ResolvedPathname } from "$app/types";

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
 * slash. /playground/ is a resolve() call since 13-08 landed the route; the
 * other two literal pathnames are typed ResolvedPathname rather than built
 * with resolve() because those routes do not exist yet - 13-10 lands
 * /sandbox/ and 13-12 /my-configs/ - and resolve() is typed against the
 * routes on disk. The plan that lands each route swaps its literal for a
 * resolve() call in the same commit.
 */
export const SECTIONS: readonly NavItem[] = [
  { id: "playground", label: "PLAYGROUND", href: resolve("/playground/") },
  { id: "sandbox", label: "SANDBOX", href: "/sandbox/" },
  { id: "my-configs", label: "MY CONFIGS", href: "/my-configs/" },
];

export interface ShellFill {
  variant: "intro" | "app";
  /** Which nav item is current. Unused by the intro. */
  section?: Section;
  /** The context bar's left zone, as the PDF writes it: ["PLAYGROUND", "CONFIGURATIONS"]. */
  breadcrumb?: readonly string[];
  /** The context bar's centre zone: a sentence, or a snippet for the dotted draft line. */
  status?: string | Snippet;
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
  /** The intro header's secondary link (page 1's Quick guide). 13-07's. */
  secondary?: Snippet;
  /** The connection control. Reserved: 13-11 fills it from slotStateOf and capabilityOf. */
  connection?: Snippet;
  /** The footer's Device actions. Reserved: 13-11 fills it. */
  deviceActions?: Snippet;
}

export const shell = $state.raw<{ fill: ShellFill | undefined }>({
  fill: undefined,
});

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
