# The ZONA walking skeleton run

Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

This is the hardware checklist for FOUND-01: one provable no-op against a real ZONA. You fetch the
module's own Setup and Timer strings, write those exact strings back, store them, and re-fetch to
prove nothing moved. Everything the page sends is either a read or an echo of what the module
already had.

Web Serial cannot be automated — there is no CDP domain and no fake-device hook — so this is a
checklist for a person, not an assertion a test suite can make. Everything the machine can prove is
already green before you start: 442 unit tests, 9 invariant-sweep tests, 10 end-to-end tests, a
clean `svelte-check` and a production build with `build/dev/skeleton/index.html` in it. What is
completely unproven, and what this run is for, is that any of it works against hardware. Every frame
so far has been one HANGAR encoded and HANGAR decoded.

The page is `/dev/skeleton/`. It is prerendered and linked from nowhere.

## Before you start

1. **Quit Grid Editor completely** — its tray icon, then Quit, not just closing the window. Only one
   program can hold a serial port, and Grid Editor takes it back from the tray. The one exception is
   step 0, which needs it running on purpose.
2. **The ZONA carries its factory configuration.** The factory Setup is dim and static, so "the
   module behaves as it did before" is proven by the re-fetched strings, not by eye.
3. **Only the ZONA is attached** — no second Grid module. The page disables the store button when it
   sees another module, because a page store is a global broadcast (D-12). That is correct
   behaviour, and it ends the run early.
4. **Chrome, Edge, or desktop Firefox 151 or newer.** On Firefox a site-permission prompt appears
   _before_ the port chooser; it looks like an extension install and it is not, it is how Firefox
   gates this API.
5. **Keep the tab in the foreground for the whole run.** A backgrounded tab throttles timers to
   roughly 1 Hz, which invalidates every latency the page prints. The page also closes the port when
   the tab is hidden, on purpose, so switching away ends the arm.
6. **Have somewhere to put the exported JSON.** One file per arm comes out of the run, and those
   files are the only input to the results document.

Numbers the page is running with, so a surprise is recognised as one: the identify window is
1500 ms; a fetch waits 1000 ms for its report, a config write 500 ms for its acknowledgement, and a
store 3000 ms; a request is retried at most 3 times; the host heartbeat, when it is on, goes out
every 300 ms.

## Getting the page open

Only you can do either of these. The executor never deploys and never touches the hardware.

- **`npm run deploy` from this machine**, then open `https://<the preview URL>/dev/skeleton/` and
  enter the Basic Auth credentials. This is the route if you want to run from a different machine.
  The deploy refuses on a dirty tree by design; the tree is clean as of the pre-flight.
- **`npm run preview`**, then open `http://127.0.0.1:4173/dev/skeleton/`. `localhost` is a secure
  context, so Web Serial works there with no certificate and no deploy.

Keep the trailing slash on `/dev/skeleton/`.

**Never open the built `index.html` from disk.** A `file://` URL is not a secure context, so
`navigator.serial` is simply absent and the page correctly shows its no-Web-Serial state - which
reads as a broken page and costs an hour. The tell is the panel titled
`This browser cannot talk to hardware` appearing in a browser you know can talk to hardware.

## Set the arm before you connect

Two checkboxes under **Run settings** decide which arm you are running:

- `send the host heartbeat while connected`
- `pace sends 10 ms apart (off = 0 ms)`

Both lock as soon as the port opens, so an arm cannot change mid-run, and both are recorded into the
exported capture. Arm A is heartbeat on; arm B is heartbeat off. Set them, then connect.

## The checklist

Run every row in order. Rows 0 to 4 and rows R, E and P are done once per arm; the arms differ only
in the two toggles above.

