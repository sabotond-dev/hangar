// The Sandbox editor's model: one surface, one SELECTION SET (change 13A: an ordered list of ids;
// `selected` is the one region while the set has one), one mode, one armed kind, one keyboard
// focus cell, the history, the remembered kind defaults (13B), and the field states that let an
// invalid keystroke stay on screen without reaching the surface. Pure TypeScript with no browser:
// src/lib/ui/sandbox/ renders and calls it, sandbox-ui.spec.ts drives it in node, no method takes
// a pointer event. The selector is the default tool: a click selects alone, Shift toggles, a click
// on empty clears, a marquee is `selectTouching`; `choose(kind)` arms a kind for every `clickCell`
// (Alt+click fills) until `cancel()`. Every structural command takes the set as one, one entry:
// `moveSelectedTo`, `nudgeSelected`, `editNumber` and the setters, `paste` / `duplicate` (by
// placementFor), and 13B's `alignSelected` / `distributeSelected` / `transformSurface` / `renameElement`.
// Decided at 13-16 / 13.1-03 (13-CONTEXT D-03, D-14 Q4; 13.1-CONTEXT D-03); see .planning/phases/13.1-bench-corrections-four/13.1-03-SUMMARY.md
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { noteName, noteNumber } from "../tune/view";
import type { ClipboardContent } from "./clipboard";
import {
  NO_DEFAULTS,
  SCHEMA_VERSION,
  type KindDefaults,
  type SandboxDefaults,
} from "../store/schema";
import {
  KIND_LABELS,
  TEMPLATE_BUTTON_NAME,
  TEMPLATE_FADER_NAME,
  CC_RANGE,
  CHANNEL_RANGE,
  DISTRIBUTE_NO_ROOM,
  NOTE_RANGE,
  PASTE_AT_CAP,
  PASTE_NO_SPACE,
  VALUE_RANGE,
  WHOLE_NUMBER,
  defaultName,
  lockedDeleteLine,
  lockedMoveLine,
  touchesCcRange,
} from "./copy";
import {
  GEOMETRY_COPY,
  addRegion,
  adjacencyWarnings,
  alignBoxes,
  applyEdits,
  buildCellMap,
  distributeBoxes,
  largestFreeBox,
  placementFor,
  touching,
  transformBox,
  validate,
  type AdjacencyWarning,
  type Alignment,
  type Axis,
  type CellMap,
  type GeometryRules,
  type Problem,
  type RegionEdit,
  type SurfaceTransform,
} from "./geometry";
import { History, fieldKey, type EditKind } from "./history";
import {
  CC_MAX,
  CC_MIN,
  CHANNEL_MAX,
  CHANNEL_MIN,
  CONTINUOUS_MODES,
  GROUP_MAX,
  KNOB_MODES,
  LAST_CELL,
  SURFACE_ELEMENT_CAP,
  SURFACE_SIZE,
  TOUCHES_MAX,
  TOUCHES_MIN,
  VALUE_MAX,
  VALUE_MIN,
  boundingBox,
  ccCeiling,
  cellIndex,
  cloneRegion,
  isPaintOnly,
  lockedOf,
  maxOf,
  minOf,
  orientationOf,
  outputOf,
  springValueOf,
  touchesOf,
  type Box,
  type ButtonOutput,
  type ElementKind,
  type Orientation,
  type Region,
  type RegionMode,
  type Speed,
  type Surface,
  withBrightness,
} from "./model";

export type { Box };

export type Mode = "edit" | "play";

export type Cell = { readonly col: number; readonly row: number };

/** What the next click on the plate will do: select (the selector), or place the armed kind. */
export type Placement =
  | { readonly kind: "idle" }
  | { readonly kind: "element"; readonly type: ElementKind };

/**
 * The typed fields the inspector renders, in the model's names: the three MIDI fields, and
 * since change 10B the min, the max, a fader's spring value and a button's note - the note
 * is the `cc` field read and typed as a name or a number (view.ts's noteNumber).
 */
export type NumericField =
  | "cc"
  | "cc2"
  | "channel"
  | "min"
  | "max"
  | "springValue"
  | "note";

export const NUMERIC_FIELDS: readonly NumericField[] = [
  "cc",
  "cc2",
  "channel",
  "min",
  "max",
  "springValue",
  "note",
];

/** A field showing typed text the model refused, with the message that stays until corrected. */
export type FieldProblem = {
  readonly text: string;
  readonly message: string;
};

export type FieldProblems = Partial<Record<NumericField, FieldProblem>>;

/** The outcome of a click, for the plate's status line. */
export type ClickOutcome =
  | { readonly kind: "placed"; readonly region: Region }
  | { readonly kind: "selected"; readonly region: Region }
  | { readonly kind: "deselected"; readonly region: Region }
  | { readonly kind: "cleared" }
  | { readonly kind: "kept" }
  | { readonly kind: "refused"; readonly message: string }
  | { readonly kind: "play" };

/** The outcome of a command on the selection set (change 13A): done with a count, refused with its line, or nothing to do. */
export type CommandOutcome =
  | { readonly kind: "done"; readonly count: number }
  | { readonly kind: "refused"; readonly message: string }
  | { readonly kind: "nothing" };

/** The default region each kind places. */
export const DEFAULT_SIZES: Readonly<
  Record<ElementKind, { readonly w: number; readonly h: number }>
> = {
  fader: { w: 2, h: 6 },
  button: { w: 2, h: 2 },
  knob: { w: 3, h: 3 },
  xy: { w: 3, h: 3 },
  blank: { w: 1, h: 1 },
};

/**
 * The hotkeys (change 10A, answer 2): one lower-case letter per kind arms it, exactly as the
 * palette row does; SELECTOR_KEY (or Escape) returns to the selector. The route's window listener
 * reads them and never while a text field has focus.
 */
export const HOTKEYS: Readonly<Record<ElementKind, string>> = {
  fader: "f",
  button: "b",
  xy: "x",
  knob: "k",
  blank: "l",
};

export const SELECTOR_KEY = "v";

/** The kind a key arms, or undefined: `kindForKey("F")` is a fader. */
export function kindForKey(key: string): ElementKind | undefined {
  const lower = key.toLowerCase();
  for (const kind of Object.keys(HOTKEYS) as ElementKind[]) {
    if (HOTKEYS[kind] === lower) return kind;
  }
  return undefined;
}

/**
 * The four colours new regions cycle through, RGB444 levels (13.1-03, D-03).
 * The first two are PDF page 3's, measured at its 1500 render:
 *   - lime: the action colour, #DCFF71 = 220,255,113, on the lattice 13,15,7
 *     (221,255,119) - Filter's, and the colour every region took before this.
 *   - teal: Space's 1px boundary stroke samples #74b9aa (116,185,170) at
 *     x 900 / y 500 of the render; on the lattice 7,11,10 (119,187,170). The
 *     plan's starting point was 3,11,11 (51,187,187); the page is greener.
 * The last two are PROPOSED in the same key, not the page's, and the gate's
 * bench row asks (13.1-CONTEXT question 4):
 *   - amber 15,10,3 (255,170,51); - violet 10,7,15 (170,119,255).
 */
