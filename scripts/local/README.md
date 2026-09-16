# HANGAR, running locally

A playground for Intech Studio's ZONA. Browse configurations, try them in the
browser, tune them, build your own surface, and install to your ZONA over USB.

## Run it

1. Install Node.js 20 or newer from https://nodejs.org if you do not have it.
2. Double-click `HANGAR.cmd`. A window opens and stays open; Chrome opens on
   http://localhost:5173/ after a moment. Close the window to stop.

On macOS or Linux: `node serve.mjs`, then open http://localhost:5173/ in Chrome.

## Installing to a ZONA

Use Chrome, Edge or desktop Firefox 151 or newer. Plug the ZONA in, close Grid
Editor and any other tab that holds the port, then click Connect ZONA in the
header. Nothing is written to the module without a click.

- Store on ZONA returns the page to its firmware default, writes the
  configuration and stores it to flash so it stays after power-off.
- Clear returns the current page to the firmware default and stores that.

## Licence

HANGAR is free software under the GNU GPL v3 or later. The corresponding source
is in `build/source-<commit>.tar.gz`; third-party notices are in
`build/THIRD-PARTY.md` and `build/licenses/`.
