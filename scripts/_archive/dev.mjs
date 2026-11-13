import { spawn, spawnSync } from "node:child_process";
import { access } from "node:fs/promises";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const pnpmCli = process.env.npm_execpath;
const isWindows = process.platform === "win32";
const services = [
  { name: "backend", tool: "tsx", arguments: ["dev"] },
  {
    name: "frontend",
    tool: "vite",
    arguments: ["dev", "--clearScreen", "false"],
  },
].map((service) => ({ ...service, child: undefined, closed: false }));

let stopping = false;
let exitCode = 0;
let forceTimer;
let exitTimer;

function finishIfClosed() {
  if (!stopping || services.some((service) => service.child && !service.closed))
    return;
  clearTimeout(forceTimer);
  clearTimeout(exitTimer);
  process.exitCode = exitCode;
}

function killTree(service, force) {
  const child = service.child;
  if (!child?.pid || service.closed) return;

  if (isWindows) {
    // These PIDs belong only to the children created by this launcher.
    // /T also removes tsx/Vite descendants instead of leaving background servers.
    const result = spawnSync(
      "taskkill",
      ["/PID", String(child.pid), "/T", "/F"],
      {
        stdio: "ignore",
        windowsHide: true,
        timeout: 5_000,
      },
    );
    if (result.error) child.kill("SIGKILL");
    return;
  }

  try {
    process.kill(-child.pid, force ? "SIGKILL" : "SIGTERM");
  } catch (error) {
    if (error.code !== "ESRCH") {
      console.error(
        `[dev] 无法停止 ${service.name}，请检查该启动器创建的子进程。`,
      );
      exitCode = 1;
    }
  }
}

function forceStop() {
  clearTimeout(forceTimer);
  for (const service of services) killTree(service, true);
  clearTimeout(exitTimer);
  exitTimer = setTimeout(() => process.exit(exitCode || 1), 1_500);
  finishIfClosed();
}

function stop(code) {
  if (stopping) {
    forceStop();
    return;
  }

  stopping = true;
  exitCode = code;
  console.info("\n[dev] 正在停止前端和后端…");
  for (const service of services) killTree(service, false);
  forceTimer = setTimeout(forceStop, 5_000);
  finishIfClosed();
}

async function main() {
  if (!pnpmCli || !/^pnpm\.(?:c?js|mjs)$/i.test(basename(pnpmCli))) {
    console.error("[dev] 请在项目根目录使用 pnpm dev 启动。");
    process.exitCode = 1;
    return;
  }

  process.on("SIGINT", () => stop(0));
  process.on("SIGTERM", () => stop(0));
  console.info("[dev] 同时启动前后端，按 Ctrl+C 统一退出。");
  console.info("[dev] 前端默认地址：http://localhost:43081/home");
  console.info("[dev] 后端默认地址：http://127.0.0.1:43080/api/v1/health");

  for (const service of services) {
    const child = spawn(
      process.execPath,
      [pnpmCli, "--dir", join(root, service.name), ...service.arguments],
      {
        cwd: root,
        stdio: "inherit",
        shell: false,
        windowsHide: true,
        detached: !isWindows,
      },
    );
    service.child = child;

    child.once("error", () => {
      service.closed = true;
      console.error(`[dev] ${service.name} 启动失败，请检查该工程的依赖。`);
      if (!stopping) stop(1);
      else finishIfClosed();
    });
    child.once("close", (code) => {
      service.closed = true;
      if (!stopping) {
        console.error(`[dev] ${service.name} 已退出，正在停止另一项服务。`);
        stop(code === 0 ? 0 : 1);
      } else finishIfClosed();
    });
  }
}

await main();
