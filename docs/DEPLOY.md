# Deploying HANGAR

Deploys are **manual, from this machine, with one command**: `npm run deploy`. There is no CI
pipeline and no host-side Git integration — nothing deploys because a branch moved (D-08).

## One-time setup

Run these in order, from the repository root:

```bash
npx wrangler whoami                    # confirm the Cloudflare account
npx wrangler secret put SITE_USER      # value: hangar
npx wrangler secret put SITE_PASSWORD  # a password you choose
npx wrangler secret list               # confirm both are set
```

**On a brand new Worker the three `secret` commands only work after the first `npm run deploy`.**
`wrangler secret put` targets a Worker, and the Worker does not exist until something has been
deployed to it. So the very first time, the order is: deploy, then set the two secrets, then open the
site.

That ordering is safe because the Worker **fails closed**. `worker/index.js` returns 401 to every
request while `SITE_PASSWORD` is unset — correct credentials included — so in the gap between the
first deploy and the secrets being set the site is not publicly readable. A secret takes effect on the
deployed Worker immediately; no redeploy is needed.

**The password is never committed.** It lives in two places and neither is tracked: the Worker secret
in Cloudflare, and — for local `wrangler dev` and the Playwright suite — the gitignored `.dev.vars`.
The committed `.dev.vars.example` documents the shape of that file and holds placeholders only. Never
put the password in a file under version control, in a commit message, or in a planning document.

## Deploying

```bash
npm run deploy
```

That runs `scripts/deploy.mjs`, which is six gates in a fixed order. Each one refuses rather than
warns, because each corresponding failure is otherwise silent:

| Step | Gate                                | Why it refuses                                                                                                                                                         |
| ---- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | `git rev-parse HEAD` resolves       | The archive filename, the footer link and the deploy banner all derive from the SHA. A build without one cannot produce a link that resolves.                          |
| 2    | `git status --porcelain` is empty   | `git archive` ships HEAD while Vite bundles the working tree. A dirty deploy serves an archive that is not the source of the bundle beside it.                         |
| 3    | `npm run build` succeeds            | No point shipping a half-built directory.                                                                                                                              |
| 4    | Six artefacts exist in `build/`     | `index.html`, `404.html`, `LICENSE`, `THIRD-PARTY.md`, `licenses/` and `source-<sha>.tar.gz`.                                                                          |
| 5    | The archive is Corresponding Source | It must contain `package-lock.json` and no `.planning/` entry. `export-ignore` fails silently from an uncommitted `.gitattributes`, so this listing is the real check. |
| 6    | `npx wrangler deploy` succeeds      | —                                                                                                                                                                      |

**A dirty tree is refused on purpose, and the fix is to commit — not to bypass the gate.** The script
prints the offending paths. Commit them (or stash them) and run it again. There is deliberately no
`--force` flag: the thing being protected is the GPLv3 section 6(d) correspondence between the served
bundle and the served source archive, and there is no situation in which shipping them out of step is
the right answer.

On success the script prints the deployed SHA, the site URL and the source archive path.

## What gets deployed

`build/` only, and nothing else. That directory is:

- the prerendered site (`index.html`, `404.html`, the hashed assets),
- `LICENSE` — the GPLv3 text plus the HANGAR copyright notice,
- `THIRD-PARTY.md` — the third-party licence notices,
- `licenses/` — the full licence text of every production dependency,
- `source-<sha>.tar.gz` — the source archive for exactly the commit that produced the bundle.

`worker/index.js` sits in front of all of it. `run_worker_first` is `true` in `wrangler.jsonc`, so
there is no asset path around the gate: the licence files and the archive are behind it too.

Nothing else in the repository is uploaded. The archive itself is filtered by the committed
`.gitattributes`, so internal planning material does not travel inside it either.

## The preview gate

The site is behind Basic Auth because a public, un-gated deploy is **embargoed until a date the user
will set** (D-03). That date is currently **TBD**. Until it is set, every deploy is a gated preview
(D-07), and nothing in Phase 1 removes the gate.

Removing it on launch day is a two-line change, not a rewrite:

1. Delete the `SITE_PASSWORD` secret (`npx wrangler secret delete SITE_PASSWORD`). The Worker fails
   closed on a missing secret, so this alone makes the site unreachable rather than public — which is
   why step 2 is the other half.
2. Remove the `run_worker_first` flag from `wrangler.jsonc`, or narrow it to the specific routes the
   Worker still needs to handle, and redeploy.

The gate is a single fail-closed early return driven by the presence of the secret, which is what
makes that a configuration change rather than a code change. The Worker itself survives — it is the
thing that will render OG images later.

**Ask before any deploy that removes the gate.** The embargo date is the user's to set and has not
been set.

## Manual verification after a deploy

Repeat this checklist after any deploy that matters. `<user>` and `<pass>` are the two Worker secrets;
do not paste the password into a file or a commit.

1. The site loads over **HTTPS** at <https://hangar.sabotond.workers.dev>.
2. The browser shows a **sign-in prompt for the realm `HANGAR preview`** before any content. If the
   page loads with no prompt, stop — the gate is not working, and that is a blocker.
3. After signing in, the page renders with the `HANGAR` heading and a footer.
4. The footer shows a 40-character commit SHA, and it equals `git rev-parse HEAD`.
5. The footer `Source` link downloads `source-<that same sha>.tar.gz`, and the archive opens. Inside
   it: a `hangar-<short-sha>/` folder containing `package-lock.json`, `package.json`, `vite.config.ts`
   and `LICENSE`, and **no** `.planning/` folder.
6. `/LICENSE` serves the GNU GPL v3 text and `/THIRD-PARTY.md` lists `@intechstudio/grid-protocol` as
   GPL-3.0 and `@wasm-fmt/lua_fmt` as MIT.
7. The response carries the noindex header:

   ```bash
   curl -I -u <user>:<pass> https://hangar.sabotond.workers.dev/
   ```

   Expect `x-robots-tag: noindex, nofollow, noarchive`.

The equivalent status-code checks, if you prefer them to a browser:

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://hangar.sabotond.workers.dev/                    # 401
curl -s -o /dev/null -w '%{http_code}\n' -u <user>:<pass> https://hangar.sabotond.workers.dev/   # 200
```

## Custom domain

Out of scope for Phase 1. The preview lives on the workers.dev subdomain; whether the site gets a
custom domain is a launch-day decision and is deferred until the embargo date exists.
