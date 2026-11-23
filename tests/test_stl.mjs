import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { checkDimensions, measureStl, parseExpectation } from "../measure.mjs";

const shapes = [
  [[-2, -4, -1], [8, -4, -1], [8, 16, -1]],
  [[-2, -4, -1], [8, 16, -1], [-2, -4, 29]],
];

test("reads the shared expectation format, optional tolerance and UTF-8 BOM", () => {
  const contract = { expected_mm: { x: 120.000000123, y: 80, z: 0 }, tolerance_mm: 0.0000002 };
  assert.deepEqual(parseExpectation(JSON.stringify(contract)), {
    expected: [120.000000123, 80, 0], tolerance: 0.0000002,
  });
  assert.deepEqual(parseExpectation("\uFEFF" + JSON.stringify({ expected_mm: { x: 120, y: 80, z: 40 } })), {
    expected: [120, 80, 40], tolerance: 0.1,
  });
});

test("rejects missing axes, unknown fields, arrays and nonnumeric or negative values", () => {
  const expected = { x: 120, y: 80, z: 40 };
  for (const contract of [
    null, [], 5,
    {}, { expected_mm: [] }, { expected_mm: null },
    { expected_mm: { x: 120, y: 80 } },
    { expected_mm: { ...expected, w: 1 } },
    { expected_mm: expected, status: "pass" },
    { expected_mm: expected, tolerance_mm: null },
    { expected_mm: expected, tolerance_mm: "0.1" },
    { expected_mm: expected, tolerance_mm: -0.1 },
    { expected_mm: { ...expected, x: "120" } },
    { expected_mm: { ...expected, y: true } },
    { expected_mm: { ...expected, z: -1 } },
  ]) {
    assert.throws(() => parseExpectation(JSON.stringify(contract)), Error);
  }
  assert.throws(() => parseExpectation('{"expected_mm":{"x":120,"y":80,"z":1e999}}'), /expected_mm.z/);
  assert.throws(() => parseExpectation('{"expected_mm":{"x":120,"y":80,"z":40},"tolerance_mm":1e999}'), /tolerance_mm/);
});

test("reports malformed expectation JSON", () => {
  assert.throws(() => parseExpectation('{"expected_mm":'), SyntaxError);
});
const encode = text => new TextEncoder().encode(text).buffer;

function asciiStl(triangles = shapes) {
  const facets = triangles.map(triangle => [
    "  facet normal 0 0 1",
    "    outer loop",
    ...triangle.map(vertex => "      vertex " + vertex.join(" ")),
    "    endloop",
    "  endfacet",
  ].join("\r\n"));
  return encode(["\uFEFFsolid generated", ...facets, "endsolid generated", ""].join("\r\n"));
}

function binaryStl(triangles = shapes) {
  const buffer = new ArrayBuffer(84 + 50 * triangles.length);
  new Uint8Array(buffer).set(new TextEncoder().encode("solid binary header"));
  const view = new DataView(buffer);
  view.setUint32(80, triangles.length, true);
  triangles.forEach((triangle, i) => {
    const base = 84 + i * 50;
    view.setFloat32(base + 8, 1, true);
    triangle.forEach((vertex, j) => {
      vertex.forEach((coord, k) => view.setFloat32(base + 12 + 12 * j + 4 * k, coord, true));
    });
  });
  return buffer;
}

test("measures X/Y/Z spans across ASCII facets, including scientific notation and negative vertices", () => {
  const stl = asciiStl([shapes[0], [...shapes[1].slice(0, 2), ["-2e0", -4, "+2.9e1"]]]);
  assert.deepEqual(measureStl(stl), { format: "ASCII", spans: [10, 20, 30] });
});

test("measures binary STL whose header starts with solid", () => {
  assert.deepEqual(measureStl(binaryStl()), { format: "Binary", spans: [10, 20, 30] });
});

test("measures the bundled sample at its advertised 120 × 80 × 40 mm", async () => {
  const sample = await readFile(new URL("../samples/cuboid-120x80x40-mm.stl", import.meta.url));
  assert.deepEqual(measureStl(new Uint8Array(sample).buffer).spans, [120, 80, 40]);
});

test("rejects empty, truncated, malformed and non-finite STL data", () => {
  const corruptBinary = binaryStl();
  new DataView(corruptBinary).setFloat32(96, Infinity, true);
  const corruptNormal = binaryStl();
  new DataView(corruptNormal).setFloat32(84, NaN, true);
  for (const buffer of [
    encode(""),
    encode("solid empty\nendsolid empty"),
    asciiStl([]),
    asciiStl().slice(0, -25),
    asciiStl([[...shapes[0], [0, 0, 0]]]),
    asciiStl([shapes[0].slice(0, 2)]),
    asciiStl([[[1e308, 0, 0], [-1e308, 1, 1], [1, 1, 1]]]),
    asciiStl([[[0, 0, "1e999"], ...shapes[0].slice(1)]]),
    binaryStl([]),
    binaryStl().slice(0, -1),
    binaryStl().slice(0, 83),
    corruptBinary,
    corruptNormal,
  ]) {
    assert.throws(() => measureStl(buffer), /invalid|truncated|finite/i);
  }
});

test("converts explicit millimeters or meters without creating a comparison", () => {
  assert.deepEqual(checkDimensions([10, 20, 30], "mm"), { mm: [10, 20, 30] });
  assert.deepEqual(checkDimensions([0.01, 0.02, 0.03], "m"), { mm: [10, 20, 30] });
  assert.throws(() => checkDimensions([10, 20, 30], ""), /unit/i);
  assert.throws(() => checkDimensions([1e308, 2, 3], "m"), /finite/i);
});

test("compares each axis with an inclusive 0.1 mm default tolerance", () => {
  const edge = checkDimensions([1.1, 1.9, 3], "mm", [1, 2, 3]);
  assert.deepEqual(edge.within, [true, true, true]);
  assert.deepEqual(checkDimensions([1, 2.11, 3], "mm", [1, 2, 3]).within, [true, false, true]);
  assert.deepEqual(checkDimensions([1, 2.11, 3], "mm", [1, 2, 3], 0.2).within, [true, true, true]);
  assert.deepEqual(checkDimensions([1, 2, 3], "mm", [1, 2, 3], 0).delta, [0, 0, 0]);
  assert.throws(() => checkDimensions([1, 2, 3], "mm", [1, null, 3]), /expected/i);
  assert.throws(() => checkDimensions([1, 2, 3], "mm", [1, 2]), /expected/i);
  assert.throws(() => checkDimensions([1, 2, 3], "mm", [1, 2, 3], -0.1), /tolerance/i);
});

test("shows a unit hint only when all nonzero axes support the same scale", () => {
  assert.equal(checkDimensions([9500, 20000, 31500], "mm", [10, 20, 30]).scale, 1000);
  assert.equal(checkDimensions([0.01, 0.02, 0.03], "mm", [10, 20, 30]).scale, 0.001);
  assert.equal(checkDimensions([10000, 20000, 32000], "mm", [10, 20, 30]).scale, null);
  assert.equal(checkDimensions([10000, 20000, 0], "mm", [10, 20, 0]).scale, null);
  assert.equal(checkDimensions([1, 1, 1], "mm", [0.001, 0.001, 0.001], 1).scale, null);
});
