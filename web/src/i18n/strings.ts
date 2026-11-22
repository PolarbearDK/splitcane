import type { DesignParams } from '../engine/types';

export type Lang = 'da' | 'en';

type FieldText = { label: string; help: string };

export interface Strings {
  appTitle: string;
  appSubtitle: string;
  file: {
    new: string;
    open: string;
    save: string;
    report: string;
    examples: string;
    exampleSpiral: string;
    exampleCircle: string;
    exampleDefault: string;
    nameLabel: string;
    notesLabel: string;
    openHint: string;
    importedDat: string;
    confirmDiscard: string;
  };
  sections: {
    rod: string;
    guides: string;
    material: string;
    shape: string;
    ferrule: string;
    load: string;
    loadHelp: string;
    resetLoad: string;
    customGuides: string;
    customGuidesHelp: string;
    fillGuides: string;
    customTaper: string;
    customTaperHelp: string;
  };
  fields: Record<keyof DesignParams | 'loadTension' | 'loadAngle', FieldText>;
  units: { mm: string; deg: string; N: string; Nmm: string; Nmm2: string; g: string; gcm3: string; Nmm2mod: string };
  validation: {
    number: string;
    integer: string;
    min: (v: number) => string;
    max: (v: number) => string;
    positive: string;
    nonNegative: string;
    lessThanLength: string;
    handlePlusGuide: string;
    tipBelowLine: string;
    guideList: (n: number) => string;
    taperList: string;
  };
  results: {
    fixInputs: string;
    error: string;
    warnings: string;
    mass: string;
    cg: string;
    cgHelp: string;
    refForce: string;
    refForceHelp: string;
    sigmaMax: string;
    sigmaMaxAt: (x: string) => string;
    tip: string;
    ferrule: string;
    noFerrule: string;
    shape: { spiral: string; circle: string; custom: string };
    designLoad: string;
    appliedLoad: string;
    steps: (n: number) => string;
  };
  charts: {
    deflection: string;
    thickness: string;
    moment: string;
    stress: string;
    exaggeration: string;
    legendRod: string;
    legendHandle: string;
    legendFerrule: string;
    legendIdeal: string;
    legendLine: string;
    legendGuides: string;
    legendCentre: string;
    legendDesignLoad: string;
    diameter: string;
    height: string;
    position: string;
    deflectionNote: string;
  };
  tables: {
    guides: string;
    taper: string;
    loaded: string;
    jig: string;
    jigHelp: string;
    no: string;
    fromButt: string;
    fromTip: string;
    spacing: string;
    guideHeight: string;
    handle: string;
    x: string;
    ux: string;
    uy: string;
    angle: string;
    diameter: string;
    height: string;
    radius: string;
    width: string;
    moment: string;
    stress: string;
    screw: string;
    depth: string;
    inch: string;
  };
  errors: Record<string, (p: Record<string, number>) => string>;
  docErrors: Record<string, string>;
  warnings: Record<string, (p: Record<string, number>) => string>;
  about: { title: string; body: string; legacyNote: string };
  report: {
    title: string;
    input: string;
    generated: string;
  };
}

const f = (n: number, d = 1) => n.toFixed(d);

