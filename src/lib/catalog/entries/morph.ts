// MORPH - four macros in the corners, one finger between them.
//
// A four-corner macro morph pad. Each corner owns one CC; your finger's
// position is blended bilinearly into four weights that always sum to the full
// range. Park in a corner and that macro is at 127 and the other three at 0;
// sit in the middle and all four sit at a quarter. It is the paradigm players
// already know from Kaoss pads, NI morph pads and Ableton macro racks, and
// mapping four consecutive CCs is the easiest MIDI-learn job there is.
//
// EACH CORNER'S BRIGHTNESS IS ITS OWN WEIGHT, so the mix is readable across a
// room. The four 2x2 blocks get four distinct hues out of one arithmetic
// expression - 255-j*spread, j*spread, 128 - which is why four coloured corners
// cost the budget almost nothing. @SPREAD APPEARS TWICE in that expression and
// both sites must be substituted, or the four corners stop being four hues.
//
// MORPH HAS NO TIMER, AND THAT IS THE RIGHT ANSWER RATHER THAN AN OMISSION.
// Its only animation is a per-touch decay, which is self-limiting: the cells
// under your finger are handed glpfs(a,2,255,250,0) plus glt(a,2,<trail>) and
// then die on their own. There is nothing for a Timer to advance.
//
// DO NOT ADD THE STANDARD KEEPER. The reflex is to write
// "for a=0,80 do glt(a,L,65535) end" into a Timer so a layer never expires.
// Applied to THIS layer it is pitfall 1 exactly: the 42-tick countdown is
// replaced by 65535, the decay rate of 250 keeps decrementing past zero and
// wraps, and every touched cell strobes forever. The smoke gate's pitfall-1
// guard - a keeper-height timeout together with a fast decay rate - would catch
// it, but this comment exists so nobody writes it in the first place.
//
// The empty Timer needs no special case anywhere in the gate, and none was
// added: compressScript("") is "" (already a fixed point) and checkSyntax("")
// is true, both measured at the pin. createLuaPadSim maps the catalog's
// always-a-string shape onto LuaHost's undefined, so MORPH cannot arm a timer
// at all - which is what firmware does too, since gtt is a no-op until the
// Timer event holds at least one stored action.
//
// THE TOKEN FOR THE TRAIL LENGTH IS @DECAY, NOT @TRAIL. renderLua substitutes
// by plain string replacement, so a token that is a PREFIX of another token is
// eaten or corrupted depending on knob order - "@TRAIL" inside "@TRAILC" would
// render the colour as "42C". The trail-length knob therefore carries @DECAY.
// Its knob id is still "trail"; only the substitution token moved.
//
// THE HONEST LIMIT, for the card copy: single-contact by design. The callback
// returns immediately for i > 0, because four fingers fighting over one blend
// is noise rather than expression.
//
// THE STRING BELOW IS A TEMPLATE OVER CANONICAL LUA. Rendered at the defaults
// by renderLua it is byte-identical to the canonical text measured against the
// pinned minifier: Setup 507 characters, a fixed point of compressScript and
// accepted by checkSyntax. The all-longest corner of the five-knob
// cross-product is 510, against a budget of 908 an event.
// src/lib/catalog/lua-entries.sweep.spec.ts asserts every one of those claims.
//
// THE LUA CARRIES NO COMMENTS beyond the nine-character event marker, because
// compressScript does not strip them and they would be charged to the budget.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";

const SETUP =
  "--[[@cb]]for a=0,80 do glc(a,2,@TRAILC,1)glp(a,2,0)end self.k={0,7,63,70}for j=0,3 do for d=0,3 do local a=glag(0,self.k[j+1]+d%2+d//2*9)glc(a,1,255-j*@SPREAD,j*@SPREAD,128,1)glp(a,1,0)end end self.touch_cb=function(s,i,e,x,y)if i>0 or e==3 or e>=5 then return end local u=127-x local v=127-y local w={u*v//127,x*v//127,u*y//127,x*y//127}for j=1,4 do s:gms(@CH,176,@CCB+j,w[j],0)local b=s.k[j]for d=0,3 do glp(glag(0,b+d%2+d//2*9),1,w[j]*2)end end local a=glag(0,x*9//128+y*9//128*9)glpfs(a,2,255,250,0)glt(a,2,@DECAY)end";

// THE TIMER IS THE EMPTY STRING, WRITTEN INLINE. See the header: MORPH has no
// Timer EVENT, and a named constant holding nothing would only invite someone
// to fill it in.
const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: "" };

