// بيشغّل Vite (dev عشان تحذيرات React تبان) وبعدين اختبارات e2e. exit 1 لو أي اختبار فشل.
// الاستخدام: npm run test:e2e   |   npm run test:e2e -- functional   |   -- customer   |   -- admin   |   -- reduced
import fs from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const PORT = Number(process.env.E2E_PORT || 5199);
const only = process.argv[2];

// ── فحص الكود: مفيش dark mode خالص (الموقع فاتح دايماً) ──
function noDarkModeCheck() {
  const hits = [];
  const walk = (dir) => {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, f.name);
      if (f.isDirectory()) walk(p);
      else if (/\.(jsx?|css|html)$/.test(f.name)) {
        fs.readFileSync(p, "utf8").split("\n").forEach((l, i) => {
          if (/(^|[\s"'`])dark:/.test(l) || /prefers-color-scheme:\s*dark/.test(l)) hits.push(`${path.relative(root, p)}:${i + 1}`);
        });
      }
    }
  };
  walk(path.join(root, "src"));
  const tw = fs.readFileSync(path.join(root, "tailwind.config.js"), "utf8");
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const css = fs.readFileSync(path.join(root, "src/index.css"), "utf8");
  const rows = [
    ["no dark: classes or prefers-color-scheme: dark rules in src", hits.length === 0, hits.slice(0, 5).join(", ")],
    ["tailwind darkMode is not media", /darkMode:\s*"class"/.test(tw)],
    ['<meta name="color-scheme" content="light">', /<meta name="color-scheme" content="light"/.test(html)],
    [":root { color-scheme: light }", /:root\s*{\s*color-scheme:\s*light;?\s*}/.test(css)],
  ];
  console.log("\n━━━ no dark mode (code) ━━━");
  for (const [name, ok, detail] of rows) console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  return rows.every(([, ok]) => ok) ? 0 : 1;
}

const server = await createServer({ root, server: { port: PORT, strictPort: true }, logLevel: "warn" });
await server.listen();
const env = { ...process.env, E2E_BASE_URL: `http://localhost:${PORT}` };

const suites = [
  { name: "functional", file: "functional.mjs" },
  { name: "customer", file: "customer.mjs" },
  { name: "admin", file: "responsive.mjs" },
  { name: "reduced functional", file: "functional.mjs", env: { REDUCED: "1" } },
  { name: "reduced customer", file: "customer.mjs", env: { REDUCED: "1" } },
  { name: "reduced admin", file: "responsive.mjs", env: { REDUCED: "1" } },
].filter((s) => !only || s.name.startsWith(only) || s.name.endsWith(only));

const run = (s) => new Promise((resolve) => {
  console.log(`\n━━━ ${s.name} ━━━`);
  const child = spawn(process.execPath, [path.join(here, s.file)], { env: { ...env, ...s.env }, stdio: "inherit" });
  child.on("exit", (code) => resolve(code ?? 1));
});

const results = [["no dark mode (code)", noDarkModeCheck()]];
try {
  for (const s of suites) results.push([s.name, await run(s)]);
} finally {
  await server.close();
}

console.log("\n━━━ Summary ━━━");
for (const [name, code] of results) console.log(`${code === 0 ? "PASS" : "FAIL"}  ${name}`);
process.exit(results.every(([, code]) => code === 0) ? 0 : 1);
