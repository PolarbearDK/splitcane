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

The calculations are a line-by-line port (`src/engine/model.ts`, with the Fortran variable names). Deliberate deviations are marked `PORT NOTE` in the code.

### Bugs fixed (2026)

These change the results. `runModel({ ..., legacy: true })` turns them off again, and with that option the engine reproduces `Stangbygning1/stang.OUT` and `stang1.OUT` to the printed precision (`tests/reference.test.ts`). `tests/fixes.test.ts` covers the corrected behaviour.

| Bug in the original | Effect of the fix on the two sample rods |
|---|---|
| `FORCES` stopped one guide early, so the guide just below the tip-top got no line force and its share was applied at the tip-top. | Taper up to 1.2 % thinner near the tip, mass −0.5 to −0.9 %, design stress up to −6 % (spiral rod). |
| `BEND` was meant to treat the ferrule as rigid, but its `LFERL` was an uninitialised local (always 0), so the ferrule bent like cane. | Rod 4.6 % (spiral) and 8.7 % (circle) stiffer: tip deflection under load 3.5–8 % smaller. The taper is unchanged, so the loaded rod no longer follows the target curve exactly at the ferrule. |
| `JFER1 = MAX(1,JFER)` with `JFER` never assigned: the stretch from the guide to the ferrule was always a single element. | No change for the sample rods; finer mesh when the ferrule is far from the guide below it. |

### Other deviations

- The original's fixed arrays (`NELX = 120`) capped the element count at 119 and a measured taper at 120 points. Both limits are now 1000, and new rods default to 200 elements instead of 30. The results settle at about 200 elements (under 0.1 % change beyond that), and a full calculation with 1000 elements takes under 10 ms. Legacy mode keeps the old limits.
- The guide count goes up to 30 instead of 14 (`NEYX = 15`). The ferrule must still fit between two guides with its clearance on both sides, so many guides only fit on long rods. For example, 25 guides need about 3 m with an 80 mm ferrule.
- Element boundaries at guides are snapped exactly to the guide position. The old results depended on rounding at the 1e-13 mm level, and on the compiler's x87 extended precision.
- The ferrule placement branch for a ferrule that's too close to the guide above had `FERL` and `AFERL` swapped. That misaligned all later elements, so it's fixed here.
- `STOP` conditions become error messages, and the iteration that had no limit now stops with an error instead of hanging.
- "Change data" always recalculates from scratch, and the test load is applied starting from the design load. In the original, the order of menu clicks could leave stale state behind.

### Additions

- **Parabolic target curve** (`"curve": "parabola"` in the file, `ModelInput.curve`). The target shape is a parabola η = A·ξ² with its vertex at the tip, rotated so the rod leaves the handle horizontally and reaches the tip angle at the tip. The rod runs over u = 2Aξ from −tan(tip angle) to 0, and A is chosen so the arc length equals the rod length outside the handle. The curvature 2A/(1+u²)^1.5 grows from the handle to the tip, like the spiral's. At 60° it is (1+tan²60°)^1.5 = 8 times larger at the tip than at the handle, compared with about 18 times for the spiral parameter 70. The taper then follows from the same r⁴ = M/(κ·E·I₁) rule. The spiral parameter is not used, the tip angle must be below 90°, and the option is ignored for a measured taper. Tested in `tests/parabola.test.ts`.
