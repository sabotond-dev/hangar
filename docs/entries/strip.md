# STRIP - the history behind src/lib/catalog/entries/strip.ts

STRIP is the big fader up the pad and the crossfader along the bottom, two seven-bit controllers
that cannot move each other. Its source is `src/lib/catalog/entries/strip.ts`. 11-13 rewrote it
from the fourteen-bit vernier card on the bench note "this is just an XY pad": the trade named as
a loss, the three-control reading costed at 1088 and rejected, the onset lock and the clamp
measured (803 / 864 / 875 at the picker corner), the ten-bit unlock kept for a better-stated
reason. The entry's own header now carries the mechanism, the wire and the traps; everything the
header said before 13.2-02 - the trade, the readings, the unlock arithmetic, what was borrowed
from CONSOLE and the two-corner budget - is below, verbatim.

## Moved from src/lib/catalog/entries/strip.ts on 2026-09-13 (13.2-02)

```text
STRIP - one big fader up the pad, one crossfader along the bottom, and
neither of them can move the other.

THE TRADE, NAMED FIRST, BECAUSE IT IS A LOSS AND NOT AN UPGRADE.

The bench note reads: "STRIP: this is just an XY pad, it should be two
faders, one crossfader at the bottom and the big one, sending midi
independently". The old STRIP combined both axes into ONE FOURTEEN-BIT
CONTROLLER - `glim(v*8+f,0,16383)` on mode 1 - and the bottom row was a
VERNIER that moved the last three bits of it. That is what "just an XY pad"
was reporting: two axes tied into one number, so neither axis was a control
of its own.

Both go, and both are losses worth stating in the same breath as the fix:

  1. THE FOURTEEN-BIT STREAM. One controller carrying 0..16383, expanded by
     firmware into a coarse/fine CC pair. It is gone. STRIP now sends TWO
     ORDINARY SEVEN-BIT CONTROLLERS, which is exactly what the note asks for
     and is still an eight-hundred-fold cut in resolution on the number that
     mattered. HANGAR no longer ships a single worked example of mode 1.
  2. THE VERNIER. A fine-adjust row is an elegant use of a row most cards
     waste, and THE CROSSFADER NOW WANTS THAT ROW. The two designs cannot
     coexist on nine rows: the vernier and the crossfader are both "the
     bottom row, read across", and only one of them can have it.

What is NOT given up is the ten-bit unlock, and the reason is measured
rather than preferred. See below.

TWO CONTROLS, NOT THREE, AND THE SENTENCE IS THE REASON. "two faders, one
crossfader at the bottom and the big one" is a count followed by an
apposition naming the two things counted: one of them is the crossfader at
the bottom, the other is the big one. Reading it as three - two vertical
faders PLUS a crossfader - contradicts its own "two faders" and leaves "the
big one" without a referent. The three-control layout was written out and
costed anyway, because a reading that cannot be priced is a reading nobody
can argue with: it is 1088 characters of 908 at the picker corner, ONE
HUNDRED AND EIGHTY OVER, and the only way to fit it is to move the repaint
into a Timer - which reclassifies a card of static faders as `animated`.
Recorded in 11-13-SUMMARY.md with the number, so a future wave that wants
three controls starts from a measurement.

THE LAYOUT.

  - ROWS 0..7, ALL NINE COLUMNS: the big fader. Seventy-two cells, the whole
    pad bar one row. "The big one" is taken literally.
  - ROW 8, ALL NINE COLUMNS: the crossfader. One row, because a second row
    buys a crossfader NO RESOLUTION AT ALL - it reads x, and height is target
    area, not travel - while costing the fader an eighth of its picture. The
    two-row variant was costed at the same figure and rejected on that
    ground rather than on price.

EACH GESTURE IS LOCKED TO THE CONTROL IT STARTED ON, AND THAT IS WHAT
"INDEPENDENTLY" MEANS HERE. self.o[i] records, at the ONSET of contact i,
which of the two controls that finger is driving, and every later sample of
that contact goes to the same place. Drag off the bottom of the fader and
across the crossfader row and THE CROSSFADER DOES NOT MOVE - which is the
defect a bare `if y>910` layout has, because the fader's zero end is exactly
where the crossfader begins. Costed: the lock is 61 characters (864 against
803 without it, before the clamp below) and it is the difference between two
controls that merely send different controllers and two controls that cannot
interfere.

THE LOCK BUYS ITS OWN BUG, AND IT WAS MEASURED RATHER THAN REASONED ABOUT.
Locking a contact to the fader means the FADER BRANCH CAN NOW SEE y > 910 -
the very samples the unlocked layout would have handed to the crossfader -
and `(910-y)*127//910` on those floors NEGATIVE. Driven through the real Lua
host, a drag that started at y = 800 and continued to y = 1023 put
`15,14,...,1,0,-1,-2,...,-16` on controller @CC: sixteen negative controller
values, no error raised anywhere, and every gate in the tree green.
`glim(...,0,127)` is the fix, it is eleven characters, and it is the reason
the shipped Setup is 875 at the picker corner rather than 864.

  - `s.o[i]==nil` is in the same onset test, for the neighbouring hole: a
    MOVE for a contact whose onset was never delivered would otherwise take
    the fader branch by default. Fourteen characters. Between them the two
    guards close every path that could put a number outside 0..127 on the
    wire, and the second half of the full-scale test asserts exactly that.

