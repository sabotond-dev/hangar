// The Sandbox editor's model: one surface, one selection, one mode, one armed kind, one keyboard
// focus cell, the history, and the field states that let an invalid keystroke stay on screen
// without reaching the surface. Pure TypeScript with no browser in it: src/lib/ui/sandbox/ renders
// and calls it, sandbox-ui.spec.ts drives it in node, and a surface can be built with NO pointer-
// move event because no method takes one. The selector is the default tool (change 10A): a click
// selects, a click on empty clears; `choose(kind)` - a palette row or its hotkey (HOTKEYS) - arms
// the kind and every `clickCell` places one until `cancel()` (V or Escape); a drag's release is
// one `moveSelectedTo` or `resizeSelectedTo`, the arrows one `nudgeSelected` / `resizeSelectedBy`
// per press (coalesced until `commitField`), `editNumber` the three MIDI fields. The model is never
// transiently invalid; Play locks every structural method and keeps selection and history.
// Decided at 13-16 / 13.1-03 (13-CONTEXT D-03, D-14 Q4; 13.1-CONTEXT D-03); see .planning/phases/13.1-bench-corrections-four/13.1-03-SUMMARY.md
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { noteName, noteNumber } from "../tune/view";
import {
  KIND_LABELS,
  TEMPLATE_BUTTON_NAME,
  TEMPLATE_FADER_NAME,
  CC_RANGE,
  CHANNEL_RANGE,
  NOTE_RANGE,
  VALUE_RANGE,
  WHOLE_NUMBER,
  defaultName,
} from "./copy";
import {
  GEOMETRY_COPY,
  addRegion,
  adjacencyWarnings,
  applyEdit,
  buildCellMap,
  duplicate as duplicateRegion,
  type AdjacencyWarning,
  type CellMap,
  type GeometryRules,
  type Problem,
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
  VALUE_MAX,
  VALUE_MIN,
  cellIndex,
  isPaintOnly,
  maxOf,
  minOf,
  orientationOf,
  outputOf,
  springValueOf,
  type ButtonOutput,
  type ElementKind,
  type Orientation,
  type Region,
  type RegionMode,
  type Speed,
  type Surface,
  withBrightness,
} from "./model";

export type Mode = "edit" | "play";

export type Cell = { readonly col: number; readonly row: number };

/** A region's place and size, zero-based - the plate's own cells. */
export type Box = {
  readonly col: number;
  readonly row: number;
  readonly w: number;
  readonly h: number;
};

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
  | { readonly kind: "cleared" }
  | { readonly kind: "refused"; readonly message: string }
  | { readonly kind: "play" };

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

/** Everything a component reads, as one immutable value replaced on every change. */
export type EditorState = {
  readonly surface: Surface;
  readonly selectedId: string | undefined;
  readonly selected: Region | undefined;
  readonly mode: Mode;
  readonly placement: Placement;
  readonly focus: Cell;
  readonly fields: FieldProblems;
  /**
   * What every numeric field shows: the model's number, or the refused text
   * while a keystroke stands refused. In the state rather than read through
   * a method, so a component re-renders a field when the selection moves -
   * a plain method call on a non-reactive object is invisible to a template.
   */
  readonly texts: Readonly<Record<NumericField, string>>;
  /** An orientation the geometry refused, with its message; cleared by the next accepted edit. */
  readonly orientationProblem: string | undefined;
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
};

const clampCell = (n: number): number =>
  Math.min(LAST_CELL, Math.max(0, Math.trunc(n)));

/** The coalesce key of a pointer drag - sealed on release, so one drag is one entry. */
const dragKey = (regionId: string): string => `drag:${regionId}`;

/** The coalesce key of the arrows - a held key is one entry until the plate's key-up commits. */
const arrowKey = (regionId: string, what: "nudge" | "grow"): string =>
  `${what}:${regionId}`;

const sameBox = (a: Box, b: Box): boolean =>
  a.col === b.col && a.row === b.row && a.w === b.w && a.h === b.h;

export class SandboxEditor {
  private _surface: Surface;
  private _selectedId: string | undefined = undefined;
  private _mode: Mode = "edit";
  private _placement: Placement = { kind: "idle" };
  private _focus: Cell = { col: 0, row: 0 };
  private _fields: FieldProblems = {};
  private _orientationProblem: string | undefined = undefined;
  private readonly rules: GeometryRules;
  private readonly onchange: ((state: EditorState) => void) | undefined;
  private minted = 0;
  /** Regions this editor has created, for the palette (header, last paragraph). */
  private created = 0;
  readonly history = new History();

