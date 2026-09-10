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

## D-06 [user] The page target switches the hardware page — now, not later

Asked because the firmware NACKs any write, read, store or clear that is not on
the **active** page (`grid_decode.c:1272`), and nothing but the module reports
which page that is. Offered read-only for v1 (the spec's own prescription for
this case), read-only-then-switchable, or switching now. **The user chose
switching now**, knowing the cost: a control on a web page changes what the ZONA
on the desk is playing.

**The envelope this ships inside, none of it negotiable:**

- A page switch is a **click**, never a side effect of anything else — the
  never-writes-without-a-click rule of Phase 7 covers `PAGEACTIVE/EXECUTE` too.
- The spec's §9 *destination review* applies: **first use and every destination
  change get an explicit confirmation that names both pages** — *"Switch your
  ZONA to Page 3? It will stop playing Page 1."* This is the spec's own rule, so
  it is not a softening of the user's choice.
- The switch is **ACK-gated**: HANGAR sends `PAGEACTIVE`, waits for the module's
  own page report to confirm, and only then enables Apply. A timeout is
  *unverified*, never *switched*.
- **Snapshots are per page.** PUT BACK restores the page that was snapshotted,
  and the copy says which page that is. If the user switched pages after a
  try-on, PUT BACK names the page it will restore before doing it.
- **One bench row** before it is claimed working: switch, confirm the module
  reports the new page, apply, PUT BACK, switch back, confirm the first page is
  what it was.
- `PAGEDISCARD` (reload the active page from NVM) is researched as the
  firmware-native "revert device preview" and shipped if the bench confirms it.

## D-07 [user] The extra Lua slots get proved early, at the bench

ZONA has **five** 908-character slots per page — system setup, mapmode and timer
plus touch setup and timer — and the firmware registers every event body as a
callable method (`grid_ui.c:373`, `ele[N].name = function(self)…`); its own
defaults already call one from another. If `self:tim()` and `ele[1]:map()` can
be called from Setup, each unlocks 908 more, and the Sandbox gets the split
architecture the research measured: **861 runtime + 366 for the PDF's own
four-element surface**, both inside 908. One ten-minute probe through
`/dev/install/` decides it, **taken before the Sandbox compiler is designed**.
If it fails, Sandbox v1 is faders and buttons only (four faders measured at 697).

## D-08 [user] A Knob is a real rotary gesture

Not the free vertical-drag-with-a-round-graphic. Angle around the region's
centre with a wrap-safe accumulator; `math.atan` is available in the firmware's
Lua. Costed at roughly **+150–200 characters** of runtime plus a per-contact
previous-angle table. On a 3×3 region a full turn is nine cells of travel, so the
minimum sensible Knob region is a question for the compiler, and **it earns a
bench row** — nothing about a rotary gesture on this pad has ever been felt.

## D-09 [user] The CRT, lattice, glyph field, Splash and SCREEN switch are deleted

All of it — roughly 2,000 lines, seven unit tests and five e2e titles. The
SCREEN switch's one real purpose, a visible non-OS motion control that §14 asks
for, is **re-homed under Help & shortcuts**; the purpose survives, the texture
does not. The PDF's intro is flat and solid, so nothing keeps the texture even
there.

## D-10 [user] True circles are exempt from the no-radius rule; rounded rectangles are not

The three genuine circles in the colour picker (rail thumb, two markers,
`border-radius: 50%`) stay round. **The pill (`border-radius: 999px` on a
non-square element) is a rounded rectangle and goes** — every chip becomes a
rectangle. The gate therefore has two halves: a source scan that permits the
literal `50%` and nothing else above zero, and a computed-style check in the
browser that any element carrying `50%` has equal width and height — because a
`50%` on a non-square element is a pill wearing a circle's clothes.

## D-11 [user] The Playground rail shows HANGAR's eight FOR terms; the FEELS filter row goes

Eight rows, not the PDF's four — honest to the catalog, permitted by the spec's
own *"the real configuration schema should determine"*. The FEELS row is
dropped, per the PDF: feel shows as card metadata only.

## D-12 [user] MIX TWO is cut

Built in Phase 10, property-tested, never mounted. Its code and tests are
deleted; the count baseline drops by its tests, and the phase records the
deletion by name so nothing later mistakes it for a gap.

## D-13 [user] Collections ship in v1

Against the recommendation to defer, because the PDF draws them and the user
wants the PDF. They are the one feature in the PDF with no specification behind
them, so the plan has to write one: a storage key, a membership model (may a
config be in two collections?), create / rename / delete with undo, an empty
state, and their interaction with export. **Where that specification has a fork,
the plan asks.**

## D-14 [orchestrator] Adopted from the research without asking, each low-stakes and technical

| Q | Adopted | Why it did not need asking |
|---|---|---|
| Q2 | `/` stays the intro; a local flag turns the first card into *Resume draft* for returning visitors; no redirect | A redirect on a prerendered site flashes the intro first, and `/` is every Discord unfurl's target |
| Q4 | Sandbox surfaces cap at 16 elements with the live budget meter | The meter already exists and is the site's best honesty device; *"room for four more"* beats a hard cap |
| Q4b | The MIDI monitor appears on Lua-driven entries only in v1 | The vendored simulator has no log; adding one is a vendored divergence for a v1 nicety |
| Q5 | Playground knobs stay closed option lists; free-typed numerics live only in the Sandbox | Every knob being a five-bit index is what makes the stamp, the forecast and the sweep possible |
| Q7 | Sandbox surfaces share as an exported file in v1, not a link | A 420-character URL is not a share, and §11 requires export/import anyway |
| Q9 | The PDF's proportions win over the spec's 300px inspector; §13's table is re-derived as fractions | D-01: the PDF is primary on look, and the 2×2 numeric grid does not fit in 300 |
| Q11b | The 27 entry names become title case (`ARC` → `Arc`) | D-05 applied directly; the PDF shows it |
| Q11c | `description` on the card, `quiet` as helper text in the workspace | The card has room for one sentence; both strings are load-bearing and tested |
| Q14 | The wordmark SVG is re-cropped and its fills become `currentColor`; the original stays untouched in `bible/` | One asset then serves header, focus state and print |
| Q15 | New `BUILD-*` and `KEEP-*` requirement families for the Sandbox and persistence; existing rows amended | Claiming the Sandbox was always covered would be false |

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
