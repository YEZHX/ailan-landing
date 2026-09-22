// Статический сервер лендинга без зависимостей: Railway запускает `npm start` и передаёт PORT.
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 8787;
const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".png": "image/png", ".txt": "text/plain; charset=utf-8",
};
// Наружу отдаются только страница и папка assets: server.js и package.json не видны.
const PUBLIC = new Set(["index.html", "styles.css", "i18n.js", "app.js", "robots.txt"]);

function send(res, status, body, headers) {
  res.writeHead(status, Object.assign({
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  }, headers));
  res.end(body);
}

http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return send(res, 405, "Method not allowed", { "Content-Type": "text/plain; charset=utf-8", Allow: "GET, HEAD" });
  }
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch (e) {
    return send(res, 400, "Bad request", { "Content-Type": "text/plain; charset=utf-8" });
  }
  // Нормализуем до проверки: «/assets/../server.js» превращается в «server.js» и не проходит.
  const rel = path.posix.normalize("/" + pathname).slice(1) || "index.html";
  const isPublic = PUBLIC.has(rel) || rel.startsWith("assets/");
  const target = path.join(ROOT, isPublic ? rel : "index.html");
  fs.readFile(target, (err, data) => {
    if (err) return send(res, 404, "Not found", { "Content-Type": "text/plain; charset=utf-8" });
    const ext = path.extname(target).toLowerCase();
    send(res, 200, req.method === "HEAD" ? undefined : data, {
      "Content-Type": TYPES[ext] || "application/octet-stream",
      // Страница, стили, скрипты и иконки меняются при каждом деплое под теми же именами — только фото кешируем надолго.
      "Cache-Control": rel.startsWith("assets/img/") ? "public, max-age=604800" : "no-cache",
    });
  });
}).listen(PORT, () => console.log(`Ailan landing on http://localhost:${PORT}`));