  constructor(surface: Surface, options: EditorOptions = {}) {
    this._surface = surface;
    this.rules = options.rules ?? {};
    this.onchange = options.onchange;
  }

  // -------------------------------------------------------------------------
  // Reading.

  get surface(): Surface {
    return this._surface;
  }

  get selectedId(): string | undefined {
    return this._selectedId;
  }

  get selected(): Region | undefined {
    return this._surface.regions.find((r) => r.id === this._selectedId);
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

  /** The region holding a cell, if any. */
  regionAt(col: number, row: number): Region | undefined {
    const built = buildCellMap(this._surface.regions);
    if (!built.ok) return undefined;
    const index = built.map[cellIndex(col, row)];
    return index === 0 ? undefined : this._surface.regions[index - 1];
  }

  state(): EditorState {
    const built = buildCellMap(this._surface.regions);
    return {
      surface: this._surface,
      selectedId: this._selectedId,
      selected: this.selected,
      mode: this._mode,
      placement: this._placement,
      focus: this._focus,
      fields: this._fields,
      texts: Object.fromEntries(
        NUMERIC_FIELDS.map((field) => [field, this.fieldText(field)]),
      ) as Record<NumericField, string>,
      orientationProblem: this._orientationProblem,
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

  private nameFor(kind: ElementKind): string {
    const label = KIND_LABELS[kind];
    const taken = new Set(this._surface.regions.map((r) => r.name));
    for (let n = 1; ; n += 1) {
      const name = defaultName(label, n);
      if (!taken.has(name)) return name;
    }
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
      name: name ?? this.nameFor(kind),
      kind,
      ...box,
      cc,
      channel: CHANNEL_MIN,
      // The palette's next, AFTER the id is minted (W-05): a probe hands a
      // colour in and the cycle does not move.
      colour: colour === undefined ? this.nextColour() : [...colour],
    };
    if (kind === "xy") return { ...region, cc2: Math.min(CC_MAX, cc + 1) };
    if (kind === "button") return { ...region, latch: false };
    if (kind === "fader")
      return { ...region, orientation: orientation ?? "vertical" };
    return region;
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

  /** The one entry point for a click on the plate, by pointer or by Enter. */
  clickCell(col: number, row: number): ClickOutcome {
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
      const box = {
        col: Math.min(at.col, SURFACE_SIZE - size.w),
        row: Math.min(at.row, SURFACE_SIZE - size.h),
        w: size.w,
        h: size.h,
      };
      return this.place(pending.type, box, "place");
    }

    const holder = this.regionAt(at.col, at.row);
    if (holder !== undefined) {
      this._selectedId = holder.id;
      this.history.seal();
      this.emit();
      return { kind: "selected", region: holder };
    }
    // The selector on an empty cell: the selection clears, the focus cell stays.
    this._selectedId = undefined;
    this._fields = {};
    this._orientationProblem = undefined;
    this.history.seal();
    this.emit();
    return { kind: "cleared" };
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
    this._selectedId = region.id;
    this._fields = {};
    this._orientationProblem = undefined;
    this.emit();
    return { kind: "placed", region };
  }

  private record(
    kind: EditKind,
    before: Surface,
    after: Surface,
    regionId: string | undefined,
    key?: string,
  ): void {
    this.history.push({ kind, before, after, regionId, key });
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

  /** Enter on the plate: the same click, at the focus cell. */
  mark(): ClickOutcome {
    return this.clickCell(this._focus.col, this._focus.row);
  }

  // -------------------------------------------------------------------------
  // Selection and mode: Play locks every structural method and keeps the selection and the history (Bible section 8).

  /** From the element list or the plate. Never an entry in the history. */
  select(id: string | undefined): void {
    if (id !== undefined && !this._surface.regions.some((r) => r.id === id)) {
      return;
    }
    this._selectedId = id;
    this._fields = {};
    this._orientationProblem = undefined;
    this.history.seal();
    const region = this.selected;
    if (region !== undefined)
      this._focus = { col: region.col, row: region.row };
    this.emit();
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

  private applyPatch(
    patch: Partial<Omit<Region, "id">>,
    kind: EditKind,
    key?: string,
  ): Problem | undefined {
    const id = this._selectedId;
    if (this._mode === "play" || id === undefined) return undefined;
    const result = applyEdit(this._surface, id, patch, this.rules);
    if (!result.ok) return result.problem;
    if (result.surface.regions === this._surface.regions) return undefined;
    this.record(kind, this._surface, result.surface, id, key);
    this._surface = result.surface;
    return undefined;
  }

  /**
   * A MIDI field's text, as typed. A refusal leaves the surface as it was
   * and records the text and the message for the field.
   */
  editNumber(field: NumericField, text: string): boolean {
    const id = this._selectedId;
    if (this._mode === "play" || id === undefined) return false;
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
        case "cc2":
          if (n < CC_MIN || n > CC_MAX) return refuse(CC_RANGE);
          patch = field === "cc" ? { cc: n } : { cc2: n };
          break;
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
    const problem = this.applyPatch(patch, "midi", fieldKey(id, field));
    if (problem !== undefined) return refuse(problem.message);
    const rest: FieldProblems = { ...this._fields };
    delete rest[field];
    this._fields = rest;
    this.emit();
    return true;
  }

  /**
   * A box for the selected region, from a drag's release or an arrow: the
   * same applyEdit as every edit, under `move` or `resize`, coalesced under
   * `key` and sealed when `seal` says (a drag is one entry; a held arrow is
   * one entry until the plate's key-up commits). Refuses silently in Play or
   * with nothing selected; the same box is no edit and no entry. Returns the
   * problem when the box is refused - the region is then exactly as it was.
   */
  private commitBox(
    box: Box,
    kind: "move" | "resize",
    key: string,
    seal: boolean,
  ): Problem | undefined {
    const id = this._selectedId;
    if (this._mode === "play" || id === undefined) return undefined;
    const region = this.selected as Region;
    if (sameBox(region, box)) return undefined;
    const problem = this.applyPatch(
      { col: box.col, row: box.row, w: box.w, h: box.h },
      kind,
      key,
    );
    if (seal) this.history.seal();
    if (problem !== undefined) return problem;
    // An accepted box: the focus cell follows the region's origin as select() does.
    this._fields = {};
    this._orientationProblem = undefined;
    this._focus = { col: clampCell(box.col), row: clampCell(box.row) };
    this.emit();
    return undefined;
  }

  /** A handle drag's box, on release: one `resize` entry. Column and row arrive ZERO-BASED. */
  resizeSelectedTo(box: Box): Problem | undefined {
    const id = this._selectedId;
    if (id === undefined) return undefined;
    return this.commitBox(box, "resize", dragKey(id), true);
  }

  /** A body drag's origin, on release (change 10A): one `move` entry, the size kept. */
  moveSelectedTo(cell: Cell): Problem | undefined {
    const region = this.selected;
    if (region === undefined) return undefined;
    return this.commitBox(
      { col: cell.col, row: cell.row, w: region.w, h: region.h },
      "move",
      dragKey(region.id),
      true,
    );
  }

  /** An arrow with a selection (change 10A): the region one cell over, coalesced until `commitField`. */
  nudgeSelected(dcol: number, drow: number): Problem | undefined {
    const region = this.selected;
    if (region === undefined) return undefined;
    return this.commitBox(
      {
        col: region.col + dcol,
        row: region.row + drow,
        w: region.w,
        h: region.h,
      },
      "move",
      arrowKey(region.id, "nudge"),
      false,
    );
  }

  /** Shift and an arrow (change 10A): the region one cell wider or taller (or narrower, shorter), coalesced until `commitField`. */
  resizeSelectedBy(dw: number, dh: number): Problem | undefined {
    const region = this.selected;
    if (region === undefined) return undefined;
    return this.commitBox(
      {
        col: region.col,
        row: region.row,
        w: region.w + dw,
        h: region.h + dh,
      },
      "resize",
      arrowKey(region.id, "grow"),
      false,
    );
  }

  /** The value a field shows: the typed text while refused, else the model's. */
  fieldText(field: NumericField): string {
    const problem = this._fields[field];
    if (problem !== undefined) return problem.text;
    const region = this.selected;
    if (region === undefined) return "";
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

  /** The coalescing boundary (history.ts section 2): focus left the field, Enter, or an arrow released. */
  commitField(): void {
    this.history.seal();
  }

  rename(name: string): void {
    const id = this._selectedId;
    if (id === undefined) return;
    this.applyPatch({ name }, "rename", fieldKey(id, "name"));
    this.emit();
  }

  setOrientation(orientation: Orientation): boolean {
    const region = this.selected;
    if (region === undefined || region.kind !== "fader") return false;
    if (orientationOf(region) === orientation) return true;
    const problem = this.applyPatch({ orientation }, "orientation");
    if (problem !== undefined) {
      this._orientationProblem = problem.message;
      this.emit();
      return false;
    }
    this._orientationProblem = undefined;
    this.emit();
    return true;
  }

  /** The button's Toggle (the schema's `latch`). */
  setLatch(latch: boolean): void {
    const region = this.selected;
    if (region === undefined || region.kind !== "button") return;
    this.applyPatch({ latch }, "latch");
    this.emit();
  }

  // -------------------------------------------------------------------------
  // The change 10B options, each one entry under `option`: a select or a checkbox is one Undo.

  /** A fader's or an XY pad's Absolute / Relative, a knob's four; refused on a kind that has none or a mode it does not offer. (`setMode` is Edit / Play.) */
  setRegionMode(mode: RegionMode): boolean {
    const region = this.selected;
    if (region === undefined) return false;
    const offered =
      region.kind === "knob"
        ? KNOB_MODES
        : region.kind === "fader" || region.kind === "xy"
          ? CONTINUOUS_MODES
          : [];
    if (!offered.includes(mode)) return false;
    this.applyPatch({ mode }, "option");
    this.emit();
    return true;
  }

  /** A relative fader's or XY pad's Half / Full. */
  setSpeed(speed: Speed): void {
    const region = this.selected;
    if (
      region === undefined ||
      (region.kind !== "fader" && region.kind !== "xy")
    )
      return;
    this.applyPatch({ speed }, "option");
    this.emit();
  }

  /** A fader's spring. */
  setSpring(spring: boolean): void {
    const region = this.selected;
    if (region === undefined || region.kind !== "fader") return;
    this.applyPatch({ spring }, "option");
    this.emit();
  }

  /** A button's CC / Note output; the `cc` field is the note under Note. */
  setOutput(output: ButtonOutput): void {
    const region = this.selected;
    if (region === undefined || region.kind !== "button") return;
    if (outputOf(region) === output) return;
    this.applyPatch({ output }, "option");
    this._fields = {};
    this.emit();
  }

  /** A button's radio group, 0 (none) to 8. */
  setGroup(group: number): void {
    const region = this.selected;
    if (region === undefined || region.kind !== "button") return;
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
      this._selectedId,
      "field:surface:brightness",
    );
    this._surface = after;
    this.emit();
  }

  /** RGB444 levels, from the swatch's picker. */
  setColour(colour: readonly [number, number, number]): void {
    const id = this._selectedId;
    if (id === undefined) return;
    this.applyPatch(
      { colour: [colour[0], colour[1], colour[2]] },
      "recolour",
      fieldKey(id, "colour"),
    );
    this.emit();
  }

  /** Section 8's rule 4: to a free window, or a named refusal and nothing changed. */
  duplicate():
    | { ok: true; region: Region }
    | { ok: false; reason: "no-space" | "cap" } {
    const id = this._selectedId;
    if (id === undefined || this._mode === "play") {
      return { ok: false, reason: "no-space" };
    }
    const result = duplicateRegion(
      this._surface,
      id,
      (source) => this.mint(source.kind),
      this.rules,
    );
    if (!result.ok) return { ok: false, reason: result.reason };
    this.record("duplicate", this._surface, result.surface, result.region.id);
    this._surface = result.surface;
    this._selectedId = result.region.id;
    this._fields = {};
    this.emit();
    return { ok: true, region: result.region };
  }

  /** Delete the selection. Undoable (Bible section 8's own requirement). */
  remove(): boolean {
    const region = this.selected;
    if (region === undefined || this._mode === "play") return false;
    const after: Surface = {
      ...this._surface,
      regions: this._surface.regions.filter((r) => r.id !== region.id),
    };
    this.record("delete", this._surface, after, region.id);
    this._surface = after;
    this._selectedId = undefined;
    this._fields = {};
    this._orientationProblem = undefined;
    this.emit();
    return true;
  }

  // -------------------------------------------------------------------------
  // History.

  undo(): boolean {
    if (this._mode === "play") return false;
    const step = this.history.undo();
    if (step === undefined) return false;
    this.restore(step.surface, step.select);
    return true;
  }

  redo(): boolean {
    if (this._mode === "play") return false;
    const step = this.history.redo();
    if (step === undefined) return false;
    this.restore(step.surface, step.select);
    return true;
  }

  /** The armed kind survives an undo: a run of placements is undone without re-arming. */
  private restore(surface: Surface, select: string | undefined): void {
    this._surface = surface;
    this._selectedId =
      select !== undefined && surface.regions.some((r) => r.id === select)
        ? select
        : undefined;
    this._fields = {};
    this._orientationProblem = undefined;
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
    this._selectedId = fader.id;
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
    this._selectedId = undefined;
    this._placement = { kind: "idle" };
    this._fields = {};
    this._orientationProblem = undefined;
    this.emit();
  }

  /** Save copy's name, and the rename of the surface itself. */
  renameSurface(name: string): void {
    if (name === this._surface.name) return;
    this._surface = { ...this._surface, name };
    this.emit();
  }
}
