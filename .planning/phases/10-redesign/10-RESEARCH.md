# Phase 10: Redesign — Research

**Researched:** 2026-09-07
**Domain:** Type licensing, CRT/glitch compositing on a canvas-heavy page, colour selection against a
quantised hardware colour space, configuration-editor interaction design, and the inventory of shipped
contracts a redesign would silently break.
**Confidence:** HIGH on the licence question, the ZONA landing treatment, the hardware colour model and
the repo checklist. MEDIUM on the CRT performance numbers (measured elsewhere, not on this machine) and
on the italic-readability claim. LOW on nothing that is presented here as fact.

---

## Summary

Three findings change the phase's shape before a single component is touched.

**Grifter cannot ship.** Not "probably not" — the font binary Intech Studio serves from its own
production site right now carries `licenseDescription = "PERSONAL USE"` in its own OpenType name table
(nameID 13), and so does every Grifter file on this machine. The foundry that published it, Hanson
Method, has taken its font business offline: `hansonmethod.com/fonts/grifterlicense`,
`hansonmethod.com/grifter` and `hansonmethod.com/fonts` all return 404 today, the last successful
Wayback capture of the Grifter page is 2020-11-11, and captures from 2023 onward are 403. There is no
current EULA to read, no vendor to buy a webfont licence from, and no counterparty to ask. HANGAR is
not intech.studio: it publishes a per-deploy `git archive HEAD` tarball of its own tracked tree from
the same origin as the bundle (`scripts/postbuild.mjs:82-89`), so a committed `.woff2` would be
*redistributed*, not merely embedded — a distinct act that "personal use" plainly does not grant and
that no reading of `fsType = 0` rescues. Three OFL-1.1 replacements are named below with what each
gives up.

**The CRT treatment is knowable exactly, because the ZONA landing's CSS is public and was read.** It is
five techniques, all cheap, none of them WebGL: a 1px/4px `repeating-linear-gradient` scanline plus an
inline `feTurbulence` SVG data-URI noise tile at `opacity: .3`, a 22%-tall translucent bar sweeping on a
6.5 s `transform` animation, an `inset` box-shadow vignette, and a `step-end` "tear" keyframe toggled by
a JS class that combines `filter`, `clip-path` and `translate`. Two of those five are unsafe beside
HANGAR's pads for structural reasons that have nothing to do with frame rate: a `filter`, a
`mix-blend-mode`, an `opacity < 1`, a `mask-image` or `contain: paint` anywhere on or above the
coverflow's 3D context forces `transform-style: flat` on its descendants and collapses the depth ladder
into a row of equal squares (`src/lib/ui/Coverflow.svelte:14-19`, quoting 04-CONTEXT D-16). And the
ZONA landing's own reduced-motion block does **not** stop its scanline sweep — HANGAR's contract is
stricter than the page it is imitating, so the treatment must be re-derived rather than ported.

**The "stylized RGB colour picker" already has a written argument against it in this repo, and the
argument is right — but it points at a specific picker rather than at none.** `quantiseColour` snaps
every stored channel to a multiple of 17, so the state holds exactly RGB444: 16 steps per channel,
**4,096 colours and no more**. `src/lib/tune/knobs.preset.ts:135-137` says "NEVER an
`<input type="color">` … a free picker would offer 4,096 steps the state cannot hold - a picker that
lies." The honest resolution is not to refuse D-06 but to build the picker *on the 4,096-colour lattice*
— every position a real, reachable, storable colour. Two harder constraints follow: an arbitrary colour
costs up to **8 more characters** in the emitted `glc(a,l,r,g,b,1)` than a curated one, against a 908
wall whose current worst measured state is 907; and the URL stamp is index-based for Lua entries
(format `x`) and consistency-checked for compiler entries, so a free colour needs either a widened
options list or a new format letter (`w`, `y`, `z` are reserved and available).

**Primary recommendation:** replace Grifter with **Archivo Variable** (OFL-1.1,
`@fontsource-variable/archivo`, 34,928 B latin `wght`), keep **Inter Italic** exactly as briefed
(OFL-1.1, `@fontsource-variable/inter`, 51,832 B latin `wght-italic`), build the CRT as three static CSS
layers plus one opt-in transform-only sweep — never a filter, never a blend mode, never above the
coverflow — and build the colour picker as a 16×16×16 RGB444 lattice with a live pad preview and a live
character-cost readout.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Tooling and type**
- **D-01 [user]** Install the `impeccable` design skill first (`npx impeccable install`) and design
  through it. It is the phase's first task, before any component is touched.
- **D-02 [user]** **Grifter** for headlines, **Inter Italic** for body text. This replaces Quicksand,
  which Phase 4 chose for its open licence — so the planner must resolve licensing and hosting for
  Grifter before it ships, and record what was found. HANGAR is GPLv3 and serves its own source; a
  font that cannot be redistributed cannot be self-hosted with it.

**Experience**
- **D-03 [user]** A visitor can pick a configuration immediately, and can also browse by niche and
  workflow. Both paths are first-class; today the front door shows eight and the catalog is a
  separate page.
- **D-04 [user]** The device flow — **TRY ON DEVICE → PUT BACK (Reset) → KEEP ON DEVICE (Storing)** —
  must read as one natural sequence rather than three controls that happen to sit together.
- **D-05 [user]** **A new CLEAR control** that clears the current page's configuration on the ZONA.
  This is a fourth device write and it is destructive in a way the other three are not: the other
  three either install something or restore something, and this one removes. It inherits every Phase
  7 safety rail — a snapshot must exist first, nothing without an explicit click, ACK before it is
  called done, `PUT BACK` still offered afterwards — and it needs its own confirmation copy and its
  own bench row.
- **D-06 [user]** Tuning should be fun and easy, and should include intelligent, out-of-the-ordinary
  ideas rather than a rack of sliders. Colour is picked from a **stylized RGB colour picker**.
- **D-07 [user]** The aesthetic moves toward the ZONA landing page: **CRT and glitch**, without
  becoming overwhelming or hurting usability.

**Copy**
- **D-08 [user]** Remove the unnecessary explanatory text. Named by the user:
  - `You've got to start somewhere…`
  - `The browser opens its own list of ports — that prompt is the browser, not HANGAR, and nothing here sees a port until you pick one.`
  - `HANGAR never writes to your ZONA on its own. Nothing reaches the module without a click.`
  - `Every pad here runs the firmware's own code, compiled exactly as it would be written to a ZONA. What a screen cannot show: the real colour of the lights, the way they bleed into each other, and how the surface feels under a finger.`
  - `Connects to your ZONA, then writes this configuration into its memory. About a second, and only in memory.`
  - `Copies this configuration, knobs and all, as a link anyone can open.`
  - and others of the same kind — the list is illustrative, not exhaustive.

### Claude's Discretion

CONTEXT.md declares no `## Claude's Discretion` section. What it declares instead is a list of seven
**tensions** the planner must resolve, and three **open questions for the user**. Treated here as the
discretion surface:

1. D-08 versus SAFE-01 — retire the requirement explicitly, or satisfy it in a shorter form.
2. Which of the character-pinned strings are removed, and what replaces the sizing twins that reserve
   space for them.
3. How the CRT treatment satisfies the reduced-motion contract.
4. Where the boundary sits between "colour the visitor is choosing" and "colour the site uses".
5. How CLEAR extends the never-writes proof without weakening it.
6. What replaces Grifter.
7. Whether the front-door ring grows, or is replaced by the new browse experience.

### Deferred Ideas (OUT OF SCOPE)

CONTEXT.md declares no `## Deferred Ideas` section. Per-phase deferral files exist
(`.planning/phases/05-tuning-budgets-and-shareable-links/deferred-items.md`,
`.planning/phases/05.1-catalog-browse/deferred-items.md`) and were **not** re-opened by this brief;
nothing in them is in scope here.
</user_constraints>

---

## Project Constraints (from CLAUDE.md)

Directives extracted from `C:\Users\sabot\Documents\Claude\hangar\CLAUDE.md` and the parent
`C:\Users\sabot\Documents\Claude\CLAUDE.md`, treated with the same authority as a locked decision:

| Directive | Source | Bearing on Phase 10 |
|---|---|---|
| Start work through a GSD command; no direct repo edits outside a GSD workflow | hangar/CLAUDE.md, "GSD Workflow Enforcement" | `npx impeccable install` (D-01) writes into `.claude/`; it is a task in a plan, not an ad-hoc shell call |
| Web Serial: detect the capability (`"serial" in navigator && isSecureContext`), never the browser | hangar/CLAUDE.md, Constraints | The redesigned device flow and the new CLEAR control keep feature detection; no browser sniff enters the new chrome |
| 908 characters for Setup and 908 for Timer, comments included | hangar/CLAUDE.md, Constraints | Binds the colour picker (§4) and every new tuning idea (§5) |
| HANGAR ships GPLv3; corresponding source served as a per-deploy archive from the site itself; repo stays private | hangar/CLAUDE.md, Constraints | The whole of §1. A font in the tracked tree is published, not merely embedded |
| Static only; Cloudflare is the established host | hangar/CLAUDE.md, Constraints | No server-side font proxy, no request-time licence gate, no CDN font |
| `@intechstudio/grid-protocol` is pinned exactly, never with a caret | hangar/CLAUDE.md, Version Compatibility | Unchanged by this phase; a bump would move the 908 ladder |
| Never a CDN for fonts — the site works offline and makes no third-party request | `src/app.css:3-8` (the shipped expression of the rule) | Any replacement face is self-hosted from `node_modules`, same as Quicksand |
| Avoid 81 DOM elements per card, one WebGL context per card, `ctx.shadowBlur` per lit cell, 81 `strokeRect` per card per frame | hangar/CLAUDE.md, "What NOT to Use" | Constrains the CRT technique survey in §3 |
| No emojis anywhere in the product | 05/07 Copywriting Contracts; `src/lib/device/install-copy.ts:44-47` | Applies to every new string this phase writes |

---

<phase_requirements>
## Phase Requirements

No requirement IDs were supplied with this task, and `.planning/REQUIREMENTS.md` contains no Phase 10
block yet — every listed ID is `[x]` and mapped to Phases 4–7. The requirements this phase must either
**extend or retire** are listed instead, because that is the decision the planner actually faces:

| ID | Description (`.planning/REQUIREMENTS.md`) | Research support |
|----|----|----|
| SAFE-01 | "Nothing is written to the module without an explicit click, **and the connect screen says so out loud**" (line 32) | §6 A. D-08 deletes the sentence that discharges the second clause. The proof half is untouched; only the *saying so* is at risk |
| SAFE-02 | TRY ON DEVICE primary, KEEP ON DEVICE visibly secondary, never equal-weight (line 33) | §6 F. D-04's "one natural sequence" must not flatten the two into peers; CLEAR is a fourth weight that has to find a tier |
| SAFE-03 / SAFE-04 | Snapshot at connect; PUT BACK one click away; snapshot persists in `localStorage` (lines 34-35) | §6 G. CLEAR must refuse to run without a snapshot, exactly as the other writes do |
| SAFE-05 | Flash confirmation names what is replaced and that it survives a power cycle (line 36) | §6 G. CLEAR needs its own confirmation copy naming what is *removed* |
| SAFE-07 | "Installed" means an ACKNOWLEDGE frame, never a resolved writer promise (line 38) | §6 G. "Cleared" means an ACK too, and needs a place in the fourteen-state machine |
| TUNE-01 | Three to six knobs over one shared widget vocabulary (line 66) | §5. Every new tuning idea either fits that vocabulary or amends TUNE-01 by name |
| TUNE-03/04/05 | Two live meters, the fit-ladder line, the over-budget state (lines 68-70) | §4. An arbitrary-colour picker is the first thing in the project's history that can plausibly make TUNE-05 *reachable* |
| SHARE-01 | Versioned base36 stamp in the hash; opening restores knobs exactly (line 76) | §4. A free colour needs a widened options list or a new stamp format letter |
| DEGR-01/02 | Everything but install works on every browser; install controls present-but-disabled with the reason inline (lines 83-84) | §6 E. CLEAR joins the disabled set on WebKit and needs the same treatment |
</phase_requirements>

---

# 1. Grifter — the blocking question

## 1.1 The answer, stated plainly

**Grifter cannot be shipped in HANGAR.** Confidence: **HIGH**.

Not because a blog post says so, but because the font's own binary says so, in three independent
copies, including the one Intech Studio is serving from production this minute.

## 1.2 Who publishes it

