# HANGAR

A public web playground for Intech Studio's ZONA — the 9x9 XY-pad module.

Browse a catalog of pad configurations, watch every one of them animate live in a
firmware-faithful simulator in the browser, turn a few knobs, and load the result
straight onto your own ZONA over Web Serial. No Grid Editor, no install, no account,
and no hardware required to look around.

## Requirements

- Node.js 24 or newer (see `.nvmrc`; `engine-strict=true` makes this a hard check)
- npm

## Development

```bash
npm install
npm run dev
```

## Scripts

| Script              | What it does                           |
| ------------------- | -------------------------------------- |
| `npm run dev`       | Vite dev server                        |
| `npm run build`     | Static build into `build/`             |
| `npm run check`     | `svelte-check` against `tsconfig.json` |
| `npm run lint`      | `prettier --check .` then `eslint .`   |
| `npm run format`    | `prettier --write .`                   |
| `npm run test:unit` | Vitest                                 |
| `npm run test:e2e`  | Playwright                             |

## Hardware support

Web Serial requires a secure context and exists in Chromium-based browsers and in
desktop Firefox 151 and newer. Where it is absent the catalog and the simulator still
work; only installing to hardware is disabled. The capability is detected by feature,
never by user agent.

## Licence

Copyright (C) 2026 Botond Sandor

This program is free software: you can redistribute it and/or modify it under the
terms of the GNU General Public License as published by the Free Software Foundation,
either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this
program. If not, see <https://www.gnu.org/licenses/>.

HANGAR reuses code from Intech Studio's Grid Editor, which is GPLv3; HANGAR is
therefore a derivative work and ships under the same licence with corresponding
source available from the deployed site.
