import { cpSync, existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const workspaceRoot = resolve(import.meta.dirname, "..");
const webDist = resolve(workspaceRoot, "apps", "web", "dist");
const rootDist = resolve(workspaceRoot, "dist");

if (!existsSync(webDist)) {
  throw new Error(`Web dist not found: ${webDist}`);
}

rmSync(rootDist, { recursive: true, force: true });
cpSync(webDist, rootDist, { recursive: true });

console.log(`Synced ${webDist} -> ${rootDist}`);
