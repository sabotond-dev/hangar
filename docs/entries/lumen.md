# LUMEN - the history behind src/lib/catalog/entries/lumen.ts

LUMEN is the colour picker that is the colour it is sending: hue across the pad, depth down it,
the colour under the finger out as six ASCII hex digits over sysex. Its source is
`src/lib/catalog/entries/lumen.ts`. 11-09.2 measured it and left it at 608; 11-10 removed the two
`*127//128` scales and added the sysex half (746); 12-01 drove the depth knob to a fake ZONA's RAM
and read the verdict; 12-11 re-cut the depth arithmetic to subtrahend 32 and gave the cursor and
the two controllers to the touch library (707); 12.1-04 added the library's finger (733). The
entry's own header now carries the mechanism, the wire and the traps; everything the header said
before 13.2-02 - the costings, the depth tables, the verdicts and the ladder - is below, verbatim.

## Moved from src/lib/catalog/entries/lumen.ts on 2026-09-13 (13.2-02)

```text
LUMEN - a colour picker that is the colour it is sending.

Hue runs across the pad, depth runs down it, and the pad paints itself in
the colour it is about to send. There is no legend, because the pad IS the
legend: a lighting operator who has never seen a ZONA can walk past this
card and read it. USE-CASES.md ranks it fifth of forty-four and calls it
"the single most self-evident config on the entire list".

THE MECHANISM, with its 9x9 arithmetic.

  - The cell index is n = 0..80, so the column is n%9 and the row is n//9.
    glag(0, n) is glag(0, x + y*9) written once rather than twice.
  - HUE IS A NINE-ENTRY ANCHOR TABLE, flat: H holds twenty-seven numbers,
    three per column, and column c reads H[c*3+1..c*3+3]. Eight of the nine
    are a hue wheel at full saturation, one step of forty degrees apart and
    offset so that no column lands on a bare primary; THE NINTH IS AN AMBER
    WHITE, 255,230,190, because a lighting desk's most-used colour is white
    and a picker without one is a picker missing its first choice. See the
    colour arithmetic below for what that ninth column is worth in the
    picture.
  - DEPTH IS ONE MULTIPLY AND ONE FLOOR: d = 32 - row*@DEPTH, and every
    channel is anchor*d//32. ROW 0 IS d = 32 AT EVERY VALUE OF THE KNOB, so
    the top row is the anchor colour exactly and IS THE ANCHOR THE WHOLE
    CARD IS READ AGAINST - it does not move, it cannot move, and the card
    copy says so where a visitor reads it. @DEPTH is 1, 2, 3 or 4, so the
    bottom row is d = 24, 16, 8 or 0 out of 32: from three quarters of the
    anchor down to EXACTLY BLACK at the deepest setting. A LARGER @DEPTH IS
    A DEEPER RAMP, which is the way round the label reads.
  - Both layers carry the same colour, because one layer can never exceed
    254/512 of the colour asked for and this card's whole claim is that the
    colour on the pad is the colour on the wire.
  - Every cell's phase is written to 255 once, when F first paints it, and
    the picture's brightness never varies again. A repaint is glc alone plus
    two glp that rewrite the value already there - the phase-set-once shape
    STRIP and LEARN established.
  - `timer: ""`. Once Setup has painted the field NOTHING RUNS AT ALL, which
    makes this the cheapest spectacular card in the catalog: eighty-one
    distinct computed colours for zero recurring cost.

WHAT THE PAD SENDS, AND WHY THE COLOUR GOES OUT AS HEX (plan 11-10, the bench
note "LUMEN: should send HEX in sysex").

THREE MESSAGES, AND SINCE PLAN 12-11 NOT ONE OF THEM IS SENT ON EVERY
SAMPLE.

  @CC     the x coordinate, THROUGH THE LIBRARY'S `A`, only when x moved
  @CC + 1 `127 - y`, THROUGH THE SAME `A`, only when y moved - AN INVERSION
          AND THEREFORE A WIRE CHANGE, see the library section below
  sysex   the colour under the finger, as SIX ASCII HEX DIGITS, whenever the
          library's `Q` returns a cell - which is on a change and on an
          onset, the same two conditions `if n~=s.c or e>3` carried before
          it. So touching the same cell twice still sends the colour twice
          and a desk that missed one gets another without the finger having
          to move.

THE MESSAGE, BYTE BY BYTE, at the top-left cell (anchor 255,90,0, row 0, so
the asked colour is the anchor exactly):

  240  0xF0, supplied BY THIS CONFIGURATION, not by firmware
  125  0x7D, the MIDI non-commercial manufacturer id - the byte a receiver
       reads as "who is this from", and the one id reserved for exactly this
  70   'F'  |
  70   'F'  |  255 -> "FF"
  53   '5'  |
  65   'A'  |   90 -> "5A"
  48   '0'  |
  48   '0'  |    0 -> "00"
  247  0xF7, also this configuration's

`gmss` takes two or more integers and EVERY ONE OF THEM IS ONE PAYLOAD BYTE,
and the caller supplies the 0xF0 and the 0xF7 itself - VERIFIED against
`grid_lua_api.c:905-935` through `../zona-docs/docs/ZONA_REFERENCE.md:1241`
and `:2022`. `grid_decode.c:96-100` warns and transmits anyway when the
framing is missing, which is a good reason to be sure it is there and a bad
reason to rely on the firmware noticing.

WHY ASCII HEX AND NOT A RAW THREE-BYTE RGB PAYLOAD, WHICH IS SHORTER. Both
were costed against this entry's own budget before either was written:

  raw RGB           gmss(240,125,r,g,b,247)          660 at the picker corner
  raw, 7-bit split  each channel as v%128, v//128    693
  ASCII hex         the six digits above             746 as 11-10 shipped it

Those three were measured against each other on the same day and the ranking
is what they are for; the entry itself now costs 733 at that corner - 707
after 12-11 gave the cursor and the two controllers to the touch library,
plus 26 for 12.1-04's finger. The ranking did not move - the sysex half is
the same nine-byte gmss.

SO THE SHORT ONE IS NOT A CANDIDATE, AND THE DECIDING FACT IS NOT TASTE:
SYSEX DATA BYTES ARE SEVEN-BIT. Every byte between the 0xF0 and the 0xF7 has
to be 0..127, because a byte with the high bit set is a STATUS byte and ends
the message where it stands. Row 0 of this pad is the anchor colour exactly,
so the very first thing a visitor touches emits a channel of 255 - and the
52 characters the raw form saves buy a message that is malformed at the top
of the pad and fine at the bottom, which is the worst kind of wrong. The
seven-bit-safe raw split (693) is transmissible but it is not hex, it is not
readable at the other end, and it costs 53 of the 86 characters ASCII hex
costs over it. The user asked for hex; hex is also the only one of the three
that is both legal and legible.

`D(v)` is the whole encoder: `v<10 and 48+v or 55+v`, which is '0'..'9' then
'A'..'F'. Uppercase, because a desk's own display is. There is no string
library on the module and no `:byte` the host would accept, so a sixteen-entry
lookup table would be the alternative and it is longer.

F RETURNS THE COLOUR IT PAINTED. That is the one structural change: `F(n)`
now ends `return r,g,b`, and the touch handler calls it on the NEW cell for
its return value and then paints the cursor colour over the top. The cell is
therefore written twice on a cell change - five firmware calls wasted - and
that is deliberate: the alternative is a second function computing the same
three channels, which 11-10 measured at 766 against its 746. The picture is
identical either way, because glc overwrites both layers and every phase in
the field is already 255.

THE COLOUR ARITHMETIC, CHECKED AT ALL FOUR CORNERS RATHER THAN IN THE
MIDDLE. Channels TRUNCATE rather than clamp, so a 260 renders as 4 and a
negative renders as garbage; both ends have to be proved, not assumed.

  upper bound  every anchor channel is <= 255, d <= 32 and the divisor is
               32, so anchor*d//32 <= 255*32//32 = 255. The maximum is
               attained on row 0 and is exactly the anchor. Nothing can
               exceed 255 because d can never exceed its own divisor.
  lower bound  d = 32 - 8*@DEPTH at the bottom row, which is 24, 16, 8 or
               ZERO - NON-NEGATIVE AT EVERY KNOB VALUE, and zero at the
               deepest one BY DESIGN rather than by accident (plan 12-11;
               the guarantee is now 8*max(@DEPTH) <= 32 WITH EQUALITY
               ALLOWED). Zero is a colour; negative is not, and that is the
               trap: the obvious form, anchor*(@DEPTH-row)//@DEPTH, goes
               NEGATIVE at @DEPTH 6 and a channel TRUNCATES rather than
               clamping, because the row index reaches 8 and a divisor
               smaller than that is a bottom row that is not there.
               Subtracting a multiple from a fixed 32 cannot do that while
               8*max(@DEPTH) stays inside it, and at @DEPTH 5 it would not:
               8*5 = 40 is outside 32, which is why the knob's four values
               are still exactly {1, 2, 3, 4}.
  the corners  top left is the anchor 255,90,0 exactly; top right is the
               amber white 255,230,190 exactly; bottom left at @DEPTH 4 is
               255*0//32, 90*0//32, 0 = 0,0,0 - the bottom row is OFF at the
               deepest setting, which is the one picture nobody can mistake
               for "nothing changed"; bottom right is 0,0,0 for the same
               reason. At the shipped default (@DEPTH 3) the bottom row's d
               is 8, so bottom left asks for 63,22,0 and bottom right for
               63,57,47. All twelve channels inside 0..255.

WHAT THE DEPTH KNOB DOES TO THE EMITTED FRAME, IN BYTES RATHER THAN IN
RATIOS (plan 11-09.2 read it at subtrahend 36; plan 12-11 re-cut it to 32
and re-read it, and these are the 32 numbers).

THE OPTION THE BENCH NOTE WAS COSTED FROM QUOTED A RATIO, AND A RATIO IS THE
ARITHMETIC d/32 - NOT A READING OF A FRAME. Between the arithmetic and a lit
LED sit glc's three colour stops, glp's phase, shapeIntensity, the per-layer
weights, the two-layer sum and the single divide by 512 with its clamp at
255 (pad-sim.ts, render()). So the frame is read, with no gesture, at all
four declared values. Both columns are shown because column 0 is a pure hue
with a ZERO channel and column 8 is the only three-channel column, and the
two truncate differently. * is the shipped default, index 2 of 4.

  column 0, the anchor 255,90,0
             @DEPTH 1   @DEPTH 2   @DEPTH 3*  @DEPTH 4
    row 0    253,89,0   253,89,0   253,89,0   253,89,0
    row 1    245,86,0   237,83,0   229,80,0   221,77,0
    row 2    237,83,0   221,77,0   205,72,0   189,66,0
    row 3    229,80,0   205,72,0   181,63,0   157,55,0
    row 4    221,77,0   189,66,0   157,55,0   126,44,0
    row 5    213,74,0   173,60,0   133,46,0   94,32,0
    row 6    205,72,0   157,55,0   110,38,0   62,21,0
    row 7    197,69,0   141,49,0   86,29,0    30,10,0
    row 8    189,66,0   126,44,0   62,21,0    0,0,0

  column 8, the amber white 255,230,190
             @DEPTH 1      @DEPTH 2      @DEPTH 3*     @DEPTH 4
    row 0    253,228,188   253,228,188   253,228,188   253,228,188
    row 1    245,220,182   237,213,176   229,206,170   221,199,164
    row 2    237,213,176   221,199,164   205,184,152   189,170,140
    row 3    229,206,170   205,184,152   181,163,134   157,141,117
    row 4    221,199,164   189,170,140   157,141,117   126,114,94
    row 5    213,192,158   173,156,128   133,121,99    94,85,70
    row 6    205,184,152   157,141,117   110,99,82     62,56,46
    row 7    197,177,146   141,127,105   86,78,64      30,27,22
    row 8    189,170,140   126,114,94    62,56,46      0,0,0

FOUR VALUES, FOUR DISTINCT 243-BYTE FRAMES, AND THE FOURTH ONE TURNS THE
BOTTOM ROW OFF. That is the whole point of the re-cut: at subtrahend 36 the
deepest setting left the bottom row at 27,9,0, which Probe B confirmed IS
visible on the desk - "column 3 clearly lit" - and which is therefore a
setting a person can look at and call unchanged. Zero is not a dim colour,
it is an unlit LED, and the frame's non-zero byte count falls from 171 to
152 at @DEPTH 4 to say so in a number.

NOTE WHAT THE CORNER PROOF ABOVE IS MEASURING AND THIS TABLE IS NOT. 255,90,0
is the colour ASKED FOR; the frame emits 253,89,0, because both layers carry
the same colour and one layer caps at 254/512 of what it was given. Every
figure in the corner proof is an asked colour, every figure here is an
emitted byte, and they differ by one count. Neither is wrong; they are
different measurements and this card has now had both.

WHY "NO DIFFERENCE IN THE LEDS" WAS NEVER A BROKEN KNOB, AND WHERE THE TWO
EVIDENCE FILES LEAVE IT. Row 0 is d = 32 at every value and CANNOT MOVE -
that is arithmetic, not a defect - so the knob's whole travel is below the
anchor row. The worst channel spread across all four values, row by row from
the top, is now 0, 24, 48, 72, 95, 119, 143, 167, 189: zero at the top and
the full 189 counts of 255 at the bottom. Somebody watching the top of the
pad while turning the knob is reporting what the pad does.

THE VERDICT, QUOTED. `12-01-SUMMARY.md`, which drove the tuner in node and
then read the fake ZONA's own RAM through TRY ON DEVICE:

  "THE VERDICT: A KNOB TURNED IN THE BROWSER REACHES THE MODULE. ... the
   fake ZONA's RAM held a 742-character Setup carrying `d=36-n//9*3` after
   the first click and a 742-character Setup carrying `d=36-n//9*4` after
   the second, with neither carrying the other's literal. ... The wiring is
   SOUND, nothing was fixed here"

