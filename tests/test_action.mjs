import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("../scripts/run_action.mjs", import.meta.url));
const directory = mkdtempSync(join(tmpdir(), "mesh action "));
const workspace = join(directory, "consumer inputs");
const model = "model $(echo literal).stl";
const expectation = "--reference dimensions.json";
mkdirSync(workspace);
copyFileSync(new URL("../samples/cuboid-120x80x40-mm.stl", import.meta.url), join(workspace, model));
copyFileSync(new URL("../samples/expected.json", import.meta.url), join(workspace, expectation));
after(() => rmSync(directory, { recursive: true, force: true }));

for (const { unit, code, status, actual } of [
  { unit: "mm", code: 0, status: "pass", actual: [120, 80, 40] },
  { unit: "m", code: 1, status: "fail", actual: [120000, 80000, 40000] },
  { unit: "inch", code: 2, status: "invalid" },
]) {
  test(`reports ${status} and preserves exit ${code}`, () => {
    const output = join(directory, `${unit}.output`);
    const summary = join(directory, `${unit}.summary`);
    const result = spawnSync(process.execPath, [script], { encoding: "utf8", cwd: directory, env: {
      ...process.env,
      GITHUB_WORKSPACE: workspace,
      GITHUB_OUTPUT: output,
      GITHUB_STEP_SUMMARY: summary,
      RUNNER_TEMP: directory,
      MESH_GUARD_STL: model,
      MESH_GUARD_EXPECT: expectation,
      MESH_GUARD_UNIT: unit,
    } });
    assert.equal(result.status, code, result.stderr);
    const reportPath = /^report-path=(.+)\r?$/m.exec(readFileSync(output, "utf8"))[1];
    const report = JSON.parse(readFileSync(reportPath, "utf8"));
    const markdown = readFileSync(summary, "utf8");
    assert.equal(report.status, status);
    assert.ok(markdown.includes(`**${status.toUpperCase()}**`));
    if (actual) {
      assert.deepEqual(Object.values(report.dimensions_mm), actual);
      for (const [index, axis] of ["X", "Y", "Z"].entries()) {
        assert.ok(markdown.includes(`| ${axis} | ${[120, 80, 40][index]} | ${actual[index]} |`));
      }
      assert.equal(markdown.includes("1000×"), unit === "m");
    } else {
      assert.equal(typeof report.error, "string");
    }
  });
}
