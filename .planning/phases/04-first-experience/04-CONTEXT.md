# Phase 4: First Experience — Context

**Gathered:** 2026-09-04
**Status:** Ready for planning
**Mode:** Autonomous — the user delegated overnight ("leave you to your own devices to have a working
prototype for the morning"). Decisions marked **[user]** are his, from the reference frame and his four
answers recorded in `.planning/design/FIRST-EXPERIENCE.md`; decisions marked **[orchestrator]** are
mine under that delegation, with the reasoning stated so he can overturn them in the morning.

<domain>
## Phase Boundary

The front door of HANGAR: the glyph-field wordmark splash **dissolves** into a **coverflow of live
ZONA pads** — one large and centred, neighbours receding with depth — every pad running its own
configuration in the firmware-faithful simulator; a name plate with arrows steps the row; choosing the
centre pad reveals `TRY ON DEVICE` (and a secondary `KEEP ON DEVICE`). The site is worth opening with
no hardware attached, and it reads as HANGAR's identity.

This REPLACES the roadmap's Phase 4 wording ("catalog of cards, sort by Featured/Newest/Name, focus
view"). The **sophisticated catalog** (sort, search, tags, capability filters, a list/detail browse —
CAT-02 and the browse half of CAT-03) is **deferred to a new phase** inserted after Phase 5. The
coverflow is the whole first screen and, for now, the whole catalog surface.

In scope: splash + dissolve; coverflow with 9 seed presets (+ Phase 8's new ones as they land, in the
same data file); live simulation on every visible pad; the hero pad at full fidelity with
mouse-as-finger; name plate + arrows + keyboard/wheel stepping; deep link lands with that config
centred; the chosen state revealing `TRY ON DEVICE` / `KEEP ON DEVICE` (wired to the Phase 2
transport for connect + identify only — install is Phase 7); identity tokens and the fidelity line;
reduced-motion; render budget.

Not in scope: knobs and meters (Phase 5 — but their PLACE is decided below so Phase 5 docks into it);
install flow, snapshot, PUT BACK (Phase 7); sort/search/tags/detail browse (new deferred phase);
OG images and URL stamps (Phase 5).

</domain>

<decisions>
## Implementation Decisions

### The screen **[user]**
- **D-01:** First real screen is a **coverflow**: one 9×9 pad large and centred, neighbours receding
  left and right with real depth (smaller, dimmer, overlapping, falling off the viewport edge).
- **D-02:** **Every visible pad animates** — its own config's simulation. Centre: full size, full
  fidelity, mouse-as-finger. Sides: smaller, still moving (reduced tick/frame rate allowed).
- **D-03:** **The pad is the card.** No title block, no description, no chrome around a pad. The only
  text: a quiet mixed-case headline above ("You've got to start somewhere…" — rounded geometric sans)
  and a lime-outlined **name plate** below the centre pad with solid lime triangle arrows
  `◀ <name> ▶`. Name and navigation are one element.
- **D-04:** **Coverflow = front door only.** It is the wow moment where the visitor picks an initial
  config. The sophisticated catalog is a later, separate screen.
- **D-05:** **Choosing the centre pad reveals `TRY ON DEVICE`** ("that's the whole point"); a
  `KEEP ON DEVICE` control exists, visibly secondary (SAFE-02). Nothing appears until chosen.
- **D-06:** **Splash → dissolve.** The glyph-field HANGAR wordmark holds, then dissolves into the
  coverflow. No click-through.