| Fact | Value | Source | Confidence |
|---|---|---|---|
| Foundry | Hanson Method™ Design (also "HANSON METHOD™") | nameID 8 (manufacturer) and nameID 0 (copyright) in every Grifter binary examined | HIGH |
| Designer | Finn Hanberg, Canterbury, United Kingdom | [MyFonts foundry page](https://www.myfonts.com/collections/hanson-method-foundry); business address in the archived Squarespace commerce config of hansonmethod.com | HIGH |
| Contact | `finn@hansonmethod.com` | archived site JSON-LD, [Wayback 2020-11-11](https://web.archive.org/web/20201111191329/https://hansonmethod.com/grifter) | MEDIUM (address is six years old) |
| Vendor URL in the font | `www.hansonmethod.com` | nameID 11 / nameID 12 | HIGH |
| Licence URL in the font (nameID 14) | **absent** | name-table dump | HIGH |
| Design origin | "Inspired by the adidas logo type" — the foundry's own words | [Wayback 2020-11-11](https://web.archive.org/web/20201111191329/https://hansonmethod.com/grifter) | HIGH |

## 1.3 What the licence actually says — the decisive evidence

I parsed the OpenType `name` and `OS/2` tables of every Grifter file reachable from this machine and
from the live Intech site.

| File | Where | nameID 13 (licenseDescription) | nameID 14 (licenseURL) | `OS/2.fsType` |
|---|---|---|---|---|
| `GRIFTER-Thin.ttf` | `C:\Users\sabot\Documents\Claude\zona-scramble\fonts\GRIFTER-Thin.ttf` | **`PERSONAL USE`** | absent | 0 |
| `GRIFTER-Bold.woff` | `C:\Users\sabot\Documents\Claude\gridstrument-landing\fonts\grifter\GRIFTER-Bold.woff` | **`PERSONAL USE`** | absent | 0 |
| `GRIFTER-Regular.woff` | same directory | **`PERSONAL USE`** | absent | 0 |
| `GRIFTER.woff` | same directory | **`PERSONAL USE`** | absent | 0 |
| `GRIFTER-Light.woff` | **served live** from `https://intech.studio/fonts/grifter/GRIFTER-Light.woff` (HTTP 200, 18,220 bytes, `content-type: font/woff`) | **`PERSONAL USE`** | absent | 0 |

The Bold weight matters most, because Bold is the one every "free font" aggregator distributes and the
one blog posts describe as free. Its own binary says `PERSONAL USE`.

**On `fsType = 0`.** Zero is "Installable Embedding" in the OpenType spec — the most permissive
*embedding-permission* value. It is not a licence grant. It is a bitfield the OpenType specification
itself describes as an indication of the font vendor's embedding intent, subordinate to the actual
licence agreement; it says nothing about redistribution, resale, modification or sublicensing.
When `fsType` and nameID 13 disagree, **nameID 13 is the licence statement and `fsType` is a hint to
document-embedding software.** Do not let a `0` be read as permission.
Confidence: **HIGH**.

## 1.4 What a webfont licence costs and permits

There is nothing to buy. Confidence: **HIGH**.

| URL | Status today (2026-09-07) |
|---|---|
| `https://hansonmethod.com/fonts/grifterlicense` (the URL that surfaces in search) | **404** |
| `https://www.hansonmethod.com/fonts/grifterlicense` | **404** |
| `https://hansonmethod.com/grifter` | **404** |
| `https://hansonmethod.com/fonts` | **404** |
| `https://hansonmethod.com/shop` | **404** |
| `https://www.hansonmethod.com/` | 200 — a personal portfolio (`<title>[EX14] LATERAL — a dynamic masked gallery</title>`). No fonts, no shop, no licence page |

Wayback CDX for `hansonmethod.com/grifter`: `200` at 2019-10-23, 2019-12-22, 2020-11-11; then **`403`**
at 2023-12-29 and 2024-06-29. The Wayback availability API has **no** snapshot at all for
`/fonts/grifterlicense`. The last readable statement of terms is therefore six years old.

That archived 2020 page reads, verbatim:

> "F/ Grifter™ Inspired by the adidas logo type, I decided to develop a full typeface that reflected
> this sporty, original look. 2 weights, bold and regular. Download a tester below. Commercial license -
> Recent policy changes have made it so commercial licenses are no longer needed. We do however
> encourage users to donate what they think is fair, in return for unlimited commercial use, thanks!"

**Read that carefully. It grants "unlimited commercial use". It does not grant redistribution.** Those
are different rights in every font EULA in existence, and the binary shipped alongside that page still
says `PERSONAL USE`. A 2020 sentence on a since-deleted marketing page, contradicted by the metadata in
the file it was selling, is not a licence a GPLv3 project can rely on.

**Where the sources disagree, and which wins.**

| Source | Claim | Weight |
|---|---|---|
| The font binary, nameID 13, in five files including the live production one | `PERSONAL USE` | **Authoritative.** It is the vendor's own statement, inside the vendor's own artefact, current as of today's HTTP 200 |
| [befonts.com](https://befonts.com/grifter-sans-serif-font.html) | "This demo font is for PERSONAL USE ONLY!" | Corroborating, and it agrees with the binary |
| [Pixel Surplus](https://pixelsurplus.com/freebies/grifter-bold-free-strong-sans-serif), [imjustcreative](https://imjustcreative.com/grifter-bold-free-font/2020/06/08), [Sessions College](https://www.sessions.edu/notes-on-design/free-font-friday-grifter/) | "very flexible font licence… personal and commercial" | Third-party restatements of the deleted 2020 page. None quotes an EULA. None has authority over the binary |
| Archived hansonmethod.com, 2020-11-11 | "commercial licenses are no longer needed… donate what you think is fair" | Primary but stale, contradicted by the binary, and about *use*, not *redistribution* |

**Verdict:** the licence, as far as anyone can now establish it, is personal-use with an unwritten,
unretrievable, informally-announced commercial permission and **no redistribution grant of any kind**.

## 1.5 Why "GPLv3 + self-hosted `.woff2`" is the wrong question, and what the right one is

Two separate gates, and only the second is fatal.

**Gate 1 — GPL compatibility. Not a problem, and there is precedent in this repo.**
`scripts/gen-licenses.mjs:36-42` already argues the case for Quicksand, and it is the correct argument:

> "The fonts are served as separate static `.woff2` assets and are never linked into the JavaScript
> bundle, so this is aggregation beside the GPLv3 work rather than combination with it."

A font served as a static asset beside a GPLv3 program is aggregation on a storage volume (GPLv3 §5,
final paragraph), not a combined work. A proprietary font could in principle sit beside GPLv3 code
without infecting it or being infected. **Font licensing is not the GPL's problem here.**

**Gate 2 — HANGAR redistributes its own tracked tree. This is fatal.**

```
scripts/postbuild.mjs:82-89
execSync(
  'git archive --format=tar.gz --prefix="hangar-' + SHA.slice(0, 7) +
  '/" -o "build/' + archive + '" HEAD', { cwd: ROOT, stdio: "inherit" });
```

`git archive HEAD` archives **every tracked file** except those marked `export-ignore` in
`.gitattributes` (today: `.planning/`, `.claude/`, `CLAUDE.md`, `.gitattributes`, `AGENTS.md`). That
tarball is written into `build/`, deployed with the site, and linked from the footer at
`/source-<40-char-sha>.tar.gz` — a public, unauthenticated download offered to every visitor
(`scripts/deploy.mjs:105-176` verifies its contents before shipping).

So:

- A Grifter `.woff2` committed to `static/fonts/` or `src/lib/assets/` is **published to the world as a
  downloadable font file**, not merely embedded in a page. That is redistribution, and no reading of
  "personal use" permits it.
- Serving it from `build/_app/immutable/assets/` alone (i.e. via an npm dependency, never committed)
  would avoid the tarball — but there is no npm package for Grifter, and creating one would itself be
  redistribution.
- `export-ignore` on a font path would technically remove it from the tarball, but then the tarball
  stops being Corresponding Source for the bundle it sits beside, which is the exact correspondence
  `scripts/deploy.mjs:10-15` exists to enforce. Defeating your own GPL compliance gate to smuggle a
  personal-use font is not a plan.

Confidence: **HIGH**.

## 1.6 The gate that would *not* have caught this — flag it for the planner

`scripts/gen-licenses.mjs` runs `license-checker-rseidelsohn --production` (line 85). It inspects the
**npm production dependency tree only**. It has no visibility into `static/`, `src/lib/assets/`, or any
hand-committed binary.

**A Grifter `.woff2` dropped into `static/fonts/` would sail straight through `npm run licenses`,
`npm run build` and `npm run deploy` with a green light, and land in the public source tarball.**

That is a real hole and the phase should close it. Suggested: extend `gen-licenses.mjs` (or add a spec
in the style of `src/lib/licence-notices.spec.ts`) with a scan for font-shaped files
(`.woff`, `.woff2`, `.ttf`, `.otf`) anywhere in the tracked tree outside `licenses/`, failing unless
each is registered in an explicit allowlist with an SPDX identifier. Cheap, and it converts an
invisible assumption into a red test.
Confidence: **HIGH** that the hole exists (verified: `git ls-files | grep -i 'woff\|ttf\|otf\|font'`
returns exactly one path today, `licenses/@fontsource/quicksand@5.3.0-LICENSE.txt`).

## 1.7 Three display faces that could ship

All three are on npm under the same Fontsource pattern `src/app.css:9-10` already uses, all are
**OFL-1.1** (already on the allowlist at `gen-licenses.mjs:41`), all are free, and all self-host with no
CDN. Versions and byte counts verified against `registry.npmjs.org` and `unpkg.com` on 2026-09-07.
Confidence: **HIGH** on licence, version and bytes; **MEDIUM** on the aesthetic judgements, which are
mine.

### Option A — Archivo (recommended)

| | |
|---|---|
| Foundry | Omnibus-Type (Argentina), Héctor Gatti / Omnibus-Type team |
| Licence | **SIL Open Font License 1.1** |
| Price | Free |
| npm | `@fontsource-variable/archivo@5.3.0` (published 2026-07-19), `license: "OFL-1.1"` |
| Latin `wght` woff2 | **34,928 B** (`files/archivo-latin-wght-normal.woff2`) — axis 100–900 |
| Latin `wdth`+`wght` woff2 | 90,104 B (`files/archivo-latin-wdth-normal.woff2`) — width axis 62–125 |
| URL | <https://fonts.google.com/specimen/Archivo> · <https://www.npmjs.com/package/@fontsource-variable/archivo> |

**Why it is closest.** Archivo is a grotesque drawn for high-performance display and small text, with a
genuine width axis. Grifter's whole character is *sporty wide grotesque* — set Archivo at `wdth` 110–125
and `wght` 700–900 and you land in the same neighbourhood: broad, flat-sided, confident, uppercase-first,
happy under heavy letter-spacing.

**What it gives up.** Grifter's flat-cut, slightly chamfered joints and its faintly squared bowls — the
things that make it read "technical" rather than merely "bold". Archivo is a more neutral, more
American-gothic shape. It will look *good*; it will not look *odd*, and Grifter's appeal is partly its
oddness. It also costs 90,104 B if you want the width axis, versus 34,928 B for weight alone.

### Option B — Chakra Petch

| | |
|---|---|
| Foundry | Cadson Demak (Bangkok) |
| Licence | **SIL Open Font License 1.1** |
| Price | Free |
| npm | `@fontsource/chakra-petch@5.3.0`, `license: "OFL-1.1"` |
| Latin woff2 | **9,756 B** at 400, **9,900 B** at 700 (about 19.7 KB for the pair) |
| URL | <https://fonts.google.com/specimen/Chakra+Petch> · <https://www.npmjs.com/package/@fontsource/chakra-petch> |

**Why it is on the list.** Chamfered corners, squared counters, a distinctly machined feel. It is the
closest open face to "technical display" and it is *tiny* — under a fifth of Archivo's variable weight.
It also sits well beside a CRT treatment, which is exactly this phase's aesthetic.

**What it gives up.** Static weights only (300/400/500/600/700 — no variable, no 800/900), so there is
no ultra-heavy setting and no smooth optical weight tuning. And its idiom is *cyberpunk/esports* rather
than *sportswear*; at large display sizes it reads more "gaming peripheral" than "adidas". Given
HANGAR's audience that may be a feature, but it is a different statement from the one D-02 asked for.

### Option C — Unbounded

| | |
|---|---|
| Foundry | Kyivtype (Ukraine) |
| Licence | **SIL Open Font License 1.1** |
| Price | Free |
| npm | `@fontsource-variable/unbounded@5.3.0`, `license: "OFL-1.1"` |
| Latin `wght` woff2 | **50,904 B** — axis 200–900 |
| URL | <https://fonts.google.com/specimen/Unbounded> · <https://www.npmjs.com/package/@fontsource-variable/unbounded> |

**Why it is on the list.** Unbounded is natively *wide* — the geometric, generously-set display idiom
Grifter occupies, without needing a width axis to get there. At 800–900 it has real poster weight and
holds up under the wide tracking (`--track-xl: .62em`) the ZONA landing uses.

**What it gives up.** Its width is fixed, so there is no way to compress a long headline; and its
lowercase is idiosyncratic enough that it fights body copy set in a neutral face. It is 46% larger than
Archivo's weight-only file for arguably less range.

### Also considered, and why they lost

| Face | npm | Licence | Why not |
|---|---|---|---|
| Anybody | `@fontsource-variable/anybody@5.3.0` | OFL-1.1 | 24,048 B weight-only / 56,888 B with width; a wonderful, wild width axis (Velvetyne). Rejected as *too* idiosyncratic for a page that must stay legible under a scanline overlay |
| Syne | `@fontsource-variable/syne@5.3.0` | OFL-1.1 | Extrabold is genuinely striking, but its personality is art-institution, not sportswear |
| Space Grotesk | `@fontsource-variable/space-grotesk@5.3.0` | OFL-1.1 | Right technical register, wrong weight ceiling (700) and not wide enough for impact |
| Big Shoulders Display | `@fontsource-variable/big-shoulders-display@5.3.0` | OFL-1.1 | Condensed — the opposite axis from Grifter |
| Saira | `@fontsource-variable/saira@5.3.0` | OFL-1.1 | Omnibus-Type sibling of Archivo with a width axis; a reasonable substitute for Option A, slightly softer |
| Monument Extended (Pangram Pangram) | — | Commercial | The obvious "looks like Grifter" answer, and it fails the same redistribution gate for the same reason |

### Installation, if Option A is taken

```bash
npm install @fontsource-variable/archivo@5.3.0 @fontsource-variable/inter@5.3.0
npm uninstall @fontsource/quicksand
npm run licenses   # regenerates THIRD-PARTY.md and licenses/ ; OFL-1.1 already allowlisted
```

`gen-licenses.mjs:165-167` hard-codes a Quicksand attribution paragraph into the generated header. It
**must** be rewritten in the same commit or `THIRD-PARTY.md` will credit a font the site no longer
ships. That is a one-line edit at a named line and it will not fail loudly on its own.

## 1.8 What to tell the user

The one honest sentence: *"Grifter is a personal-use font from a foundry that has closed its shop; its
own binary says so, there is no licence to buy and no one to ask, and HANGAR publishes its own source
tree — so shipping it would be redistributing a font we have no right to redistribute. Archivo gets us
90% of the look under an open licence."*

If the user has a private licence from Finn Hanberg (plausible — Intech Studio uses Grifter across its
brand), **that still does not clear the redistribution gate**, because HANGAR's source tarball is a
public download. The only version of "yes" that works is a written grant explicitly permitting the font
file to be redistributed in a publicly-downloadable source archive. That is worth exactly one email to
`finn@hansonmethod.com`, and the phase should not block on the reply.

---

# 2. Inter Italic

## 2.1 Licence

**SIL Open Font License 1.1.** Confidence: **HIGH**, from three sources that agree:

- `registry.npmjs.org/@fontsource-variable/inter` → `dist-tags.latest = 5.3.0` (published
  2026-07-19T03:50:25Z), `license: "OFL-1.1"`.
- `registry.npmjs.org/@fontsource/inter` → same version, same licence.
- Upstream: <https://rsms.me/inter/> states Inter is "distributed under the SIL Open Font License 1.1".

`OFL-1.1` is already in the allowlist at `scripts/gen-licenses.mjs:41`, with the reasoning comment at
lines 36-40. **No allowlist change is needed** — which is worth saying explicitly, because that
allowlist's own contract is that it is extended deliberately, in a commit, with a reason.

## 2.2 The self-hosting story, exactly as Quicksand does it

Today's pattern, `src/app.css:3-10`:

```css
/*
  D-24 / UI-SPEC W-01: Quicksand, self-hosted from node_modules, two weights and
  the latin subset only. Never a CDN — the site works offline, makes no
  third-party request, and asks no font-src question of a future CSP. Every
  @import must precede the rules below it or the browser drops it.
*/
@import "@fontsource/quicksand/latin-400.css";
@import "@fontsource/quicksand/latin-600.css";
```

**Inter does not offer a matching entrypoint, and this is the one real gotcha.** Quicksand's static
package exposes per-subset-per-weight CSS files (`latin-400.css` = one `@font-face`, one file).
`@fontsource-variable/inter` exposes only *axis-scoped* CSS files, each of which declares **seven**
`@font-face` rules — cyrillic-ext, cyrillic, greek-ext, greek, vietnamese, latin-ext, latin — each with
its own `unicode-range`:

```css
/* @fontsource-variable/inter@5.3.0/wght-italic.css — the last of seven rules */
@font-face {
  font-family: 'Inter Variable';
  font-style: italic;
  font-display: swap;
  font-weight: 100 900;
  src: url(./files/inter-latin-wght-italic.woff2) format('woff2-variations');
  unicode-range: U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,
                 U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,
                 U+2212,U+2215,U+FEFF,U+FFFD;
}
```

Because of `unicode-range`, a browser downloads only `latin` in practice — but the build emits **seven
hashed `.woff2` assets** instead of one, and `e2e/artifacts.e2e.ts`-class assertions about what the
build contains would see six files nobody ever fetches.

**Recommendation: write the one `@font-face` by hand and point it at the file.** The package's `exports`
map explicitly permits deep file access (verified: `"./files/*.woff2"` is an exported subpath):

```css
/* Inter Variable Italic, latin only, weight axis 100–900. One face, one file.
   Written out rather than @import-ed because @fontsource-variable ships only
   axis-scoped CSS carrying all seven subsets — six of which HANGAR never uses. */
@font-face {
  font-family: "Inter Variable";
  font-style: italic;
  font-weight: 100 900;
  font-display: swap;
  src: url("@fontsource-variable/inter/files/inter-latin-wght-italic.woff2")
       format("woff2-variations");
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA,
                 U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122,
                 U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
```

Vite resolves the bare specifier in `url()` and fingerprints the asset. Confidence: **HIGH** on the
exports map; **MEDIUM** that Vite 8 resolves a bare package specifier inside `url()` without an alias —
verify in the first wave, and fall back to a relative `../../node_modules/...` path or a
`@tailwindcss/vite`-visible alias if it does not.

## 2.3 Which weights and which italic axis

**Axis: none.** Inter's italic is a **separate variable font file**, not an `ital` or `slnt` axis inside
the roman. `@fontsource-variable/inter` ships `inter-latin-wght-italic.woff2` and
`inter-latin-wght-normal.woff2` as distinct files, and the CSS distinguishes them with
`font-style: italic` / `normal`. Confidence: **HIGH** (verified from the package's own file list and
CSS).

Inter's italic is a **true drawn italic**, not a mechanical oblique — <https://rsms.me/inter/> states
this explicitly. That matters for §2.5: a drawn italic is materially more readable at body size than a
slanted roman.

**Weights.** HANGAR uses two today (Quicksand 400 and 600). The variable italic file covers **100–900 in
one file at no extra byte cost**, so the phase gets the whole ladder for free. What it should actually
*use* is a separate question and belongs in the UI spec; the sizing twins in §6 were measured against
16px/1.5 Body, and Inter's larger x-height at the same `font-size` will change line counts (see §2.5).

**Roman: probably also needed.** D-02 says body text is italic. It does not say the wordmark, the
budget-meter numerals (`941 / 908`), the fit-ladder digits or the `--font-mono` readouts are italic. If
any roman Inter is wanted, that is `inter-latin-wght-normal.woff2` at **48,256 B** more.

## 2.4 The byte cost, measured

All figures from `unpkg.com/<pkg>@5.3.0/?meta` on 2026-09-07. Confidence: **HIGH**.

| Asset | Bytes | Note |
|---|---|---|
| **Today:** `quicksand-latin-400-normal.woff2` | 15,776 | |
| **Today:** `quicksand-latin-600-normal.woff2` | 15,864 | |
| **Today, total** | **31,640** | two files, two fixed weights |
| `inter-latin-wght-italic.woff2` (variable, 100–900) | **51,832** | one file, whole weight axis |
| `inter-latin-wght-normal.woff2` (variable, 100–900) | 48,256 | only if roman is also shipped |
| `inter-latin-standard-italic.woff2` (`wght` + `opsz`) | 79,716 | adds the optical-size axis; **not recommended** — +27,884 B for a refinement invisible at HANGAR's two or three sizes |
| `inter-latin-400-italic.woff2` (static) | 25,040 | the static alternative |
| `inter-latin-600-italic.woff2` (static) | 25,812 | |
| Static pair, 400 + 600 italic | 50,852 | 980 B *less* than the variable file, for two fixed weights instead of nine |

**Recommendation: the variable `wght-italic` file, 51,832 B.** It is 980 B *more* than a static
400+600 pair and buys the entire 100–900 axis in one request rather than two. Against Quicksand's pair
that is **+20,192 B (+64%)** for body type. Adding roman takes the total to 100,088 B, **+68,448 B
(+216%)** over today — still under 100 KB, and one-sixth of the 271,581-byte `wasmoon` glue that already
ships lazily.

Two mitigations worth writing into the spec:
- `font-display: swap` is already Fontsource's default and is the right choice here; the ground is black
  and the fallback stack is a system sans, so the flash is a weight change, not a layout jump.
- A `<link rel="preload" as="font" type="font/woff2" crossorigin>` on the italic file in `app.html` is
  worth measuring: the font is discovered late (it is referenced from a CSS file that is itself in the
  critical chain), and the front door's whole proposition is *fast*.

## 2.5 Body text set entirely in italic — what it costs, said plainly

This is unusual, and the spec should decide it with its eyes open. Confidence: **MEDIUM** on the
magnitude, **HIGH** on the direction.

**The evidence.**

- Legibility research reports **lower reading speeds and lower word-recognition rates for italic
  types**, with the open question being whether the cause is the letterforms themselves or simple
  unfamiliarity — readers almost never meet long italic passages
  ([Beier, *Typeface features and legibility research*, Vision Research 2019](https://www.sciencedirect.com/science/article/pii/S0042698919301087)).
- General guidance converges on the same advice: italics, bold and all-caps are all harder to read than
  roman and should be used *sparingly*
  ([Harvard Digital Accessibility](https://accessibility.huit.harvard.edu/typography);
  [NN/g, *Typography for Glanceable Reading*](https://www.nngroup.com/articles/glanceable-fonts/)).
- Dyson & Beier (2016) found italic is a **more subtle** emphasis signal than bold. Setting *everything*
  italic destroys that signal entirely: there is then no italic left to emphasise with. HANGAR's copy
  contracts lean on emphasis-free plain sentences, so this may cost less here than elsewhere — but it is
  a real loss and it should be a decision, not a discovery.

**What specifically gets worse, and where in this product.**

| Risk | Where it bites in HANGAR | Severity |
|---|---|---|
| Slanted stems against a horizontal scanline overlay produce visible moiré and stem-thinning | §3's CRT layer over any body text | **High** — this is the one that could actually make text unreadable, and it is unique to this phase's combination |
| Small sizes lose stroke contrast: the italic's thin diagonal joins hit sub-pixel widths first | The 12px `--font-mono` readouts, the meter numerals, `TagChip` labels | High at 12px, low at 16px |
| Long measures tire the reader | The 231-char fidelity line at `max-inline-size: 62ch` (`05.1-UI-SPEC.md:317`); the 129-char honesty-slot strings | Moderate — and D-08 deletes several of the longest offenders anyway, which cuts the exposure |
| Right-edge ragging looks looser; optical alignment of an italic against a vertical rule drifts | The 2px left rule on the over-budget message (`--color-over`, 05-UI-SPEC X-01 use 3) | Low, cosmetic |
| Lime-on-black at 0.55–0.72 alpha plus italic diagonals plus antialiasing is the worst-case legibility stack this design system can build | Every `--color-ink-quiet` caption | Moderate |

**Mitigations that let the spec keep D-02 and still be defensible.**

1. **Never below 14px in italic.** Set the three 12px readouts (`--font-mono` integers, meter numerals,
   percentage) in **roman**. They are numbers, not prose; the italic buys nothing and costs stroke
   weight exactly where there is least of it.
2. **Bump the weight one step.** Italic at `wght: 450–500` on black recovers the apparent stroke weight
   lost to the slant and to dark-mode optical thinning. The variable file makes this free.
3. **Cap the measure tighter than roman.** 62ch is a roman number; **52–56ch** is the italic equivalent
   for the same perceived line length.
4. **Loosen leading.** Italic ascenders and descenders interlock more; `line-height: 1.6` where roman
   used 1.5.
5. **Turn the scanline off over text.** Scope the CRT overlay to pad frames, hero panels and chrome —
   never to a `<p>`. See §3.6; this is the single highest-value mitigation on the list.
6. **Re-measure the sizing twins.** Inter's x-height at 16px is materially larger than Quicksand's, and
   italic changes character advance. The 152/72/48px reservations (§6 B) are *arithmetic from a
   measured line count* and every one of them must be re-derived. This is not optional polish; a wrong
   number here reflows a device panel mid-install.

---

# 3. The CRT and glitch aesthetic, without wrecking usability

## 3.1 What the ZONA landing actually does

Located and read: **<https://intech.studio/products/zona>**, stylesheet
`https://intech.studio/_app/immutable/assets/49.BP9OUv0T.css` (19,589 bytes, fetched 2026-09-07).
Everything below is quoted from that file. Confidence: **HIGH** — this is the production artefact, not a
description of it.

`zona-docs` on this machine contains no visual assets — it is prose (`ZONA_BRIEF.md`,
`ZONA_RECIPES.md`, `ZONA_SCROLL.md`) plus a build script. The visual reference is the live page.

### The palette and type

```css
.zona-page {
  --bg:#0a0a0b; --ink:#f4f4f4; --dim:#8d8d90; --faint:#55565a;
  --line:#26262a; --line-hot:#3a3b40; --frame:#6b6c70;
  --blue:#2f7fe0; --amber:#e8912a;
  --track-xl:.62em; --track-lg:.34em; --track-md:.16em; --track-sm:.1em;
  --font-display:"Grifter",ui-sans-serif,system-ui,"Segoe UI",sans-serif;
  --font-body:"Roboto",ui-sans-serif,system-ui,"Segoe UI",sans-serif;
  --noise:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'
    width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence
    type='fractalNoise' baseFrequency='0.85' numOctaves='2'
    stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25'
    filter='url(%23n)'/%3E%3C/svg%3E");
  background:var(--bg); color:var(--ink);
  font:300 clamp(12px,.95vw,14px)/1.9 var(--font-display);
  letter-spacing:var(--track-md); text-transform:uppercase;
  -webkit-font-smoothing:antialiased; overflow-x:hidden;
}
```

Three things worth naming for the redesign:

- **The body face is Roboto Light, not Inter.** Grifter is the *display* face and it is also the base
  face for the page chrome (`font: 300 … var(--font-display)` with `text-transform: uppercase`). D-02's
  Inter Italic is a HANGAR decision, not a ZONA-landing property.
- **The ground is `#0a0a0b`, not `#000000`.** A near-black. HANGAR's `--color-ground` is true black
  (`src/app.css:48`). Whether to move is a design call, but note that a scanline gradient over `#000`
  can only *darken*, so it produces less visible texture than over `#0a0a0b`.
- **Uppercase, tracked, and light weight everywhere.** `--track-xl: .62em` is enormous. That is where the
  landing's character comes from — as much as from the CRT layer.

### The CRT container — three static layers plus one moving one

```css
.zona-page .crt {
  z-index:0; display:block; position:relative; overflow:hidden;
  box-shadow: inset 0 0 clamp(30px,7vw,80px) clamp(6px,1.6vw,18px) #0000008c;
}
.zona-page .crt > img, .zona-page .crt > video { width:100%; height:auto; display:block; }

/* Layer A — scanlines + noise, ONE pseudo-element, TWO backgrounds, static */
.zona-page .crt:before {
  content:""; z-index:3; pointer-events:none;
  background: repeating-linear-gradient(180deg, #0000009e 0 1px, #0000 1px 4px),
              var(--noise);
  opacity:.3; background-size:auto, 220px 220px;
  position:absolute; inset:-1px;
}

/* Layer B — the roll bar, transform-only, 6.5s linear infinite */
.zona-page .crt:after {
  content:""; z-index:4; pointer-events:none; will-change:transform;
  background: linear-gradient(#fff0, #bed7ff12 55%, #fff0);
  height:22%; animation: 6.5s linear infinite zona-crt-roll;
  position:absolute; top:0; left:-1px; right:-1px;
}
@keyframes zona-crt-roll { 0% { transform: translateY(-130%) } to { transform: translateY(520%) } }
```

Read the numbers off it:

| Property | Value | Meaning |
|---|---|---|
| Scanline period | `0 1px` dark, `1px 4px` clear | **1 dark line every 4 CSS px** |
| Scanline colour | `#0000009e` | black at alpha 0.62 |
| Combined overlay opacity | `.3` | so the effective darkening of a scan line is **0.62 × 0.3 ≈ 0.186** |
| Noise | `feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"` on a 240×240 SVG, tiled at `background-size: 220px 220px` | Deliberate: the tile is drawn at 240 and painted at 220, so the repeat period is not a round number and the tiling seam disappears |
| Roll bar | `linear-gradient(#fff0, #bed7ff12 55%, #fff0)`, `height: 22%` | A cold-blue highlight at alpha **0.07** (`12` hex = 18/255) |
| Roll timing | `6.5s linear infinite`, `translateY(-130%) → 520%` | Travels 650% of its own height (= 143% of the container) in 6.5 s |
| Vignette | `box-shadow: inset` up to 80px spread, `#0000008c` (alpha 0.55) | On the container, not a pseudo-element. Painted once |

### The glitch — a class, not a hover

```css
.zona-page .crt.is-glitching > img,
.zona-page .crt.is-glitching > video { animation: .3s step-end both zona-crt-tear; }
.zona-page .crt.is-glitching:before  { animation: .3s step-end both zona-crt-burn; }

@keyframes zona-crt-tear {
  0%,to { filter:none; clip-path:none; transform:none }
  8%   { filter:saturate(2.4) hue-rotate(-22deg); clip-path:inset(14% 0 63%); transform:translate(-3.2%) }
  16%  { filter:none;                             clip-path:inset(55% 0 24%); transform:translate(2.6%) }
  24%  { filter:none; clip-path:none; transform:none }
  42%  { filter:contrast(1.8) brightness(1.4);    clip-path:inset(4% 0 78%);  transform:translate(1.6%) }
  50%  { filter:none; clip-path:none; transform:none }
  70%  { filter:brightness(1.9) contrast(.55) hue-rotate(160deg);
                                                  clip-path:inset(72% 0 6%);  transform:translate(-1.8%) }
  80%  { filter:none; clip-path:none; transform:none }
}
@keyframes zona-crt-burn { 0%,to{opacity:.3} 10%{opacity:.08} 30%{opacity:.62} 60%{opacity:.16} }
```

**300 ms, `step-end`, `both`.** `step-end` means no interpolation at all — the frame snaps to each
keyframe and holds. That is what makes it read as a *digital* tear rather than a smooth wobble, and it is
also what makes it cheap: seven discrete states, not 18 interpolated frames. Four bands, each a
horizontal slice via `clip-path: inset()`, each shifted ±1.6–3.2% horizontally, three of them
colour-shifted (`hue-rotate(-22deg)`, `hue-rotate(160deg)`, `contrast(1.8) brightness(1.4)`). The
`is-glitching` class is toggled by script — the trigger logic lives in a dynamically-imported chunk I
could not statically resolve, so **the cadence is unverified**. Confidence on the trigger: **LOW**.

### The touchbar variant — the same thing, quieter

```css
.zona-page .touchbar:before {
  background: repeating-linear-gradient(180deg, #0000008c 0 1px, #0000 1px 4px), var(--noise);
  opacity:.12;                        /* 0.12, vs .3 on the CRT container */
  background-size:auto, 220px 220px; border-radius:inherit; inset:0; z-index:3;
}
.zona-page .touchbar.is-glitching { animation:.18s step-end both zona-bar-flick; }
@keyframes zona-bar-flick {
  0%,to{filter:none;transform:translate(-50%)}
  18% {filter:brightness(1.12);transform:translate(calc(2px - 50%))}
  36% {filter:none;transform:translate(calc(-50% - 1px))}
  58% {filter:brightness(.88) contrast(1.1);transform:translate(-50%)}
  76% {filter:none;transform:translate(calc(1px - 50%))}
}
```

**Note the design lesson.** The same treatment appears twice at two intensities: **0.30 opacity on the
hero video, 0.12 on the interactive bar, 0.18 s flick instead of 0.30 s tear, ±1–2 px instead of
±3.2%.** The landing already knows that a UI surface takes less CRT than a picture does. That is the
whole answer to "without being overwhelming and destructive to the UX", and it comes from the reference
itself rather than from a designer's caution.

### Chromatic aberration: there is none

No `text-shadow` red/cyan offsets, no `mix-blend-mode`, no per-channel duplication. The colour shift is
carried entirely by `hue-rotate()` inside the 300 ms tear. Worth stating because "CRT feel" is often
assumed to require aberration; **this reference does not use it**, and it is the most expensive of the
common techniques.

### The reduced-motion gap — do not copy this

```css
@media (prefers-reduced-motion:reduce) {
  .zona-page .wire__pulse { opacity:.35; animation:none; top:0 }
  .zona-page .wire__head  { animation:none }
  .zona-page *            { transition-duration:.01ms !important }
}
```

**`zona-crt-roll` is not stopped. `is-glitching` is not stopped.** A visitor who asks for reduced motion
still gets a 6.5 s sweeping bar and a 300 ms tear. HANGAR's contract is materially stricter (§6 A), so
the treatment must be **re-derived under HANGAR's rules, not ported**. Confidence: **HIGH** — the
`@media` block is quoted in full above; there is no second one in the file.

## 3.2 Technique survey, with costs

Costs below are structural facts about how browsers composite, verified against MDN and the CSS specs;
the frame-rate figures are estimates and are marked as such.

| Technique | Paint cost | Compositor behaviour | Forces layout? | Survives a transform? | Clean off switch? |
|---|---|---|---|---|---|
| **`repeating-linear-gradient` scanlines, static** | One gradient rasterisation per layer, cached. Effectively free after first paint | Ordinary painted layer; no promotion needed | No | Yes — a gradient background on a transformed element re-rasterises at the new scale, correctly | **Yes** — `background-image: none` |
| **`feTurbulence` SVG data-URI as `background-image`, static** | One filter evaluation at first decode, then a cached bitmap tile | Ordinary painted layer | No | Yes | **Yes** |
| **Translucent bar animated with `transform: translateY`** | Zero repaint. The layer is composited | Promoted to its own layer (`will-change: transform` in the reference). GPU memory ≈ width × height × 4 B | No | Yes | **Yes** — `animation: none` |
| **`box-shadow: inset` vignette, static** | One shadow rasterisation, cached | Ordinary painted layer | No | Yes | **Yes** |
| **`filter:` animated (`hue-rotate`, `contrast`, `brightness`)** | Compositor-accelerated *value* change, but see the structural cost below | **Creates a stacking context AND a containing block for `position: fixed` descendants** | No | Yes, but see below | **Yes** — `filter: none` |
| **`clip-path: inset()` animated** | Compositor-accelerated on modern engines | Creates a stacking context | No | Yes | **Yes** |
| **`mix-blend-mode`** | Forces the whole stacking context to be composited together; the backdrop must be rasterised before the element can be drawn | **Creates a stacking context; isolates the group; commonly de-optimises the parent's layer** | No | Yes | Yes, but see §3.3 |
| **`backdrop-filter`** | Reads back and re-filters everything painted behind the element, **every frame it changes** | Creates a stacking context and a containing block for fixed descendants. The most expensive item on this list | No | Yes | Yes |
| **SVG filter (`filter: url(#id)`) applied live** | Runs the filter graph on the element's rasterisation. `feTurbulence` evaluated live is genuinely expensive | Creates a stacking context; usually not GPU-accelerated in the same way as shorthand filters | No | Yes | Yes |
| **Canvas post-processing (read pixels, filter, write back)** | `getImageData` + JS loop + `putImageData` per frame per canvas. At 81 px per pad, trivial; at full-viewport, ruinous | Main thread. Competes directly with the 100 Hz sim | No | N/A | Yes |
| **WebGL shader, one context per surface** | Cheapest per pixel, most expensive per context | **Chrome caps live contexts at ~16 per tab (8 on Android); Firefox 8 per principal.** Exceeding it fires `webglcontextlost` on the least-recently-used context | No | Yes | Yes |

**The structural cost that matters most here**, and it is not a frame-rate cost at all:

> An element becomes the containing block for `position: fixed` descendants when it has a non-`none`
> value for `filter`, `backdrop-filter`, `transform`, `perspective`, `rotate`, `scale` or `translate`;
> a `contain` value of `layout`, `paint`, `strict` or `content`; a `will-change` naming any of those; or
> `content-visibility: auto`.
> — [MDN, *Containing block*](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_display/Containing_block)

So a full-page `filter` wrapper silently breaks every `position: fixed` element under it. MDN also warns
of known cross-browser inconsistencies for `filter` specifically.

## 3.3 What is affordable beside HANGAR's pads — and what is not

### First, correct the premise

The brief says "up to four live pad canvases". The repo says otherwise, and the redesign's budget
depends on the real number:

| Surface | Concurrent live canvases | Source |
|---|---|---|
| Front door `/` (coverflow) | **up to 7** — hero plus three either side; `mounted: distance <= MAX_SLOT` with `MAX_SLOT = 3` | `src/lib/coverflow/slots.ts:16`, `:138` |
| `/browse/` | **"sixteen live pads at once"** — the spec's own phrase, written when the catalog was 16 | `.planning/phases/05.1-catalog-browse/05.1-UI-SPEC.md:317` |
| `/browse/` after Phase 9 | **up to 36** mounted; up to 4 columns × visible rows animating, gated by `IntersectionObserver` at `{ threshold: 0, rootMargin: "200px" }` | `src/lib/browse/grid.ts:23` (`MAX_COLUMNS = 4`); `src/lib/sim/host.ts:155` |
| Painter's own note | "HANGAR shows up to seven pads at once, so it is worse here" | `src/lib/sim/paint.ts:27-28` |

The scheduler: `TICK_MS = 10` (100 Hz logical), `MAX_CATCHUP_MS = 100` clamp
(`src/lib/sim/schedule.ts:21,30`), one shared `requestAnimationFrame`, paint decoupled at ~30 fps.
So the worst realistic case for a full-page effect is **`/browse/` with a 4-wide grid of animating
canvases scrolling under it**, not four cards.

### Affordable beside that

1. **Static `repeating-linear-gradient` scanlines.** Rasterised once, cached, composited. Adds no
   per-frame work. **Recommended.**
2. **Static `feTurbulence` data-URI noise tile as a `background-image`.** The filter is evaluated at
   decode time into a bitmap and never again. Reference tile: 240×240 SVG painted at 220×220. **This is
   not the same as `filter: url(#noise)`,** which re-evaluates the graph. **Recommended.**
3. **Static `box-shadow: inset` vignette.** One rasterisation. **Recommended.**
4. **One transform-only sweep bar on a promoted layer.** Zero repaint, one composited layer. GPU cost is
   one full-viewport RGBA surface (at 1920×1080 that is ~8.3 MB). **Recommended, but as one bar for the
   page, not one per card** — N promoted layers is N surfaces, and that is exactly the memory-pressure
   failure mode the sources warn about.
5. **`step-end` glitch keyframes on a discrete, user-triggered element.** Seven discrete states over
   300 ms, on one element, is a handful of composited frames. **Recommended, scoped** (see below).
6. **The existing halftone at `src/lib/ui/Splash.svelte:318-326`** — `radial-gradient(circle, rgb(214
   255 78 / 0.06) 0 0.5px, transparent 0.6px)` at `background-size: 3px 3px`. HANGAR already ships a
   static generated texture at exactly this cost class. **The CRT layer is a sibling of something that
   already exists and already passes.**

### Not affordable, or outright forbidden

1. **Any `filter`, `mix-blend-mode`, `opacity < 1`, `mask-image` or `contain: paint` on or above the
   coverflow's 3D context.** This is not a performance argument — it is a correctness one:

   > `src/lib/ui/Coverflow.svelte:14-19`
   > "Any of overflow other than visible or clip, an opacity below 1, a filter, a mask-image, a
   > mix-blend-mode or contain: paint forces transform-style flat on descendants, so a mask on the 3D
   > context would flatten the whole ladder into a row of equal squares (04-CONTEXT D-16)."

   A full-page CRT wrapper implemented with `filter` or `mix-blend-mode` **destroys the front door's
   depth ladder**. It will not error; it will just quietly render seven equal squares.

2. **Any CSS filter that adds or tints colour on a pad canvas.** Four prohibitions are already written
   into `src/lib/sim/paint.ts:17-35` and asserted by `paint.spec.ts`:
   > "No CSS filter that adds or tints colour on a pad canvas. 04-UI-SPEC 'Color': no CSS may author a
   > colour the simulator did not emit. The depth ladder's `filter: brightness()` is permitted, but it
   > goes on the slot wrapper, never on the canvas, and it only scales emitted channels toward black."

   A `hue-rotate()` tear over a pad is a **fidelity violation**, not a style choice. The product's
   central claim is that the pixels are the firmware's. Confidence: **HIGH**.

3. **`backdrop-filter` anywhere near the grid.** It reads back and re-filters the backdrop each time it
   changes. Over a grid of repainting canvases, the backdrop changes every paint.

4. **One WebGL context per card.** Chrome caps live contexts at roughly 16 per tab (8 on Android),
   Firefox at 8 per principal; exceeding it fires `webglcontextlost` on the *least recently used*
   context — i.e. the cards the visitor just scrolled to. A 36-card wall walks straight into this.
   Already documented in `CLAUDE.md`, "What NOT to Use".

5. **Canvas post-processing of a full-viewport surface.** A `getImageData`/`putImageData` pass at 1080p
   is ~8.3 M pixels per frame on the main thread, competing with a 100 Hz sim loop. The pads' own
   `putImageData` is 81 pixels; the two are not comparable.

6. **`shadowBlur` per lit cell.** Already removed upstream with a measurement:
   "a blurred rect per lit cell at 30 fps across nine canvases is measurable jank on the renderer
   thread" (`src/vendor/botor/pad-sim-host.ts:83-86`, quoted at `src/lib/sim/paint.ts:24-28`).

### The numbers I could not find, said honestly

I found **no** published benchmark for a full-page CSS scanline overlay above N animating canvases, and
I did not measure one on this machine (the task is read-only). What the sources establish is the
*mechanism*: `transform`, `opacity`, `filter` and `clip-path` are the compositor-accelerated properties
([MDN, *Animation performance and frame rate*](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Animation_performance_and_frame_rate);
[Motion, *Web Animation Performance Tier List*](https://motion.dev/magazine/web-animation-performance-tier-list));
that at 60 fps the whole frame budget is 16.7 ms; and that `will-change` promotion costs GPU memory per
layer, so ~50 promoted elements can invert the optimisation. **The static-layer recommendations above
cost zero per-frame work by construction, so they need no benchmark. The one moving layer does, and the
UI spec should require a measurement of it on `/browse/` at 36 entries rather than accept this
document's word.** Confidence in the recommendation: **HIGH**; confidence in any specific fps figure:
**LOW**, and none is offered.

## 3.4 The reduced-motion contract every technique must satisfy

What HANGAR asserts today, and where:

| Assertion | File:line |
|---|---|
| `emulateMedia({ reducedMotion: "reduce" })` **before** `goto`, because the host reads the preference in JS | `e2e/first-experience.e2e.ts:423`; `e2e/browse.e2e.ts:500`; `e2e/tuning.e2e.ts:279`; `e2e/tuning-webkit.e2e.ts:355` |
| The page really is in the branch — `matchMedia("(prefers-reduced-motion: reduce)").matches` is asserted, not assumed | `e2e/first-experience.e2e.ts:426-431`; `e2e/tuning.e2e.ts:283-286` |
| Canvas pixels are byte-identical after 400 ms of wall clock: "reduced motion holds one frame; 400ms of wall clock must not move it" | `e2e/first-experience.e2e.ts:440-443`; `e2e/tuning.e2e.ts:295-298`; `e2e/tuning-webkit.e2e.ts:367-370` |
| Stepping is instant: `getComputedStyle(el).transitionDuration === "0s"` | `e2e/first-experience.e2e.ts:452-456` |
| Run in both engines | `playwright.config.ts:54-59` — `chromium` and `webkit-phone` (iPhone 15, `grep: /@webkit/`) |
| The host's own carve-out: a pad animates under reduced motion **only** while a finger is on it | `src/lib/sim/host.ts:20-22` |
| Every animating component carries its own `@media (prefers-reduced-motion: reduce)` block | 18 components — `BrowseToolbar:613`, `BudgetMessage:192`, `BudgetMeter:254`, `ChosenPanel:241`, `CopyLink:226`, `Coverflow:1034`, `DeviceDetails:479`, `DeviceNote:259`, `DeviceSlot:504`, `FidelityLine:135`, `FrontDoor:262`, `InstallState:223`, `KeepConfirm:304`, `KeepOnDevice:215`, `Knob:596`, `PadSpinner:230`, `PutBack:237`, `Splash:297,371`, `TagChip:141`, `TuningRegion:712` |

**The gap the planner must close.** `sample()` reads canvas pixels:

```js
// e2e/browse.e2e.ts:140-148 (and the identical helper at e2e/first-experience.e2e.ts:87)
const ctx = c.getContext("2d");
return Array.from(ctx.getImageData(0, 0, 9, 9).data).join(",");
```

That is a **read of the 9×9 canvas backing store**. A CSS overlay painted *above* the canvas by the
compositor does not touch the backing store. **A sweeping scanline bar over the pads would leave every
existing reduced-motion assertion green.** The tests would lie.

**Therefore every CRT technique this phase ships needs a new, explicit assertion of its own.** Two that
work:

1. `getComputedStyle(overlay).animationName === "none"` (or `animationPlayState === "paused"`) under
   `emulateMedia({ reducedMotion: "reduce" })`, in both projects — cheap, direct, and in the same idiom
   as the existing `transitionDuration === "0s"` check.
2. A `page.screenshot({ clip })` of a region containing the overlay, sampled twice 400 ms apart and
   compared byte-for-byte — the compositor-level analogue of `sample()`. Slower and flakier; use it only
   if (1) proves insufficient.

**Design rule to write into the spec:** *every* CRT layer's motion lives in exactly one CSS custom
property or one `animation` shorthand on one element, so the reduced-motion block is a single
`animation: none` rather than a hunt. The reference does the opposite — its motion is spread across
`:before` and `:after` on two different components — and that is precisely why its own reduced-motion
block missed the scanline sweep.

## 3.5 Legibility: a scanline or noise overlay over body text

Take the reference's own numbers and do the arithmetic against HANGAR's palette. Confidence: **HIGH** on
the arithmetic, **MEDIUM** on the perceptual conclusion (contrast maths does not fully model periodic
occlusion).

**The reference's scanline**, applied over HANGAR's ground:
- Line colour `#0000009e` = black at α 0.62, inside a layer at `opacity: .3` → effective α **0.186**.
- 1 dark px in every 4 → 25% of rows attenuated.
- Over `--color-ground: #000000`, a black scanline is **invisible**. Over lime text it darkens by 18.6%.

**Contrast, computed against `src/app.css:51-56`:**

| Token | Composited over black | Stated ratio | Ratio with a 0.186-alpha black line over it | Verdict at 16px | Verdict at 12px |
|---|---|---|---|---|---|
| `--color-ink` α 0.72 | `#9ab838` | 9.3:1 | ≈ **6.3:1** | Passes AA (4.5:1) and AAA (7:1) fails | Passes AA |
| `--color-ink-quiet` α 0.55 | — | 5.6:1 | ≈ **3.9:1** | **Fails AA at 16px** | **Fails AA** |
| `--color-ink-dim` α 0.50 | — | 4.7:1 | ≈ **3.3:1** | **Fails AA** | **Fails AA** |
| `--color-line` α 0.40 | — | 3.3:1 | ≈ 2.4:1 | Fails the 3:1 non-text threshold | — |
| `--color-accent` `#d6ff4e` | — | 18.3:1 | ≈ 12.3:1 | Passes AAA | Passes AAA |

**`src/lib/ui/identity.spec.ts` computes and asserts these ratios from the alphas** (see its
`alphaOf()`/contrast loop and the header comment at lines 30-33: "it goes red … if a text token drops
below WCAG AA on the ground"). A scanline over text does not change the *declared* alpha, so the spec
would stay green while the rendered contrast fell below AA. **That is a second silent-green hole**, and
it is the same shape as the reduced-motion one.

Add the noise tile and it gets worse: `feTurbulence` at `baseFrequency 0.85` produces per-pixel
high-frequency variation, which is exactly the spatial frequency that competes with letterform stems.
At 12px, an italic's thin diagonal joins are already ~1 px; a noise field of comparable amplitude is a
direct attack on the glyph.

**The rule to write into the UI spec, in one line:**

> The CRT layer is scoped to pad frames, hero surfaces, panel chrome and the page ground. It never
> covers a text node. `pointer-events: none` on every layer, and no text-bearing element is a descendant
> of a CRT container.

Everything else follows: `--color-ink-quiet` and `--color-ink-dim` stay at their measured ratios, the
existing `identity.spec.ts` assertion stays honest, italic body text keeps its stroke weight, and the
CRT reads as *screen texture behind the interface* rather than *dirt on the words* — which is closer to
what a real CRT looked like anyway.

If a scanline over text is wanted despite all of the above, the mitigations are: raise the affected token
one rung on the ladder (`--color-ink-quiet` → `--color-ink`); drop the overlay's opacity over text
regions to ≤ 0.08; widen the period from 4px to 6px so a 16px line-height is crossed by 2.7 lines rather
than 4; and add a contrast assertion that composites the overlay rather than reading the token.

## 3.6 The recommended treatment

Four layers, one of them optional, none of them touching a pad canvas or a text node.

| Layer | Implementation | Motion | Reduced-motion | Where |
|---|---|---|---|---|
| **Ground texture** | `radial-gradient` halftone — the one already at `Splash.svelte:318-326` — promoted to a page-level `body::before` at `rgb(214 255 78 / 0.04)`, `background-size: 3px 3px` | None | N/A | Page ground |
| **Scanlines** | `repeating-linear-gradient(180deg, rgb(0 0 0 / 0.5) 0 1px, transparent 1px 5px)` at layer opacity 0.18-0.22, 5px period | None | N/A | Pad frames + hero panel only; `pointer-events: none` |
| **Noise** | The reference's `feTurbulence` data-URI, `baseFrequency 0.85`, `numOctaves 2`, `stitchTiles="stitch"`, 240px tile painted at 220px, opacity ≤ 0.10 (the reference uses 0.12 on its interactive bar) | None | N/A | Same containers |
| **Roll bar** (optional) | One `linear-gradient` band, `height: 22%`, `transform: translateY()`, `will-change: transform`, one instance for the page | 6.5 s linear infinite | `animation: none` — asserted | Hero surface only |
| **Glitch** | `step-end` keyframes over `clip-path: inset()` and `transform: translateX()` — **no `filter`, no `hue-rotate`** | 180-300 ms, on discrete events only | `animation: none` — asserted | Never on a pad; see below |

**Where the glitch should fire, and where it must not.** The reference fires it on a hero video. HANGAR's
equivalents that carry meaning rather than decoration:

- **Yes:** the connect moment (a ZONA is plugged in and `navigator.serial`'s `connect` event fires) — a
  one-shot 180 ms flick on the device panel chrome. Real hardware caused it; the glitch *means* something.
- **Yes:** `SURPRISE ME` — a 180 ms flick on the tune panel border while the knobs re-roll.
- **Yes:** the over-budget transition — one flick as the meter turns; it reinforces the six existing
  non-colour signals (05-UI-SPEC, "Colour is never the only channel").
- **No:** on any state that reports a *failure*. Seven install failure blocks exist
  (`install-copy.spec.ts:403`); a glitch on a failure reads as "the site is broken", not "the write
  failed", and that is the opposite of what Phase 7's copy contract achieves.
- **No:** on the pad. Fidelity (§3.3, item 2).
- **No:** on any recurring idle timer. A page that tears every 8 s by itself is the "overwhelming"
  D-07 rules out, and it fights the 30 fps paint for main-thread attention forever.

---

# 4. The stylized RGB colour picker

## 4.1 What the pad can actually display

Read from `.planning/research/ZONA-CAPABILITIES.md` §2.2-2.3. Confidence: **HIGH** — that document
cites firmware line numbers re-verified at HEAD `dc7d301`.

**Three layers, and they ADD.** `grid_led_render_framebuffer_one` accumulates `mix_r += …` across all
three layers and divides by **512 once, after the loop** — not alpha, not max, not last-wins
(ZONA-CAPABILITIES.md:287-289).

**Phase → intensity → three weights:**

```
p <= 127 :  W_min = 254 - 2p    W_mid = 2p          W_max = 0
p >= 128 :  W_min = 0           W_mid = 510 - 2p    W_max = 2p - 256

out_c = clamp255( floor( SUM over layers L of
          ( min_c[L]*W_min + mid_c[L]*W_mid + max_c[L]*W_max ) / 512 ) )
```

The weights always sum to exactly 254, so there is no brightness dip at the seam
(ZONA-CAPABILITIES.md:311-323).

**The consequences a picker must not lie about:**

| Fact | Value | Source |
|---|---|---|
| One layer can never exceed **254/512 = 49.6%** of the colour you ask for | | ZONA-CAPABILITIES.md:325 |
| `glc(a,l,255,255,255)` at peak, one layer | framebuffer **126** | :330 |
| Same on layers 1 **and** 2 | **253** | :331 |
| Factory `glx(i,1,64,64,64)` at peak | **31** — about 12% | :329 |
| **No gamma correction anywhere** in the WS2812 path. "Ramp phase linearly and it will look badly non-linear. Apply your own curve." | | :338-339 |
| **No master brightness.** Every call is per-LED-and-layer | | :340 |
| In HANGAR (T3), `glc` is the **only** colour call. `glc(a, layer, r, g, b, 1)` is the idiom, `min = c/20`, `mid = c/2`, `max = c`, and a nonzero 6th argument forces min to black | | :342-348 |
| Layer 0 (ALERT) is reserved; on ZONA the alert system touches the **32 border LEDs** only, but the mix is additive so an alert brightens whatever the UI layers show | | :272-283 |
| **The state stores RGB444.** `quantiseColour` = `Math.round(byte(v) / 17) * 17` | 16 steps/channel, **4,096 colours** | `src/vendor/botor/_pad.ts:490-493` |
| Colours are quantised to RGB444 specifically so the URL stamp round-trips | | ZONA-CAPABILITIES.md:1014 |

**So a picker that offers 16.7 M colours is a lie in three separate ways at once:** the state holds
4,096; a single layer emits at most 49.6% of what you ask; and without gamma correction the same
nominal hue reads differently at every intensity.

**What the picker must therefore be:**

1. **A 4,096-position lattice, not a continuous field.** 16 × 16 × 16. Every reachable position is a
   real, storable, round-trippable colour and every unreachable one is absent. The repo's own words:
   *"a free picker would offer 4,096 steps the state cannot hold - a picker that lies"*
   (`src/lib/tune/knobs.preset.ts:135-137`). The resolution is to build the picker **on** the 4,096, not
   to refuse the picker.
2. **The swatch shows the firmware's colour, not the CSS one.** 05-UI-SPEC "Swatches, and the boundary
   of the pad exemption" is explicit: *"No CSS in this phase authors a colour the simulator did not: no
   gradients on a swatch, no tint, no glow, no `filter` of any kind on a swatch or a pad."* A gradient
   saturation/value field is CSS authoring colour. **A lattice of discrete cells, each filled with the
   exact stored RGB, is not.** That distinction is the whole reason the lattice shape wins.
3. **The pad above the panel remains the real readout.** 05-UI-SPEC, "Readouts — the pad is the readout":
   the hero pad at `--pad-hero: clamp(260px, 52vmin, 560px)` updates on the same tick as the knob. A
   colour picker's honest preview is *the pad*, not a bigger swatch.

## 4.2 What everyone else does, and where the boundary sits

Confidence: **MEDIUM** — surveyed from vendor documentation and design references, not from hands-on use
of each product.

| Product / class | Picker shape | How it draws the "user colour vs UI colour" line |
|---|---|---|
| **Grid Editor** (Intech's own, the sibling repo) | Action-block colour inputs; a `charCount` readout at `{n}/{maxScriptLength - 1}` with a yellow warning at 2/3 and `text-error` at 98% (`src/renderer/main/panels/configuration/components/Toolbar.svelte:120-137`) | The editor chrome is neutral dark; user colour appears only inside block previews and on the module render |
| **Novation Components** (Launchpad custom modes) | A fixed palette grid of the Launchpad's own 128 velocity colours — **not** a free picker. You pick from what the hardware has | Total separation: the palette *is* the hardware's index space. This is the closest precedent to HANGAR's problem and it resolves it by refusing arbitrary colour entirely ([Novation guide](https://support.novationmusic.com/hc/en-gb/articles/360009860380-Launchpad-Components-Custom-Mode-Editor-Guide)) |
| **Elgato Stream Deck** | No colour picker in the core flow; you pick *icons*. The Marketplace sells icon packs | Sidesteps the problem: colour is content, delivered as assets |
| **Ableton Push / Live** | Fixed 60-colour clip palette, chosen from a grid | Live's own UI chrome is grey; clip colour is content and never leaks into chrome |
| **TouchOSC Editor** | Full HSV picker per widget, plus a per-document palette | Editor chrome is OS-native grey; the canvas is the user's. A hard architectural line: chrome ≠ canvas |
| **Photoshop / Figma** | HSV square + hue strip (Figma) or hue ring (classic wheel). HSV is used because the hue ring and the SV area map one-to-one onto the model's dimensions ([Mobbin glossary](https://mobbin.com/glossary/color-picker)) | Figma's chrome is monochrome by policy; every colour on screen belongs to the document |
| **VJ / lighting software** (Resolume, QLC+, GrandMA) | Colour wheels and per-fixture RGB/CMY faders, usually with a fixture-native palette | Colour is *always* the payload here, and the UI is deliberately achromatic so the payload reads true |
| **Code editors** (VS Code) | Inline swatch opens a small HSV square + alpha; the swatch renders the literal value | Theme colour vs document colour is separated by the swatch's border treatment, not by hue |

**The pattern across all of them:** every product that shows both a *chosen* colour and a *chrome* colour
solves it the same way — **the chrome is achromatic (or monochrome), so any hue on screen is by
definition the user's.** HANGAR is already there and further along than most: two tokens, black and one
acid lime.

**The four design variants** are palette, slider, wheel, and area
([Mobbin](https://mobbin.com/glossary/color-picker)). HANGAR's constraint eliminates two of them: an
*area* and a *wheel* are both continuous, gradient-rendered surfaces — they author colour in CSS, they
imply resolution the state does not have, and they are hostile to keyboard operation. **Palette and
slider survive.** A 16-step-per-channel lattice is a palette with structure.

## 4.3 The boundary, written for this repo

The existing boundary is already precise and already tested. It should be *extended by one clause*, not
rewritten:

| Rule | Where it lives today | What Phase 10 must add |
|---|---|---|
| Nine tokens, no tenth; three hexes, no fourth hue | `src/app.css:46-77`; asserted in `src/lib/ui/identity.spec.ts:64-76` | Nothing — the picker adds no token |
| Pad faces are exempt: "PadSim emits real firmware RGB, and those pixels are content rather than interface" | `src/app.css:38-41` | Nothing |
| The exemption extends to colour swatches **and to nothing else in this phase** | 05-UI-SPEC, "Swatches, and the boundary of the pad exemption" | **Extend by name** to the picker's lattice cells, in a numbered amendment, the way X-27 extended the token ladder |
| Everything *around* a swatch — hairline, selection ring, label — stays on the two-colour ladder | same | Applies verbatim to the picker: 1px `--color-line` hairlines, a 2px `--color-accent` selection ring at 2px offset, `--color-ink` labels |
| No CSS authors a colour the simulator did not: no gradients, no tint, no glow, no `filter` on a swatch or a pad | same | **This is what forbids an HSV gradient field.** Say so explicitly in the amendment so a later reader sees the reasoning rather than guessing |
| The accent reserved list — 8 items — including "the 2px selection ring around the selected swatch" | 05-UI-SPEC, "Accent — the reserved list, restated in full with two additions", item 8 | The picker's selection ring is **already covered** by item 8. No new reservation needed |

**One sentence for the UI spec:** *Inside the picker, every filled pixel is a colour the ZONA will emit;
every line, ring, label and number around it is lime on black. There is no third category.*

## 4.4 A shape that works with a pointer and a keyboard

Recommendation, from the constraints rather than from taste. Confidence: **MEDIUM** (a design proposal,
not a finding).

**Three 16-step channel rails plus a live result cell.** It is the *detent track* widget HANGAR already
ships (05-UI-SPEC, "Three widgets, twelve kinds": `n >= 9` → a 4px `--color-line-soft` track filled to
the index in `--color-accent`, with a 12px `--color-accent` thumb) — instantiated three times, one per
channel, each with exactly 16 detents.

Why it is the right answer here rather than a wheel:

- **It is already in the vocabulary.** TUNE-01 requires one shared widget vocabulary; three rails cost
  no new widget, no new keyboard model, no new focus behaviour, no new spec section.
- **The keyboard model is free.** Arrow = ±1 step (17/255), Home/End = 0/255, double-click = reset to
  default. Already specified, already tested (05-UI-SPEC, "Knob interaction contract").
- **The 44px touch floor is free.** Every rail is already built to it.
- **It is honest about 16 steps** in a way a gradient field cannot be. A detent is visibly a detent.
- **It scales to the constraint that actually matters** — see §4.5. A rail can carry a per-step
  character-cost annotation; a colour wheel cannot.

**The "stylized" part**, which is what D-06 actually asks for, is where the design energy goes: the
result cell rendered as a **9×9 miniature of the pad** running the entry's own animation at that colour,
rather than as a rectangle. That is a genuinely unusual picker, it is firmware-faithful by construction,
it costs one more `PadCanvas` instance, and it answers "what will this look like on my ZONA" instead of
"what does this hex look like on my monitor". Given §4.1 — one layer emits at most 49.6%, and there is
no gamma correction — **a flat swatch is the lie and the miniature pad is the truth.**

If a two-dimensional surface is wanted anyway, the honest form is a **16×16 lattice of discrete cells
with a 16-detent third-channel rail beside it** — 256 cells at 24px is a 384px square, which fits the
existing panel width, and every cell is filled with an exact stored RGB rather than a gradient sample.

## 4.5 The two hard constraints the picker collides with

### Constraint 1 — the 908-character wall

`glc(a, layer, r, g, b, 1)` writes `r`, `g` and `b` as decimal literals. Character cost per colour:

| Colour | Literal | Digits |
|---|---|---|
| `0,0,0` | 3 | minimum |
| `0,255,0` | 5 | a typical curated palette colour |
| `0,204,255` | 8 | today's default (`0,200,255` quantised) |
| `119,187,238` | **11** | worst case, three three-digit channels |

**Range: 3 to 11 characters per colour literal, per call site.** An entry with several `glc` calls
multiplies that. So a free picker can add **up to 8 characters per call site** relative to a
single-digit-heavy curated colour.

The current measured headroom, from `src/lib/tune/reachability.sweep.spec.ts:30-36` and
`.planning/phases/05-tuning-budgets-and-shareable-links/05-05-SUMMARY.md:19`:

> "the measured reachability finding for the SHIPPED knob tables: 32,852 states, zero over 908, worst
> **907** (tpad)"

**One character of headroom on the worst state.** A free colour on `tpad` could put it over 908 —
which would make TUNE-04 and TUNE-05 *reachable in production for the first time*. That is not
necessarily bad (the guards are built, tested and watched in a browser at `/dev/tune/`), but it must be
a decision: today the over-budget path is a proven-unreachable guard, and after this phase it may not be.

Three ways to handle it, in order of preference:
1. **Show the cost.** Annotate the picker with the live character cost of the chosen colour and the
   resulting Setup/Timer totals. This is a *feature* — see §5, idea T2 — and it turns a hazard into the
   most interesting thing on the panel.
2. **Prefer short literals.** Snap toward `0`, `17`, `85`, `170`, `255` where the difference is
   sub-perceptual. The detent rail can mark the "cheap" steps.
3. **Re-run the sweep.** `reachability.sweep.spec.ts` currently costs 32,852 states. **A 4,096-option
   colour knob replaces a 6-option one — a 683× multiplier on any entry with a colour knob.** The sweep
   would go from ~33 k states to tens of millions and become unrunnable. It must be **restructured**:
   cost the colour dimension separately (worst-case = the longest literal, `119,187,238`-class) and
   cross-product only the non-colour knobs. Write this into the plan; discovering it when the sweep
   times out in CI is much worse.

### Constraint 2 — the URL stamp

From `src/lib/share/stamp.ts:1-70`:

- **Lua entries** use format `x` — the **Lua knob-index format**. Colour is an index into
  `LuaKnob.values`. A free colour has no index. **A new format letter is required.** HANGAR has claimed
  `w`, `x`, `y`, `z` and uses only `x`; `w`, `y` and `z` are reserved and available, and they are
  collision-proof against BOTOR because they sit outside the base-32 payload alphabet.
- **Compiler entries** use BOTOR's own field-dump formats (`a`, `b`, `c`) which encode the colour field
  directly as RGB444 — **so an arbitrary colour already round-trips at the codec level.** But step 4 of
  the entry-consistency check requires `encodeStamp(rebuilt) === payload`, where `rebuilt` is produced by
  *applying every knob descriptor at its read index*. A colour outside the descriptor's `options` array
  cannot be re-read as an index, so `read()` clamps and the check fails → the link lands `unreadable`
  and shows SHARE-03's apology on a perfectly correct URL.

**So a free colour needs one of:**
- (a) The colour knob's `options` becomes all 4,096 literals, and `read()`/`apply()` become
  index↔RGB444 arithmetic rather than array lookups. Cheapest change; `read(apply(state, i)) === i`
  still holds by construction; but `options.length = 4096` breaks every widget-selection rule keyed on
  `n <= 8` / `n >= 9` and detonates the sweep (above).
- (b) A new stamp format letter carrying 12 raw bits of colour beside the other knob indices.
  Cleanest, and it is exactly what the format-letter reservation exists for. Costs a codec change plus a
  `stamp-roundtrip.sweep.spec.ts` extension.
- (c) The colour knob keeps a small curated `options` list and the picker writes **outside** the knob
  system, directly into the `PadState` colour field, with its own stamp field.
  **Rejected** — it forks the state model and breaks `SURPRISE ME`, `RESET ALL`, the default marker and
  the fit ladder, all of which are knob-index machinery.

**Recommendation: (a) for compiler entries, (b) for Lua entries**, with the sweep restructured as
described. Confidence: **HIGH** that this is the shape of the problem; **MEDIUM** on which option is
cheapest, because I did not read the whole vendored codec.

---

# 5. Tuning that is fun, and one idea nobody ships

## 5.1 What HANGAR does today

Read from `src/lib/tune/` (5,319 lines across 18 files) and
`.planning/phases/05-tuning-budgets-and-shareable-links/05-UI-SPEC.md`. Confidence: **HIGH**.

| Capability | Where |
|---|---|
| **3–6 knobs per entry, one shared vocabulary** — three widgets over twelve kinds (swatch row / word row / rail), chosen by `kind` and `n` only, never per configuration | 05-UI-SPEC:361-383; `src/lib/tune/knobs.preset.ts`, `knobs.lua.ts` |
| **Every knob is an ordered list of 2–16 discrete values and an index into it** | 05-UI-SPEC:363-368 |
| **The pad is the readout.** It sits above the panel at `--pad-hero: clamp(260px, 52vmin, 560px)` and updates on the same tick | 05-UI-SPEC:392-400 |
| **The default marker** — a 2px `--color-line-soft` dot 4px below the default option, on every widget | 05-UI-SPEC:384-390 |
| **Two live meters**, Setup and Timer, `chars / 908` with a percentage | TUNE-03; 05-UI-SPEC:535-580 |
| **The fit ladder** — trims features to stay in budget and says so in one line | TUNE-04; `src/lib/tune/ladder.spec.ts` |
| **The over-budget state** — red meter, disabled `TRY ON DEVICE` with a reason, the offending knob named, a one-click back-off | TUNE-05; 05-UI-SPEC:614-680 |
| **`SURPRISE ME`** — a fresh index for every knob, re-rolled until it fits, bounded at 12 draws / 400 ms, and a redraw that reproduces the current state is rejected without being offered to `fits` | TUNE-07; `src/lib/tune/surprise.ts:41-79` |
| **`RESET ALL`** and **double-click to reset one knob** | TUNE-06; 05-UI-SPEC:471-485 |
| **The shareable stamp** — base-32 in the hash, three landings (`restored` / `older` / `unreadable`), with a four-step entry-consistency check | SHARE-01/03; `src/lib/share/stamp.ts` |
| **`COPY LINK`** with its own confirm state and a select-and-copy fallback | SHARE-02; `src/lib/ui/CopyLink.svelte` |
| **Build-time OG image** rendered from the simulator | SHARE-04; `src/lib/og/render.ts` |
| **Proven unreachable over-budget** — 32,852 knob states costed, zero over 908, worst 907 | `src/lib/tune/reachability.sweep.spec.ts` |

That is already an unusually good tuner. The gap D-06 names is that it is a **rack**: six controls in a
row, each independent, each a list.

## 5.2 The ceiling — what other editors do, and what nobody does

Confidence: **MEDIUM** — vendor docs and product pages, not hands-on.

| Product | What it offers | Ceiling it does not cross |
|---|---|---|
| **Grid Editor** (Intech) | Action-block programming, live device sync, a character counter at `{n}/908` with a 2/3 yellow and a 98% red threshold | The counter is a *readout*. It never suggests a cheaper way to say the same thing, never shows what a change will cost before you make it, and never ladders down for you |
| **Novation Components** | Drag-and-drop widgets onto an on-screen Launchpad; save to a cloud account; send to a custom-mode slot | No simulation of what the mode *does*, no shareable link with state, no randomisation, no budget |
| **Elgato Stream Deck + Marketplace** | A large browsable library of ready-made profiles, filterable by app | No tuning at all. You take the profile or you don't |
| **Loupedeck / Razer Stream Controller** | Per-app profile switching, page stacks | Same — configuration, not exploration |
| **TouchOSC Editor** | Full layout editor with Lua scripting, live device sync over the network | Powerful and blank-page hostile. Nothing generative, nothing that proposes |
| **Bome MIDI Translator Pro** | Rule-based translators, presets, a rules engine | A power tool. No preview, no play |
| **Bitwig "The Grid"** | Modular patching with live signal display | Signal display is the strongest "see it working" idiom in the category, and it is the closest analogue to HANGAR's live pad |
| **Xfer Serum / Vital** | Randomise-with-per-parameter-lock; preset morphing | Locks are the single most-copied refinement of randomise, and **HANGAR does not have them** |
| **Elektron devices** | Parameter locks per step; a `RND` function | Per-step locks are a hardware idiom with no web equivalent in this category |
| **Sonic Charge Synplant 2** | *Genopatch*: a genetic/branching interface where you "grow" patches from a seed; branches sprout toward a target and you crack a seed open to edit its DNA ([Sound On Sound review](https://www.soundonsound.com/reviews/sonic-charge-synplant-2), [Sonic Charge](https://soniccharge.com/synplant)) | **The single best precedent for "out of the ordinary" in this category.** Nobody has ported the idea to a hardware-controller config editor |

**What nobody in the controller-editor category ships, as far as I could find:**

1. **A live cost-of-change forecast.** Every editor with a budget shows the budget *after* you spend it.
2. **Breeding two configurations.** Genetic exploration exists in synths (Synplant) and never in
   controller editors.
3. **A/B against the physical device.** Nobody alternates two candidate configs on real hardware so you
   can feel the difference under your finger.
4. **A shareable link that carries the full tuned state.** Novation has cloud accounts; Elgato has a
   marketplace; neither has a URL that *is* the configuration. HANGAR already has this and should
   realise how rare it is.

Confidence on these four negatives: **MEDIUM**. They are "I searched and did not find", not "verified
absent". Each was searched against the named products' own documentation.

## 5.3 Six concrete ideas, ranked by delight per unit of risk

Ranked best-first. Each is scoped against what exists.

---

### T1 — Knob locks on `SURPRISE ME` (the highest-value smallest change)

**What.** A small lock affordance on each knob. `SURPRISE ME` re-rolls only unlocked knobs. "I love this
colour, surprise me with everything else."

**What it takes.** `surpriseIndices(knobs, previous, fits, rng)` already takes the full knob list
(`src/lib/tune/surprise.ts:52-79`). Filter the list before the call and merge the held indices after —
roughly ten lines plus a `Set<string>` of locked ids in `state.ts`. The widget gains one 44px control;
the accessibility contract gains one `aria-pressed` toggle per knob. Locks are ephemeral (never in the
stamp), so SHARE-01 is untouched.

**What could go wrong.** With every knob locked, `SURPRISE ME` does nothing — `surpriseIndices` returns
`previous` unchanged, which is already the documented exhaustion signal, so the panel must disable the
button rather than appear broken. Locking all-but-one narrows the roll to `n` possibilities and the
"a draw that reproduces the state it replaced is rejected" rule (`surprise.ts:70-71`) can now genuinely
exhaust 12 draws on a 2-option knob — a real path, today unreachable, that needs its own test.

**Delight / risk: very high / very low.** Ships in one wave.

---

### T2 — The budget as a live forecast, not a report

**What.** Hovering or focusing any knob option shows what *that* option would cost, before it is chosen:
a ghost fill on the meter, and the delta in characters. Turning a knob shows the meter moving toward the
ghost. The 908 wall stops being a scoreboard and becomes a material you can feel.

**What it takes.** `cost()` is already pure and already runs the real minifier; the reachability sweep
costs 32,852 states in one test run, so a handful of speculative costs per hover is affordable — but not
synchronously on the main thread during a 30 fps paint. Needs a small memoised cache keyed on the index
vector, and debouncing in the same shape TUNE-02 already uses for recompiles.

**What could go wrong.** `fit()` is N+1 minifier calls at ~4.4 ms on a fitting state
(`reachability.sweep.spec.ts:20-23`); forecasting *n* options per knob is *n* × that. It must forecast
`cost()` only, never `fit()`. On a phone this could add visible latency to a knob hover, which is
exactly where HANGAR is most careful. Gate it behind pointer-hover (`@media (hover: hover)`) and
keyboard focus; never on touch.

**Delight / risk: very high / low.** This is the idea that makes the character budget *fun*, and the
budget is HANGAR's most distinctive constraint.

---

### T3 — `SURPRISE ME` becomes a shelf of five, not a die roll

**What.** One press produces **five** candidate tunings as five live 9×9 mini-pads in a row, all
animating, all in budget. Click one to take it. Press again for five more. The current button rolls once
and replaces your state — which is why nobody presses it twice.

**What it takes.** `surpriseIndices` is pure and injectable and its own header says it "can be exercised
two thousand times per entry without instantiating a thing" (`surprise.ts:5-7`). Five draws is nothing.
The cost is five more `PadCanvas` instances — and §3.3 establishes the real concurrent-canvas budget is
7 (front door) to 16+ (browse), so five more on the tune page is well inside what already ships. They
need `IntersectionObserver` gating like every other pad.

**What could go wrong.** Five animating pads beside the hero pad is six on one screen; on a phone that is
a layout problem before it is a performance one (05-UI-SPEC D-11: wrap, never scroll). The candidates
must be non-destructive — the current state stays until one is clicked — which means holding six tuner
states, and `model.ts` currently owns one.

**Delight / risk: very high / medium.**

---

### T4 — Breed two tunings *(no product in this category does this)*

**What.** Two parent tunings — yours and one from the shelf, or yours and a shared link — produce four
children, each knob taken from one parent at random, with occasional mutation. Pick a child, it becomes
a parent, breed again. Synplant's idea, applied to a hardware configuration for the first time.

**What it takes.** Genuinely small, because the state model is already index vectors. Crossover is
`child[k] = coin() ? a[k] : b[k]`; mutation is one `surpriseIndices` draw on one knob. `fits()` already
exists. Reachability arithmetic is unchanged — every child is a point in the same 32,852-state space, so
this adds **zero** new states to test. Loading a second parent is a stamp decode, which
`stamp.ts` already does for the URL.

**What could go wrong.** Crossover between two entries with different knob sets is meaningless, so it is
same-entry only, which needs saying in the UI. The genetics metaphor is easy to over-build; two parents,
four children, one mutation rate is the whole feature and it should stay that size. And "breeding" needs
a name that does not read as a gimmick — the copy contract's plain-sentence house style will fight the
metaphor, which is a good fight to have.

**Delight / risk: very high / medium.** This is the one that would get screenshotted.

---

### T5 — Audition A/B on the actual hardware *(no product in this category does this)*

**What.** With a ZONA connected, hold a key (or press and hold a control) and the module flips to the
*other* candidate for as long as you hold it, then flips back. Feel the difference under your finger,
not on a screen. Two RAM writes, no flash, both recoverable.

**What it takes.** Everything needed already exists. `TRY ON DEVICE` is a RAM-only write of about a
second (`install-copy.ts:106`), the snapshot is taken at connect before any write is possible
(SAFE-03), `PUT BACK` restores it, and the whole install path is proven against scripted faults in node
and in a browser. A/B is two `try` writes in sequence.

**What could go wrong.** This is the riskiest idea on the list and it is a *safety* risk, not a
technical one:
- **It is a write, and it must stay behind an explicit click.** A press-and-hold gesture that writes on
  `pointerdown` is defensible only if the pointerdown *is* the explicit click. A hover, a key-repeat or
  a scroll must never write. The never-writes proof (§6 D) counts writes **by class** and attributes
  every one to a named click; A/B adds a class of click that fires twice per gesture.
- **It writes about once per second while held.** SAFE-08's "about a second" is a per-write figure; a
  gesture that implies instant flipping will feel broken. The interaction must be *hold to compare, one
  write per press*, never a rapid toggle.
- It is the one idea on this list that cannot be verified without hardware, so it lands as an
  `INSTALL-RUNBOOK.md` bench row awaiting the user, like Phase 7's rows A–G.

**Delight / risk: very high / high.** Sequence it last, and only if the phase has room.

---

### T6 — The knob rack laid out on the pad itself

**What.** Instead of a rack under the pad, the knobs live *on* a 9×9 surface: each knob occupies a row
or a region of a second 9×9 grid, its options laid out as cells, its current value lit. Tuning becomes
touching a grid — the same gesture the product is about.

**What it takes.** A real design exercise, not a code one. Every knob is already "an ordered list of
2–16 values and an index", and 9 fits 2–8 options comfortably with a 9th cell for the default marker.
The 16-option MIDI-channel knob does not fit and needs the existing detent-track fallback.

**What could go wrong.** It fights the accessibility contract hard: today every knob is "a real form
control with a real label, operable by keyboard alone, with a visible focus ring" (05-UI-SPEC:443-457).
A grid of cells has to be a proper composite widget with roving tabindex, and the 44px touch floor makes
a 9×9 grid 396px minimum — which is fine on desktop and tight on the narrowest phone where
`--pad-hero` bottoms out at 260px. It may end up as a *desktop enhancement over* the rack rather than a
replacement, which halves its value.

**Delight / risk: high / high.**

---

### Ranked summary

| # | Idea | Delight | Risk | Novel? | Sequence |
|---|---|---|---|---|---|
| T1 | Knob locks on `SURPRISE ME` | Very high | Very low | No (Serum/Vital) | First wave |
| T2 | Budget as a live forecast | Very high | Low | **Yes** — no editor forecasts spend | First wave |
| T4 | Breed two tunings | Very high | Medium | **Yes** in this category (Synplant in synths) | Second wave |
| T3 | `SURPRISE ME` → a shelf of five | Very high | Medium | Partly (shelf-of-variants exists elsewhere) | Second wave |
| T6 | Knobs on the pad | High | High | **Yes** | Third wave or defer |
| T5 | Hardware A/B audition | Very high | High | **Yes** | Last, or defer to a hardware phase |

**The two that no product appears to ship: T2 and T4** (with T5 and T6 also unfound, but those are
higher-risk). **T2 is the recommendation for the phase's signature feature** — it is low-risk, it makes
HANGAR's most peculiar constraint into its most enjoyable one, and it is the honest answer to the colour
picker's character-cost problem from §4.5 at the same time.

---

# 6. What the redesign must not break

A checklist with file and line. Each row is **preserve** or **retire by name** — and "retire" means the
Phase 7 pattern: the spec is *rewritten* rather than deleted, in one commit, with the reason recorded.

## A. The reduced-motion contract — PRESERVE, and extend

| Item | File:line |
|---|---|
| The host's carve-out: a pad animates under reduced motion only while a finger is on it | `src/lib/sim/host.ts:20-22` |
| Live `prefers-reduced-motion` subscription via `matchMedia` | `src/lib/sim/host.ts:167`, `:200` |
| `stillFrame` painted **before** paint, or a reduced-motion visitor sees an unticked frame | `src/lib/sim/host.ts:272` |
| Reduced motion runs each engine to tick 64 and freezes | `e2e/first-experience.e2e.ts:428-429` |
| 18 components each carry their own `@media (prefers-reduced-motion: reduce)` block | `BrowseToolbar.svelte:613`, `BudgetMessage.svelte:192`, `BudgetMeter.svelte:254`, `ChosenPanel.svelte:241`, `CopyLink.svelte:226`, `Coverflow.svelte:1034`, `DeviceDetails.svelte:479`, `DeviceNote.svelte:259`, `DeviceSlot.svelte:504`, `FidelityLine.svelte:135`, `FrontDoor.svelte:262`, `InstallState.svelte:223`, `KeepConfirm.svelte:304`, `KeepOnDevice.svelte:215`, `Knob.svelte:596`, `PadSpinner.svelte:230`, `PutBack.svelte:237`, `Splash.svelte:297,371`, `TagChip.svelte:141`, `TuningRegion.svelte:712` |
| Both engines, both projects | `playwright.config.ts:54-59` |
| The pixel assertion: "reduced motion holds one frame; 400ms of wall clock must not move it" | `e2e/first-experience.e2e.ts:440-443`; `e2e/tuning.e2e.ts:295-298`; `e2e/tuning-webkit.e2e.ts:367-370`; `e2e/browse.e2e.ts:488` |
| The transition assertion: `transitionDuration === "0s"` | `e2e/first-experience.e2e.ts:452-456` |

**Extension required:** the pixel assertion reads the **canvas backing store**
(`e2e/browse.e2e.ts:140-148`), so a CSS overlay above the canvas is invisible to it. Every CRT layer
needs its own `animationName === "none"` (or `animationPlayState === "paused"`) assertion under
`emulateMedia`, in both projects. Without it the suite is green and the contract is broken. See §3.4.

## B. The sizing twins — RETIRE BY NAME, with the arithmetic re-derived

Each of these reserves space for a string D-08 deletes. Deleting the string collapses the reservation,
which is a layout change in every state.

| Reservation | Declared at | Reserves for | Asserted at |
|---|---|---|---|
| `min-block-size: 152px` — the tuning region | `src/lib/ui/ChosenPanel.svelte:217` (rationale `:21-30`, `:81`) | Phase 4's 96px knob rack + 56px meters | `04-UI-SPEC.md:383`; W-19 at `04-UI-SPEC.md:721`; `src/lib/ui/tune-ui.spec.ts:344` ("the one half of Phase 4's 152px that survived contact with six controls") |
| `min-block-size: 72px` — the honesty slot | `src/lib/ui/TryOnDevice.svelte:531` (rationale `:513`) | three Body lines at 43 characters; `HONESTY_CAP = 129` | `src/lib/ui/device-ui.spec.ts:772-773`; `src/lib/ui/tune-ui.spec.ts:348-349`; `src/lib/device/install-copy.ts:80-82` |
| `min-block-size: 72px` — the PUT BACK cell | `src/lib/ui/PutBack.svelte:220` | the same three lines; `PUT_BACK_CAP = 129` | `src/lib/ui/device-ui.spec.ts:642`, `:657-658` |
| `min-block-size: 48px` — the KEEP ON DEVICE cell | `src/lib/ui/KeepOnDevice.svelte:198` | two lines; `KEEP_CAP = 86` and all six disabled reasons | `src/lib/ui/device-ui.spec.ts:782`, `:797-798` |
| The three caps themselves | `src/lib/device/install-copy.ts:80-84` | "THE THREE CAPS ARE THE CONTRACT'S, NOT THIS MODULE'S TO MOVE" (`install-copy.ts:51-55`) | `src/lib/device/install-copy.spec.ts:236`, `:258-259` |

**Every one of these numbers must be re-derived, not adjusted.** They are arithmetic from *a line count
at a measured font metric*. Switching Quicksand 400/600 → Inter Variable Italic changes the character
advance and the x-height, so 43 characters no longer occupies the same width and 16px/1.5 no longer
occupies the same height. Recomputing them is a task, not a cleanup.

## C. Every named string, asserted character-for-character — RETIRE BY NAME

D-08's named strings, with their definition site, their assertion, and the length that is pinned:

| String | Defined | Pinned length | Asserted |
|---|---|---|---|
| `You've got to start somewhere…` | `src/lib/ui/FrontDoor.svelte:180` | — (literal in the component) | `src/lib/ui/*.spec.ts` copy scans |
| `The browser opens its own list of ports — …` (`PICKER_EXPLAINER`) | `src/lib/device/session-copy.ts:193-194` | **130** | `src/lib/device/session-copy.spec.ts:295-296`, `:301-302` |
| `HANGAR never writes to your ZONA on its own. …` (`SAFE_PROMISE`) | `src/lib/device/session-copy.ts:220-221` | **88** — "SAFE-01, amended and measured" | `src/lib/device/session-copy.spec.ts:298`, `:309-310`. Rendered at `DeviceDetails.svelte:305` and `DeviceNote.svelte:191` |
| `Every pad here runs the firmware's own code, …` (`FIDELITY_LINE`) | `src/lib/ui/fidelity-line.ts:28-29` | **231** — "231 characters, and they are asserted character-for-character by more than [one spec]" (`:3`) | `fidelity-line.ts` + `05.1-UI-SPEC.md:317` (`62ch`, 48px below the last grid row, "present on every load, filtered or not, empty or not (W-13)") |
| `Connects to your ZONA, then writes this configuration into its memory. About a second, and only in memory.` (`HONESTY_NO_SESSION`) | `src/lib/device/install-copy.ts:105-106` | ≤ `HONESTY_CAP` = 129 | `install-copy.spec.ts`. Note `install-copy.ts:102-104`: **"About a second" appears in the first two and nowhere else on the site (Z-08)** |
| `Copies this configuration, knobs and all, as a link anyone can open.` | `src/lib/tune/copy.ts:198` | — | `src/lib/tune/copy.spec.ts:277` |

**The `SAFE_PROMISE` row is the one with a requirement behind it.** SAFE-01 reads: "Nothing is written to
the module without an explicit click, **and the connect screen says so out loud**"
(`.planning/REQUIREMENTS.md:32`). Its Phase 7 closure record (`REQUIREMENTS.md:169`) names the exact
mechanism: *"Both never-writes surfaces say so in the present tense: the header note's SAFE_PROMISE
amended in 07-04 (its 'cannot write at all' clause retired, session-copy.spec.ts test 5 rewritten) and
the panel's two Phase 4 literals retired in 07-10."* This paragraph was amended **by name, eight commits
ago**. Removing it retires half a v1 requirement.

The user's instruction stands. What needs deciding is **what replaces the guarantee**. Three viable
forms, in order of how much they preserve:
1. A short line on the control itself — e.g. four words under `TRY ON DEVICE`. Keeps SAFE-01 whole,
   satisfies D-08's "unnecessary *texts*", costs one line.
2. The disclosure — the sentence lives inside a `<details>` or an info affordance beside the connect
   control. Present, not shouting.
3. Retire SAFE-01's second clause explicitly in `REQUIREMENTS.md` with a dated note. Honest, and it is
   the pattern Phase 7 used twice.

**Do not simply delete it and leave SAFE-01 marked `[x]`.**

## D. The never-writes proof — PRESERVE, and extend to a fourth click

| Assertion | Where |
|---|---|
| Zero config writes across connect, snapshot and every knob move, **counted by class** in node | `src/lib/device/install.spec.ts` test 4 |
| The same in a browser | `e2e/install.e2e.ts` test 1; `e2e/session.e2e.ts`'s seven cable tests, e.g. `:810` ("Two connects, two snapshots, six reads, zero writes"), `:860` ("and zero writes of any class"), `:1380` |
| Every write attributable to **one of three clicks** — `TRY ON DEVICE`, `PUT BACK`, `KEEP ON DEVICE` | `.planning/REQUIREMENTS.md:169` |
| The session's own **source scan** — eight needles, the write view built with `write.bind` and never called | `src/lib/device/session.spec.ts` test 15 (header note at `:26`) |
| The write guard: a write is only permitted when the fetched strings are trustworthy; first failure returned so the page names one reason | `src/lib/protocol/write-guard.ts:24-58` |

**D-05's CLEAR is a fourth click and it must extend this, never weaken it.** Concretely:
- The class-counting assertions enumerate write classes; a new class must be **added to the enumeration**,
  not excluded from it.
- "Every write attributable to one of three clicks" becomes "one of four". That sentence is in
  `REQUIREMENTS.md:169` and in the spec; both need editing, and the number should be a named constant
  rather than a word in prose if it is going to keep changing.
- The source scan's eight needles must gain CLEAR's own, or a `clear.bind`-shaped export slips past.

## E. The accent reserved list and the palette — PRESERVE

| Item | Where |
|---|---|
| Nine tokens, no tenth; three hexes, no fourth hue; every text token clears WCAG AA on the ground | `src/app.css:46-77`; asserted `src/lib/ui/identity.spec.ts:64-76` and the AA loop |
| The X-27 amendment precedent — how to widen a signed-off gate deliberately | `src/lib/ui/identity.spec.ts:17-34` |
| Accent's reserved list, **8 items**: splash wordmark + punched rectangles; name-plate triangles; `TRY ON DEVICE` fill when enabled; focus ring; header wordmark; the one walking cell of the 9×9 loading motif; **budget-meter fill while in budget**; **the selected value of a knob** (filled dot, detent fill+thumb, selected word, and the 2px ring around the selected swatch) | `05-UI-SPEC.md:147-164` |
| `--color-over: #ff3b30` — exactly three uses, never a button fill, never a border elsewhere, never on `TRY ON DEVICE`; 5.92:1 on black and 3.09:1 against the accent | `05-UI-SPEC.md:177-209`; `src/app.css:64-69` |
| "Colour is never the only channel" — over-budget is carried by six independent signals; WCAG 1.4.1 holds with the red removed entirely | `05-UI-SPEC.md:205-209` |
| The pad exemption and its boundary: swatches yes, nothing else; no gradient, tint, glow or `filter` on a swatch or a pad | `src/app.css:38-41`; `05-UI-SPEC.md:211-226` |
| The favicon's own guard permits two colours only; no red enters the mark | `src/lib/ui/identity.spec.ts:31-33` |

**The nine-item list the CONTEXT mentions is eight in the shipped spec** (six from Phase 4, two added by
Phase 5). Worth confirming before the UI spec quotes a count.

**The picker (§4.3) needs a named amendment to the swatch clause, in the X-27 style** — one numbered
paragraph, one commit, one reason.

**Also flagged:** `identity.spec.ts` computes contrast from the *declared alphas*. A CRT overlay changes
rendered contrast without changing an alpha, so the spec stays green while AA fails (§3.5). Either scope
the overlay away from text (recommended) or extend the spec to composite the overlay.

## F. The 44px touch floor and the control tiers — PRESERVE

| Item | Where |
|---|---|
| "Phase 4's touch floor is **per control, not per page**" — a file that renders an interactive control and never declares `min-block-size: 44px` fails | `src/lib/ui/browse-ui.spec.ts:180-218` |
| Inline floor matters as much as block: `min-inline-size: 44px` | `src/lib/ui/BrowseLink.svelte:204-213` |
| Declared across the toolbar, cards, budget message, copy link, knobs | `BrowseToolbar.svelte:463,486-487,512,519-520,580`; `CatalogCard.svelte:234-238`; `BudgetMessage.svelte:157-164`; `CopyLink.svelte:177,214` |
| SAFE-02's tier arithmetic: the primary is the one full-width accent fill; KEEP ON DEVICE is the **Quiet tier** — borderless, unfilled, **124.9 × 44 against 370 × 44** — a hairline, the tuning region and PUT BACK away, live only after a settled try-on (Z-05); the confirmation's affirmative is bordered, never filled | `.planning/REQUIREMENTS.md:170` |

**D-04's tension.** "One natural sequence" must not become "three equal buttons in a row". SAFE-02's
whole content is that `TRY ON DEVICE` and `KEEP ON DEVICE` **never sit as equal-weight buttons**. A
sequence can be expressed by position, numbering, connective copy and progressive disclosure without
equalising weight. **And CLEAR needs a tier of its own** — it is destructive, so it cannot be the
primary; it cannot be the Quiet tier either, because Quiet is already occupied by the flash write and
two quiet controls side by side is a coin flip. A fourth tier (or an explicit destructive treatment
that is *not* `--color-over`, which is reserved to three budget uses) is a design decision this phase
must make.

## G. The fourteen install states — PRESERVE, and extend

```ts
// src/lib/device/install.svelte.ts:194-217
/**
 * The fourteen states of 07-UI-SPEC's machine. `snapshot-failed` is I9's
 * cause 4; the other I9 causes are not phases here …
 */
export type InstallPhase =
  | "idle" | "snapshotting" | "ready" | "writing" | "settled" | "restored"
  | "kept" | "partial" | "lost" | "snapshot-failed" | "kept-mismatch"
  | "unconfirmed" | "restored-unconfirmed" | "nothing-landed";
export type InstallAction = "try" | "put-back" | "keep";
export type InstallLeg = "ram" | "store";
export type InstallCause = "timeout" | "nack" | "aborted" | "mismatch";
```

`WRITABLE_PHASES` (`:245-…`) governs which phases a write may start from, and the same list is where a
page change on the module re-snapshots from — never `writing`, never `snapshotting`.

**CLEAR must be added deliberately at every one of these points:**
- `InstallAction` gains `"clear"` — and every switch over it must be re-checked for exhaustiveness.
- A settled outcome phase (`"cleared"`) and its failure siblings, or an explicit decision to reuse
  `partial` / `nothing-landed` / `lost` with CLEAR's own copy.
- `WRITABLE_PHASES` gains `"cleared"`, or CLEAR after CLEAR is silently impossible.
- The seven failure builders (`install-copy.spec.ts:403`), the twelve utterances (`:428`) and the seven
  control labels (`:358`) are all counted by assertions. **Every one of those counts changes** and each
  is a named amendment.
- SAFE-07's rule holds: "cleared" means an **ACKNOWLEDGE frame was received**, never a resolved writer
  promise.
- SAFE-03's rule holds: **CLEAR must refuse to run without a snapshot**, and `PUT BACK` must still be
  offered afterwards. D-05 says this; the machine has to enforce it.
- DEGR-02: CLEAR is present-but-disabled with the reason inline on browsers that cannot write, and the
  reason string is subject to `KEEP_CAP`-class length rules.
- `docs/INSTALL-RUNBOOK.md` gains a new hardware row, joining Phase 6's A–F and Phase 7's A–G, all of
  which are still awaiting the user.

## H. The front door, the catalog, and D-03 — DECIDE

| Fact | Where |
|---|---|
| `FRONT_DOOR` is **8** entries: aurora, pinwheel, ninepads, starfield, joystick, radar, faders, dial | `src/lib/catalog/front-door.ts:206-270` |
| `EXCLUDED_FROM_ROW` is **28** entries, each with a written reason; the spec asserts the **partition**, so a silently dropped entry is red | `src/lib/catalog/front-door.ts:60-204` |
| Total catalog: **36** | 8 + 28; `src/lib/catalog/index.ts:57` composes `PORTED` plus the named entries |
| "Nothing in this module or its spec may depend on the LENGTH of this list or of CATALOG — only on the partition" | `src/lib/catalog/front-door.ts:53-57` |
| `front-door.ts` **imports nothing** — not `src/vendor`, not `@intechstudio/grid-protocol`, not `$lib/pad`, not `./index`. The spec scans its source and fails on any import, because the prerendered HTML needs every name and description at first paint without dragging in a 131,101-byte chunk | `src/lib/catalog/front-door.ts:20-23` |
| `motion` (`animated` / `static` / `dark`) is **derived** from `golden-frames.json` by the spec, never guessed | `src/lib/catalog/front-door.ts:27-35` |
| Coverflow mounts at most 7 pads (`MAX_SLOT = 3`) | `src/lib/coverflow/slots.ts:16`, `:138` |
| Browse grid caps at 4 columns and never a fifth | `src/lib/browse/grid.ts:17-23` |
| The fidelity line sits **beneath** the grid, unconditional, on every load, filtered or not, empty or not (W-13) | `05.1-UI-SPEC.md:311-322` |

**The design constraint the redesign inherits:** whatever the new front door becomes, the module that
carries names and descriptions for first paint must stay import-free. That is not a style rule; it is a
131 KB chunk on the critical path. Any "browse by niche and workflow" surface that renders at first
paint must get its taxonomy from a module with the same discipline.

`src/lib/browse/` already ships `filter.ts`, `query.ts`, `sort.ts`, `typographic.ts`, `return.ts` and
`grid.ts`, each with a spec — **the browse machinery for D-03 mostly exists**; what Phase 10 changes is
where it lives and how it is reached.

## I. Copy contracts that bind every new string — PRESERVE

From `src/lib/device/install-copy.ts:44-55` and the 05/07 Copywriting Contracts:

> "…a real ellipsis (U+2026), a real em dash (U+2014). No emoji, no exclamation marks, never 'Error',
> never 'loading', no browser engine named anywhere, no control label that says what the wire does, and
> no string names a control that is not on the screen."

Plus: **"About a second" appears in the first two [honesty strings] and nowhere else on the site
(Z-08)** — `install-copy.ts:102-104`. Deleting `HONESTY_NO_SESSION` (D-08) removes one of the two
occurrences; the Z-08 assertion counts them.

## J. Other assertions a redesign trips without noticing

| Assertion | Where | Why it matters here |
|---|---|---|
| `src/lib/licence-notices.spec.ts` | — | Guards the third-party notices; a font swap moves them |
| `gen-licenses.mjs:165-167` hard-codes the Quicksand attribution paragraph | `scripts/gen-licenses.mjs:165-167` | Must be rewritten in the same commit as the font swap; it will not fail on its own |
| `scripts/deploy.mjs:130-176` verifies the source archive carries `package-lock.json` and no `.planning/` material | — | Any new tracked binary lands in that archive (§1.5) |
| `src/lib/ui/glyph-field.spec.ts`, `identity.spec.ts` | — | The splash's generated texture and the whole palette |
| Four painter prohibitions asserted against a recording context | `src/lib/sim/paint.ts:17-37`; `paint.spec.ts` | "so none of the above is a promise" |
| Coverflow's three structural rules (3D flattening, filter placement, no engines in runes) | `src/lib/ui/Coverflow.svelte:10-28` | §3.3 |
| `src/lib/fidelity/vendored-diff.spec.ts` + `upstream-manifest.json` hash `src/vendor/` byte-for-byte; `.gitattributes:15` opts them out of EOL normalisation | — | The redesign must not touch `src/vendor/` |
| `src/lib/tune/reachability.sweep.spec.ts` — 32,852 states, worst 907 | `:30-36` | §4.5. A 4,096-option colour knob makes this unrunnable unless restructured |

---

## Runtime State Inventory

Phase 10 is a redesign, not a rename or migration — but it changes a shipped, deployed site with
persisted client state, so the categories are answered rather than skipped.

| Category | Items found | Action required |
|---|---|---|
| **Stored data** | `localStorage` key `hangar.snapshot.v1`, keyed by the module's factory serial then page; "never overwritten or deleted, surviving a throwing store and a FORGET THIS ZONA" (`.planning/REQUIREMENTS.md:172`) | **None from the redesign.** But CLEAR (D-05) must read this key, not write it, and must refuse when it is absent. If a returning visitor's snapshot predates the CLEAR feature, `PUT BACK` must still work — verify the record shape is unchanged |
| **Live service config** | Cloudflare Workers static-assets deploy at `https://hangar.sabotond.workers.dev` (`scripts/deploy.mjs:34`), gated by Basic Auth via `worker/index.js` and `.dev.vars`; `wrangler.jsonc` in git | **None.** The redesign changes assets, not routes or headers. If a `Permissions-Policy` or CSP header is added for the CRT/font work, it lives in the Worker and must be committed |
| **OS-registered state** | **None.** Deploys are manual from this machine (`scripts/deploy.mjs:23`); no scheduled task, no pm2, no systemd unit | None |
| **Secrets / env vars** | `.dev.vars` / `.dev.vars.example` carry `SITE_USER` / site password for the Basic Auth embargo (`playwright.config.ts:47-54`) | **None** — unless the redesign is the moment the embargo lifts, which is a separate decision. Note `.dev.vars` is not in git |
| **Build artifacts** | `build/` (the deployed bundle plus `LICENSE`, `THIRD-PARTY.md`, `licenses/`, `source-<sha>.tar.gz`); `.svelte-kit/`; `static/og/` prerendered OG PNGs; `licenses/@fontsource/quicksand@5.3.0-LICENSE.txt` | **Yes.** Swapping the font leaves a stale `licenses/@fontsource/quicksand@…` on disk until `npm run licenses` reruns (`gen-licenses.mjs:191-192` does `rmSync` first, so a rerun is sufficient). If the redesign changes any pad rendering, `static/og/` must be regenerated by `scripts/gen-og.mjs` (already wired into `npm run build`) |
| **Shared links in the wild** | Any URL of the form `/c/<id>#z.<format><payload>` already shared | **Yes, and it is the one with a user-visible failure mode.** §4.5: a colour-knob options change alters `read()`/`apply()` indices, and the entry-consistency check will classify previously-valid stamps as `unreadable` — showing SHARE-03's "made with an older version" apology on links that were correct yesterday. Either the change is index-preserving, or it takes a new format letter and the old one keeps decoding |

---

## Environment Availability

Probed on this machine, 2026-09-07. Read-only; nothing was installed.

| Dependency | Required by | Available | Version | Fallback |
|---|---|---|---|---|
| `impeccable` on npm | D-01 | ✓ | **4.0.4**, published **2026-09-06T22:43:44Z**, `license: "Apache-2.0"`, repo `github.com/pbakaus/impeccable`, homepage `impeccable.style`, bin `impeccable` | None needed. **Note: published one day ago.** Pin the exact version in the plan and record it, or the phase is designed against a moving target |
| Node ≥ 24 | `package.json:6-8` (`engines.node: ">=24.0.0"`); impeccable requires ≥ 22.12 | ✓ | Repo already builds | — |
| `@fontsource-variable/inter@5.3.0` | D-02 | ✓ on npm | OFL-1.1, published 2026-07-19 | Static `@fontsource/inter@5.3.0` (25,040 B latin-400-italic) |
| `@fontsource-variable/archivo@5.3.0` | §1.7 Option A | ✓ on npm | OFL-1.1 | `@fontsource/chakra-petch@5.3.0` or `@fontsource-variable/unbounded@5.3.0` |
| Grifter (any channel) | D-02 as briefed | ✗ | Foundry shop offline; all URLs 404; binaries say `PERSONAL USE` | §1.7 |
| ZONA hardware | D-05's bench row, §5 T5 | Not connected, and not to be connected in this task | — | `e2e/fake-zona.ts`, `src/lib/transport/fake.ts`, `src/lib/transport/fixtures/synthetic-zona.json` cover everything except the hardware halves, which become `docs/INSTALL-RUNBOOK.md` rows awaiting the user |
| Playwright browsers | The reduced-motion and degrade assertions | ✓ | `@playwright/test ^1.60.0`; projects `chromium` + `webkit-phone` | — |

**Missing with no fallback:** Grifter. This is the phase's one hard blocker and §1 resolves it.
**Missing with fallback:** none other.

---

## Validation Architecture

`workflow.nyquist_validation` is `true` in `.planning/config.json`.

### Test Framework

| Property | Value |
|---|---|
| Unit framework | **Vitest 4.x** (`package.json:48`, `"vitest": "^4.1.8"`) |
| Config file | `vite.config.ts:62-…` — `passWithNoTests: true`, `expect: { requireAssertions: true }`, two projects |
| Project `server` | `environment: "node"`, `include: ["src/**/*.{test,spec}.{js,ts}"]`, excludes `*.svelte.*`, `pad-invariants.test.js` and `src/**/*.sweep.spec.ts` **by file name, never by directory** (`vite.config.ts:70-89`) |
| Project `sweep` | The anti-drift suite: `pad-invariants.test.js` (38.6 s of a 39.9 s run, 4,860 labelled states) plus HANGAR's two — `reachability.sweep.spec.ts` and `stamp-roundtrip.sweep.spec.ts`. Runs **per wave, never per task** (`vite.config.ts:93-110`) |
| E2E | **Playwright 1.6x**, two projects: `chromium` (Desktop Chrome) and `webkit-phone` (iPhone 15, `grep: /@webkit/`) — `playwright.config.ts:54-59` |
| Type check | `svelte-check` via `npm run check` |
| Lint | `prettier --check . && eslint .` |
| Quick run | `npm run test:quick` (`vitest run --project server`) |
| Sweep run | `npm run test:sweep` (`vitest run --project sweep`) |
| Full suite | `npm test` (`vitest --run` then `playwright test`) |

### Phase requirements → test map

| Concern | Behaviour | Test type | Automated command | File exists? |
|---|---|---|---|---|
| Font licence gate | No font-shaped file is tracked outside `licenses/` unless allowlisted with an SPDX id | unit | `npx vitest run --project server src/lib/licence-notices.spec.ts` | ❌ **Wave 0** — the check does not exist (§1.6) |
| Third-party notices | `THIRD-PARTY.md` names the shipped fonts, not Quicksand | unit | `npx vitest run --project server src/lib/licence-notices.spec.ts` | ✅ (file exists; the Quicksand paragraph is hard-coded at `gen-licenses.mjs:165-167` and must move) |
| Palette invariants | Nine tokens, three hexes, AA on ground, favicon two-hue | unit | `npx vitest run --project server src/lib/ui/identity.spec.ts` | ✅ |
| CRT off under reduced motion | Every CRT layer's `animationName === "none"` (or `animationPlayState === "paused"`) under `emulateMedia({ reducedMotion: "reduce" })`, in both projects | e2e | `npx playwright test e2e/aesthetic.e2e.ts` | ❌ **Wave 0** (§3.4 — the existing canvas-pixel assertion cannot see a CSS overlay) |
| CRT never covers text | No text node is a descendant of a CRT container; every overlay has `pointer-events: none` | unit (source scan, in the style of `front-door.spec.ts`'s import scan) | `npx vitest run --project server src/lib/ui/aesthetic.spec.ts` | ❌ **Wave 0** |
| Coverflow depth survives | No `filter`, `mix-blend-mode`, `opacity < 1`, `mask-image` or `contain: paint` on or above the 3D context | unit (source scan) + e2e (slot scales differ) | `npx vitest run --project server src/lib/ui/aesthetic.spec.ts` | ❌ **Wave 0** |
| Pad fidelity | No CSS filter tints a pad canvas; the four painter prohibitions | unit | `npx vitest run --project server src/lib/sim/paint.spec.ts` | ✅ |
| Touch floor | Every interactive control declares `min-block-size: 44px` | unit | `npx vitest run --project server src/lib/ui/browse-ui.spec.ts` | ✅ (extend to new components) |
| Sizing twins re-derived | 152 / 72 / 72 / 48 px against the new metrics | unit | `npx vitest run --project server src/lib/ui/device-ui.spec.ts src/lib/ui/tune-ui.spec.ts` | ✅ (numbers change) |
| Copy caps | Every string ≤ its named cap (`HONESTY_CAP` 129, `PUT_BACK_CAP` 129, `KEEP_CAP` 86) | unit | `npx vitest run --project server src/lib/device/install-copy.spec.ts` | ✅ |
| Never writes without a click | Zero writes **by class**, every write attributable to one of **four** clicks | unit + e2e | `npx vitest run --project server src/lib/device/install.spec.ts src/lib/device/session.spec.ts` ; `npx playwright test e2e/install.e2e.ts e2e/session.e2e.ts` | ✅ (enumerations change) |
| CLEAR needs a snapshot | CLEAR is refused with no snapshot; `PUT BACK` offered after a clear; "cleared" is an ACK, never a resolved promise | unit + e2e | `npx vitest run --project server src/lib/device/install.spec.ts` | ✅ (extend) |
| Picker offers only reachable colours | Every position is `quantiseColour`-stable; `read(apply(state, i)) === i` | unit | `npx vitest run --project server src/lib/tune/knobs.preset.spec.ts` | ✅ (extend) |
| Stamp round-trip with the picker | Every reachable colour round-trips; old stamps still land `restored` | sweep | `npm run test:sweep` | ✅ (restructure, §4.5) |
| Budget still bounded | No reachable state crosses 908 — **or the finding is retired with a number** | sweep | `npm run test:sweep` | ✅ (restructure: cost the colour dimension separately) |
| Degrade path | Install controls present-but-disabled with the reason, CLEAR included | e2e | `npx playwright test --project=webkit-phone` | ✅ (extend) |

### Sampling rate

- **Per task commit:** `npm run test:quick` (server project) + `npm run lint` + `npm run check`.
- **Per wave merge:** `npm test` (unit + e2e, both Playwright projects) and — for any wave that touches
  knobs, the stamp, the colour picker or `src/vendor/` — `npm run test:sweep`.
- **Phase gate:** full suite green, `npm run licenses` clean, `npm run build` producing the source
  archive, before `/gsd:verify-work`.

### Wave 0 gaps

- [ ] `e2e/aesthetic.e2e.ts` — CRT layers stilled under reduced motion, both projects. Without this,
      §3.4's silent-green hole ships.
- [ ] `src/lib/ui/aesthetic.spec.ts` — source scan: no CRT container wraps a text node; every overlay is
      `pointer-events: none`; no `filter` / `mix-blend-mode` / `opacity < 1` / `mask-image` /
      `contain: paint` on or above the coverflow 3D context.
- [ ] A font-asset gate in `scripts/gen-licenses.mjs` (or a spec beside `licence-notices.spec.ts`) — no
      tracked `.woff|.woff2|.ttf|.otf` outside `licenses/` without an allowlist entry (§1.6).
- [ ] Restructure `reachability.sweep.spec.ts` so the colour dimension is costed separately rather than
      cross-producted (§4.5) — otherwise the sweep becomes unrunnable the moment the picker lands.
- [ ] A contrast assertion that composites the CRT overlay, **or** a written scope rule that the overlay
      never covers text, asserted by the source scan above. Pick one; do not ship neither.

No framework install is needed. Vitest, Playwright, `svelte-check`, ESLint and Prettier are all present.

---

## Don't Hand-Roll

| Problem | Don't build | Use instead | Why |
|---|---|---|---|
| Self-hosting a webfont | A hand-copied `.woff2` in `static/fonts/` | `@fontsource*` npm packages, `@import`ed or `@font-face`d from `node_modules` | It is the shipped pattern (`src/app.css:3-10`), it keeps the binary out of `git archive` (§1.5), and it is the only path the licence gate can see (§1.6) |
| Detecting reduced motion | A one-off `matchMedia` in a new component | `PadSimHost`'s existing live subscription | `src/lib/sim/host.ts:93-94`, `:160-167`, `:200` — already injectable and already tested with a toggleable source (`host.spec.ts:223`) |
| Randomising knobs | A fresh `Math.random` loop | `surpriseIndices()` | Pure, injectable, bounded at 12 draws, rejects a no-op draw, and has a property test (`src/lib/tune/surprise.ts`) |
| Quantising a colour | `Math.round(v/17)*17` inline | `quantiseColour` from `src/vendor/botor/_pad.ts:490-493` | It is the vendored rule; a local copy would drift from the state model and break `read(apply(i)) === i` |
| Encoding tuned state into a URL | A JSON blob in the query string | `encodeStamp` / `decodeStamp` and the three landings | `src/lib/share/stamp.ts` — SHARE-01 requires the hash, and the four-step consistency check is what makes SHARE-03's "never a subtly wrong one" true |
| A colour picker widget | An npm colour-picker component | The existing detent-track/rail widget, instantiated three times | Any third-party picker is continuous, gradient-rendered and 24-bit — all three forbidden here (§4.1, §4.3). It would also add a runtime dependency to the licence gate for no gain |
| Noise texture | A PNG, or a live `filter: url(#noise)` | An inline `feTurbulence` SVG data-URI as `background-image` | The reference's own technique: evaluated once at decode into a cached tile, no network request, no per-frame filter graph (§3.1) |
| CRT scanlines | A repeating PNG or a canvas pass | `repeating-linear-gradient` | Rasterised once, resolution-independent, and `background-image: none` is a clean off switch (§3.2) |
| A per-card animation loop | `setInterval` or one `rAF` per canvas | The shared host: one rAF, 10 ms accumulator, 100 ms catch-up clamp, `IntersectionObserver` at `rootMargin: "200px"` | `src/lib/sim/schedule.ts:21,30`; `src/lib/sim/host.ts:155`. 05.1-UI-SPEC:916-918 requires it reproduced exactly |

**Key insight:** almost everything this redesign needs already exists in the repo in a tested form. The
risk in Phase 10 is not building the wrong thing — it is building a *second* thing beside a working one,
and the two drifting.

---

## State of the Art

| Old approach | Current approach | When changed | Impact here |
|---|---|---|---|
| CRT via WebGL shaders or canvas post-processing | Layered CSS: gradient scanlines + inline `feTurbulence` tile + transform-only sweep | Mainstream since ~2020 | The ZONA landing is the proof; no GPU context, no per-frame JS |
| `filter: url(#noise)` evaluated live | `feTurbulence` baked into a data-URI `background-image` | — | One decode instead of a per-frame filter graph |
| Chromatic aberration by duplicating text with red/cyan `text-shadow` | `hue-rotate()` inside a short `step-end` keyframe | — | The reference uses no aberration at all. Cheaper and, on lime-on-black, more legible |
| Static webfonts, one file per weight | Variable fonts, one file per axis-set | Broadly since 2019; Fontsource's `@fontsource-variable/*` since v5 | Inter Italic: 51,832 B for 100–900 vs 50,852 B for two static weights. The axis is effectively free |
| `<input type="color">` for any colour need | Model-appropriate pickers; palettes where the target space is quantised | — | Novation's Launchpad editor is the category precedent: pick from what the hardware has (§4.2) |
| Randomise-all | Randomise-with-locks | Serum (2014) onward; near-universal in synths | HANGAR's `SURPRISE ME` is still randomise-all (§5.3 T1) |
| Parameter tweaking | Generative exploration (Synplant 2's Genopatch, 2023) | 2023 | The only precedent for §5.3 T4, and it is from an adjacent category |

**Deprecated / outdated for this project:**
- **Grifter.** Not deprecated as a design; deprecated as a *distribution*. Foundry shop offline since
  ~2023; no licence retrievable (§1.4).
- **`@fontsource/quicksand`.** Replaced by D-02. Remember `gen-licenses.mjs:165-167`.
- **Browser sniffing for anything.** Already ruled out by CLAUDE.md; restated because a redesign is when
  someone reaches for it.

---

## Open Questions

1. **Does the user hold a private Grifter licence, and if so does it permit redistribution?**
   - What we know: Intech Studio self-hosts Grifter across its brand; the binary says `PERSONAL USE`;
     the foundry's shop is gone; the 2020 archived page waived commercial licensing but said nothing
     about redistribution.
   - What is unclear: whether a written grant exists and what it covers.
   - Recommendation: send one email to `finn@hansonmethod.com` asking specifically about *inclusion of
     the font file in a publicly-downloadable GPLv3 source archive*. **Do not block on the reply.** Plan
     for Archivo and treat a "yes" as a late, cheap swap of one `@font-face`.

2. **Is SAFE-01 retired, or satisfied in a shorter form?** (CONTEXT.md, "Open for the user" #1)
   - What we know: the sentence is 88 characters, asserted at `session-copy.spec.ts:298`, rendered on two
     surfaces, and named in `REQUIREMENTS.md:169` as the mechanism that closed the requirement eight
     commits ago.
   - Recommendation: satisfy it in a shorter form on the control itself. It preserves the requirement,
     honours D-08's "unnecessary *texts*", and costs one line. Present all three options to the user with
     the character counts.

3. **Does the front-door ring grow, or does browse replace it?** (CONTEXT.md #3)
   - What we know: 8 in the ring, 28 excluded each with a written reason, 36 total; the spec asserts the
     **partition** and forbids depending on either length; `front-door.ts` must stay import-free for
     first paint.
   - Recommendation: decide it here rather than in Phase 9, as CONTEXT suggests. Note that "both paths
     first-class" (D-03) is satisfiable by making the ring the *entry* to browse rather than a rival to
     it — one surface, two depths.

4. **Does the colour picker make TUNE-05 reachable in production?**
   - What we know: worst reachable state today is 907 of 908; a free colour adds up to 8 characters.
   - What is unclear: whether the worst state (`tpad`) even has a colour knob on the affected call site.
   - Recommendation: **measure it in Wave 0**, before the picker is designed. If it goes reachable, that
     is a requirement-status change worth recording, not a bug.

5. **Which `impeccable` version, and what does it write?**
   - What we know: 4.0.4, Apache-2.0, published **2026-09-06** — one day before this research.
   - What is unclear: exactly which files `npx impeccable install` writes and whether any of them enter
     the tracked tree. `.claude/` is `export-ignore`d (`.gitattributes:5`) so it stays out of the source
     archive, but it may still be committed.
   - Recommendation: pin the version in the plan; run the install as a plan task; record the file list
     in the summary; confirm nothing lands in `src/` or `static/`.

6. **Does `--color-ground` move from `#000000` to a near-black?**
   - What we know: the ZONA landing uses `#0a0a0b`; HANGAR uses true black, and a black scanline over
     true black is invisible.
   - What is unclear: whether the CRT texture is wanted on the page ground at all, or only inside pad
     frames and hero surfaces.
   - Recommendation: keep true black. Scope the texture to containers, which §3.5 argues for on
     legibility grounds anyway. If the ground must move, it is a token change and
     `identity.spec.ts` will require an X-27-style amendment.

7. **What tier does CLEAR occupy?**
   - What we know: primary is the one accent fill; Quiet (borderless, 124.9×44) is taken by
     `KEEP ON DEVICE`; `--color-over` is reserved to exactly three budget uses.
   - Recommendation: a fourth treatment — bordered, unfilled, with an outline in `--color-line` and a
     confirmation step — and an explicit note that it is *not* `--color-over`, for the same reason a red
     CTA was rejected in 05-UI-SPEC (it would say "dangerous" where the truth is "deliberate").

---

## Sources

### Primary (HIGH confidence)

**Local repository — `C:\Users\sabot\Documents\Claude\hangar`**
- `src/app.css:3-10`, `:46-77` — the font import pattern and the nine-token palette
- `src/lib/ui/identity.spec.ts:1-110` — IDENT-01, the X-27 amendment precedent, the contrast loop
- `scripts/gen-licenses.mjs:26-42`, `:85`, `:99-144`, `:165-167`, `:191-204` — the licence gate
- `scripts/postbuild.mjs:6-14`, `:75-100` — the GPLv3 §6(d) source archive
- `scripts/deploy.mjs:10-27`, `:105-176` — the clean-tree gate and archive verification
- `.gitattributes:1-16` — `export-ignore` scope
- `THIRD-PARTY.md:1-29` — the shipped notices
- `src/lib/sim/paint.ts:1-45` — the four painter prohibitions
- `src/lib/sim/schedule.ts:21,30`; `src/lib/sim/host.ts:20-22,93-94,155,160-167,200,272` — the scheduler and reduced-motion source
- `src/lib/ui/Coverflow.svelte:10-28` — the 3D-flattening rule
- `src/lib/ui/Splash.svelte:300-340` — the shipped halftone
- `src/lib/coverflow/slots.ts:16,138`; `src/lib/browse/grid.ts:17-23` — concurrent-canvas arithmetic
- `src/lib/tune/knobs.preset.ts:127-235` — the palette, the "picker that lies" note, the colour binding
- `src/vendor/botor/_pad.ts:490-493`, `:2455-2480` — `quantiseColour`, the stamp formats
- `src/lib/tune/surprise.ts:1-79` — `SURPRISE ME`
- `src/lib/tune/reachability.sweep.spec.ts:1-40,75` — 32,852 states, worst 907
- `src/lib/share/stamp.ts:1-70` — the envelope, the format letters, the consistency check
- `src/lib/device/install.svelte.ts:194-250` — the fourteen states
- `src/lib/device/install-copy.ts:44-110` — the copy contract and the three caps
- `src/lib/device/session-copy.ts:193-221`; `session-copy.spec.ts:291-310` — `PICKER_EXPLAINER` 130, `SAFE_PROMISE` 88
- `src/lib/ui/fidelity-line.ts:3,28-29` — the 231-character line
- `src/lib/protocol/write-guard.ts:1-58` — the write refusal
- `src/lib/catalog/front-door.ts:1-270` — the ring, the partition, the import prohibition
- `e2e/first-experience.e2e.ts:87-91,405-460`; `e2e/browse.e2e.ts:140-148,486-516`; `e2e/tuning.e2e.ts:278-298`; `e2e/tuning-webkit.e2e.ts:350-370`; `playwright.config.ts:54-59` — the reduced-motion contract
- `vite.config.ts:62-110` — the two Vitest projects
- `.planning/REQUIREMENTS.md:32-40,66-84,169-203` — the requirement set and its closure record
- `.planning/research/ZONA-CAPABILITIES.md:241-350,410-453,1014` — the LED engine, the colour model, RGB444
- `.planning/phases/04-first-experience/04-UI-SPEC.md:383,721` — the 152px reservation, W-19
- `.planning/phases/05-tuning-budgets-and-shareable-links/05-UI-SPEC.md:147-230,361-457` — the accent list, `--color-over`, the swatch boundary, the knob vocabulary
- `.planning/phases/05.1-catalog-browse/05.1-UI-SPEC.md:311-322,914-926` — "sixteen live pads at once", the inherited motion contract
- `.planning/phases/05-.../05-05-SUMMARY.md:19` — "32,852 states, zero over 908, worst 907 (tpad)"

**Sibling repos (read-only)**
- `C:\Users\sabot\Documents\Claude\gridstrument-landing\fonts\grifter\*.woff` — Grifter name tables
- `C:\Users\sabot\Documents\Claude\zona-scramble\fonts\GRIFTER-Thin.ttf` — the TTF name table and `fsType`
- `C:\Users\sabot\Documents\Claude\new-module-tease\fonts\GRIFTER-*.woff2` — four weights, ~13.5 KB each
- `C:\Users\sabot\Documents\Claude\grid-editor\src\renderer\main\panels\configuration\components\Toolbar.svelte:120-137` — Grid Editor's character counter and its two thresholds
- `C:\Users\sabot\Documents\Claude\zona-announce\js\config.js` — grain/vignette/bloom parameters for the ZONA announce render

**Live web (HIGH confidence — production artefacts, fetched 2026-09-07)**
- <https://intech.studio/products/zona> and `https://intech.studio/_app/immutable/assets/49.BP9OUv0T.css` — the ZONA landing's CRT CSS, quoted in §3.1
- `https://intech.studio/_app/immutable/assets/0.C-kUNafr.css` — the site-wide Grifter `@font-face` block
- `https://intech.studio/fonts/grifter/GRIFTER-Light.woff` (HTTP 200, 18,220 B) — name table: `licenseDescription = PERSONAL USE`
- `https://registry.npmjs.org/@fontsource-variable/inter`, `/@fontsource/inter`, `/@fontsource/quicksand`, `/@fontsource-variable/archivo`, `/@fontsource/chakra-petch`, `/@fontsource-variable/unbounded`, `/@fontsource-variable/anybody`, `/@fontsource-variable/syne`, `/@fontsource-variable/space-grotesk`, `/@fontsource-variable/big-shoulders-display`, `/@fontsource-variable/saira`, `/@fontsource-variable/bricolage-grotesque`, `/impeccable` — versions and licences
- `https://unpkg.com/@fontsource-variable/inter@5.3.0/?meta` and siblings — exact byte counts
- <https://rsms.me/inter/> — Inter's licence, true italic, axes and OpenType features
- <https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_display/Containing_block> — the containing-block condition list for `filter` / `backdrop-filter` / `will-change`
- <https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Animation_performance_and_frame_rate> — compositor-accelerated properties, the 16.7 ms budget

### Secondary (MEDIUM confidence)

- [Wayback capture of hansonmethod.com/grifter, 2020-11-11](https://web.archive.org/web/20201111191329/https://hansonmethod.com/grifter) — the "commercial licenses are no longer needed" statement. Primary but stale, and contradicted by the binary
- [Hanson Method™ Font Foundry, MyFonts](https://www.myfonts.com/collections/hanson-method-foundry) — the foundry identity
- [befonts: Grifter](https://befonts.com/grifter-sans-serif-font.html) — "This demo font is for PERSONAL USE ONLY!"
- [Motion, *The Web Animation Performance Tier List*](https://motion.dev/magazine/web-animation-performance-tier-list) — `will-change` layer-memory tradeoff
- [Mobbin, *Color Picker UI Design*](https://mobbin.com/glossary/color-picker) — the four picker variants; HSV↔wheel mapping
- [Novation, *Launchpad Components Custom Mode Editor Guide*](https://support.novationmusic.com/hc/en-gb/articles/360009860380-Launchpad-Components-Custom-Mode-Editor-Guide) — fixed-palette precedent
- [Elgato, *Stream Deck Profiles*](https://marketplace.elgato.com/stream-deck/profiles) — the browse-a-library model
- [Sound On Sound, *Sonic Charge Synplant 2*](https://www.soundonsound.com/reviews/sonic-charge-synplant-2) and [soniccharge.com/synplant](https://soniccharge.com/synplant) — Genopatch, the genetic-exploration precedent
- [Beier, *Typeface features and legibility research*, Vision Research 2019](https://www.sciencedirect.com/science/article/pii/S0042698919301087) — lower reading speed for italics
- [Harvard, *Enhance Typography for Legibility*](https://accessibility.huit.harvard.edu/typography) and [NN/g, *Typography for Glanceable Reading*](https://www.nngroup.com/articles/glanceable-fonts/) — use italics sparingly
- [impeccable.style](https://impeccable.style) — what `npx impeccable install` does and the command set

### Tertiary (LOW confidence — marked for validation)

- [Pixel Surplus](https://pixelsurplus.com/freebies/grifter-bold-free-strong-sans-serif), [imjustcreative](https://imjustcreative.com/grifter-bold-free-font/2020/06/08), [Sessions College](https://www.sessions.edu/notes-on-design/free-font-friday-grifter/) — "flexible licence, personal and commercial". **Contradicted by the binary; do not rely on these.**
- The `is-glitching` trigger cadence on the ZONA landing — the toggling script is in a dynamically-imported chunk I could not statically resolve. The CSS is verified; the *when* is not.
- "No controller-config editor ships a live cost-of-change forecast, config breeding, or hardware A/B" — searched and not found, which is weaker than verified absent.
- Any specific frames-per-second figure for a CSS CRT overlay above N animating canvases. **None is offered in this document**; the recommended layers cost zero per-frame work by construction, and the one moving layer should be measured on `/browse/` at 36 entries.

---

## Metadata

**Confidence breakdown**

| Area | Level | Reason |
|---|---|---|
| Grifter cannot ship | **HIGH** | The vendor's own `licenseDescription = PERSONAL USE` in five binaries including the live production one; every foundry URL 404; `git archive HEAD` verified at `postbuild.mjs:82-89` |
| Replacement faces | **HIGH** (licence, version, bytes) / **MEDIUM** (aesthetic fit) | Registry and unpkg queries are facts; "closest to Grifter" is judgement |
| Inter Italic licence, axes, bytes | **HIGH** | npm `license` field, upstream docs, and measured file sizes agree |
| Italic body-text cost | **MEDIUM** | Direction is well supported; magnitude for this specific palette and these sizes is not measured |
| ZONA landing treatment | **HIGH** | Read from the production stylesheet and quoted verbatim |
| CRT technique costs | **HIGH** (structural: stacking contexts, containing blocks, context caps) / **LOW** (fps figures) | MDN and the CSS specs are authoritative on mechanism; no benchmark was run and none is claimed |
| ZONA colour model | **HIGH** | ZONA-CAPABILITIES.md cites firmware line numbers re-verified at HEAD `dc7d301`; `quantiseColour` read from the vendored source |
| Picker constraints (908, stamp) | **HIGH** on the shape / **MEDIUM** on which mitigation is cheapest | The 907-of-908 headroom and the consistency check are quoted; I did not read the whole vendored codec |
| Tuning survey | **MEDIUM** | Vendor documentation, not hands-on use. The four "nobody does this" claims are searched-and-not-found |
| Repo checklist | **HIGH** | Every row carries a file:line read in this session |

**Research date:** 2026-09-07
**Valid until:** 2026-10-07 for the repo findings (stable — they are this codebase). **2026-09-21** for
the npm versions and for `impeccable`, which published 4.0.4 the day before this research and is moving
fast. The Grifter finding does not expire: a foundry that closed its shop does not reopen it quietly,
and the binary's own metadata is dated 2020.
