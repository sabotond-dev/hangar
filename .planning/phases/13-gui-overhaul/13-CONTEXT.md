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

## D-15 [user] Six true circles are exempt, by file and line

The plan-check found three `border-radius: 50%` declarations D-10 had not
named: `Knob.svelte`'s dot rail (8×8, `:598`), slider thumb (12×12, `:653`) and
home mark (2×2, `:674`) — genuine circles on square boxes, and the PDF draws the
`Movement rate` slider with a round lime thumb and the Sandbox Knob as a circle.
**The user extended D-10 to all six.** The rule is unchanged — true circles
only, rounded rectangles never — and the gate counts **exactly six**, listed by
file and line: `ColourPicker.svelte:829, :857, :872` and `Knob.svelte:598, :653,
`:674`. A seventh `50%` anywhere fails the gate until it is added here by name.

## D-16 [user] The action colour is the Bible's `#DCFF71`

Not HANGAR's `#D6FF4E` from Phase 4. Every accent changes by a few points of hue
and lightness; §12's contrast figures were computed against `#DCFF71` and hold.
`IDENT-01`'s *"~#D6FF4E"* clause is amended by name at the gate.

## D-17 [user] The type scale is the PDF's measured sizes: 36 / 30 / 17

Page title, panel title, group title — measured off the PDF at 1440, about 20%
above §12's written 28–32 / 20 / 14. D-14 Q9 had settled only the inspector
width on PDF authority; the planner extended it to the type scale and, per D-01,
asked rather than assumed. **The user chose the PDF's.** §12's figures are
recorded as overridden by measurement, and `layout.ts`'s header (13-05's single
source) carries the measured scale with this decision cited.

## D-18 [user] The third slot gets its bench row

13-02's one remaining question, answered before the plan runs. The Sandbox
runtime was costed at about 861 **before** D-08's rotary Knob (+150–200), and
the Timer slot also carries Phase 12's expiry sweep; a surface mixing all four
element kinds comes to roughly 1,030–1,080 against 889 usable. **The PDF's own
page-3 surface — a 2×6 Fader, an XY pad, a Button and a Knob — does not fit in
two slots and does fit in three.** Offered: ship on two (at the risk of reversing
D-08 and deferring the XY pad, neither an executor's call), take the second
probe, or write the row and defer. **The user chose the second probe.**

**The probe is `SLOT-PROBE-2.md`**: the system element's fourth event (255/4,
the slot the firmware names for the utility button and defaults to page-next)
defines a global; the touch Setup calls it through `ele[#ele]` on the first tap
and lights one of three cells. **HANGAR never writes 255/4 by design** (12-02's
constants say why), so the probe's system half goes in through **Grid Editor**,
not `/dev/install/`; the touch half can use either. Nothing is stored — a power
cycle restores the utility button.

**Every figure the decision rested on descends from an unrun sketch** and is
superseded by 13-15's VM-measured runtime; if that lands lower than the ceiling
chosen here, 13-15 asks again.

## D-19 [user] HANGAR can do anything the Editor can — the new standing rule

Given 2026-09-10, on being told that HANGAR refuses to write the system
element's fourth slot by a constant 12-02 wrote with a reason:

> *"Overwrite this rule. Hangar can do anything the Editor can, this is the new
> rule."*

**This is project-wide and it outranks every HANGAR-invented capability limit.**
Grid Editor is the reference: if the Editor can address an element, an event, a
page or a command, HANGAR may too. Specifically retired:

- **12-02's refusal to write 255/4 and 255/6** (the system element's utility and
  timer events). The constant, its header reason (*"a web page must not silently
  change what a physical button does"*) and the assertion that those events never
  appear in a frame are **superseded**. The Sandbox install writes 255/4 like any
  other event. Phase 12 is mid-execution and no Phase 12 plan needs the slot, so
  the code change lands where it is first needed — **13-17** — and 12-12's gate
  must not restate the refusal as a virtue. Until 13-17, the constant's header is
  wrong and says so is the next reader's warning: it is a *pending removal*, not
  a rule.
- Any future "HANGAR does not do X" where the Editor does X. A plan that wants
  to refuse a capability the Editor has must cite this decision and ask.

**What the rule does NOT retire, and why — stated so nobody strips these by
analogy:**

- **HANGAR's safety *features*.** Snapshot before write, PUT BACK, ACK before
  "done", nothing written without a click, RAM before flash. None of these
  limits what HANGAR can do; each adds something the Editor does not have. PUT
  BACK now also restores 255/4's default after a Sandbox install, because the
  snapshot covers what HANGAR wrote.
- **The Bible's own UX rules.** §9's destination review — a named confirmation
  before the first apply and before every destination change — is the spec's,
  not HANGAR's, and the user asked for the spec. It is the one place the Bible is
  *stricter* than the Editor. **It stays unless the user says otherwise**, and it
  is flagged here as exactly that so the user can strike it in one word.

**Consequence for D-06's envelope:** the *capability* to switch pages was never
in question after this rule; the envelope's click, review, ACK gate, per-page
snapshot and bench row are safety features and the spec's review, and stand.

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
