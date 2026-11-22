# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A legacy Windows desktop program (2000–2013, author Viggo Hoppe) that designs and analyses **split-cane fly rods** ("splicane fiskestænger"). Given rod dimensions, guide ("øje") positions and line tension, it computes the rod's taper and its large-deflection bending curve and plots the result. Comments, identifiers, dialogs and output text are all in **Danish**.

## Toolchain / build

- Language: Fortran 90, **Digital/Compaq Visual Fortran 5/6** (`df.exe`) using the DF extension libraries `DFLIB` (QuickWin graphics/menus) and `DFLOGM` (dialogs). It is a **QuickWin application** (`/libs:qwin`, entry `WinMainCRTStartup`). It will not build with gfortran/ifx without porting the QuickWin and dialog calls.
- Build: open `STANGBYGNING1.DSW` (repo root) in Microsoft Developer Studio and build the `STANGBYGNING1 - Win32 Debug` (or Release) configuration. There's no makefile; the IDE's "Export Makefile" would generate one for `NMAKE /f STANGBYGNING1.MAK CFG="STANGBYGNING1 - Win32 Debug"`.
- `STANGMOD.F90` must be compiled first (other files `USE STANGMOD`; the `.mod` goes in `Debug/`).
- **`gridshape.obj` and `SCALIN.obj` in `Stangbygning1/Debug/` have no source in the repo.** They are linked straight into the executable (`GRIDSHAPE` is called from `CALCPLOT`). Don't delete or clean that `Debug/` folder.
- `Stangbygning1/STANG.DSP`/`.DSW` and `Stangbygning1/Stang1/` are older or alternate project files. `STANG.DSP` is a console build that doesn't link `gridshape.obj`. The root `STANGBYGNING1.DSP` is the current project.
- There are no tests or linting. To check a change, run the program on a `.DAT` file and compare the `.OUT` output.

## Source conventions (important when editing)

- Files are **ISO-8859-1 / Windows-1252 with CRLF** line endings (Danish æ/ø/å in comments and strings). Keep both the encoding and the line endings. Don't re-save the files as UTF-8.
- Free-form `.F90`, mostly upper-case, with `IMPLICIT INTEGER(4) (I-N), REAL(8) (A-H,O-Z)` throughout. Variable types follow implicit naming, so a new variable's first letter decides its type.
- Nearly all shared state lives in `MODULE STANGMOD` (`STANGMOD.F90`), which also sets the array limits `NEYX=15` (max guides) and `NELX=120` (max beam elements). Physics routines (`BEND`, `FORCES`, `SOLSYM`, `GAUELI`, `CHEBUD`, `CHEPOL`) take their data as explicit arguments instead of using the module.
- Dialog IDs come from `RESOURCE.FD` (`INCLUDE 'resource.fd'`), which is generated from `RESOURCE.RC`/`RESOURCE.H`. If you change a dialog, keep all three in sync.

## Architecture

`STANG.F90` (main program) runs a state machine on `IFASE` (in the module):

- `IFASE=1`: `FILDIALOG` asks for a base filename, then the program opens `<name>.DAT` (unit 2) and `<name>.OUT` (unit 7). If the `.DAT` file is missing, it uses hard-coded default values.
- `IFASE=2`: `DATADIALOG` edits the parameters, then `STANGINIT` computes guide positions (`ZEYE`), element boundaries (`XL`) and the taper/radius profile (`RR`, using Chebyshev smoothing in `CHEBUD`/`CHEPOL`). The program then **rewrites the `.DAT` file** with the inputs plus the computed guide positions and the `XL, diameter` table. It also iterates `FORCES` + `BEND` to find a reference force `REFF` that deflects the tip by 0.05·`STAL`.
- `IFASE>=3`: `LASTDIALOG` asks for a new line tension `NYTRIS` and angle `NYVISH`.
- Each loop then calls `CALCPLOT`. `CALCPLOT` calls `BEAM`, which applies the load in increments and iterates `FORCES` (line forces on each guide) and `BEND` (large-deformation beam theory, integrating moments via `BMOMENT`). `CALCPLOT` then writes tables to unit 7 and draws plots with QuickWin.
- The user picks the next phase by typing it at the console prompt, or from the menu callbacks `HENTFIL` (→1), `HENTDATA` (→2) and `HENTLAST` (→3), which are added under menu 4 in `STANG.F90`.

`SOLSYM` (LDL solver) and `GAUELI` (Gaussian elimination) are third-party B&W Diesel library routines. Leave them unchanged.

### File units / I/O

- Unit 2: `<name>.DAT` input. Free-format, comma-separated, five header lines (`NKANT,NEYE,NELE` / `EMOD,RHO,NYTRIS` / `STAL,HAND,AFST,SPIDS` / `REYE,HEY1,HEY2,AJIG,FERL,AFERL` / `NYVISH,VISP,ALFA`). The full parameter meanings and units are in the header comment of `STANG.F90`.
- Unit 7: `<name>.OUT` result tables and trace output.
- Unit 8: `stangud.out` debug/emergency log (opened at startup in the working directory).
- `Thh.dat`/`Thh.stang` use a different, semicolon-separated format with decimal commas, which the current code doesn't read.