SO THE REPORT WAS NOT A HANGAR BUG AND THIS RE-CUT IS NOT A FIX - it is the
honest deliverable under a green verdict. The knob reached the wire, the
module received it, and `PROBE-RESULTS-2026-09-10.md` Probe B settles the
other end of the chain on the user's own module: FOUR DISTINCT BRIGHTNESS
LEVELS across the four depth values, "column 3 clearly lit" at 27, and the
halving ladder 128 / 64 / 32 / 16 "all visible, visibly getting darker". THE
LEDS WERE NEVER THE SUSPECT and the research's sRGB-versus-linear gamma
hypothesis is retired by that line. What is left is what the user was
looking at: the top rows, which cannot move, and a one-step difference at a
default that already ships second-deepest.

WHICH LEAVES A CHOICE OF PICTURE, AND 11-09.2 COSTED BOTH ROUTES WITHOUT
TAKING EITHER. Plan 12-11 takes one of them, on the record:

  move the default   index 2 -> 3 ships the deepest ramp there is for zero
    NOT TAKEN        characters. REFUSED: at 32/32 index 3 turns a row of
                     the card OFF AT REST, and a card that ships with a dead
                     row is a different card. That is the visitor's choice
                     to make with the knob, not the card's to make for them.
                     It also spends the knob's last step, so a visitor who
                     wants deeper has nowhere to go.
  subtrahend 32      TAKEN. d = 32 - row*@DEPTH with anchor*d//32, the same
    SHIPPED          four values, FOUR literals moved in the string (one
                     subtrahend and three channel divisors - 11-09.2 said
                     two, and it is four; count them). CHARACTER-NEUTRAL,
                     measured: 746 at the picker corner before and 746
                     after, exactly as 11-09.2 measured 608 against 608 on
                     the pre-sysex string. The bottom row reaches EXACT
                     BLACK at @DEPTH 4 and the frame falls from 171 non-zero
                     bytes to 152; at the shipped default the bottom row is
                     62,21,0 where it was 84,29,0.

