// The Sandbox editor's model: one surface, one selection, one mode, one pending placement, one
// keyboard focus cell, the history, and the field states that let an invalid keystroke stay on
// screen without reaching the surface. Pure TypeScript with no browser in it: src/lib/ui/sandbox/
// renders and calls it, sandbox-ui.spec.ts drives it in node, and a surface can be built with NO
// pointer-move event because no method takes one. Every creation path is two calls - `choose(kind)`
// then `clickCell` (element first), two clicks on empty cells (area first, the kind compatible by
// construction), arrows plus `mark()` (the keyboard route), `editNumber` (the numeric route), and
// the plate's handle drag as one `resizeSelectedTo(box)` on release (13.1-03). The model is never
// transiently invalid: a refused edit keeps the previous surface and records `{ text, message }` for
// the field. Play locks every structural method and keeps selection and history; `atCap` is schema.ts's sixteen.
// Decided at 13-16 / 13.1-03 (13-CONTEXT D-03, D-14 Q4; 13.1-CONTEXT D-03); see .planning/phases/13.1-bench-corrections-four/13.1-03-SUMMARY.md
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import {
  KIND_LABELS,
  TEMPLATE_BUTTON_NAME,
  TEMPLATE_FADER_NAME,
  CC_RANGE,
  CHANNEL_RANGE,
  WHOLE_NUMBER,
  defaultName,
} from "./copy";
import {
  addRegion,
  adjacencyWarnings,
  applyEdit,
  buildCellMap,
  duplicate as duplicateRegion,
  validate,
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
  LAST_CELL,
  SURFACE_ELEMENT_CAP,
  SURFACE_SIZE,
  cellIndex,
  fromDisplay,
  orientationOf,
  toDisplay,
  type ElementKind,
  type Orientation,
  type Region,
  type Surface,
  withBrightness,
} from "./model";

export type Mode = "edit" | "play";

export type Cell = { readonly col: number; readonly row: number };

/** What the next click on the plate will do. */
export type Placement =
  | { readonly kind: "idle" }
  | { readonly kind: "element"; readonly type: ElementKind }
  | { readonly kind: "area"; readonly start: Cell };

/** The numeric fields the inspector renders, in the model's names. */
export type NumericField = "col" | "row" | "w" | "h" | "cc" | "cc2" | "channel";

export const NUMERIC_FIELDS: readonly NumericField[] = [
  "col",
  "row",
  "w",
  "h",
  "cc",
  "cc2",
  "channel",
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
  | { readonly kind: "started"; readonly start: Cell }
  | { readonly kind: "refused"; readonly message: string }
  | { readonly kind: "play" };

/** The default region each kind places on the element-first path. */
export const DEFAULT_SIZES: Readonly<
  Record<ElementKind, { readonly w: number; readonly h: number }>
> = {
  fader: { w: 2, h: 6 },
  button: { w: 2, h: 2 },
  knob: { w: 3, h: 3 },
  xy: { w: 3, h: 3 },
};

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
   * What every numeric field shows: the model's number (one-based where the
   * interface counts so), or the refused text while a keystroke stands
   * refused. In the state rather than read through a method, so a component
   * re-renders a field when the selection moves - a plain method call on a
   * non-reactive object is invisible to a template.
   */
  readonly texts: Readonly<Record<NumericField, string>>;
  /** A retype the geometry refused, with its message; cleared by the next accepted edit. */
  readonly kindProblem: string | undefined;
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

/** The box between two cells, inclusive, as a region's geometry. */
export function boxBetween(
  a: Cell,
  b: Cell,
): { col: number; row: number; w: number; h: number } {
  const col = Math.min(a.col, b.col);
  const row = Math.min(a.row, b.row);
  return {
    col,
    row,
    w: Math.abs(a.col - b.col) + 1,
    h: Math.abs(a.row - b.row) + 1,
  };
}

/** Section 1: the compatible kind for a box drawn area-first. */
export function kindForBox(
  w: number,
  h: number,
): {
  kind: ElementKind;
  orientation?: Orientation;
} {
  if (w === 1 && h === 1) return { kind: "button" };
  return h >= w
    ? { kind: "fader", orientation: "vertical" }
    : { kind: "fader", orientation: "horizontal" };
}

const clampCell = (n: number): number =>
  Math.min(LAST_CELL, Math.max(0, Math.trunc(n)));

/** The coalesce key of a handle drag - sealed on release, so one drag is one entry. */
const dragKey = (regionId: string): string => `drag:${regionId}`;

