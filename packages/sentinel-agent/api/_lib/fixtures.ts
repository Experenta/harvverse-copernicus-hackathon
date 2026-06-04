import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const FIXTURE_DIR = resolve(import.meta.dirname, "../../fixtures/agent");

const FIXTURE_FILES: Record<string, string> = {
  ndvi: "ndvi-drop-money-inline.json",
  "ndvi-drop-money-inline": "ndvi-drop-money-inline.json",
  "scenario-request-ndvi": "scenario-request-ndvi.json",
};

export function loadAgentFixture(name: string): unknown {
  const file = FIXTURE_FILES[name];
  if (!file) {
    throw new Error(
      `Fixture desconocido: ${name}. Usa: ${Object.keys(FIXTURE_FILES).join(", ")}`,
    );
  }

  const path = resolve(FIXTURE_DIR, file);
  const raw = readFileSync(path, "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(raw) as unknown;
}

export function listAgentFixtures(): string[] {
  return Object.keys(FIXTURE_FILES);
}