THE DEFAULT DOES NOT MOVE AND {1, 2, 3, 4} DOES NOT MOVE. No knob gained or
lost a value, so the share stamp's shape character is unchanged and no
existing LUMEN link is demoted - measured before and after, and asserted by
stamp.spec.ts's own LUMEN literals still restoring.

WHAT THE RE-CUT COSTS ELSEWHERE, AND IT IS PAID RATHER THAN ASSUMED: every
cell below row 0 changes colour, so frames.json was REGENERATED (72 of the
81 cells move at the default - the nine that do not are row 0, which is the
whole point) and static/og/lumen.png was rebuilt with it.

NOTHING HERE IS HARDWARE-VERIFIED. Every figure above is a statement about
the simulator and this source; the only hardware in this card's file is
Probe B, and it was the user's own bench. THE OBSERVATION THAT SETTLES THE
RE-CUT ON THE MODULE: install at @DEPTH 1, install again at @DEPTH 4, and
COMPARE THE BOTTOM ROW - at 4 it is off - while the top row is the same both
times, by design. That is row 22's neighbour in docs/HARDWARE-AUDITION.md.

THE TOUCH LIBRARY: THIS CARD TAKES `Q` FOR ITS CURSOR AND IT IS THE ONLY
CALLER OF `A` IN THE CATALOG (plan 12-11, src/lib/catalog/library.ts).

