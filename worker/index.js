// Basic Auth gate in front of the HANGAR preview.
//
// Every request runs through here first (assets.run_worker_first = true in wrangler.jsonc),
// so no asset can be reached without credentials. The gate is removed on launch day, not
// before (D-03/D-07) — and because the check is a single fail-closed early return driven by
// the presence of the secret, removing it means deleting the secret and the
// run_worker_first flag, not rewriting this file.
//
// SITE_USER and SITE_PASSWORD are Worker secrets:
//   npx wrangler secret put SITE_PASSWORD
// Locally they come from .dev.vars (gitignored).
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
    const expectedUser = env.SITE_USER || "hangar";
    const expectedPass = env.SITE_PASSWORD;

    // Fail closed: with no secret configured nothing is reachable.
    if (!expectedPass) return unauthorized();

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

    // Evaluate both so a wrong username costs the same as a wrong password.
    const okUser = safeEqual(user, expectedUser);
    const okPass = safeEqual(pass, expectedPass);
    if (!(okUser && okPass)) return unauthorized();

    const asset = await env.ASSETS.fetch(request);
    const res = new Response(asset.body, asset);
    res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    res.headers.set("Cache-Control", "private, no-store");
    res.headers.set("Referrer-Policy", "no-referrer");
    return res;
  },
};