- **D-07:** Identity: true-black ground; one acid lime (~#D6FF4E); glyph-field texture belongs to the
  splash, the coverflow background stays calm black so pads read as light; wide-tracked uppercase
  wordmark; the 9×9 outline is logo, loading state and pad frame.

### Placement of what comes later **[orchestrator — user said "figure it out"]**
- **D-08:** Knobs and the two 908 meters (Phase 5) belong to the **chosen** pad, not the coverflow.
  On choose, the row recedes (side pads dim further and shrink) and the hero stays centred; a
  **panel slides in beneath the name plate** holding, top to bottom: `TRY ON DEVICE` (primary) and
  `KEEP ON DEVICE` (secondary, smaller, separated), then — Phase 5 — the knobs, then the two meters.
  Why: it keeps the pad the largest thing on screen, the arrows still step configs while chosen
  (the panel re-fills), and nothing competes with the pad horizontally at phone widths. Phase 4
  builds the panel with the two install controls and a labelled empty region reserved for knobs.
- **D-09:** Un-choose: `Esc`, clicking the dimmed row, or stepping with the arrows past the chosen
  config returns to the plain coverflow; the panel slides away.

### Interaction **[orchestrator]**
- **D-10:** Stepping: name-plate arrows, `←`/`→`, horizontal wheel/trackpad swipe, and clicking a
  side pad (brings it to centre). Wraps at both ends. Order = catalog data order (featured first,
  then the nine seeds, then Phase 8 additions).
- **D-11:** Choosing: click/tap the centre pad, `Enter`, or clicking the name plate's name. Hover
  over the centre pad already shows mouse-as-finger (the instrument is playable before choosing).
- **D-12:** Deep link `#/c/<id>` (or the route the planner prefers) lands with that config centred,
  splash skipped on deep links (the wow is for the front door; a shared link should open fast).
- **D-13:** `TRY ON DEVICE` in this phase: enabled only when `"serial" in navigator && isSecureContext`;
  on click it runs Phase 2's connect + identify (the proven `sequence.ts` path) and then shows a
  plain "Install arrives in the next release — your ZONA <fw> on page <n> is identified" state. It
  NEVER writes. On unsupported browsers it is present-but-disabled with the DEGR-02 reason.
  `KEEP ON DEVICE` is disabled with the reason "after a try-on" in this phase.
- **D-14:** Reduced motion: `prefers-reduced-motion` stills every pad to a representative frame
  (tick 64), the splash dissolve becomes a 200 ms crossfade, coverflow stepping is instant.

### Rendering **[orchestrator, per STACK research]**
- **D-15:** One shared `requestAnimationFrame` for the whole page (the vendored `pad-sim-host.ts`
  scheduling: 10 ms accumulator, 100 ms clamp, 33 ms paint throttle, IntersectionObserver with
  `rootMargin: "200px"`, self-cancelling loop). Paint = 9×9 `ImageData` upscaled with
  `imageSmoothingEnabled = false`; the grid outline is a static SVG/CSS overlay, never `strokeRect`
  per cell per frame. Side pads render at 20 fps; the hero at 30.
- **D-16:** Depth is CSS 3D (`perspective`, `translateZ`, `rotateY` small angles, `filter: brightness`)
  on canvas-bearing elements — no WebGL, no per-card contexts beyond the 2D canvas.
- **D-17:** The fidelity line ("what the simulator matches exactly and cannot show") sits under the
  name plate in small text, always present, quiet.

### Data **[orchestrator]**
- **D-18:** Catalog data file `src/lib/catalog/entries.ts`: Profile-Cloud-shaped objects
  `{ id, name, description, tags, featured, configType: "profile", type: ModuleType.ZONA, version,
  configs: [{ controlElementNumber: 0, events: [{ event: 0, config }, { event: 6, config }] }] }`
  PLUS `state: PadState` (the compiler input; the Lua is derived by the vendored compiler at build or
  load, never hand-authored — PREV-02) and `preview` metadata. Seeds = the nine BOTOR presets by
  `presetById`. Phase 8 appends. A Vitest gate compiles every entry and asserts both events ≤ 908
  compressed and character-identical to `preset-baseline.json` for the nine seeds.
- **D-19:** The compile surface is `src/lib/pad` (Phase 3) behind `padReady()`; the simulator needs
  no WASM, so the coverflow animates before the formatter loads; the formatter is prefetched on
  `requestIdleCallback` and awaited only when a cost is asked for (Phase 5) or `TRY ON DEVICE` needs
  a compiled string (Phase 7).

### Claude's Discretion
- Exact typography (a free, GPL-compatible rounded geometric sans for the headline; the wordmark's
  wide-tracked face), spacing, the dissolve duration (~1.2 s), the coverflow geometry (angles, gaps,
  how many neighbours are visible: 2–3 per side at desktop, 1 per side at phone widths).
- Splash implementation (canvas-drawn glyph field vs a static generated image).
- Whether the hero's mouse-as-finger uses the vendored host's preview canvas path or a thin adapter.
- Route shape for deep links and how the prerenderer handles them.

</decisions>

<specifics>
## Specific Ideas

- The reference frame: black; headline "You've got to start somewhere…"; five-to-seven lime-outlined
  9×9 pads in a receding row, dotted faces; name plate `◀ LFO default ▶` in a lime-outlined box with
  solid triangle arrows. That frame IS the acceptance picture for criterion 1.
- "I want the first experience to be a wow experience." Motion is the wow: the pads are already
  running when the dissolve finishes.
- The user has a breather planned before deeper GUI/UX work and will supply more layout references;
  everything marked [orchestrator] is a first cut he can overturn.
- "Do not spend any money": free fonts only (Google Fonts via the allowed CDN or self-hosted OFL
  faces), no paid assets, Cloudflare free tier.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### The brief (authoritative for look and behaviour)
- `.planning/design/FIRST-EXPERIENCE.md` — the user's frame and four answers, verbatim in intent
- `.planning/PROJECT.md` §Visual Identity — black / acid lime / glyph field / wide-tracked type / pad motif
- `.planning/REQUIREMENTS.md` — PREV-01..05, CAT-01, CAT-04, CONT-01, CONT-03, IDENT-01/02 (this
  phase); CAT-02 and the browse half of CAT-03 are deferred (see ROADMAP amendment)
- `.planning/ROADMAP.md` §Phase 4 — AMENDED by this context (see domain)

### Research that decides rendering and structure
- `.planning/research/STACK.md` §Decision 2 (rendering 10–30 live grids: shared rAF, ImageData
  upscale, static overlay, IntersectionObserver rootMargin, no per-card WebGL, the honest ceiling)
- `.planning/research/PITFALLS.md` §C14 (timestep, throttling, memory, reduced motion) and §C7 (WASM
  gate — the coverflow must not wait on it)
- `.planning/research/FEATURES.md` §C (preview trust: C1–C5), §G (honest degrade), §Anti-features
  N4/N5 (never stream the real LEDs; never auto-apply on connect)
- `.planning/research/ARCHITECTURE.md` §3.3 (`catalog/`, `state/`, `ui/` layout), §5.1 (catalog
  entry → screen data flow)

### Code this phase builds on (read the real files)
- `src/vendor/botor/pad-sim.ts` (`PadSim`: constructor takes a `PadState`; `tick()`, frame buffer,
  touch API) and `src/vendor/botor/pad-sim-host.ts` (the shared-rAF host, IntersectionObserver,
  reduced-motion, the mouse-as-finger preview — DOM only, no Svelte; adapt via a thin wrapper, never
  edit the vendored file)
- `src/vendor/botor/_pad.ts` — `PRESETS`, `presetById`, `PadState`, `compile`
- `src/lib/pad/index.ts`, `ready.ts` — the gated compile surface (Phase 3)
- `src/lib/fidelity/preset-baseline.json`, `golden-frames.json` — the nine seeds' compiled Lua/costs
  and frame hashes (the catalog gate compares against them)
- `src/lib/transport/*`, `src/lib/protocol/*`, `src/lib/transport/sequence.ts` — Phase 2's proven
  connect/identify path for `TRY ON DEVICE`'s identify-only state
- `src/routes/+layout.svelte`, `src/app.css`, `vite.config.ts` (Tailwind v4 `@theme` tokens),
  `worker/index.js`, `playwright.config.ts`, `e2e/*.e2e.ts`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Vendored `PadSim` + `pad-sim-host.ts`: the whole simulation and scheduling; the host uses raw DOM
  so a Svelte component wraps it rather than re-implementing it.
- `presetById` / `PRESETS`: the nine seeds' `PadState`s.
- `preset-baseline.json` + `golden-frames.json`: the catalog gate's oracles for the nine seeds.
- Phase 2 `sequence.ts` (`identify`, `fetchBoth`) + `WebSerialTransport` + `RequestQueue`: connect
  and identify for `TRY ON DEVICE`'s identify-only state; `failureCopy("no-web-serial")` for DEGR-02.
- `/dev/fidelity/` and `/dev/skeleton/` routes: prerender + `onMount` dynamic-import pattern; the
  `.tmp-e2e/` e2e capture convention; the stale-wrangler preflight.

### Established Patterns
- Count-based acceptance; negative checks observed red; files `git add`ed before perturbation; never
  format `src/vendor/`; `npm run format` scoped to new files; Write/Edit for file contents (Bash
  heredocs halve backslashes); logs in `.tmp-e2e/`.
- No `initLuaFormatter()` at boot — the coverflow never needs it.

### Integration Points
- `src/lib/catalog/` (new) — entries + gate spec; Phase 8 appends here.
- `src/lib/ui/` or `src/lib/components/` (new) — Splash, Coverflow, PadCanvas (wrapper over the
  vendored host), NamePlate, ChosenPanel (install controls now, knobs/meters later).
- `src/routes/+page.svelte` — becomes the front door (currently the Phase 1 placeholder with footer).
- `src/routes/+layout.svelte` — keeps the footer (GPLv3, notices, Source, SHA) per FOUND-04.

</code_context>

<deferred>
## Deferred Ideas

- **Sophisticated catalog** (sort Featured/Newest/Name — CAT-02; search, tags, capability filters,
  list/detail browse — D2/D3/D6/D7) → **new phase inserted after Phase 5** ("Catalog Browse").
- Knobs, meters, SURPRISE ME, URL stamps, OG images → Phase 5 (dock into the ChosenPanel, D-08).
- Real install (`TRY ON DEVICE` writing, snapshot, PUT BACK, `KEEP ON DEVICE`) → Phase 7.
- The user's further layout references (promised after his breather) → revisit D-08..D-17 then.

</deferred>

---

*Phase: 04-first-experience*
*Context gathered: 2026-09-04 (autonomous, under the user's overnight delegation)*