THE TEN-BIT UNLOCK SURVIVES, AND THE PLAN'S REASON FOR KEEPING IT IS THE
WRONG ONE. `self:txma(1023) self:tyma(1023)` costs 44 characters here - it
was measured at 864 against 820 on the pre-clamp draft, the wider literals it
forces included - and the arithmetic that justifies it is not about
continuity:

  - Firmware reports a locked axis as 0..127 by dividing the native 0..1023
    by eight. A control that owns a WHOLE axis and sends seven bits is
    therefore already at full resolution: unlocking it multiplies the input
    by eight and the code divides it straight back down. THE CROSSFADER IS
    EXACTLY THAT CASE, and the entry says so IN THE CODE - it sends `x//8`,
    which is character-for-character what firmware would have handed it had
    the axis stayed locked. The unlock buys the crossfader NOTHING.
  - A control that owns a FRACTION of an axis is the case where it pays. The
    fader owns rows 0..7 of nine, so on a locked axis its travel is y in
    0..113 - a hundred and fourteen positions - and `(113-y)*127//113` can
    only ever emit 114 of the 128 codes. Unlocked, the same eight rows are
    y in 0..910, nine hundred and eleven positions, and `(910-y)*127//910`
    reaches EVERY ONE OF THE 128. The unlock buys back the codes the missing
    ninth row took away.

SO THE TEST IS "WHAT FRACTION OF THE AXIS DOES THIS CONTROL OWN", NOT "IS
THIS CONTROL CONTINUOUS". A nine-cell grid card should still never spend it -
7-bit quantisation locates a nine-cell column boundary to within 0.07 of a
cell and unlocking improves that to 0.009 of a cell, which is imperceptible -
but a partial-axis seven-bit fader is a real customer for it. HANGAR keeps
its only worked example of `txma`/`tyma`, and it keeps it for a better stated
reason than it had.

AND BOTH AXES ARE UNLOCKED THOUGH ONLY ONE NEEDS IT. Firmware has separate
touch_x_max and touch_y_max, so unlocking y alone is legal on hardware. It is
NOT legal in the preview: `src/lib/sim/lua-host.ts:713-719` keeps ONE
_coordMax for both axes and sets it from whichever call arrives, so a card
that unlocked y alone would be simulated with a ten-bit x it does not have on
the module. Fifteen characters buys agreement between the simulator and the
firmware, and a divergence nobody would find for months is not worth fifteen
characters. Recorded as a finding in 11-13-SUMMARY.md.

