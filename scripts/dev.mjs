import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const backendRequire = createRequire(
  new URL("../backend/package.json", import.meta.url),
);
const frontendRequire = createRequire(
  new URL("../frontend/package.json", import.meta.url),
);
const services = [
  {
    name: "backend",
    entry: backendRequire.resolve("tsx/cli"),
    args: ["watch", "src/server.ts"],
  },
  {
    name: "frontend",
    entry: join(
      dirname(frontendRequire.resolve("vite/package.json")),
      "bin/vite.js",
    ),
    args: [],
  },
];
const children = [];
let stopping = false;

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) {
    if (!child.pid || child.exitCode !== null) continue;
    if (process.platform === "win32") {
      // Watchers launch servers; terminate the entire owned process tree.
      const terminate = spawn(
        "taskkill",
        ["/pid", String(child.pid), "/T", "/F"],
        {
          stdio: "ignore",
          windowsHide: true,
        },
      );
      terminate.once("error", () => child.kill());
      terminate.once("exit", (result) => {
        if (result !== 0) child.kill();
      });
    } else {
      try {
        process.kill(-child.pid, "SIGTERM");
      } catch {
        /* Child already exited. */
      }
    }
  }
}

for (const { name, entry, args } of services) {
  const child = spawn(process.execPath, [entry, ...args], {
    cwd: fileURLToPath(new URL(`../${name}/`, import.meta.url)),
    stdio: "inherit",
    detached: process.platform !== "win32",
    windowsHide: true,
  });
  children.push(child);
  child.once("error", (error) => {
    console.error(`${name} 启动失败：${error.message}`);
    stop(1);
  });
  child.once("exit", (code, signal) => {
    if (stopping) return;
    console.error(
      `${name} 已退出（${signal ?? code ?? "unknown"}），正在停止开发服务。`,
    );
    stop(code || 1);
  });
}

process.once("SIGINT", () => stop());
process.once("SIGTERM", () => stop());
