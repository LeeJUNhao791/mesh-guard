import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("../scripts/check_stl.mjs", import.meta.url));
const sample = fileURLToPath(new URL("../samples/cuboid-120x80x40-mm.stl", import.meta.url));
const directory = mkdtempSync(join(tmpdir(), "mesh cli "));
const expectation = join(directory, "reference dimensions.json");
const reference = JSON.parse(readFileSync(new URL("../samples/expected.json", import.meta.url), "utf8"));
writeFileSync(expectation, JSON.stringify(reference));
after(() => rmSync(directory, { recursive: true, force: true }));

function run(args) {
  const result = spawnSync(process.execPath, [script, ...args], { encoding: "utf8", cwd: directory });
  assert.equal(result.error, undefined);
  assert.equal(result.signal, null);
  assert.equal(result.stderr, "");
  return { code: result.status, report: JSON.parse(result.stdout) };
}

test("checks the sample with spaced paths and preserves both input files", () => {
  const before = [readFileSync(sample), readFileSync(expectation)];
  const { code, report } = run([sample, "--unit", "mm", "--expect", expectation]);
  assert.equal(code, 0);
  assert.deepEqual(report, {
    status: "pass", format: "ASCII", coordinate_unit: "mm",
    dimensions_mm: { x: 120, y: 80, z: 40 },
    expected_mm: reference.expected_mm, tolerance_mm: 0.1,
    deviation_mm: { x: 0, y: 0, z: 0 },
    within_tolerance: { x: true, y: true, z: true }, scale_hint: null,
  });
  assert.deepEqual([readFileSync(sample), readFileSync(expectation)], before);
});

test("returns exit 1 with the same three-axis failure and 1000x hint as the browser", () => {
  const { code, report } = run([sample, "--unit", "m", "--expect", expectation]);
  assert.equal(code, 1);
  assert.equal(report.status, "fail");
  assert.deepEqual(report.dimensions_mm, { x: 120000, y: 80000, z: 40000 });
  assert.deepEqual(report.deviation_mm, { x: 119880, y: 79920, z: 39960 });
  assert.deepEqual(report.within_tolerance, { x: false, y: false, z: false });
  assert.equal(report.scale_hint, 1000);
});

test("reads binary STL and retains reference precision", () => {
  const binary = Buffer.alloc(134);
  binary.writeUInt32LE(1, 80);
  [[0, 0, 0], [120, 0, 40], [0, 80, 0]].flat().forEach((value, index) => {
    binary.writeFloatLE(value, 96 + 4 * index);
  });
  const binaryPath = join(directory, "binary triangle.stl");
  const precisePath = join(directory, "precise.json");
  writeFileSync(binaryPath, binary);
  writeFileSync(precisePath, JSON.stringify({
    expected_mm: { x: 120.000000123, y: 80, z: 40 }, tolerance_mm: 0.0000002,
  }));
  const { code, report } = run([binaryPath, "--unit", "mm", "--expect", precisePath]);
  assert.equal(code, 0);
  assert.equal(report.format, "Binary");
  assert.deepEqual(report.dimensions_mm, reference.expected_mm);
  assert.equal(report.expected_mm.x, 120.000000123);
  assert.equal(report.tolerance_mm, 0.0000002);
  assert.equal(report.deviation_mm.x, 120 - 120.000000123);
});

test("returns exit 2 and JSON for missing or invalid arguments", () => {
  for (const args of [
    [], [sample], [sample, "--unit", "mm"],
    [sample, "--unit", "inch", "--expect", expectation],
    [sample, "--unit", "mm", "--expect", expectation, "--unknown"],
    [sample, sample, "--unit", "mm", "--expect", expectation],
    [sample, "--unit", "mm", "--expect"],
  ]) {
    const { code, report } = run(args);
    assert.equal(code, 2);
    assert.equal(report.status, "invalid");
    assert.equal(typeof report.error, "string");
    assert.ok(report.error.length > 0);
  }
});

test("returns exit 2 for bad geometry, bad JSON and missing files", () => {
  const brokenStl = join(directory, "broken.stl");
  const brokenJson = join(directory, "broken.json");
  const missing = join(directory, "missing");
  writeFileSync(brokenStl, "solid incomplete");
  writeFileSync(brokenJson, '{"expected_mm":{"x":"120","y":80,"z":40}}');
  for (const [model, contract] of [
    [brokenStl, expectation], [sample, brokenJson],
    [missing, expectation], [sample, missing],
  ]) {
    const { code, report } = run([model, "--unit", "mm", "--expect", contract]);
    assert.equal(code, 2);
    assert.equal(report.status, "invalid");
    assert.ok(report.error);
  }
});