THE ARITHMETIC, AND EVERY DIVISOR DERIVED FROM WHAT ITS CONTROL OWNS.

  - ROW = y*9//1024, so row 8 is y >= 911 and rows 0..7 are y in 0..910.
    910 IS THEREFORE BOTH THE BOUNDARY AND THE DIVISOR, and that is not a
    coincidence to be tidied away: the fader's last position and the scale
    that maps it to zero are the same number by construction.
  - FADER VALUE = glim((910-y)*127//910,0,127), which is 127 at y = 0 (the
    top of the pad) and 0 at y = 910 (its last row), because +y RUNS DOWN
    on this module (ZONA-CAPABILITIES.md 2.2). Both ends are exact, and the
    clamp is what keeps the low end AT zero rather than below it. THIS IS
    THE DIVISOR CONSOLE GOT WRONG: `h*127//8` over a reachable h of 0..7
    tops out at 111, and 11-07 fixed it to //7 because the mute row owned
    the top of the travel. The same rule, applied here: the crossfader owns the bottom row,
    so the fader's divisor is 910 and not 1023.
  - CROSSFADER VALUE = x//8, 0..127 over the full width, both ends exact and
    every code reachable, because this control owns the WHOLE x axis and
    needs no scaling at all. The contrast with the fader's 910 is the point:
    a divisor is a statement about what a control owns.
  - BAR HEIGHT k = v*9//128, which is 0..8 over the eight body rows: row r is
    lit when r >= 8-k. NINE HEIGHTS OVER EIGHT CELLS, including "none lit" at
    v = 0 and "all eight" at v = 127, so the picture reaches both ends too.
  - MARKER COLUMN c = x*9//1024, 0..8 across the crossfader row.
  - A repaint is gated on k or c CHANGING, so a slide inside one cell's
    travel sends its new value and paints nothing. DO NOT REMOVE THE GATE.
  - A send is gated on the VALUE changing, so a finger resting inside one
    coordinate sends nothing. The host's own change gate drops identical
    samples before Lua sees them; this gate is the one that stops a wobble of
    one raw unit re-sending the same controller value.
  - `timer: ""`. Nothing advances on its own; the declared motion is
    `static` and the fixture agrees.

WHAT WAS BORROWED FROM console.ts, NAMED RATHER THAN REINVENTED. Three
things, and the third is a correction of it:

  1. THE RAIL-AND-LEVEL TREATMENT. A bright level colour over a dim body, so
     the control reads as a fader with a body rather than as a bar floating
     in nothing, and a THIRD colour spent on a functional marker rather than
     on decoration - CONSOLE's mute cap, STRIP's crossfader.
  2. THE ONE-PASS GATED REPAINT. Every cell written exactly once, never
     erase-then-paint: firmware has no double buffer and a two-pass repaint
     can tear.
  3. THE FULL-SCALE LESSON, which is the one that cost CONSOLE a bench note.
     See the divisor paragraph above.

The crossfader's TRACK is the 11-12 borrow rather than the CONSOLE one: the
whole row carries the crossfader's own colour at PHASE 51, one fifth of the
marker's 255, so the control is legible at rest - it says "I am a strip and
the bright cell is where I am" before anybody touches it. The two controls
are distinguishable by SHAPE as well as by hue, which matters because both
hues are knobs a visitor can set to the same value: the fader is a solid
block growing from the bottom, the crossfader is a dim line with one bright
cell. `src/lib/sim/lua-smoke.spec.ts` asserts that difference, which is the
first assertion in this repository that two controls draw distinguishable
pictures (D-11-12-b).

THE PHASES FOR ROWS 0..7 ARE WRITTEN ONCE IN SETUP and never again - the
fader's repaint only changes colours. Folding that loop into the repaint
would save 34 characters and double the firmware calls per repaint from two
per cell to four, on seventy-two cells, under a moving finger. The 34
characters are spent on purpose.

THE TWO CONTROLLERS. @CC and @CC + 1, so EVERY value of the knob must
satisfy @CC + 1 < 128. The four shipped values are 1, 7, 11 and 16, whose
partners are 2, 8, 12 and 17 - modulation/breath, volume/balance,
expression/effect-1 and general-purpose 1/2. All four pairs are conventional
pairs, which is luck rather than design: the values are UNCHANGED from the
fourteen-bit card, where they were constrained to 0..31 because mode 1 sent
the low byte on @CC + 32. THAT CONSTRAINT IS GONE WITH MODE 1 and the values
stay anyway, so that a stamp captured before this rewrite decodes to the same
four controllers it always did.

THE LOOK, and why restsBlack is FALSE. Setup paints the fader at v = 63 -
four rows lit of eight - and the crossfader at its centre cell, so the card
arrives as a half-open fader over a dim rail with a marked strip beneath it,
rather than as a black square. THE RESTING STATE IS A REACHABLE STATE: v = 63
gives k = 4, and c = 4 is where x = 511 lands, so nothing in the picture
claims a position the pad cannot be put in.

