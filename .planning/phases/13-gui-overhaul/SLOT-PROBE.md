# Slot probe — can one Lua slot call another? (D-07)

Decides whether Sandbox v1 gets the split architecture (861 runtime + 366 for
the PDF's four-element surface) or is faders and buttons only. Runs through
`/dev/install/` on the preview at `9d435db`; writes only the two touch events
HANGAR already writes. Ten minutes. **Nothing here is claimed until the user
reports it.**

## What it tests

The firmware registers every event body as a callable method —
`ele[N].name = function(self)…` (`grid_ui.c:373`) — and its own defaults call one
from another. If the touch **Timer's** body can be run on demand from the touch
**Setup**, a Timer that defines functions is 889 characters of library in a slot
that already exists. The `ele[1]:map()` half (the system mapmode slot) is **not**
tested here: HANGAR does not write element 255 yet, and event 4 doubles as the
utility button.

## The scripts

**Timer** box:
```
--[[@cb]]function P()return 255 end
```

**Setup** box:
```
--[[@cb]]for a=0,80 do glc(a,1,255,255,255,1)glp(a,1,0)end self.touch_cb=function(s,i,e,x,y)if e~=4 then return end local f=s.tim or s.timer if f then f(s)if P then glp(glag(0,80),1,255)else glp(glag(0,40),1,255)end else glp(glag(0,0),1,255)end end
```

The cross-slot call happens on your **first tap**, not at install — so the order
the two boxes are written in cannot produce a false negative. Nothing arms the
Timer; it only runs when Setup calls it.

## What to do

1. `/dev/install/` → Connect → paste both boxes → **Try**.
2. The pad goes dark. **Tap anywhere once.**
3. Look at which single cell lit.

## What it means

| Lit cell | Meaning |
|---|---|
| **Bottom-right** (cell 80) | **Works.** `self:tim()` ran the Timer body and `P` was defined. The split architecture is on. |
| **Centre** (cell 40) | The method exists and ran, but `P` is not defined — the body that ran is not the one written. Report it; the name or the registration is different from what the research read. |
| **Top-left** (cell 0) | No method called `tim` or `timer` on the touch element. Report it; the plan falls back to two slots and Sandbox v1 is faders and buttons only. |
| **Nothing** | Something else raised. If the page shows an error, copy it. |

Then **Put back**.
