const fs = require("fs");
const http = require("http");
const path = require("path");

const rootArg = process.argv[2];
const portArg = process.argv[3];

if (!rootArg) {
  throw new Error("Missing static root path.");
}

const root = path.resolve(rootArg);
const port = Number(portArg || 5500);

if (!fs.existsSync(root)) {
  throw new Error(`Static root does not exist: ${root}`);
}

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
};

function send(response, statusCode, body, contentType) {
  response.writeHead(statusCode, {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
  });
  response.end(body);
}

function resolveFilePath(requestUrl) {
  const safePath = decodeURIComponent((requestUrl || "/").split("?")[0]);
  const normalized = path.normalize(safePath).replace(/^(\.\.[/\\])+/, "");
  const requestedPath = path.join(root, normalized);
  const resolvedPath = path.resolve(requestedPath);

  if (!resolvedPath.startsWith(root)) {
    return null;
  }

  if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
    return path.join(resolvedPath, "index.html");
  }

  return resolvedPath;
}

const server = http.createServer((request, response) => {
  const filePath = resolveFilePath(request.url);

  if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    send(response, 404, "Not found", "text/plain; charset=utf-8");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || "application/octet-stream";

  fs.readFile(filePath, (error, contents) => {
    if (error) {
      send(response, 500, "Server error", "text/plain; charset=utf-8");
      return;
    }

    send(response, 200, contents, contentType);
  });
});

server.listen(port, () => {
  console.log(`Serving ${root} at http://localhost:${port}`);
});
