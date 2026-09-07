---
phase: 10
slug: redesign
status: draft
shadcn_initialized: false
preset: none
created: 2026-09-07
authored: gsd-ui-researcher, designed through the `impeccable` skill (D-01)
extends:
  - .planning/phases/04-first-experience/04-UI-SPEC.md (approved 2026-09-04)
  - .planning/phases/05-tuning-budgets-and-shareable-links/05-UI-SPEC.md (approved 2026-09-04)
  - .planning/phases/05.1-catalog-browse/05.1-UI-SPEC.md (approved 2026-09-04)
  - .planning/phases/06-device-session/06-UI-SPEC.md (approved 2026-09-04)
  - .planning/phases/07-install-flow/07-UI-SPEC.md (approved 2026-09-05)
---

# Phase 10 — UI Design Contract

> The redesign. A new type pair behind one swappable token, a CRT and glitch treatment that cannot
> reach a text node or the coverflow's 3D context, a browse experience cut from fifty-five tags to
> sixteen across two facets, a fourth and destructive device write, a colour picker built on the
> hardware's own 4,096-colour lattice, and eleven named retirements of shipped copy.
>
> Binding upstream: `10-CONTEXT.md` (D-01 to D-14, three planning notes, seven tensions) and
> `10-RESEARCH.md` (1,942 lines, committed at `3df99da`). Where this document adds detail it never
> contradicts those. Where it decides something they left open it is in **Decisions taken without the
> user**; where it must not decide, it is in **Open for the user**.
>
> Every retirement below is a **named amendment**: the spec that pinned the thing is rewritten, never
> deleted, in the shape Phase 7 used twice and Phase 9 used on `05.1-UI-SPEC.md`.

---

## 0. The `impeccable` preflight (D-01)

D-01 makes the skill the phase's first instrument, so its own gates are answered before anything
below is designed.

