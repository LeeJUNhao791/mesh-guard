# Changelog

Dates, where shown, are GitHub Release publication dates in UTC.

## v0.3.1

Documentation patch; the STL parser, CLI, browser, and Action implementation are unchanged from v0.3.0. See the [release notes](docs/releases/v0.3.1.md).

- Show the existing Action result screenshots near the top of both READMEs and ignore local dependency and OS files.
- Document the v0.3.0 Action workflow and its job summaries. [#11](https://github.com/LeeJUNhao791/mesh-guard/pull/11), [#12](https://github.com/LeeJUNhao791/mesh-guard/pull/12)
- Document the downstream mounting-plate trial, including passing and oversized STL reports. This checks digital dimensions. [#13](https://github.com/LeeJUNhao791/mesh-guard/pull/13)
- Add contributor checks and a pull request template. [#14](https://github.com/LeeJUNhao791/mesh-guard/pull/14)

## [v0.3.0](https://github.com/LeeJUNhao791/mesh-guard/releases/tag/v0.3.0) - 2026-11-24

- Add a reusable GitHub Action for ASCII and binary STL dimension checks against `expected.json`, with explicit `mm` or `m` STL coordinates.
- Write a job summary and expose `report-path` so callers can retain JSON reports after a failed check. Dimension mismatches and invalid input fail the Action.
- Record a passing millimetre sample and a failing metre interpretation of the same file, with the latter reporting a 1000x scale hint.

## Earlier releases

- [v0.2.0](https://github.com/LeeJUNhao791/mesh-guard/releases/tag/v0.2.0)
- [v0.1.0](https://github.com/LeeJUNhao791/mesh-guard/releases/tag/v0.1.0)
