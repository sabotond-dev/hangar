// GHOST - draw an automation curve once, and it loops forever.
//
// A gesture looper. Hold a finger and drag: the pad records your path at 50 Hz
// while sending X and Y as a CC pair. Lift, and a ghost retraces exactly what
// you drew, forever, still sending. A second finger down clears it. It is drawn
// automation with no DAW, no lane and no mouse.
//
// While you are recording, a comet follows your finger on layer 1. After you
// lift, the ghost retraces the same path on layer 2 in a different colour, so
// you can always tell your hand from its ghost. Both are the same one-call
// decay.
//
// THE RECORDING IS DONE BY THE TIMER, NOT BY THE TOUCH CALLBACK, and that is
// the whole design. The callback only stores the last known x and y; the Timer
// samples that store once per 20 ms tick. Touch enqueue is CHANGE-GATED per
// contact - a finger that does not move emits nothing - so a callback-driven
// recorder would take fewer points from a slow drag than from a fast one and
// would replay a slow gesture faster than it was made. Sampling in the Timer
// makes record and replay both exactly 20 ms per point, so the loop plays back
// at the speed you drew it. A motionless finger still records, which is correct
// and is the reason this shape was chosen.
//
// WHY THE TIMER RENDERS 333 AND NOT THE 331 PRINTED IN THE RESEARCH. The second
// CC number is written as "@CCX+1" rather than as the literal 17. That costs
// two characters and buys one knob that moves both CC numbers together, so the
// pair can never drift apart into a configuration that sends X on 16 and Y on
// some unrelated controller. It is the one place in this phase where a knob
// costs something, and it is worth it.
//
// THE TWO STRINGS BELOW ARE TEMPLATES OVER CANONICAL LUA. Rendered at the
// defaults by renderLua they are byte-identical to the canonical text measured
// against the pinned minifier - Setup 305 characters - except for the Timer,
// which renders 333 for the reason above. Both are fixed points of
// compressScript and both are accepted by checkSyntax. The all-longest corner
// of the five-knob cross-product is 308 / 337, against a budget of 908 an
// event. src/lib/catalog/lua-entries.spec.ts asserts every one of those claims.
//
// THE LUA CARRIES NO COMMENTS beyond the nine-character event marker, because
// compressScript does not strip them and they would be charged to the budget.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";

const SETUP =
  "--[[@cb]]for a=0,80 do glc(a,1,@RECC,1)glp(a,1,0)glc(a,2,@GHOSTC,1)glp(a,2,0)end self.g={}self.n=0 self.j=0 self.touch_cb=function(s,i,e,x,y)if i>0 then if e==4 then s.g={}s.n=0 s.j=0 for a=0,80 do glp(a,1,0)end end return end if e==3 or e>=5 then s.h=nil return end s.h=1 s.x=x s.y=y end gtt(0,20)";

const TIMER =
  "--[[@cb]]gtt(0,20)local s=self local x,y if s.h then x=s.x y=s.y if s.n<@LEN then s.n=s.n+1 s.g[s.n]=x*128+y end s.j=0 elseif s.n>0 then s.j=s.j%s.n+1 local v=s.g[s.j]x=v//128 y=v%128 end if x then s:gms(@CH,176,@CCX,x,0)s:gms(@CH,176,@CCX+1,127-y,0)local a=glag(0,x*9//128+y*9//128*9)local l=s.h and 1 or 2 glpfs(a,l,255,250,0)glt(a,l,42)end";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

export const GHOST: CatalogEntry = {
  id: "ghost",
  name: "GHOST",
  description:
    "Drag once and a ghost retraces your path forever, still sending, in a colour that is not your finger's.",
  // Feel-based, never a compiler kind (CONT-03).
  tags: ["looper", "automation", "gestural", "generative"],
  featured: false,
  addedAt: "2026-09-04",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Five knobs, each one literal token substitution over the vendored
  // compiler's own widget vocabulary (TUNE-01). Every default is the INDEX of
  // the value that reproduces the canonical text.
  knobs: [
    {
      id: "recordColour",
      label: "Recording colour",
      kind: "colour",
      token: "@RECC",
      // Layer 1 - the comet that follows your own finger. Every channel is
      // inside 0..255 on purpose: the firmware truncates rather than clamps, so
      // 260 would render as 4 and turn a bright comet nearly black with no
      // warning.
      values: [
        "0,255,180",
        "0,200,255",
        "255,140,0",
        "120,255,0",
        "255,255,255",
      ],
      default: 0,
    },
    {
      id: "ghostColour",
      label: "Ghost colour",
      kind: "colour",
      token: "@GHOSTC",
      // Layer 2 - the replay. Keep it clearly different from the recording
      // colour: telling your hand from its ghost is the entire point of there
      // being two layers.
      values: [
        "255,80,255",
        "255,140,0",
        "0,200,255",
        "180,255,255",
        "255,255,255",
      ],
      default: 0,
    },
    {
      id: "loopLength",
      label: "Loop length",
      kind: "size",
      token: "@LEN",
      // Recorded samples, at 20 ms each, so 250 is five seconds and 60 is one
      // and a fifth. NONE of these may exceed 250: the recorder writes into
      // s.g while the replay walks it modulo s.n, and a cap larger than the
      // table the loop replays would be a longer recording than the loop can
      // play.
      values: ["60", "120", "180", "220", "250"],
      default: 4,
    },
    {
      id: "cc",
      label: "CC pair",
      kind: "amount",
      token: "@CCX",
      // X is sent on this number and Y on the one above it - the template
      // writes the second as "@CCX+1", so the two can never drift apart. Every
      // value here leaves the pair inside the 0..127 controller range.
      values: ["16", "20", "74", "102"],
      default: 0,
    },
    {
      id: "channel",
      label: "MIDI channel",
      kind: "amount",
      token: "@CH",
      // ZERO-BASED, and it is the FIRST argument. The recipe book pins the
      // signature as self:gms(ch, cmd, p1, p2, mode) at
      // zona-docs/docs/ZONA_RECIPES.md:1058. This token appears twice in the
      // Timer, once for each half of the CC pair, so both always leave on the
      // same channel.
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
    recordColour: 0,
    ghostColour: 0,
    loopLength: 4,
    cc: 0,
    channel: 0,
  },

  // TRUE, and it is the design rather than a fault. Both layers are COLOURED at
  // Setup but left at phase 0, and glc's sixth argument forces the minimum stop
  // black, so a sampler that never touches the pad reads an all-zero frame at
  // every tick. GHOST paints only under a finger, and only after one.
  // frames.spec.ts test 5 is what turns that declaration into a checked fact.
  restsBlack: true,
};