export const PALETTE: readonly (readonly [number, number, number])[] = [
  [13, 15, 7],
  [7, 11, 10],
  [15, 10, 3],
  [10, 7, 15],
];

/** The action colour on the RGB444 lattice, `PALETTE[0]`: the template's, the picker's reset and the first element's. */
export const DEFAULT_COLOUR: readonly [number, number, number] = PALETTE[0];

/**
 * The auto-numbered name (change 13A, the one rule for an add, a paste and a duplicate; 13B's
 * to generalise): the kind's label and the lowest number no region on the list carries -
 * `Fader 2` beside `Fader 1`, `Fader 1` again once it is gone.
 */
export function autoName(
  kind: ElementKind,
  regions: readonly Region[],
): string {
  const label = KIND_LABELS[kind];
  const taken = new Set(regions.map((r) => r.name));
  for (let n = 1; ; n += 1) {
    const name = defaultName(label, n);
    if (!taken.has(name)) return name;
  }
}

/** Everything a component reads, as one immutable value replaced on every change. */
export type EditorState = {
  readonly surface: Surface;
  /** The one selected id while the set has exactly one; undefined for none or several. */
  readonly selectedId: string | undefined;
  readonly selected: Region | undefined;
  /** The selection set (change 13A), in the order it was made. */
  readonly selection: readonly string[];
  /** The set's regions, in the surface's order. */
  readonly selectedRegions: readonly Region[];
  readonly mode: Mode;
  readonly placement: Placement;
  readonly focus: Cell;
  readonly fields: FieldProblems;
  /**
   * What every numeric field shows: the model's number, or the refused text
   * while a keystroke stands refused. In the state rather than read through
   * a method, so a component re-renders a field when the selection moves -
   * a plain method call on a non-reactive object is invisible to a template.
   * Over a set whose values differ the text is empty and the field is in `mixed`.
   */
  readonly texts: Readonly<Record<NumericField, string>>;
  readonly mixed: readonly NumericField[];
  /** An orientation the geometry refused, with its message; cleared by the next accepted edit. */
  readonly orientationProblem: string | undefined;
  /** A touch count the pad's controllers refused (change 11), with its line; cleared the same way. */
  readonly touchesProblem: string | undefined;
  readonly warnings: readonly AdjacencyWarning[];
  readonly cellMap: CellMap;
  readonly atCap: boolean;
  readonly depth: number;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
};

export type EditorOptions = {
  readonly rules?: GeometryRules;
  /** Called after every change with the new state. */
  readonly onchange?: (state: EditorState) => void;
  /** The remembered defaults per kind (change 13B), read from the store by the route. */
  readonly defaults?: SandboxDefaults;
  /** Called with the defaults whenever they change - a single element's field edited, or the reset - so the route stores them. */
  readonly ondefaults?: (defaults: SandboxDefaults) => void;
};

export { NO_DEFAULTS };

/**
 * The fields that stick per kind (change 13B, suggestion 8): the ones the readings named, and
 * only on the kind that has them. The controller, the colour, the orientation, the name and
 * the geometry never stick; a blank has nothing to remember.
 */
export const REMEMBERED_FIELDS: Readonly<
  Record<ElementKind, readonly (keyof KindDefaults)[]>
> = {
  fader: ["channel", "min", "max", "mode", "speed", "spring", "springValue"],
  xy: ["channel", "min", "max", "mode", "speed", "touches"],
  knob: ["channel", "min", "max", "mode"],
  button: ["channel", "min", "max", "latch", "output", "group", "note"],
  blank: [],
};

/** A region's remembered fields as a kind's record: each one present on the region, `note` its controller while it sends a note. */
export function rememberKind(region: Region): KindDefaults {
  const out: Record<string, unknown> = {};
  for (const field of REMEMBERED_FIELDS[region.kind]) {
    const value =
      field === "note"
        ? outputOf(region) === "note"
          ? region.cc
          : undefined
        : region[field];
    if (value !== undefined) out[field] = value;
  }
  return out as KindDefaults;
}

/**
 * A new region with its kind's remembered fields applied: only the kind's own fields, only a mode
 * the kind offers; a button on Note takes the remembered note as its controller; an XY pad's
 * controllers stay under the ceiling its remembered touch count allows.
 */
export function withKindDefaults(
  region: Region,
  defaults: KindDefaults | undefined,
): Region {
  if (defaults === undefined) return region;
  const out: Record<string, unknown> = { ...region };
  for (const field of REMEMBERED_FIELDS[region.kind]) {
    const value = defaults[field];
    if (value === undefined || field === "note") continue;
    if (field === "mode") {
      const offered = region.kind === "knob" ? KNOB_MODES : CONTINUOUS_MODES;
      if (!offered.includes(value as RegionMode)) continue;
    }
    out[field] = value;
  }
  let next = out as Region;
  if (next.kind === "button" && outputOf(next) === "note") {
    if (defaults.note !== undefined) next = { ...next, cc: defaults.note };
  }
  if (next.kind === "xy") {
    const ceiling = ccCeiling(touchesOf(next));
    const cc = Math.max(CC_MIN, Math.min(next.cc, ceiling - 1));
    next = { ...next, cc, cc2: Math.min(ceiling, cc + 1) };
  }
  return next;
}

const clampCell = (n: number): number =>
  Math.min(LAST_CELL, Math.max(0, Math.trunc(n)));

/** The coalesce key of a pointer drag - sealed on release, so one drag is one entry. */
const dragKey = (selectionKey: string): string => `drag:${selectionKey}`;

/** The coalesce key of the arrows - a held key is one entry until the plate's key-up commits. */
const arrowKey = (selectionKey: string, what: "nudge" | "grow"): string =>
  `${what}:${selectionKey}`;

const sameBox = (a: Box, b: Box): boolean =>
  a.col === b.col && a.row === b.row && a.w === b.w && a.h === b.h;

const boxOf = (r: Region): Box => ({ col: r.col, row: r.row, w: r.w, h: r.h });

/** The edit kinds a single element's field edit is remembered under (change 13B): a typed MIDI field, an option, the toggle. */
const REMEMBERED_KINDS: readonly EditKind[] = ["midi", "option", "latch"];

export class SandboxEditor {
  private _surface: Surface;
  private _selection: readonly string[] = [];
  private _mode: Mode = "edit";
  private _placement: Placement = { kind: "idle" };
  private _focus: Cell = { col: 0, row: 0 };
  private _fields: FieldProblems = {};
  private _orientationProblem: string | undefined = undefined;
  private _touchesProblem: string | undefined = undefined;
  private readonly rules: GeometryRules;
  private readonly onchange: ((state: EditorState) => void) | undefined;
  private readonly ondefaults:
    | ((defaults: SandboxDefaults) => void)
    | undefined;
  /** The remembered defaults per kind (change 13B), the same shape the store keeps. */
  private _defaults: SandboxDefaults;
  private minted = 0;
  /** Regions this editor has created, for the palette (header, last paragraph). */
  private created = 0;
  readonly history = new History();

