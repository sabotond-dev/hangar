# Phase 05.1 — deferred items

Out-of-scope discoveries, logged rather than fixed, per the execution scope boundary.

---

## 1. A browser Back into a filtered `/browse/` renders the unfiltered shelf

**Found during:** 05.1-09, task 3, while running the `flushAddress()` negative check.
**Owner:** `src/routes/browse/+page.svelte` (built by 05.1-08). **Not caused by 05.1-09** — that plan
adds `BrowseLink.svelte`, a header row in `FrontDoor.svelte` and a `beforeNavigate` on `/c/[id]/`,
none of which runs before the browse page seeds its filter state.

**Measured on the served production build (`wrangler dev`, real `build/` bytes):**

```
HARD LOAD  /browse/?tag=playable -> cards: 4  | chips: tag-playable | 4 of 16 configurations.
AFTER CLICK (chip pressed)       -> cards: 4  | chips: tag-playable | 4 of 16 configurations. | url: ?tag=playable
AFTER BROWSER BACK               -> cards: 16 | chips: (none)       | 16 of 16 configurations. | url: ?tag=playable
```

The address bar and the screen disagree: the URL says `?tag=playable`, the page shows all sixteen and
no chip is active. A hard load of the same address is correct, and so is `BACK TO BROWSE`, which is a
`goto` — 05.1-09 measured a full round trip restoring sort, query, chips **and** scroll offset
through that path. **Only the browser's own Back button is affected.**

**Likely cause, unconfirmed.** The page seeds its three runes once, at component-init scope, from
`page.url.searchParams`. On a `popstate` the new page component appears to initialise before
`$app/state`'s `page.url` has been swapped, so the seed reads the *previous* URL — `/c/chorus/`,
whose search string is empty — and falls to `DEFAULT_QUERY`. A `goto` does not show the symptom,
which is what makes the timing the first thing to check rather than the parse.

**Why it is not fixed here.** It is a defect in a file 05.1-09 does not touch, it is not reachable
from any of 05.1-09's own paths, and the obvious repair (re-seeding from `afterNavigate`, or a
`$derived` over `page.url` for popstates only) reopens the D-16 / Pitfall 7a argument that
05.1-08 settled deliberately. That is a decision, not a patch.

**Suggested owner:** 05.1-10 (the e2e suite — this is one assertion) and 05.1-11 (the phase gate).

---

## 2. `05.1-UI-SPEC.md` asks for `replaceState` on the return, and it cannot have it

**Found during:** 05.1-09, task 3. **Resolved in 05.1-09**, logged here because the spec text is now
wrong and should be corrected before the phase gate reads it.

The spec's *What "recorded" means* section says *"Returning uses `replaceState` with `noScroll`, so
browse → detail → back reads as one round trip rather than growing the history."* On Kit 2.70.3 that
breaks the browser's Back button on this exact journey: `navigate()` (client.js:1874) does
`const change = replace_state ? 0 : 1` and bumps the NAVIGATION index by `change`, so a replacing
navigation leaves `current_navigation_index` untouched; the popstate handler (client.js:2886) then
finds `navigation_index === current_navigation_index`, takes its shallow branch, and updates the
address without rendering anything. Observed: the address bar read `/c/ghost/` while the browse
screen was still on the page, five seconds later.

`BrowseLink.svelte` ships `{ noScroll: true }` alone, which is what plan 05.1-09's own interfaces
table asks for. The round trip therefore costs one history entry. **The spec sentence should be
amended** rather than left to be re-implemented by someone reading it later.
