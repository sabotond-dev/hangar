---
phase: 10
slug: redesign
status: approved
reviewed_at: 2026-09-08
reviewed_by: gsd-ui-checker (three passes; pass 1 blocked Visuals on CRT placement derived against a described DOM, pass 2 blocked Visuals and Color on two measured numbers, pass 3 approved with five clerical corrections applied by the orchestrator)
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
> hardware's own 4,096-colour lattice, and ten named retirements of shipped copy.
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

> The CRT is a property of a **pad frame, the coverflow band's own box or the page ground**. It is
> never a property
> of a panel, a control, a toolbar or a text node.

**AMENDED 2026-09-08 by A-37 (§19.1), and the amendment is a narrowing rather than a rewrite.** The
line above moves from *brand versus product* to **front door versus everything else**: the front door
keeps Layers G, S, R and T exactly as wave 4 built them, with the `SCREEN` toggle and all three
switches; **browse, the panels, the tuning region and the whole device flow are the instrument
register**, whose six rules are §19.1a to §19.1f. Every sentence above still holds — the CRT is still
never a property of a panel, a control, a toolbar or a text node — and one clause is added: it is no
longer a property of a **browse** pad frame either. The Brand row therefore reads *the splash, the
coverflow band and its pad frames, the page ground*, and the browse grid's cards move to the
instrument register.

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
| Display font | **Grifter Bold** (D-14), **one static face**, `GRIFTER-Bold.woff2`, **13,752 B** measured on this machine at `…/gridstrument-landing/fonts/grifter/`. Served from the site and excluded from the source archive (D-13). Reached **only** through `--font-display`. The proposed reversal to `@fontsource-variable/archivo@5.3.0` (OFL-1.1, latin `wght`, 34,928 B) is **Open for the user, item 2** |
| Body font | `@fontsource-variable/inter@5.3.0` (OFL-1.1), latin `wght` **upright** subset, 48,256 B (D-12: not italic) |
| Numerals | the system monospace stack, unchanged, zero bytes |
| Retired | `@fontsource/quicksand@5.3.0` — uninstalled, its `licenses/` file removed by `npm run licenses`, and the hard-coded attribution at `scripts/gen-licenses.mjs:165-167` rewritten in the same commit |
| Registry | not applicable |

**Font bytes, measured.** Today 31,640 B (two Quicksand statics).

| Route | Files | Total | Delta |
|-------|-------|-------|-------|
| **D-14 as it stands** | Inter Variable 48,256 + `GRIFTER-Bold.woff2` 13,752 | **62,008 B** | **+30,368 B, +96%** |
| The A-02 reversal (Open item 2) | Inter Variable 48,256 + Archivo Variable 34,928 | **83,184 B** | +51,544 B, +163% |

Either route is under a third of the 271,581-byte `wasmoon` glue that already ships lazily. Inter is
latin-only and self-hosted from `node_modules`; the one Grifter face is self-hosted from
`static/fonts/`; neither route ever reaches a CDN, exactly as `src/app.css:3-8` already requires.
The D-14 route is also **one display weight rather than two**, because the shipped Grifter family is
five static files and 900 is not among them — see §5.2.

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
| Simulation semantics | 10 ms tick, 100 ms catch-up clamp, one rAF, `IntersectionObserver { threshold: 0, rootMargin: "200px" }`, at most one touch sample per contact per tick, zero `setInterval` | **The rate contract is inherited verbatim and the demo paths of §9.3 obey it. The plumbing that would carry them does not exist yet**: `host.ts:415` delivers a sample only `if (entry.hero)`, the activity test at `:447` is hero-gated, and `:188` holds **one** `TouchSampler` for the whole host with `MAX_CONTACTS = 5` shared globally. §9.3 names what has to be built |
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
checker can count it. **Ten copy retirements, nine gate amendments, four data re-cuts** — and, after approval, **six
amendments in §3.4** (A-37 to A-42, 2026-09-08, D-15/D-16/D-17), which add no eleventh retirement,
no tenth gate amendment and no fifth data re-cut. Nothing
is deleted; everything is rewritten by name.

### 3.1 Copy retirements (ten, in a register of eleven rows)

| # | String | Where it lives | Pinned | Ruling | §  |
|---|--------|----------------|--------|--------|----|
| R-01 | `You’ve got to start somewhere…` | `FrontDoor.svelte:180` | literal | **Retired.** Replaced by `START EXPLORING` (15) in the Micro role | 13.2 |
| R-02 | `PICKER_EXPLAINER` | `session-copy.ts:193-194` | **130** | **Retired outright.** The browser's own prompt explains itself the instant it appears; a paragraph predicting it is the definition of unnecessary text. CONN-03 is satisfied by the `SAFE_NOTE` beneath the control | 13.2 |
| R-03 | `SAFE_PROMISE` | `session-copy.ts:220-221`, rendered at `DeviceDetails.svelte:305` and `DeviceNote.svelte:191` | **88**, `session-copy.spec.ts:298` | **Retired as a paragraph, preserved as a guarantee.** Replaced by `SAFE_NOTE` (35), a permanent unconditional line on the primary control. SAFE-01 stays `[x]`; `REQUIREMENTS.md:169`'s closure record is amended by name and dated. **This is Open for the user, item 1** | 10.1 |
| R-04 | `FIDELITY_LINE` | `fidelity-line.ts:28-29` | **231** | **Retired at 231, rewritten at 44.** `Every pad here runs the firmware’s own code.` PREV-03's claim is kept whole; the "what a screen cannot show" apology is retired | 13.2 |
| R-05 | `HONESTY_NO_SESSION` | `install-copy.ts:105-106` | ≤129 | **Retired, rewritten at 70.** Z-08 holds: "About a second" is still in exactly the first two honesty strings and nowhere else | 13.3 |
| R-06 | `HONESTY_READY` | `install-copy.ts` | ≤129 | **Retired, rewritten at 90.** Shorter, same two facts | 13.3 |
| R-07 | `SHARE_QUIET_LINE` | `copy.ts:198`, `copy.spec.ts:277` | literal | **Retired outright, no replacement.** `COPY LINK` names itself | 13.3 |
| R-08 | `RECONNECT_OFFER` | `session-copy.ts` | **88** | **Retired, rewritten at 37.** Its "nothing is sent until you do" clause is now carried permanently by `SAFE_NOTE`, so repeating it here was the same promise twice | 13.3 |
| R-09 | `KEPT` body 2, first sentence | `install-copy.ts` | ≤ cap | **Retired.** `HANGAR read both scripts back and they match, character for character.` is a boast about a check the site would not have called `KEPT` without. The restart sentence stays, at 53 | 13.3 |
| R-10 | `RESTS_DARK_NOTE` | `listing.ts:65`, asserted in both directions by `listing.spec.ts:249-252` and `copy.spec.ts:173-174` | literal | **Retired.** D-09 makes it false: after this phase no card rests dark | 9.3 |
| R-11 | `TWO_STEP`, `PERMISSION_DECLINED`, `PUT_BACK_LINE`, `KEEP_ON_DEVICE`'s enabled line and all six reasons, every failure detail and every step | various | various | **NOT retired, and the rule is stated so nobody retires them next.** See the audit rule below | — |

**The audit rule, which closes D-08's "and others of the same kind" at ten:**

> A string is retired only when the control beside it, or the pixels beside it, already say the same
> thing. **A string that names a risk, a consequence, a way back or a next step is never retired**,
> however long it is. That is why the ten above go — R-11 is listed to record that it stays — and the seven failure blocks stay whole.

### 3.2 Gate amendments (nine)

| # | Gate | Amendment | §  |
|---|------|-----------|----|
| G-01 | `src/lib/ui/identity.spec.ts` | `--font-sans`'s first family becomes `"Inter Variable"`; a new assertion pins `--font-display`'s first family to the family named by **every** display `@font-face` block in the file; the `rgb()`-arguments regex widens from `^214 255 78 / [0-9.]+$` to `^(214 255 78\|0 0 0) / [0-9.]+$`. **That widening is only meaningful if Layer S's black is declared in `src/app.css`** — this spec reads that one file and nothing else, so a `rgb(0 0 0 / …)` living in a component `<style>` would be invisible to it (§8.3). **The hex set stays at three. The token count stays at nine. The favicon's two-hue regex is untouched.** X-27's shape, and its own paragraph | 5, 7.1, 8.2 |
| G-02 | `src/lib/ui/tune-ui.spec.ts` | The 56px meters block and the 152px region are re-derived and hold. `HONESTY_CAP`'s value changes | 12 |
| G-03 | `src/lib/ui/device-ui.spec.ts` | `min-block-size: 72px` on the honesty slot becomes `48px`; `PUT_BACK_CAP`, `KEEP_CAP` and a new `CLEAR_CAP` are re-derived; the control walk gains `Clear.svelte` and `ClearConfirm.svelte`. **Both must declare the 44px floor on BOTH axes**: the walk at `:278-306` derives its list from the presence of a control and requires `min-block-size: 44px` **and** `min-inline-size: 44px` on every interactive class it finds, so the Bare tier's `auto` width is not enough (§10.3) | 12 |
| G-04 | `src/lib/device/install-copy.spec.ts` | Seven control labels become **nine**; twelve utterances become **thirteen**; seven failure builders stay **seven**; the three caps become four and all four change value | 10.6 |
| G-05 | `src/lib/device/session.spec.ts` test 15 | The source scan's **nine needles become ten** — a `clear.bind`-shaped export must not slip past. The list at `:1141-1151` is nine today (`.write(`, `RequestQueue`, `hostHeartbeat`, `sendConfig`, `storePage`, `fetchConfig`, `storeToFlash`, `writeBack`, `setInterval`); `REQUIREMENTS.md:169` still says **eight**, which was stale before this phase and is corrected in the same named amendment | 10.7 |
| G-06 | `src/lib/device/install.spec.ts` test 4 | **A no-op on the assertion, and that is the finding.** The test counts writes **by class**, and CLEAR writes `CONFIG/EXECUTE` — the class already counted — so the enumeration needs no widening and its reach is already total. What actually widens is `InstallAction`, and the compiler enforces that for free. The amendment is therefore documentary: the test's comment and `docs/TESTING.md:840`'s "the three clicks" become four, so a later reader does not think the fourth click was missed | 10.7 |
| G-07 | `src/lib/tune/reachability.sweep.spec.ts` | **Restructured, not extended.** The colour dimension is costed separately instead of cross-producted. **State count RISES, 32,852 → 44,078 (+34%)** — the two passes are what keep the growth additive instead of multiplicative, and the honest number is in §11.4 with its derivation | 11.4 |
| G-08 | `src/lib/browse/sort.spec.ts` | **`:125` self-adjusts** — it already reads `BROWSE_SORTS.length * LISTING.length * (LISTING.length - 1)`, so it follows the constant. What needs editing is **`:82`**, whose literal `["featured", "newest", "name"]` and the string "the three sorts" are hand-written, and the `NEWEST` date-block test at **`:179`**, retired by name | 9.5 |
| G-09 | `src/lib/browse/filter.spec.ts` and `src/lib/catalog/copy.spec.ts` | `RECORDED` and `KNOWN_TAGS` are re-cut to the sixteen-term vocabulary; the "chips are tags carried by two or more entries" derivation is retired and replaced by "chips are the facet members" | 9.4 |

### 3.3 Data re-cuts (four)