  constructor(surface: Surface, options: EditorOptions = {}) {
    this._surface = surface;
    this.rules = options.rules ?? {};
    this.onchange = options.onchange;
    this.ondefaults = options.ondefaults;
    this._defaults = options.defaults ?? NO_DEFAULTS;
  }

  // -------------------------------------------------------------------------
  // Reading.

  get surface(): Surface {
    return this._surface;
  }

  get selectedId(): string | undefined {
    return this._selection.length === 1 ? this._selection[0] : undefined;
  }

  get selected(): Region | undefined {
    const id = this.selectedId;
    return id === undefined
      ? undefined
      : this._surface.regions.find((r) => r.id === id);
  }

  /** The selection set, in the order it was made (change 13A). */
  get selection(): readonly string[] {
    return this._selection;
  }

  /** The set's regions, in the surface's order. */
  get selectedRegions(): readonly Region[] {
    if (this._selection.length === 0) return [];
    const set = new Set(this._selection);
    return this._surface.regions.filter((r) => set.has(r.id));
  }

  get mode(): Mode {
    return this._mode;
  }

  get placement(): Placement {
    return this._placement;
  }

  get focus(): Cell {
    return this._focus;
  }

  get fields(): FieldProblems {
    return this._fields;
  }

  get atCap(): boolean {
    return (
      this._surface.regions.length >= (this.rules.cap ?? SURFACE_ELEMENT_CAP)
    );
  }

  /** The remembered defaults as they stand (change 13B). */
  get defaults(): SandboxDefaults {
    return this._defaults;
  }

  /** The region holding a cell, if any. */
  regionAt(col: number, row: number): Region | undefined {
    const built = buildCellMap(this._surface.regions);
    if (!built.ok) return undefined;
    const index = built.map[cellIndex(col, row)];
    return index === 0 ? undefined : this._surface.regions[index - 1];
  }

  state(): EditorState {
    const built = buildCellMap(this._surface.regions);
    const texts = Object.fromEntries(
      NUMERIC_FIELDS.map((field) => [field, this.fieldText(field)]),
    ) as Record<NumericField, string>;
    return {
      surface: this._surface,
      selectedId: this.selectedId,
      selected: this.selected,
      selection: this._selection,
      selectedRegions: this.selectedRegions,
      mode: this._mode,
      placement: this._placement,
      focus: this._focus,
      fields: this._fields,
      texts,
      mixed: NUMERIC_FIELDS.filter((field) => this.isMixed(field)),
      orientationProblem: this._orientationProblem,
      touchesProblem: this._touchesProblem,
      warnings: adjacencyWarnings(this._surface.regions),
      cellMap: built.ok ? built.map : [],
      atCap: this.atCap,
      depth: this.history.depth,
      canUndo: this.history.canUndo,
      canRedo: this.history.canRedo,
    };
  }

  private emit(): void {
    this.onchange?.(this.state());
  }

  // -------------------------------------------------------------------------
  // Minting.

  private mint(kind: ElementKind): string {
    for (;;) {
      this.minted += 1;
      const id = `${kind}-${this.minted}`;
      if (!this._surface.regions.some((r) => r.id === id)) return id;
    }
  }

  /** The next palette entry by creation order (header, last paragraph). */
  private nextColour(): [number, number, number] {
    const colour = PALETTE[this.created % PALETTE.length];
    this.created += 1;
    return [colour[0], colour[1], colour[2]];
  }

  /** The lowest controller number no region on the surface sends on yet, from 1. */
  private freeController(): number {
    const used = new Set<number>();
    for (const r of this._surface.regions) {
      if (isPaintOnly(r)) continue;
      used.add(r.cc);
      if (r.cc2 !== undefined) used.add(r.cc2);
    }
    for (let cc = 1; cc <= CC_MAX; cc += 1) if (!used.has(cc)) return cc;
    return CC_MAX;
  }

  private newRegion(
    kind: ElementKind,
    box: Box,
    orientation?: Orientation,
    name?: string,
    colour?: readonly [number, number, number],
  ): Region {
    // A blank sends nothing: its controller and channel are inert (schema.ts).
    const cc = kind === "blank" ? 0 : this.freeController();
    const id = this.mint(kind);
    const region: Region = {
      id,
      name: name ?? autoName(kind, this._surface.regions),
      kind,
      ...box,
      cc,
      channel: CHANNEL_MIN,
      // The palette's next, AFTER the id is minted (W-05): a probe hands a
      // colour in and the cycle does not move.
      colour: colour === undefined ? this.nextColour() : [...colour],
    };
    const shaped: Region =
      kind === "xy"
        ? { ...region, cc2: Math.min(CC_MAX, cc + 1) }
        : kind === "button"
          ? { ...region, latch: false }
          : kind === "fader"
            ? { ...region, orientation: orientation ?? "vertical" }
            : region;
    // The remembered defaults (change 13B): the settings the user last gave this kind.
    return withKindDefaults(shaped, this._defaults.kinds[kind]);
  }

  // -------------------------------------------------------------------------
  // The creation path: arm a kind, click cells until the selector is back (Bible sections 2, 8, 14).

  /** A palette row or its hotkey: arm a kind; it stays armed until `cancel`. False at the cap or in Play. */
  choose(kind: ElementKind): boolean {
    if (this._mode === "play" || this.atCap) return false;
    this._placement = { kind: "element", type: kind };
    this.emit();
    return true;
  }

  /** V or Escape: the selector. */
  cancel(): void {
    if (this._placement.kind === "idle") return;
    this._placement = { kind: "idle" };
    this.emit();
  }

  /** Escape (change 13A): the selector while a kind is armed; otherwise the selection clears - the keyboard's way off the plate. */
  escape(): void {
    if (this._placement.kind !== "idle") {
      this.cancel();
      return;
    }
    if (this._selection.length > 0) this.select(undefined);
  }