THE TRAPS THIS ENTRY CONTAINS.

  - @CC + 1 < 128 AT EVERY KNOB VALUE. The arithmetic is checked at the
    largest value, not at the default.
  - EVERY DIVISION IS FLOORED. //1024, //910, //128 and //8 are all `//`. A
    fraction reaching a firmware call becomes 0, silently.
  - THE NEGATIVE-VALUE PATH, closed by `glim` and by `s.o[i]==nil`. It was
    OBSERVED, not anticipated: sixteen negative controller values reached the
    wire in the first probe of the shipped layout. Named above.
  - COLOUR CHANNELS TRUNCATE, NEVER CLAMP. 260 renders as 4. Every channel of
    every value of @BARC, @XFC and @RAILC is inside 0..255 by construction.
  - CODE 9 IS HARMLESS HERE, AND THAT IS WORTH SAYING RATHER THAN LEAVING A
    READER TO HUNT FOR THE NOTE-OFF. A tap sets a value; a fader has nothing
    to release. The live filter is the blessed spelling
    `e~=1 and e~=4 and e<9 then return`, which lets a DOWNUP 9 through as a
    normal sample, and the onset test beside it is `e==4 or e>8`, which
    admits it. The only per-contact state is s.o[i], and it is OVERWRITTEN by
    the next onset rather than cleared by a lift - so a dropped release
    cannot strand anything.
  - NO KEEPER AND NO DECAY. Nothing writes glt, glf or glpfs, so there is no
    countdown to freeze and no rate to wrap.
  - THE KNOB ID `vernier` IS A STALE NAME ON PURPOSE. There is no vernier
    any more; the knob is the crossfader's colour and its label and token say
    so. src/lib/share/fixtures/wild-stamps.json keys STRIP's captured
    `xn33333` on that id and stamp.spec.ts asserts the decoded indices equal
    it, so renaming the id would break a fixture whose whole value is that it
    was never regenerated. CHORUS's `@SPREAD` carries the identical note for
    the identical reason; SHUTTLE's `arc` and `rest` did too, until plan
    12-04 removed that entry. THE LABEL CARRIES THE MEANING; THE ID IS
    HISTORY.

THE HONEST LIMIT, for the card copy. Two things.

  1. THE FADER SENDS FINER THAN IT DRAWS. A hundred and twenty-eight values
     through eight cells: the bar moves once every sixteen values, and
     between two steps of the picture the controller is still moving. That is
     what a fader with an LED bar is, and it is the same honest limit the
     fourteen-bit card had, one order of magnitude smaller.
  2. IT CANNOT SHOW WHAT THE OTHER END IS DOING. Nothing in this phase
     receives (D-04), so the pad shows the value YOU set and never the value
     the desk is at.

ROUTE: kind "lua", not kind "state". `sends.faders` is typed `3 | 4`
(_pad.ts:290), so a two-control layout of one whole-pad fader plus a
crossfader is outside the vocabulary by a literal type; and there is no
per-control axis assignment anywhere in that sheet - the compiler's fader
branch splits ONE axis into three or four equal columns and has no way to say
"these eight rows are one control and that row is another".

THE TWO STRINGS BELOW ARE TEMPLATES OVER CANONICAL LUA. Rendered at the
defaults by renderLua they are byte-identical to the canonical text measured
against the pinned minifier: Setup 857 characters, Timer 0, both fixed points
of compressScript and both accepted by checkSyntax.

TWO CORNERS, AND THE BINDING ONE IS NOT THE PALETTE'S. The all-longest corner
over the five DECLARED palettes is 865 / 0; the all-longest corner a VISITOR
CAN ACTUALLY REACH is 875 / 0, LEAVING 33 FREE OF 908, because D-06 lets the
colour picker write any of the 4,096 RGB444 literals and 255,255,255 is
longer than two of the three colour knobs' longest declared values. THREE
colour tokens, each occurring twice.
src/lib/catalog/lua-entries.sweep.spec.ts gates the PICKER corner - that is
the number 908 is checked against - so it is the one this header quotes and
the one every margin in 11-13-SUMMARY.md is stated at. The all-shortest
corner is 853 / 0.

THE LUA CARRIES NO COMMENTS beyond the nine-character event marker, because
compressScript does not strip them: a trailing comment was measured surviving
verbatim into the budget. Everything worth saying about this configuration is
said here, in TypeScript, where it costs nothing.
```