| # | Data | Re-cut |
|---|------|--------|
| D-a | `listing.ts` tag arrays, all thirty-six | 55 terms and 4-per-entry become **16 terms and exactly 3 per entry** (one `FOR`, two `FEELS`). The full assignment is in §9.4 |
| D-b | `ListingEntry.addedAt` | **Removed from the browse projection**, kept in the catalog entries as provenance. `listing.spec.ts`'s equality loop drops one field and no entry file is touched |
| D-c | `restsBlack` | **Kept as a recorded fact** (it is what selects a demo path, and its two-directional assertion against `frames.json` is the site's proof that no card is accidentally black) and **retired as a rendering input** |
| D-d | `static/og/` | Four OG images regenerate from the end of their demo path rather than from a black rest frame. ETCH's 4,192-byte black square is the marker that this landed |

### 3.4 Post-approval amendments (six, all dated 2026-09-08)

Added after approval, from D-15, D-16 and D-17. Each is stated in full in **§19.1** and each carries
an A-number in §19's register, so the two tables cannot disagree about how many there are.

| # | Amendment | Supersedes | § |
|---|-----------|------------|---|
| A-37 | The register line moves to **front door versus everything else** (D-16) | **A-01**'s placement half. §0's register table and §8.3's scope rule read against it | 19.1 |
| A-38 | **Layer S's selector does not change** — `:global(.front-door) .pad::after` already confines it. The rule gains a second, independent reason | nothing. §8.5's measured fallback stands and is now doubly held | 19.1, 8.5 |
| A-39 | The instrument register's six rules, in numbers (D-15) | nothing. New | 19.1a–f |
| A-40 | The lattice is **monochrome**; the distinguished cross is scale and opacity. **The reserved list stays at eight** | nothing. §7.2's table gains a fifth row | 19.1a, 7.2 |
| A-41 | The **pill** is Secondary's shape and the word row's selected option; **Quiet and Bare stay shapeless** | nothing. §10.3's four tiers stand verbatim; two rows change shape | 19.1b, 10.3 |
| A-42 | The **index-and-em-dash headline** is sibling furniture on `/browse/` only, never in the device flow | nothing. **A-23's "no step numerals" is upheld against D-15** | 19.1f |
| A-43 | **The front-door headline is `START EXPLORING` (15), not `PICK ONE · IT IS ALREADY RUNNING` (32)** (user, 2026-09-08). At two words it is inside §5.2's uppercase rule, so the exception declared for the old headline is retired and the middle dot goes with it. The shipped edit belongs to 10-13.1, which owns the headline | **R-01's replacement text**, §5.2's exception paragraph, §13.0's declaration and §13.1's row. A-42's index form becomes the only declared exception | 13.1 |

**No copy retirement, no gate retirement and no data re-cut is added by these six.** §3.1 stays at ten
retirements in a register of eleven rows, §3.2 stays at nine gate amendments, §3.3 stays at four data
re-cuts. That is the point of A-42: furniture beside a pinned string costs no amendment, and the audit
A-30 closed at ten stays closed.

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
| TUNE-01 | **Amended by one clause.** "Three to six knobs" counts *knobs*, not controls: however many `colour` knobs a panel declares, they are edited through **one** picker — three rails, one result pad and a compact knob selector (§11.2) |
| TUNE-05 | **Stays proven-unreachable, and for a stronger reason than the picker.** The worst reachable state on the whole shelf is `tpad` at 907 of 908 — and `tpad` has **no colour knob**. §11.4 has the measured table |
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
   axis-scoped CSS carrying all seven subsets, six of which HANGAR never uses.

   THE url() SPECIFIER BELOW IS UNPROVEN AND IS A WAVE 0 ITEM. A bare package
   specifier inside url() is not a resolution Vite documents: Vite rewrites
   relative and root-absolute url() targets and leaves anything else alone, so
   this line can ship verbatim into the built stylesheet and 404 in production
   while dev happens to work. Three candidates, in order of preference:
     (a) @import "@fontsource-variable/inter/wght.css" - bare specifiers ARE
         resolved in @import, at the cost of the six unused subsets;
     (b) a RELATIVE url("../node_modules/@fontsource-variable/inter/files/
         inter-latin-wght-normal.woff2"), which Vite fingerprints into
         _app/immutable/assets/;
     (c) a build-time copy into static/fonts/, url("/fonts/...").
   Wave 0 proves ONE of the three against `vite build` AND `vite preview`
   before a component is written. */
@font-face {
  font-family: "Inter Variable";
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url(/* the specifier Wave 0 proves */) format("woff2-variations");
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA,
                 U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122,
                 U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

/* THE ONE SWAPPABLE BLOCK (D-14). Grifter, ONE static face, served from the
   site and excluded from the source archive (D-13). No unicode-range: the
   shipped .woff2 is not subset, and an incomplete range would silently fall
   through to system-ui for any character outside it. If the licence answer is
   no - or if the user takes the A-02 reversal in Open item 2 - this block's
   family, weight and src become one Archivo Variable face and
   --font-display's first family changes. Two lines. Nothing else moves. */
@font-face {
  font-family: "Grifter";
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url("/fonts/GRIFTER-Bold.woff2") format("woff2");
}

@theme {
  --font-display: "Grifter", ui-sans-serif, system-ui, "Segoe UI", sans-serif;
  --font-sans: "Inter Variable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-mono: /* unchanged, byte for byte */;
}
```

**The swap is two lines and it is asserted.** G-01 adds an assertion that `--font-display`'s first
family string equals the `font-family` of **every** display `@font-face` block in the file — every,
rather than "the second", so the assertion survives the D-14 route (one Grifter face), the A-02
reversal (one Archivo face) and any later two-face arrangement without itself being rewritten. It is
also the wording that stays true if a second weight is ever added. A token edited without its face, or a face edited without its token,
is red rather than silently falling through to `system-ui`.

**Why Archivo is the proposed reversal, and why it is not the obvious pick.** This argument stands
whole; what changed after the checker's read is its *status*. It is no longer the contract's position
— D-14 is — it is the evidence for **Open for the user, item 2**. `10-RESEARCH.md` §1.7 offers three
OFL-1.1 faces. Chakra Petch is the one that "sits well beside a CRT treatment" and it is a fifth of
the bytes. It is also **exactly what the skill's second-order reflex check catches**: hardware
playground plus CRT predicts a machined esports display face, and picking it would make HANGAR look
like the category rather than like ZONA. Archivo is a grotesque drawn for display and small text, it
is the closest open face to Grifter's sporty wide grotesque, and — the deciding argument — **the
reference's own width comes from tracking, not from a width axis**: the ZONA landing's character is
`--track-xl: .62em` on a light weight (`10-RESEARCH.md` §3.1). Archivo's 34,928-byte weight-only file
plus HANGAR's tracking gets there; the 90,104-byte width axis buys 55 KB of nothing. It would also
buy back the 900 weight the shipped Grifter family does not have, for zero extra bytes.

### 5.2 The scale — four sizes, two families, two weights per family

| Role | Family | Size | Weight | Line height | Tracking | Case | Used for |
|------|--------|------|--------|-------------|----------|------|----------|
| **Display** | `--font-display` | 28px | **700** | 1.05 | 0.50em | UPPERCASE | The splash wordmark, and only that |
| **Heading** | `--font-display` | 20px | 700 | 1.15 | 0.02em | Mixed | The configuration name in the name plate. The only heading on the site |
| **Micro** | `--font-display` | 12px | 700 | 1.2 | 0.18em | UPPERCASE | Every button label, every region caption, the `FEATURED` mark, the new headline, both facet captions, `SCREEN`, `NEXT`, `HOLD` / `HELD` |
| **Micro (title)** | `--font-sans` | 12px | 600 | 1.2 | 0.01em | Sentence | Every failure and state title, every knob label, every word-row option, every card tag, the `SAFE_NOTE` |
| **Body** | `--font-sans` | 16px | 400 | 1.5 | 0 | Mixed | Every sentence on the site |

Size ratios: 12 → 16 is 1.33, 16 → 20 is 1.25, 20 → 28 is 1.40. Every step clears the skill's 1.25
floor.

**The weight rule, amended by name, and the D-14 route is the tighter of the two.** Phase 4 W-04
declared *exactly two weights*. This phase declares **at most two weights per family, and the
families are two**. Under D-14 the shipped Grifter family is five static files — Thin, Light, Medium,
Regular, Bold — and **900 is not among them**, so the display family ships **one** weight, 700, and
the Display, Heading and Micro roles are separated by **size and tracking rather than by weight**:
28px at 0.50em, 20px at 0.02em, 12px at 0.18em. That is three weights on the whole site (display 700,
body 400 / 600), down from the four the Archivo route would take. Under the A-02 reversal the display
family is a variable file and 900 costs zero extra bytes, so Display returns to 900 and the site is
back to four. The amendment is deliberate and its reason is that a display face and a body face
carrying one weight each cannot make a poster and a paragraph out of the same ladder.

**Rules that survive unchanged.**

- Uppercase stays reserved for the wordmark, button labels and structural captions of **at most two
  words**. Every new uppercase string in §13 is a label or a one- or two-word caption, and
  **there is no exception**. The headline `START EXPLORING` is two words, so it satisfies the rule as
  written rather than standing outside it — A-43 retired the exception the previous headline
  needed, and with it the middle dot that separated its two halves.
- "Quiet" is achieved with colour, never with a smaller size.
- **No italics anywhere** (D-12). Inter's italic file is not installed, not imported, and not
  referenced. `10-RESEARCH.md` §2.5's five mitigations for all-italic body text are moot and the
  document should be read as superseded on that point.
- `--font-mono` is unchanged and stays confined to numerals and machine text. Phase 5 confined it to
  four uses; **§11.3 adds a fifth**, the forecast delta, and names it; **§19.1c adds a sixth**, the
  `+`-separated metadata block, and names it. Six, and the list is asserted.
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

**Three new declared exceptions — one texture metric here, two added by §19.1:**

5. **The scanline period is 5px** — one 1px dark line every 5px. Not 4px, which is the reference's.
   At Phase 4's 16px Body in a 24px line box, a 4px period crosses a line of text six times and a 5px
   period crosses it 4.8 times, and the beat frequency against a 24px box is what turns a scanline
   into moiré. It never crosses text at all in this contract (§8.3), so the number is chosen for pad
   frames, where a 5px period over a 9-cell grid upscaled to 260–560px reads as scan structure rather
   than as a screen door. It is a texture metric in the same class as the coverflow's depth ladder,
   and it is not on the 4-point scale on purpose.

6. **The registration lattice is 48px pitch, 7px arm, 1px stroke** (A-39, §19.1a). The pitch is the
   `2xl` token and adds no spacing value; the arm and the stroke are a texture metric in exception
   5’s class. The distinguished cross is the same metric at 2× the arm.

7. **The pill radius is 999px** (A-41, §19.1b). **Not a fourth rung on the 2 / 6 / 10px radius
   scale**: it is degenerate, resolving to half the block size — 22px at the 44px floor — so it
   cannot drift the way a fourth literal would. Its 24px inline padding is the `lg` token and clears
   the resolved curve by 2px.

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
| Scanline | `rgb(0 0 0 / 0.50)` inside a layer at `opacity: 0.18`, **declared in `src/app.css`** as `--crt-scanline` and referenced from `PadFrame.svelte`, never authored in the component | Pad frames only (§8.3, Layer S) |

The scanline is **the ground at an alpha, not a hue**. It darkens; it never tints. That is the whole
justification for G-01's widening of the `rgb()`-arguments regex — **and the widening only means
anything if the value lives in `src/app.css`**, because `identity.spec.ts` reads that one file and
nothing else. A `rgb(0 0 0 / 0.50)` written inside `PadFrame.svelte`'s `<style>` would be invisible
to every colour gate the site has. So the value is a custom property in `app.css` and the component
references it. The alternative — leaving it in the component, dropping G-01's widening, and adding a
component-`<style>` colour scan to `aesthetic.spec.ts` — is a whole new class of gate to buy the same
guarantee, and it is rejected here for that reason. The widened guard still fails
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

**It stays at eight, and that is a result rather than an accident.** **Five** things in this phase
were candidates and each was solved without accent — the fifth added 2026-09-08 by A-40:

| Candidate | Solved by |
|-----------|-----------|
| The picker's selected detent | **Already item 8.** A detent is the selected value of a knob |
| A knob's held state (§11.5) | The word changes `HOLD` → `HELD`, and the default marker changes from a 2px dot to a 2px `--color-line` bar. Two non-colour channels |
| The `NEXT` sequence marks | There are none. The sequence is a caption, DOM order and enablement (§10.2) |
| CLEAR's destructive weight | Tracking, position, a second hairline and a confirmation (§10.4) |
| **The registration lattice's one distinguished cross** (D-15 reference A; added by **A-40**) | **Scale and opacity.** A 14px arm against 7px, `--color-line` (0.4) against `--color-line-soft` (0.2). Reference A's accent cross does **not** ship, and the ruling is held by a shipped gate rather than by taste: `tune-ui.spec.ts`'s accent census over the seven tuning components is asserted **unmoved at fourteen** (10-09-02), so a ninth accent use inside the tuning region is red on sight (§19.1a) |

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
| A 22%-tall translucent bar sweeping on a 6.5s transform | **Ships, once for the page, inside `.crt-band` only** (§8.3), and not at all while a pad is chosen. The reference's cold blue `#bed7ff12` becomes `rgb(214 255 78 / 0.05)`: a borrowed hue would be a fourth colour |
| `step-end` "tear" with `filter`, `clip-path` and `translate` | **Ships without the `filter`.** `hue-rotate`, `saturate`, `contrast` and `brightness` are all removed. `clip-path: inset()` and `transform: translateX()` carry the whole effect |
| Chromatic aberration | **The reference does not use it and neither does this.** Worth stating, because "CRT" is usually assumed to require it and it is the most expensive of the common techniques |

**The reference's own reduced-motion block does not stop its scanline sweep** (`10-RESEARCH.md` §3.1,
quoted in full there). HANGAR's contract is stricter, so this treatment is **re-derived under
HANGAR's rules rather than ported**, and §8.6 is the assertion that makes the difference real.

### 8.2 Layer order, stated against the fragile thing it must not break

`Coverflow.svelte:14-19` records the constraint, and the precise reading of it is what this section
got wrong on its first pass. The group — an `overflow` other than `visible` or `clip`, an `opacity`
below 1, a `filter`, a `mask-image`, a `mix-blend-mode`, `contain: paint` — forces
`transform-style: flat` on **the descendants of the element that carries it, inside the 3D rendering
context that element belongs to**. The context here is established by **`.stage`**
(`Coverflow.svelte:984-990`), the only element in the file carrying `perspective` and
`transform-style: preserve-3d`.

**`.band` is not "above the 3D context" in the sense that matters — it is outside it.** It carries no
`preserve-3d`, and `:962-970` puts `overflow: clip`, `overflow-clip-margin: 6px` and the edge
`mask-image` **on `.band` deliberately**, which is what rule 1 of that component's own header says in
so many words. Forbidding those two declarations, as this section's first pass did, would have made
the gate red against correct, load-bearing, documented code.

**So the placement rule is stated against `.stage` and `.slot`, and the permitted set is named:**

> No CRT layer is ever set **on `.stage`**, and no CRT layer is ever an element **between `.stage`
> and a `.slot`**. Every layer is a **sibling of `.band`**, or a **leaf inside a slot**, or **behind
> all content** entirely. A pseudo-element's `opacity` applies to the pseudo-element and never to its
> originating element, so a `::after` on a leaf is safe; a rule on `.stage` is not.
>
> **Permitted by name, and asserted PRESENT rather than merely tolerated** — the same shape of
> carve-out `filter: brightness()` already has:
>
> - **`.band`'s `overflow: clip`, `overflow-clip-margin: 6px` and `mask-image`**
>   (`Coverflow.svelte:962-970`). They are the clip and the edge fade the row is built on.
> - **Each slot's inline `opacity` and `filter: brightness(...)`** (`Coverflow.svelte:841-846`). A
>   slot is a leaf of the 3D tree — it has no 3D children to flatten — and the recede depends on both.
>
> A scan that only forbade would go green on a tidy-up that *deleted* the band's mask, so §8.7
> assertion 4 asserts both directions. §16's "Coverflow.svelte — nothing structural" stays true
> because nothing in this section asks that file to change.

The complete order, from the ground up:

| z | Layer | Element | Relationship to the 3D context |
|---|-------|---------|--------------------------------|
| −1 | **G — ground** | `body::before`, `position: fixed; inset: 0; pointer-events: none` | **Behind all content.** Never an ancestor of anything |
| 0 | — | The page's own content, including `.band` and `.stage`, untouched | — |
| 2 | (existing) | The pad's gutter grid and dot field, unchanged | leaf |
| 3 | **S — scanlines + noise** | `PadFrame.svelte`'s frame `::after`, one pseudo-element, two background layers, `pointer-events: none`, inside the 10px radius | **A leaf of the 3D tree**, the same position `filter: brightness()` already legally occupies (Coverflow rule 2). It has no 3D children to flatten |
| 4 | **R — roll bar** | A real `<div>` inside `.crt-band`, the CRT shell: a **sibling of the whole Coverflow output**, geometrically bound to `.band`'s own box (§8.3), `position: absolute; pointer-events: none`. Exactly **one instance for the whole page**, and it does not mount while a pad is chosen | **A sibling.** Never an ancestor |
| 5 | **T — tear** | `.crt-band::after` — a pseudo-element **overlay**, `step-end`, ≤ 300 ms, on one event only (§8.4). Never the element it decorates, never an element that has contents | **A sibling's pseudo-element.** Never an ancestor, never on a product surface, never on a canvas, never over a text node |

**No layer is a `position: fixed` overlay above the content.** A full-viewport fixed overlay would be
structurally safe for the coverflow — a sibling is not an ancestor — and it is what the reference
does, and it is rejected here anyway for two reasons: it would cover text nodes (§8.3), and a texture
that does not scroll with the pads reads as glass on the screen rather than as the screen itself.

### 8.3 Scope — the rule that keeps the contrast gate honest

> **The CRT layer never covers a text node, and never lands motion on a product surface.** Layer G
> sits behind all content. Layer S is scoped to pad frames **on the front door** — A-38, and the
> selector that shipped in wave 4 already says so, so the register is its second reason rather than
> its first edit. Layers R and T are scoped to
> **`.crt-band`**, whose box is defined immediately below and contains no rendered text. Layer T
> clips and translates **itself** — a pseudo-element — and never an element with contents. Every
> layer carries `pointer-events: none` and `aria-hidden="true"`, and **no text-bearing element is a
> descendant of a CRT container.**

**`.crt-band` — the box, stated explicitly, because "a sibling of `.band` at `inset: 0`" was wrong.**
`Coverflow.svelte` renders four top-level siblings — `.band` (`:807`), `.plate` (`:873`),
`.fidelity` (`:884`) and, while chosen, `.panel` (`:930`) — and `FrontDoor.svelte:181` wraps the lot
in one `<div class="row">`. A bar that is a sibling of `.band` at `inset: 0` therefore sweeps across
the 20px Heading that carries the configuration's name and across the fidelity prose beneath it.
`Coverflow.svelte` is **not** restructured to give it a shell: §16's "nothing structural" is a promise
this document keeps, and that component's header forbids exactly this class of change.

So the shell is added in `FrontDoor.svelte`, as a **sibling of the whole Coverflow output**, sized to
`.band`'s box rather than to the row's:

| Property | Value | Why |
|----------|-------|-----|
| Parent | `<div class="row">`, which gains `position: relative` | The one line `FrontDoor.svelte` already owns; §16 already lists the file as modified |
| Position | `position: absolute; inset-block-start: 0; inset-inline: 0` | `.band` is the row's first child and starts at its top edge |
| Block size | `clamp(260px, 52vmin, 560px)` | `.band`'s height is `.stage`'s, and `.stage`'s is `--pad-hero` |
| Inline size | `min(100vw, 1280px)`, `max-inline-size: 100%`, `margin-inline: auto` | `.band`'s own three lines. Above 1280px the row is full-bleed and the band is not, so `inset-inline: 0` alone would over-reach |
| Clip and fade | `overflow: clip` plus the identical `mask-image` linear gradient | So the bar and the tear fade at the same two edges as the pads. Legal here: `.crt-band` is an ancestor of nothing |
| The chosen lift | `transform: translateY(-24px)` under `.chosen`, the same 260 ms curve, both dropped under `prefers-reduced-motion` exactly as `Coverflow.svelte:1034-1047` drops them | `.band.chosen` lifts 24px; a layer that did not follow would slip 24px out of register the instant a visitor chose a pad |
| Contents | Layer R (one `<div>`) and Layer T (`::after`). Nothing else, ever | |
| Semantics | `aria-hidden="true"`, `pointer-events: none` | |

**The duplication is real, and it is gated rather than trusted.** Four literals now live in two files.
§8.7 source-scan 7 asserts they are string-equal between `Coverflow.svelte`'s `.band` rules and
`FrontDoor.svelte`'s `.crt-band` rules, so an edit to one that is not made to the other goes red and
names both files. `/browse/` has no `.crt-band`, so Layers R and T never appear on that route at all.

This is the whole answer to `10-RESEARCH.md` §3.5's second silent-green hole. The arithmetic there is
not disputed: a 0.186-alpha black line over `--color-ink-quiet` drops it from 5.57:1 to about 3.9:1,
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

The tear is a **meaning**, never a decoration — and after the checker's read it is also **one
surface and one event**, because the first pass put it on three product surfaces and §0's own
load-bearing rule forbids that.

| Fires | Why it means something |
|-------|------------------------|
| **The connect moment** — `navigator.serial`'s `connect` event, a permitted ZONA physically plugged in | Real hardware caused it, and it is the one thing that happens on this site that the visitor did not start with a click. 180 ms on `.crt-band::after`, across the coverflow band, which is a **brand** surface |

**The two firings that were removed, and why they had to go.** A `clip-path` and a `transform` apply
to an element **and every descendant**, so a tear on a panel translates and clips that panel's own
text — and it lands motion on a Product surface, which §0 forbids and A-01 exists to make
enforceable. In the connect case it would also displace `TRY ON DEVICE` by up to 3.2% of the panel
width under a hand already reaching for it, which is the worst place on this site to move a control.

| Removed | What carries the meaning instead |
|---------|----------------------------------|
| A tear on the tune panel for `SURPRISE ME` and `MIX TWO` | The pads. A reroll moves every knob's marker and repaints the preview; nothing about it is unclear without a glitch |
| A tear on the panel when the state crosses into over budget | The six non-colour signals 05-UI-SPEC already counts, plus the meter's own colour. There is no seventh, and there does not need to be |

| Never | Why |
|-------|-----|
| **On a product surface of any kind** — a panel, a control, a toolbar, a meter, a failure block | §0's register split, and A-01. The tear lives on brand surfaces only, and in this phase that is exactly one: `.crt-band` |
| **On the element itself** | It is always a pseudo-element overlay — `aria-hidden`, `pointer-events: none` — that clips and translates only itself. §8.3's "animates a border box, not its contents" is achievable this way and was not achievable the other way |
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
| R | **Zero repaint.** One composited transform on a promoted layer | **1, for the page**, and none while a pad is chosen | one `.crt-band`-sized RGBA surface — at most 1280 × 560, roughly **2.9 MB**, not a full-viewport one |
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

**TAKEN, 2026-09-08, in wave 4, and the fallback applies.** chromium **0.00 ms** at p95;
webkit-phone **61.00 ms** against a 2 ms threshold, with the sampled frame count halving from 128
to 65. Layer S's selector is therefore `:global(.front-door) .pad::after` in `PadFrame.svelte`, and
`e2e/aesthetic.e2e.ts` test 3 holds it in the browser. **A-38 (§19.1) gives that one selector a
second and independent reason** — the register line of A-37 — so a future engine that closes the
61 ms gap does not argue the browse grid's thirty-six overlays back.

**And the table's Layer G row was measured false on one engine.** It says *zero by construction …
one inset shadow, rasterised once*; the `box-shadow: inset 0 0 26vmax 9vmax` cost **105 ms per
scrolled frame at p95 on webkit-phone**. It ships as a `radial-gradient` on a promoted layer. The
corrected row is in §19.1e with the four-arm decomposition behind it.

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
| Floor | `min-block-size: 44px` **and `min-inline-size: 44px`** per option — both axes, as the identical word-row widget in §11.2 declares and as `device-ui.spec.ts:278-306` requires. `FLAT` is four characters at 12px/0.18em, about 38px wide, so the inline floor is load-bearing here rather than free |

**Switch 3, automatic and not visible.** Layer R does not mount at all when
`navigator.hardwareConcurrency <= 4`. It is the only layer with a per-frame compositor cost and the
only one worth spending a capability check on. Feature-detected, never browser-sniffed.

**Switch 3 is also the second way §8.7's reduced-motion test could pass on nothing** — a CI runner
with four cores would mount no roll bar at all — so the gate overrides it explicitly and then asserts
it in its own right. See §8.7 tests 1 and 4.

### 8.7 The assertions, because the existing ones would stay green

`e2e/browse.e2e.ts:140-148` and its twin at `e2e/first-experience.e2e.ts:87` read the **9×9 canvas
backing store**. A CSS overlay painted above the canvas by the compositor never touches that backing
store. **A sweeping scanline bar over the pads would leave every existing reduced-motion assertion
green.** The tests would lie. Two new gates close it.

**`e2e/aesthetic.e2e.ts` — new, four tests, both projects (`chromium` and `webkit-phone`).**

**Every one of them carries the house non-vacuity assertion first**, in `identity.spec.ts`'s and
`device-ui.spec.ts`'s shape — `expect(count, "the walk was not empty").toBeGreaterThan(0)` — because
each of these tests reads a computed style off an element that a default or a capability check can
legitimately keep out of the DOM, and `getComputedStyle` of nothing asserts nothing.

1. **Reduced motion stops both moving layers.** Under `emulateMedia({ reducedMotion: "reduce" })`
   called **before** `goto`, with `matchMedia("(prefers-reduced-motion: reduce)").matches` asserted
   true as the existing suites do. Two gates have to be opened first or the test is vacuous, and both
   were live holes on this document's first pass:
   - **`SCREEN: TEXTURED` is selected explicitly**, because §8.6's own default under reduced motion
     is `FLAT`, which mounts no roll bar at all;
   - **`navigator.hardwareConcurrency` is forced to 8** through `addInitScript` before `goto`,
     because Switch 3 removes Layer R on a four-core runner and CI runners are often four-core.

   Then: the roll bar and the tear-bearing element are each found and counted (`> 0`), and
   `getComputedStyle(el).animationName === "none"` on both.
2. **`SCREEN: FLAT` turns off all four layers**, not two. `getComputedStyle(document.documentElement)
   .getPropertyValue("--crt")` is `0`; `getComputedStyle(document.body, "::before").backgroundImage`
   is `none` (**G**); `getComputedStyle(padFrame, "::after").content` is `none` (**S**); the roll bar
   is absent from the DOM (**R**); `getComputedStyle(crtBand, "::after").content` is `none` (**T**).
   The same four selectors are asserted **present** first with `SCREEN: TEXTURED` and with
   `navigator.hardwareConcurrency` forced to 8 exactly as test 1 does — without the forcing,
   Switch 3 drops Layer R on a four-core runner and the presence half fails on correct code.
   The test proves
   a change rather than an absence.
3. **The `SCREEN` choice survives** a navigation from `/` to `/browse/` and a reload.
4. **Switch 3 is asserted in its own right.** With `navigator.hardwareConcurrency` forced to `4`
   before `goto` and `SCREEN: TEXTURED` selected, the roll bar is absent from the DOM while Layers G
   and S are still present. Without this, Switch 3 is a sentence no test can tell from a typo.

**`src/lib/ui/aesthetic.spec.ts` — new, seven source scans in `front-door.spec.ts`'s idiom.**

1. The four layer selectors appear only in an explicit allowlist of files, with a floor so the walk
   cannot pass vacuously.
2. Every layer declares `pointer-events: none`, and Layers R and T additionally declare
   `aria-hidden="true"`.
3. **No text-bearing element is a descendant of a CRT container**, expressed as: no CRT selector
   appears in the same component as a rendered `<p>`, `<h*>`, `<label>`, `<button>` or `{...}` text
   expression, except through the allowlist. `FrontDoor.svelte` is on that allowlist and its entry
   carries its condition in the assertion message: `.crt-band` is `aria-hidden`, `pointer-events:
   none`, and geometrically bounded to a box that contains no rendered text (§8.3).
4. **Both directions on `Coverflow.svelte`, and the permitted set by name.** `.stage` declares none
   of `filter`, `mix-blend-mode`, an `opacity` below 1, `mask-image` or `contain: paint`; no new
   rule adds any of them to `.slot` beyond the two inline ones already there; and — the direction the
   first pass had backwards — **`.band` still declares `overflow: clip` and `mask-image`**, and a
   slot still declares inline `opacity` and `filter: brightness(`. Deleting the band's mask is as red
   as adding one to the stage.
5. No CRT selector names a `canvas`.
6. The noise data-URI declares no `fill` attribute other than the filter's own output, so the tile
   cannot smuggle in a hue.
7. **The `.crt-band` geometry is string-equal to `.band`'s.** Five literals —
   `clamp(260px, 52vmin, 560px)`, `min(100vw, 1280px)`, `overflow-clip-margin: 6px`, the
   `mask-image` linear-gradient and `translateY(-24px)` — are read out of `Coverflow.svelte`'s
   `.band` rules and out of
   `FrontDoor.svelte`'s `.crt-band` rules and compared after the same whitespace normalisation
   `identity.spec.ts` uses. A change to one that is not made to the other goes red and names both
   files (§8.3).

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
3. **Headline**, Micro role: `START EXPLORING` (15).
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
| **(b) A scripted demonstration touch** | New machinery, and more of it than this document first claimed: a `DemoPath` type, four authored paths, a loop driver in `SimHost`, one reduced-motion rule — **and three changes to the host's touch plumbing that do not exist today** (below). **Touches no configuration, no Lua source, no character budget and no frame hash.** **Chosen** |

**The ruling, stated so it cannot be read as faking motion:**

> **Every card paints. A configuration that paints nothing until it is touched is given a finger, not
> a light.** `PadFrame.svelte` gains a `demo` mode. A `DemoPath` is a short array of
> `{ tick, pointer, event, x, y }` samples, replayed into the engine through the **existing**
> `src/lib/sim/touch.ts` queue at the **existing** rate — at most one sample per contact per 10 ms
> tick, MOVEs coalescing to newest, DOWN and UP always keeping their place — and looped over a fixed
> period. HANGAR supplies the gesture; the firmware supplies every lit pixel. **Motion is never
> faked**, and this is the sentence that keeps that true: a demo card shows what a real finger would
> make it do, drawn by the same code as a real finger.

**What the demonstration touch actually needs, because "it goes through the existing queue" is only
half true.** The *rate* contract survives intact — `src/lib/sim/touch.ts`'s sampler already enforces
at most one sample per contact per 10 ms tick with MOVEs coalescing to newest, and nothing here
changes that. The *plumbing* does not exist:

| Today | Why it blocks a demo card | The change |
|-------|---------------------------|------------|
| `host.ts:415` delivers a sample only `if (entry.hero)` | A browse card and a non-centred coverflow slot are never hero, so a demo path would be queued and never delivered | Delivery is gated on `entry.hero \|\| entry.demo` |
| `host.ts:447`'s `active()` counts a touch as activity only for the hero | A demo card whose configuration is otherwise still would be judged frozen and its rAF would stop mid-gesture | The `touchActive` term widens to demo entries, on the same `sampler.size > 0 \|\| engine.pendingTouches > 0` test |
| `host.ts:188` holds **one** `TouchSampler` for the whole host, and `touch.ts:25` sets `MAX_CONTACTS = 5` globally | Four demo cards plus a live finger on the hero contend for five slots. Trackpad's own path uses two contacts, so two demo cards alone can starve the visitor's finger | **One sampler per demo entry**, held on the entry rather than on the host. The hero keeps the host's sampler untouched, so the interactive preview's guarantee is byte-for-byte what Phase 4 signed off |

Three small changes in one file, each with a test in `host.spec.ts`'s existing idiom. **D-09's ruling
is unchanged; only the claim that it needed nothing new is corrected.**

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
- **`SimHost.stillFrame()` gains a second branch.** The shipped machinery is `host.ts:467`'s private
  `stillFrame(entry)` — `engine.reset()` then `engine.run(REDUCED_MOTION_TICKS)`, with
  `REDUCED_MOTION_TICKS = 64` at `schedule.ts:53` and pinned against the vendored constant by
  `schedule.spec.ts:101-102`. There is no `stillFrameOf(entry)` anywhere in the tree and this
  document should not have named one. Under `prefers-reduced-motion: reduce` a normal entry runs to
  tick 64 and freezes, as today; a **demo entry resets and then replays its path to the end, once,
  and freezes**. One private method, two branches, called from the three sites that already call it
  (`:244`, `:274`, `:480`), and the demo is uninvited motion so it never loops under reduced
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
tags, **27 of them on exactly one entry**, 28 chips standing in the toolbar, and 3 or 4 tags per
entry. Three quarters of the vocabulary matches a single card. That is a list, not a filter.

**And there is no `MORE TAGS` disclosure to retire, because it was never built.**
`BrowseToolbar.svelte:44-52` says so in as many words: 05.1-CONTEXT D-15 beat 05.1-UI-SPEC W-19, the
toggle is *deliberately* not built, and the singletons stay searchable text on the card. Two shipped
things carry the weight instead, and neither has ever been named in a spec:

| Shipped, unnamed until now | What it does |
|---------------------------|--------------|
| **The outsider chip** | An active tag that is not one of the standing chips renders its own chip after them. It is what makes a shared `/browse/?tag=looper` link **removable** instead of a filter with no visible control — `BrowseToolbar.svelte:49-52` |
| **`disabledTags()`** | Pure, derived from `entries`, pinned in node by `filter.spec.ts`. It is what turns a chip that would empty the grid into a real `disabled` checkbox without printing a number on it |

**The target: sixteen terms in two facets, exactly three per entry.**

> **The rule for what earns a chip: a term earns a chip when it is a member of a declared facet.
> Every facet member is always a chip.** The vocabulary is closed and lives in `facets.ts`; it is not
> derived from counts, so it does not drift as the catalog grows, and no
> disclosure is needed. An entry that cannot be described with these sixteen terms is evidence that the
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

The shipped rule — a chip that would return zero given the currently active set is a real `disabled`
checkbox with no adjacent reason line, derived by **`disabledTags()`** — **survives and becomes
rare**: a chip is disabled only when
it would return zero given the *other* facet's active set.

**The toolbar's two rows.** `FOR` first (ten chips), `FEELS` second (six chips), each a
`role="group"` with its own Micro caption and its own `aria-labelledby`. Chip treatment, box, states,
44px floor and "removing an active chip is clicking it again" are 05.1's, unchanged.

**There is no disclosure, and there never was one.** Sixteen chips in two labelled rows fit above the
grid at every width, which is what A-20 is really claiming. What genuinely retires is the *derivation*
— chips were "the tags carried by two or more entries", now they are "the facet members" (G-09) —
and, with it, **the outsider chip**: the vocabulary is closed at sixteen, so no active facet member
can ever fall outside the standing rows, and the migration below leaves an unmapped legacy value in
the search field rather than as a chip. Nothing can produce an outsider any more, so the branch goes
with the derivation that needed it. `disabledTags()` stays, unchanged.

**URL parameters, and the ruling on an unmapped value.** `?tag=` becomes `?for=` and `?feels=`. An
inbound `?tag=` is **accepted for one release** and mapped through a declared table in `facets.ts`.

> **An unmapped `?tag=` value is NOT dropped. It becomes the search query.** `?tag=looper` lands as
> `?q=looper`.

Dropping it silently — which is what this document said on its first pass — would break every shared
link that names one of the twenty-seven singletons, and those are precisely the links most likely to
exist, because a singleton tag is what somebody shares when they mean *this one card*. The
redirection is also the shape 05.1 already argued for and shipped: the singletons are searchable text
on the card, and "a tag that filters thirty-six down to one is a thing the search field does better".
So the link still shows what it always showed, in a control the visitor can see and clear, and the
outsider chip's job passes to the search field's own `CLEAR`. A mapped value becomes its facet chip.
It is never an error, never a 404 and never a message: a stale shared link should land on a working
catalog, not on an apology.

### 9.5 D-11 — the Newest sort

**Removed.** `addedAt` has three distinct values across thirty-six entries and one of them covers
twenty, so ordering by date says nothing.

| What changes | To |
|--------------|-----|
| `BrowseSort` | `"featured" \| "name"` |
| `BROWSE_SORTS` | `["featured", "name"]` |
| `newestOrder`, `orderFor`'s middle branch | deleted |
| `sort.spec.ts` | **`:125` needs no edit** — it already reads `BROWSE_SORTS.length * LISTING.length * (LISTING.length - 1)` and follows the constant, so `3 × n × (n − 1)` becomes `2 × n × (n − 1)` on its own. What needs editing is **`:82`**, whose literal `["featured", "newest", "name"]` and message "the three sorts, in the toolbar's order" are hand-written, and the `NEWEST` date-block test at **`:179`**, which 09-02 restructured and which is now retired by name |
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

**AMENDED 2026-09-08 by A-41 (§19.1b).** The four tiers below stand **verbatim** — what changes is the
shape of two of them. **Secondary** becomes a fully-rounded 1px outline with a transparent fill and
24px inline padding; **Primary** takes the same radius on its existing accent fill; **Quiet and Bare
are untouched — borderless, shapeless, no radius, no background**. Pilling Quiet would give
`KEEP ON DEVICE` a border and flatten it into Secondary, which is the exact regression §10.2 exists to
prevent; pilling Bare would give `CLEAR` a box, and A-24's whole argument is that it has none.
**Where D-15's “universal pill” and this ladder collide, the ladder wins, because SAFE-02 is a
requirement and a control shape is a style.**

| Tier | Controls | Treatment |
|------|----------|-----------|
| **Primary** — one per panel | `TRY ON DEVICE` | Phase 7's, verbatim |
| **Secondary** — bordered | `PUT BACK`, the two confirmations' affirmatives, `COPY LINK`, `TURN IT DOWN`, `MIX TWO` | Phase 7's, verbatim |
| **Quiet** — borderless | `KEEP ON DEVICE` in the install row, `NOT NOW`, `DISCONNECT ZONA`, `BROWSE ALL`, `HOLD` / `HELD` | Phase 7's, verbatim |
| **Bare** — one per panel, last | **`CLEAR`** | `min-block-size: 44px` **and `min-inline-size: 44px`** — both axes, because `device-ui.spec.ts:278-306` derives its control list from the presence of a control and requires both on every interactive class it finds, so an `auto` width fails G-03. `padding-inline: 0`, no border, no background, no fill, label Micro in `--color-ink-quiet` at **`letter-spacing: 0.28em`** — wider than every other label on the site. `CLEAR` at 12px, 0.28em, is about 60px wide, so the inline floor costs nothing and only has to be declared. Hover: label to `--color-ink`, 140 ms. Disabled: `--color-ink-dim`, a real `disabled` attribute |

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
| **One picker per panel** | **Not one per knob.** A panel declares one `ColourPicker`: three rails, one result pad, and — only when the entry has more than one colour knob — one compact selector naming which knob the rails are editing. Three rails per colour knob would put nine rails and three extra canvases on `console`, `strip` and `forge`, which breaks §11.6's six-canvas budget and TUNE-01's amended knob count in the same stroke |
| **The knob selector** | Phase 5's **word-row widget** again, unchanged in markup and behaviour — the third use of it, after `SORT` and `SCREEN`: a `role="radiogroup"` of real `<input type="radio">` inside `<label>`s, **one tab stop**, arrow keys move and select, selected option in `--color-accent` (reserved-list item 8 — a selector of knobs is knob vocabulary, so no accent is added). Options are the colour knobs' own labels in rack order, Micro (title), sentence case: `Level` · `Rail` · `Mute`. **44px `min-block-size` and `min-inline-size` per option.** When the entry has exactly one colour knob the selector **is not rendered at all** and the caption carries that knob's label, so the six preset cards and the eight single-colour Lua entries look exactly as they do today. Counted: **14 entries show no selector, 14 show two options, 3 show three** |
| **Three rails** | One per channel of the **selected** colour knob, sixteen detents each, using **the existing detent-track widget** (05-UI-SPEC's `n ≥ 9` skin: a 4px `--color-line-soft` track filled to the index in `--color-accent`, a 12px accent thumb). One `<input type="range" min="0" max="15" step="1">` per rail, `opacity: 0`, over the painted detents, filling the 44px box, with a real `<label for>`. Arrow keys step one, `Home` / `End` jump to the ends, double-click resets. **No new widget, no new keyboard model, no new focus behaviour** |
| **Detent fills** | Each detent on the R rail is painted in the exact RGB444 colour that index would produce **given the current G and B**. The rail is therefore a gradient made of sixteen discrete, storable, reachable colours, and it re-paints when either other rail moves. This is what "stylized" means here, and it is legal under A-09 precisely because every cell is a flat fill of a stored value rather than a CSS gradient |
| **Cheap-step ticks** | A 2px `--color-line` tick 4px beneath the detents whose literal is short — `0`, `17`, `85`, `170`, `255` and their one- to three-digit neighbours. The same shape as the default marker, so it is already a learned mark. It is the visible answer to "which colours cost the fewest characters" |
| **Unaffordable detents** | A detent whose literal would push the state past 908 is a real `disabled` option, painted in `--color-ground` with a 1px `--color-line-soft` hairline: **absent as a colour, present as a position**. No adjacent reason line — the meter two centimetres away is the cause, which is Phase 5's X-17 precedent and 05.1's disabled-chip precedent. **Measured: on today's shelf this never fires** — the dearest colour on the dearest colour-bearing preset leaves 268 characters free, and zero of the 24,576 Pass B states crosses 908 (§11.4). It is built as a guard, not as a feature |
| **The result** | **A 9×9 miniature of the pad running this entry's own animation, with every colour knob at its current value** — one pad, not one per knob, because the pad is the entry and a three-colour entry has one appearance. Not a rectangle. It costs one more `PadCanvas` instance, gated by the same `IntersectionObserver`. Given that one layer emits at most 49.6% and there is no gamma correction, **a flat swatch is the lie and the miniature pad is the truth**: it answers "what will this look like on my ZONA" instead of "what does this hex look like on my monitor" |
| **Caption** | `COLOUR` (6), Micro, `--color-ink-quiet`. On a single-colour entry the knob's own label sits beside it as the Micro (title) sub-label the knob rack already renders |
| **Accessible names** | Each rail's visually-hidden label is `Red, 16 steps` / `Green, 16 steps` / `Blue, 16 steps` (13 / 15 / 14), prefixed by the selected knob's label when a selector is present (`Mute red, 16 steps`). The selector's group label is `Which colour` (12). The composed value is announced by the group's `aria-valuetext` as the three stored integers, never as a hex |
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
| Over-budget forecast | The delta renders in `--color-over` **only** when the forecast crosses 908. **This is a fourth use of the third colour and it is not taken**: instead the option is already `disabled` (§11.2), so an unaffordable forecast cannot be hovered. On today's shelf neither branch is reachable at all — §11.4 measures 268 characters free on the dearest colour-bearing preset — so this is a guard on a guard, and `--color-over` stays at three uses |

**Two amendments this costs, both named:**
1. **A fifth `--font-mono` use.** Phase 5 confined the mono stack to four; the delta is the fifth, and
   it qualifies for exactly the reason W-03 introduced the stack: it is a number that changes as a
   pointer moves, and it must not jitter horizontally.
2. **A fifth permitted typographic character: `−` U+2212.** A hyphen-minus in a signed numeral, on a
   site that ships U+2019, U+2026, U+2014 and U+00B7, is precisely the inconsistency this copy
   contract exists to prevent. It is permitted in the forecast delta and nowhere else.

### 11.4 The two collisions, resolved

**Collision 1 — the 908 wall, re-derived against the source and against a real cost run.**

`glc(a, layer, r, g, b, 1)` writes the three channels as decimal literals. Under RGB444 every channel
is a multiple of 17, so it is one, two or three digits, and the three together are **3 to 9
characters** — not the "3 to 11" this document claimed on its first pass, which counted the separators
at one end of the range and not at the other. Measured end to end on aurora's Setup: `0,0,0` costs
**253**, today's default `0,204,255` costs **257**, `119,187,238` costs **259**, and so does `255,255,255`: a card that emits its colour once charges one character per digit, so every three-digit-per-channel literal ties. `255,255,255` pulls ahead only on `ninepads`, whose checkerboard emits a dimmed second copy — `102,102,102` against `47,74,95`, three characters dearer. **The
whole 4,096-colour lattice is worth six characters.**

**And the `tpad` claim was false.** `knobs.preset.ts:688` reads
`tpad: [tapKnob, pointerKnob, scrollKnob]`. **The trackpad has no colour knob**, so its measured
907-of-908 worst state cannot be pushed over by a colour literal — there is no colour literal in it.
Six of the nine presets carry a colour knob (`aurora`, `pinwheel`, `starfield`, `radar`, `joystick`,
`ninepads` — `:680-685`); three do not (`faders` `:686`, `dial` `:687`, `tpad` `:688`). The
disabled-detent machinery is built for the six and **never fires on the three, including the
worst-cost card in the catalog.**

**The measured worst state per preset, colour pinned at its dearest literal** (Pass A, below; every
figure is `max(setup.used, timer.used)` from a real `cost(compile(state))` run):

| preset | colour knob | worst of 908 | free |
|--------|-------------|--------------|------|
| aurora | yes | 260 | 648 |
| pinwheel | yes | 310 | 598 |
| starfield | yes | 254 | 654 |
| radar | yes | 451 | 457 |
| joystick | yes | 544 | 364 |
| ninepads | yes | **640** | **268** |
| faders | no | 517 | 391 |
| dial | no | 707 | 201 |
| tpad | **no** | **907** | **1** |

**The ruling: TUNE-05 stays proven-unreachable — and the picker is not what keeps it that way.**

> The dearest state on any preset that *has* a colour knob is **ninepads at 640 of 908**, with the
> colour pinned at the dearest lattice literal, `255,255,255`: **268 characters free**. Pass B costs all 4,096
> colours on each of the six and **zero of its 24,576 states crosses 908**. So on today's shelf **no
> detent is ever unaffordable**, and the honest sentence is not "a colour picker where some colours
> are greyed out because they cost too many characters" but "**a colour picker that can say that, and
> that today never has to.**"

**The machinery still ships, and that is not waste.** Three reasons, in order of weight: it is what
makes the claim *checkable* rather than assumed, and the sweep records the 268-character margin as a
number so the day it stops being 268 the suite says so; the Lua route's colour knobs sit inside
hand-authored templates with far less headroom, and `lua-entries.sweep.spec.ts` only proves the
corner fits today; and the catalog grows — a thirty-seventh entry authored near the wall is exactly
the case a guard exists for. What changes is the *claim*: A-11 no longer says the picker is what
keeps TUNE-05 unreachable.

**The sweep is restructured rather than extended (G-07) — and it gets BIGGER, not smaller.**

A 4,096-option colour knob replacing a 6-option one multiplies each colour-bearing preset's
cross-product by 683: `ninepads` alone would go from 7,680 to 5,242,880 and the suite would never
finish. Instead:

1. **Pass A — the cross-product, colour pinned at its dearest literal.** Every non-colour knob is
   cross-producted exactly as today. Three presets have no colour knob and are therefore
   **unchanged**, which is why the first pass's "today's 32,852 divided by the colour knob's option
   count" was wrong arithmetic as well as a wrong shape.

   | preset | today | Pass A |
   |--------|-------|--------|
   | aurora | 1,440 | 240 |
   | pinwheel | 720 | 120 |
   | starfield | 60 | 10 |
   | radar | 2,880 | 480 |
   | joystick | 3,240 | 540 |
   | ninepads | 7,680 | 1,280 |
   | faders | 960 | **960** |
   | dial | 15,360 | **15,360** |
   | tpad | 512 | **512** |
   | **total** | **32,852** | **19,502** |

2. **Pass B — the colour dimension, linear.** All 4,096 colours costed against every other knob at
   its default index. **4,096 per colour knob, and there are six**, so **24,576**.
3. The assertion becomes: **no state in Pass A crosses 908, no state in Pass B crosses 908, and every
   colour Pass B would exclude is disabled in the picker** — today the empty set, asserted empty
   rather than assumed.

> **Total: 19,502 + 24,576 = 44,078 states, up from 32,852. +11,226, +34%.**
>
> This document's first pass said the total falls "well below" today's. It does not, and the number
> to plan against is the real one. The structure is still right, because the alternative is 683× and
> because the growth is **additive**: a tenth preset with a colour knob costs its own Pass A
> cross-product *plus* 4,096, never *times* 4,096.

Two consequences that have to be in the plan rather than discovered in CI. The file's non-vacuity
floor — `expect(costed).toBe(expected)` plus `toBeGreaterThanOrEqual(16000)` — is re-derived as the
two passes' own sum, so a silently shrunken enumeration stays red. And the file already runs past
05-VALIDATION's 60 s threshold on 32,852 states; a third more work needs its new wall-clock figure
recorded in the Wave 0 summary beside the old one, with the 600,000 ms timeout unchanged.

**The Lua route, which this document did not cost at all.** `luaKnobs` declares **45 colour knobs
across 25 of the 27 hand-authored entries**: `console`, `strip` and `forge` carry three each;
`arc`, `ghost`, `hold`, `steps`, `slam`, `gridlock`, `table`, `learn`, `stage`, `shuttle`,
`switch`, `snake`, `life` and `pomodoro` carry two; `cull` and `quadrant` carry none. Two suites are
affected and they move in opposite directions:

| Suite | Today | After | Why |
|-------|-------|-------|-----|
| `stamp-roundtrip.sweep.spec.ts`, Lua half | 276,160 vectors | **234,784** — Pass A 50,464 + Pass B 184,320 | Pure index arithmetic, no minifier. The two passes **shrink** it by 41,376, −15% |
| `stamp-roundtrip.sweep.spec.ts`, compiler half | 32,852 vectors | **44,078** | The same two passes as G-07, same figures |
| `lua-entries.sweep.spec.ts` | 701 combinations, 1,402 measurements | **1,728 combinations, 3,456 measurements** | Already linear, thanks to the separability identity. Enumerating 4,096 per colour knob would make it **184,833** combinations of `compressScript` + `measureLua` and is simply not an option |

The Lua sweep's colour dimension is sampled at **27 literals per colour knob** — the 3 × 3 × 3
combinations of a one-, two- and three-digit channel — and that sample is **length-complete**. It is
allowed to be a sample rather than an enumeration for the reason the file already states at
`:358-384`: moving one knob changes an event's length by *pure literal arithmetic*, occurrences times
the difference in literal length. Every reachable literal length (3 to 9 digits) and every
per-channel digit count in every position appears in the 27, and the all-longest corner the budget
claim rests on is one of them.

Writing this into the plan is not optional. Discovering it when the sweep times out in CI is much
worse.

**Collision 2 — the URL stamp.**

| Route | Resolution |
|-------|------------|
| **Compiler entries** (BOTOR formats `a`, `b`, `c`) | The colour field already encodes RGB444 directly, so an arbitrary colour round-trips at the codec level. What fails is step 3 of the entry-consistency check, which rebuilds by applying each knob **at its read index**. So the colour knob's `options` become the full reachable lattice and `read()` / `apply()` become **index ↔ RGB444 arithmetic** rather than array lookups. `read(apply(state, i)) === i` holds by construction |
| **Lua entries** (format `x`, knob-index) | An arbitrary colour has no index, **and format `x` physically cannot carry one**: it encodes one base-32 character per knob, and `stamp-roundtrip.sweep.spec.ts:167-172` asserts a `STAMP_OPTION_CEILING` of 32 precisely because a 33rd option would not overflow loudly, it would truncate silently and land a shared link on the wrong colour. 4,096 is 128 times the ceiling. **So a new format letter `w` is claimed**, carrying 12 raw bits of colour per colour knob beside the other knob indices. `w`, `y` and `z` were reserved for exactly this and sit outside the base-32 payload alphabet, so they are collision-proof against BOTOR |
| **Links already in the wild** | **Format `x` keeps decoding forever.** A stamp made yesterday still lands `restored`, not `unreadable`. This is the one change in the phase with a user-visible failure mode if it is got wrong, and the rule is: the old format is never removed, only stopped being emitted |
| `stamp-roundtrip.sweep.spec.ts` | The same two-pass structure as G-07, with the figures above: the compiler half goes 32,852 → 44,078 and the Lua half goes 276,160 → **234,784**. Its `toBeGreaterThan(16000)` and `toBeGreaterThan(100000)` floors are re-derived to the two passes' sums |

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
| Cost | Four more `PadCanvas` instances beside the hero and **the picker's one result pad** — six on one screen, and six on the worst entry in the catalog rather than eight, because §11.2 rules one picker per panel rather than one per colour knob. Inside the front door's seven and well inside browse's budget, and every one is `IntersectionObserver`-gated |
| Motion | **No tear.** §8.4 retires the reroll firing: the tune panel is a Product surface, and a `clip-path` on it would translate and clip its own text. The children arrive on the 160 ms opacity fade in §14 and nothing else |

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

**Two characters are added.** `−` U+2212, permitted in the forecast delta (§11.3) and nowhere else;
and `+` U+002B **with one space either side**, permitted as the separator inside the monospace
metadata block (§19.1c, added 2026-09-08 by A-39) and nowhere else. Neither is a hyphen and neither
is a dash, so “no hyphen used as a dash” is untouched.

**The site now has two `CLEAR`s, and that is deliberate rather than an oversight.** The browse
toolbar's search field has cleared itself with a `CLEAR` since 05.1 (§13.5), and the device panel
gains one here (§13.3). They never appear on the same screen — the toolbar exists only on
`/browse/`, the device control only inside a chosen panel on `/` and `/c/{id}/` — so a speech-input
user is never ambiguous, and `CLEAR FILTERS` is a third string that names its object and is
unaffected. The alternative, renaming one of them, would either put a verb the site does not use on a
search field or weaken the one word that says exactly what the device control does.

**No case exception is declared.** The headline `START EXPLORING` is set in the Micro role rather than
as a caption, but at two words it is inside §5.2's rule and needs no exemption (A-43).

**Every string below was counted by script**, not by eye. The counts are code-point counts of the
exact literal.

### 13.1 The ten retirements

Listed in §3.1 with their replacements. Nothing is deleted from a spec; every pinning assertion is
rewritten in the same commit as the string it pins.

### 13.2 The front door

| Element | Copy | n |
|---------|------|---|
| Splash wordmark · header wordmark | `HANGAR` | 6 |
| **Headline** *(replaces R-01)* | `START EXPLORING` | **15** |
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
| **Destructive confirmations** | **Two, and now that is the number.** `KEEP ON DEVICE` (caption `PERMANENT`, Phase 7's block, unchanged) and `CLEAR` (caption `REMOVES`, above). `PUT BACK` still gets none (Z-04) and neither does `FORGET THIS ZONA` (Phase 6's ruling, unchanged) | — |

### 13.4 Tuning

| Element | Copy | n |
|---------|------|---|
| Picker caption | `COLOUR` | 6 |
| Picker rail names (visually hidden) | `Red, 16 steps` · `Green, 16 steps` · `Blue, 16 steps` | 13 / 15 / 14 |
| **Picker knob selector, group label** *(only on the seventeen multi-colour entries)* | `Which colour` | **12** |
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
| Roll bar (Layer R) | 6.5 s | `linear infinite` | `transform: translateY(-130% → 520%)`. One instance for the page, inside `.crt-band` only (§8.3), `will-change: transform`, and **not mounted at all while a pad is chosen** |
| Tear (Layer T) | 180 ms | `step-end both` | Seven discrete states over `clip-path: inset()` and `transform: translateX(±1.6%..3.2%)`, **on `.crt-band::after` and on no other element**, on the connect event and on no other event (§8.4). **No `filter`, no `hue-rotate`, ever** |
| Demo path loop (§9.3) | per path | tick-locked | Replayed through `touch.ts` at one sample per contact per 10 ms tick. Never a `setInterval` |
| Forecast ghost fill | 0 ms | — | **Not animated.** A ghost that eased in would lag the pointer and read as the real value |
| Picker detent repaint | 0 ms | — | Instant. It is a value change, not a transition |
| `MIX TWO` children arriving | 160 ms | `ease-out` | Opacity only, no transform |
| Everything else | — | — | Phases 4 to 7's tables, unchanged |

### `prefers-reduced-motion: reduce` — the complete override, extended

| Thing | Full motion | Reduced |
|-------|-------------|---------|
| Pads | live simulation | still frame at tick 64; the hero still responds while a pointer is down |
| **Demo cards** | the path loops | **reset, replay the path to its end once, then freeze.** `SimHost.stillFrame()`'s second branch (`host.ts:467`) |
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
| Text contrast | Unchanged, and **still honest**, because §8.3 keeps every CRT layer off every text node. The four ratios, recomputed with `identity.spec.ts`'s own `contrastOnBlack`, and agreeing with `app.css`'s rounded comments: **`--color-ink` 9.26:1, `--color-ink-quiet` 5.57:1, `--color-ink-dim` 4.72:1, `--color-line` 3.31:1.** All three text tokens clear AA and the structural token clears the 3:1 non-text floor. `identity.spec.ts`'s computation from declared alphas remains a true statement about rendered pixels |
| Non-text contrast | Functional borders stay `--color-line` at **3.31:1**, above the 3:1 floor. The scanline is decoration whose meaning is carried nowhere, over content whose meaning is the pad's lit cells |
| Motion | Honoured completely per §14, **and asserted at the compositor level** by the two new gates, because the existing canvas-backing-store assertions cannot see a CSS overlay |
| Touch targets | 44×44 minimum on every control, including every picker rail, every lock toggle, every facet chip, `CLEAR`, `MIX TWO`, each `MIX TWO` child and each `SCREEN` option |
| Colour is never the only channel | Over budget still has six signals. A held knob has two. A disabled detent has two (absent fill, `disabled` state). CLEAR has five |

---

## 16. Component Inventory

**New, in `src/lib/ui/`:**

| Component | Responsibility | `data-testid` |
|-----------|----------------|---------------|
| `ColourPicker.svelte` | **One per panel.** Three 16-detent rails, the per-detent RGB444 fills, the cheap-step ticks, the disabled unaffordable detents, the one 9×9 result pad, and the knob selector on the seventeen entries that declare more than one colour knob | `colour-picker`, `colour-knob-select`, `colour-rail-{r\|g\|b}`, `colour-result` |
| `Clear.svelte` | The Bare-tier control, **declaring the 44px floor on both axes** (G-03), its 48px sizing-twin line cell, its three reasons, `CLEARING…` and `aria-busy` | `clear`, `clear-line` |
| `ClearConfirm.svelte` | The second confirmation block: caption, two sentences, two actions, focus in and out | `clear-confirm`, `clear-confirm-yes`, `clear-confirm-no` |
| `MixTwo.svelte` | The two parents, the four children, the take | `mix-two`, `mix-child-{0..3}` |
| `FacetRow.svelte` | One captioned facet row; a checkbox group on `/browse/`, a link row on `/` | `facet-for`, `facet-feels` |
| `ScreenToggle.svelte` | The footer's `SCREEN` word row, its persistence, its reduced-motion default | `screen-toggle` |

**New, elsewhere:**

| Module | Responsibility |
|--------|----------------|
| `src/lib/browse/facets.ts` | The sixteen terms, the two facets, the OR-within / AND-across predicate, the legacy `?tag=` map. **Imports nothing at runtime**, scanned by `facets.spec.ts` |
| `src/lib/sim/demo.ts` | The `DemoPath` type, the four authored paths and the tick-locked driver. `SimHost.stillFrame()`'s second branch stays in `host.ts`, where the method is |
| `src/lib/ui/aesthetic.spec.ts` | §8.7's **seven** source-scan gates, including the `.crt-band` / `.band` geometry equality |
| `src/lib/ui/instrument.spec.ts` | §19.1g's **five** source-scan gates for the instrument register, added 2026-09-08 by A-39. It reads `CRT_FILES` out of `aesthetic.spec.ts` as text and asserts the two registers **partition** `src/lib/ui/*.svelte` — total and disjoint, with a floor — so the register line lives in one place. **Its own walk is derived from the directory**, which is what `DEVICE_COMPONENTS` and `browseFiles()` are not |
| `e2e/aesthetic.e2e.ts` | §8.7's **four** browser gates, both projects, each with its non-vacuity assertion first |

**Modified:**

| File | Change |
|------|--------|
| `src/app.css` | The Inter `@font-face` and the one swappable Grifter block; `--font-display` added; `--font-sans` retargeted; `--font-mono` untouched; the nine colour tokens untouched; **`--crt-scanline` declared here rather than in a component** so G-01 can see it; Layer G's rule; the `--crt` gate. Its header comment is amended in the same breath so the file and `identity.spec.ts` never disagree |
| `src/lib/ui/identity.spec.ts` | G-01 |
| `src/lib/ui/PadFrame.svelte` | Layer S's `::after`, reading `--crt-scanline`; the `demo` mode. **Its header contract is amended by name**: "there is no drop-shadow, no blur, no hue-rotate, no sepia and no invert anywhere near a pad face" gains a fourth clause admitting one `pointer-events: none` pseudo-element carrying a repeating gradient and a noise tile at `opacity ≤ 0.18`, which adds no colour and only darkens. A comment that quietly stopped being true is how a header stops being read |
| `src/lib/ui/FrontDoor.svelte` | R-01's headline; `position: relative` on `.row`; the `.crt-band` shell with Layers R and T and its four duplicated geometry literals (§8.3); the `FOR` link row |
| `src/lib/ui/Coverflow.svelte` | **Nothing at all.** Not one line. Its three header rules are quoted, obeyed and now asserted in both directions by `aesthetic.spec.ts` — `.band`'s `overflow: clip` and `mask-image` and each slot's inline `opacity` and `filter: brightness()` are asserted **present**, not merely permitted (§8.2) |
| `src/lib/ui/DeviceNote.svelte` | The second cell retires; the reservation arithmetic goes 152 → 24 |
| `src/lib/ui/TryOnDevice.svelte` | `SAFE_NOTE` beneath the primary; the honesty slot 72 → 48px; two rewritten strings |
| `src/lib/ui/ChosenPanel.svelte` | The `NEXT` caption; a second hairline; `Clear` in the column; **region 4's `min-block-size: 152px` untouched** |
| `src/lib/ui/KeepOnDevice.svelte`, `PutBack.svelte` | Caps only; geometry unchanged |
| `src/lib/ui/InstallState.svelte` | The `CLEARED` block; CLEAR's details on the three reused failure states |
| `src/lib/ui/Knob.svelte`, `KnobRack.svelte` | The lock toggle; the held default marker; the forecast hooks; the `colour` kind's new selection |
| `src/lib/ui/BudgetMeter.svelte` | The ghost fill and the delta |
| `src/lib/ui/BrowseToolbar.svelte`, `TagChip.svelte`, `CatalogCard.svelte` | Two facet rows; two sorts; the count-derived chip row and the outsider-chip branch retired (there is no `MORE TAGS` to retire — `BrowseToolbar.svelte:44-52`); `disabledTags()` kept; the resting-black note retired |
| `src/lib/catalog/listing.ts` | 36 tag arrays re-cut; `addedAt` out of the projection; `RESTS_DARK_NOTE` retired |
| `src/lib/browse/sort.ts`, `filter.ts`, `query.ts` | G-08, G-09; `?for=` and `?feels=`; the legacy `?tag=` map, and the ruling that an **unmapped** legacy value becomes `?q=` rather than being dropped (§9.4); the outsider-chip branch retires with the count-derived row, `disabledTags()` stays |
| `src/lib/device/install.svelte.ts` | `InstallAction` widens to four; `cleared` joins the phases and `WRITABLE_PHASES`; the clear sequencer |
| `src/lib/device/install-copy.ts` | Nine labels, thirteen utterances, four caps, `WRITE_CLICKS` |
| `src/lib/device/session-copy.ts` | R-02, R-03, R-08 |
| `src/lib/tune/knobs.preset.ts`, `model.ts`, `view.ts`, `surprise.ts` | The lattice colour knob; locks; the forecast; `MIX TWO`'s crossover |
| `src/lib/share/stamp.ts` | Format `w` claimed; format `x` keeps decoding |
| `+layout.svelte` | The `SCREEN` toggle in the footer |
| `scripts/gen-licenses.mjs` | The Quicksand paragraph at `:165-167` rewritten; the new font-asset gate |
| `scripts/gen-og.mjs` | Runs a demo path to its end before capturing |
| `.planning/REQUIREMENTS.md` | SAFE-01's closure record and the three-clicks sentence, amended by name and dated |
| `src/lib/sim/host.ts` | Demo delivery at `:415`, the widened `active()` at `:447`, one `TouchSampler` per demo entry rather than the single host-wide one at `:188`, and `stillFrame()`'s second branch at `:467` (§9.3) |
| `docs/TESTING.md` | `:840`'s `install.spec.ts` row says "the three clicks"; it becomes four. The per-file counts for `identity.spec.ts`, `device-ui.spec.ts`, `session.spec.ts`, `install-copy.spec.ts`, `sort.spec.ts`, `filter.spec.ts` and the three sweep files move with their gates, and the two new suites join the table |

`src/vendor/` is **never edited**. `vendored-diff.spec.ts` and `upstream-manifest.json` hash it byte
for byte and would say so.

---

## 17. Wave 0 — what must exist before a component is written

- [ ] **Measure `CH_PER_LINE`** in both engines and pin it. Every reservation and cap in §12 is
      provisional until this lands.
- [ ] **Measure Layer S** on `/browse/` at thirty-six entries, both engines, with and without.
      Record the number (§8.5).
- [ ] **`src/lib/ui/aesthetic.spec.ts`** — the **seven** source scans. Without it, §8.3's scope rule is a
      sentence rather than a gate, and the silent-green contrast hole ships.
- [ ] **`e2e/aesthetic.e2e.ts`** — the **four** browser gates, each with its non-vacuity assertion
      first, `SCREEN: TEXTURED` selected before the reduced-motion read, and
      `navigator.hardwareConcurrency` forced. Without them, a sweeping bar over the pads leaves every
      existing reduced-motion assertion green, and the reduced-motion gate itself passes on an
      element that was never mounted.
- [ ] **The font-asset gate, and it now has something real to catch.** `scripts/gen-licenses.mjs`
      runs `license-checker-rseidelsohn --production` and inspects the npm tree only. It has **no
      visibility into `static/` or `src/lib/assets/`**, so a hand-committed `.woff2` sails through
      `npm run licenses`, `npm run build` and `npm run deploy` and lands in the public source
      tarball. Add a scan for `.woff` / `.woff2` / `.ttf` / `.otf` anywhere in the tracked tree
      outside `licenses/`, failing unless the path is **allowlisted with a licence record**. Under
      D-14 there is exactly one such path — `static/fonts/GRIFTER-Bold.woff2` — and its record is
      D-13's: family, licensee and licence name, not an SPDX identifier and not a redistributable
      file, plus the `scripts/deploy.mjs` archive exclusion and the note that replaces it. Every
      other font-shaped path is still a failure. Verified today, before any of this lands:
      `git ls-files` returns exactly one font-shaped path,
      `licenses/@fontsource/quicksand@5.3.0-LICENSE.txt`.
- [ ] **Restructure `reachability.sweep.spec.ts`** into the two passes of §11.4, **before** the
      picker is built, and re-derive its two non-vacuity floors to the passes' own sums. The total
      **rises** 32,852 → 44,078 (+34%); `stamp-roundtrip.sweep.spec.ts` goes 32,852 → 44,078 on the
      compiler half and 276,160 → 234,784 on the Lua half; `lua-entries.sweep.spec.ts` goes 701 →
      1,728 minifier-backed combinations on a 27-literal, length-complete colour sample.
- [ ] **Prove the font `url()` specifier** (§5.1). `src: url("@fontsource-variable/inter/files/…")` is
      a bare package specifier inside `url()`, which Vite does not document as resolvable — it may
      ship verbatim into the built stylesheet and 404 in production while `vite dev` happens to work.
      Prove **one** of the three candidates against `vite build` **and** `vite preview`, and fix the
      invalid `unicode-range: /* … */;` declaration in the same commit.
- [ ] **Record the restructured sweeps' wall-clock time.** `reachability.sweep.spec.ts` grows 32,852 →
      44,078 states (+34%) and already runs past 05-VALIDATION's 60 s threshold; the Lua half of
      `stamp-roundtrip.sweep.spec.ts` shrinks 276,160 → 234,784; `lua-entries.sweep.spec.ts` grows
      701 → 1,728 minifier-backed combinations. Put the three new figures in the wave summary beside
      the old ones (§11.4).

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
| **Grifter Bold** (`GRIFTER-Bold.woff2`, 13,752 B) | the file on this machine | **Unresolved — `PERSONAL USE` in nameID 13**, licence held by the user and being confirmed in parallel (D-14) | **Not an npm artefact, so `npm run licenses` cannot see it.** D-13's mechanism, verbatim: the file is served from the site and **excluded from `scripts/deploy.mjs`'s archive**, with a short note in its place naming the family and where to obtain it, and `scripts/gen-licenses.mjs` records **the family, the licensee and the licence name** rather than a redistributable file. The Wave 0 font-asset gate allowlists exactly this one path against exactly that record |
| `@fontsource-variable/archivo` | 5.3.0 | OFL-1.1 | **Only if the user takes the A-02 reversal** (Open item 2). Already allowlisted at `gen-licenses.mjs:41`. **No allowlist change is needed**, which is worth saying because that allowlist's own contract is that it is extended deliberately |
| `@fontsource-variable/inter` | 5.3.0 | OFL-1.1 | Same |
| `@fontsource/quicksand` | 5.3.0 | OFL-1.1 | **Uninstalled.** `gen-licenses.mjs:191-192` does `rmSync` first, so one rerun clears the stale `licenses/` file |
| `impeccable` | pin the exact version | Apache-2.0 | A **dev** tool that writes into `.claude/`, which `.gitattributes:5` marks `export-ignore`, so it never enters the source archive. D-01 requires it; pin the version, run the install as a plan task, record the file list in the summary, and confirm nothing lands in `src/` or `static/` |

**D-13's mechanism is the contract's position, and the tension inside it is stated rather than
resolved by fiat.** D-13 says plainly: serve the font from the site, exclude the binary from the
archive, leave a note in its place. That is what this document now specifies, and the Wave 0
font-asset gate is written to *allowlist* the one Grifter path rather than to fail on it.

**The unresolved half, recorded because it is the evidence for Open item 2 and not because this
document decides it.** `scripts/postbuild.mjs:82-89` runs `git archive HEAD` and publishes the result
at `/source-<sha>.tar.gz` as an unauthenticated download, so a font file in the tracked tree is
**redistributed**, not merely embedded — a different permission from the one a commercial-use grant
gives. `export-ignore` is D-13's own answer to that and it has a cost of its own: an archive that
omits a file the bundle needs is a weaker Corresponding Source than the one
`scripts/deploy.mjs:10-15` exists to enforce. **Both halves are true at once.** D-14 rules that the
font ships; A-02 argues the other way; the user holds the licence and therefore holds the decision.

---

## 19. Decisions taken without the user

Every one is a first cut. **One of them — A-02 — does contradict a `[user]` decision, and it is
labelled as what it is rather than filed here as settled: a *proposed reversal* of D-14, put to the
user in Open item 2 with its evidence intact.** The preamble said the opposite on this document's
first pass and that was not true. Every other entry supersedes at most an `[orchestrator]` note or an
approved phase's ruling, and says so where it does.

| # | Decision | Rationale |
|---|----------|-----------|
| A-01 | **The register is split by surface, not by page**, and the split is what places the CRT: brand surfaces carry it, product surfaces never do | It converts D-07's "without being overwhelming and destructive to the UX" from a caution into a structural rule that a source scan can enforce |
| A-02 | **PROPOSED REVERSAL OF D-14, not a decision taken.** D-14 [user] says Grifter ships, and it does: `--font-display` names Grifter, the one swappable `@font-face` block carries `GRIFTER-Bold.woff2`, and D-13's archive exclusion holds. A-02 is the argument for swapping it for **Archivo Variable, weight axis only (34,928 B)**. **The user rules — Open item 2** | Grifter's own binary says `PERSONAL USE` in five copies including the one Intech serves live, the foundry's shop is 404 everywhere, and `git archive HEAD` publishes HANGAR's tracked tree as an unauthenticated download, so shipping the file is *redistribution* rather than use. Archivo is the closest open face; Chakra Petch is the reflex the skill's second-order check exists to catch |
| A-03 | **At most two weights per family, and the families are two** — superseding Phase 4 W-04's "exactly two weights". Under D-14 the shipped Grifter family has no 900, so the display family ships **one** weight (700) and the roles separate by size and tracking: three weights on the site. Under the A-02 reversal Archivo is variable, 900 costs nothing, and it is four | One weight per family cannot make a poster and a paragraph out of the same ladder; and the D-14 route turns out to be the tighter of the two, which is worth saying out loud |
| A-04 | **Inter upright only. The italic file is not installed** (D-12) | The user withdrew the italic. `10-RESEARCH.md` §2.5's mitigations are moot and the document is superseded on that point |
| A-05 | **Four CRT layers, gated by one `--crt` custom property on `<html>`.** None is set on `.stage` or between `.stage` and a `.slot`; `.band`'s own `overflow: clip` and `mask-image` and each slot's inline `opacity` and `filter: brightness()` are permitted **and asserted present** by name. Layers R and T live in a new `.crt-band` shell in `FrontDoor.svelte`, a sibling of the whole Coverflow output, **bounded to `.band`'s box** so no bar sweeps the name plate or the fidelity line, and `Coverflow.svelte` is not touched | The reference's own reduced-motion bug is a direct consequence of spreading its motion across two components; one gate makes the off switch one attribute rather than a hunt |
| A-06 | **The CRT off switch is also a visible control** (`SCREEN: TEXTURED · FLAT`, footer, persisted), answering D-07-confirmed's open half **yes** | Two of the four layers do not move, so `prefers-reduced-motion` cannot reach them, and their cost is legibility rather than motion |
| A-07 | **The glitch ships without any `filter`**, carried entirely by `clip-path` and `translateX` | `paint.ts:17-35`'s four prohibitions make a `hue-rotate` over a pad a fidelity violation, not a style choice, and the site's central claim is that the pixels are the firmware's |
| A-08 | **The glitch fires on exactly one surface and one event** — `.crt-band::after`, on `navigator.serial`'s `connect`. It is a pseudo-element overlay, never the element it decorates. The reroll and the over-budget firings are **retired**, and it never fires on a failure state | A `clip-path` and a `transform` apply to every descendant, so a tear on a panel translates and clips that panel's own text and lands motion on a Product surface, which §0's own load-bearing rule forbids. At the connect moment it would have displaced `TRY ON DEVICE` under a hand already reaching for it |
| A-09 | **The pad exemption extends to the picker's detents and its result pad, and to nothing else**; HSV fields, hue rings, SV squares, CSS gradients on a rail and `<input type="color">` are forbidden **by name** | 05-UI-SPEC's "no CSS authors a colour the simulator did not" is what forbids a gradient field; naming the forbidden shapes is what stops a later reader guessing |
| A-10 | **The picker is three 16-detent rails plus a 9×9 result pad**, not a wheel or an area — and there is **one picker per panel, not one per colour knob**. The rails edit whichever colour knob a compact word-row selector names; the result pad stays single. 14 entries show no selector, 14 show two options, 3 show three | The state is a 4,096-point lattice; a continuous surface implies a resolution it does not have. And three colour knobs × three rails is nine rails and three extra canvases on `console`, `strip` and `forge`, which breaks the six-canvas budget and the amended TUNE-01 in one stroke |
| A-11 | **Unaffordable detents are `disabled` and painted in the ground — as a guard that today never fires.** TUNE-05 stays proven-unreachable, but the picker is not what keeps it so: the worst reachable state on the shelf is `tpad` at 907 of 908 and **`tpad` has no colour knob**; the dearest colour on the dearest colour-bearing preset leaves **268** characters free; zero of Pass B's 24,576 states crosses 908 | Measured, not assumed. The machinery still ships because it makes the claim checkable, because the Lua route's templates have far less headroom, and because the catalog grows — but the *claim* is now "a picker that can grey a colour out, and today never has to" |
| A-12 | **The reachability sweep is restructured into two passes**, colour costed separately — and the honest total **rises**, 32,852 → 44,078 (+34%), rather than falling | A 4,096-option knob is a 683× multiplier; the sweep would become unrunnable. Restructured, the growth is additive instead. Saying it gets smaller when it gets a third bigger is the kind of claim CI corrects at the worst possible moment |
| A-13 | **Format `w` is claimed for Lua colour; format `x` keeps decoding forever** | Links already shared must still land `restored`. This is the one change in the phase with a user-visible failure mode if it is got wrong |
| A-14 | **T2 (forecast) and T4 (`MIX TWO`) ship; T1 (locks) enables both. T3, T5 and T6 do not ship** and are named as deferred | T2 and T4 are the two the survey could not find in any product in the category; T5 is a safety risk that adds a class of click writing twice per gesture and cannot be verified without hardware |
| A-15 | **No genetics metaphor reaches the interface.** Two candidates, four results, one button labelled `MIX TWO` | The house style's plain sentences would fight "breed", "parent" and "mutate", and the copy contract should win that fight |
| A-16 | **D-09 is answered with a scripted demonstration touch, not with a changed configuration** — and it needs three real changes to `host.ts`, not zero: delivery for non-hero entries, a widened freeze test, and one `TouchSampler` per demo card instead of the single host-wide one | The four dark entries paint zero bytes at every recorded tick, so no representative motion frame exists; the alternative changes what four pads do on somebody's hardware. HANGAR supplies the finger; the firmware supplies every pixel. The rate contract is untouched; the plumbing simply did not exist |
| A-17 | **`restsBlack` is retired as a rendering input and kept as a recorded fact**; `RESTS_DARK_NOTE` is retired outright | The fact is what selects a demo path and what proves no card is accidentally black. The sentence is simply false after this phase |
| A-18 | **`e2e/browse.e2e.ts`'s reduced-motion `dark` exemption is replaced by a universal**: every card's still frame has `nonZeroBytes > 0` | The suite loses an exemption and gains a stronger claim, which is the right direction for a test to move |
| A-19 | **Sixteen terms, two facets, exactly three per entry, OR within a facet and AND across** — superseding 05.1-UI-SPEC's "combining is AND" and its count-derived chip rule | `FOR` gives every entry one term, so under a pure AND the second chip in a facet is always dead. A facet whose second click cannot work is not a facet |
| A-20 | **`MORE TAGS` was never built, so nothing retires with that name.** `BrowseToolbar.svelte:44-52` says so. What actually retires is the count-derived chip row and, with it, the **outsider chip**; `disabledTags()` stays. And an unmapped legacy `?tag=` becomes **`?q=`**, never dropped | Retiring a control that does not exist is a plan task that fails on contact. And dropping an unmapped value silently would break exactly the shared links most likely to exist, because a singleton tag is what somebody sends when they mean *this one card* |
| A-21 | **`addedAt` leaves `ListingEntry` and stays in the catalog entries** | Nothing reads it after Newest goes, and a field nobody reads drifts; keeping it on the entry costs nothing and touches no entry file |
| A-22 | **The front-door ring stays at eight and gains a `FOR` link row**, answering 10-CONTEXT open question 3 | D-03's "both paths first-class" is satisfied by making the ring the entry to browse rather than its rival: one surface, two depths, and `front-door.ts` stays import-free |
| A-23 | **D-04's sequence is a caption, DOM order and enablement** — never step numerals, never a shared background, never equal weights | SAFE-02's whole content is that the two install controls are never equal-weight, and enablement choreography already *is* the sequence |
| A-24 | **CLEAR takes a fourth tier, "Bare", distinguished by `letter-spacing: 0.28em`** and by sitting below a second hairline | It is the one channel that says "not like the others" without a colour, without a box and without an icon this phase promised not to ship; and it is grep-checkable |
| A-25 | **No `--color-over` on CLEAR.** The third colour stays at three uses | Z-01's reasoning applied to a fourth control: red would say *dangerous* where the truth is *deliberate*, and reusing the over-budget red would weaken both meanings |
| A-26 | **CLEAR writes RAM and never flash**, and its copy says so twice | D-05 asks for the page cleared, not for a permanent wipe; a flash wipe is the most destructive thing this site could do and nothing asked for it |
| A-27 | **CLEAR's confirmation exists for comprehension, not for permanence** | After a try-on the pad still does something; after a clear it does nothing, and a visitor who does not understand that will believe they broke their module |
| A-28 | **CLEAR reuses `partial`, `lost` and `nothing-landed` rather than inventing three failure states.** Fourteen phases become fifteen, not eighteen | Those three already mean "one of two landed", "the connection went" and "zero of two", which is exactly how a clear fails; the copy is selected by `lastAction`, which the store already tracks |
| A-29 | **`WRITE_CLICKS` is a named constant of length four**, replacing the word "three" in prose | The number has now changed once and will change again; a constant moves, a sentence rots |
| A-30 | **The ten retirements are the whole of D-08**, closed by a stated rule: a string goes only when the control or the pixels beside it already say the same thing, and a string naming a risk, a consequence, a way back or a next step never goes | "And others of the same kind" is an invitation to over-delete; the seven failure blocks are the thing most worth protecting from it |
| A-31 | **`SAFE_NOTE` (35) beneath the primary, in every state, unconditionally** — SAFE-01 kept whole rather than retired | It is stronger than what it replaces: today the promise is in the header note and the disclosure and absent from the panel where the click happens |
| A-32 | **The fidelity line goes from 231 to 44 characters**, keeping PREV-03's claim and retiring its apology | "What a screen cannot show" is the padding; "the firmware's own code" is the product |
| A-33 | **`CH_PER_LINE` is measured in Wave 0 and every reservation is its formula's output**, provisionally 46 | These numbers are arithmetic from a font metric, and a wrong one reflows a device panel mid-install |
| A-34 | **The 152px header note becomes 24px; the honesty slot 72px becomes 48px; `PUT BACK` stays 72px; `KEEP` stays 48px; CLEAR is a new 48px; the tuning region's 152px is untouched** | Two of the note's three collapsing strings were the two longest on the site; the rest follow from the caps |
| A-35 | **The repository's em-dash requirement beats the skill's ban**, recorded rather than silently resolved | It is a project instruction enforced by a shipped test |
| A-36 | **`PRODUCT.md` and `DESIGN.md` are not written**, and the skill's Product gate is resolved against the existing artefacts | This task creates one file, and a thinner second source of truth beside 5,115 lines of test-enforced spec would drift |

---

## 19.1 Post-approval amendments — 2026-09-08 (D-15, D-16, D-17)

**Status stays `approved`.** Nothing below re-opens a ruling the checker passed. Six new decisions
join §19's register in §19's own shape, and §3 gains a fourth sub-table (§3.4) listing them, because
a post-approval edit that is not in the amendment register is an edit nobody can audit.

The trigger is three user decisions taken mid-execution, after wave 9 closed: **D-15** (three
aesthetic references, extracted as rules), **D-16** (the register line moves to front door versus
everything else) and **D-17** (the new rules fold into the waves still ahead, plus one aesthetic pass
inserted as **10-13.1** at wave 14).

| # | Decision | Rationale |
|---|----------|-----------|
| A-37 | **The register line moves from brand-versus-product to front-door-versus-everything-else** (D-16), superseding **A-01**'s placement half. The front door keeps Layers G, S, R and T exactly as wave 4 built them, the `SCREEN` toggle and all three switches. **Browse, the panels, the tuning region and the whole device flow are the instrument register**, whose rules are §19.1's | A-01's split was authored before anything shipped and it drew the line at *brand versus product*, which put the browse grid's thirty-six pad frames on the brand side. Wave 4 then measured what that costs — **61 ms p95 on webkit-phone** — and scoped Layer S off `/browse/` for a performance reason. D-16 moves the line to where the measurement already put it and gives it a second, non-performance reason, which is strictly the stronger arrangement: two independent reasons hold one selector, so a faster engine cannot argue the selector back |
| A-38 | **Layer S's selector does not change, and that is the finding.** `:global(.front-door) .pad::after` in `PadFrame.svelte` already confines Layer S to the front door's seven frames. **D-16 changes the *reason*, not the rule.** §8.5's declared fallback applied it as a measured performance decision; §19.1 additionally makes it a **register** rule, and `e2e/aesthetic.e2e.ts` test 3 — which already asserts that the browse grid carries Layer G and nothing else — is now holding two rules with one assertion, and says so in its comment | The one thing a rule held by a single measurement cannot survive is the measurement changing. 10-04 recorded chromium at **0.00 ms** and webkit-phone at **61 ms**; a WebKit release that closes that gap would leave §8.5's fallback with no argument behind it and the browse grid would grow thirty-six scanline overlays by default. A register rule does not expire |
| A-39 | **The instrument register's rules are the six below, stated in numbers rather than adjectives** (D-15): the registration lattice (§19.1a), the pill (§19.1b), monospace metadata in `+`-separated columns (§19.1c), tabular rows without rules (§19.1d), halftone density at two pitches (§19.1e) and the index-and-em-dash headline (§19.1f) | "Technical instrument" is a description; `48px` pitch, `999px` radius, `24px` inline padding, two halftone pitches and a two-digit index are a contract. A register nobody can grep is a mood board |
| A-40 | **The registration lattice is monochrome, and the distinguished cross is distinguished by scale and by opacity — never by hue. The eight-item accent reserved list does not grow.** The lattice is `--color-line-soft` (rgb 214 255 78 / 0.2, already declared *decorative only*); the one distinguished cross is `--color-line` (0.4) at twice the arm length. **Reference A's accent cross does not ship, and this is a deliberate departure from the reference** | The list has stayed at eight through four candidates in §7.2, and a ninth entry is exactly what "restrained chrome over drenched content" (§0) exists to refuse. It is also **decided by a shipped gate rather than by taste**: `tune-ui.spec.ts` asserts the accent census over the seven tuning components is *unmoved at fourteen* (10-09-02), so an accent cross on the tuning region turns that test red on correct-looking code. Two non-colour channels — scale and opacity — are the same answer §7.2's table gave four times already, and this is its fifth row |
| A-41 | **The pill is the Secondary tier's shape and the word row's selected option, and nowhere else.** Secondary becomes a fully-rounded 1px outline with a transparent fill; the Primary's accent fill takes the same radius; **Quiet and Bare stay shapeless**. The "filled pill for the active state" is carried by controls that already own their fill — reserved-list item 3 (`TRY ON DEVICE`) and item 8 (the selected word of a knob-vocabulary row) — so **nothing joins the reserved list** | Reference C makes the pill *universal*; HANGAR's four-tier ladder is SAFE-02's mechanism and it is carried by border-versus-no-border. Pilling Quiet would give `KEEP ON DEVICE` a border and flatten it into Secondary, which is the precise regression §10.2 forbids; pilling Bare would give `CLEAR` a box, and A-24's whole argument is that its five channels are tracking, position, its own line, its confirmation and its disabled set — **not** a box. **Where D-15 and the shipped tier system collide, the tier system wins, because SAFE-02 is a requirement and a control shape is a style** |
| A-42 | **The index-and-em-dash headline is sibling furniture, not a rewritten string, and it appears on `/browse/` only.** A two-digit index and a U+2014 in their own elements, before a caption whose bytes do not change. **It never appears in the device flow**, where A-23 forbids step numerals | Every caption in this phase is pinned character-for-character by a spec, and prefixing one is a copy retirement — the audit A-30 closed at ten. Furniture beside a string costs no amendment. And on the chosen panel the regions **are** the device sequence, so an index there would read as the step numeral A-23 rules out by name; `/browse/`'s facet rows are an unordered set of filters on a surface with no sequence at all, which is the only place on the site where an index is a register mark rather than an instruction |

### §19.1a — The registration lattice

| Property | Value |
|----------|-------|
| Pitch | **48px**, the `2xl` spacing token. No new spacing value |
| Arm | **7px**, stroke **1px**. A texture metric in the 5px-scanline-period class, declared as §6 exception 6 |
| Colour | `var(--color-line-soft)` — a token, referenced, never a literal. **No new token, no new hex, no fourth hue** |
| The distinguished cross | **One per surface.** Arm **14px** (2×), `var(--color-line)` (2× the alpha), `background-repeat: no-repeat`, at one declared position. Two non-colour channels (A-40) |
| Element | A `::before` on the **instrument surface's own root** — `aria-hidden` by construction, `pointer-events: none`, `z-index` behind all content |
| Composition | Two `repeating-linear-gradient`s forming a 1px grid, **intersected by a `mask-image` pair of 7px bands at the same pitch**, so what paints is a field of plus marks rather than a field of rules. Realised in CSS with **no data-URI**, ever |
| Where it may not go | **Never on `.stage`, and never on an element between `.stage` and a `.slot`** (§8.2, unchanged and unweakened). `ChosenPanel.svelte`'s root is inside `.panel`, which `Coverflow.svelte:930` renders as a **sibling** of `.band` and outside the 3D context, so a lattice there is legal — and it is asserted rather than assumed. **`Coverflow.svelte` is not edited** |

**Why no data-URI, stated with the measurement behind it.** 10-04 declared the CRT noise tile as
`--crt-noise` at `:root` in `src/app.css`, ran `identity.spec.ts` — seven passed — then wrote
`fill='%23ff0000'`, a pure red and a fourth hue, into the same tile and ran it again: **seven passed
again.** That file's hex walk matches a literal `#`, and a percent-encoded one is not one. A lattice
authored as an SVG data-URI would be invisible to every colour gate this site has. Gradients
referencing a token are visible to all of them.

**A `mask-image` here is not a §8.2 violation and the distinction is exact.** §8.2's prohibition is
about *grouping properties on or above the 3D rendering context `.stage` establishes*. The lattice
element is a leaf pseudo-element of a surface root that is not an ancestor of any `.slot`; `.band`
itself carries a `mask-image` at `Coverflow.svelte:962-970` for the same structural reason, and §8.2
asserts that mask **present** rather than merely tolerating it.

### §19.1b — The pill

| Property | Value |
|----------|-------|
| Radius | **`999px`**. A shape, not a fourth rung on the 2 / 6 / 10px radius scale: it resolves to half the block size and therefore cannot drift. Declared as §6 exception 7 |
| Border | **1px `var(--color-line)`** — 3.31:1, above the 3:1 non-text floor, unchanged from the Secondary tier's existing border |
| Fill | **transparent**, except where the control already owns a fill (Primary's accent, the selected word) |
| Inline padding | **24px**, the `lg` token. At the 44px block floor the radius resolves to **22px per end**, so 24px clears the curve by 2px and a one-character label still sits on the flat |
| Floor | `min-block-size: 44px` **and** `min-inline-size: 44px`. Both axes, on every pill, **asserted by a directory-derived walk** (§19.1g) rather than by a hand-declared list |
| Tiers | **Secondary → pill outline. Primary → pill radius on its existing accent fill. Quiet → unchanged, borderless and shapeless. Bare (`CLEAR`) → unchanged, no border, no radius, no background** (A-41) |

§10.3's four-tier table stands verbatim; this amendment changes the **shape** of two rows and
explicitly does not touch the other two.

### §19.1c — Monospace metadata

`+`-separated, column-aligned, `--font-mono`, `font-variant-numeric: tabular-nums`,
`--color-ink-quiet`. The separator is **U+002B with one space either side**, which joins §13.0's
character list beside U+2212.

**This is `--font-mono`'s sixth named use, and the count is the rule.** Phase 5 confined it to four;
§11.3 named the forecast delta as the fifth; the metadata block is the **sixth and last in this
phase**. A use that is not on the list is a defect, and the list is asserted.

### §19.1d — Tabular rows without rules

Column alignment carries the row; **no divider, no border, no zebra, no new `--color-line` use** is
added to make a row read. Where a rule already exists it stays — the two hairlines in region 6 are
structural and A-23 depends on the second one.

**Where this collides with the shipped browse grid, the grid wins.** Reference C's dense tabular
listing is not adopted as `/browse/`'s layout: the card grid is what carries thirty-six live pad
canvases, and the pads are the product. Tabular alignment applies **inside** a card's metadata block
and to any multi-row listing, never as a replacement for the grid.

### §19.1e — Halftone density as an image-making device

Layer G's halftone ships today at a single **3px** pitch on every route. This amendment adds a
**second declared density, 6px**, behind the header and footer bands, so the page's own structure is
described by the grain rather than by a rule — which is what §19.1d asks for from the other side.

**Two pitches, not a gradient.** A continuously modulated halftone is a per-pixel image, and the
uniform one already costs **+22 ms at p95 on webkit-phone** on `/browse/` (10-04, decomposed and
deferred). Two static `background-size` values cost one extra background layer.

> **Declared fallback, in §8.5's own shape.** The second density is measured on `/browse/` in
> `chromium` and `webkit-phone` against 10-04's recorded figures — **101 ms** textured, **78 ms**
> `SCREEN: FLAT`. **If the delta exceeds 2 ms at the 95th percentile the second density does not
> ship** and the halftone stays at one pitch. That is a decision declared here rather than discovered
> in a wave summary.

**And §8.5's Layer G row is corrected while this section is open.** It reads *"Zero by construction.
Two static backgrounds and one inset shadow, rasterised once."* 10-04 measured the inset shadow at
**105 ms per scrolled frame at p95 on webkit-phone** and replaced it with a `radial-gradient` plus
`will-change: transform`. The row now describes what ships: **two static backgrounds and a gradient
vignette on a promoted layer; zero on chromium, +22 ms on webkit-phone at thirty-six animating
canvases, decomposed in 10-04 and deferred.** Recording an observation is not re-opening a ruling.

### §19.1f — The index-and-em-dash headline

`01` `—` `FOR`. Three elements: a two-digit index in the **Micro** role at `--color-ink-dim`, a real
**U+2014** in its own element, and the existing caption **byte-unchanged**. The index is Micro rather
than mono so §19.1c's count stays at six.

**On `/browse/`'s two facet rows and on nothing else in this phase** (A-42). Uppercase captions of at
most two words are unaffected: the index is not a word and the rule counts words in the string, which
does not change. This is now the **only** declared exception to §5.2's uppercase rule — A-43 retired the
headline's, so the index form stands alone, and it is declared as one.

### §19.1g — How the instrument register is held

A new source-scan gate, `src/lib/ui/instrument.spec.ts`, sits opposite `aesthetic.spec.ts` and holds
the register from the other side. **Its walk is derived from the directory, which is the whole reason
it is a second file rather than three more scans in the first.**

Three hand-declared lists gate this repository today and each one lets an omitted file through in
silence:

- `device-ui.spec.ts:63-71`'s `DEVICE_COMPONENTS` — the list the 44px both-axes walk at `:277-306`
  iterates. **Six names today.** A component omitted from it passes the walk without being read.
- `browse-ui.spec.ts:60`'s `browseFiles()` — a hand list of six component paths. A new browse
  component omitted from it escapes every browse gate.
- `aesthetic.spec.ts:239`'s `CRT_FILES` — correct for its purpose, because that file's claim is
  *only these four*.

**The register line is a CLASS, not a file list, and that is forced by what already ships.**
`PadFrame.svelte` renders on `/` and on `/browse/` both, and wave 4 already drew the line through it
with one selector: `:global(.front-door) .pad::after`. `ScreenToggle.svelte` is in `CRT_FILES`
because it *names* the CRT vocabulary, not because it *wears* the CRT, and it renders in the footer
of every route including the front door. A file-level partition would be false on both counts. So:

> **The front-door register is everything inside `.front-door` — `FrontDoor.svelte`'s own root class,
> already shipped and already load-bearing for Layer S. The instrument register is everything that is
> not.**

`instrument.spec.ts` reads `CRT_FILES` **out of `aesthetic.spec.ts` as text**, in the idiom §8.7
scan 7 already uses on `Coverflow.svelte`'s literals, and asserts the line from **both sides**: every
moving or texturing CRT layer resolves under `.front-door`, and no instrument rule is authored inside
`FrontDoor.svelte` or under a `.front-door` scope. The line then lives in exactly one place and
cannot be moved in one file and not the other — which is the lesson scan 7 exists to teach.

**Layer G is the one declared exception, and D-16 gets this half wrong.** D-16 says *“the ground and
the roll bar are already the hero shell's”*. The roll bar is — Layers R and T live in `.crt-band` in
`FrontDoor.svelte`, and `/browse/` has no `.crt-band` at all. **The ground is not.** Layer G is
`body::before` in `src/app.css` and it is on every route; 10-04 measured `/browse/` explicitly as
*“Layer G alone”*. Rather than scope it off, **Layer G stays on every route and is reclassified**: a
halftone whose density describes a page is D-15 reference B's own device (§19.1e), not a screen
effect, and it is the only one of the four layers that neither moves nor scans. The exception is
declared here with its reason so it is a ruling rather than an oversight.

**And the file-level walk is still worth having, for the other four scans.** `INSTRUMENT_FILES` is
**every `src/lib/ui/*.svelte` minus a short declared front-door-only list**, asserted against the
directory with a length — so a component added in a later phase is walked on the day it appears.
`DEVICE_COMPONENTS` and `browseFiles()` are both hand lists and both let an omitted file through in
silence; this walk does not, and that difference is the reason §19.1g is a second file rather than
five more scans in the first.

---

## Open for the user

Nothing below is assumed. Each is a real fork with the cost of each side stated.

1. **SAFE-01: retired, or satisfied in a shorter form?** Three forms with counts in §10.1.
   **Recommended: form 1**, `SAFE_NOTE` at 35 characters on the control. Forms 2 and 3 are one edit
   each. *(10-CONTEXT open question 1.)*
2. **Grifter — and this is the one fork where the contract's position and this document's
   recommendation differ.** **The contract's position is D-14 as written: Grifter ships**, behind the
   single `--font-display` token and the single swappable `@font-face` block, served from the site,
   with D-13's archive exclusion holding. **A-02 is the proposed reversal**, and its evidence is
   unchanged: the blocker is **redistribution, not use** — `scripts/postbuild.mjs:82-89` publishes
   `git archive HEAD` at a public URL, so a font file in the tracked tree is redistributed, and even
   a written commercial-use grant does not clear that; only an explicit grant to include the file in
   a publicly downloadable source archive does. D-13's `export-ignore` answers that at the cost of an
   archive that omits a file the bundle needs.

   **The recommendation, which the user is free to refuse:** send one email to
   `finn@hansonmethod.com` asking specifically about the source-archive case, ship Grifter meanwhile
   as D-14 says, and treat the swap to Archivo as the prepared fallback rather than the default. The
   swap is two lines either way, which is the entire point of D-14's one-token requirement.
   *(10-CONTEXT open question 2, D-13, D-14.)*
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
9. **TUNE-05 stays unreachable, and the measured margin is much wider than this document first
   thought** (A-11). The worst state on the shelf is `tpad` at 907 of 908 and `tpad` **has no colour
   knob**; the dearest colour-bearing preset, `ninepads`, tops out at 640 with 268 characters free;
   zero of Pass B's 24,576 colour states crosses 908. So the disabled-detent machinery ships as a
   guard that never fires today. **The fork is whether to build it at all.** Building it costs a
   `disabled` branch on a detent and one assertion; not building it means the day a thirty-seventh
   entry sits near the wall, the over-budget path becomes reachable in production for the first time
   — which the guards are built and tested for, and which would be a requirement-status change worth
   recording rather than a bug. **Recommended: build it**, precisely because the sweep then records
   the 268-character margin as a number that can move.
10. **The tag re-cut**: 55 terms and 28 chips become 16 terms and 16 chips, three per entry, OR within
    a facet. The full assignment for all thirty-six is in §9.4 and is the thing most worth a read.
11. **`RESTS_DARK_NOTE` and `restsBlack`-as-rendering-input are retired; four demo paths ship**
    (A-16). The alternative changes four configurations.
12. **The headline** `START EXPLORING` (15, A-43) replaces `You’ve got to start
    somewhere…`. It is the one piece of brand voice in this document that is entirely mine.
13. **The fidelity line at 44 characters** (A-32). It is a signed-off PREV-03 string being cut by 187
    characters.
14. **`CH_PER_LINE` is provisionally 46 and every reservation depends on it** (A-33). Wave 0 measures
    it; if it comes back materially different, five numbers and four caps move before any component
    is written.
15. **Five strings beyond the six the user named are retired** — `RECONNECT_OFFER`, `KEPT` body 2's
    first sentence, `RESTS_DARK_NOTE`, and the two honesty-slot rewrites — and the audit is **closed
    at ten** by the rule in §3.1. If more should go, the rule is the thing to change, not the list.
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

**Approval:** approved 2026-09-08 — six dimensions clear on revision 1 plus eight orchestrator corrections. Pass 1's seven blockers (the CRT layers re-derived against the real `Coverflow.svelte` DOM, the tear reduced to one surface and one event, the sweep computed rather than asserted, one picker per panel) closed in revision 1. Pass 2's two blockers (Pass A pinned at a colour that is not the dearest, and three of four contrast ratios) and its six recommendations closed by hand. Pass 3's five clerical items closed by hand, including an over-correction of my own: `aurora` and `radar` emit their colour once and therefore tie at any three-digit-per-channel literal, so only `ninepads` moved.