  /**
   * The one entry point for a click on the plate, by pointer or by Enter; Shift toggles the held
   * element in the set. With a kind armed, `fill` (Alt+click, change 13B) places the element grown
   * to the largest free rectangle holding the cell - a knob the largest free square, a fader turned
   * along the longer side - and the kind's minimum refuses a rectangle too small for it.
   */
  clickCell(
    col: number,
    row: number,
    shift = false,
    fill = false,
  ): ClickOutcome {
    if (this._mode === "play") return { kind: "play" };
    const at = { col: clampCell(col), row: clampCell(row) };
    this._focus = at;
    const pending = this._placement;

    if (pending.kind === "element") {
      if (this.atCap) {
        this.emit();
        return { kind: "refused", message: GEOMETRY_COPY.cap };
      }
      const size = DEFAULT_SIZES[pending.type];
      const fallback = {
        col: Math.min(at.col, SURFACE_SIZE - size.w),
        row: Math.min(at.row, SURFACE_SIZE - size.h),
        w: size.w,
        h: size.h,
      };
      const filled = fill ? this.fillBox(pending.type, at) : undefined;
      const box = filled ?? fallback;
      const orientation =
        filled !== undefined && pending.type === "fader"
          ? box.w > box.h
            ? "horizontal"
            : "vertical"
          : undefined;
      return this.place(pending.type, box, "place", orientation);
    }

    const holder = this.regionAt(at.col, at.row);
    if (holder !== undefined) {
      if (shift) {
        const removed = this._selection.includes(holder.id);
        this.setSelection(
          removed
            ? this._selection.filter((id) => id !== holder.id)
            : [...this._selection, holder.id],
          at,
        );
        return { kind: removed ? "deselected" : "selected", region: holder };
      }
      this.setSelection([holder.id], at);
      return { kind: "selected", region: holder };
    }
    // The selector on an empty cell: the selection clears, the focus cell stays; with Shift the
    // set is kept (a marquee may follow).
    if (shift) {
      this.emit();
      return { kind: "kept" };
    }
    this.setSelection([], at);
    return { kind: "cleared" };
  }

  /** The fill-to-fit box (change 13B): geometry.ts's largest free rectangle holding the cell, a square for a knob; undefined on a held cell. */
  fillBox(kind: ElementKind, at: Cell): Box | undefined {
    const built = buildCellMap(this._surface.regions);
    if (!built.ok) return undefined;
    return largestFreeBox(at, built.map, kind === "knob");
  }

  private place(
    kind: ElementKind,
    box: Box,
    edit: EditKind,
    orientation?: Orientation,
    name?: string,
  ): ClickOutcome {
    const region = this.newRegion(kind, box, orientation, name);
    const result = addRegion(this._surface, region, this.rules);
    if (!result.ok) {
      // The region was never created: its palette entry goes back, so the
      // next placement is still the next of the cycle. The kind stays armed
      // so the next click can try elsewhere.
      this.created -= 1;
      this.emit();
      return { kind: "refused", message: result.problem.message };
    }
    this.record(edit, this._surface, result.surface, region.id);
    this._surface = result.surface;
    this._selection = [region.id];
    this._fields = {};
    this._orientationProblem = undefined;
    this._touchesProblem = undefined;
    this.emit();
    return { kind: "placed", region };
  }

  private record(
    kind: EditKind,
    before: Surface,
    after: Surface,
    regionId: string | undefined,
    key?: string,
    selection?: readonly string[],
  ): void {
    this.history.push({ kind, before, after, regionId, key, selection });
  }

  // -------------------------------------------------------------------------
  // The keyboard route across the plate: arrows move `focus`, Enter is `mark()` (Bible section 14).

  moveFocus(dcol: number, drow: number): void {
    this._focus = {
      col: clampCell(this._focus.col + dcol),
      row: clampCell(this._focus.row + drow),
    };
    this.emit();
  }

  setFocus(cell: Cell): void {
    this._focus = { col: clampCell(cell.col), row: clampCell(cell.row) };
    this.emit();
  }

  /** Enter on the plate: the same click, at the focus cell; Alt+Enter the fill-to-fit click (change 13B). */
  mark(fill = false): ClickOutcome {
    return this.clickCell(this._focus.col, this._focus.row, false, fill);
  }

  // -------------------------------------------------------------------------
  // Selection and mode: Play locks every structural method and keeps the selection and the history (Bible section 8).

  /**
   * The set, normalised: ids the surface has, each once, in the order given. Never an entry in
   * the history. The focus cell follows the set's origin (its bounding box) unless a click set it.
   */
  private setSelection(ids: readonly string[], focus?: Cell): void {
    const seen = new Set<string>();
    const next: string[] = [];
    for (const id of ids) {
      if (seen.has(id) || !this._surface.regions.some((r) => r.id === id))
        continue;
      seen.add(id);
      next.push(id);
    }
    this._selection = next;
    this._fields = {};
    this._orientationProblem = undefined;
    this._touchesProblem = undefined;
    this.history.seal();
    const origin = boundingBox(this.selectedRegions.map(boxOf));
    if (focus !== undefined) this._focus = focus;
    else if (origin !== undefined)
      this._focus = { col: origin.col, row: origin.row };
    this.emit();
  }

  /** From the element list or the plate: one region alone, or none. */
  select(id: string | undefined): void {
    if (id !== undefined && !this._surface.regions.some((r) => r.id === id)) {
      return;
    }
    this.setSelection(id === undefined ? [] : [id]);
  }

  /** Shift and a click on the list or the plate (change 13A): the region joins the set, or leaves it. */
  toggleSelect(id: string): void {
    if (!this._surface.regions.some((r) => r.id === id)) return;
    this.setSelection(
      this._selection.includes(id)
        ? this._selection.filter((held) => held !== id)
        : [...this._selection, id],
    );
  }

  /** Ctrl+A: every unlocked element, in the surface's order. */
  selectAll(): void {
    this.setSelection(
      this._surface.regions.filter((r) => !lockedOf(r)).map((r) => r.id),
    );
  }

  /**
   * The marquee's release (change 13A): every unlocked element the box TOUCHES - one cell in
   * common is enough - becomes the set; with `add` it joins the set. Returns how many the box hit.
   */
  selectTouching(box: Box, add = false): number {
    if (this._mode === "play") return 0;
    const hit = touching(box, this._surface.regions)
      .filter((r) => !lockedOf(r))
      .map((r) => r.id);
    this.setSelection(add ? [...this._selection, ...hit] : hit, this._focus);
    return hit.length;
  }

  /**
   * Tab and Shift+Tab on the plate (change 13A): the selection walks the elements in the
   * surface's order and wraps - from the last of the set forward, from the first back; with
   * nothing selected the first (or the last) element. Alone, never a set. False with no element.
   */
  selectNext(step: 1 | -1): boolean {
    const regions = this._surface.regions;
    if (regions.length === 0) return false;
    let index: number;
    if (this._selection.length === 0) {
      index = step > 0 ? 0 : regions.length - 1;
    } else {
      const from = step > 0 ? this._selection.at(-1) : this._selection[0];
      const at = regions.findIndex((r) => r.id === from);
      index = (at + step + regions.length) % regions.length;
    }
    this.setSelection([regions[index].id]);
    return true;
  }

  /** Edit or Play. Selection and history survive in both directions. */
  setMode(mode: Mode): void {
    if (mode === this._mode) return;
    this._mode = mode;
    this._placement = { kind: "idle" };
    this.history.seal();
    this.emit();
  }

