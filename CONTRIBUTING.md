# Contributing

Keep each change focused and describe what changes for a user. For a bug,
include a synthetic or redistributable STL, export unit, expected X/Y/Z
dimensions, tolerance, and actual result. Use the
[pull request template](.github/pull_request_template.md) to report verification.

## Setup and checks

Use Node.js 22, as in CI. No package installation or build step is required.
Run the existing suite from the repository root:

```sh
node --test tests/test_stl.mjs tests/test_cli.mjs tests/test_action.mjs
```

For a CLI or measurement change, run these commands separately:

```sh
node scripts/check_stl.mjs samples/cuboid-120x80x40-mm.stl --unit mm --expect samples/expected.json
node scripts/check_stl.mjs samples/cuboid-120x80x40-mm.stl --unit m --expect samples/expected.json
```

The first returns `pass` / exit `0`. The second intentionally returns `fail` /
exit `1`, with three failing axes and a `1000` scale hint. Invalid inputs return
JSON with `status: "invalid"` and exit `2`.

For browser changes, follow [Try the sample](README.md#try-the-sample), then
check expectation import and download. For Action changes, preserve the CLI
exit code, `report-path` output, and job summary on pass, fail, and invalid
input. The local Action tests exercise the wrapper; report any hosted workflow
validation separately. See the [Action example](README.md#use-the-github-action-v030)
for the separate report upload step.

## Dimension-checking scope

Mesh Guard reads ASCII or binary STL and measures its X/Y/Z axis-aligned
spans. STL carries no unit metadata: choose the export coordinate unit, `mm`
or `m`. Reference dimensions and tolerance are always in millimeters. Rotation
can change the spans; a scale hint does not change the model.

A passing comparison checks overall dimensions, not internal features,
watertightness, printability, or manufacturing accuracy. Add a focused
regression test when changing parsing or comparison behavior, and report the
checks you actually ran.
