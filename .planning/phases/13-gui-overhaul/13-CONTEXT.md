# Phase 13 — decisions

Given by the user on 2026-09-10, when the Phase 10 redesign was judged
insufficient and a total overhaul was asked for. Recorded before any research or
planning, so the planner inherits them rather than rediscovers them.

## D-01 [user] The Bible, and the one standing override

Two documents are the primary source for every GUI decision:

- `bible/HANGAR-ZONA-GUI-design-specification.md` — design proposal, 9 September
  2026, version 1. Twenty sections plus sources.
- `bible/HANGAR for ZONA.pdf` — five screens: intro, Playground gallery, Sandbox
  with a selected Fader, My configs, the Arc workspace.
- `bible/hangar-logo-w.svg` — the wordmark, supplied by the user.

*"Keep what's necessary, remove the unimportant and add everything else that
hasn't been added."* New ideas are welcome; the documents are primary on basics.
**Where a plan is not 100% sure, it asks rather than guesses** — that is the
user's instruction, verbatim in spirit, and it outranks the project's usual
"make the routine call yourself."

**The override: never use rounded corners for anything.** The spec's own §12
geometry — control radius 6px, light cells 2–3px, dialogs 10px — is overridden
to **zero everywhere**. This ships as a **gate**: a test that fails on any
`border-radius` above 0 in shipped CSS, so it cannot regress by habit.

## D-02 [user] Phase 12 first; the overhaul is Phase 13

Phase 12 (the touch framework) was planned and under check when this direction
arrived. It runs first because it is what makes the configurations behave on the
ZONA, and because the Sandbox's region compiler will be built on its library.
The new shell lands roughly one phase later. Chosen over "overhaul first" and
"interleave", both of which were offered with their costs.

## D-03 [user] Sandbox v1 builds, previews AND installs

The spec's own mockup had no firmware execution and its §17 first-release list
does not mention transfer. The user chose the full loop anyway: a Sandbox that
cannot reach the device would be a mockup on the live site, and HANGAR's core
value is that install must work. **This requires a region-to-Lua compiler that
does not exist today** — the largest single piece of new engineering in the
overhaul — composing placed elements (Fader, Button, Knob, XY pad; the spec
flags XY pad as needing confirmation) with geometry and MIDI mapping into the
system-element library plus a touch-element configuration inside 908 per event.

## D-04 [user] Typography stays Grifter + Inter

The spec says a neutral grotesk, or the brand face if licensed. The user keeps
Phase 10's pairing: Grifter for headlines behind one swappable token, Inter for
text. **Grifter's OpenType name table declares PERSONAL USE**; that licence must
be resolved before the site goes public, and the token exists so the swap is
one line.

## D-05 [user] The copy changes register — use the Bible's tone and vibe

*"notice also how copies have changed, use this tone and vibe."* The words are
part of the overhaul, not decoration on it.

**What the Bible's copy does**, read from the PDF's five screens and §16's table:

- **Sentence case, short, second person.** *"Make ZONA your own."* *"Find a
  gesture you love. Build a surface that works the way you do."* *"Find your next
  gesture."* *"Pick up where you left off."*
- **Names the action and its result together.** *"Applied to Page 2. Store on
  ZONA to keep it after power-off."* *"Discover configurations. Try one. Make it
  yours."* *"Arrange controls and choose what each gesture does."*
- **Plain about state, never coy.** *"Preview only. Connect ZONA when you're
  ready."* *"Changes not applied."* *"Stored on ZONA · Page 2."* *"The device
  stopped responding. Your draft is safe; device state could not be verified."*
- **Reassuring where the stakes are real, in one clause.** *"Reset Page 2 to its
  firmware default? Your browser draft will remain available."*
- **Uppercase only for short section labels and breadcrumbs** — `PLAYGROUND /
  CONFIGURATIONS`, `YOUR LIBRARY`, `SELECTED ELEMENT / FADER` — never for
  sentences, headlines or instructions. Headlines are large, sentence-case and
  warm; the eyebrow above them is the small uppercase line.
- **Verbs on buttons, plainly:** *Explore*, *Apply to ZONA*, *Save copy*, *Share
  snapshot*, *Resume draft*, *New surface*, *Connect ZONA*.

**What it replaces.** Phase 10's register was terse, all-caps and instrumental
— `TRY ON DEVICE`, `KEEP ON DEVICE`, `PUT BACK`, `CLEAR`, `START EXPLORING`,
`Nothing is written without a click.` Every one of those strings, and the
measured-length honesty caps that governed them, is superseded. The *facts* they
carried survive in the new words: RAM versus flash, the snapshot, the firmware
default, the promise that nothing writes without a click. The spec's §16 table is
the reference for each; where a state has no line there, write one in the same
register and flag it for the user.

**Non-negotiables that carry over regardless of tone:** no apostrophe-free
contractions faked with straight quotes (the Bible uses real apostrophes —
*you're*, *you've*); no exclamation marks; no emoji; no uppercase paragraphs.

## What the spec leaves open that HANGAR has already settled

Section 19 lists open technical decisions. Several are answered by earlier
phases and must not be re-opened:

| Spec §19 question | Settled by | Answer |
|---|---|---|
| Transport, permissions, browsers | Phase 6 | Web Serial, feature-detected; Chromium and Firefox 151+; never Web MIDI for configuration |
| Apply temporary vs persistent vs separate Store | Phase 7 | Two operations on real acknowledgements: TRY ON DEVICE writes RAM, KEEP ON DEVICE stores to flash; PUT BACK restores the snapshot; CLEAR restores the firmware default |
| Number and addressing of pages; writing inactive pages | Phase 12 research + this record | `PAGEACTIVE_PAGENUMBER` and `PAGECOUNT` exist in the pinned protocol, so a target page is a **real control**; whether writes can target an inactive page is a Phase 13 research question |
| Can the device be read back and compared | Phase 7 | Yes — the snapshot fetches both events and the store classifies the result |
| Faithful reproduction vs approximation | Phases 3, 8 | The preview runs the configuration's own Lua in a vendored, firmware-faithful simulator; the label must say "simulation" where the touch model differs (see Phase 12's probe) |
| Region coordinate system, granularity, overlap, element types | **open** | Phase 13 research, against the firmware and Phase 12's library |
| Local recovery format, import/export schema, migration | **open** | Phase 13 research; the existing stamp codec and its `older` landing are the precedent |
| Share visibility and accounts | spec + user | No accounts; the existing share stamp is the immutable snapshot; "opening a link creates an editable copy" is the spec's rule |

## Not supplied

The spec names a companion `HANGAR-ZONA-design-tokens.css`. It was not supplied;
§12's table carries every value and is sufficient. If the user has the file, it
belongs in `bible/`.