  // -------------------------------------------------------------------------
  // The inspector's edits, every one through geometry.ts: the model is never transiently invalid (Bible section 8; geometry.ts rule 5).

  /** The coalesce key's name for the set: the one id, or the ids joined. */
  private selectionKey(): string {
    return this._selection.join("+");
  }

  /**
   * One patch on EVERY member of the set as one entry (change 13A): geometry.ts's applyEdits
   * validates the whole result, so a refusal on any member refuses the whole edit with its line
   * and the surface stays the same object. The one-region case is the set of one.
   */
  private applyPatch(
    patch: Partial<Omit<Region, "id">>,
    kind: EditKind,
    key?: string,
  ): Problem | undefined {
    return this.applyPatches(
      this._selection.map((id) => [id, patch] as const),
      kind,
      key,
    );
  }

  private applyPatches(
    edits: readonly RegionEdit[],
    kind: EditKind,
    key?: string,
  ): Problem | undefined {
    if (this._mode === "play" || edits.length === 0) return undefined;
    const result = applyEdits(this._surface, edits, this.rules);
    if (!result.ok) return result.problem;
    this.record(
      kind,
      this._surface,
      result.surface,
      this.selectedId,
      key,
      this._selection,
    );
    this._surface = result.surface;
    // The remembered defaults (change 13B): a field edited on ONE element is remembered for its kind; a multi-edit is not.
    if (REMEMBERED_KINDS.includes(kind) && edits.length === 1) {
      const region = result.surface.regions.find((r) => r.id === edits[0][0]);
      if (region !== undefined) this.remember(region);
    }
    return undefined;
  }

  /** The kind's record replaced by this region's remembered fields, and the route told. */
  private remember(region: Region): void {
    if (region.kind === "blank") return;
    this._defaults = {
      schema: SCHEMA_VERSION,
      kinds: { ...this._defaults.kinds, [region.kind]: rememberKind(region) },
    };
    this.ondefaults?.(this._defaults);
  }

  /** Reset defaults (change 13B): every kind back to the model's own. Not a surface edit - no entry, and Undo does not take it back. */
  resetDefaults(): void {
    this._defaults = NO_DEFAULTS;
    this.ondefaults?.(this._defaults);
  }

  /**
   * A MIDI field's text, as typed, applied to every selected element. A refusal leaves the
   * surface as it was and records the text and the message for the field.
   */
  editNumber(field: NumericField, text: string): boolean {
    if (this._mode === "play" || this._selection.length === 0) return false;
    const refuse = (message: string): false => {
      this._fields = { ...this._fields, [field]: { text, message } };
      this.emit();
      return false;
    };
    const trimmed = text.trim();
    let patch: Partial<Omit<Region, "id">>;
    if (field === "note") {
      // A name or a number, both through view.ts's one reader; the note is the cc field.
      const n = noteNumber(trimmed);
      if (n === undefined) return refuse(NOTE_RANGE);
      patch = { cc: n };
    } else {
      if (!/^-?[0-9]+$/.test(trimmed)) return refuse(WHOLE_NUMBER);
      const n = Number.parseInt(trimmed, 10);
      switch (field) {
        case "cc":
        case "cc2": {
          if (n < CC_MIN || n > CC_MAX) return refuse(CC_RANGE);
          // Change 11: on a pad with fingers, the last finger's pair stays inside 127 - on every member.
          for (const region of this.selectedRegions) {
            const touches = touchesOf(region);
            if (n > ccCeiling(touches))
              return refuse(touchesCcRange(touches, ccCeiling(touches)));
          }
          patch = field === "cc" ? { cc: n } : { cc2: n };
          break;
        }
        case "channel":
          if (n < CHANNEL_MIN || n > CHANNEL_MAX) return refuse(CHANNEL_RANGE);
          patch = { channel: n };
          break;
        case "min":
        case "max":
        case "springValue":
          if (n < VALUE_MIN || n > VALUE_MAX) return refuse(VALUE_RANGE);
          patch =
            field === "min"
              ? { min: n }
              : field === "max"
                ? { max: n }
                : { springValue: n };
          break;
      }
    }
    const problem = this.applyPatch(
      patch,
      "midi",
      fieldKey(this.selectionKey(), field),
    );
    if (problem !== undefined) return refuse(problem.message);
    const rest: FieldProblems = { ...this._fields };
    delete rest[field];
    this._fields = rest;
    this.emit();
    return true;
  }

  /** The first locked member of the set, for the refusals a move or a delete makes. */
  private lockedMember(): Region | undefined {
    return this.selectedRegions.find(lockedOf);
  }

  /**
   * One box per member of the set, from a drag's release or an arrow: the same applyEdits as
   * every edit, under `move` or `resize`, coalesced under `key` and sealed when `seal` says (a
   * drag is one entry; a held arrow is one entry until the plate's key-up commits). Refuses
   * silently in Play or with nothing selected; the same boxes are no edit and no entry; a locked
   * member refuses the whole command with its line. Returns the problem when the boxes are
   * refused - every region is then exactly as it was.
   */
  private commitBoxes(
    boxes: readonly RegionEdit[],
    kind: "move" | "resize",
    key: string,
    seal: boolean,
  ): Problem | undefined {
    if (this._mode === "play" || boxes.length === 0) return undefined;
    const locked = this.lockedMember();
    if (locked !== undefined) {
      if (seal) this.history.seal();
      return { rule: "locked", message: lockedMoveLine(locked.name) };
    }
    const unchanged = boxes.every(([id, box]) => {
      const region = this._surface.regions.find((r) => r.id === id) as Region;
      return sameBox(region, box as Box);
    });
    if (unchanged) return undefined;
    const problem = this.applyPatches(boxes, kind, key);
    if (seal) this.history.seal();
    if (problem !== undefined) return problem;
    // An accepted box: the focus cell follows the set's origin as select() does.
    this._fields = {};
    this._orientationProblem = undefined;
    this._touchesProblem = undefined;
    const origin = boundingBox(this.selectedRegions.map(boxOf)) as Box;
    this._focus = { col: clampCell(origin.col), row: clampCell(origin.row) };
    this.emit();
    return undefined;
  }

  /** Every member's box shifted by a delta - the set moves as one, its layout kept. */
  private shifted(dcol: number, drow: number): RegionEdit[] {
    return this.selectedRegions.map(
      (r): RegionEdit => [
        r.id,
        { col: r.col + dcol, row: r.row + drow, w: r.w, h: r.h },
      ],
    );
  }

  /** A handle drag's box, on release: one `resize` entry; a single selection only. Column and row arrive ZERO-BASED. */
  resizeSelectedTo(box: Box): Problem | undefined {
    const id = this.selectedId;
    if (id === undefined) return undefined;
    return this.commitBoxes([[id, box]], "resize", dragKey(id), true);
  }

