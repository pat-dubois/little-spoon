# Little Spoon interface decisions

## Direction

A clinician's daily calculator with warm editorial typography and a compact working surface. Crystal's Serene Parfait attachment supplies the cream, cocoa, berry and sage palette and the Literata / Geist pairing. This is a functional product interface. The installed design-taste-frontend and high-end-visual-design skills are applied for typography, theme consistency, contrast and polish; their landing page, hero, motion and decorative image patterns do not fit the task.

Design variance 3, motion intensity 2, visual density 5. Clinical legibility and predictable controls take priority over novelty. A flat editorial result layout gives numbers more space than their containers. Native form controls, semantic tables and browser disclosure elements reduce interaction complexity.

## Structure

The shared patient tray precedes Nutrition, Z-score and DRI / RDA tabs. Nutrition opens first. Tabs follow the arrow-key navigation pattern; inputs have visible labels and independent validation. Age can come from entered whole years/months or exact dates. Growth requires dates and identifies the measurement convention explicitly. Results are recalculated from the current entries after the first calculation, so edited fields cannot leave old results on screen.

Use of sex is labeled as a property of the source reference, without inferring gender identity. No identifiers are collected. Patient entries stay only in React memory and are cleared together by Reset all. There is no patient persistence or transmission.

## Visual system

The canvas is warm cream; major working areas use linen surfaces over an oat enclosure. Cocoa text carries hierarchy; berry indicates selected controls and the patient point; sage distinguishes reference material without suggesting that a result is healthy. Dark mode uses cocoa surfaces and the same semantic accent roles, with lighter text and accents. The whole page changes theme together.

Cards use 20 to 24px radii, inputs 10px, and buttons full pills. Headings use Literata at practical sizes; all inputs and results use Geist with tabular numerals. Motion is limited to 140ms press feedback and is removed for reduced motion. There are no decorative charts or speculative clinical outcomes.

## Clinical presentation

Each result identifies its method and offers full calculation steps and linked sources. No z-score receives a red/green health classification. Unavailable results keep their own reason visible instead of blocking unrelated valid results. DRI daily reference values, Adequate Intake and upper limits are distinguished in text. Missing upper limits are never presented as zero or as evidence that any intake is safe.

Dates feed both reference systems without conflating their age conventions. Nutrition and DRI use attained calendar months, including the fraction of the current calendar month; growth uses WHO elapsed days divided by 30.4375. Monthly anniversaries clamp to the final day of a shorter month, including February 29 birthdays. The displayed age includes elapsed days and completed calendar years/months, while the growth work shows the WHO reference age.

Growth charts plot source curves and the entered measurement. A dotted curve follows the same z-score only across the supported source range and is explicitly a reference comparison, not a forecast. Native SVG is used for quantitative plots rather than decorative icon drawing.

## Responsive and accessible behavior

The desktop measurement tray uses four columns and becomes two on phones. Date fields and multi-column analysis sections become a single column below 768px. Controls are at least 44px high. Chart labels and table headings remain readable, and wide reference tables scroll inside their own region. Focus rings, error messages and selected tabs remain visible in both themes. All color-coded chart distinctions have text labels or line-pattern equivalents.

## Verification

Implementation and browser verification are recorded by the coordinating agent in NEXT.md. Clinical source research and test evidence belong in the clinical documentation, not in promotional interface claims.