| Gate | Result |
|------|--------|
| Context | `node ~/.claude/skills/impeccable/scripts/load-context.mjs` ran. `hasProduct: false`, `hasDesign: false`, `contextDir: C:\Users\sabot\Documents\Claude\hangar` |
| Product | **Resolved without running `teach`.** `teach` writes `PRODUCT.md` and `DESIGN.md` into the repository root; this task creates exactly one file. The product and design context that `teach` would have synthesised **already exists, in more detail and under version control**: `CLAUDE.md` (the brief, the constraints, the whole stack), `10-CONTEXT.md` (the user's own words plus fourteen locked decisions), `10-RESEARCH.md`, and five approved UI specs totalling 5,115 lines that are enforced by shipped tests. Synthesising a thinner `PRODUCT.md` beside them would create a second source of truth that drifts. **If the user wants the skill's own files, `$impeccable teach` and `$impeccable document` are a separate, one-task change** — see Open for the user, item 16 |
| Command reference | `reference/brand.md` and `reference/product.md` both apply; the register is split by surface, below |
| Shape | This document **is** the shape brief. It is not implementation. Nothing is mutated by it |
| Image | Skipped: every visual probe this phase could want already exists as running code at `/`, `/browse/`, `/c/{id}` and five `/dev/` routes, and the CRT reference is a production stylesheet quoted verbatim in `10-RESEARCH.md` §3.1 |
| Mutation | **Closed.** This task writes one file and touches nothing else |

### Register, split by surface rather than by page

The skill asks for one register. HANGAR needs two, and the split is the single most useful thing the
skill contributes to this phase, because **it is also where the CRT is allowed to live**.

| Register | Surfaces | Consequence |
|----------|----------|-------------|
| **Brand** — design IS the product | The splash, the coverflow band and its pad frames, the browse grid's cards and their pad frames, the page ground | Texture, tracking, poster weight, motion. The CRT lives here and only here |
| **Product** — design SERVES the product | The chosen panel, the tuning region, the device slot and its disclosure, every install state, every failure block, the browse toolbar | No texture, no glitch, no decoration. It talks to hardware people paid for |

**The rule that falls out of the split, and it is the phase's most load-bearing line:**

> The CRT is a property of a **pad frame, a hero shell or the page ground**. It is never a property
> of a panel, a control, a toolbar or a text node.

### Colour strategy (the skill's four-step commitment axis)

**Restrained chrome over drenched content.** The interface is two tokens and one alarm; the pads are
the ZONA's own firmware RGB at full saturation. Because the chrome is achromatic in everything but
lime, **any hue on the screen is by definition the visitor's or the hardware's**, which is exactly
how every product surveyed in `10-RESEARCH.md` §4.2 solves the chrome-versus-payload problem. This
is what fences the colour picker's arbitrary colour without inventing a rule (§7.3).

### Theme, run as a scene sentence rather than as a category

> A visitor opens a Discord link at eleven at night on a laptop in a dim room, with a ZONA on the
> desk beside the keyboard, and wants to see something spectacular before deciding whether to plug
> it in.

The sentence forces dark twice over. The ambient light is low, and the subject is **eighty-one
emissive LEDs**: on any ground but a near-black, a nine-by-nine grid of lit cells is a lie about what
the hardware looks like on a desk.

**Category-reflex check, both altitudes.** First order: "hardware playground for a MIDI controller"
predicts neon-on-black, which is what this is, so the reflex is not avoided by taste. Second order:
"hardware playground that is not neon-on-black" predicts editorial-typographic, which is the trap one
tier down. **Neither check applies here, and the reason is that the palette is not chosen**: black
and `#d6ff4e` are Intech Studio's ZONA identity, inherited, measured against WCAG in
`src/lib/ui/identity.spec.ts`, and shipped since Phase 4. An inherited brand constraint is not a
training-data reflex. What the checks *do* catch is the CRT: "CRT and glitch" predicts a
cyberpunk/esports display face, and that is precisely why §5 rejects the face that would have been
the obvious pick.

---

## 1. Design System

| Property | Value |
|----------|-------|
| Tool | none. No shadcn, no `components.json`, no component library, no icon library. Unchanged since Phase 4 |
| Preset | not applicable |
| Component library | none — hand-written Svelte 5 components in `src/lib/ui/` |
| Icon library | none. **This phase ships no new icon and no new SVG.** Phase 5's X-22 holds: every state that needs a non-colour channel gets one from shape, position, tracking, number, disabled state or copy |
| Styling | Tailwind CSS v4 utilities plus the `@theme` token block in `src/app.css` |
| Display font | `@fontsource-variable/archivo@5.3.0` (OFL-1.1), latin `wght` subset, 34,928 B — reached **only** through `--font-display` (D-14) |
| Body font | `@fontsource-variable/inter@5.3.0` (OFL-1.1), latin `wght` **upright** subset, 48,256 B (D-12: not italic) |
| Numerals | the system monospace stack, unchanged, zero bytes |
| Retired | `@fontsource/quicksand@5.3.0` — uninstalled, its `licenses/` file removed by `npm run licenses`, and the hard-coded attribution at `scripts/gen-licenses.mjs:165-167` rewritten in the same commit |
| Registry | not applicable |

**Font bytes, measured.** Today 31,640 B (two Quicksand statics). After: 83,184 B (two variable
files, nine weights each). **+51,544 B, +163%** — and less than a third of the 271,581-byte `wasmoon`
glue that already ships lazily. Both files are latin-only, self-hosted from `node_modules`, and never
a CDN, exactly as `src/app.css:3-8` already requires.

---

## 2. What is already fixed, and is not re-decided here

| Concern | Ruling | Status in Phase 10 |
|---------|--------|--------------------|
| Spacing scale | 4 / 8 / 16 / 24 / 32 / 48 / 64 plus four declared exceptions | Inherited. One exception is added (§6) |
| Palette size | Nine tokens, no tenth. Three hexes, no fourth hue | **Inherited verbatim.** No token is added, changed or removed by this phase |
| Accent reserved list | Eight entries (six from Phase 4, two from Phase 5) | **Inherited verbatim. No addition.** §7.2 shows the working |
| `--color-over` | Exactly three uses, all of them the over-budget meter | Inherited. CLEAR does **not** get it (§10.4) |
| Pad exemption | `PadSim` emits real firmware RGB; those pixels are content | Inherited, and extended by one clause to the picker (§7.3) |
| The four painter prohibitions | `src/lib/sim/paint.ts:17-37`, asserted against a recording context | **Inherited verbatim, and they are what forbids `hue-rotate` in the glitch** (§8.4) |
| 44px touch floor | Per control, never per page | Inherited. Every new control declares it (§14) |
| Focus ring | `2px solid #d6ff4e`, `outline-offset: 4px`, never removed, never animated | Inherited |
| Simulation semantics | 10 ms tick, 100 ms catch-up clamp, one rAF, `IntersectionObserver { threshold: 0, rootMargin: "200px" }`, at most one touch sample per contact per tick, zero `setInterval` | **Inherited verbatim.** The demo paths of §9.3 go through the same queue at the same rate |
| SAFE-02's tiers | The primary is the one accent fill; `KEEP ON DEVICE` is Quiet; they are never equal-weight | **Inherited verbatim.** D-04's "one sequence" is carried by a caption, by DOM order and by enablement, never by equalising weight (§10.2) |
| SAFE-03 / SAFE-07 | A snapshot before any write; "landed" means an ACKNOWLEDGE frame | Inherited, and CLEAR obeys both (§10.5) |
| Copy rules | Mixed-case sentences, wide-tracked uppercase for labels and captions of at most two words, no emoji, no exclamation marks, U+2019, U+2026, U+2014, U+00B7, never "Error", never "loading", never a browser engine named, no string names an off-screen control | Inherited. One character is added (§13.0) |

### The one place the skill and the repository disagree, and which wins

`impeccable`'s shared design laws say **"No em dashes."** This repository's copy contract requires
**"a real em dash (U+2014)"** (`src/lib/device/install-copy.ts:44-47`) and asserts it. The repository
wins: it is a project instruction, it is enforced by a shipped test, and the phase brief's own copy
rule is "no hyphen as a dash", which is the same rule stated from the other side. Recorded here so a
later reader does not resolve it the other way.

---

## 3. The amendment register

Every retirement in this document, in one table, so the planner can turn it into tasks and the
checker can count it. **Eleven copy retirements, nine gate amendments, four data re-cuts.** Nothing
is deleted; everything is rewritten by name.

### 3.1 Copy retirements (eleven)

| # | String | Where it lives | Pinned | Ruling | §  |
|---|--------|----------------|--------|--------|----|
| R-01 | `You’ve got to start somewhere…` | `FrontDoor.svelte:180` | literal | **Retired.** Replaced by `PICK ONE · IT IS ALREADY RUNNING` (32) in the Micro role | 13.2 |
| R-02 | `PICKER_EXPLAINER` | `session-copy.ts:193-194` | **130** | **Retired outright.** The browser's own prompt explains itself the instant it appears; a paragraph predicting it is the definition of unnecessary text. CONN-03 is satisfied by the `SAFE_NOTE` beneath the control | 13.2 |
| R-03 | `SAFE_PROMISE` | `session-copy.ts:220-221`, rendered at `DeviceDetails.svelte:305` and `DeviceNote.svelte:191` | **88**, `session-copy.spec.ts:298` | **Retired as a paragraph, preserved as a guarantee.** Replaced by `SAFE_NOTE` (35), a permanent unconditional line on the primary control. SAFE-01 stays `[x]`; `REQUIREMENTS.md:169`'s closure record is amended by name and dated. **This is Open for the user, item 1** | 10.1 |
| R-04 | `FIDELITY_LINE` | `fidelity-line.ts:28-29` | **231** | **Retired at 231, rewritten at 44.** `Every pad here runs the firmware’s own code.` PREV-03's claim is kept whole; the "what a screen cannot show" apology is retired | 13.2 |
| R-05 | `HONESTY_NO_SESSION` | `install-copy.ts:105-106` | ≤129 | **Retired, rewritten at 70.** Z-08 holds: "About a second" is still in exactly the first two honesty strings and nowhere else | 13.3 |
| R-06 | `HONESTY_READY` | `install-copy.ts` | ≤129 | **Retired, rewritten at 90.** Shorter, same two facts | 13.3 |
| R-07 | `SHARE_QUIET_LINE` | `copy.ts:198`, `copy.spec.ts:277` | literal | **Retired outright, no replacement.** `COPY LINK` names itself | 13.3 |
| R-08 | `RECONNECT_OFFER` | `session-copy.ts` | **88** | **Retired, rewritten at 37.** Its "nothing is sent until you do" clause is now carried permanently by `SAFE_NOTE`, so repeating it here was the same promise twice | 13.3 |
| R-09 | `KEPT` body 2, first sentence | `install-copy.ts` | ≤ cap | **Retired.** `HANGAR read both scripts back and they match, character for character.` is a boast about a check the site would not have called `KEPT` without. The restart sentence stays, at 53 | 13.3 |
| R-10 | `RESTS_DARK_NOTE` | `listing.ts:65`, asserted in both directions by `listing.spec.ts:249-252` and `copy.spec.ts:173-174` | literal | **Retired.** D-09 makes it false: after this phase no card rests dark | 9.3 |
| R-11 | `TWO_STEP`, `PERMISSION_DECLINED`, `PUT_BACK_LINE`, `KEEP_ON_DEVICE`'s enabled line and all six reasons, every failure detail and every step | various | various | **NOT retired, and the rule is stated so nobody retires them next.** See the audit rule below |

**The audit rule, which closes D-08's "and others of the same kind" at eleven:**

> A string is retired only when the control beside it, or the pixels beside it, already say the same
> thing. **A string that names a risk, a consequence, a way back or a next step is never retired**,
> however long it is. That is why the eleven above go and the seven failure blocks stay whole.

### 3.2 Gate amendments (nine)

| # | Gate | Amendment | §  |
|---|------|-----------|----|
| G-01 | `src/lib/ui/identity.spec.ts` | `--font-sans`'s first family becomes `"Inter Variable"`; a new assertion pins `--font-display`'s first family to the family named in the file's single `@font-face` block; the `rgb()`-arguments regex widens from `^214 255 78 / [0-9.]+$` to `^(214 255 78\|0 0 0) / [0-9.]+$`. **The hex set stays at three. The token count stays at nine. The favicon's two-hue regex is untouched.** X-27's shape, and its own paragraph | 5, 8.2 |
| G-02 | `src/lib/ui/tune-ui.spec.ts` | The 56px meters block and the 152px region are re-derived and hold. `HONESTY_CAP`'s value changes | 12 |
| G-03 | `src/lib/ui/device-ui.spec.ts` | `min-block-size: 72px` on the honesty slot becomes `48px`; `PUT_BACK_CAP`, `KEEP_CAP` and a new `CLEAR_CAP` are re-derived; the control walk gains `Clear.svelte` and `ClearConfirm.svelte` | 12 |
| G-04 | `src/lib/device/install-copy.spec.ts` | Seven control labels become **nine**; twelve utterances become **thirteen**; seven failure builders stay **seven**; the three caps become four and all four change value | 10.6 |
| G-05 | `src/lib/device/session.spec.ts` test 15 | The source scan's **eight needles become nine** — a `clear.bind`-shaped export must not slip past | 10.7 |
| G-06 | `src/lib/device/install.spec.ts` test 4 | The write-class enumeration gains CLEAR's class. The assertion's wording is unchanged and its reach is wider | 10.7 |
| G-07 | `src/lib/tune/reachability.sweep.spec.ts` | **Restructured, not extended.** The colour dimension is costed separately instead of cross-producted. State count falls | 11.4 |
| G-08 | `src/lib/browse/sort.spec.ts` | `3 × n × (n − 1)` becomes `2 × n × (n − 1)`; the `NEWEST` date-block test is retired by name | 9.5 |
| G-09 | `src/lib/browse/filter.spec.ts` and `src/lib/catalog/copy.spec.ts` | `RECORDED` and `KNOWN_TAGS` are re-cut to the sixteen-term vocabulary; the "chips are tags carried by two or more entries" derivation is retired and replaced by "chips are the facet members" | 9.4 |

### 3.3 Data re-cuts (four)

| # | Data | Re-cut |
|---|------|--------|
| D-a | `listing.ts` tag arrays, all thirty-six | 55 terms and 4-per-entry become **16 terms and exactly 3 per entry** (one `FOR`, two `FEELS`). The full assignment is in §9.4 |
| D-b | `ListingEntry.addedAt` | **Removed from the browse projection**, kept in the catalog entries as provenance. `listing.spec.ts`'s equality loop drops one field and no entry file is touched |
| D-c | `restsBlack` | **Kept as a recorded fact** (it is what selects a demo path, and its two-directional assertion against `frames.json` is the site's proof that no card is accidentally black) and **retired as a rendering input** |
| D-d | `static/og/` | Four OG images regenerate from the end of their demo path rather than from a black rest frame. ETCH's 4,192-byte black square is the marker that this landed |

---

## 4. Requirements this phase extends or retires

| ID | Ruling |
|----|--------|
| SAFE-01 | **Kept whole, mechanism changed.** The connect screen still says so out loud, in 35 characters on the control instead of 88 in a paragraph. `REQUIREMENTS.md:169` is amended by name |
| SAFE-02 | **Kept verbatim.** D-04's sequence is caption, order and enablement. CLEAR takes a fourth tier that is neither Primary nor Quiet |
| SAFE-03 / SAFE-04 | **Kept, and extended to a fourth click.** CLEAR refuses to run without a snapshot and `PUT BACK` is offered after it |
| SAFE-05 | **Extended.** CLEAR's confirmation names what is removed and what a power cycle brings back |
| SAFE-07 | **Kept verbatim.** `cleared` means an ACKNOWLEDGE frame arrived, never a resolved writer promise |
| PREV-03 | **Kept, at 44 characters instead of 231** |
| CONN-03 | **Amended.** The pre-click explanation is retired; the standing safety line satisfies the requirement's intent, and the browser's own prompt satisfies the rest |
| TUNE-01 | **Amended by one clause.** "Three to six knobs" counts *knobs*, not controls: the `colour` kind is one knob presented as three rails and one result pad |
| TUNE-05 | **Stays proven-unreachable, with a new number.** §11.4 shows how |
| SHARE-01 / SHARE-03 | **Extended.** A new stamp format letter `w` for Lua entries; format `x` keeps decoding forever, so links in the wild still land `restored` |
| DEGR-02 | **Extended.** CLEAR joins the present-but-disabled set on browsers that cannot write, with its reason inline |
| CAT-02 | **Amended.** Three sorts become two |

---

## 5. Typography — the type settlement

### 5.1 The one swappable token (D-14)

`src/app.css` declares **exactly one** `@font-face`-adjacent display arrangement and **exactly one**
custom property that names it. No component, no utility class and no other rule ever writes a display
family name.

```css
/* Body: Inter Variable, upright, latin only, weight axis 100-900, one file.
   Written out rather than @import-ed because @fontsource-variable ships only
   axis-scoped CSS carrying all seven subsets, six of which HANGAR never uses. */
@font-face {
  font-family: "Inter Variable";
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url("@fontsource-variable/inter/files/inter-latin-wght-normal.woff2")
       format("woff2-variations");
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA,
                 U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122,
                 U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

/* THE ONE SWAPPABLE BLOCK (D-14). If the Grifter licence lands with a
   redistribution grant, this block's family and src change and --font-display's
   first family changes. Two lines. Nothing else in the repository moves. */
@font-face {
  font-family: "Archivo Variable";
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url("@fontsource-variable/archivo/files/archivo-latin-wght-normal.woff2")
       format("woff2-variations");
  unicode-range: /* the same latin range */;
}

@theme {
  --font-display: "Archivo Variable", ui-sans-serif, system-ui, "Segoe UI", sans-serif;
  --font-sans: "Inter Variable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-mono: /* unchanged, byte for byte */;
}
```

**The swap is two lines and it is asserted.** G-01 adds an assertion that `--font-display`'s first
family string equals the `font-family` of the second `@font-face` block, so a token edited without
its face, or a face edited without its token, is red rather than silently falling through to
`system-ui`.

**Why Archivo and not the obvious pick.** `10-RESEARCH.md` §1.7 offers three OFL-1.1 faces. Chakra
Petch is the one that "sits well beside a CRT treatment" and it is a fifth of the bytes. It is also
**exactly what the skill's second-order reflex check catches**: hardware playground plus CRT predicts
a machined esports display face, and picking it would make HANGAR look like the category rather than
like ZONA. Archivo is a grotesque drawn for display and small text, it is the closest open face to
Grifter's sporty wide grotesque, and — the deciding argument — **the reference's own width comes from
tracking, not from a width axis**: the ZONA landing's character is `--track-xl: .62em` on a light
weight (`10-RESEARCH.md` §3.1). Archivo's 34,928-byte weight-only file plus HANGAR's tracking gets
there; the 90,104-byte width axis buys 55 KB of nothing.

### 5.2 The scale — four sizes, two families, two weights per family

| Role | Family | Size | Weight | Line height | Tracking | Case | Used for |
|------|--------|------|--------|-------------|----------|------|----------|
| **Display** | `--font-display` | 28px | 900 | 1.05 | 0.50em | UPPERCASE | The splash wordmark, and only that |
| **Heading** | `--font-display` | 20px | 700 | 1.15 | 0.02em | Mixed | The configuration name in the name plate. The only heading on the site |
| **Micro** | `--font-display` | 12px | 700 | 1.2 | 0.18em | UPPERCASE | Every button label, every region caption, the `FEATURED` mark, the new headline, both facet captions, `SCREEN`, `NEXT`, `HOLD` / `HELD` |
| **Micro (title)** | `--font-sans` | 12px | 600 | 1.2 | 0.01em | Sentence | Every failure and state title, every knob label, every word-row option, every card tag, the `SAFE_NOTE` |
| **Body** | `--font-sans` | 16px | 400 | 1.5 | 0 | Mixed | Every sentence on the site |

Size ratios: 12 → 16 is 1.33, 16 → 20 is 1.25, 20 → 28 is 1.40. Every step clears the skill's 1.25
floor.

**The weight rule, amended by name.** Phase 4 W-04 declared *exactly two weights*. This phase
declares **exactly two weights per family, and the families are two** — display 700 / 900, body
400 / 600. Both are variable files, so the second weight in each family costs **zero bytes**, and no
third weight in either family ships. The amendment is deliberate and its reason is that a display
face and a body face carrying one weight each cannot make a poster and a paragraph out of the same
ladder.

**Rules that survive unchanged.**

- Uppercase stays reserved for the wordmark, button labels and structural captions of **at most two
  words**. Every new uppercase string in §13 is a label or a one- or two-word caption. `PICK ONE ·
  IT IS ALREADY RUNNING` is the single exception and it is declared as one: it is a **headline set in
  the Micro role**, not a caption, and it earns the case because it is the only line on the front
  door that is not a sentence.
- "Quiet" is achieved with colour, never with a smaller size.
- **No italics anywhere** (D-12). Inter's italic file is not installed, not imported, and not
  referenced. `10-RESEARCH.md` §2.5's five mitigations for all-italic body text are moot and the
  document should be read as superseded on that point.
- `--font-mono` is unchanged and stays confined to numerals and machine text. Phase 5 confined it to
  four uses; **§11.3 adds a fifth**, the forecast delta, and names it.
- Canvas-drawn texture stays exempt.

### 5.3 What the family change costs downstream, and it is not a cleanup

Inter's x-height at 16px is materially larger than Quicksand's and its average advance is narrower,
so **every reservation that is arithmetic from a character count changes**. §12 re-derives all five.
`font-display: swap` stays Fontsource's default and is right here: the ground is black and the
fallback is a system sans, so the flash is a weight change, not a layout jump.

---

## 6. Spacing Scale

Phase 4's tokens, unchanged, and this phase adds no spacing value.

| Token | Value | Usage in this phase |
|-------|-------|---------------------|
| xs | 4px | Detent gaps inside a picker rail; gap between a facet chip and its neighbour |
| sm | 8px | Gap between a control and its line; gap between the two facet rows |
| md | 16px | Gap between the three cells of the `NEXT` group; picker rail to picker rail; the picker's result pad to the rails |
| lg | 24px | Panel padding and the hairline gaps, unchanged. **The hairline above CLEAR is a second one, at the same 24 / 1px / 24 rhythm** |
| xl | 32px | Front door: headline to coverflow band; band to facet row |
| 2xl | 48px | Fidelity line to the last grid row (05.1's, unchanged) |
| 3xl | 64px | Page to footer, unchanged |

**Declared non-token values, inherited:** the 44px interactive floor; the coverflow's
viewport-relative geometry; the 2 / 6 / 10px radius scale and the insets derived from it; the 14px
fixed line box on every 12px line inside the tuning region.

**One new declared exception, and it is a texture metric rather than spacing:**

5. **The scanline period is 5px** — one 1px dark line every 5px. Not 4px, which is the reference's.
   At Phase 4's 16px Body in a 24px line box, a 4px period crosses a line of text six times and a 5px
   period crosses it 4.8 times, and the beat frequency against a 24px box is what turns a scanline
   into moiré. It never crosses text at all in this contract (§8.3), so the number is chosen for pad
   frames, where a 5px period over a 9-cell grid upscaled to 260–560px reads as scan structure rather
   than as a screen door. It is a texture metric in the same class as the coverflow's depth ladder,
   and it is not on the 4-point scale on purpose.

`overflow-x: auto` and `overflow-x: scroll` still appear nowhere inside the tuning region, and the
prohibition now extends to the picker's three rails: a rail wraps or shrinks, it never scrolls.

---

## 7. Color

### 7.1 The ladder, unchanged

**Nine tokens. Three hexes. No tenth token, no fourth hue, no new alpha in the ladder.** The table in
`04-UI-SPEC.md` and `05-UI-SPEC.md` stands verbatim and is not restated here, because restating it is
how a ladder grows a tenth rung.

Generated texture stays outside the ladder, as Phase 4 declared. This phase adds **two** members to
that declared set, and both are stated so they cannot be mistaken for tokens:

| Texture | Value | Where |
|---------|-------|-------|
| Ground halftone | `rgb(214 255 78 / 0.04)` at `background-size: 3px 3px` | `body::before`, behind all content (§8.3, Layer G) |
| Scanline | `rgb(0 0 0 / 0.50)` inside a layer at `opacity: 0.18` | Pad frames only (§8.3, Layer S) |

The scanline is **the ground at an alpha, not a hue**. It darkens; it never tints. That is the whole
justification for G-01's widening of the `rgb()`-arguments regex, and the widened guard still fails
on any third set of channels.

### 7.2 Accent — the reserved list, restated in full with **no** addition

1. The splash wordmark and the lime rectangles punched through the glyph field.
2. The solid triangles in the name plate.
3. The `TRY ON DEVICE` button fill when it is enabled.
4. The focus ring.
5. The header wordmark.
6. The one walking cell in the 9×9 loading motif.
7. The fill of the two budget meters, while in budget.
8. The selected value of a knob: the filled dot, the detent fill and thumb, the selected word, and
   the 2px ring around the selected swatch.

**It stays at eight, and that is a result rather than an accident.** Four things in this phase were
candidates and each was solved without accent:

| Candidate | Solved by |
|-----------|-----------|
| The picker's selected detent | **Already item 8.** A detent is the selected value of a knob |
| A knob's held state (§11.5) | The word changes `HOLD` → `HELD`, and the default marker changes from a 2px dot to a 2px `--color-line` bar. Two non-colour channels |
| The `NEXT` sequence marks | There are none. The sequence is a caption, DOM order and enablement (§10.2) |
| CLEAR's destructive weight | Tracking, position, a second hairline and a confirmation (§10.4) |

### 7.3 The picker's arbitrary colour, and the fence around it

The pad exemption is extended by exactly one clause, in the X-27 style, and the fence is a single
sentence.

> **A-09 — the pad exemption extends from colour swatches to the picker's detents and its result pad,
> and to nothing else in this phase.** Every filled pixel inside the picker is a colour the ZONA will
> emit at that index, drawn as a flat fill of an exact stored RGB444 value. Every line, ring, label,
> tick, number and caption around it is lime on black.
>
> **There is no third category.** An HSV gradient field, a hue ring, a saturation/value square, a
> continuous slider, a CSS gradient of any kind on a rail, and `<input type="color">` are each
> **forbidden by name**, for the same reason: every one of them authors colour in CSS, and every one
> of them implies a resolution the state does not have. `src/lib/tune/knobs.preset.ts:135-137`
> already wrote the argument; this clause is its conclusion.

Everything that follows from that fence: 05-UI-SPEC's "no gradients on a swatch, no tint, no glow, no
`filter` of any kind" applies verbatim to every part of the picker, `paint.spec.ts`'s four
prohibitions are untouched, and a checker looking at a screenshot will see up to 4,096 non-lime cells
inside one panel. That is correct and required by D-06.

---

## 8. The CRT and glitch treatment (D-07, confirmed)

### 8.1 What is being reproduced, and what is deliberately not

`10-RESEARCH.md` §3.1 read the ZONA landing's production stylesheet and found five techniques.
Three ship here, one ships in a changed form, and one does not ship at all.

| Reference technique | Here |
|---------------------|------|
| `repeating-linear-gradient` scanlines, static | **Ships**, period widened 4px → 5px, alpha 0.62 → 0.50, layer opacity 0.30 → 0.18 |
| `feTurbulence` SVG data-URI noise tile, static | **Ships**, 240px tile painted at 220px exactly as the reference does it, layer opacity ≤ 0.10 (the reference's own interactive-surface figure is 0.12) |
| `box-shadow: inset` vignette, static | **Ships**, on the page ground only |
| A 22%-tall translucent bar sweeping on a 6.5s transform | **Ships, once for the page, on the hero shell only.** The reference's cold blue `#bed7ff12` becomes `rgb(214 255 78 / 0.05)`: a borrowed hue would be a fourth colour |
| `step-end` "tear" with `filter`, `clip-path` and `translate` | **Ships without the `filter`.** `hue-rotate`, `saturate`, `contrast` and `brightness` are all removed. `clip-path: inset()` and `transform: translateX()` carry the whole effect |
| Chromatic aberration | **The reference does not use it and neither does this.** Worth stating, because "CRT" is usually assumed to require it and it is the most expensive of the common techniques |

**The reference's own reduced-motion block does not stop its scanline sweep** (`10-RESEARCH.md` §3.1,
quoted in full there). HANGAR's contract is stricter, so this treatment is **re-derived under
HANGAR's rules rather than ported**, and §8.6 is the assertion that makes the difference real.

### 8.2 Layer order, stated against the fragile thing it must not break

`Coverflow.svelte:14-19` records that any `overflow` other than `visible` or `clip`, an `opacity`
below 1, a `filter`, a `mask-image`, a `mix-blend-mode` or `contain: paint` **on or above** the 3D
context forces `transform-style: flat` on its descendants and collapses the seven-slot depth ladder
into a row of equal squares. It does not error. It just renders wrong.

**So the placement rule is stated as ancestry, which is the only thing that matters:**

> No CRT layer is ever an **ancestor** of `Coverflow.svelte`'s `.band` or `.stage`, and no CRT
> property is ever set **on** either of them. Every layer is either a **sibling** of the 3D context,
> or a **leaf inside** it, or **behind all content** entirely. A pseudo-element's `opacity` applies
> to the pseudo-element and never to its originating element, so a `::before` on an ancestor is safe;
> a rule on the ancestor itself is not, and the source scan of §8.6 refuses both.

The complete order, from the ground up:

| z | Layer | Element | Relationship to the 3D context |
|---|-------|---------|--------------------------------|
| −1 | **G — ground** | `body::before`, `position: fixed; inset: 0; pointer-events: none` | **Behind all content.** Never an ancestor of anything |
| 0 | — | The page's own content, including `.band` and `.stage`, untouched | — |
| 2 | (existing) | The pad's gutter grid and dot field, unchanged | leaf |
| 3 | **S — scanlines + noise** | `PadFrame.svelte`'s frame `::after`, one pseudo-element, two background layers, `pointer-events: none`, inside the 10px radius | **A leaf of the 3D tree**, the same position `filter: brightness()` already legally occupies (Coverflow rule 2). It has no 3D children to flatten |
| 4 | **R — roll bar** | A real `<div aria-hidden="true">`, a **sibling of `.band`** inside the hero shell, `position: absolute; inset: 0; pointer-events: none`. Exactly **one instance for the whole page** | **A sibling.** Never an ancestor |
| 5 | **T — tear** | A `step-end` animation on a panel's own border box, on a discrete event, ≤ 300 ms | Never near the coverflow, never on a pad, never on a canvas |

**No layer is a `position: fixed` overlay above the content.** A full-viewport fixed overlay would be
structurally safe for the coverflow — a sibling is not an ancestor — and it is what the reference
does, and it is rejected here anyway for two reasons: it would cover text nodes (§8.3), and a texture
that does not scroll with the pads reads as glass on the screen rather than as the screen itself.

### 8.3 Scope — the rule that keeps the contrast gate honest

> **The CRT layer never covers a text node.** Layer G sits behind all content. Layer S is scoped to
> pad frames. Layer R is scoped to the hero shell, which contains the band and no prose. Layer T
> animates a border box, not its contents. Every layer carries `pointer-events: none`, and **no
> text-bearing element is a descendant of a CRT container.**

This is the whole answer to `10-RESEARCH.md` §3.5's second silent-green hole. The arithmetic there is
not disputed: a 0.186-alpha black line over `--color-ink-quiet` drops it from 5.6:1 to about 3.9:1,
below AA, while `identity.spec.ts` stays green because it computes contrast from the **declared
alpha**. The resolution is not to make the spec composite an overlay; it is to make the overlay
unable to reach the text, and to **assert the scoping structurally** so the honesty of the existing
computation is a property of the source rather than of somebody's care.

Consequences, all of them good: `--color-ink-quiet` and `--color-ink-dim` keep their measured ratios,
`identity.spec.ts` stays a true statement, and the CRT reads as *screen texture behind the interface*
rather than as *dirt on the words* — which is closer to what a real CRT looked like anyway.

**If the user wants a scanline over the hero copy after all**, the mitigations are listed in Open for
the user, item 8, and they include a real compositing measurement and a new gate. This document rules
against it and offers the reversal rather than assuming it.

### 8.4 Where the glitch fires, and where it must not

The tear is a **meaning**, never a decoration. It fires on three events and on nothing else:

| Fires | Why it means something |
|-------|------------------------|
| **The connect moment** — `navigator.serial`'s `connect` event, a permitted ZONA physically plugged in | Real hardware caused it. 180 ms flick on the device panel's border box |
| **`SURPRISE ME` and `MIX TWO`** | The state is being rerolled and the tear is the reroll. 180 ms on the tune panel's border box |
| **Crossing into over budget** | One flick as the meter turns. It reinforces the six existing non-colour signals, and 05-UI-SPEC's "colour is never the only channel" gets a seventh |

| Never | Why |
|-------|-----|
| **On any failure state** | Seven failure blocks exist. A glitch on a failure reads as "the site is broken", which is the opposite of what Phase 7's copy achieves |
| **On a pad canvas** | `paint.ts:17-35` forbids any CSS filter that adds or tints colour on a pad. A `hue-rotate` tear over a pad is a **fidelity violation**, not a style choice: the product's central claim is that the pixels are the firmware's |
| **On a recurring idle timer** | A page that tears every eight seconds by itself is exactly the "overwhelming" D-07 rules out, and it fights the 30 fps paint forever |
| **With any `filter`** | Removed from the ported keyframes entirely. `clip-path: inset()` plus `transform: translateX(±1.6%..3.2%)` over seven `step-end` states carries it |

### 8.5 Cost, against the real canvas count

The brief's "up to four live canvases" is wrong, and the budget depends on the real number.

| Surface | Concurrent live canvases | Source |
|---------|--------------------------|--------|
| `/` | **up to 7** — hero plus three either side | `src/lib/coverflow/slots.ts:16,138` (`MAX_SLOT = 3`) |
| `/browse/` | **up to 36 mounted**, at most 4 columns × visible rows animating, gated by `IntersectionObserver { threshold: 0, rootMargin: "200px" }` | `src/lib/browse/grid.ts:23`; `src/lib/sim/host.ts:155` |

| Layer | Per-frame cost | Instances | Memory |
|-------|----------------|-----------|--------|
| G | **Zero by construction.** Two static backgrounds and one inset shadow, rasterised once | 1 | one viewport-sized painted layer |
| S | **Zero by construction.** A gradient and a decoded bitmap tile, cached, no promotion, no `will-change` | 7 on `/`, up to 36 on `/browse/` | paint area only, at first paint and on resize |
| R | **Zero repaint.** One composited transform on a promoted layer | **1, for the page** | one hero-shell RGBA surface, roughly 4.6 MB at 1920×600 |
| T | Seven discrete composited states over ≤ 300 ms | at most 1 at a time | negligible |

**Layer S is the one to measure, and the contract requires the measurement rather than accepting an
estimate.** `10-RESEARCH.md` §3.3 offers no fps figure and is right not to: no published benchmark
exists for a CSS scanline overlay above N animating canvases, and none was run on this machine.

> **Wave 0 measurement, recorded as a number in the wave summary.** On `/browse/` at thirty-six
> entries, in `chromium` and `webkit-phone`: first-paint time and the 95th-percentile frame time
> during a full scroll of the grid, **with Layer S and with `SCREEN: FLAT`**. If the delta exceeds
> 2 ms at the 95th percentile, Layer S is scoped to the front door's seven frames only and the browse
> grid keeps Layer G alone. That fallback is a one-line selector change and it is declared here so it
> is a decision rather than a discovery.

**What is forbidden outright**, inherited from `CLAUDE.md` and `10-RESEARCH.md` §3.3 and restated so
a redesign does not reach for it: `backdrop-filter` anywhere; one WebGL context per card (Chrome caps
live contexts at roughly 16 per tab, Firefox at 8 per principal, and exceeding it fires
`webglcontextlost` on the *least recently used* context — the cards the visitor just scrolled to);
canvas post-processing of a full-viewport surface; `shadowBlur` per lit cell; 81 DOM elements per
card; 81 `strokeRect` per card per frame.

### 8.6 The off switch, and it is two switches

`10-RESEARCH.md` §3.4's design rule is adopted verbatim, because the reference's own bug is a direct
consequence of ignoring it:

> **Every CRT layer's presence and motion is gated by one attribute on `<html>` and one custom
> property.** `data-screen="textured" | "flat"` sets `--crt: 1 | 0`, and each layer's `display`,
> `background-image` and `animation` are derived from it. The off switch is one attribute, not a
> hunt. The reference spread its motion across `:before` and `:after` on two components, which is
> precisely why its own reduced-motion block missed the scanline sweep.

**Switch 1 — `prefers-reduced-motion: reduce`.** Layer R's `animation: none`; Layer T's
`animation: none`; Layers G and S unaffected, because they do not move. Read in CSS **and** in JS via
the host's existing live `matchMedia` subscription (`src/lib/sim/host.ts:93-94,160-167,200`) — never
a second one-off subscription.

**Switch 2 — a visible control, and the answer to D-07-confirmed's open half is yes.**

The OS setting is not enough, and the reason is not politeness. `prefers-reduced-motion` is a
**motion** preference, and two of the four layers do not move. Their cost is **legibility and taste**,
not motion. A visitor with low vision, or on a low-end machine, or who simply does not want the
texture, has no OS setting that reaches Layers G and S. So:

| Property | Value |
|----------|-------|
| Where | The footer, in `+layout.svelte`, beside the existing links. On every route, costing the front door one 44px row |
| Shape | Phase 5's **word-row widget**, unchanged in markup and behaviour: a `role="radiogroup"` of real `<input type="radio">` inside `<label>`s, one tab stop, arrow keys move and select. Reusing the knob vocabulary for a page control is the site's established move (05.1 did it for `SORT`) |
| Caption | `SCREEN`, Micro, `--color-ink-quiet` |
| Options | `TEXTURED` · `FLAT`, Micro, selected in `--color-accent` (reserved-list item 8: the selected value of a knob-vocabulary control) |
| Default | `TEXTURED`, **except** when `prefers-reduced-motion: reduce` is set at first paint, where the default is `FLAT` |
| Effect of `FLAT` | **All four layers off**, including the two static ones. `--crt: 0` |
| Persistence | `localStorage` key `hangar.screen.v1`, a single string. Guarded read, exactly as the snapshot store is (a throwing store must not break the page). It never touches `hangar.snapshot.v1` |
| Floor | `min-block-size: 44px` per option |

**Switch 3, automatic and not visible.** Layer R does not mount at all when
`navigator.hardwareConcurrency <= 4`. It is the only layer with a per-frame compositor cost and the
only one worth spending a capability check on. Feature-detected, never browser-sniffed.

### 8.7 The assertions, because the existing ones would stay green

`e2e/browse.e2e.ts:140-148` and its twin at `e2e/first-experience.e2e.ts:87` read the **9×9 canvas
backing store**. A CSS overlay painted above the canvas by the compositor never touches that backing
store. **A sweeping scanline bar over the pads would leave every existing reduced-motion assertion
green.** The tests would lie. Two new gates close it.

**`e2e/aesthetic.e2e.ts` — new, both projects (`chromium` and `webkit-phone`).**

1. Under `emulateMedia({ reducedMotion: "reduce" })` called **before** `goto`, with
   `matchMedia("(prefers-reduced-motion: reduce)").matches` asserted true as the existing suites do:
   `getComputedStyle(rollBar).animationName === "none"`, and the same for any element carrying the
   tear class.
2. With `SCREEN: FLAT` selected: `getComputedStyle(document.documentElement).getPropertyValue("--crt")`
   is `0`, the roll bar is absent from the DOM, and `getComputedStyle(padFrame, "::after").content`
   is `none`.
3. The `SCREEN` choice survives a navigation from `/` to `/browse/` and a reload.

**`src/lib/ui/aesthetic.spec.ts` — new, a source scan in `front-door.spec.ts`'s idiom.**

1. The four layer selectors appear only in an explicit allowlist of files, with a floor so the walk
   cannot pass vacuously.
2. Every layer declares `pointer-events: none`.
3. **No text-bearing element is a descendant of a CRT container**, expressed as: no CRT selector
   appears in the same component as a rendered `<p>`, `<h*>`, `<label>`, `<button>` or `{...}` text
   expression, except through the allowlist.
4. `Coverflow.svelte` declares no `filter`, `mix-blend-mode`, `opacity` below 1, `mask-image` or
   `contain: paint` on `.band` or `.stage`, and no ancestor component sets one on the element that
   hosts them. The existing `filter: brightness()` on a **slot** is explicitly permitted by name.
5. No CRT selector names a `canvas`.
6. The noise data-URI declares no `fill` attribute other than the filter's own output, so the tile
   cannot smuggle in a hue.

**`e2e/browse.e2e.ts`'s existing reduced-motion test is amended, not replaced** — see §9.3, where it
gets **stronger** rather than looser.

---

## 9. The front door and browse at thirty-six

### 9.1 D-03 — both paths first-class, one surface at two depths

The ring stays at **8**, `EXCLUDED_FROM_ROW` stays at **28**, and `front-door.ts`'s partition
assertion and its import prohibition are untouched. What changes is that the front door **becomes the
entry to browse instead of a rival to it**.

`/`, top to bottom:

1. Splash, unchanged.
2. Header: wordmark · device slot · header note (now 24px, §12) · `BROWSE ALL`.
3. **Headline**, Micro role: `PICK ONE · IT IS ALREADY RUNNING` (32).
4. Coverflow band, seven pads, unchanged geometry and unchanged depth ladder.
5. Name plate, unchanged.
6. **New — the `FOR` row.** The ten workflow terms, rendered on `/` as **links**, not checkboxes:
   each is an `<a href="/browse/?for={term}">`. A link keeps the front door prerendered, keeps its
   `<head>` intact, and keeps the page import-free.
7. Fidelity line, now 44 characters.
8. Footer, plus the `SCREEN` toggle.

> **The facet vocabulary lives in `src/lib/browse/facets.ts`, which imports nothing at runtime** —
> the same discipline `front-door.ts:20-23` and `listing.ts` already carry, and for the same measured
> reason: the ten terms must be in the prerendered HTML at first paint and must not drag the
> 131,101-byte compiler chunk onto the critical path. `facets.spec.ts` scans its source and fails on
> any specifier that is not `import type`.

`/browse/` is unchanged in structure. Its toolbar's tag row becomes two facet rows (§9.4) and its
sort control loses one option (§9.5).

### 9.2 The card, unchanged except where D-09 touches it

Everything in 05.1-UI-SPEC's "Screen 2c — the card" holds: the reserved 16px `FEATURED` band, the
arrowless name plate as the one link, the whole-card `::after` overlay, `aria-hidden` on the pad
wrapper, the never-truncated description, the quiet non-interactive tag chips at 24.4px, the
`SIDE_INTERVAL_MS = 50` paint cadence, the two off-nominal states. Two things change: the resting-black
note is gone (§9.3), and each card now carries **three** quiet chips instead of three or four.

### 9.3 D-09 — no card rests dark

**The evidence first, because it decides the ruling.** `src/lib/catalog/frames.json` records
`nonZeroBytes` at ticks 0, 37, 101, 500 and 1009 for every entry. For **Trackpad, GHOST, MORPH and
ETCH** the value is **0 at every one of the five ticks**. There is no representative motion frame to
show, because with nothing touching them these four paint nothing at any tick. The choice D-09 offers
is therefore not "rest state versus motion frame"; it is this:

| Option | Cost |
|--------|------|
| **(a) Give the four configurations a non-black resting state** | Changes what the pad does on somebody's hardware, which is the one thing this site must never do quietly. Spends characters against 908 on four entries. Re-records `frames.json` and, for any ported entry, `golden-frames.json`. Rewrites four descriptions, four `quiet` lines and the `restsBlack` assertion in both directions. Regenerates four OG images. Re-runs the reachability sweep. **Rejected** |
| **(b) A scripted demonstration touch** | New machinery: a `DemoPath` type, four authored paths, a loop driver in `SimHost`, and one reduced-motion rule. **Touches no configuration, no Lua source, no character budget and no frame hash.** About forty lines and four short arrays. **Chosen** |

**The ruling, stated so it cannot be read as faking motion:**

> **Every card paints. A configuration that paints nothing until it is touched is given a finger, not
> a light.** `PadFrame.svelte` gains a `demo` mode. A `DemoPath` is a short array of
> `{ tick, pointer, event, x, y }` samples, replayed into the engine through the **existing**
> `src/lib/sim/touch.ts` queue at the **existing** rate — at most one sample per contact per 10 ms
> tick, MOVEs coalescing to newest, DOWN and UP always keeping their place — and looped over a fixed
> period. HANGAR supplies the gesture; the firmware supplies every lit pixel. **Motion is never
> faked**, and this is the sentence that keeps that true: a demo card shows what a real finger would
> make it do, drawn by the same code as a real finger.

Four paths, one per dark entry, authored with the entry and asserted for shape:

| Entry | The gesture the path performs |
|-------|-------------------------------|
| Trackpad | One finger crossing the pad and lifting, then two fingers scrolling |
| GHOST | One drag that leaves a ghost, then a lift — the ghost then retraces on its own, which is the entry's whole point |
| MORPH | A slide between two corners and back |
| ETCH | A short stroke drawn, then a fast sweep that wipes it |

Consequences, each a named amendment:

- **`restsBlack` is retired as a rendering input and kept as a recorded fact.** It is what selects a
  demo path, and its two-directional assertion against `frames.json` is the site's proof that a card
  is not accidentally black. Deleting it would delete the proof.
- **`RESTS_DARK_NOTE` is retired** (R-10). After this phase, no card rests dark, so the sentence is
  false. `listing.spec.ts:249-252` and `copy.spec.ts:173-174` are rewritten by name.
- **`stillFrameOf(entry)` gains a second branch.** Under `prefers-reduced-motion: reduce` a normal
  entry runs to tick 64 and freezes, as today; a **demo entry runs to the end of its path and
  freezes**. One rule, one function, and the demo is uninvited motion so it never loops under reduced
  motion.
- **`e2e/browse.e2e.ts`'s reduced-motion test gets stronger.** Its `dark` exemption — "three of the
  sixteen configurations are declared `restsBlack` and their still frames are legitimately black, so
  the two samples would be identical even if reduced motion did nothing" — is **retired**, and the
  replacement is an assertion the old test could not make: **under reduced motion every card,
  including those four, shows a still frame with `nonZeroBytes > 0`.** The suite loses an exemption
  and gains a universal.
- **`static/og/` regenerates.** ETCH's 4,192-byte black square is the marker that this landed.
  `scripts/gen-og.mjs` runs the demo path to its end before capturing.

### 9.4 D-10 — the tag vocabulary, re-cut

**Today, counted by script over `src/lib/catalog/listing.ts` at thirty-six entries:** 55 distinct
tags, **27 of them on exactly one entry**, 28 chips standing in the toolbar, up to 27 more behind
`MORE TAGS`, and 3 or 4 tags per entry. Three quarters of the vocabulary matches a single card. That
is a list, not a filter.

**The target: sixteen terms in two facets, exactly three per entry.**

> **The rule for what earns a chip: a term earns a chip when it is a member of a declared facet.
> Every facet member is always a chip.** The vocabulary is closed and lives in `facets.ts`; it is not
> derived from counts, so it does not drift as the catalog grows, and there is no `MORE TAGS`
> disclosure to build. An entry that cannot be described with these sixteen terms is evidence that the
> vocabulary is wrong, not that the entry needs a new word.

**Facet 1 — `FOR`, ten terms, exactly one per entry.** This is D-03's *niche and workflow*: what you
would reach for it to do.

| Term | n | Entries |
|------|---|---------|
| `modulation` | 9 | arc, dial, ghost, hold, joystick, morph, radar, shuttle, table |
| `show` | 5 | aurora, lumen, pinwheel, pomodoro, starfield |
| `keys` | 3 | chorus, keys, lattice |
| `mixing` | 3 | console, faders, strip |
| `sequencing` | 3 | euclid, sonar, steps |
| `shortcuts` | 3 | cull, forge, switch |
| `pointing` | 3 | learn, quadrant, tpad |
| `play` | 3 | etch, life, snake |
| `drums` | 2 | ninepads, slam |
| `clips` | 2 | gridlock, stage |

**Facet 2 — `FEELS`, six terms, exactly two per entry.** How it behaves under a finger and under an
eye.

| Term | n | Meaning |
|------|---|---------|
| `readable` | 16 | You can tell its state across the room without touching it |
| `expressive` | 14 | The further or harder you go, the more it sends |
| `playable` | 13 | You hit it and something happens at once |
| `generative` | 13 | It keeps going, or makes patterns, on its own |
| `precise` | 8 | It is for setting an exact value or hitting an exact target |
| `still` | 8 | Nothing moves until you move it |

`hypnotic` is folded into `generative`; `playable` absorbs `drums`-as-a-feel; the twenty-seven
singletons are gone by construction. **`still` and `generative` are opposites on the motion axis**,
which is the axis a visitor most wants to filter on ("show me the ones that move by themselves") and
the one no current chip expresses.

**The complete assignment, all thirty-six.** Sums check: 36 `FOR` slots, 72 `FEELS` slots.

| Entry | FOR | FEELS |
|---|---|---|
| Aurora | show | generative · expressive |
| Pinwheel | show | generative · expressive |
| Starfield | show | generative · readable |
| Radar | modulation | generative · expressive |
| Joystick | modulation | expressive · still |
| Nine pads | drums | playable · readable |
| Four faders | mixing | readable · still |
| Dial | modulation | precise · expressive |
| Trackpad | pointing | precise · still |
| EUCLID | sequencing | generative · playable |
| CHORUS | keys | playable · expressive |
| ARC | modulation | generative · expressive |
| GHOST | modulation | generative · expressive |
| LATTICE | keys | playable · readable |
| MORPH | modulation | expressive · still |
| SONAR | sequencing | generative · playable |
| HOLD | modulation | expressive · readable |
| STEPS | sequencing | generative · playable |
| SLAM | drums | playable · expressive |
| KEYS | keys | playable · readable |
| GRIDLOCK | clips | playable · readable |
| TABLE | modulation | expressive · precise |
| CONSOLE | mixing | precise · readable |
| STRIP | mixing | precise · still |
| LEARN | pointing | precise · readable |
| LUMEN | show | expressive · readable |
| STAGE | clips | playable · readable |
| SHUTTLE | modulation | expressive · generative |
| CULL | shortcuts | precise · readable |
| FORGE | shortcuts | readable · still |
| SWITCH | shortcuts | readable · still |
| SNAKE | play | playable · generative |
| ETCH | play | playable · still |
| LIFE | play | generative · playable |
| QUADRANT | pointing | precise · readable |
| POMODORO | show | readable · generative |

**Two health rules, both checkable, both asserted by `facets.spec.ts`:**

1. Every `FOR` term lands on **at least two** entries. A term matching one card is a thing search does
   better.
2. Every `FEELS` term lands on **at least six and at most eighteen** entries. Below six it is not a
   filter; above eighteen it is not a distinction. Today's range is 8 to 16.

**Semantics, and this is a named amendment to 05.1-UI-SPEC's "Combining is AND":**

> **Within a facet, chips are OR. Across facets, they are AND.** `FOR: drums, keys` shows every drum
> pad and every keyboard. `FOR: drums` plus `FEELS: generative` shows the generative drum pads.
>
> This is the standard faceted-filter contract, and here it is **required rather than conventional**:
> `FOR` gives every entry exactly one term, so under a pure AND any second `FOR` chip would return
> zero and immediately disable itself. A facet where the second click is always dead is not a facet.

The shipped "a chip that would return zero given the currently active set is a real `disabled`
checkbox, with no adjacent reason line" **survives and becomes rare**: a chip is disabled only when
it would return zero given the *other* facet's active set.

**The toolbar's two rows.** `FOR` first (ten chips), `FEELS` second (six chips), each a
`role="group"` with its own Micro caption and its own `aria-labelledby`. Chip treatment, box, states,
44px floor and "removing an active chip is clicking it again" are 05.1's, unchanged.

**`MORE TAGS` / `FEWER TAGS` is retired.** Sixteen chips in two labelled rows fit above the grid at
every width without a disclosure, and the disclosure existed only to hide twenty-seven singletons
that no longer exist.

**URL parameters.** `?tag=` becomes `?for=` and `?feels=`. An inbound `?tag=` is **accepted for one
release** and mapped through a declared table in `facets.ts`; an unmapped value is dropped silently
and the grid shows everything. It is never an error, never a 404, and never a message: a stale
shared link should land on a working catalog, not on an apology.

### 9.5 D-11 — the Newest sort

**Removed.** `addedAt` has three distinct values across thirty-six entries and one of them covers
twenty, so ordering by date says nothing.

| What changes | To |
|--------------|-----|
| `BrowseSort` | `"featured" \| "name"` |
| `BROWSE_SORTS` | `["featured", "name"]` |
| `newestOrder`, `orderFor`'s middle branch | deleted |
| `sort.spec.ts`'s comparator sweep | `3 × n × (n − 1)` becomes `2 × n × (n − 1)`, and the `NEWEST` test that 09-02 restructured into date blocks is retired by name |
| `BrowseToolbar.svelte`'s options | `FEATURED` · `NAME` |
| `e2e/browse.e2e.ts` | Its sort walk drops one option |
| `?sort=` accepted values | `featured`, `name`. `?sort=newest` falls back to the default silently |

**Two options in a word row is thin, and it is honest.** A third order was considered (`MOTION`:
animated first) and rejected as redundant: the `FEELS` facet's `generative` and `still` answer the
same question, as a filter rather than as an order, which is the better shape.

**`addedAt` survives in the catalog and leaves the browse projection** (D-b). It is real provenance
and it belongs on the entry; nothing reads it after Newest goes, and a field nobody reads is a field
that drifts. Dropping it from `ListingEntry` shortens `listing.spec.ts`'s equality loop by one field
and touches **no entry file**.

---

## 10. The device flow as one sequence, and CLEAR

### 10.1 SAFE-01's guarantee, in 35 characters on the control (R-03)

`SAFE_PROMISE` is 88 characters, asserted at `session-copy.spec.ts:298`, rendered on two surfaces,
and named at `REQUIREMENTS.md:169` as the mechanism that closed the requirement eight commits ago.
D-08 removes it. What needs deciding is what carries the guarantee.

**The three forms, with their counts, so the user is choosing between measured things:**

| # | Form | Cost | What it preserves |
|---|------|------|-------------------|
| 1 | **A short line on the control itself.** `SAFE_NOTE` = `Nothing is written without a click.` (**35**), Micro (title), `--color-ink`, rendered directly beneath `TRY ON DEVICE`, **in every state, unconditionally, never a sizing twin** | One 14px line, permanently. Zero variable height | **SAFE-01 whole.** The connect screen says so out loud, beside the control that would do the writing, in every state including the ones a paragraph never reached |
| 2 | The disclosure. The 88-character sentence moves inside the device disclosure | Zero on the connect surface | The words, not the requirement: SAFE-01 says *the connect screen*, and a `<details>` a visitor never opens is not the connect screen |
| 3 | Retire SAFE-01's second clause explicitly in `REQUIREMENTS.md` with a dated note | Zero | Honesty. It is the pattern Phase 7 used twice, and it is the only form that does not pretend |

**Recommendation: form 1.** It satisfies D-08 exactly as written — the user asked to remove
unnecessary **texts**, and a 35-character line beneath a button is not a text, it is a label's second
line. It is *stronger* than what it replaces: today the promise renders in the header note and the
disclosure and is absent from the panel where the click happens; tomorrow it is under the button, in
every state, on both surfaces that carry the primary.

**`SAFE_NOTE`'s exact contract:** unconditional; never swapped; never a twin; `--color-ink` at 9.26:1
because a safety statement is not quiet; 12px Micro (title) so it reads as a sub-label rather than as
prose; 8px beneath the primary; above the honesty slot. It renders on the chosen panel and, when the
panel is closed, beneath the header's device slot, so `panelOwnsProse` covers it exactly as it covers
the two lines it already governs. `REQUIREMENTS.md:169`'s closure record is amended by name and
dated.

**This is Open for the user, item 1.** The user rules; this document frames the choice.

### 10.2 D-04 — three controls that read as one sequence, without flattening SAFE-02

The tension is exact. SAFE-02's whole content is that `TRY ON DEVICE` and `KEEP ON DEVICE` are never
equal-weight, and today they are three tiers apart with a hairline, a tuning region and another
control between them. "One natural sequence" must not become "three equal buttons in a row".

**A sequence is made of a caption, an order and an enablement. It is not made of equal weights.**

| Channel | How it carries the sequence |
|---------|-----------------------------|
| **A caption** | Region 6 gains one: **`NEXT`** (4), Micro, `--color-ink-quiet`, sitting directly under the existing hairline. One word, inside the two-word uppercase rule. It converts "three controls that happen to sit together" into "what happens after". Before a try-on it still reads right: it is what comes next |
| **DOM and visual order** | Unchanged from Phase 7's Z-03 column: `PUT BACK` → `KEEP ON DEVICE` → **`CLEAR`** → `COPY LINK`, at a 16px rhythm, one layout at every width |
| **Enablement choreography** | This is the strongest channel and it already exists. Before a try-on, everything under `NEXT` is disabled with its reason in its own cell. The instant `settled` lands, `PUT BACK` and `KEEP ON DEVICE` go live **together**. That transition *is* the sequence, and it is behaviour rather than decoration |
| **The honesty slot above** | Already says what the primary does before the click. Nothing is added |

**What is explicitly not done:** no step numerals, no connecting rule or bracket, no progress
indicator, no shared background, no equalised widths, and **no accent on any sequence marker**. The
tier table below is Phase 7's, with one row added.

### 10.3 The control hierarchy, restated in full with one addition

| Tier | Controls | Treatment |
|------|----------|-----------|
| **Primary** — one per panel | `TRY ON DEVICE` | Phase 7's, verbatim |
| **Secondary** — bordered | `PUT BACK`, the two confirmations' affirmatives, `COPY LINK`, `TURN IT DOWN`, `MIX TWO` | Phase 7's, verbatim |
| **Quiet** — borderless | `KEEP ON DEVICE` in the install row, `NOT NOW`, `DISCONNECT ZONA`, `BROWSE ALL`, `HOLD` / `HELD` | Phase 7's, verbatim |
| **Bare** — one per panel, last | **`CLEAR`** | auto width, `min-block-size: 44px`, `padding-inline: 0`, no border, no background, no fill, label Micro in `--color-ink-quiet` at **`letter-spacing: 0.28em`** — wider than every other label on the site. Hover: label to `--color-ink`, 140 ms. Disabled: `--color-ink-dim`, a real `disabled` attribute |

### 10.4 D-05 — CLEAR's tier, and why it is not red

**Tracking is the distinguishing channel.** Every other label on the site is Micro at 0.18em; CLEAR
is at 0.28em. It is the one channel that says *this one is not like the others* without a colour,
without a box, and without an icon this phase has promised not to ship. It is also the ZONA landing's
own idiom, where the whole page's character comes from tracking (`--track-xl: .62em`), and it is
grep-checkable: `letter-spacing: 0.28em` appears on exactly one control.

**Position does the rest.** CLEAR sits **below a second hairline** at the same 24 / 1px / 24 rhythm as
the first, so it is visually outside the `NEXT` group. It is last. It has its own 48px line cell.

**No `--color-over`, and the reasoning is Phase 7's Z-01 applied to a fourth control.** With every
colour deleted, CLEAR is distinguishable from `KEEP ON DEVICE` on five channels: tracking, position
below a second hairline, its own line, its confirmation caption, and the fact that it is disabled in
a different set of states. Red would say *dangerous* where the truth is *deliberate*, and
`--color-over` reused 200px from a meter where it means "over 908" would make both meanings weaker.
**The reversal is one line** and is Open for the user, item 6.

### 10.5 CLEAR — what it writes, its enablement, and its confirmation

**CLEAR writes RAM and never flash.** D-05 asks for the current page's configuration to be cleared;
it does not ask for a permanent wipe, and a permanent wipe of somebody's flash is the single most
destructive thing this site could do. So: two `CONFIG/EXECUTE` frames carrying empty Setup and Timer,
no `PAGESTORE/EXECUTE`, and a power cycle brings back whatever is stored. The copy says exactly that
in both the line and the confirmation.

**A confirmation is still required, and the reason is comprehension rather than permanence.** After a
try-on the pad still does something; after a clear it does nothing, and a visitor who does not
understand that will believe they broke their module.

**Enablement — one rule.**

> **CLEAR is enabled exactly when a write may start and a snapshot exists.** Formally:
> `phase ∈ WRITABLE_PHASES && snapshot != null && capability.canWrite`.

So it is enabled in `ready`, `settled`, `restored`, `kept`, `partial`, `nothing-landed`,
`unconfirmed`, `kept-mismatch`, `restored-unconfirmed` and the new `cleared`; and disabled in `idle`,
`snapshotting`, `writing`, `lost` and `snapshot-failed`. SAFE-03 is satisfied by construction: no
snapshot, no clear.

**Three disabled reasons, and only one of them is new** — the closed set stays tight because two are
Phase 7 strings reused verbatim:

| Cause | Reason | n |
|-------|--------|---|
| No snapshot yet | `Needs a copy of what is on your ZONA first.` | **43** — new |
| No session | `Needs your ZONA connected.` | 26 — Phase 7's `PUT BACK` string |
| Cannot write here (DEGR-02) | `This browser cannot write to a ZONA.` | 36 — Phase 7's `KEEP ON DEVICE` reason |

**The confirmation** is the site's **second** confirmation block, built as `KeepConfirm.svelte` is,
byte for byte in geometry, focus handling and exits: a bordered block that **replaces the control that
opened it**, so the row's `CLEAR` and the confirmation's `CLEAR` are never on screen together and a
speech-input user is never ambiguous.

| Element | Copy | n |
|---------|------|---|
| Caption | `REMOVES` | 7 |
| What is removed | `This empties the Setup and Timer in your ZONA’s memory. A power cycle brings back whatever is stored.` | **101** |
| The way back | `PUT BACK still restores what was there when you connected.` | 58 — Phase 7's, unchanged |
| Affirmative | `CLEAR` | 5 |
| Dismiss | `NOT NOW` | 7 — Phase 7's, unchanged |

**There is no rig sentence.** SAFE-06's "the store reaches every module at once" is a property of
`PAGESTORE`, and CLEAR does not store. Saying it would be false.

### 10.6 CLEAR's place in the install machine — fourteen states become fifteen

| Change | Detail |
|--------|--------|
| `InstallAction` | `"try" \| "put-back" \| "keep" \| "clear"` — **four**. Every `switch` over it is re-checked for exhaustiveness, which the compiler does for free once the union widens |
| New phase **I14 `cleared`** | Entered when **both** `CONFIG/ACKNOWLEDGE` frames for the two empty scripts arrived. SAFE-07 holds verbatim: `cleared` means an ACK, never a resolved writer promise |
| `WRITABLE_PHASES` | Gains `"cleared"`, so CLEAR after CLEAR is possible (idempotent and harmless) and `TRY ON DEVICE` works from it |
| **Failure states** | **Reused, not invented.** A clear that half-lands is `partial`; a clear whose connection drops is `lost`; a clear where neither script got through is `nothing-landed`. Each renders CLEAR's own detail, selected by `lastAction`, which the store already tracks. **The machine goes to fifteen states, not eighteen** |
| Control states in `cleared` | `TRY ON DEVICE` **enabled** · `PUT BACK` **enabled** (a snapshot exists by construction, and D-05 requires it) · `KEEP ON DEVICE` **disabled**, reason `Available after a try-on.` — the closed set of six is unchanged · `CLEAR` **enabled** |
| Region 3 | Gains a `CLEARED` block: caption `CLEARED` (7), body `Your ZONA’s touch element is empty. PUT BACK restores what was there when you connected.` (**88**) |
| Busy label | `CLEARING…` (9) on the CLEAR control through its one leg, with `aria-busy`. Nothing animates, exactly as Z-09 rules for every other write; the 2000 ms `Still writing.` line and its single utterance apply unchanged |
| Header write lock | Engaged during a clear exactly as it is during every other write (Z-15) |
| DEGR-02 | CLEAR is present-but-disabled on browsers that cannot write, with the reason inline. It is **not** absent: unlike `PUT BACK` (Z-12), CLEAR does something meaningful on any module, so there is a real capability to teach |
| `docs/INSTALL-RUNBOOK.md` | Gains **row H** — clear, verify dark, `PUT BACK`, verify restored — joining Phase 6's A–F and Phase 7's A–G, all still awaiting the user |

**The counts that change, and each is a named assertion in `install-copy.spec.ts` (G-04):**

| Assertion | Was | Becomes |
|-----------|-----|---------|
| control labels (`:358`) | 7 | **9** (`CLEAR`, `CLEARING…`) |
| failure builders (`:403`) | 7 | **7** — unchanged, and that is the point of reusing the three |
| distinct failure titles (`:416`) | 7 | **7** |
| utterances (`:428`) | 12 | **13** (`The touch element is cleared.`, 29) |
| character caps | 3 | **4** (`HONESTY_CAP`, `PUT_BACK_CAP`, `KEEP_CAP`, `CLEAR_CAP`), and all four change value — §12 |

### 10.7 The never-writes proof, extended and never weakened

Phase 6 and 7 assert zero writes without a click, **by class**, in node and in the browser, and every
write is attributable to one of three named clicks. A fourth click must extend that, not dent it.

| Assertion | Extension |
|-----------|-----------|
| `install.spec.ts` test 4 — zero config writes across connect, snapshot and every knob move, counted by class | The class enumeration **gains CLEAR's class**. The assertion's wording is unchanged and its reach is wider (G-06) |
| `e2e/install.e2e.ts` test 1, `e2e/session.e2e.ts`'s seven cable tests (`:810`, `:860`, `:1380`) | Unchanged in wording, stronger in fact: "zero writes of any class" now covers four classes |
| `session.spec.ts` test 15 — the source scan's **eight needles** | **Nine.** A `clear.bind`-shaped export must not slip past the scan that exists to catch exactly that shape (G-05) |
| `REQUIREMENTS.md:169` — "every write attributable to one of three clicks" | **Four**, amended by name and dated. And the number stops being a word in prose: `install-copy.ts` exports `WRITE_CLICKS = ["TRY ON DEVICE", "PUT BACK", "KEEP ON DEVICE", "CLEAR"] as const`, asserted to have length 4 and asserted equal to the four control labels, so the next change moves a constant rather than a sentence |
| `write-guard.ts:24-58` — a write is permitted only when the fetched strings are trustworthy | **Unchanged.** CLEAR goes through the same guard, and its first-failure return is what names the one reason |

---

## 11. Tuning (D-06)

### 11.1 What the pad can actually show, in one paragraph

`quantiseColour` snaps every stored channel to a multiple of 17 (`_pad.ts:490-493`), so the state
holds exactly **RGB444: sixteen steps per channel, 4,096 colours and no more**, and it does so
specifically so the URL stamp round-trips. One layer emits at most **254/512 = 49.6%** of what you
ask for. There is **no gamma correction anywhere** in the WS2812 path, so the same nominal hue reads
differently at every intensity. A picker offering 16.7 million colours would be a lie in three
separate ways at once, and `knobs.preset.ts:135-137` already says so.

**The resolution is not to refuse D-06. It is to build the picker on the lattice.**

### 11.2 The picker — three rails and a result that is a pad

| Part | Contract |
|------|----------|
| **Three rails** | One per channel, sixteen detents each, using **the existing detent-track widget** (05-UI-SPEC's `n ≥ 9` skin: a 4px `--color-line-soft` track filled to the index in `--color-accent`, a 12px accent thumb). One `<input type="range" min="0" max="15" step="1">` per rail, `opacity: 0`, over the painted detents, filling the 44px box, with a real `<label for>`. Arrow keys step one, `Home` / `End` jump to the ends, double-click resets. **No new widget, no new keyboard model, no new focus behaviour** |
| **Detent fills** | Each detent on the R rail is painted in the exact RGB444 colour that index would produce **given the current G and B**. The rail is therefore a gradient made of sixteen discrete, storable, reachable colours, and it re-paints when either other rail moves. This is what "stylized" means here, and it is legal under A-09 precisely because every cell is a flat fill of a stored value rather than a CSS gradient |
| **Cheap-step ticks** | A 2px `--color-line` tick 4px beneath the detents whose literal is short — `0`, `17`, `85`, `170`, `255` and their one- to three-digit neighbours. The same shape as the default marker, so it is already a learned mark. It is the visible answer to "which colours cost the fewest characters" |
| **Unaffordable detents** | A detent whose literal would push the state past 908 is a real `disabled` option, painted in `--color-ground` with a 1px `--color-line-soft` hairline: **absent as a colour, present as a position**. No adjacent reason line — the meter two centimetres away is the cause, which is Phase 5's X-17 precedent and 05.1's disabled-chip precedent |
| **The result** | **A 9×9 miniature of the pad running this entry's own animation at the chosen colour**, not a rectangle. It costs one more `PadCanvas` instance, gated by the same `IntersectionObserver`. Given that one layer emits at most 49.6% and there is no gamma correction, **a flat swatch is the lie and the miniature pad is the truth**: it answers "what will this look like on my ZONA" instead of "what does this hex look like on my monitor" |
| **Caption** | `COLOUR` (6), Micro, `--color-ink-quiet` |
| **Accessible names** | Each rail's visually-hidden label is `Red, 16 steps` / `Green, 16 steps` / `Blue, 16 steps` (13 / 15 / 14). The composed value is announced by the group's `aria-valuetext` as the three stored integers, never as a hex |
| **Floor** | 44px per rail, inherited free |

**Amendment to X-05 / X-06, by name:** widget selection is "chosen by `kind` and by `n`, never per
configuration". **The `colour` kind is now chosen by `kind` alone**, because `n = 4096` would fall
through to a single detent track, which is exactly the picker that lies. `colour` renders three rails
and a result pad at any `n`; every other kind is unchanged.

**Amendment to TUNE-01, by name:** "three to six knobs" counts **knobs**, not controls. The `colour`
kind is one knob presented as three rails.

### 11.3 T2 — the budget as a live forecast (the phase's signature feature)

No editor in the category shows what a change will cost **before** you make it. Grid Editor's own
counter is a readout; Novation, Elgato, Loupedeck, TouchOSC and Bome have no budget at all. This is
the idea that turns HANGAR's most peculiar constraint into its best moment, and it is the honest
answer to the picker's character-cost problem at the same time.

| Property | Contract |
|----------|----------|
| Trigger | Pointer hover **and** keyboard focus on any knob option or picker detent. Gated behind `@media (hover: hover)` and focus-visible; **never on touch**, where it would add latency to the gesture HANGAR is most careful about |
| What is forecast | **`cost()` only, never `fit()`.** `fit()` is N+1 minifier calls at roughly 4.4 ms on a fitting state; forecasting *n* options per knob would be *n* times that. `cost()` is pure and already runs the real minifier |
| Caching | Memoised on the index vector, and debounced in the same shape TUNE-02 already uses for recompiles |
| The meter | A **ghost fill** on the affected meter: `--color-line-soft` from the current value to the forecast value, behind the accent fill. When the forecast is lower, the ghost is a notch cut out of the fill at the same alpha. No animation |
| The number | A signed delta beside the hovered option, `--font-mono` 12px, `--color-ink`: `+6`, `−3`, `0` |
| Hidden expansion | `Choosing this would put Setup at {n} of 908.` (44), so the forecast is not pointer-only information |
| Over-budget forecast | The delta renders in `--color-over` **only** when the forecast crosses 908. **This is a fourth use of the third colour and it is not taken**: instead the option is already `disabled` (§11.2), so an unaffordable forecast cannot be hovered. `--color-over` stays at three uses |

**Two amendments this costs, both named:**
1. **A fifth `--font-mono` use.** Phase 5 confined the mono stack to four; the delta is the fifth, and
   it qualifies for exactly the reason W-03 introduced the stack: it is a number that changes as a
   pointer moves, and it must not jitter horizontally.
2. **A fifth permitted typographic character: `−` U+2212.** A hyphen-minus in a signed numeral, on a
   site that ships U+2019, U+2026, U+2014 and U+00B7, is precisely the inconsistency this copy
   contract exists to prevent. It is permitted in the forecast delta and nowhere else.

### 11.4 The two collisions, resolved

**Collision 1 — the 908 wall.** `glc(a, layer, r, g, b, 1)` writes the channels as decimal literals,
so a colour costs **3 to 11 characters**: `0,0,0` is 3, today's default `0,204,255` is 8, and the
worst case `119,187,238` is 11. The measured worst reachable state today is **907 of 908** on `tpad`
(`reachability.sweep.spec.ts:30-36`), so a free colour has one character of headroom and could make
TUNE-05 reachable in production for the first time.

**The ruling: TUNE-05 stays proven-unreachable, and the mechanism is the picker itself.**

> The picker's rails **disable every detent whose literal would put the state past 908**. On
> thirty-five entries every colour is affordable and nothing is disabled. On `tpad` the visitor sees
> a handful of positions that are unreachable, and the reason is two centimetres away on the meter.
>
> So no reachable state crosses 908, the sweep's finding survives with a new number, and the site
> gains something no product ships: **a colour picker where some colours are greyed out because they
> cost too many characters.**

**The sweep is restructured rather than extended (G-07), and it gets faster.** A 4,096-option colour
knob replacing a 6-option one would be a 683× multiplier on any entry with a colour knob, taking
32,852 states into the tens of millions and making the suite unrunnable. Instead:

1. **Pass A — the cross-product, colour pinned.** Every non-colour knob is cross-producted exactly as
   today, with the colour knob pinned at its **worst literal** (an 11-character `119,187,238`-class
   value). States: today's 32,852 divided by the colour knob's current option count.
2. **Pass B — the colour dimension, linear.** All 4,096 colours costed against every other knob at its
   default index. States: 4,096 per entry with a colour knob.
3. The assertion becomes: **no state in Pass A crosses 908, and every colour excluded by Pass B is
   disabled in the picker.** Total states fall well below today's 32,852.

Writing this into the plan is not optional. Discovering it when the sweep times out in CI is much
worse.

**Collision 2 — the URL stamp.**

| Route | Resolution |
|-------|------------|
| **Compiler entries** (BOTOR formats `a`, `b`, `c`) | The colour field already encodes RGB444 directly, so an arbitrary colour round-trips at the codec level. What fails is step 3 of the entry-consistency check, which rebuilds by applying each knob **at its read index**. So the colour knob's `options` become the full reachable lattice and `read()` / `apply()` become **index ↔ RGB444 arithmetic** rather than array lookups. `read(apply(state, i)) === i` holds by construction |
| **Lua entries** (format `x`, knob-index) | An arbitrary colour has no index. **A new format letter `w` is claimed**, carrying 12 raw bits of colour beside the other knob indices. `w`, `y` and `z` were reserved for exactly this and sit outside the base-32 payload alphabet, so they are collision-proof against BOTOR |
| **Links already in the wild** | **Format `x` keeps decoding forever.** A stamp made yesterday still lands `restored`, not `unreadable`. This is the one change in the phase with a user-visible failure mode if it is got wrong, and the rule is: the old format is never removed, only stopped being emitted |
| `stamp-roundtrip.sweep.spec.ts` | Extended with the same two-pass structure as G-07 |

**Rejected, and named so it is not reinvented:** a picker that writes outside the knob system directly
into the `PadState` colour field. It forks the state model and breaks `SURPRISE ME`, `RESET ALL`, the
default marker, the fit ladder and the forecast, all of which are knob-index machinery.

### 11.5 T1 — knob locks, the enabler

A 44px toggle at the end of every knob row. `SURPRISE ME` and `MIX TWO` re-roll only unlocked knobs.
"I love this colour, surprise me with everything else."

| Property | Contract |
|----------|----------|
| Affordance | **A word, not an icon** (Phase 5's X-22: no new SVG ships). `HOLD` (4) when off, `HELD` (4) when on. Micro, `--color-ink-quiet` off, `--color-ink` on, a real `<button aria-pressed>` |
| Second channel | When held, the knob's **default marker** changes from a 2px `--color-line-soft` dot to a 2px `--color-line` bar spanning the selected option. A held knob is legible without reading the toggle, and **no accent is spent**, so the reserved list stays at eight |
| Persistence | **Ephemeral. Never in the stamp.** SHARE-01 is untouched |
| Exhaustion | With every knob held, `SURPRISE ME` is a real `disabled` button — `surpriseIndices` returns `previous` unchanged, which is already the documented exhaustion signal, and a button that appears to do nothing is worse than a disabled one. Reason line: `Every knob is held, so there is nothing left to roll.` (53) |
| The new reachable path | Holding all but one narrows the roll to `n` possibilities, so the "a draw that reproduces the state it replaced is rejected" rule (`surprise.ts:70-71`) can now genuinely exhaust twelve draws on a two-option knob. **That path is unreachable today and needs its own test** |

### 11.6 T4 — `MIX TWO`, which no product in this category ships

Genetic exploration exists in synths (Sonic Charge's Synplant 2 Genopatch, 2023) and nowhere in
controller-configuration editors. The state model here is already index vectors, so it is small.

| Property | Contract |
|----------|----------|
| Label | `MIX TWO` (7), Secondary tier |
| Line | `Takes half its settings from each, at random. Nothing is sent to your ZONA.` (75) |
| Parents | Two, **same entry only** — crossover between entries with different knob sets is meaningless. `THIS ONE` (8) is the current state; `THAT ONE` (8) is a candidate from the last `SURPRISE ME` or a pasted link, decoded by the stamp machinery that already exists |
| Children | **Four**, as four live 9×9 minis in a wrapping row. `child[k] = coin() ? a[k] : b[k]`, with one mutation: a single `surpriseIndices` draw on one knob. Held knobs (§11.5) are never crossed and never mutated |
| Taking one | Clicking a child makes it the state; the previous state becomes `THAT ONE`, so the next mix has a parent without any bookkeeping the visitor can see |
| Non-destructive | The current state survives until a child is clicked |
| Reachability | **Zero new states.** Every child is a point in the same space Pass A already sweeps |
| Copy discipline | No genetics metaphor reaches the interface. Not "breed", not "parent", not "mutate", not "DNA". Two candidates, four results, one button. The house style's plain sentences win the fight with the metaphor, which is a good fight to have |
| Cost | Four more `PadCanvas` instances beside the hero and the picker's result — six on one screen. Inside the front door's seven and well inside browse's budget, and every one is `IntersectionObserver`-gated |
| Motion | The tear fires once, 180 ms, on the tune panel's border, when four children land (§8.4) |

**Sequencing.** T1 and T2 in the first wave; the picker and T4 in the second. **T3 (`SURPRISE ME` as
a shelf of five), T5 (hardware A/B audition) and T6 (knobs laid out on the pad) do not ship in this
phase** and are named here so they are recognisably deferred rather than forgotten. T5 in particular
is a *safety* risk rather than a technical one, it adds a class of click that writes twice per
gesture, and it cannot be verified without hardware.

---

## 12. The sizing twins, re-derived

Every one of these is arithmetic from **a character count at a measured font metric**. Quicksand 400
and 600 become Inter Variable, which changes the character advance and the x-height, so **the numbers
are re-derived rather than adjusted.** That is a task, not a cleanup.

### 12.1 The one measurement everything else depends on

> **`CH_PER_LINE` — characters per line of Body (16px / 1.5) in the 372px panel content column.**
> Quicksand measured **43**. Inter is narrower per character at the same size, so the provisional
> figure is **46**, and every number in §12.2 is that formula's output.
>
> **Wave 0 measures it in both engines and pins it**, in the same commit as the font swap. If the
> measurement differs from 46, the four reservations and the four caps below are re-derived from the
> real number before any component is written. A wrong number here reflows a device panel mid-install.

The Body line box is `16 × 1.5 = 24px` in both faces, so a reservation is
`ceil(longest / CH_PER_LINE) × 24`.

### 12.2 The five reservations

| Reservation | Declared at | Was | Longest string after §13 | Lines | **Becomes** |
|---|---|---|---|---|---|
| **The header note** | `DeviceNote.svelte` (held by twins; 152px is the recorded arithmetic at `:24` and in 06-UI-SPEC) | **152px** — 3 + 3 line boxes + 8px, for `PICKER_EXPLAINER` (130) over `SAFE_PROMISE` (88) | `RECONNECT_OFFER` at **37** | 1 | **24px, one cell.** R-02 retires the 130-character string and R-03 moves the promise to the control, so **both** of the note's cells collapse into one holding one line. This is the largest single reduction in the phase |
| **The honesty slot** | `TryOnDevice.svelte:531`, asserted `device-ui.spec.ts:772-773` and `tune-ui.spec.ts:348-349` | **72px**, `HONESTY_CAP = 129` | `HONESTY_READY` and the worst `tryOnBudgetReason` at **90** | 2 | **48px**, `HONESTY_CAP = 92` (2 × 46) |
| **The `PUT BACK` cell** | `PutBack.svelte:220`, asserted `device-ui.spec.ts:642,657-658` | **72px**, `PUT_BACK_CAP = 129` | `PUT_BACK_LINE_AFTER_KEEP` at **101** | 3 | **72px — unchanged**, `PUT_BACK_CAP = 138` (3 × 46) |
| **The `KEEP ON DEVICE` cell** | `KeepOnDevice.svelte:198`, asserted `device-ui.spec.ts:782,797-798` | **48px**, `KEEP_CAP = 86` | the enabled line at **82** | 2 | **48px — unchanged**, `KEEP_CAP = 92` (2 × 46) |
| **The `CLEAR` cell** | new, `Clear.svelte` | — | `CLEAR_LINE` at **86** | 2 | **48px**, `CLEAR_CAP = 92`. Same mechanism as its two neighbours: one grid cell, every candidate at `grid-area: 1 / 1`, the inactive ones `visibility: hidden` and `aria-hidden="true"` |

**The reason all five exist is safety, not tidiness** (Z-18, restated because a fourth control now
depends on it): `KEEP ON DEVICE`'s line changes when a knob moves, `PUT BACK`'s changes after a keep,
and CLEAR's changes with the session. Any of them changing line count would shift the site's
destructive controls vertically under a hand already reaching for them.

**The tuning region's 152px and the meters block's 56px are re-derived and hold.** The meters
arithmetic — `(14 + 4 + 8) × 2 + 4 = 56` — rests on the 14px fixed line box on every 12px line inside
the region, and 12px Inter in a 14px box is a 1.167 ratio, which is legible and unchanged in effect.
`ChosenPanel.svelte:217`'s `min-block-size: 152px` and `tune-ui.spec.ts:344`'s `block-size: 56px`
stand untouched. **This is the one sizing twin the deletions do not collapse**, and saying so is part
of the contract.

**The three caps are still the contract's, not `install-copy.ts`'s to move** (`install-copy.ts:51-55`,
now four caps). Every string in §13 is under its cap, counted by script.

---

## 13. Copywriting Contract

### 13.0 The rules

Phase 4's, verbatim: mixed case for sentences; wide-tracked uppercase for the wordmark, button labels
and captions of at most two words; **no emoji; no exclamation marks**; real apostrophes (`’` U+2019),
a real ellipsis (`…` U+2026), a real em dash (`—` U+2014), a real middle dot (`·` U+00B7). Never
"Error". Never "loading". Never a browser engine named. **No string names a control that is not on
the screen.** No hyphen used as a dash.

**One character is added:** `−` U+2212, permitted in the forecast delta (§11.3) and nowhere else.

**One case exception is declared:** `PICK ONE · IT IS ALREADY RUNNING` is a headline set in the Micro
role rather than a caption, and it is the only uppercase string on the site longer than two words.

**Every string below was counted by script**, not by eye. The counts are code-point counts of the
exact literal.

### 13.1 The eleven retirements

Listed in §3.1 with their replacements. Nothing is deleted from a spec; every pinning assertion is
rewritten in the same commit as the string it pins.

### 13.2 The front door

| Element | Copy | n |
|---------|------|---|
| Splash wordmark · header wordmark | `HANGAR` | 6 |
| **Headline** *(replaces R-01)* | `PICK ONE · IT IS ALREADY RUNNING` | **32** |
| **Fidelity line** *(replaces R-04)* | `Every pad here runs the firmware’s own code.` | **44** |
| `FOR` row caption | `FOR` | 3 |
| Name plate | `{entry.name}`, verbatim | — |
| Browse entry | `BROWSE ALL` | 10 |
| Unknown deep link | `Never heard of that one. Here is the shelf instead.` | 51 — Phase 4's, unchanged |

### 13.3 The device surface

| Element | Copy | n |
|---------|------|---|
| **Primary CTA** | `TRY ON DEVICE` | 13 |
| **`SAFE_NOTE`** *(replaces R-03)* | `Nothing is written without a click.` | **35** |
| Honesty — no session *(replaces R-05)* | `Connects to your ZONA and writes this into its memory. About a second.` | **70** |
| Honesty — ready *(replaces R-06)* | `Writes this into your ZONA’s memory in about a second. A power cycle brings your own back.` | **90** |
| Honesty — snapshotting | `Reading what is on your ZONA now, so nothing you do here is one-way.` | 68 — unchanged |
| Honesty — cannot write here | `This browser cannot write to a ZONA. Everything else on this page works.` | 72 — unchanged |
| Honesty — over budget | `tryOnBudgetReason(...)`, worst form 90 | 90 — unchanged |
| Reconnect offer *(replaces R-08)* | `ZONA detected. One click connects it.` | **37** |
| Status lines | `Pick the ZONA in the browser’s list.` · `Opening the port…` · `Listening for the module…` | 36 / 17 / 25 — unchanged |
| **Region 6 caption** | `NEXT` | **4** |
| `PUT BACK`, longest line | `Restores the Setup and Timer that were on your ZONA when you connected, and stores them so they stay.` | 101 — unchanged |
| `KEEP ON DEVICE`, enabled | `Stores this configuration in your ZONA’s own memory, so it survives a power cycle.` | 82 — unchanged |
| `KEPT` body 2 *(replaces R-09)* | `The pad restarts once as it loads the stored version.` | **53** |
| **`CLEAR` label** | `CLEAR` | **5** |
| **`CLEAR` busy label** | `CLEARING…` | **9** |
| **`CLEAR` line** | `Empties this page in your ZONA’s memory. A power cycle brings back whatever is stored.` | **86** |
| **`CLEAR` reason — no snapshot** | `Needs a copy of what is on your ZONA first.` | **43** |
| **`CLEAR` reason — no session** | `Needs your ZONA connected.` | 26 — Phase 7's, reused |
| **`CLEAR` reason — cannot write** | `This browser cannot write to a ZONA.` | 36 — Phase 7's, reused |
| **Confirmation caption** | `REMOVES` | **7** |
| **Confirmation, what is removed** | `This empties the Setup and Timer in your ZONA’s memory. A power cycle brings back whatever is stored.` | **101** |
| **Confirmation, the way back** | `PUT BACK still restores what was there when you connected.` | 58 — Phase 7's, unchanged |
| **`cleared` caption / body** | `CLEARED` / `Your ZONA’s touch element is empty. PUT BACK restores what was there when you connected.` | **7 / 88** |
| **`nothing-landed` detail after a clear** | `Neither script got through. Nothing on the module changed, so what was playing is still playing.` | 96 — Phase 7's `PUT BACK` form, reused verbatim because it is exactly true of a clear |
| **Live region — cleared** | `The touch element is cleared.` | **29** |
| **Destructive confirmations** | **Two, and now that is the number.** `KEEP ON DEVICE` (caption `PERMANENT`, Phase 7's block, unchanged) and `CLEAR` (caption `REMOVES`, above). `PUT BACK` still gets none (Z-04) and neither does `FORGET THIS ZONA` (Phase 6's ruling, unchanged) |

### 13.4 Tuning

| Element | Copy | n |
|---------|------|---|
| Picker caption | `COLOUR` | 6 |
| Picker rail names (visually hidden) | `Red, 16 steps` · `Green, 16 steps` · `Blue, 16 steps` | 13 / 15 / 14 |
| Cheap-step hint (hidden expansion) | `Marked steps cost the fewest characters.` | 40 |
| Unaffordable detents (hidden expansion) | `The colours left out would not fit inside 908 characters.` | 57 |
| Forecast delta | `+{n}` · `−{n}` · `0` | ≤ 4 |
| Forecast, hidden expansion | `Choosing this would put Setup at {n} of 908.` | 44 |
| Lock toggle | `HOLD` / `HELD` | 4 / 4 |
| `SURPRISE ME` disabled reason | `Every knob is held, so there is nothing left to roll.` | 53 |
| Mix CTA | `MIX TWO` | 7 |
| Mix line | `Takes half its settings from each, at random. Nothing is sent to your ZONA.` | 75 |
| Mix parents | `THIS ONE` · `THAT ONE` | 8 / 8 |
| Share CTA | `COPY LINK` · `LINK COPIED` | 9 / 11 — unchanged; **its quiet line is retired** (R-07) |

### 13.5 Browse and the footer

| Element | Copy | n |
|---------|------|---|
| Facet captions | `FOR` · `FEELS` | 3 / 5 |
| Sort caption and options | `SORT` · `FEATURED` · `NAME` | 4 / 8 / 4 |
| Search | `SEARCH` · `CLEAR` | 6 / 5 — unchanged |
| `CLEAR FILTERS` | unchanged | 13 |
| Result count | `{n} of {total} configurations.` + hidden `Showing {n} of {total} configurations.` | — unchanged |
| **Screen toggle** | `SCREEN` · `TEXTURED` · `FLAT` | **6 / 8 / 4** |
| Empty state | Phase 5.1's, unchanged | — |
| **Resting-black note** | **retired** (R-10) | — |

---

## 14. Motion Contract

Phase 4's simulation semantics are reproduced **exactly** and are not restated here. What this phase
adds:

| Event | Duration | Easing | Detail |
|-------|----------|--------|--------|
| Roll bar (Layer R) | 6.5 s | `linear infinite` | `transform: translateY(-130% → 520%)`. One instance, hero shell only, `will-change: transform` |
| Tear (Layer T) | 180 ms | `step-end both` | Seven discrete states over `clip-path: inset()` and `transform: translateX(±1.6%..3.2%)`. **No `filter`, no `hue-rotate`, ever** |
| Demo path loop (§9.3) | per path | tick-locked | Replayed through `touch.ts` at one sample per contact per 10 ms tick. Never a `setInterval` |
| Forecast ghost fill | 0 ms | — | **Not animated.** A ghost that eased in would lag the pointer and read as the real value |
| Picker detent repaint | 0 ms | — | Instant. It is a value change, not a transition |
| `MIX TWO` children arriving | 160 ms | `ease-out` | Opacity only, no transform |
| Everything else | — | — | Phases 4 to 7's tables, unchanged |

### `prefers-reduced-motion: reduce` — the complete override, extended

| Thing | Full motion | Reduced |
|-------|-------------|---------|
| Pads | live simulation | still frame at tick 64; the hero still responds while a pointer is down |
| **Demo cards** | the path loops | **run to the end of the path, then freeze.** `stillFrameOf()`'s second branch |
| **Roll bar (R)** | 6.5 s sweep | `animation: none`, **asserted in both projects** |
| **Tear (T)** | 180 ms | `animation: none`, **asserted in both projects** |
| **Scanlines (S), noise, ground (G)** | present | **present.** They do not move, so a motion preference does not reach them. The `SCREEN: FLAT` control does |
| Everything else | — | Phases 4 to 7's override table, unchanged |

**Implemented as a media query on the CSS side and read by the host on the JS side**, through the
existing live `matchMedia` subscription. No component adds a second one.

---

## 15. Accessibility Contract

| Concern | Contract |
|---------|----------|
| The picker | Three real `<input type="range">` controls with three real `<label for>` elements, in a `role="group"` with `aria-labelledby` on the `COLOUR` caption. Arrow keys, `Home` / `End`, `PageUp` / `PageDown` all free from the platform. The group's `aria-valuetext` announces the three stored integers. **A disabled detent is a disabled option**, so it is announced as unavailable rather than silently ignored |
| The forecast | Pointer-hover **and** keyboard-focus, never pointer-only. Its hidden expansion carries the sentence a sighted hover reads as a number |
| Lock toggles | `<button aria-pressed>` per knob, 44px, with the label changing `HOLD` / `HELD` so the state is in the accessible name and not only in `aria-pressed` |
| `MIX TWO` children | Four real buttons, each with an accessible name naming what would change, in a `role="group"` |
| CLEAR | A real `<button>`; its confirmation is a `role="group"` and **not a dialog**, matching `KeepConfirm`. Focus moves into the block on open and back to the control that owns the cell on dismiss |
| The facets | Two `role="group"` blocks of real `<input type="checkbox">` inside `<label>`s, each chip its own tab stop, `Space` toggles. Unchanged from 05.1 |
| The `SCREEN` toggle | A `role="radiogroup"` of real radios, one tab stop, arrows move and select. Reachable by keyboard from the footer on every route |
| Text contrast | Unchanged, and **still honest**, because §8.3 keeps every CRT layer off every text node. `identity.spec.ts`'s computation from declared alphas remains a true statement about rendered pixels |
| Non-text contrast | Functional borders stay `--color-line` at 3.31:1. The scanline is decoration whose meaning is carried nowhere, over content whose meaning is the pad's lit cells |
| Motion | Honoured completely per §14, **and asserted at the compositor level** by the two new gates, because the existing canvas-backing-store assertions cannot see a CSS overlay |
| Touch targets | 44×44 minimum on every control, including every picker rail, every lock toggle, every facet chip, `CLEAR`, `MIX TWO`, each `MIX TWO` child and each `SCREEN` option |
| Colour is never the only channel | Over budget still has six signals. A held knob has two. A disabled detent has two (absent fill, `disabled` state). CLEAR has five |

---

## 16. Component Inventory

**New, in `src/lib/ui/`:**

| Component | Responsibility | `data-testid` |
|-----------|----------------|---------------|
| `ColourPicker.svelte` | Three 16-detent rails, the per-detent RGB444 fills, the cheap-step ticks, the disabled unaffordable detents, the 9×9 result pad | `colour-picker`, `colour-rail-{r\|g\|b}`, `colour-result` |
| `Clear.svelte` | The Bare-tier control, its 48px sizing-twin line cell, its three reasons, `CLEARING…` and `aria-busy` | `clear`, `clear-line` |
| `ClearConfirm.svelte` | The second confirmation block: caption, two sentences, two actions, focus in and out | `clear-confirm`, `clear-confirm-yes`, `clear-confirm-no` |
| `MixTwo.svelte` | The two parents, the four children, the take | `mix-two`, `mix-child-{0..3}` |
| `FacetRow.svelte` | One captioned facet row; a checkbox group on `/browse/`, a link row on `/` | `facet-for`, `facet-feels` |
| `ScreenToggle.svelte` | The footer's `SCREEN` word row, its persistence, its reduced-motion default | `screen-toggle` |

**New, elsewhere:**

| Module | Responsibility |
|--------|----------------|
| `src/lib/browse/facets.ts` | The sixteen terms, the two facets, the OR-within / AND-across predicate, the legacy `?tag=` map. **Imports nothing at runtime**, scanned by `facets.spec.ts` |
| `src/lib/sim/demo.ts` | The `DemoPath` type, the four authored paths, the tick-locked driver, and `stillFrameOf()`'s second branch |
| `src/lib/ui/aesthetic.spec.ts` | §8.7's six source-scan gates |
| `e2e/aesthetic.e2e.ts` | §8.7's three browser gates, both projects |

**Modified:**

| File | Change |
|------|--------|
| `src/app.css` | Two `@font-face` blocks; `--font-display` added; `--font-sans` retargeted; `--font-mono` untouched; the nine colour tokens untouched; Layer G's rule; the `--crt` gate. Its header comment is amended in the same breath so the file and `identity.spec.ts` never disagree |
| `src/lib/ui/identity.spec.ts` | G-01 |
| `src/lib/ui/PadFrame.svelte` | Layer S's `::after`; the `demo` mode |
| `src/lib/ui/FrontDoor.svelte` | R-01's headline; the hero shell and Layer R's sibling; the `FOR` link row |
| `src/lib/ui/Coverflow.svelte` | **Nothing structural.** Its three rules are quoted, obeyed and now asserted by `aesthetic.spec.ts` |
| `src/lib/ui/DeviceNote.svelte` | The second cell retires; the reservation arithmetic goes 152 → 24 |
| `src/lib/ui/TryOnDevice.svelte` | `SAFE_NOTE` beneath the primary; the honesty slot 72 → 48px; two rewritten strings |
| `src/lib/ui/ChosenPanel.svelte` | The `NEXT` caption; a second hairline; `Clear` in the column; **region 4's `min-block-size: 152px` untouched** |
| `src/lib/ui/KeepOnDevice.svelte`, `PutBack.svelte` | Caps only; geometry unchanged |
| `src/lib/ui/InstallState.svelte` | The `CLEARED` block; CLEAR's details on the three reused failure states |
| `src/lib/ui/Knob.svelte`, `KnobRack.svelte` | The lock toggle; the held default marker; the forecast hooks; the `colour` kind's new selection |
| `src/lib/ui/BudgetMeter.svelte` | The ghost fill and the delta |
| `src/lib/ui/BrowseToolbar.svelte`, `TagChip.svelte`, `CatalogCard.svelte` | Two facet rows; two sorts; `MORE TAGS` retired; the resting-black note retired |
| `src/lib/catalog/listing.ts` | 36 tag arrays re-cut; `addedAt` out of the projection; `RESTS_DARK_NOTE` retired |
| `src/lib/browse/sort.ts`, `filter.ts`, `query.ts` | G-08, G-09; `?for=` and `?feels=` |
| `src/lib/device/install.svelte.ts` | `InstallAction` widens to four; `cleared` joins the phases and `WRITABLE_PHASES`; the clear sequencer |
| `src/lib/device/install-copy.ts` | Nine labels, thirteen utterances, four caps, `WRITE_CLICKS` |
| `src/lib/device/session-copy.ts` | R-02, R-03, R-08 |
| `src/lib/tune/knobs.preset.ts`, `model.ts`, `view.ts`, `surprise.ts` | The lattice colour knob; locks; the forecast; `MIX TWO`'s crossover |
| `src/lib/share/stamp.ts` | Format `w` claimed; format `x` keeps decoding |
| `+layout.svelte` | The `SCREEN` toggle in the footer |
| `scripts/gen-licenses.mjs` | The Quicksand paragraph at `:165-167` rewritten; the new font-asset gate |
| `scripts/gen-og.mjs` | Runs a demo path to its end before capturing |
| `.planning/REQUIREMENTS.md` | SAFE-01's closure record and the three-clicks sentence, amended by name and dated |

`src/vendor/` is **never edited**. `vendored-diff.spec.ts` and `upstream-manifest.json` hash it byte
for byte and would say so.

---

## 17. Wave 0 — what must exist before a component is written

- [ ] **Measure `CH_PER_LINE`** in both engines and pin it. Every reservation and cap in §12 is
      provisional until this lands.
- [ ] **Measure Layer S** on `/browse/` at thirty-six entries, both engines, with and without.
      Record the number (§8.5).
- [ ] **`src/lib/ui/aesthetic.spec.ts`** — the six source scans. Without it, §8.3's scope rule is a
      sentence rather than a gate, and the silent-green contrast hole ships.
- [ ] **`e2e/aesthetic.e2e.ts`** — the three browser gates. Without it, a sweeping bar over the pads
      leaves every existing reduced-motion assertion green.
- [ ] **The font-asset gate.** `scripts/gen-licenses.mjs` runs `license-checker-rseidelsohn
      --production` and inspects the npm tree only. It has **no visibility into `static/` or
      `src/lib/assets/`**, so a hand-committed `.woff2` would sail through `npm run licenses`,
      `npm run build` and `npm run deploy` and land in the public source tarball. Add a scan for
      `.woff` / `.woff2` / `.ttf` / `.otf` anywhere in the tracked tree outside `licenses/`, failing
      unless allowlisted with an SPDX identifier. Verified today: `git ls-files` returns exactly one
      font-shaped path, `licenses/@fontsource/quicksand@5.3.0-LICENSE.txt`.
- [ ] **Restructure `reachability.sweep.spec.ts`** into the two passes of §11.4, **before** the
      picker is built.
- [ ] **Measure whether `tpad`'s 907-of-908 worst state has a colour knob on the affected call
      site.** If it does not, the disabled-detent machinery of §11.2 is still built and simply never
      fires, and that is a finding worth recording.

---

## 18. Registry Safety

| Registry | Blocks used | Safety gate |
|----------|-------------|-------------|
| shadcn official | none | not applicable — shadcn is not initialised and no component registry is used |
| third-party registries | **none declared** | not applicable — the vetting gate has nothing to run against, and `npx shadcn view` was not run because there is nothing to view |

`Tool: none`. No `components.json` exists and none is created.

**Third-party artefacts this phase does add**, all through the existing npm licence pipeline and none
through any registry:

| Artefact | Version | Licence | Gate |
|----------|---------|---------|------|
| `@fontsource-variable/archivo` | 5.3.0 | OFL-1.1 | Already allowlisted at `gen-licenses.mjs:41`. **No allowlist change is needed**, which is worth saying because that allowlist's own contract is that it is extended deliberately |
| `@fontsource-variable/inter` | 5.3.0 | OFL-1.1 | Same |
| `@fontsource/quicksand` | 5.3.0 | OFL-1.1 | **Uninstalled.** `gen-licenses.mjs:191-192` does `rmSync` first, so one rerun clears the stale `licenses/` file |
| `impeccable` | pin the exact version | Apache-2.0 | A **dev** tool that writes into `.claude/`, which `.gitattributes:5` marks `export-ignore`, so it never enters the source archive. D-01 requires it; pin the version, run the install as a plan task, record the file list in the summary, and confirm nothing lands in `src/` or `static/` |

**The Grifter binary is not committed under any circumstance**, and the reason is narrower than the
licence question: `scripts/postbuild.mjs:82-89` runs `git archive HEAD` and publishes the result at
`/source-<sha>.tar.gz` as an unauthenticated download. A font file in the tracked tree is therefore
**redistributed**, not merely embedded, and that is a different permission from the one D-14's
licence would grant even at its most generous. `export-ignore` on a font path is not the escape: it
would make the tarball stop being Corresponding Source for the bundle beside it, which is the exact
correspondence `scripts/deploy.mjs:10-15` exists to enforce.

---

## 19. Decisions taken without the user

Every one is a first cut. None contradicts a `[user]` decision; where one supersedes an
`[orchestrator]` note or an approved phase's ruling it says so.

| # | Decision | Rationale |
|---|----------|-----------|
| A-01 | **The register is split by surface, not by page**, and the split is what places the CRT: brand surfaces carry it, product surfaces never do | It converts D-07's "without being overwhelming and destructive to the UX" from a caution into a structural rule that a source scan can enforce |
| A-02 | **Archivo Variable, weight axis only (34,928 B), behind `--font-display`**; the second `@font-face` block is the one swappable thing (D-14) | Grifter's own binary says `PERSONAL USE` in five copies including the one Intech serves live, the foundry's shop is 404 everywhere, and HANGAR publishes its own tracked tree. Archivo is the closest open face; Chakra Petch is the reflex the skill's second-order check exists to catch |
| A-03 | **Two weights per family, and the families are two** — display 700/900, body 400/600 — superseding Phase 4 W-04's "exactly two weights" | Both are variable files, so the second weight costs zero bytes, and one weight per family cannot make a poster and a paragraph out of the same ladder |
| A-04 | **Inter upright only. The italic file is not installed** (D-12) | The user withdrew the italic. `10-RESEARCH.md` §2.5's mitigations are moot and the document is superseded on that point |
| A-05 | **Four CRT layers, gated by one `--crt` custom property on `<html>`**, none of them an ancestor of the coverflow's 3D context, none of them over a text node | The reference's own reduced-motion bug is a direct consequence of spreading its motion across two components; one gate makes the off switch one attribute rather than a hunt |
| A-06 | **The CRT off switch is also a visible control** (`SCREEN: TEXTURED · FLAT`, footer, persisted), answering D-07-confirmed's open half **yes** | Two of the four layers do not move, so `prefers-reduced-motion` cannot reach them, and their cost is legibility rather than motion |
| A-07 | **The glitch ships without any `filter`**, carried entirely by `clip-path` and `translateX` | `paint.ts:17-35`'s four prohibitions make a `hue-rotate` over a pad a fidelity violation, not a style choice, and the site's central claim is that the pixels are the firmware's |
| A-08 | **The glitch never fires on a failure state** | A tear on a failure reads as "the site is broken", which is the opposite of what Phase 7's copy achieves |
| A-09 | **The pad exemption extends to the picker's detents and its result pad, and to nothing else**; HSV fields, hue rings, SV squares, CSS gradients on a rail and `<input type="color">` are forbidden **by name** | 05-UI-SPEC's "no CSS authors a colour the simulator did not" is what forbids a gradient field; naming the forbidden shapes is what stops a later reader guessing |
| A-10 | **The picker is three 16-detent rails plus a 9×9 result pad**, not a wheel or an area | The state is a 4,096-point lattice; a continuous surface implies a resolution it does not have. Three rails cost no new widget, no new keyboard model and no new focus behaviour |
| A-11 | **Unaffordable detents are `disabled` and painted in the ground**, so TUNE-05 stays proven-unreachable with a new number | It converts the 907-of-908 hazard into the most interesting thing on the panel, and it is a colour picker where some colours cost too many characters, which nobody ships |
| A-12 | **The reachability sweep is restructured into two passes**, colour costed separately | A 4,096-option knob is a 683× multiplier; the sweep would become unrunnable. Restructured, it gets faster |
| A-13 | **Format `w` is claimed for Lua colour; format `x` keeps decoding forever** | Links already shared must still land `restored`. This is the one change in the phase with a user-visible failure mode if it is got wrong |
| A-14 | **T2 (forecast) and T4 (`MIX TWO`) ship; T1 (locks) enables both. T3, T5 and T6 do not ship** and are named as deferred | T2 and T4 are the two the survey could not find in any product in the category; T5 is a safety risk that adds a class of click writing twice per gesture and cannot be verified without hardware |
| A-15 | **No genetics metaphor reaches the interface.** Two candidates, four results, one button labelled `MIX TWO` | The house style's plain sentences would fight "breed", "parent" and "mutate", and the copy contract should win that fight |
| A-16 | **D-09 is answered with a scripted demonstration touch, not with a changed configuration** | The four dark entries paint zero bytes at every recorded tick, so no representative motion frame exists; the alternative changes what four pads do on somebody's hardware. HANGAR supplies the finger; the firmware supplies every pixel |
| A-17 | **`restsBlack` is retired as a rendering input and kept as a recorded fact**; `RESTS_DARK_NOTE` is retired outright | The fact is what selects a demo path and what proves no card is accidentally black. The sentence is simply false after this phase |
| A-18 | **`e2e/browse.e2e.ts`'s reduced-motion `dark` exemption is replaced by a universal**: every card's still frame has `nonZeroBytes > 0` | The suite loses an exemption and gains a stronger claim, which is the right direction for a test to move |
| A-19 | **Sixteen terms, two facets, exactly three per entry, OR within a facet and AND across** — superseding 05.1-UI-SPEC's "combining is AND" and its count-derived chip rule | `FOR` gives every entry one term, so under a pure AND the second chip in a facet is always dead. A facet whose second click cannot work is not a facet |
| A-20 | **`MORE TAGS` / `FEWER TAGS` is retired** | It existed to hide twenty-seven singletons that no longer exist |
| A-21 | **`addedAt` leaves `ListingEntry` and stays in the catalog entries** | Nothing reads it after Newest goes, and a field nobody reads drifts; keeping it on the entry costs nothing and touches no entry file |
| A-22 | **The front-door ring stays at eight and gains a `FOR` link row**, answering 10-CONTEXT open question 3 | D-03's "both paths first-class" is satisfied by making the ring the entry to browse rather than its rival: one surface, two depths, and `front-door.ts` stays import-free |
| A-23 | **D-04's sequence is a caption, DOM order and enablement** — never step numerals, never a shared background, never equal weights | SAFE-02's whole content is that the two install controls are never equal-weight, and enablement choreography already *is* the sequence |
| A-24 | **CLEAR takes a fourth tier, "Bare", distinguished by `letter-spacing: 0.28em`** and by sitting below a second hairline | It is the one channel that says "not like the others" without a colour, without a box and without an icon this phase promised not to ship; and it is grep-checkable |
| A-25 | **No `--color-over` on CLEAR.** The third colour stays at three uses | Z-01's reasoning applied to a fourth control: red would say *dangerous* where the truth is *deliberate*, and reusing the over-budget red would weaken both meanings |
| A-26 | **CLEAR writes RAM and never flash**, and its copy says so twice | D-05 asks for the page cleared, not for a permanent wipe; a flash wipe is the most destructive thing this site could do and nothing asked for it |
| A-27 | **CLEAR's confirmation exists for comprehension, not for permanence** | After a try-on the pad still does something; after a clear it does nothing, and a visitor who does not understand that will believe they broke their module |
| A-28 | **CLEAR reuses `partial`, `lost` and `nothing-landed` rather than inventing three failure states.** Fourteen phases become fifteen, not eighteen | Those three already mean "one of two landed", "the connection went" and "zero of two", which is exactly how a clear fails; the copy is selected by `lastAction`, which the store already tracks |
| A-29 | **`WRITE_CLICKS` is a named constant of length four**, replacing the word "three" in prose | The number has now changed once and will change again; a constant moves, a sentence rots |
| A-30 | **The eleven retirements are the whole of D-08**, closed by a stated rule: a string goes only when the control or the pixels beside it already say the same thing, and a string naming a risk, a consequence, a way back or a next step never goes | "And others of the same kind" is an invitation to over-delete; the seven failure blocks are the thing most worth protecting from it |
| A-31 | **`SAFE_NOTE` (35) beneath the primary, in every state, unconditionally** — SAFE-01 kept whole rather than retired | It is stronger than what it replaces: today the promise is in the header note and the disclosure and absent from the panel where the click happens |
| A-32 | **The fidelity line goes from 231 to 44 characters**, keeping PREV-03's claim and retiring its apology | "What a screen cannot show" is the padding; "the firmware's own code" is the product |
| A-33 | **`CH_PER_LINE` is measured in Wave 0 and every reservation is its formula's output**, provisionally 46 | These numbers are arithmetic from a font metric, and a wrong one reflows a device panel mid-install |
| A-34 | **The 152px header note becomes 24px; the honesty slot 72px becomes 48px; `PUT BACK` stays 72px; `KEEP` stays 48px; CLEAR is a new 48px; the tuning region's 152px is untouched** | Two of the note's three collapsing strings were the two longest on the site; the rest follow from the caps |
| A-35 | **The repository's em-dash requirement beats the skill's ban**, recorded rather than silently resolved | It is a project instruction enforced by a shipped test |
| A-36 | **`PRODUCT.md` and `DESIGN.md` are not written**, and the skill's Product gate is resolved against the existing artefacts | This task creates one file, and a thinner second source of truth beside 5,115 lines of test-enforced spec would drift |

---

## Open for the user

Nothing below is assumed. Each is a real fork with the cost of each side stated.

1. **SAFE-01: retired, or satisfied in a shorter form?** Three forms with counts in §10.1.
   **Recommended: form 1**, `SAFE_NOTE` at 35 characters on the control. Forms 2 and 3 are one edit
   each. *(10-CONTEXT open question 1.)*
2. **Grifter.** The blocker is **redistribution, not use**. HANGAR publishes `git archive HEAD` at a
   public URL, so a committed font file is redistributed. Even a written commercial-use grant does not
   clear that; only an explicit grant to include the file in a publicly downloadable source archive
   does. **Recommended: ship Archivo behind `--font-display`, send one email to
   `finn@hansonmethod.com` asking specifically about that, and do not block on the reply.** A "yes"
   later is a two-line swap. *(10-CONTEXT open question 2, D-14.)*
3. **The front-door ring.** Recommended: stays at eight and gains the `FOR` link row (A-22).
   *(10-CONTEXT open question 3.)*
4. **`--color-ground` stays `#000000`.** The ZONA landing uses `#0a0a0b`, and a black scanline over
   true black is invisible — which is exactly why Layer S is scoped to pad frames rather than to the
   page ground. If the ground must move, it is a token change and G-01 grows a clause.
5. **CLEAR writes RAM only** (A-26). If a flash clear is wanted, it is a different control with a
   different confirmation, and it should be a separate decision rather than a widened one.
6. **CLEAR gets no red** (A-25). The reversal is one line: `--color-over` as the confirmation block's
   1px border only, never a fill, never a label, never the affirmative, and `src/app.css`'s header
   comment goes from three uses to four. `identity.spec.ts` needs no change; the token already exists.
7. **The `SCREEN` toggle exists, is visible, and persists** in a second `localStorage` key (A-06). If
   a second key is unwanted, the fallback is a session-only preference that resets on reload, which
   is worse for the visitor it exists for.
8. **The CRT never covers text** (§8.3). If a scanline over the hero copy is wanted anyway, the price
   is: raise every affected token one rung, drop the overlay to ≤ 0.08 over text regions, widen the
   period to 6px, **and** add a contrast gate that composites the overlay rather than reading the
   token. Four changes, and one of them is a new class of test.
9. **TUNE-05 stays unreachable** by disabling unaffordable detents (A-11). The alternative is to let
   the over-budget path become reachable in production for the first time, which the guards are built
   and tested for, and which would be a requirement-status change worth recording rather than a bug.
10. **The tag re-cut**: 55 terms and 28 chips become 16 terms and 16 chips, three per entry, OR within
    a facet. The full assignment for all thirty-six is in §9.4 and is the thing most worth a read.
11. **`RESTS_DARK_NOTE` and `restsBlack`-as-rendering-input are retired; four demo paths ship**
    (A-16). The alternative changes four configurations.
12. **The headline** `PICK ONE · IT IS ALREADY RUNNING` (32) replaces `You’ve got to start
    somewhere…`. It is the one piece of brand voice in this document that is entirely mine.
13. **The fidelity line at 44 characters** (A-32). It is a signed-off PREV-03 string being cut by 187
    characters.
14. **`CH_PER_LINE` is provisionally 46 and every reservation depends on it** (A-33). Wave 0 measures
    it; if it comes back materially different, five numbers and four caps move before any component
    is written.
15. **Five strings beyond the six the user named are retired** — `RECONNECT_OFFER`, `KEPT` body 2's
    first sentence, `RESTS_DARK_NOTE`, and the two honesty-slot rewrites — and the audit is **closed
    at eleven** by the rule in §3.1. If more should go, the rule is the thing to change, not the list.
16. **`$impeccable teach` and `$impeccable document` were not run**, so no `PRODUCT.md` or
    `DESIGN.md` exists (A-36). If the skill's own context files are wanted for future sessions, that
    is a separate one-task change and `document` can generate `DESIGN.md` from this contract plus
    `src/app.css`.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