export const MORPH: CatalogEntry = {
  id: "morph",
  name: "MORPH",
  description:
    "Four macros in the corners; slide between them and each corner’s brightness is its own weight.",
  // D-10: one FOR term then two FEELS, drawn from the closed sixteen in
  // src/lib/browse/facets.ts. Feel-based, never a compiler kind (CONT-03).
  tags: ["modulation", "expressive", "still"],
  featured: true,
  addedAt: "2026-09-04",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Five knobs, each one literal token substitution over the vendored
  // compiler's own widget vocabulary (TUNE-01). Every default is the INDEX of
  // the value that reproduces the canonical text.
  //
  // TWO KIND CHOICES, WRITTEN DOWN SO THEY ARE NOT RE-ARGUED:
  //
  //   - hueSpread is "amount", NOT "colour". Its value is a single scalar - the
  //     60 in 255-j*60, j*60, 128 - that widens the arithmetic spread between
  //     the four corner hues. A colour widget renders a picker and would be
  //     handed a bare number it cannot show. "amount" is the kind for a scalar
  //     with a range, which is exactly what this is. trailColour is a real RGB
  //     triple and stays "colour".
  //
  //   - MIDI channel and CC number are "amount" DELIBERATELY. The vendored
  //     KnobKind union has no MIDI-destination kind: its "note" is a pitch, and
  //     "mode", "bend" and "spring" are named switches. D-12 forbids inventing
  //     a Lua-specific kind, so "amount" - a bounded integer chosen from a list
  //     - is the closest honest fit. If Phase 5 wants a distinct widget for a
  //     MIDI destination, that is a KnobKind addition in BOTOR followed by a
  //     re-sync, never a HANGAR-local union. Every @CH and @CC knob in this
  //     phase uses "amount" for that reason.
  knobs: [
    {
      id: "trailColour",
      label: "Trail colour",
      kind: "colour",
      token: "@TRAILC",
      // Layer 2 - the pale comet under your hand, which is the only thing on
      // this card that moves. Every channel is inside 0..255: the firmware
      // truncates rather than clamps, so 260 would render as 4.
      values: [
        "180,255,255",
        "255,255,255",
        "0,200,255",
        "255,180,120",
        "120,255,180",
      ],
      default: 0,
    },
    {
      id: "hueSpread",
      label: "Hue spread",
      kind: "amount",
      token: "@SPREAD",
      // The scalar in the corner-colour arithmetic - see the note above on why
      // this is an amount and not a colour. APPEARS TWICE in the Setup. Every
      // value is at or under 85, because corner j = 3 is handed 255 - 3 *
      // spread on red and 3 * spread on green: at 85 that is exactly 0 and 255,
      // and anything larger would wrap red round the truncation boundary into a
      // bright colour where the design wants none.
      values: ["20", "40", "60", "85"],
      default: 2,
    },
    {
      id: "ccBase",
      label: "CC base",
      kind: "amount",
      token: "@CCB",
      // The four corners send @CCB+1 through @CCB+4, in corner order. EVERY
      // VALUE HERE IS AT OR UNDER 110, so the fourth CC is at most 114 and the
      // whole quartet stays inside the 0..127 controller range. That is not
      // asserted in a spec - it is guaranteed by choosing the values, which is
      // the cheaper of the two and the reason this comment exists.
      values: ["15", "20", "40", "70", "110"],
      default: 0,
    },
    {
      id: "trail",
      label: "Trail length",
      kind: "size",
      token: "@DECAY",
      // Ticks the comet takes to fade. TOKEN IS @DECAY, not @TRAIL - see the
      // header on the prefix hazard. These are countdowns and nothing here is
      // anywhere near keeper height, so the pitfall-1 guard stays quiet by
      // construction rather than by exemption.
      values: ["20", "42", "80", "120"],
      default: 1,
    },
    {
      id: "channel",
      label: "MIDI channel",
      kind: "amount",
      token: "@CH",
      // ZERO-BASED, and it is the FIRST argument. The recipe book pins the
      // signature as self:gms(ch, cmd, p1, p2, mode) at
      // zona-docs/docs/ZONA_RECIPES.md:1058. One occurrence, inside the loop
      // that sends all four macros, so the quartet always leaves together.
      values: [
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
      ],
      default: 0,
    },
  ],

  // The same five indices, keyed by knob identifier - the shape Phase 5's tune
  // panel reads. catalog.spec.ts asserts the two agree.
  defaults: {
    trailColour: 0,
    hueSpread: 2,
    ccBase: 0,
    trail: 1,
    channel: 0,
  },

  // TRUE, and it is the design. The four corner blocks are COLOURED at Setup
  // but left at phase 0, glc's sixth argument forces the minimum stop black,
  // and there is no Timer to light anything - so with no finger on the pad
  // MORPH is black forever and every sampled tick reads all-zero. Its only
  // animation is a per-touch decay. frames.spec.ts test 5 turns that
  // declaration into a checked fact, and the fixture is cross-checked
  // independently in plan 08-06: one distinct hash, nonZeroBytes 0 at every
  // tick, animating false at every tick.
  restsBlack: true,
};