  /**
   * A body drag's origin, on release (change 10A): one `move` entry, the size kept. For a set
   * (change 13A) the cell is where the set's bounding box goes, every member keeping its place in it.
   */
  moveSelectedTo(cell: Cell): Problem | undefined {
    const origin = boundingBox(this.selectedRegions.map(boxOf));
    if (origin === undefined) return undefined;
    return this.commitBoxes(
      this.shifted(cell.col - origin.col, cell.row - origin.row),
      "move",
      dragKey(this.selectionKey()),
      true,
    );
  }

  /** An arrow with a selection (change 10A): the set one cell over, coalesced until `commitField`. */
  nudgeSelected(dcol: number, drow: number): Problem | undefined {
    if (this._selection.length === 0) return undefined;
    return this.commitBoxes(
      this.shifted(dcol, drow),
      "move",
      arrowKey(this.selectionKey(), "nudge"),
      false,
    );
  }

  /** Shift and an arrow (change 10A): the region one cell wider or taller (or narrower, shorter), coalesced until `commitField`; a single selection only. */
  resizeSelectedBy(dw: number, dh: number): Problem | undefined {
    const region = this.selected;
    if (region === undefined) return undefined;
    return this.commitBoxes(
      [
        [
          region.id,
          {
            col: region.col,
            row: region.row,
            w: region.w + dw,
            h: region.h + dh,
          },
        ],
      ],
      "resize",
      arrowKey(region.id, "grow"),
      false,
    );
  }

  /** A region's own text for a field. */
  private textOf(region: Region, field: NumericField): string {
    switch (field) {
      case "cc":
        return String(region.cc);
      case "cc2":
        return region.cc2 === undefined ? "" : String(region.cc2);
      case "channel":
        return String(region.channel);
      case "min":
        return String(minOf(region));
      case "max":
        return String(maxOf(region));
      case "springValue":
        return String(springValueOf(region));
      case "note":
        return noteName(region.cc);
    }
  }

  /** True when the set's members do not agree on a field (change 13A: the inspector's Mixed). */
  private isMixed(field: NumericField): boolean {
    const regions = this.selectedRegions;
    if (regions.length < 2) return false;
    const first = this.textOf(regions[0], field);
    return regions.some((r) => this.textOf(r, field) !== first);
  }

  /** The value a field shows: the typed text while refused, else the model's; empty over a set that differs. */
  fieldText(field: NumericField): string {
    const problem = this._fields[field];
    if (problem !== undefined) return problem.text;
    const regions = this.selectedRegions;
    if (regions.length === 0 || this.isMixed(field)) return "";
    return this.textOf(regions[0], field);
  }

  /** The coalescing boundary (history.ts section 2): focus left the field, Enter, or an arrow released. */
  commitField(): void {
    this.history.seal();
  }

  /** The name: a single selection only (a set has no one name). */
  rename(name: string): void {
    const id = this.selectedId;
    if (id === undefined) return;
    this.applyPatch({ name }, "rename", fieldKey(id, "name"));
    this.emit();
  }

  /** True when every member of the set is the kind. */
  private allOfKind(kind: ElementKind): boolean {
    const regions = this.selectedRegions;
    return regions.length > 0 && regions.every((r) => r.kind === kind);
  }

  setOrientation(orientation: Orientation): boolean {
    if (!this.allOfKind("fader")) return false;
    if (this.selectedRegions.every((r) => orientationOf(r) === orientation))
      return true;
    const problem = this.applyPatch({ orientation }, "orientation");
    if (problem !== undefined) {
      this._orientationProblem = problem.message;
      this.emit();
      return false;
    }
    this._orientationProblem = undefined;
    this._touchesProblem = undefined;
    this.emit();
    return true;
  }

  /** The button's Toggle (the schema's `latch`). */
  setLatch(latch: boolean): void {
    if (!this.allOfKind("button")) return;
    this.applyPatch({ latch }, "latch");
    this.emit();
  }

  // -------------------------------------------------------------------------
  // The change 10B options, each one entry under `option`: a select or a checkbox is one Undo.

  /** A fader's or an XY pad's Absolute / Relative, a knob's four; refused on a kind that has none or a mode it does not offer. (`setMode` is Edit / Play.) */
  setRegionMode(mode: RegionMode): boolean {
    const regions = this.selectedRegions;
    if (regions.length === 0) return false;
    const offers = (region: Region): boolean => {
      const offered =
        region.kind === "knob"
          ? KNOB_MODES
          : region.kind === "fader" || region.kind === "xy"
            ? CONTINUOUS_MODES
            : [];
      return offered.includes(mode);
    };
    if (!regions.every(offers)) return false;
    this.applyPatch({ mode }, "option");
    this.emit();
    return true;
  }

  /** A relative fader's or XY pad's Half / Full. */
  setSpeed(speed: Speed): void {
    const regions = this.selectedRegions;
    if (
      regions.length === 0 ||
      !regions.every((r) => r.kind === "fader" || r.kind === "xy")
    )
      return;
    this.applyPatch({ speed }, "option");
    this.emit();
  }

  /** A fader's spring. */
  setSpring(spring: boolean): void {
    if (!this.allOfKind("fader")) return;
    this.applyPatch({ spring }, "option");
    this.emit();
  }

  /** A button's CC / Note output; the `cc` field is the note under Note. */
  setOutput(output: ButtonOutput): void {
    if (!this.allOfKind("button")) return;
    if (this.selectedRegions.every((r) => outputOf(r) === output)) return;
    this.applyPatch({ output }, "option");
    this._fields = {};
    this.emit();
  }

  /**
   * An XY pad's touch count, 1 to 5 (change 11): one entry; refused off the kind or the range,
   * and refused with its line - kept in the state until the next accepted edit - when a pad's
   * controller or its second would put the last finger's pair past 127.
   */
  setTouches(touches: number): boolean {
    if (!this.allOfKind("xy")) return false;
    if (
      !Number.isInteger(touches) ||
      touches < TOUCHES_MIN ||
      touches > TOUCHES_MAX
    )
      return false;
    const ceiling = ccCeiling(touches);
    const over = this.selectedRegions.some(
      (r) => r.cc > ceiling || (r.cc2 ?? 0) > ceiling,
    );
    if (over) {
      if (this._mode === "play") return false;
      this._touchesProblem = touchesCcRange(touches, ceiling);
      this.emit();
      return false;
    }
    this.applyPatch({ touches }, "option");
    this._touchesProblem = undefined;
    this.emit();
    return true;
  }

  /** A button's radio group, 0 (none) to 8. */
  setGroup(group: number): void {
    if (!this.allOfKind("button")) return;
    if (!Number.isInteger(group) || group < 0 || group > GROUP_MAX) return;
    this.applyPatch({ group }, "option");
    this.emit();
  }

