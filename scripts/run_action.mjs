import { spawnSync } from "node:child_process";
import { appendFileSync, mkdtempSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const env = process.env;
const checker = fileURLToPath(new URL("./check_stl.mjs", import.meta.url));
const stl = resolve(env.GITHUB_WORKSPACE, env.MESH_GUARD_STL ?? "");
const expect = resolve(env.GITHUB_WORKSPACE, env.MESH_GUARD_EXPECT ?? "");
const result = spawnSync(process.execPath, [
  checker, `--unit=${env.MESH_GUARD_UNIT ?? ""}`, `--expect=${expect}`, "--", stl,
], { encoding: "utf8" });
if (result.error) throw result.error;

const report = JSON.parse(result.stdout);
const reportPath = join(mkdtempSync(join(env.RUNNER_TEMP, "mesh-guard-")), "report.json");
writeFileSync(reportPath, result.stdout);
appendFileSync(env.GITHUB_OUTPUT, `report-path=${reportPath}\n`);

const summary = ["## Mesh Guard STL dimensions", "", `**${report.status.toUpperCase()}**`, ""];
if (report.status === "invalid") {
  summary.push("See report.json for the invalid input details.");
} else {
  summary.push("| Axis | Expected (mm) | Actual (mm) |", "| --- | ---: | ---: |");
  for (const axis of ["x", "y", "z"]) {
    summary.push(`| ${axis.toUpperCase()} | ${report.expected_mm[axis]} | ${report.dimensions_mm[axis]} |`);
  }
  summary.push("", `Tolerance: ${report.tolerance_mm} mm`);
  if (report.scale_hint) summary.push("", `Possible unit mismatch: ${report.scale_hint}× difference.`);
}
appendFileSync(env.GITHUB_STEP_SUMMARY, `${summary.join("\n")}\n`);
process.exitCode = result.status;
