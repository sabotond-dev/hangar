// SLAM - nine drum zones whose velocity is the height of the hit.
//
// Nine 3x3 zones. How high in the pad you hit is how hard it plays, and the
// height of the bloom is the velocity you sent. THE NUMBER OF LIT ROWS IS THE
// VELOCITY BYTE, which is what turns the module's missing pressure sensor from
// an apology into something you can watch.
//
// THE MECHANISM. On an onset the zone is z = x*3//128 + y*3//128*3 and the
// velocity is v = (127 - y)*126//127 + 1, so the top of the pad is 127 and the
// bottom is 1. The bloom is glim(v*3//127+1, 1, 3) rows of that zone, filled
// from the bottom up, handed glpfs(a,1,252,256-252//@DECAY,0) plus
// glt(a,1,@DECAY) - the self-erasing trail idiom, where the sixth argument of
// glc forces the layer's minimum stop black so a phase running down to 0 is
// exact black, and firmware does the whole fade in C with no erase pass and no
// per-cell bookkeeping. The note is self:gms(@CH, 144, @NOTE + z, v, 0).
//
// THE DECAY RATE IS DERIVED FROM THE BLOOM LENGTH, AND THAT IS MEASURED RATHER
// THAN STYLED. A fixed rate of 250 - the shipped idiom - is a phase step of 6 a
// tick, which lands on black only at 42 ticks. At any other length the timeout
// expires part-way down, firmware sets the rate to 0 and THE CELL FREEZES HALF
// LIT: measured here at phase 183, 111 and 127 for 12, 24 and 64 ticks. SLAM
// has no Timer to repaint anything, so a frozen bloom is permanent and the pad
// would fill up with half-lit cells as you played it. So the rate is
// 256 - 252//@DECAY and the starting phase is 252, and every bloom length is a
// divisor of 252. The product is then exactly 252 at every setting and the
// phase lands on exactly 0:
//
//   12 ticks -> step 21    28 ticks -> step 9
//   42 ticks -> step 6     63 ticks -> step 4
//
// Confirmed in the frame rather than in the record: after a hit and 400 ticks
// the rendered frame is byte-identical to the resting frame. That is why the
// values are 12, 28, 42 and 63 rather than a rounder looking 12, 24, 42, 64.
// Any new value must divide 252.
//
// THIS IS NOT ninepads AND IT IS NOT CHORUS. ninepads lights the zone you are
// holding at a fixed velocity; CHORUS fires a whole triad and blooms outward.
// SLAM's bloom is not decoration - it is the reading of the number it just
// sent, and that is the argument for the card.
//
// THE LOOK, and why restsBlack is FALSE. Setup paints a static outline - the
// four corner cells of each zone - on layer 2 in @ZONEC at phase 255, so the
// nine zones are countable at rest and the OG image is not a black square.
//
// THE BLOOM IS ONE LAYER, AND THAT IS A CORRECTION RATHER THAN A SAVING. The
// obvious build paints the bloom on layers 1 and 2 for brightness, because one
// layer can never exceed 254/512 of the value asked for. It cannot be done
// here: the zone outline lives on layer 2, the bloom's bottom row always covers
// two outline corners, and a decay ends at exact black - so the first hit in a
// zone would erase two of its four outline cells permanently, and SLAM has no
// Timer to repaint them. The bloom therefore owns layer 1 alone, at the loud
// end of the colour range, which is also what every shipped decaying trail in
// the catalog does (EUCLID's head, SONAR's sweep, MORPH's touch decay).
//
// SLAM HAS NO TIMER, AND THAT IS THE RIGHT ANSWER RATHER THAN AN OMISSION. The
// zone outline is static and needs no re-arming, and the bloom is a per-touch
// decay that is self-limiting: the cells under the hit die on their own. There
// is nothing for a Timer to advance, so the Timer is the empty string, the same
// shape MORPH uses. createLuaPadSim maps "" onto undefined for the host, and
// docs/HARDWARE-AUDITION.md row 1's install-order rule already carries MORPH's
// exemption; this entry joins it.
//
// THE TRAPS THIS ENTRY CONTAINS.
//
//   - F2Ieq on all four divisions. x*3//128, y*3//128, (127-y)*126//127 and
//     v*3//127 are floored; a fractional argument to a firmware call becomes 0,
//     silently.
//   - THE ROW COUNT IS CLAMPED, and the clamp is load-bearing. v*3//127 + 1 is
//     4 at v = 127, and a zone has three rows - the fourth would light a cell
//     belonging to the zone above. glim(...,1,3) is the firmware clamp and it
//     costs nine characters.
//   - THE NOTE RANGE IS NINE WIDE. Zone z plays @NOTE + z, so @NOTE + 8 must
//     stay under 128 for every value of the knob. The largest is 60, and
//     60 + 8 = 68.
//   - CODE 9 IS HANDLED EXPLICITLY. A fast tap arrives as one message with no
//     separate lift, so the handler sends the note-off itself immediately after
//     the note-on. e == 5 appears nowhere; the end branch is e >= 5 and e < 9,
//     which is what stops a leaked note the vendored scanner raises
//     trap-end-of-contact for.
//   - PER-CONTACT STATE IS KEYED BY CONTACT ID. self.z[i] holds the zone that
//     contact is sounding, so two fingers cannot cancel each other's note-off.
//     Five records of one field is free.
//   - COLOUR CHANNELS TRUNCATE, NEVER CLAMP. 260 renders as 4. Every channel of
//     every @COL and @ZONEC value is inside 0..255 by construction.
//   - glp IS NEVER CALLED WITH A NEGATIVE PHASE, and NO KEEPER IS WRITTEN
//     ANYWHERE. The bloom is a decay; glt(a,1,65535) on it is pitfall 1
//     exactly, and the longest value the decay knob offers is 63 ticks.
//
// THE HONEST LIMIT, for the card copy. Two things. Two fingers in one zone: the
// second hit repaints the same cells, so the first one's bloom is restarted
// rather than kept - the documented caveat on every zone-based configuration
// (ZONA_GUI_SPEC.md section 4.2). And HEIGHT IS NOT FORCE. The card measures
// where you hit, not how hard, and it says so rather than pretending the module
// grew a pressure sensor.
//
// ROUTE: kind "lua", not kind "state". sends.velocity is a literal 1..127 in
// PadState and _pad.ts:296 records that "From position" has no measured recipe,
// so velocity from position is not in the vocabulary at all - and it is the
// whole card.
//
// THE STRING BELOW IS A TEMPLATE OVER CANONICAL LUA. Rendered at the defaults by
// renderLua it is byte-identical to the canonical text measured against the
// pinned minifier: Setup 659 characters, a fixed point of compressScript and
// accepted by checkSyntax. The all-longest corner of the five-knob
// cross-product is 666, leaving 242 free of 908, and the all-shortest corner is
// 659 - identical to the defaults, because every default here already selects
// its knob's shortest value. The Timer is the empty string at every corner, and
// the empty string is a fixed point of compressScript.
// src/lib/catalog/lua-entries.sweep.spec.ts asserts every one of those claims.
//
// THE LUA CARRIES NO COMMENTS beyond the nine-character event marker, because
// compressScript does not strip them and they would be charged to the budget.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";