  /**
   * The whole surface's brightness (1..255; change 5): a structural edit like a recolour, coalesced
   * under one key so typed digits are one entry, refused in Play, a no-op at the same value. The
   * value is validated by the field (catalog/brightness.ts parseBrightness) before it reaches here.
   */
  setBrightness(brightness: number): void {
    if (this._mode === "play") return;
    const after = withBrightness(this._surface, brightness);
    if (after === this._surface) return;
    this.record(
      "brightness",
      this._surface,
      after,
      this.selectedId,
      "field:surface:brightness",
      this._selection,
    );
    this._surface = after;
    this.emit();
  }

  /** RGB444 levels, from the swatch's picker, on every member of the set. */
  setColour(colour: readonly [number, number, number]): void {
    if (this._selection.length === 0) return;
    this.applyPatch(
      { colour: [colour[0], colour[1], colour[2]] },
      "recolour",
      fieldKey(this.selectionKey(), "colour"),
    );
    this.emit();
  }

  // -------------------------------------------------------------------------
  // Lock (change 13A, suggestion 6): a locked element is not moved, resized or deleted; its fields still edit.

  /** Ctrl+L or the inspector's checkbox: the set locks, or unlocks when every member is locked. One entry. */
  toggleLock(): { locked: boolean; count: number } | undefined {
    const regions = this.selectedRegions;
    if (this._mode === "play" || regions.length === 0) return undefined;
    const locked = !regions.every(lockedOf);
    this.applyPatch({ locked: locked ? true : undefined }, "lock");
    this.emit();
    return { locked, count: regions.length };
  }

  /** The inspector's checkbox, as a value. */
  setLocked(locked: boolean): void {
    const regions = this.selectedRegions;
    if (this._mode === "play" || regions.length === 0) return;
    if (regions.every((r) => lockedOf(r) === locked)) return;
    this.applyPatch({ locked: locked ? true : undefined }, "lock");
    this.emit();
  }

  // -------------------------------------------------------------------------
  // The clipboard and the duplicate (change 13A): a group lands whole by placementFor's rule, keeps its settings and colour, and takes auto-numbered names.

  /** Ctrl+C: the set as clones, in the surface's order; undefined with nothing selected. The caller holds it (clipboard.ts). */
  copySelection(): ClipboardContent | undefined {
    const regions = this.selectedRegions;
    if (regions.length === 0) return undefined;
    return { regions: regions.map(cloneRegion) };
  }

  /**
   * Land a group of regions (a paste, a duplicate): the cap first, then the placement - the focus
   * cell if the group fits there, else one cell down-right of its own origin, else the first
   * free origin in reading order; refused whole with the line when nowhere fits. Every landed
   * region is minted afresh, named by autoName in turn, and the landed set becomes the selection.
   */
  private land(
    regions: readonly Region[],
    kind: "paste" | "duplicate",
  ): "done" | "cap" | "no-space" {
    const cap = this.rules.cap ?? SURFACE_ELEMENT_CAP;
    if (this._surface.regions.length + regions.length > cap) return "cap";
    const built = buildCellMap(this._surface.regions);
    if (!built.ok) return "no-space";
    const at = placementFor(regions.map(boxOf), this._focus, built.map);
    if (at === undefined) return "no-space";
    const origin = boundingBox(regions.map(boxOf)) as Box;
    let surface = this._surface;
    const landed: Region[] = [];
    for (const source of regions) {
      const region: Region = {
        ...cloneRegion(source),
        id: this.mint(source.kind),
        name: autoName(source.kind, surface.regions),
        col: source.col - origin.col + at.col,
        row: source.row - origin.row + at.row,
      };
      const result = addRegion(surface, region, this.rules);
      // placementFor proved every cell free; a refusal here would be a programming error.
      if (!result.ok) return "no-space";
      surface = result.surface;
      landed.push(region);
    }
    const ids = landed.map((r) => r.id);
    this.record(kind, this._surface, surface, ids[0], undefined, ids);
    this._surface = surface;
    this.setSelection(ids);
    return "done";
  }

  /** Ctrl+V: the clipboard's regions land by the placement rule; refused with its line when nothing fits or the cap would be passed. */
  paste(content: ClipboardContent | undefined): CommandOutcome {
    if (
      this._mode === "play" ||
      content === undefined ||
      content.regions.length === 0
    )
      return { kind: "nothing" };
    const landed = this.land(content.regions, "paste");
    if (landed === "done")
      return { kind: "done", count: content.regions.length };
    return {
      kind: "refused",
      message: landed === "cap" ? PASTE_AT_CAP : PASTE_NO_SPACE,
    };
  }

  /** Section 8's rule 4, on the set (change 13A): the copies land by the placement rule, or a named refusal and nothing changed. */
  duplicate():
    | { ok: true; regions: readonly Region[] }
    | { ok: false; reason: "no-space" | "cap" } {
    const regions = this.selectedRegions;
    if (regions.length === 0 || this._mode === "play") {
      return { ok: false, reason: "no-space" };
    }
    const landed = this.land(regions, "duplicate");
    if (landed === "done") return { ok: true, regions: this.selectedRegions };
    return { ok: false, reason: landed };
  }

  /**
   * Delete the set (Bible section 8's own requirement: undoable). One entry under `delete`, or
   * `cut` for Ctrl+X after `copySelection`; refused whole with its line when a member is locked.
   */
  remove(kind: "delete" | "cut" = "delete"): CommandOutcome {
    const regions = this.selectedRegions;
    if (regions.length === 0 || this._mode === "play")
      return { kind: "nothing" };
    const locked = this.lockedMember();
    if (locked !== undefined)
      return { kind: "refused", message: lockedDeleteLine(locked.name) };
    const gone = new Set(this._selection);
    const after: Surface = {
      ...this._surface,
      regions: this._surface.regions.filter((r) => !gone.has(r.id)),
    };
    this.record(
      kind,
      this._surface,
      after,
      this.selectedId,
      undefined,
      this._selection,
    );
    this._surface = after;
    this._selection = [];
    this._fields = {};
    this._orientationProblem = undefined;
    this._touchesProblem = undefined;
    this.emit();
    return { kind: "done", count: regions.length };
  }

  // -------------------------------------------------------------------------
  // Change 13B: the set aligned or spaced out, the whole surface flipped or turned, an element renamed by id.

  /**
   * Align the set (suggestion 3): every member to the set's edge or centre line, sizes kept, one
   * entry under `align` through applyEdits - refused whole with the first line where a member
   * would overlap or is locked; nothing with fewer than two selected or when nothing would move.
   */
  alignSelected(to: Alignment): CommandOutcome {
    const regions = this.selectedRegions;
    if (this._mode === "play" || regions.length < 2) return { kind: "nothing" };
    return this.arrange(regions, alignBoxes(regions.map(boxOf), to), "align");
  }

