# CHORUS - the history behind src/lib/catalog/entries/chorus.ts

CHORUS is the nine diatonic triads on nine 3x3 pads, one chord at a time, a bloom expanding from
the pad you hit. Its source is `src/lib/catalog/entries/chorus.ts`. 08-05 authored it; 11-02
moved the bloom to the computed decay form (the rate fixed at 4, the timeout derived from the
start, @BLOOMRATE becoming @SPREAD); 12-09 made it a single voice on the bench note "the pads
should be exclusive", defined `R` and handed the watchdog to the library's `X` (Setup 771 to
796, Timer 174 to 29); 12.1-04 added the white finger (822). The entry's own header now carries
the mechanism, the wire and the traps; everything the header said before 13.2-02 - the frozen
pair's arithmetic, the two consequences, the bench note verbatim and the before / after table -
is below, verbatim.

## Moved from src/lib/catalog/entries/chorus.ts on 2026-09-13 (13.2-02)

```text
CHORUS - nine diatonic triads, and every one of them blooms.

The 3x3 pad layout is the only division a 9-wide grid does honestly: three
LEDs per pad, 0.19 LED of boundary error. Setup bakes nine triads out of a
seven-note scale table - degree z, z+2 and z+4, wrapped with an octave lift -
so the module never computes a scale degree at play time. At the default key
of 48 in C major the nine pads are C, Dm, Em, F, G, Am, Bdim, C(8va) and
Dm(8va), which is a whole diatonic harmony generated in 130 characters.

The look is a blue/violet chessboard on layer 1, painted at phase 255 from
Setup - which is why restsBlack is false - and, on every press, a warm amber
bloom expanding outward from the pad you hit. The bloom is 81 glpfs calls in
one burst and then zero Lua for up to 0.64 s: the LED engine's own
phase-from-start argument does the expansion, and math.sqrt of the cell's
distance from the pressed pad is what makes it a circle rather than a square.

THE BLOOM USES THE COMPUTED DECAY FORM, AND IT MUST (plan 11-02, class A).
The starting phase is per cell, so a FIXED timeout cannot land it on zero:
glpfs walks the phase around a 256-value ring with `pha += fre` on a uint8_t,
and whatever phase the countdown expires on is where the cell stays, forever.
The shipped pair was start 255 - dist*22 with rate @BLOOMRATE and glt 64, and
@BLOOMRATE * 64 mod 256 is 0 for every multiple of four - so every one of the
81 cells froze at exactly the brightness it opened on and the whole pad kept
a permanent amber wash. That is the bench report "colour stucks after
touching it", word for word.

The form it now uses is the one src/lib/catalog/decay-idiom.spec.ts's header
carries, rescued out of gridlock.ts before that file was deleted: DERIVE THE
TIMEOUT FROM THE START.

    local w=glim(248 - dist*@SPREAD//4*4, 0, 248)
    glpfs(a,2,w,4,0)  glt(a,2,(256-w)//4)

The rate is fixed at 4, w is a multiple of 4 by construction, and
w + 4*((256-w)/4) = 256 = 0 for every cell. glim is not decoration: it holds
w inside 0..248 so the timeout stays inside 2..64 and can never be the 0 that
CANCELS a countdown rather than scheduling one.

TWO CONSEQUENCES, both real and both stated rather than discovered later.
The leading edge is very slightly dimmer, because the start is a multiple of
four capped at 248 instead of 255 - frames.json records the new picture. And
the bloom now passes ONCE and dies, where the old pair cycled the ring for a
fixed 0.64 s and could show two or three ripples at a high rate. That is the
fix, not a side effect: the third ripple was the one that never went out.

---------------------------------------------------------------------------
ONE CHORD AT A TIME, AND THE PADS ARE EXCLUSIVE (plan 12-09)
---------------------------------------------------------------------------

THE BENCH NOTE, VERBATIM: "CHORUS: egyszerre csak egy akkordot tudjon
kuldeni, exkluzivak legyenek a padok" - it should only be able to send one
chord at a time, the pads should be exclusive.

It used to hold a chord PER CONTACT: self.z[i] was the pad contact i had and
self.t[i] its own watchdog counter, so two fingers on two pads sounded six
notes and five fingers sounded fifteen. The shape is now a SINGLE VOICE:

  s.z  the pad that is sounding, or nil
  s.c  the contact that owns it, or nil

A press on a different pad releases the sounding chord and starts the new
one, IN THAT ORDER, so the receiver never hears two triads overlap. A press
on the pad already sounding re-owns it (s.c = i) and re-triggers nothing,
which is what makes a slide between pads legato and a second finger on the
same pad harmless.

R IS THE LIBRARY'S RELEASE CONVENTION AND E REACHES IT ON THREE PATHS.
src/lib/catalog/library.ts section 3: an entry that holds notes sets
`R=function(s,i)` in its own Setup, and the library's `E` calls it on an end
code, on a stale press by another contact, and on the Timer sweep - plus, per
12-07's finding, on EVERY onset, including a contact's first press. So R IS
WRITTEN IDEMPOTENT: it returns unless s.c is the contact being expired, and a
note-off for a chord that was never on can never leave. An R that sent an
unconditional note-off would fire on every first press.

THE PRIVATE WATCHDOG IS GONE AND X(self,20) IS ALL THAT IS LEFT OF IT. The
old Timer walked s.z, counted 100 ms ticks per contact and released after
twenty; the library's sweep does exactly that for every caller, so the Timer
shrank from 174 characters to 29. THE WINDOW IS UNCHANGED: twenty calls at
gtt(0,100) is two seconds, the same figure the private watchdog carried, and
it stays the honest limit worth knowing - hold a chord dead still for two
seconds and it releases. The window is the CALLER'S argument by the library's
own contract (library.ts section 5), and the bench row in 12-12 is what moves
it, because only a desk can say whether a real finger goes quiet.

A PAD BOUNDARY IS A CELL BOUNDARY, WHICH IS WHY THE HYSTERESIS COMES FREE.
A pad is 3x3 cells - z = n%9//3 + n//9//3*3 - so every boundary between two
pads is also a boundary between two cells, and `Q`'s per-axis hysteresis
(since 12.1, a hold band of 45/64 of the LOCAL LED pitch on the measured map -
eight raw units between LED 4 and 5, three on the outer x segment, D-18) is
therefore ZONE hysteresis for this card at no extra cost. A finger resting on
the line between two pads holds one chord instead of retriggering both, which
is the same defect PROBE-RESULTS-2026-09-10.md Q2 measured on the sequencers.

The other honest limit belongs in the card copy: a new press REPLACES the
bloom rather than stacking it, because layer 2 is one field and the second
burst overwrites the first. Sliding between pads is legato by construction.

THE ENTRY CARRIES NO EVENT-CODE GUARD OF ITS OWN ANY MORE, and that is a
DELEGATION rather than a removal. It used to write "e==3 or e>=5 and e<9" -
class B, plan 11-02, +8 characters - because firmware coalesces a sub-cycle
press-and-lift into ONE message with code 9 and a bare "e>=5" read that fast
tap as a lift, so a quick stab at a pad sent NOTHING (0 MIDI messages against
6 on a slow press). The library's `Q` is where that test now lives, spelled
once for every caller, and src/lib/catalog/touch-guard.spec.ts REQUIRES a
body with no chain of its own to carry `Q(s,i,e,x,y)` - a requirement, not an
exemption. The event table itself lives in src/vendor/botor/pad-sim.ts:228-241
and in zona-docs/docs/ZONA_REFERENCE.md s4.6 and is CITED, never restated.

THE FINGER IS THE LIBRARY'S GRADIENT, IN WHITE, ON LAYER 0 (plan 12.1-04;
12.1-CONTEXT D-11, D-13). `G(s,i,e,x,y,0,255,255,255)` follows the `Q` call
and draws the bilinear finger over the 2x2 block of LEDs around the
calibrated position, peak 255 dead on an LED, on layer 0 - the one layer the
chessboard (layer 1) and the bloom (layer 2) never write. THE COLOUR IS A
LITERAL, NOT A KNOB: a knob would move this card's shape character and
demote every captured stamp (D-13), and white is the colour of a finger on a
card whose two other layers are already colour. G RE-ASSERTS THE COLOUR ON
EVERY CALL, and that is the alert-layer heal: layer 0 is the layer
`grid_alert_all_set` recolours (grid_led.h:7; on a CONFIG write, a page
discard, a refused page change, a TX overflow and at boot), so a finger
coloured once in an init loop would turn grey or purple after a page switch
until the Setup re-ran. There is no floor - `glc(...,1)` forces the layer's
minimum to 0 - so a cell `V` clears is dark, and the pad at rest is exactly
what it was. `Q` COMES BEFORE `G`, and the order is a measurement (12.1-02):
`Q` calls `E` on every onset, `E` clears the contact's block through `V`, so
a `G` drawn before `Q` is wiped on the same press that drew it. And the cell
`Q` returns is now the LED under the finger, so the pad the chord lands on
is the pad the finger is lighting; a finger between two pads holds one
chord by `Q`'s hysteresis (a fraction of the local LED pitch, D-18) and
lights both LEDs dimly. `R` is untouched and still idempotent: `E` calls it
after `V` on every path, and it returns unless `s.c` is the contact being
expired, so the block clear and the note-off travel together.

THE TWO STRINGS BELOW ARE TEMPLATES OVER CANONICAL LUA. Rendered at the
defaults by renderLua they are byte-identical to the canonical text measured
against the pinned minifier: Setup 819 characters, Timer 29, both fixed
points of compressScript and both accepted by checkSyntax. THE CORNER THE
908 GATE READS IS THE RGB444 PICKER CORNER (D-06): Setup 822 / Timer 29,
against a budget of 908 an event - 86 FREE IN SETUP and 879 in the Timer,
under the 890 BUDGET_ERROR line (_pad.ts:3076-3078) with 68 to spare, and
THE TIGHTEST CARD PLAN 12.1-04 TOUCHES.
MEASURED BEFORE AND AFTER AT THE RGB444 PICKER CORNER, every figure re-run
under the pinned compressScript in this tree rather than inherited:
  plan 12-09    Setup 771 -> 796 (+25), Timer 174 -> 29 (-145), the pair
                945 -> 825 (-120). The Setup grows because R and the library
                call are new text and the two per-contact tables it removes
                are only eighteen characters; the Timer is where the library
                pays for itself.
  plan 12.1-04  Setup 796 -> 822 (+26), the `G` call; Timer unmoved at 29;
                defaults 793 -> 819. Cheaper than the pre-coloured shape
                D-11 replaced, because there is no 81-cell layer-0 colouring
                in the init loop - `G` carries the colour itself.
src/lib/catalog/lua-entries.sweep.spec.ts asserts every one of those claims.

THE LUA CARRIES NO COMMENTS beyond the nine-character event marker, because
compressScript does not strip them and they would be charged to the budget.
```