THE CURSOR CELL WAS A ONE-UNIT BOUNDARY, the same defect the four cell
sequencers had. `local n=x*9//128+y*9//128*9` reads the naive cell, so
Probe A's Q2 trace - a finger resting on the line sending 71, 72, 71, 72 -
flipped the cursor on every sample, restored one cell, painted another and
RE-SENT THE SYSEX COLOUR each time. `Q(s,i,e,x,y)` answers it with the
library's +-10 hysteresis window and returns the cell ONLY when it changed
or a contact began - the same two conditions `if n~=s.c or e>3` carried, so
the card's behaviour is unchanged everywhere except on the line. Measured
over a six-sample 71/72 wobble: FIVE sysex messages before, ZERO after (one
for the press that starts the gesture, and then silence while the finger
stays on the line).

`s.c` STAYS. It is the CURSOR - which cell is currently painted over - and
that is a different question from which cell a contact is on: the restore
has to know the cell it must repaint even after the library has forgotten
the contact. `Q` owns the second question, `s.c` owns the first.

THE END TEST SITS AFTER THE `Q` CALL, AND THAT ORDERING IS A DECISION. `Q`
expires a contact on an end code and returns nil, so calling it first means
A GENUINE LIFT RELEASES THE CONTACT in the library's own tables; putting the
entry's `if e~=1 and e~=4 and e<9 then return end` in front of it would mean
the library never hears the lift and a stale `H[i]` waits for the next
press. Both cost 707. The end test is KEPT rather than deleted - `A` fires
on `e<4`, so a code this card does not handle would otherwise reach the
controllers - and it still stands between a lift and the two CCs.