export class SandboxEditor {
  private _surface: Surface;
  private _selectedId: string | undefined = undefined;
  private _mode: Mode = "edit";
  private _placement: Placement = { kind: "idle" };
  private _focus: Cell = { col: 0, row: 0 };
  private _fields: FieldProblems = {};
  private _kindProblem: string | undefined = undefined;
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
      kindProblem: this._kindProblem,
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
      used.add(r.cc);
      if (r.cc2 !== undefined) used.add(r.cc2);
    }
    for (let cc = 1; cc <= CC_MAX; cc += 1) if (!used.has(cc)) return cc;
    return CC_MAX;
  }

  private newRegion(
    kind: ElementKind,
    box: { col: number; row: number; w: number; h: number },
    orientation?: Orientation,
    name?: string,
    colour?: readonly [number, number, number],
  ): Region {
    const cc = this.freeController();
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
  // The two creation paths, neither needing a drag (Bible sections 2, 8, 14).

  /** Element first: arm a kind. False at the cap or in Play - the palette is disabled there. */
  choose(kind: ElementKind): boolean {
    if (this._mode === "play" || this.atCap) return false;
    this._placement = { kind: "element", type: kind };
    this.emit();
    return true;
  }

  /** Escape: nothing pending. */
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
      const size = DEFAULT_SIZES[pending.type];
      const box = {
        col: Math.min(at.col, SURFACE_SIZE - size.w),
        row: Math.min(at.row, SURFACE_SIZE - size.h),
        w: size.w,
        h: size.h,
      };
      return this.place(pending.type, box, "place");
    }

    if (pending.kind === "area") {
      const box = boxBetween(pending.start, at);
      const { kind, orientation } = kindForBox(box.w, box.h);
      return this.place(kind, box, "place", orientation);
    }

    const holder = this.regionAt(at.col, at.row);
    if (holder !== undefined) {
      this._selectedId = holder.id;
      this.history.seal();
      this.emit();
      return { kind: "selected", region: holder };
    }
    if (this.atCap) {
      return { kind: "refused", message: this.capMessage() };
    }
    this._placement = { kind: "area", start: at };
    this.emit();
    return { kind: "started", start: at };
  }

  private capMessage(): string {
    const probe = validate(
      this.newRegion(
        "button",
        { col: 0, row: 0, w: 1, h: 1 },
        undefined,
        undefined,
        DEFAULT_COLOUR,
      ),
      this._surface,
      this.rules,
    );
    return probe.ok ? "" : probe.problem.message;
  }

  private place(
    kind: ElementKind,
    box: { col: number; row: number; w: number; h: number },
    edit: EditKind,
    orientation?: Orientation,
    name?: string,
  ): ClickOutcome {
    const region = this.newRegion(kind, box, orientation, name);
    const result = addRegion(this._surface, region, this.rules);
    if (!result.ok) {
      // The region was never created: its palette entry goes back, so the
      // next placement is still the next of the cycle.
      this.created -= 1;
      // The placement stays armed so the next click can try elsewhere; an
      // area start is dropped, because its far corner was the problem.
      if (this._placement.kind === "area") this._placement = { kind: "idle" };
      this.emit();
      return { kind: "refused", message: result.problem.message };
    }
    this.record(edit, this._surface, result.surface, region.id);
    this._surface = result.surface;
    this._selectedId = region.id;
    this._placement = { kind: "idle" };
    this._fields = {};
    this._kindProblem = undefined;
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
    if (this._placement.kind === "area") this._placement = { kind: "idle" };
    this._fields = {};
    this._kindProblem = undefined;
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
   * A numeric field's text, as typed. Column and Row arrive ONE-BASED (the
   * interface's numbers) and go through the named door; the rest are what
   * they are. A refusal leaves the surface as it was and records the text
   * and the message for the field.
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
    if (!/^-?[0-9]+$/.test(trimmed)) return refuse(WHOLE_NUMBER);
    const n = Number.parseInt(trimmed, 10);
    let patch: Partial<Omit<Region, "id">>;
    let kind: EditKind;
    switch (field) {
      case "col":
        patch = { col: fromDisplay(n) };
        kind = "move";
        break;
      case "row":
        patch = { row: fromDisplay(n) };
        kind = "move";
        break;
      case "w":
        patch = { w: n };
        kind = "resize";
        break;
      case "h":
        patch = { h: n };
        kind = "resize";
        break;
      case "cc":
      case "cc2":
        if (n < CC_MIN || n > CC_MAX) return refuse(CC_RANGE);
        patch = field === "cc" ? { cc: n } : { cc2: n };
        kind = "midi";
        break;
      case "channel":
        if (n < CHANNEL_MIN || n > CHANNEL_MAX) return refuse(CHANNEL_RANGE);
        patch = { channel: n };
        kind = "midi";
        break;
    }
    const problem = this.applyPatch(patch, kind, fieldKey(id, field));
    if (problem !== undefined) return refuse(problem.message);
    const rest: FieldProblems = { ...this._fields };
    delete rest[field];
    this._fields = rest;
    this.emit();
    return true;
  }

  /**
   * A handle drag's box, on release (header: THE HANDLE DRAG). Column and row
   * arrive ZERO-BASED - the plate's own cells; the numeric fields' one-based
   * door is theirs. Refuses silently in Play or with nothing selected;
   * otherwise the same applyEdit as Width and Height, under `resize`, and
   * the entry sealed so the drag is one Undo. Returns the problem when the
   * box is refused - the region is then exactly as it was - or undefined.
   */
  resizeSelectedTo(box: {
    col: number;
    row: number;
    w: number;
    h: number;
  }): Problem | undefined {
    const id = this._selectedId;
    if (this._mode === "play" || id === undefined) return undefined;
    const region = this.selected as Region;
    // The same box is no edit and no entry: applyEdit builds a fresh array
    // for every accepted patch, so the box is compared here, not there.
    if (
      region.col === box.col &&
      region.row === box.row &&
      region.w === box.w &&
      region.h === box.h
    ) {
      return undefined;
    }
    const problem = this.applyPatch(
      { col: box.col, row: box.row, w: box.w, h: box.h },
      "resize",
      dragKey(id),
    );
    this.history.seal();
    if (problem !== undefined) return problem;
    // An accepted box: a field still showing a refused width or height is
    // stale now, and the focus cell follows the region's origin as select() does.
    this._fields = {};
    this._kindProblem = undefined;
    this._focus = { col: clampCell(box.col), row: clampCell(box.row) };
    this.emit();
    return undefined;
  }

  /** The value a field shows: the typed text while refused, else the model's, one-based where the interface counts so. */
  fieldText(field: NumericField): string {
    const problem = this._fields[field];
    if (problem !== undefined) return problem.text;
    const region = this.selected;
    if (region === undefined) return "";
    switch (field) {
      case "col":
        return String(toDisplay(region.col));
      case "row":
        return String(toDisplay(region.row));
      case "w":
        return String(region.w);
      case "h":
        return String(region.h);
      case "cc":
        return String(region.cc);
      case "cc2":
        return region.cc2 === undefined ? "" : String(region.cc2);
      case "channel":
        return String(region.channel);
    }
  }

  /** The coalescing boundary (history.ts section 2): focus left the field, or Enter. */
  commitField(): void {
    this.history.seal();
  }

  rename(name: string): void {
    const id = this._selectedId;
    if (id === undefined) return;
    this.applyPatch({ name }, "rename", fieldKey(id, "name"));
    this.emit();
  }

  /** Section 8's Identity: the type. Validated like any edit; a Knob on a 2 x 2 is refused with its line. */
  setKind(kind: ElementKind): boolean {
    const region = this.selected;
    if (region === undefined || this._mode === "play") return false;
    if (region.kind === kind) return true;
    // The other kinds' fields do not travel: a button's latch, an XY pad's
    // second controller and a fader's orientation are dropped, and the new
    // kind's own default is set.
    const base: Region = {
      id: region.id,
      name: region.name,
      kind,
      col: region.col,
      row: region.row,
      w: region.w,
      h: region.h,
      cc: region.cc,
      channel: region.channel,
      colour: region.colour,
    };
    const retyped: Region =
      kind === "button"
        ? { ...base, latch: false }
        : kind === "xy"
          ? { ...base, cc2: Math.min(CC_MAX, region.cc + 1) }
          : kind === "fader"
            ? { ...base, orientation: "vertical" }
            : base;
    const verdict = validate(retyped, this._surface, this.rules);
    if (!verdict.ok) {
      this._kindProblem = verdict.problem.message;
      this.emit();
      return false;
    }
    const regions = this._surface.regions.map((r) =>
      r.id === region.id ? retyped : r,
    );
    const after: Surface = { ...this._surface, regions };
    this.record("retype", this._surface, after, region.id);
    this._surface = after;
    this._kindProblem = undefined;
    this._fields = {};
    this.emit();
    return true;
  }

  setOrientation(orientation: Orientation): boolean {
    const region = this.selected;
    if (region === undefined || region.kind !== "fader") return false;
    if (orientationOf(region) === orientation) return true;
    const problem = this.applyPatch({ orientation }, "orientation");
    if (problem !== undefined) {
      this._kindProblem = problem.message;
      this.emit();
      return false;
    }
    this._kindProblem = undefined;
    this.emit();
    return true;
  }

  setLatch(latch: boolean): void {
    const region = this.selected;
    if (region === undefined || region.kind !== "button") return;
    this.applyPatch({ latch }, "latch");
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
    this._kindProblem = undefined;
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

  private restore(surface: Surface, select: string | undefined): void {
    this._surface = surface;
    this._selectedId =
      select !== undefined && surface.regions.some((r) => r.id === select)
        ? select
        : undefined;
    this._placement = { kind: "idle" };
    this._fields = {};
    this._kindProblem = undefined;
    this.emit();
  }

  // -------------------------------------------------------------------------
  // The empty state's two ways in, and the draft's way back.

  /** The one visible starter action: a fader, the PDF's own first element, at the top-left. */
  starter(): ClickOutcome {
    if (this._mode === "play") return { kind: "play" };
    if (this.atCap) return { kind: "refused", message: this.capMessage() };
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
  private newRegionOn(
    surface: Surface,
    kind: ElementKind,
    box: { col: number; row: number; w: number; h: number },
  ): Region {
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
    this._kindProblem = undefined;
    this.emit();
  }

  /** Save copy's name, and the rename of the surface itself. */
  renameSurface(name: string): void {
    if (name === this._surface.name) return;
    this._surface = { ...this._surface, name };
    this.emit();
  }
}
