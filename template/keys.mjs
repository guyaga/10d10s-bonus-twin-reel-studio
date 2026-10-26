// API keys for the Node scripts, in the same order as scripts/common.py: the environment, then the key file
// ~/.twin-studio/.env (or $TWIN_HOME/.env), then (Windows) the User environment set after this shell started.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const home = process.env.TWIN_HOME || path.join(os.homedir(), ".twin-studio");
const file = {};
try {
  for (const line of fs.readFileSync(path.join(home, ".env"), "utf8").replace(/^﻿/, "").split(/\r?\n/)) {
    const m = line.trim().match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && !line.trim().startsWith("#")) file[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
} catch {}

export const envKey = (n) => {
  const v = process.env[n] || file[n];
  if (v || process.env.TWIN_HOME || process.platform !== "win32") return v || "";
  try {
    return execFileSync("powershell", ["-NoProfile", "-Command", `[Environment]::GetEnvironmentVariable('${n}','User')`]).toString().trim();
  } catch { return ""; }
};

export const needKey = (n, where) => {
  const v = envKey(n);
  if (!v) { console.error(`[!!] ${n} is not set\n     fix: run creator.py keys and paste it (${where})`); process.exit(1); }
  return v;
};