  /**
   * Space the set out (suggestion 3): equal gaps along the axis, the outermost two fixed, one entry
   * under `distribute`; refused with its own line when the members are wider than the span; nothing
   * with fewer than three selected (two have nothing between them).
   */
  distributeSelected(axis: Axis): CommandOutcome {
    const regions = this.selectedRegions;
    if (this._mode === "play" || regions.length < 3) return { kind: "nothing" };
    const boxes = distributeBoxes(regions.map(boxOf), axis);
    if (boxes === undefined)
      return { kind: "refused", message: DISTRIBUTE_NO_ROOM };
    return this.arrange(regions, boxes, "distribute");
  }

  /** One box per member as one entry: the lock's refusal first, the same boxes no entry, else applyEdits' verdict. */
  private arrange(
    regions: readonly Region[],
    boxes: readonly Box[],
    kind: "align" | "distribute",
  ): CommandOutcome {
    const locked = this.lockedMember();
    if (locked !== undefined)
      return { kind: "refused", message: lockedMoveLine(locked.name) };
    if (regions.every((r, i) => sameBox(r, boxes[i])))
      return { kind: "nothing" };
    const edits = regions.map((r, i): RegionEdit => [r.id, boxes[i]]);
    const problem = this.applyPatches(edits, kind);
    if (problem !== undefined)
      return { kind: "refused", message: problem.message };
    this._fields = {};
    this._orientationProblem = undefined;
    this._touchesProblem = undefined;
    const origin = boundingBox(this.selectedRegions.map(boxOf)) as Box;
    this._focus = { col: origin.col, row: origin.row };
    this.emit();
    return { kind: "done", count: regions.length };
  }

  /**
   * The whole surface flipped left to right, top to bottom, or turned a quarter clockwise
   * (suggestion 4): every region's box through geometry.ts's transformBox, a fader's orientation
   * following a turn, the kinds unchanged; the result re-validated whole (each region and the map)
   * and refused with the first line if it fails - a surface transform is not an element edit, so a
   * locked element moves with it. One entry under `transform`, the selection kept.
   */
  transformSurface(transform: SurfaceTransform): CommandOutcome {
    if (this._mode === "play" || this._surface.regions.length === 0)
      return { kind: "nothing" };
    const regions = this._surface.regions.map((r): Region => {
      const next: Region = { ...r, ...transformBox(boxOf(r), transform) };
      if (transform !== "rotate" || r.kind !== "fader") return next;
      return {
        ...next,
        orientation:
          orientationOf(r) === "vertical" ? "horizontal" : "vertical",
      };
    });
    const after: Surface = { ...this._surface, regions };
    for (const r of regions) {
      const verdict = validate(r, after, this.rules);
      if (!verdict.ok)
        return { kind: "refused", message: verdict.problem.message };
    }
    this.record(
      "transform",
      this._surface,
      after,
      this.selectedId,
      undefined,
      this._selection,
    );
    this._surface = after;
    this._fields = {};
    this._orientationProblem = undefined;
    this._touchesProblem = undefined;
    this.emit();
    return { kind: "done", count: regions.length };
  }

  /**
   * Rename one element by id (suggestion 7, the plate's inline rename): one entry under `rename`,
   * sealed at once - not coalesced with the inspector's field. False in Play, for an unknown id,
   * an empty name or the same name; the selection is not moved.
   */
  renameElement(id: string, name: string): boolean {
    const trimmed = name.trim();
    const region = this._surface.regions.find((r) => r.id === id);
    if (this._mode === "play" || region === undefined || trimmed === "")
      return false;
    if (region.name === trimmed) return false;
    const problem = this.applyPatches([[id, { name: trimmed }]], "rename");
    this.history.seal();
    this.emit();
    return problem === undefined;
  }

  // -------------------------------------------------------------------------
  // History.

  undo(): boolean {
    if (this._mode === "play") return false;
    const step = this.history.undo();
    if (step === undefined) return false;
    this.restore(step.surface, step.selection ?? stepSet(step.select));
    return true;
  }

  redo(): boolean {
    if (this._mode === "play") return false;
    const step = this.history.redo();
    if (step === undefined) return false;
    this.restore(step.surface, step.selection ?? stepSet(step.select));
    return true;
  }

  /** The armed kind survives an undo: a run of placements is undone without re-arming. */
  private restore(surface: Surface, select: readonly string[]): void {
    this._surface = surface;
    this._selection = select.filter((id) =>
      surface.regions.some((r) => r.id === id),
    );
    this._fields = {};
    this._orientationProblem = undefined;
    this._touchesProblem = undefined;
    this.emit();
  }

  // -------------------------------------------------------------------------
  // The empty state's two ways in, and the draft's way back.

  /** The one visible starter action: a fader, the PDF's own first element, at the top-left. */
  starter(): ClickOutcome {
    if (this._mode === "play") return { kind: "play" };
    if (this.atCap) return { kind: "refused", message: GEOMETRY_COPY.cap };
    return this.place(
      "fader",
      { col: 0, row: 0, ...DEFAULT_SIZES.fader },
      "place",
      "vertical",
    );
  }

  /**
   * The template: a fader and a button - the two kinds that fit in every
   * branch of 13-02's answer - named as a template, so an empty surface
   * stays possible. One history entry, so one Undo clears it.
   */
  template(): boolean {
    if (this._mode === "play") return false;
    const fader = this.newRegion(
      "fader",
      { col: 0, row: 0, w: 2, h: 6 },
      "vertical",
      TEMPLATE_FADER_NAME,
    );
    const one = addRegion(this._surface, fader, this.rules);
    if (!one.ok) {
      this.created -= 1;
      return false;
    }
    const button = this.newRegionOn(one.surface, "button", {
      col: 7,
      row: 0,
      w: 2,
      h: 2,
    });
    const two = addRegion(one.surface, button, this.rules);
    if (!two.ok) {
      this.created -= 2;
      return false;
    }
    this.record("template", this._surface, two.surface, fader.id);
    this._surface = two.surface;
    this._selection = [fader.id];
    this._placement = { kind: "idle" };
    this.emit();
    return true;
  }

  /** newRegion against a surface that is not yet this one (the template's second element). */
  private newRegionOn(surface: Surface, kind: ElementKind, box: Box): Region {
    const held = this._surface;
    this._surface = surface;
    try {
      return this.newRegion(kind, box, undefined, TEMPLATE_BUTTON_NAME);
    } finally {
      this._surface = held;
    }
  }

  /** Replace the surface without an entry: a draft recovered on return. */
  load(surface: Surface): void {
    this._surface = surface;
    this.created = surface.regions.length;
    this._selection = [];
    this._placement = { kind: "idle" };
    this._fields = {};
    this._orientationProblem = undefined;
    this._touchesProblem = undefined;
    this.emit();
  }

  /** Save copy's name, and the rename of the surface itself. */
  renameSurface(name: string): void {
    if (name === this._surface.name) return;
    this._surface = { ...this._surface, name };
    this.emit();
  }
}

/** A history step's one id as a set. */
const stepSet = (id: string | undefined): readonly string[] =>
  id === undefined ? [] : [id];
