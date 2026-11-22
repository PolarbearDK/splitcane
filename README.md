# Splitcane – fly rod design calculator

**Try it: https://polarbeardk.github.io/splitcane/**

A calculator for designing **split-cane (bamboo) fly rods**. It runs in the browser and has a Danish/English interface. It is a port of *STANGBYGNING1*, a Fortran program Viggo Hoppe wrote between 2000 and 2013.

You give the program the rod's main dimensions and the line tension it should handle. It then calculates:

- **Guide placement**: guide positions along the rod, with spacing that shrinks gradually towards the tip, and guide heights.
- **Taper**: the diameter needed at every point so the rod bends into a chosen shape (a logarithmic spiral or a circle) under the design load.
- **Ferrule position**, placed as close to the middle as the guides allow.
- **Planing form settings**: the groove depth at each adjustment screw, in mm and inches.
- **Mass, centre of gravity and volume** of the cane.
- **Deflection under load**: large-deflection beam analysis of the finished rod, with bending moment and stress along its length. You can also test it with other line tensions and angles.

## How the design works

The rod is modelled as a beam with a regular polygonal cross-section (usually six sides). The line runs from the reel through every guide to the tip-top and pulls on each guide.

1. **Target shape.** The user chooses the angle the tip should reach at full load and a bend curve. The original curve is a **logarithmic spiral**, set by a *spiral parameter*. A larger parameter gives a stiffer rod, and 0 gives a circle. The spiral bends most towards the tip. The web version adds a **parabola** with its vertex at the tip, so it also bends most at the tip. At the same tip angle it gives about the same deflection as the spiral.
2. **Taper.** With the rod lying on that curve, the program finds the bending moment from the line forces at each point along the rod. It then picks the radius whose stiffness gives exactly the curvature of the curve there: *r⁴ = M / (κ·E·I₁)*. At the tip the radius is limited by the chosen minimum tip diameter and smoothed. In the handle it is extrapolated.
3. **Check.** The finished rod is loaded step by step, iterating line forces and large-deformation beam bending until the shape converges.

Instead of a target shape you can enter a **measured taper** (diameter points along an existing rod). The program then smooths it with a Chebyshev polynomial fit and analyses that rod. Guide positions can also be entered by hand.

## Using it

- Edit the values on the left. The results update as you type. Danish decimal commas (`1,6`) are accepted.
- **Gem / Save** downloads the rod as a `.json` file. **Åbn / Open** loads a `.json` file or an old `.DAT` file from the Fortran program.
- **Rapport / Report** downloads a plain-text report with all the tables.
- **Eksempler / Examples** loads the two rods that came with the original program.

The JSON format is described in [`web/src/io/document.ts`](web/src/io/document.ts).

## Repository layout

| Path | Contents |
|---|---|
| [`web/`](web/) | The web app (React + TypeScript + Vite). See [`web/README.md`](web/README.md). |
| [`web/src/engine/`](web/src/engine/) | The calculation engine, ported line by line from the Fortran. |
| [`Stangbygning1/`](Stangbygning1/) | The original Fortran 90 source (Digital Visual Fortran, QuickWin), sample `.DAT`/`.OUT` files and the original user manual (`STANG.DOC`, in Danish). |
| [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) | Builds, tests and publishes the site to GitHub Pages on every push to `main`. |

## Development

```bash
cd web
npm install
npm run dev     # local dev server
npm test        # runs the engine against the original program's output files
npm run build   # static site in web/dist
```

## Faithfulness to the original

The engine is a literal port. It keeps the original variable names, the evaluation order, and even single-precision constants such as `STAL*0.05`. With its `legacy` option, the test suite re-runs the two calculations the old program saved (`stang.OUT` and `stang1.OUT`) and checks every printed value: guide positions, element division, taper, mass, planing form settings, reference force and the full deflection table.

The app itself fixes three calculation bugs found during the port. The last guide below the tip-top now gets its share of the line force. The ferrule is treated as rigid, as the original code intended. The stretch below the ferrule is divided into elements. The ferrule fix makes the rods up to about 9 % stiffer than the old program said. These fixes and the other small changes are marked `PORT NOTE` in the source and listed in [`web/README.md`](web/README.md#differences-from-the-fortran-program).

## Credits

Original program and engineering: **Viggo Hoppe** (2000–2013). The equation solvers `SOLSYM` and `GAUELI` come from a B&W Diesel numerical library. Web port by his family, 2026.
