// Basic Auth gate in front of the HANGAR preview.
//
// Every request runs through here first (assets.run_worker_first = true in wrangler.jsonc),
// so no asset can be reached without credentials. The gate is removed on launch day, not
// before (D-03/D-07) — and because the check is a single fail-closed early return driven by
// the presence of the secret, removing it means deleting the secret and the
// run_worker_first flag, not rewriting this file.
//
// Credentials are Worker secrets, locally from .dev.vars (gitignored):
//   SITE_USER / SITE_PASSWORD   the first account (SITE_USER defaults to "hangar")
//   SITE_USERS                  further accounts as "user:password,user:password"
//   npx wrangler secret put SITE_PASSWORD
//   npx wrangler secret put SITE_USERS
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

function unauthorized() {
  return new Response("Authentication required.\n", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="HANGAR preview", charset="UTF-8"',
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}

// Length-independent comparison, so response time does not leak the secret.
function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  const n = Math.max(x.length, y.length);
  for (let i = 0; i < n; i++) {
    diff |= (x[i] || 0) ^ (y[i] || 0);
  }
  return diff === 0;
}

export default {
  async fetch(request, env) {
    const accounts = [];
    if (env.SITE_PASSWORD) {
      accounts.push([env.SITE_USER || "hangar", env.SITE_PASSWORD]);
    }
    for (const pair of (env.SITE_USERS || "").split(",")) {
      const at = pair.indexOf(":");
      if (at > 0) accounts.push([pair.slice(0, at), pair.slice(at + 1)]);
    }

    // Fail closed: with no account configured nothing is reachable.
    if (accounts.length === 0) return unauthorized();

    const header = request.headers.get("Authorization") || "";
    if (!header.startsWith("Basic ")) return unauthorized();

    let decoded;
    try {
      decoded = atob(header.slice(6));
    } catch {
      return unauthorized();
    }

    const split = decoded.indexOf(":");
    if (split < 0) return unauthorized();

    const user = decoded.slice(0, split);
    const pass = decoded.slice(split + 1);

    // Every account is compared, both halves each time, so a wrong username
    // costs the same as a wrong password and the account count does not leak.
    let ok = false;
    for (const [expectedUser, expectedPass] of accounts) {
      const okUser = safeEqual(user, expectedUser);
      const okPass = safeEqual(pass, expectedPass);
      if (okUser && okPass) ok = true;
    }
    if (!ok) return unauthorized();

    const asset = await env.ASSETS.fetch(request);
    const res = new Response(asset.body, asset);
    res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    res.headers.set("Cache-Control", "private, no-store");
    res.headers.set("Referrer-Policy", "no-referrer");
    return res;
  },
};
