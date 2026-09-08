<!-- Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later. -->

# The display face this build expects, and why it is not in this archive

**Family:** Grifter Bold — one static `.woff2`, expected at `static/fonts/GRIFTER-Bold.woff2`
and served by the site at `/fonts/GRIFTER-Bold.woff2`.

**Licensee:** Botond Sandor / Intech Studio.

**Licence:** a Hanson Method commercial licence, held by the licensee. Not an SPDX-identified
open licence, and no licence text is reproduced here.

## The binary is deliberately absent from this archive

If you are reading this inside `source-<sha>.tar.gz`, the `.woff2` is not beside it. That is
not an oversight and not a build fault.

HANGAR is GPLv3 and serves its own Corresponding Source as a per-deploy archive downloaded
from the site itself (GPLv3 section 6(d)). That archive is `git archive HEAD`, published at an
unauthenticated URL. Putting a foundry-licensed font file in it would **redistribute** the
font, which is a different permission from displaying a face on our own site — and it is the
permission most foundry licences withhold. GPLv3 does not oblige us to redistribute a
third-party asset we may not redistribute, so `.gitattributes` marks the file `export-ignore`
and this note stands in its place.

The exclusion is asserted from both sides rather than trusted: `src/lib/ui/font-assets.spec.ts`
reads `.gitattributes` and fails if the path is not `export-ignore`d, and
`scripts/deploy.mjs` step 5 lists the finished archive and refuses to deploy if it carries a
font binary **or** if it has lost this note. A one-sided check would go green on a build that
dropped both.

## Where to obtain it

Grifter is sold by Hanson Method (<https://hansonmethod.com>). Buy the licence you need, take
the Bold weight, convert the OTF to WOFF2 (`woff2_compress`, or any equivalent), and drop the
result at the path above. Nothing else in the build has to change: the family is named in
exactly one `@font-face` block and reached through exactly one custom property,
`--font-display`, both in `src/app.css`.

## Building without it

The build succeeds. `@font-face` for a file that 404s is not a build error and not a runtime
error; the browser simply moves down `--font-display`'s named fallbacks to `ui-sans-serif`.
Because `font-display: swap` is set and the ground is black, that is a **weight change rather
than a layout break** — the wordmark, the one heading and the micro labels render in the
system sans at the same sizes and the same tracking. Body text is unaffected: it is Inter
Variable, which is OFL-1.1 and ships normally through npm.

If you would rather not source a commercial face at all, substituting an open one is a token
edit: change the `@font-face` block's `font-family` and `src` and the first family in
`--font-display`. The gate in `src/lib/ui/identity.spec.ts` asserts those two agree, so a
half-done swap is red rather than a silent fall-through.
