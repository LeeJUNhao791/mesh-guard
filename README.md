# Mesh Guard

[![STL tests](https://github.com/LeeJUNhao791/mesh-guard/actions/workflows/stl-tests.yml/badge.svg?branch=main)](https://github.com/LeeJUNhao791/mesh-guard/actions/workflows/stl-tests.yml)
[![Release](https://img.shields.io/github/v/release/LeeJUNhao791/mesh-guard)](https://github.com/LeeJUNhao791/mesh-guard/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[简体中文](README.zh-CN.md)

A browser-based STL dimension checker for detecting unit and scale errors.

Open an ASCII or binary STL, choose the unit used on export, and read the X, Y, and Z spans in millimeters. Enter all three expected dimensions to compare the model against a tolerance. The default is 0.1 mm.

The browser reads the file locally. When all three axes show a similar 1000× or 0.001× difference from the expected dimensions, Mesh Guard flags a possible unit error.

[Open Mesh Guard online](https://leejunhao791.github.io/mesh-guard/).

## Try the sample

The online demo and current `main` include **Try sample**, added after v0.1.0.

1. Click **Try sample**. Mesh Guard loads the cuboid, selects millimeters, fills in **120 × 80 × 40 mm** and the default **0.1 mm** tolerance, and shows **PASS**.
2. Select **Meters (m)** and click **Check dimensions**. All three axes fail and Mesh Guard shows a **1000×** scale hint.

To try the manual workflow, download the [sample STL](samples/cuboid-120x80x40-mm.stl) and choose or drop it into the checker.

## Save the reference dimensions

After checking a model with all three expected dimensions filled in, click **Download expected.json** to save those reference dimensions and the tolerance in millimeters. Both PASS and FAIL comparisons offer the download. Editing the inputs clears the download until you check again.

The file uses the same `expected_mm` and `tolerance_mm` fields as [GLB Dimension Check](https://github.com/LeeJUNhao791/glb-dimension-check#check-against-a-json-expectation-file), so you can reuse the reference for a GLB export with the same axis order.

Use **Import expected.json** to restore a saved reference, then click **Check dimensions**. Choose the STL coordinate unit to match its export. The JSON must contain `expected_mm` with numeric `x`, `y`, and `z`; optional `tolerance_mm` defaults to `0.1`. Values must be finite and nonnegative. Unknown fields are rejected. An invalid file shows an error and preserves the form values.

## Run locally

From the repository root, serve the static files with Python 3.

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Open [http://127.0.0.1:8000/](http://127.0.0.1:8000/), choose or drop an `.stl` file, select mm or m, and click **Check dimensions**.

## Check an STL from the command line

Use Node.js 22 or newer. Run from the repository root with the bundled sample and reference:

```sh
node scripts/check_stl.mjs samples/cuboid-120x80x40-mm.stl --unit mm --expect samples/expected.json
```

For your own STL, provide its path, its export coordinate unit (`mm` or `m`), and the `expected.json` saved from the browser. Quote paths that contain spaces.

Standard output contains a JSON report with measured and expected millimeter dimensions, tolerance, deviations, per-axis verdicts, and the scale hint. Reference values retain their numeric precision.

| Exit code | Status | Meaning |
| --- | --- | --- |
| `0` | `pass` | All three axes satisfy the tolerance. |
| `1` | `fail` | At least one axis is outside tolerance. |
| `2` | `invalid` | A file or argument is invalid; the JSON includes an `error` message. |

Use the exit code to gate a CI step. To save a report, redirect standard output with `> report.json`; the process keeps the same exit code.

## Check dimensions on pull requests

Copy the [GitHub Actions workflow](.github/workflows/stl-dimensions.yml) to `.github/workflows/stl-dimensions.yml` in your repository. Replace the sample STL and `expected.json` paths with paths in your repository and set `--unit` to the STL's export unit (`mm` or `m`). The workflow runs the CLI from Mesh Guard `v0.2.0`.

A dimension mismatch or invalid input fails the **Check STL dimensions** pull request check. To require a passing check before merge, add it as a required status check in the target branch's protection rule or ruleset.

After the check passes or fails, download `stl-dimension-report` from the workflow run's **Artifacts** section. Its `report.json` contains the measured and expected model dimensions for completed comparisons.

The same sample STL [passes with mm](https://github.com/LeeJUNhao791/mesh-guard/actions/runs/45134251030) and [fails with m](https://github.com/LeeJUNhao791/mesh-guard/actions/runs/45134084816) with a 1000× scale hint. Both runs uploaded a report.

## Use the GitHub Action (v0.3.0)

Copy this workflow to `.github/workflows/mesh-guard.yml` in your repository. Replace `stl` and `expect` with the paths to your STL and `expected.json` relative to the repository root. Set `unit` to the STL export unit (`mm` or `m`).

```yaml
name: Mesh Guard
on: pull_request
permissions:
  contents: read

jobs:
  check-stl:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7
        with:
          persist-credentials: false
      - uses: LeeJUNhao791/mesh-guard@v0.3.0
        id: mesh
        with:
          stl: models/part.stl
          expect: models/expected.json
          unit: mm
      - uses: actions/upload-artifact@cf430e030ddbb5b0abf93d22962f4752f3646cd9 # v7
        if: ${{ !cancelled() && steps.mesh.outputs.report-path != '' }}
        with:
          name: stl-dimension-report
          path: ${{ steps.mesh.outputs.report-path }}
          if-no-files-found: error
```

The action uses Node.js 22 and the CLI's exit codes. The job summary shows expected and actual dimensions on each axis and the scale hint when detected. Download the `stl-dimension-report` artifact from the workflow run even when the check fails.

For an immutable pin, use `LeeJUNhao791/mesh-guard@709e31ae7daecb2ddca4a0ec7b4230d4a29e1eb8`. See the [v0.3.0 release](https://github.com/LeeJUNhao791/mesh-guard/releases/tag/v0.3.0).

### Example job summaries

Both jobs checked the same STL against 120 × 80 × 40 mm with a 0.1 mm tolerance. [View the v0.3.0 validation run](https://github.com/LeeJUNhao791/mesh-guard/actions/runs/45327599316).

**Millimeters (`mm`) pass.** The measured dimensions match on all three axes. [Job summary](https://github.com/LeeJUNhao791/mesh-guard/actions/runs/45327599316#summary-138220821108) · [JSON report ZIP](https://github.com/LeeJUNhao791/mesh-guard/actions/runs/45327599316/artifacts/14890591223)

<img src="docs/images/mesh-guard-action-mm-pass.webp" width="440" alt="GitHub Actions millimeter job summary showing PASS, with measured X, Y, and Z dimensions of 120, 80, and 40 mm.">

**Meters (`m`) fail.** Each measured dimension is 1000× its expected value. [Job summary](https://github.com/LeeJUNhao791/mesh-guard/actions/runs/45327599316#summary-138220820780) · [JSON report ZIP](https://github.com/LeeJUNhao791/mesh-guard/actions/runs/45327599316/artifacts/14890576244)

<img src="docs/images/mesh-guard-action-m-fail.webp" width="440" alt="GitHub Actions meter job summary showing FAIL, with measured X, Y, and Z dimensions of 120,000, 80,000, and 40,000 mm and a possible 1000× unit mismatch.">

### Mounting plate case

Drawing MP-001 Rev A specifies **64 × 40 × 6 mm (X/Y/Z)** with **±0.20 mm per axis**. Mesh Guard compares the STL's axis-aligned bounding box with these dimensions. [Dimension drawing](https://github.com/LeeJUNhao791/glb-dimension-check/blob/217f678459c5ec3395ce30d0dd1afd8dc1e3a7f1/examples/mesh-guard-mounting-plate/drawing.svg) · [`expected.json`](https://github.com/LeeJUNhao791/glb-dimension-check/blob/217f678459c5ec3395ce30d0dd1afd8dc1e3a7f1/examples/mesh-guard-mounting-plate/expected.json)

1. In a test repository, copy the nominal STL and `expected.json` to `examples/mesh-guard-mounting-plate/`. Copy the workflow to `.github/workflows/` and set `pull_request.branches` to your test base branch. The workflow calls `LeeJUNhao791/mesh-guard@v0.3.0` with `unit: mm`. [Nominal STL](https://github.com/LeeJUNhao791/glb-dimension-check/blob/217f678459c5ec3395ce30d0dd1afd8dc1e3a7f1/examples/mesh-guard-mounting-plate/mounting_plate.stl) · [Caller workflow](https://github.com/LeeJUNhao791/glb-dimension-check/blob/f846f2018a137f970e4d408b7454b02b31810b2a/.github/workflows/mesh-guard-mechanical-trial.yml)
2. Open a pull request targeting the test base branch. The nominal STL measures **64 × 40 × 6 mm** and passes on all three axes. [Passing run](https://github.com/LeeJUNhao791/glb-dimension-check/actions/runs/45357661645)
3. In the same pull request, replace `mounting_plate.stl` with the oversized STL, keeping the expectation file and unit. The new model measures **65 × 40 × 6 mm**. Only X fails (**+1.00 mm**), and the check exits with code `1`. A separate step still uploads `report.json` as part of `mounting-plate-dimension-report`. [Oversized STL](https://github.com/LeeJUNhao791/glb-dimension-check/blob/f846f2018a137f970e4d408b7454b02b31810b2a/examples/mesh-guard-mounting-plate/mounting_plate.stl) · [Failing run](https://github.com/LeeJUNhao791/glb-dimension-check/actions/runs/45357817059)

## Test

```sh
node --test tests/test_stl.mjs tests/test_cli.mjs tests/test_action.mjs
```

## Feedback

Share first-use feedback in [issue #3](https://github.com/LeeJUNhao791/mesh-guard/issues/3). For a reproducible defect, use the [bug report template](https://github.com/LeeJUNhao791/mesh-guard/issues/new?template=bug_report.md) and a synthetic or redistributable STL.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, verification commands, and the dimension-checking scope.

## License

Mesh Guard carries forward the local STL prototype and base styling from [GLB Dimension Check](https://github.com/LeeJUNhao791/glb-dimension-check/tree/v0.5.0). See the [MIT license](LICENSE).
