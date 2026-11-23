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

## Run locally

From the repository root, serve the static files with Python 3.

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Open [http://127.0.0.1:8000/](http://127.0.0.1:8000/), choose or drop an `.stl` file, select mm or m, and click **Check dimensions**.

## Test

```sh
node --test tests/test_stl.mjs
```

## Feedback

Share first-use feedback in [issue #3](https://github.com/LeeJUNhao791/mesh-guard/issues/3). For a reproducible defect, use the [bug report template](https://github.com/LeeJUNhao791/mesh-guard/issues/new?template=bug_report.md) and a synthetic or redistributable STL.

## License

Mesh Guard carries forward the local STL prototype and base styling from [GLB Dimension Check](https://github.com/LeeJUNhao791/glb-dimension-check/tree/v0.5.0). See the [MIT license](LICENSE).