export const STRINGS: Record<Lang, Strings> = {
  da: {
    appTitle: 'Stangbygning',
    appSubtitle: 'Beregning af splitcane-fiskestænger',
    file: {
      new: 'Ny',
      open: 'Åbn…',
      save: 'Gem',
      report: 'Rapport',
      examples: 'Eksempler',
      exampleSpiral: 'stang – spiral (2013)',
      exampleCircle: 'stang1 – cirkel (2011)',
      exampleDefault: 'Standardværdier',
      nameLabel: 'Navn',
      notesLabel: 'Noter',
      openHint: 'Åbn en .json-fil eller en gammel .DAT-fil',
      importedDat: 'Gammel .DAT-fil indlæst. Gem den som .json for at bruge det nye format.',
      confirmDiscard: 'Kassér de nuværende data?',
    },
    sections: {
      rod: 'Stang',
      guides: 'Øjer',
      material: 'Materiale',
      shape: 'Ønsket udbøjning ved fuldt træk',
      ferrule: 'Ferrule og høvlelære',
      load: 'Prøvebelastning',
      loadHelp: 'Stangen dimensioneres efter trækket ovenfor. Her kan du afprøve den færdige stang med et andet træk eller en anden vinkel.',
      resetLoad: 'Brug designværdier',
      customGuides: 'Øjeplacering',
      customGuidesHelp: 'Én position pr. linje, mm fra håndtagsenden. Første øje skal sidde ved håndtag + afstand, sidste ved stanglængden.',
      fillGuides: 'Udfyld med beregnede',
      customTaper: 'Målt tilspidsning',
      customTaperHelp: 'Én linje pr. punkt: position (mm fra håndtagsenden) og diameter målt over kanterne (mm). Mindst 7 punkter.',
    },
    fields: {
      sides: { label: 'Antal kanter', help: '6 for en sekskantet stang' },
      guideCount: { label: 'Antal øjer', help: '3 – 14, inkl. topøje' },
      elementCount: { label: 'Antal elementer', help: 'Ca. antal elementer i beregningen (29 – 119)' },
      rodLength: { label: 'Stanglængde', help: 'Total længde' },
      handleLength: { label: 'Længde af håndtag', help: '' },
      firstGuideDistance: { label: 'Afstand håndtag – nederste øje', help: 'Fra overkant af håndtag' },
      tipDiameter: { label: 'Mindste diameter i spids', help: '0 = brug målt tilspidsning' },
      guideSpacingRatio: { label: 'Forhold mellem øjeafstande', help: 'Største / mindste afstand. 1 = jævn. 0 = angiv selv' },
      bottomGuideHeight: { label: 'Højde af nederste øje', help: '' },
      topGuideHeight: { label: 'Højde af øverste øje', help: '' },
      elasticModulus: { label: 'Elasticitetsmodul', help: '' },
      density: { label: 'Massefylde', help: '' },
      lineTension: { label: 'Træk i snøren', help: 'Det træk stangen dimensioneres til' },
      lineAngle: { label: 'Vinkel håndtag – snøre', help: 'Ca. 90°' },
      tipAngle: { label: 'Vinkel håndtag – spids', help: 'Spidsens tangent ved fuldt træk, ca. 60°' },
      spiralParameter: { label: 'Spiralparameter', help: '0 = cirkel. Større = stivere stang. Maks. 89' },
      ferruleLength: { label: 'Længde af ferrule', help: '' },
      ferruleClearance: { label: 'Mindste afstand øje – ferrule', help: '' },
      jigScrewSpacing: { label: 'Skrueafstand i høvlelære', help: '' },
      loadTension: { label: 'Træk i snøren', help: '' },
      loadAngle: { label: 'Vinkel håndtag – snøre', help: '' },
    },
    units: { mm: 'mm', deg: '°', N: 'N', Nmm: 'N·mm', Nmm2: 'N/mm²', g: 'g', gcm3: 'g/cm³', Nmm2mod: 'N/mm²' },
    validation: {
      number: 'Skal være et tal',
      integer: 'Skal være et heltal',
      min: (v) => `Mindst ${v}`,
      max: (v) => `Højst ${v}`,
      positive: 'Skal være større end 0',
      nonNegative: 'Må ikke være negativ',
      lessThanLength: 'Skal være mindre end stanglængden',
      handlePlusGuide: 'Håndtag + afstand skal være mindre end stanglængden',
      tipBelowLine: 'Skal være mindre end snørens vinkel',
      guideList: (n) => `Angiv ${n} positioner (én pr. linje)`,
      taperList: 'Hver linje skal have to tal: position og diameter',
    },
    results: {
      fixInputs: 'Ret de markerede felter for at beregne stangen.',
      error: 'Beregningen stoppede',
      warnings: 'Bemærkninger',
      mass: 'Masse',
      cg: 'Tyngdepunkt',
      cgHelp: 'fra håndtagsenden',
      refForce: 'Referencekraft',
      refForceHelp: 'giver udbøjning 5 % af længden',
      sigmaMax: 'Største spænding',
      sigmaMaxAt: (x) => `${x} mm fra spidsen`,
      tip: 'Spidsens position',
      ferrule: 'Ferrule',
      noFerrule: 'ingen',
      shape: { spiral: 'spiral', circle: 'cirkel', custom: 'målt tilspidsning' },
      designLoad: 'Designlast',
      appliedLoad: 'Prøvelast',
      steps: (n) => `${n} lasttrin`,
    },
    charts: {
      deflection: 'Udbøjning',
      thickness: 'Tykkelse',
      moment: 'Bøjningsmoment',
      stress: 'Spænding',
      exaggeration: 'Tykkelse forstørret',
      legendRod: 'Stang',
      legendHandle: 'Håndtag',
      legendFerrule: 'Ferrule',
      legendIdeal: 'Tilstræbt kurve',
      legendLine: 'Snøre',
      legendGuides: 'Øjer',
      legendCentre: 'Radier til centrum',
      legendDesignLoad: 'Ved designlast',
      diameter: 'Diameter',
      height: 'Højde (centrum – flade)',
      position: 'Afstand fra håndtagsenden',
      deflectionNote: 'Koordinatsystemets begyndelsespunkt ligger nederst i håndtaget.',
    },
    tables: {
      guides: 'Øjer',
      taper: 'Tilspidsning',
      loaded: 'Belastet stang',
      jig: 'Høvlelære',
      jigHelp: 'Skrue nr. 0 ved stangens spids. Dybde = højde fra centrum til flade.',
      no: 'Nr.',
      fromButt: 'Fra håndtagsende',
      fromTip: 'Fra spids',
      spacing: 'Afstand',
      guideHeight: 'Højde',
      handle: 'håndtag',
      x: 'X',
      ux: 'Ux',
      uy: 'Uy',
      angle: 'Vinkel',
      diameter: 'Diameter',
      height: 'Højde',
      radius: 'Radius',
      width: 'Bredde',
      moment: 'Bøjmoment',
      stress: 'Spænding',
      screw: 'Skrue',
      depth: 'Dybde',
      inch: 'tommer',
    },
    errors: {
      lineAngleNotAboveTipAngle: () => 'Snørens vinkel er mindre end spidsens.',
      guideFirstPosition: (p) => `Nederste øje er ikke placeret ved håndtag + afstand (${f(p.expected, 2)} mm), men ved ${f(p.got, 2)} mm.`,
      guideOrder: (p) => `Øjerne ved ${f(p.a, 2)} og ${f(p.b, 2)} mm er ikke i rækkefølge.`,
      guideLastPosition: (p) => `Øverste øje er ikke placeret ved stanglængden (${f(p.expected, 2)} mm), men ved ${f(p.got, 2)} mm.`,
      guideCount: (p) => `Der skal angives ${p.expected} øjepositioner (fandt ${p.got}).`,
      ferruleTooLong: (p) => `For lang ferrule + afstande (${f(p.needed)} mm) i forhold til afstanden mellem øjerne (${f(p.available)} mm).`,
      negativeMoment: (p) => `Uforklarligt negativt bøjningsmoment ved element ${p.element}.`,
      negativeRadius: (p) => `Negativ radius ved element ${p.element}.`,
      chebyshevSingular: () => 'Tilspidsningen kunne ikke udglattes (punkterne er ikke uafhængige).',
      taperTooFewPoints: (p) => `Den målte tilspidsning skal have mindst ${p.min} punkter (fandt ${p.got}).`,
      referenceNotConverged: () => 'Referencekraften konvergerede ikke efter 30 iterationer.',
      beamNotConverged: (p) => `Udbøjningen konvergerede ikke (lasttrin ${p.step}).`,
      invalidResult: () => 'Beregningen gav ugyldige tal. Kontrollér dataene.',
      unknown: () => 'Ukendt fejl i beregningen.',
    },
    docErrors: {
      notJson: 'Filen er hverken gyldig JSON eller en .DAT-fil.',
      wrongFormat: 'Filen er ikke en stangbygnings-fil.',
      newerVersion: 'Filen er lavet med en nyere version af programmet.',
      missingField: 'Filen mangler et felt:',
      badValue: 'Filen har en ugyldig værdi:',
      dat: 'Kunne ikke læse .DAT-filen, linje',
    },
    warnings: {
      taperCoordinatesOrder: (p) => `Koordinater ikke i rækkefølge ved punkt ${p.point} (${f(p.a)} → ${f(p.b)}).`,
      taperIncreasing: (p) => `Punkt ${p.point}: positioner aftager.`,
      taperReversed: () => 'Tallene er byttet om, så den tykke ende kommer først.',
      taperFromTip: () => 'Tallene er indlæst fra den spidse ende.',
      chebyshevRange: (p) => `Punkt ${p.point} ligger uden for stangen eller i forkert rækkefølge.`,
    },
    about: {
      title: 'Om programmet',
      body: 'Programmet beregner tilspidsning, øjeplacering og udbøjning af splitcane-fiskestænger. Stangen dimensioneres, så den under det valgte træk bøjer i en logaritmisk spiral (eller en cirkel), og kontrolleres derefter med bjælketeori for store deformationer.',
      legacyNote: 'Oprindeligt skrevet i Fortran af Viggo Hoppe (2000 – 2013). Beregningerne er overført linje for linje og kontrolleret mod det gamle programs resultatfiler. Tre fejl er rettet: alle øjer får nu snorkraft, ferrulen regnes stiv, og stykket under ferrulen deles i elementer.',
    },
    report: { title: 'Beregning af splitcane-fiskestang', input: 'Inddata', generated: 'Udskrevet' },
  },
  en: {
    appTitle: 'Stangbygning',
    appSubtitle: 'Split-cane fly rod calculator',
    file: {
      new: 'New',
      open: 'Open…',
      save: 'Save',
      report: 'Report',
      examples: 'Examples',
      exampleSpiral: 'stang – spiral (2013)',
      exampleCircle: 'stang1 – circle (2011)',
      exampleDefault: 'Default values',
      nameLabel: 'Name',
      notesLabel: 'Notes',
      openHint: 'Open a .json file or an old .DAT file',
      importedDat: 'Old .DAT file imported. Save it as .json to use the new format.',
      confirmDiscard: 'Discard the current data?',
    },
    sections: {
      rod: 'Rod',
      guides: 'Guides',
      material: 'Material',
      shape: 'Target bend at full load',
      ferrule: 'Ferrule and planing form',
      load: 'Test load',
      loadHelp: 'The rod is designed for the line tension above. Here you can test the finished rod with another tension or angle.',
      resetLoad: 'Use design values',
      customGuides: 'Guide positions',
      customGuidesHelp: 'One position per line, mm from the butt. The first guide must be at handle + distance, the last at the rod length.',
      fillGuides: 'Fill with computed',
      customTaper: 'Measured taper',
      customTaperHelp: 'One line per point: position (mm from the butt) and diameter across the corners (mm). At least 7 points.',
    },
    fields: {
      sides: { label: 'Number of sides', help: '6 for a hexagonal rod' },
      guideCount: { label: 'Number of guides', help: '3 – 14, including the tip-top' },
      elementCount: { label: 'Number of elements', help: 'Approximate number of beam elements (29 – 119)' },
      rodLength: { label: 'Rod length', help: 'Total length' },
      handleLength: { label: 'Handle length', help: '' },
      firstGuideDistance: { label: 'Handle to lowest guide', help: 'From the top of the handle' },
      tipDiameter: { label: 'Minimum tip diameter', help: '0 = use measured taper' },
      guideSpacingRatio: { label: 'Guide spacing ratio', help: 'Largest / smallest spacing. 1 = even. 0 = enter manually' },
      bottomGuideHeight: { label: 'Height of lowest guide', help: '' },
      topGuideHeight: { label: 'Height of top guide', help: '' },
      elasticModulus: { label: 'Modulus of elasticity', help: '' },
      density: { label: 'Density', help: '' },
      lineTension: { label: 'Line tension', help: 'The tension the rod is designed for' },
      lineAngle: { label: 'Angle handle – line', help: 'About 90°' },
      tipAngle: { label: 'Angle handle – tip', help: 'Tip tangent at full load, about 60°' },
      spiralParameter: { label: 'Spiral parameter', help: '0 = circle. Larger = stiffer rod. Max 89' },
      ferruleLength: { label: 'Ferrule length', help: '' },
      ferruleClearance: { label: 'Min. distance guide – ferrule', help: '' },
      jigScrewSpacing: { label: 'Screw spacing in planing form', help: '' },
      loadTension: { label: 'Line tension', help: '' },
      loadAngle: { label: 'Angle handle – line', help: '' },
    },
    units: { mm: 'mm', deg: '°', N: 'N', Nmm: 'N·mm', Nmm2: 'N/mm²', g: 'g', gcm3: 'g/cm³', Nmm2mod: 'N/mm²' },
    validation: {
      number: 'Must be a number',
      integer: 'Must be a whole number',
      min: (v) => `At least ${v}`,
      max: (v) => `At most ${v}`,
      positive: 'Must be greater than 0',
      nonNegative: 'Must not be negative',
      lessThanLength: 'Must be less than the rod length',
      handlePlusGuide: 'Handle + distance must be less than the rod length',
      tipBelowLine: 'Must be less than the line angle',
      guideList: (n) => `Enter ${n} positions (one per line)`,
      taperList: 'Each line needs two numbers: position and diameter',
    },
    results: {
      fixInputs: 'Correct the highlighted fields to calculate the rod.',
      error: 'The calculation stopped',
      warnings: 'Notes',
      mass: 'Mass',
      cg: 'Centre of gravity',
      cgHelp: 'from the butt',
      refForce: 'Reference force',
      refForceHelp: 'deflects the tip 5 % of the length',
      sigmaMax: 'Maximum stress',
      sigmaMaxAt: (x) => `${x} mm from the tip`,
      tip: 'Tip position',
      ferrule: 'Ferrule',
      noFerrule: 'none',
      shape: { spiral: 'spiral', circle: 'circle', custom: 'measured taper' },
      designLoad: 'Design load',
      appliedLoad: 'Test load',
      steps: (n) => `${n} load steps`,
    },
    charts: {
      deflection: 'Deflection',
      thickness: 'Thickness',
      moment: 'Bending moment',
      stress: 'Stress',
      exaggeration: 'Thickness exaggerated',
      legendRod: 'Rod',
      legendHandle: 'Handle',
      legendFerrule: 'Ferrule',
      legendIdeal: 'Target curve',
      legendLine: 'Line',
      legendGuides: 'Guides',
      legendCentre: 'Radii to centre',
      legendDesignLoad: 'At design load',
      diameter: 'Diameter',
      height: 'Height (centre – flat)',
      position: 'Distance from the butt',
      deflectionNote: 'The origin is at the butt end of the handle.',
    },
    tables: {
      guides: 'Guides',
      taper: 'Taper',
      loaded: 'Loaded rod',
      jig: 'Planing form',
      jigHelp: 'Screw no. 0 is at the tip. Depth = height from centre to flat.',
      no: 'No.',
      fromButt: 'From butt',
      fromTip: 'From tip',
      spacing: 'Spacing',
      guideHeight: 'Height',
      handle: 'handle',
      x: 'X',
      ux: 'Ux',
      uy: 'Uy',
      angle: 'Angle',
      diameter: 'Diameter',
      height: 'Height',
      radius: 'Radius',
      width: 'Width',
      moment: 'Moment',
      stress: 'Stress',
      screw: 'Screw',
      depth: 'Depth',
      inch: 'inches',
    },
    errors: {
      lineAngleNotAboveTipAngle: () => 'The line angle is smaller than the tip angle.',
      guideFirstPosition: (p) => `The lowest guide is not at handle + distance (${f(p.expected, 2)} mm) but at ${f(p.got, 2)} mm.`,
      guideOrder: (p) => `The guides at ${f(p.a, 2)} and ${f(p.b, 2)} mm are not in order.`,
      guideLastPosition: (p) => `The top guide is not at the rod length (${f(p.expected, 2)} mm) but at ${f(p.got, 2)} mm.`,
      guideCount: (p) => `${p.expected} guide positions are required (found ${p.got}).`,
      ferruleTooLong: (p) => `Ferrule + clearances (${f(p.needed)} mm) are longer than the space between the guides (${f(p.available)} mm).`,
      negativeMoment: (p) => `Unexplained negative bending moment at element ${p.element}.`,
      negativeRadius: (p) => `Negative radius at element ${p.element}.`,
      chebyshevSingular: () => 'The taper could not be smoothed (the points are not independent).',
      taperTooFewPoints: (p) => `The measured taper needs at least ${p.min} points (found ${p.got}).`,
      referenceNotConverged: () => 'The reference force did not converge in 30 iterations.',
      beamNotConverged: (p) => `The deflection did not converge (load step ${p.step}).`,
      invalidResult: () => 'The calculation produced invalid numbers. Check the data.',
      unknown: () => 'Unknown error in the calculation.',
    },
    docErrors: {
      notJson: 'The file is neither valid JSON nor a .DAT file.',
      wrongFormat: 'The file is not a Stangbygning file.',
      newerVersion: 'The file was made by a newer version of the program.',
      missingField: 'The file is missing a field:',
      badValue: 'The file has an invalid value:',
      dat: 'Could not read the .DAT file, line',
    },
    warnings: {
      taperCoordinatesOrder: (p) => `Coordinates out of order at point ${p.point} (${f(p.a)} → ${f(p.b)}).`,
      taperIncreasing: (p) => `Point ${p.point}: positions decrease.`,
      taperReversed: () => 'The points were reversed so the thick end comes first.',
      taperFromTip: () => 'The points were read from the tip end.',
      chebyshevRange: (p) => `Point ${p.point} is outside the rod or out of order.`,
    },
    about: {
      title: 'About',
      body: 'This program designs the taper and guide placement of split-cane fly rods. The rod is sized so that, under the chosen line tension, it bends into a logarithmic spiral (or a circle). It is then checked with large-deflection beam theory.',
      legacyNote: 'Originally written in Fortran by Viggo Hoppe (2000 – 2013). The calculations were ported line by line and checked against the old program’s output files. Three bugs have been fixed: every guide now gets its share of the line force, the ferrule is treated as rigid, and the stretch below the ferrule is divided into elements.',
    },
    report: { title: 'Split-cane fly rod calculation', input: 'Input', generated: 'Printed' },
  },
};