const SETUP =
  "--[[@cb]]self.z={}for n=0,80 do local a=glag(0,n)glc(a,1,@COL,1)glp(a,1,0)end for z=0,8 do local bx=z%3*3 local by=z//3*3 for d=0,3 do local a=glag(0,bx+d%2*2+(by+d//2*2)*9)glc(a,2,@ZONEC,1)glp(a,2,255)end end self.touch_cb=function(s,i,e,x,y)if e>=5 and e<9 then local m=s.z[i]if m then s:gms(@CH,128,@NOTE+m,0,0)s.z[i]=nil end return end if e~=4 and e<9 then return end local z=x*3//128+y*3//128*3 local v=(127-y)*126//127+1 local bx=z%3*3 local by=z//3*3 for r=0,glim(v*3//127+1,1,3)-1 do for c=0,2 do local a=glag(0,bx+c+(by+2-r)*9)glpfs(a,1,252,256-252//@DECAY,0)glt(a,1,@DECAY)end end s:gms(@CH,144,@NOTE+z,v,0)if e==9 then s:gms(@CH,128,@NOTE+z,0,0)else s.z[i]=z end end";

// THE TIMER IS THE EMPTY STRING, WRITTEN INLINE. See the header: SLAM has no
// Timer EVENT, and a named constant holding nothing would only invite someone
// to fill it in.
const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: "" };

