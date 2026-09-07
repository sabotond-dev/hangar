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
