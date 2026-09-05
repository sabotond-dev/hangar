# Phase 05.1 — deferred items

Out-of-scope discoveries, logged rather than fixed, per the execution scope boundary.

---

## 1. A browser Back into a filtered `/browse/` renders the unfiltered shelf — **RESOLVED in 05.1-10**

**Resolved:** 05.1-10, commit `cbe797d`. Reproduced in four journeys on the served production build,
repaired with a second seed in `afterNavigate` gated on `navigation.type === "popstate"`, and held by
`e2e/browse.e2e.ts` test 8. Both negative checks observed.

**The cause was not the one guessed below, and the difference matters.** `Kit 2.70.3 client.js:2573`:
`replaceState` writes `[PAGE_URL_KEY]: page.url.href` into the history entry — the page store's url,
which `replaceState` itself never updates — while putting a *different* url in the address bar. Every
shallow write therefore leaves the entry remembering the address the DOCUMENT was entered with; the
popstate handler reads that key back (`client.js:2883`) and hands `update_url` a stale URL. So the
timing guess below is wrong: the component does not race `page.url`, it is handed a `page.url` that is
one whole visit out of date, and reading it from `afterNavigate` reproduces the defect exactly. The
repair reads `window.location.search`, which is the browser's own answer. Details and the four
journeys are in `05.1-10-SUMMARY.md`.

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

---

## 3. `05.1-RESEARCH.md` Pitfall 2 states the `page.url` asymmetry backwards

**Found during:** 05.1-10, task 4, while repairing item 1. **Not fixed here**, because a research
document is a record of what was known when it was written and rewriting one mid-phase makes every
citation of it ambiguous.

Pitfall 2 and the §Architecture source-read both say `page.url` is *"stale on write and fresh on
back"*. It is stale in **both** directions, for the reason recorded against item 1: `replaceState`
records the page store's url into the history entry rather than the url it is writing to the address
bar, so `update_url` on a popstate is handed the entry URL. The corrected statement now lives in the
header of `src/routes/browse/+page.svelte`, beside the code it governs, and in `05.1-10-SUMMARY.md`.

**Suggested owner:** 05.1-11 (the phase gate), together with item 2's spec sentence.