export const SLAM: CatalogEntry = {
  id: "slam",
  name: "SLAM",
  description:
    "Nine drum pads where how high you hit is how hard it plays, and the bloom shows the velocity.",
  // D-10: one FOR term then two FEELS, drawn from the closed sixteen in
  // src/lib/browse/facets.ts. Feel-based, never a compiler kind (CONT-03).
  tags: ["drums", "playable", "expressive"],
  featured: false,
  addedAt: "2026-09-07",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Five knobs, each one literal token substitution over the vendored
  // compiler's own widget vocabulary (TUNE-01). Every default is the INDEX of
  // the value that reproduces the canonical text.
  //
  // TOKEN PREFIX CHECK, done before a line was written: @COL, @ZONEC, @DECAY,
  // @NOTE and @CH. renderLua substitutes by plain String.replaceAll, so a token
  // that is a prefix of another is eaten or corrupted depending on knob order.
  // None of these five is a prefix of another, and the decay knob carries
  // @DECAY rather than @DEC following MORPH's precedent for exactly this
  // hazard.
  knobs: [
    {
      id: "colour",
      label: "Hit colour",
      kind: "colour",
      token: "@COL",
      // The bloom, on layer 1. Bright on purpose: it is one layer, which can
      // never exceed 254/512 of the value asked for, and it is the thing the
      // card is watched for. Every channel is inside 0..255 - the firmware
      // truncates rather than clamps, so 260 would render as 4.
      values: ["255,90,0", "0,200,255", "0,255,120", "255,255,255"],
      default: 0,
    },
    {
      id: "zone",
      label: "Outline colour",
      kind: "colour",
      token: "@ZONEC",
      // The four corner cells of each zone, on layer 2, static. Deliberately
      // dim: it is the scaffolding the bloom is read against, and a bright
      // outline would compete with the number it is there to frame.
      values: ["0,25,50", "25,0,50", "40,20,0", "20,20,20"],
      default: 0,
    },
    {
      id: "decay",
      label: "Bloom length",
      kind: "feel",
      token: "@DECAY",
      // Ticks the bloom takes to fade, at 10 ms a tick. EVERY VALUE DIVIDES
      // 252, because the rate is 256 - 252//@DECAY and the phase starts at 252,
      // so the product is exactly 252 and the fade lands on exactly 0 at every
      // setting - see the header. NEVER A KEEPER: this layer carries a decaying
      // trail, and 65535 here would replace the countdown and strobe every hit
      // cell forever.
      values: ["12", "28", "42", "63"],
      default: 1,
    },
    {
      id: "note",
      label: "Lowest note",
      kind: "note",
      token: "@NOTE",
      // The top-left zone plays this and the bottom-right plays this plus
      // eight. 36 is the General MIDI kick, so the default nine zones are
      // 36..44. The largest value here is 60, and 60 + 8 = 68, well inside the
      // MIDI range. APPEARS THREE TIMES - the note-on, the tap's own note-off
      // and the release - so a zone can never be released on a note it was not
      // played on.
      values: ["36", "48", "60", "24"],
      default: 0,
    },
    {
      id: "channel",
      label: "Channel",
      kind: "mode",
      token: "@CH",
      // ZERO-BASED, and it is the FIRST argument: self:gms(ch, cmd, p1, p2,
      // mode). Four channels, not sixteen - a sixteen-value channel knob alone
      // would add 16 combinations to the sweep for a choice nobody makes. The
      // default is 9, which is channel 10, where a drum machine listens.
      values: ["0", "1", "9", "15"],
      default: 2,
    },
  ],

  // The same five indices, keyed by knob identifier - the shape Phase 5's tune
  // panel reads. catalog.spec.ts asserts the two agree.
  defaults: {
    colour: 0,
    zone: 0,
    decay: 1,
    note: 0,
    channel: 2,
  },

  // FALSE. Setup lights 36 outline cells at phase 255, so tick 0 is a readable
  // picture of nine zones. frames.spec.ts test 5 turns that declaration into a
  // checked fact.
  restsBlack: false,
};
