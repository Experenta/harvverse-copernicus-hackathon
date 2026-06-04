import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { processScenarioAlert } from "../agent/process-scenario.js";

const args = process.argv.slice(2);
const fixtureArg = args.find((a) => !a.startsWith("--"));
const dryRun = args.includes("--dry-run");
const fetchMode = args.includes("--fetch");
const forceLlm = args.includes("--llm");
const skipLlm = args.includes("--no-llm");

const fixturePath = resolve(
  import.meta.dirname,
  "../../fixtures/agent",
  fixtureArg ?? "ndvi-drop-money-inline.json",
);

const raw = readFileSync(fixturePath, "utf8");
const payload: unknown = JSON.parse(raw);

console.info("[sentinel-agent] fixture:", fixturePath);
console.info("[sentinel-agent] mode:", fetchMode ? "harvverse fetch" : "inline");
console.info(
  "[sentinel-agent] llm:",
  skipLlm ? "off" : forceLlm ? "on" : "auto",
);

const result = await processScenarioAlert(
  fetchMode
    ? {
        lotCode: "lotetest",
        scenario: "ndvi_drop_money",
        demoOverrides: { previousNdvi: 0.65, currentNdvi: 0.45 },
      }
    : payload,
  {
    inline: !fetchMode,
    forceGupshupDryRun: dryRun,
    llm: skipLlm ? false : forceLlm ? true : "auto",
  },
);

console.info(JSON.stringify(result, null, 2));
