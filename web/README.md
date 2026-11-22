# Stangbygning (web)

Browser version of STANGBYGNING1, Viggo Hoppe's Fortran program for designing split-cane fly rods.
It is a static single-page app (React + TypeScript + Vite). All calculations run in the browser.

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # engine checked against the original program's .OUT files
npm run build    # static site in dist/
```

Works on Node 16+. The GitHub Actions workflow in `../.github/workflows/deploy.yml` builds with Node 20 and publishes to GitHub Pages on every push to `main` that touches `web/`.

## Files

Rods are saved as `.json` (see `src/io/document.ts` for the format). Old `.DAT` files from the Fortran program can be opened directly. They're converted on import and can then be saved as `.json`. **Rapport / Report** downloads a text report (the successor of the `.OUT` file).

## Differences from the Fortran program

The calculations are a line-by-line port (`src/engine/model.ts`, with the Fortran variable names). They reproduce `Stangbygning1/stang.OUT` and `stang1.OUT` to the printed precision. Deliberate deviations are marked `PORT NOTE` in the code:

- Element boundaries at guides are snapped exactly to the guide position. The old results depended on rounding at the 1e-13 mm level, and on the compiler's x87 extended precision.
- The ferrule placement branch for a ferrule that's too close to the guide above had `FERL` and `AFERL` swapped. That misaligned all later elements, so it's fixed here.
- `STOP` conditions become error messages, and the iteration that had no limit now stops with an error instead of hanging.
- "Change data" always recalculates from scratch, and the test load is applied starting from the design load. In the original, the order of menu clicks could leave stale state behind.

Kept as in the original (they affect the numbers):

- `FORCES` gives no force to the guide just below the tip-top.
- The ferrule is not stiff in `BEND`. `LFERL` there is an uninitialised local, i.e. 0.
- `JFER1` is always 1.