| #         | What                                               | Do this                                                                                                                                                                                                                      | Passes when                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Pass |
| --------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| **0**     | The port-conflict message (D-04, CONN-04)          | With Grid Editor **running and connected**, click `Connect` and pick the ZONA.                                                                                                                                               | The page shows `Another program is holding the port`, names Grid Editor, and lists the recovery in order: quit it from its tray icon, unplug, wait, replug, reload, connect. Not a raw `Failed to open serial port.` Then quit Grid Editor, reload the page, and carry on.                                                                                                                                                                                                   |      |
| **1**     | Connect and identify (criterion 1)                 | Click `Connect`. Look at what the chooser offers **before** picking, then pick the ZONA.                                                                                                                                     | The picker lists one device and no bootloader entry. Within about a second the status line reads `ZONA <revision> firmware <M.m.p>, SX <x> SY <y>, heartbeat type 1, active page <n>` — a page number read from the module, not assumed. `Other modules on the rig: none seen.`                                                                                                                                                                                              |      |
| **2**     | Fetch (criterion 2)                                | Click `Fetch`.                                                                                                                                                                                                               | Both strings appear verbatim under **Fetched strings** with their character counts, and the status reads `fetched Setup <n> and Timer <m> characters`. Neither is empty; neither is 909 or longer. Setup is several hundred characters (the pinned package's own default is 641), Timer is short (22). **Steps** lists `fetch-setup` and `fetch-timer`, each `ok`, each with its latency in ms.                                                                              |      |
| **3**     | Write back and store (criterion 3)                 | Click `Write back (RAM)`. Then click `Store to flash - writes the config that is already there`.                                                                                                                             | The write goes Timer first, then Setup, and the status reads `both write-backs acknowledged in RAM`; the store status reads `the store was acknowledged`. **Steps** shows `write-timer`, `write-setup` and `store` separately, each with its own latency, plus the `restore-page-change` the write sends automatically. The module's border LEDs animate yellow-dim during the store and then settle. No negative acknowledgement, and at most one retry that then succeeds. |      |
| **4**     | Re-fetch proves byte identity (criterion 4)        | Click `Re-fetch`.                                                                                                                                                                                                            | The status reads `re-fetched: both strings are byte-identical to what was fetched` and the panel reads `Re-fetched. Byte-identical: true`, against what step 2 captured. Anything else means the strings differ and the two panels below it are the evidence.                                                                                                                                                                                                                |      |
| **A/B-1** | Heartbeat off                                      | Reload the page. Clear `send the host heartbeat while connected`. Repeat steps 1 to 4.                                                                                                                                       | Record whether inbound heartbeats keep arriving for at least 10 seconds and whether all three acknowledgements still arrive, against the definition printed at the top of the page. Both outcomes are a result; neither is a failure.                                                                                                                                                                                                                                        |      |
| **A/B-2** | Pacing burst                                       | On each arm, click `Run burst probe` with `pace sends 10 ms apart (off = 0 ms)` on, then reload, clear it, and run the arm again.                                                                                            | Twenty read-only fetches each time. The status reads `burst: 20 fetches, <t> timed out, <n> refused, min <a> ms, p50 <b> ms, max <c> ms`. Record all six numbers.                                                                                                                                                                                                                                                                                                            |      |
| **R**     | **Restore — mandatory, every arm**                 | The `Write back (RAM)` click sends one `HEARTBEAT TYPE 255` itself, from a `finally`, so it goes out even when a write is refused. If anything at all went odd, click `Restore heartbeat` yourself before you leave the arm. | The status reads `restore heartbeat sent - the module can change page again`, or `restore-page-change` appears in **Steps** with outcome `ok` after the write. **Do not finish an arm without this row passing** — a successful config write leaves the module unable to change page, from its own script or from outside, until a type 255 heartbeat arrives or the module is power-cycled.                                                                                 |      |
| **E**     | Export                                             | Click `Export JSON` on each arm, after the burst probe so the burst is in the file.                                                                                                                                          | One JSON file per arm downloads, named `hangar-skeleton-<arm>-<timestamp>.json`. Keep them; they are the only thing that makes the measurements answerable in writing.                                                                                                                                                                                                                                                                                                       |      |
| **P**     | Permission persistence (free observation, Phase 6) | After the run, quit the browser completely, reopen it, open the page, and read the line under the connect button.                                                                                                            | The line reads `previously granted ports: <n>`. Record `<n>`. The page only reads that number on load; it never reconnects on its own. One line here saves Phase 6 an experiment.                                                                                                                                                                                                                                                                                            |      |

On arm A the host heartbeat is a type 255 beat every 300 ms, so page change is being restored
continuously anyway. On arm B there is no such beat, and row R is the only thing restoring it — which
is exactly why the row is mandatory rather than advisory.

## If something goes wrong

The page has one named state per failure, and the name is the diagnosis. Whatever happens, click
`Restore heartbeat` before closing the tab.

| What the page says                                                             | What it means                                                                                                                                                                  |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `This browser cannot talk to hardware`                                         | No Web Serial in this context. Either the browser genuinely has none, or the page was opened over `file://` or over plain HTTP on something that is not `localhost`.           |
| `You closed the chooser`                                                       | The picker was dismissed. Nothing was opened and nothing was sent. Click `Connect` again.                                                                                      |
| `Another program is holding the port`                                          | Grid Editor, almost always, including from its tray icon after its window is closed. Follow the six recovery steps the page lists, in that order.                              |
| `The ZONA is not there any more`                                               | The module was picked but was gone by the time the port opened. A charge-only or loose cable, or an underpowered hub.                                                          |
| `The port would not open`                                                      | Anything else the browser reported; the raw message is printed underneath. Copy it out.                                                                                        |
| `no ZONA heartbeat carrying an active page arrived inside the identify window` | 1500 ms passed with no heartbeat carrying a page number. Either this is not the module on the cable, or its firmware predates the piggybacked page report. Not a HANGAR fault. |
| `write back refused: ...`                                                      | D-09: the fetched strings were not trustworthy, so the write buttons stayed disabled. The reason names the event. Nothing was written.                                         |
| `the port closed: ...`                                                         | The port went away mid-run — an unplug, or the tab being hidden. Any pending request is aborted with a named reason.                                                           |
| `<step> stopped: ...`                                                          | A timeout, a negative acknowledgement, or a retry bound reached. The **Steps** list and the **Frame log** below it hold the detail.                                            |

A run that ends in a named failure state with the restore heartbeat sent is a useful result, not a
wasted session. The failure paths are what Phase 6 and Phase 7 are built around.

## What to hand back

- **The exported JSON files, one per arm** — a path to them, or paste them. They are the only input
  to `docs/SKELETON-RESULTS.md`.
- **Which checklist rows passed**, and for any that did not, what the page showed instead.
- **The `previously granted ports` number** from row P.
- **Anything the page showed that this runbook did not predict** — including whether step 0's
  port-conflict message read as helpful or as jargon.
