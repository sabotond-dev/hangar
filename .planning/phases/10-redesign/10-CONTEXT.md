# Phase 10: Redesign — Context

**Gathered:** 2026-09-07, from the user directly, while Phase 9 was executing. This document is the
user's brief captured close to verbatim, plus the tensions it creates with shipped decisions. Nothing
here is planned yet. [user] decisions are the user's and are not open to orchestrator veto;
[orchestrator] notes are observations for the planner to resolve.

## The brief, as given

> I need a complete redesign of the GUI. First install impeccable `npx impeccable install` design
> skill and use it. Use Grifter for headlines and inter italic for texts. Rework the whole GUI and UI
> & UX experience where users can select a configuration at once but also can easily browse
> configurations that matches their niche and workflows. Make the Try on device - Reset (put back) -
> Storing (keep on device) flow natural. Add a Clear button that clears the current page's
> configuration on the ZONA. Tuning a configuration should be a fun and easy aspect. Color should be
> picked from a stylized RGB color picker. Tuning should be intelligent and include solutions that
> are out of the ordinary, out of the box creative innovations. Remove all the unnecessary texts.
> Rework the aesthetic to match the ZONA landing, CRT, glitchy feel without being overwhelming and
> destructive to the UX.

## Decisions

### Tooling and type
- **D-01 [user]** Install the `impeccable` design skill first (`npx impeccable install`) and design
  through it. It is the phase's first task, before any component is touched.
- **D-02 [user]** **Grifter** for headlines, **Inter Italic** for body text. This replaces Quicksand,
  which Phase 4 chose for its open licence — so the planner must resolve licensing and hosting for
  Grifter before it ships, and record what was found. HANGAR is GPLv3 and serves its own source; a
  font that cannot be redistributed cannot be self-hosted with it.

### Experience
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

### Copy
- **D-08 [user]** Remove the unnecessary explanatory text. Named by the user:
  - `You've got to start somewhere…`
  - `The browser opens its own list of ports — that prompt is the browser, not HANGAR, and nothing here sees a port until you pick one.`
  - `HANGAR never writes to your ZONA on its own. Nothing reaches the module without a click.`
  - `Every pad here runs the firmware's own code, compiled exactly as it would be written to a ZONA. What a screen cannot show: the real colour of the lights, the way they bleed into each other, and how the surface feels under a finger.`
  - `Connects to your ZONA, then writes this configuration into its memory. About a second, and only in memory.`
  - `Copies this configuration, knobs and all, as a link anyone can open.`
  - and others of the same kind — the list is illustrative, not exhaustive.

### Added by the user during planning (2026-09-07)
- **D-09 [user] No pad thumbnail stays dark.** Every card shows something. Consequences, all shipped
  today: four entries declare `restsBlack: true` — Trackpad, GHOST, MORPH and ETCH — and each carries
  `RESTS_DARK_NOTE` byte-for-byte, a rule `listing.spec.ts` asserts in both directions; nineteen of
  thirty-six entries rest still and carry a `quiet` line; and the generated OG image for a dark card
  is a black square (ETCH's is the smallest in `static/og/` at 4,192 bytes, and 09-08 recorded it as
  "correctly black"). Satisfying this means one of: giving those cards a resting state that is not
  black, or making a thumbnail show a representative frame from the card's motion rather than its
  rest state. The second is cheaper and does not touch a single configuration; the first changes what
  the pad actually does. The UI spec decides which, and whichever it picks, `restsBlack`,
  `RESTS_DARK_NOTE` and the specs that pin them are retired or rewritten by name.
- **D-10 [user] There are too many tags in browsing.** The catalog carries **55 distinct tags across
  thirty-six entries, 27 of them on exactly one entry**, and the toolbar shows **28 chips**. A
  vocabulary where three quarters of the terms match a single card is a list, not a filter. The UI
  spec sets a target size and a rule for what earns a chip, and the tags on all thirty-six entries are
  re-cut to it — which moves `KNOWN_TAGS` in `copy.spec.ts`, the `RECORDED` blocks in
  `filter.spec.ts` and `sort.spec.ts`, every entry's tag array, the four-tags-per-entry rule that nine
  shelf presets already break by carrying three, and `05.1-UI-SPEC.md`'s census.
