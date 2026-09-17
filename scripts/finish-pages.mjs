import { copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = join(root, "dist", "client");
const shellPath = join(clientDir, "_shell.html");

let html = readFileSync(shellPath);
html = Buffer.from(html.filter((b) => b !== 0));
writeFileSync(join(clientDir, "index.html"), html);
copyFileSync(join(clientDir, "index.html"), join(clientDir, "404.html"));
console.log("[pages] wrote dist/client/index.html and 404.html");