THE FINGER IS THE LIBRARY'S GRADIENT IN THE CURSOR COLOUR, ON LAYER 0 (plan
12.1-04; 12.1-CONTEXT D-11, D-13). `G(s,i,e,x,y,0,@CURSORC)` sits between
the `Q` call and the end test and draws the bilinear finger over the 2x2
block of LEDs around the calibrated position, peak 255 dead on an LED, on
layer 0 - the one layer `F` never writes (the field and the cursor cell are
on 1 and 2). THE COLOUR IS @CURSORC, THE ENTRY'S OWN COLOUR KNOB, and not the
palette colour under the finger: `G` takes ONE colour per call, the cursor
knob is what the cursor is, and the research's per-cell palette colour would
need a colour per call that `G` does not take (D-13). So the cursor cell on
layers 1 and 2 and the gradient on layer 0 are the same white (or the same
warm or cool white), and a finger between two LEDs shows both dimly in it.
THE PALETTE `glc` PAIR IS UNTOUCHED: `glc(a,1,@CURSORC,1)glc(a,2,@CURSORC,1)`
still paints the cursor cell at full brightness on both layers, so @CURSORC
now appears THREE times in the Setup (the corner is three characters dearer
than the defaults on it alone). `G` RE-ASSERTS THE COLOUR ON EVERY CALL,
and that is the alert-layer heal: layer 0 is the layer `grid_alert_all_set`
recolours (grid_led.h:7; a CONFIG write, a page discard, a refused page
change, a TX overflow, boot), so a finger coloured once in an init loop
would turn grey or purple after a page switch until the Setup re-ran. There
is no floor - `glc(...,1)` forces the layer's minimum to 0 - so a cell `V`
clears is dark and the field beneath it is exactly as `F` painted it. `Q`
COMES BEFORE `G`, and the order is a measurement (12.1-02): `Q` calls `E` on
every onset and `E` clears the contact's block through `V`, so a `G` drawn
before `Q` is wiped on the press that drew it. `G` COMES BEFORE THE END
TEST for the same reason `Q` does: a lift has to reach it (it clears the
contact's block and returns on `e~=1 and e~=4`; 12.1-03).

`A` IS UNCHANGED, AND SO IS WHAT THE DAW RECEIVES (D-14). `G` reads the
measured map; `A` still sends the RAW sensor `x` and `127-y`, byte for byte
what 12-11 shipped - lua-smoke.spec.ts re-drives 12-11's own gesture and
compares the CC log. THE CONSEQUENCE, WRITTEN DOWN: the sensor's range runs
out about a third of an LED pitch INSIDE the outer LED centres
(calibration.ts section 1), so raw `x` reaches 0 and 127 a third of an LED
inside the outer LEDs, not on them - a finger dead on LED 8 reads 126, on
LED 0 reads 1. A calibrated `A` (`U(x,KX)*127//512`, about +25 characters)
would put 0 and 127 on the outer LEDs exactly and change what every learned
mapping on @CC and @CC + 1 receives; that is a behaviour change to an
instrument and not this phase's to make silently. docs/HARDWARE-AUDITION.md
row 26(d) asks the user whether the CC reaches 0 and 127 where they expect.

`A` IS CALLED OUTSIDE THE `if n then ... end` BLOCK, DELIBERATELY. A finger
moving INSIDE one cell still moves an axis: `Q` returns nil for that sample,
and an `A` placed inside the gate would send nothing at all. That is the
trap 12-VALIDATION R-4 exists for and the one MORPH's weights already hit;
lua-smoke.spec.ts asserts an in-cell MOVE still sends its moved axis, and a
negative check with `A` moved inside the block reddens exactly there.

AND `A` IS A WIRE CHANGE ON @CC + 1, NOT A REFACTOR. Three things move:

  - THE Y CC IS INVERTED. `A` sends `127-y`, because the user's own bench
    snippet does (`map_saturate(y, 0, 127, 127, 0)`): screen y grows
    downwards and a fader does not. This card sent raw y until 12-11. A desk
    with a learned mapping on @CC + 1 will read the axis the other way round
    after a re-install, and docs/HARDWARE-AUDITION.md says so in its row.
  - A DOWN PRIMES WITHOUT SENDING. `A` gates on `e<4`, so the press records
    the starting (x, y) in `P[i]` and sends nothing; the first CC of a
    gesture is now the first MOVE. This card sent both CCs on the DOWN.
  - EACH AXIS SENDS ONLY WHEN IT MOVED. The two `s:gms` calls this replaces
    sat outside every gate and fired on EVERY sample - the flood the probe's
    rule 3 names in those words, "never on every sample". Measured over the
    same six-sample wobble: TWELVE CCs before, SIX after, and the six are
    the axis that actually moved.

`local function D` AND `local function F` SHADOW LIBRARY NAMES INSIDE THIS
CHUNK, AND THAT IS HARMLESS - DO NOT "FIX" THE NAMES. The library defines a
global `D(n,l,w)` (a decay) and this entry declares a local `D(v)` (a hex
digit); it also declares a local `F(n)` while the library defines no `F` at
all. A `local function` is visible only inside the body that declares it, so
this entry's `D` and `F` are its own and the library's `E` and `Q` resolve
their own names in their own chunk. Renaming them would cost characters and
buy nothing. What an entry must NOT do is assign a single-capital GLOBAL the
library owns, which host-surface.spec.ts refuses outright.

NO `X`, AND THE REASON IS THE SAME ONE CONSOLE AND MORPH GIVE. `X(s,n)` is
the Timer-side sweep and THIS CARD HAS NO TIMER (`timer: ""`), so there is
nothing to sweep from. It holds no note and no voice: a contact whose lift
is lost leaves an entry in the library's `H` until the next press by that
id, which `Q` expires first, and the cost of that stale entry is a cursor
that does not move until the finger does. Nothing hangs.

THE LOOK, and why restsBlack is FALSE. Setup lights all eighty-one cells,
and the frame carries 171 non-zero bytes of 243 at every sampled tick.
MEASURED, NOT ASSUMED, AND IT IS NOT THE HIGHEST IN THE CATALOG: the ported
starfield holds 222 to 226 and the hand-authored CHORUS holds a flat 198, so
LUMEN is THIRD. It is the highest of the three configurations landed in this
wave and it is ahead of STRIP's 163, LEARN's 162 and CONSOLE's 99, but a
pure hue is two channels by definition and eight of the nine columns are
therefore two-channel. The ninth column - the amber white - is the only
three-channel one and is worth nine of the 171 on its own, which is a second
reason it earns its place beside the first. 171 IS THE FIGURE AT THE SHIPPED
DEFAULT, and it did not move with the 32/32 re-cut even though every cell
below row 0 changed colour: a dimmer channel is still a non-zero one, and
nothing reaches zero until @DEPTH 4, where the bottom row goes out and the
count falls to 152. frames.json
records the default, so its nonZeroBytes for this entry is still 171 and its
hash is not.

THE TRAPS THIS ENTRY CONTAINS.

  - EVERY DIVISION IS FLOORED. anchor*d//32, n%9, n//9, r//16 and r%16 are
    all `//` or `%`, and so is the `v*9//128` inside the library's own `W`.
    A fraction reaching a firmware call becomes 0, silently.
  - THE CONTROLLERS SEND x UNSCALED AND y INVERTED, AND BOTH ARE FIXES
    RATHER THAN OMISSIONS. They read `x*127//128` until plan 11-10, which
    maps 0..127 onto 0..126 and CAN NEVER EMIT 127 - the same family as
    CONSOLE's 111, on BOTH axes - because 127*127//128 is 126. This entry
    never calls txma or tyma, so the touch range IS 0..127 and a controller
    value IS 0..127: the scale had nothing to scale. Removing it cost MINUS
    eighteen characters (608 at the picker corner before, 590 after) and the
    top of both axes became reachable. Plan 12-11 then moved both sends into
    the library's `A`, which sends x as it stands and y as `127-y`: the full
    range is still reachable on both, and `127-0` is 127 exactly.
  - SYSEX DATA BYTES ARE SEVEN-BIT AND NOTHING IN HANGAR CHECKS THAT. The
    browser host records what a configuration asked to send, byte for byte,
    with no range check and no mask (lua-host.ts, recordSysex - deliberately,
    so a bad byte stays visible). The compiler's own trap scanner does not
    know `gmss` at all: it is not in _pad.ts's OUT_CALLS. So the ONLY thing
    standing between a channel above 127 and a malformed message is this
    entry's choice of encoding and the clause in lua-smoke.spec.ts that
    asserts every emitted data byte is 0..127. Any second entry that sends
    sysex needs its own.
  - COLOUR CHANNELS TRUNCATE, NEVER CLAMP. Proved at all four corners above,
    over the knob's own values rather than at the default.
  - THE DEPTH DIVISOR IS THE LITERAL 32 AND IS NEVER A KNOB, so it can never
    be zero and no channel can go NEGATIVE. @DEPTH is the multiplier, not
    the divisor, and `8*max(@DEPTH) <= 32` WITH EQUALITY ALLOWED is the
    whole guarantee: 8*4 = 32 lands the bottom row on exactly zero, which is
    black and is legal, while 8*5 = 40 would land it on -8, which truncates
    rather than clamping and is not. The knob's four values are what keep
    that true, and lua-smoke.spec.ts reddens if one is widened without the
    other.
  - THE CURSOR RESTORES, IT DOES NOT REPAINT. DO NOT SIMPLIFY THIS to "call
    F over all eighty-one cells". touch_cb has a 1000-microsecond budget at
    100 Hz; eighty-one cells is four firmware calls each, and a handler that
    overruns starts dropping touch samples, so the cursor would stutter
    exactly when the finger moves fastest. Two F calls - one to restore the
    cell being left, one to read the colour of the cell being entered - plus
    a glc pair is the whole repaint, and it is at most two cells per sample.
    The second F was added by 11-10 and is the price of the sysex payload;
    it is bounded by the same "at most two cells" and it fires only when the
    cell changes or a contact begins, never on a move within one cell - and
    since 12-11 not on a move across a cell LINE either, because `Q`'s
    hysteresis holds the cell through the wobble.
  - CODE 9 IS HANDLED, IN TWO PLACES NOW. A fast tap arrives as a single
    DOWNUP 9 with no separate press or lift, and it must both move the
    cursor and send: this entry's filter is the shipped `e~=1 and e~=4 and
    e<9`, and the library's `Q` takes the same code as an onset through its
    own `e==4 or e>8`. Probe A's Q3 measured ten taps as fast as a hand can
    make them and NOT ONE arrived as a 9, so nothing depends on this - it is
    handled because the firmware can produce it, not because a finger does.
  - @CC + 1 < 128 AT EVERY KNOB VALUE. Two adjacent controllers are sent;
    the four values top out at 17, 49, 81 and 103.
  - NO KEEPER AND NO DECAY. The stored Lua holds no glt, no glf and no
    glpfs, so there is no countdown to freeze and no rate to wrap and
    pitfall 1 cannot arise here. That claim is made about THIS ENTRY'S SETUP
    STRING - not about this file, because a header that names a trap
    contains the word it is warning about and a grep over the file counts
    itself, and not about the system element's library string, which defines
    a decay helper this card never calls.

THE HONEST LIMIT, for the card copy. The pad shows the colour it is SENDING,
which is not necessarily the colour the fixture is producing. The desk in
between has its own curve, the lamp has its own gamut, and there is no gamma
correction anywhere in the module's LED path - so two lights that agree on a
number can still disagree to the eye. Comparing the pad against a lit
fixture is row 22 of docs/HARDWARE-AUDITION.md and is the only place that
question can be answered.

ROUTE: kind "lua", not kind "state". The field is eighty-one DISTINCT
COMPUTED COLOURS, and the `look` sheet has no such thing. `look.kind` is one
of none, breathe, shimmer, scan, wave, swirl, ripple, drift and showpiece
(_pad.ts:161-170), and every one of them carries exactly one `colour` plus a
`colourB` that only drift and showpiece read at all (_pad.ts:2624). The
nearest is `drift`, which ramps between those two colours along x and
animates - one axis, two colours, and no way to darken by row. A two-axis
per-cell colour map is not expressible as a PadState.

THE TWO STRINGS BELOW ARE TEMPLATES OVER CANONICAL LUA. Rendered at the
defaults by renderLua they are byte-identical to the canonical text measured
against the pinned minifier: Setup 730 characters, Timer 0, both fixed points
of compressScript and both accepted by checkSyntax. The all-longest corner of
the four-knob cross-product is 733 / 0, leaving 175 free of 908, and the
all-shortest corner is 730 / 0.
src/lib/catalog/lua-entries.sweep.spec.ts asserts every one of those claims.

AT THE RGB444 PICKER CORNER (D-06), WHICH IS THE CORNER THE 908 GATE ACTUALLY
READS: Setup 733 of 908 leaving 175 free (plan 12.1-04; 707 and 201 before
the finger), Timer 0 of 908 leaving the whole 908 - still the most free
Timer in the catalog. THAT IS THE SAME 733 THE
DECLARED CROSS-PRODUCT GIVES, AND IT IS A COINCIDENCE RATHER THAN A RULE:
@CURSORC already declares 255,255,255, which is the longest literal any
picker can write, so this entry's declared corner and its picker corner are
the same point. ARC and MORPH are correct by the same accident; five entry
headers in this catalog are NOT, and quote the declared corner as though it
were the picker one. Do not read this line as the norm. AND 730 IS THE
DEFAULTS FIGURE, NOT A CORNER AT ALL - it happens to equal the all-shortest
declared corner because every default is that knob's shortest literal, and
quoting it as the budget figure understates the cost by three characters.
@CC appears TWICE in the Setup and @CH once - `A(s,i,e,x,y,@CC,@CC+1,@CH)`
is the only site of any of them since 12-11 - which is why the corner is
three characters dearer and not four as it was when two `s:gms` calls named
all three. (@CURSORC appears three times since 12.1-04 and is 255,255,255 at
both corners and at the default, so it moves neither figure.)

WHERE THE 733 CAME FROM, AS A LADDER RATHER THAN A NUMBER (all at the picker
corner, all `max(compressScript(lua).length, lua.length)` after padReady):

  608  as 11-09.2 measured and left it
  590  minus 18, the two `*127//128` scales removed - a FIX that pays
  746  plus 156, the sysex half (11-10): `D`, `return r,g,b`, the second F
       call, `or e>3`, and the nine-byte gmss itself
  746  plus 0, the 32/32 re-cut (12-11) - four literals, same widths
  726  minus 20, the cursor cell through the library's `Q`
  707  minus 19, the two `s:gms` calls through the library's `A`
  733  plus 26, the finger through the library's `G` (12.1-04) - under the
       890 BUDGET_ERROR line (_pad.ts:3076-3078) by 157, and cheaper than
       the pre-coloured shape D-11 replaced because no 81-cell layer-0
       colouring was added to the init loop

The two 12-11 library steps are independent and were measured alone as well
as together: 726 with `Q` only, 727 with `A` only, 707 with both, so the
deltas add exactly. LUMEN now has 175 free on Setup and the entire 908 on
Timer. THE TIMER WAS NEVER TOUCHED, and it is deliberately not where the
sysex went: a Timer that sends on every tick is a different card - it would
emit the cursor's colour a hundred times a second whether or not anything
changed. A colour message belongs to the gesture that chose the colour.

THE LIBRARY IS NOT CHARGED TO THIS 733. `TOUCH_LIBRARY` is 781 of the SYSTEM
element's own 908 (element 255, event 0) and `TOUCH_LIBRARY_TIMER` 705 of
its event 6, both separate budgets from this entry's event 0 on the touch
element - see library.ts section 1.

THE LUA CARRIES NO COMMENTS beyond the nine-character event marker, because
compressScript does not strip them: a trailing comment was measured surviving
verbatim into the budget. Everything worth saying about this configuration is
said here, in TypeScript, where it costs nothing.
```

## Change 17B, 2026-09-23: the Hue and Depth outputs, the cursor received, the pull-in (`BENCH-2026-09-16.txt` sections 17 and 18)

LUMEN sent one pair through the library's `A` - `@CC` for x and `@CC+1` for 127-y on one channel. Per output (answer 3) the two axes are two outputs, "Hue" and "Depth", continuous, each with Type, Channel, Number and Receive. The sysex
colour report is not a MIDI voice output and is unchanged.

- **Knobs.** Hue keeps the old two: `@CC` (`cc`, relabelled "Hue controller") all of 0..127 with its four old rungs
  first; `@CH` (`channel`, "Hue MIDI channel") all sixteen in order (it was 0, 1, 9, 15 under kind `mode`; a saved copy
  at index 2 or 3 reopens on the third or fourth channel). Appended: `@XT` `@XR` (Hue's Type and Receive), `@YT`
  `@YCH` `@YCC` `@YR` (Depth's four; `@YCC` 17 by default - the old `@CC+1` - and not `@CCY`, of which `@CC` would be a
  prefix). LUMEN's captured wild stamp lands `unreadable` (a grown rack, the known pattern); its null default record
  still carries no stamp. The catalog's knob floor now counts every knob (LUMEN keeps two outside its outputs); the
  cap of six still counts the knobs outside them.
- **The send.** `A` sends controllers only on one channel, so LUMEN inlines it: the same per-contact last pair in the
  library's `P[i]`, the same `e<4` gate (a press primes, a move sends), each axis through `M(t,c,n,o)` on its own type,
  channel and number. At the defaults the wire is `A`'s, message for message - `lua-smoke.spec.ts`'s 12-11 comparison
  against a bare `A` still passes. **The library's `A` has no caller now**; `library.ts` is untouched (dropping it would
  move every card's system records), recorded for the next library change.
- **The receive.** The host's message on an output's type, channel and (a controller) number sets that axis of the
  held pair `s.u, s.v` (Depth's value is `127 - y`; the finger writes the pair too), and the cursor moves to the cell
  the pair picks through the calibrated map, `C(N(s.u,s.v))`: the pad shows the colour the DAW's value is. Nothing is
  sent back - no controller, no sysex. The other axis keeps the finger's last value (the top-left before any finger).
- **Where it lives - the pull-in.** The Setup was 733; the typed per-axis send and the receive took a one-event draft
  to 1,009. LUMEN is a still card (the listing says `static`), so an armed Timer is refused (it would read as motion at
  tick 0). The Timer body holds the hex digit, the typed sender and the receive; the Setup declares `local s,M,D=self`,
  defines its handler over them, calls `s:tim()` (the body runs once, synchronously, arming nothing - `33fc889`) and
  takes `M,D=s.m,s.h`. The field paint stays in the Setup (the picture at tick 0 is the Setup's), and `self.f` hands
  the cursor mover to the receive.
- **Latch: already latched** - the whole pad is one control; a finger moving across it is the gesture.
- **Cost:** Setup 730 / 733 -> 878 / 882 (defaults / corner; 26 free), Timer 0 -> 457 / 461. frames.json and the OG
  image unmoved.
- **Proved.** `lua-smoke.spec.ts` "LUMEN: the Hue and Depth outputs ...": no Timer armed; 12-11's gesture sends 16 = 61
  and 17 = 65 on channel 0 as `A` did; a received Hue 0, Depth 0 and Hue 127 walk the cursor to cells 0, 72 and 80,
  nothing sent back (no controller, no sysex), four mismatches ignored; Hue as a pitch bend on wire channel 2 and Depth
  on controller 40 channel 5 sent and received; Hue's Receive Off ignores Hue while Depth still receives.
