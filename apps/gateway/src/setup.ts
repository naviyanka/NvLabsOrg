import { createInterface } from "readline";
import { isatty } from "tty";
import { saveConfig } from "./config.js";
import { detectBackends, getBackend } from "./backends.js";

function ask(rl: ReturnType<typeof createInterface>, question: string): Promise<string> {
  return new Promise((resolve) => {
    // Handle case where stdin closes unexpectedly
    const onClose = () => resolve("");
    rl.once("close", onClose);
    rl.question(question, (answer) => {
      rl.removeListener("close", onClose);
      resolve(answer.trim());
    });
  });
}

export async function runSetup(): Promise<void> {
  // Detect AI backends regardless of TTY
  console.log("[Setup] Detecting AI backends...");
  const detected = detectBackends();
  const detectedNames = detected.map((id) => getBackend(id)?.name ?? id).join(", ");
  console.log(`[Setup] Found: ${detectedNames || "none"}`);

  // The interactive wizard is opt-in via `--setup`. Do not touch process.stdin
  // on any other path: `process.stdin` is a lazy getter that initialises the
  // fd-0 handle on first access, and on Windows that initialisation blocks
  // forever when the gateway shares a console with a sibling process — which is
  // exactly what `pnpm dev` does by starting it next to the web app. The old
  // `if (!process.stdin.isTTY)` probe deadlocked first-run boot for that reason.
  if (!process.argv.includes("--setup") || !isatty(0) || !isatty(1)) {
    saveConfig({ detectedBackends: detected, defaultBackend: detected[0] ?? "claude", sandboxMode: "full" });
    console.log("✓ Default config saved to config.json");
    console.log("  Run with --setup in a terminal to configure.\n");
    return;
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  console.log("");
  console.log("╔══════════════════════════════════════╗");
  console.log("║       NVLabs Org — First Setup        ║");
  console.log("╚══════════════════════════════════════╝");
  console.log("");
  console.log("Press Enter to skip any step.\n");

  // Ably
  console.log("── Remote Access (Ably) ──────────────");
  console.log("Enables access from outside your LAN.");
  const ablyApiKey = await ask(rl, "Ably API Key (optional): ");

  // AI Backends
  let defaultBackend = detected[0] ?? "claude";
  if (detected.length > 1) {
    console.log("\n── AI Backends ───────────────────────");
    console.log(`Detected: ${detectedNames}`);
    const choices = detected.map((id, i) => `${i + 1}=${getBackend(id)?.name ?? id}`).join(", ");
    const pick = await ask(rl, `Default backend (${choices}): `);
    const idx = parseInt(pick, 10) - 1;
    if (idx >= 0 && idx < detected.length) {
      defaultBackend = detected[idx];
    }
  }

  // Sandbox mode
  console.log("\n── Agent Permissions ─────────────────");
  console.log("1 = Full access (agents can access entire machine)");
  console.log("2 = Sandbox (agents restricted to working directory)");
  const sandboxPick = await ask(rl, "Permission mode (1/2, default=1): ");
  const sandboxMode: "full" | "safe" = sandboxPick === "2" ? "safe" : "full";

  // Cloudflare Tunnel
  console.log("\n── Cloudflare Tunnel ─────────────────");
  console.log("Enables remote preview access via Telegram.");
  console.log("Get your token from: Cloudflare Zero Trust > Networks > Tunnels");
  const tunnelToken = await ask(rl, "Tunnel token (optional): ");
  let tunnelBaseUrl = "";
  if (tunnelToken) {
    tunnelBaseUrl = await ask(rl, "Public URL (e.g. https://office.example.com): ");
  }

  rl.close();

  saveConfig({
    ablyApiKey: ablyApiKey || undefined,
    detectedBackends: detected,
    defaultBackend,
    sandboxMode,
    ...(tunnelToken ? { tunnelToken } : {}),
    ...(tunnelBaseUrl ? { tunnelBaseUrl: tunnelBaseUrl.replace(/\/+$/, "") } : {}),
  });

  console.log("\n✓ Config saved to config.json");
  if (ablyApiKey) console.log("  • Ably: enabled");
  console.log(`  • Default AI: ${getBackend(defaultBackend)?.name ?? defaultBackend}`);
  console.log(`  • Permissions: ${sandboxMode === "full" ? "Full access" : "Sandbox"}`);
  if (tunnelToken) console.log(`  • Tunnel: ${tunnelBaseUrl || "(token set, no URL)"}`);
  console.log("  • Run with --setup to reconfigure\n");
}
