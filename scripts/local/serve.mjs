// Serves the HANGAR build from this folder on http://localhost:5173 with no
// dependencies beyond Node itself. localhost is a secure context, so Web Serial
// works in Chrome, Edge and desktop Firefox 151+; a file:// page would not.
// Unknown paths get 404.html, which is how the app's dynamic routes boot.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "build");
const PORT = Number(process.env.PORT || 5173);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".wasm": "application/wasm",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".gz": "application/gzip",
};

function send(res, file, status = 200) {
  const type = TYPES[extname(file).toLowerCase()] || "application/octet-stream";
  res.writeHead(status, {
    "Content-Type": type,
    "Content-Length": statSync(file).size,
    "Cache-Control": "no-store",
  });
  createReadStream(file).pipe(res);
}

createServer((req, res) => {
  const url = decodeURIComponent((req.url || "/").split("?")[0]);
  const wanted = resolve(ROOT, "." + normalize(url));
  if (!wanted.startsWith(ROOT)) {
    res.writeHead(403).end();
    return;
  }
  let file = wanted;
  if (existsSync(file) && statSync(file).isDirectory())
    file = join(file, "index.html");
  if (existsSync(file) && statSync(file).isFile()) return send(res, file);
  send(res, join(ROOT, "404.html"), 404);
}).listen(PORT, "127.0.0.1", () => {
  console.log("HANGAR is running at http://localhost:" + PORT + "/");
  console.log("Leave this window open. Close it to stop.");
});