- **D-11 [user] Remove the Newest sort.** Twenty of the thirty-six entries ship on the same date, so
  ordering by date says nothing: `addedAt` has three distinct values across the catalog and one of
  them covers twenty entries. Removing it touches `BROWSE_SORTS`, `sort.spec.ts` (which asserts three
  sorts and a `3 × n × (n − 1)` comparator sweep, and whose NEWEST test is the one 09-02 restructured
  into date blocks), `BrowseToolbar.svelte`, the browse e2e, and the URL parameter's accepted values.
  Whether `addedAt` survives as a field at all is the UI spec's call — nothing else reads it today.

### Type and motion, settled by the user (2026-09-07)
- **D-02 amended [user].** **Grifter is licensed** — the user holds the licence. The files are already
  on this machine: nine OTF weights in `C:\Users\sabot\Downloads\Fonts\` (Thin through Black), and
  woff plus woff2 already converted for Light, Regular, Medium and Bold in two sibling projects
  (`gridstrument-landing\fonts\grifter\` and `fulfilment-dashboard\public\fonts\grifter`), which is a
  working precedent for self-hosting it. Those siblings are read-only: copy the files in, never edit
  them there.
- **D-12 [user] Body text is Inter, upright — not italic.** The brief first said Inter Italic; the
  user withdrew the italic on being told what all-italic body text costs at small sizes and long
  measures. Grifter carries headlines, Inter carries body.
- **D-13 [orchestrator] The font binary is excluded from the source archive.** Not a challenge to the
  licence, a narrower point: HANGAR serves its own corresponding source as a per-deploy archive from
  the site, so a font file placed in the tree would be *redistributed*, which is a different
  permission from displaying it on your own site and the one most foundry licences withhold. GPLv3
  does not oblige us to ship a third-party font we may not redistribute. The default is therefore to
  serve the font from the site and exclude the binary from `scripts/deploy.mjs`'s archive, with a
  short note in its place saying which family is required and where to obtain it — the same shape as
  any GPL project that depends on a proprietary asset. `scripts/gen-licenses.mjs` records the family,
  the licensee and the licence name rather than a redistributable file. If the user's licence does
  permit redistribution, this reverses to a one-line change; the plan asks rather than assumes.
- **D-07 confirmed [user].** The CRT and glitch treatment ships **with an off switch**, satisfying the
  `prefers-reduced-motion` contract Phase 4 set and Playwright asserts in both engines. Whether the
  switch is also a visible control the visitor can reach, beyond the OS setting, is the UI spec's call.

- **D-14 [user] Grifter ships; the licence is confirmed in parallel.** The font binaries on disk
  declare `PERSONAL USE` in the OpenType `name` table (nameID 13, copyright `HANSON METHOD™ DESIGN`,
  no licence URL) — verified by parsing `GRIFTER-Regular.otf` directly, and the same string is in the
  file Intech Studio serves live. The user holds that a licence exists and will confirm it against the
  purchase record or Intech's company licence while the phase proceeds. **The engineering
  consequence is that the headline face must be swappable by one token**: a single custom property
  and a single `@font-face` block, never a family name written into components, so that if the
  licence does not cover this the change is a token edit late in the phase and not a redesign. D-13's
  archive exclusion stands regardless.

### D-15 [user] Three aesthetic references, given 2026-09-08 mid-execution

The user supplied three images with the instruction "use attached as well for the aesthetic redesign".
They cannot be committed, so what they carry is extracted here as rules. All three share one
character: **a technical instrument rather than a screen effect** — registration marks, monospace
metadata, tabular density, high contrast, one accent, and no mark that is not information.

**Reference A — viewfinder.** A photographic field thrown fully out of focus, with sharp UI over it.
A regular lattice of thin **registration crosses** across the whole frame at low opacity, and exactly
**one cross in the accent colour**, larger and set apart, marking the focus point. Headline is large,
tight, uppercase, prefixed by an index and an em dash (`03 — PRJCT A`). Beneath it a three-line
metadata block in small caps, **column-aligned with `+` as the separator**, carrying a place, a
trademark superscript, katakana as a second script, and a quarter-year (`Q2—2026`). The subject is
blurred; the interface is not.

**Reference B — generative print.** Pure black, white marks only. A **halftone dot field** whose
density is modulated to describe three stacked surfaces — the image is made of the grid, not drawn on
it. Plus marks at the margins, not a full lattice. One enormous lowercase word, heavily letterspaced,
as the anchor. A small justified monospace paragraph as a definition. A tiny centred header carrying
date, series number and author.

**Reference C — terminal.** Monospace throughout, over black with fine grain. **Pill outlines** —
fully rounded, one-pixel, transparent fill — as the universal control shape, with a **filled pill for
the active state**. A dense tabular listing: date, city, venue, underlined action, column-aligned and
unruled. A status strip reading time, place, temperature and condition. ASCII glyphs used as
interface elements rather than decoration. Progress shown as outlined bars with a single letter.

**What this gives the redesign, concretely:** the registration lattice with one accent cross; the
`+`-separated metadata block; the index-and-em-dash headline; halftone density as an image-making
device; pill outlines with a filled active state; ASCII glyphs as legitimate interface furniture; and
tabular rows that align without rules.

## Tensions with shipped decisions **[orchestrator]**

These are not objections. They are the places where the brief meets a locked decision, and the
planner must produce an answer for each rather than discover it mid-execution.

1. **D-08 versus SAFE-01.** `HANGAR never writes to your ZONA on its own…` is not decoration: it is
   the sentence REQUIREMENTS.md's SAFE-01 requires the connect surface to carry, and Phase 7 amended
   it by name only eight commits ago. Removing it retires a v1 requirement. Options for the planner:
   retire SAFE-01 explicitly and record it, or satisfy it with something that is not a paragraph — a
   short line on the control itself, or the disclosure. The user's instruction stands; what needs
   deciding is what replaces the guarantee, not whether the paragraph goes.
2. **Every named string is asserted character-for-character.** `PICKER_EXPLAINER` (130), the fidelity
   line (231), `SAFE_PROMISE` (88), the try-on honesty line and the copy-link line each have a spec
   that pins them, plus sizing twins that reserve space for them (152 px for the header note, 72 px
   for the honesty slot, 48 px for the keep line). Deleting text collapses those reservations, which
   is a layout change in every state, not a copy change. Each removal is a named amendment with its
   spec rewritten rather than deleted, the way Phase 7 handled its two.
3. **The CRT and glitch aesthetic versus the reduced-motion contract.** Phase 4 snaps every animation
   to a static representative frame under `prefers-reduced-motion`, and Playwright asserts it. A
   glitch treatment needs the same escape hatch, decided up front.
4. **The colour picker versus the palette.** The site is two tokens, black and acid lime, with a
   nine-item accent reserved list and a written argument for no third colour. A stylized RGB picker
   introduces arbitrary colour by definition. That is fine — it is picking a colour for the pad, not
   for the chrome — but the boundary between "colour the visitor is choosing" and "colour the site
   uses" has to be drawn explicitly.
5. **CLEAR versus the never-writes proof.** Phase 6 and 7 assert zero writes without a click, by
   class, in node and in the browser, and every write is attributable to one of three named clicks.
   A fourth click extends that assertion; it must not weaken it.
6. **Grifter's licence.** Phase 1 gates the licence of every shipped dependency and Phase 3 discharges
   third-party licences into `THIRD-PARTY.md` and `licenses/`. A commercial font needs a resolved
   answer before it is embedded, and `scripts/gen-licenses.mjs` is the gate that will ask.
7. **Phase 9 lands first.** Twenty new configurations arrive before this phase starts, so the browse
   experience D-03 asks for is being designed for thirty-six entries, not sixteen, and the front-door
   ring question (eight today, no Lua entry eligible) is best answered here rather than in Phase 9.

## Open for the user
1. Whether SAFE-01 is retired outright or satisfied by a shorter form.
2. Whether Grifter is licensed for web embedding on a public site, and if not, what replaces it.
3. Whether the front-door ring should grow, or be replaced entirely by the new browse experience.
