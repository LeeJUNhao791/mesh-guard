# Mesh Guard

A browser-based STL dimension checker for detecting unit and scale errors.

Open an ASCII or binary STL, choose the unit used on export, and read the X, Y, and Z spans in millimeters. Enter all three expected dimensions to compare the model against a tolerance. The default is 0.1 mm.

The browser reads the file locally. When all three axes show a similar 1000× or 0.001× difference from the expected dimensions, Mesh Guard flags a possible unit error.

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

## License

Mesh Guard carries forward the local STL prototype and base styling from [GLB Dimension Check](https://github.com/LeeJUNhao791/glb-dimension-check/tree/v0.5.0). See the [MIT license](LICENSE).
