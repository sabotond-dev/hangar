# Slot probe 2 — can the touch Setup call the system element's fourth slot? (D-18)

Decides whether Sandbox v1 gets a **third** 908-character slot. The first probe
proved the mechanism between the two touch events; this one reaches across
elements to **255/4** — the system element's fourth event, which the firmware
binds to the utility button and defaults to `gpl(gpn())`, page-next. **A ZONA
fires it only from that button**, so a library parked there costs nothing until
someone presses it. Ten minutes. **Nothing is claimed until the user reports.**

## The route, and why it is different from last time

**HANGAR never writes 255/4.** 12-02's constants refuse it by design, because
writing it changes what the physical button does. So the system half of this
probe goes in through **Grid Editor**, which can address any element and event;
the touch half can go in through Grid Editor too, or through `/dev/install/` as
before. Nothing is stored to flash — **unplugging and re-plugging the ZONA
restores the utility button.**

## The scripts

**System element → the fourth event** (Grid Editor labels it *Utility* or
*Mapmode* depending on version; it is the one whose default reads `gpl(gpn())`):
```
--[[@cb]]function P2()return 255 end
```

**Touch element → Setup** (Grid Editor's *Init*, or `/dev/install/`'s Setup box):
```
--[[@cb]]for a=0,80 do glc(a,1,255,255,255,1)glp(a,1,0)end self.touch_cb=function(s,i,e,x,y)if e~=4 then return end local z=ele[#ele]local f=z.map or z.mapmode or z.utility or z.util if f then f(z)if P2 then glp(glag(0,80),1,255)else glp(glag(0,40),1,255)end else glp(glag(0,0),1,255)end end
```

`ele[#ele]` is the system element by the firmware's own convention
(`init.lua:46-50` calls `ele[#ele]:post_init_cb()` first). The four candidate
names cover the event's known labels; the call happens on the **first tap**, so
the order the two scripts land in cannot produce a false negative.

## What to do

1. **Grid Editor**: connect, select the **System** element (on a ZONA it is
   selected by pressing the module's utility button once — that press fires
   page-next *before* you overwrite it, which is fine), pick its fourth event,
   paste the one-line script, send it to the module (RAM — do not store).
2. **Touch Setup**: paste the second script into the touch element's Init in
   Grid Editor and send, **or** into `/dev/install/`'s Setup box and Try.
3. The pad goes dark. **Tap anywhere once.**
4. Look at which single cell lit.

## What it means

| Lit cell | Meaning |
|---|---|
| **Bottom-right** (80) | **Works.** A touch script called the system element's fourth slot and the global it defined persisted. Three slots are on; the PDF's example surface is buildable. |
| **Centre** (40) | The method exists under one of the four names and ran, but `P2` is not defined — the body that ran is not the one written. Report which step you used; the name or the route is off. |
| **Top-left** (0) | No method under any of the four names on `ele[#ele]`. Report it; the fallback is two slots and 13-02's `two-slots` branch, with its prices. |
| **Nothing** | Something else raised. Copy any error Grid Editor or the page shows. |

Then **unplug and re-plug** the ZONA to restore the utility button, and Put
back in HANGAR if you used it.

**If Grid Editor will not let you reach the System element on a ZONA**, say so —
that is a real finding (the research rated it MEDIUM), and the alternative is a
one-off dev-only route that a plan has to build deliberately.
