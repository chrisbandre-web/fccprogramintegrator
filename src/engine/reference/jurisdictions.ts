// GENERATED — DO NOT EDIT.
// Produced by scripts/generate-jurisdictions.ts from
// content/Country_Risk_Ratings_20AUG26.docx (TAD §D.1.1b). A content
// change is a source-document edit followed by
// `npm run generate:jurisdictions`, in that order — never a hand edit
// here (§D.1.1's generate-and-commit discipline, extended by §D.1.1b).
//
// TAD §C.4, §D.2.3 — engine-internal reference table. Import-restricted:
// nothing outside src/engine/ may import it (§L.3, TAD-2).

export const SOURCE = "Basel AML Index, Public Edition";
export const EDITION = "2025";
export const ACCESSED = "2026-08-20";
export const THRESHOLD = "> 5.00";

export type JurisdictionBand = 'High' | 'Medium' | 'Low'; // CRRM v2.3 §4

interface JurisdictionEntry {
  readonly country: string;
  readonly overallScore: number;
  /** The source document's own Risk Rating column, stored verbatim and untranslated (§C.4). */
  readonly assertedBand: JurisdictionBand;
}

const TABLE: readonly JurisdictionEntry[] = [
  { country: "Myanmar", overallScore: 8.18, assertedBand: 'High' },
  { country: "Haiti", overallScore: 8.12, assertedBand: 'High' },
  { country: "Democratic Republic of the Congo", overallScore: 7.63, assertedBand: 'High' },
  { country: "Chad", overallScore: 7.56, assertedBand: 'High' },
  { country: "Equatorial Guinea", overallScore: 7.55, assertedBand: 'High' },
  { country: "Venezuela", overallScore: 7.55, assertedBand: 'High' },
  { country: "Lao PDR", overallScore: 7.5, assertedBand: 'High' },
  { country: "Gabon", overallScore: 7.46, assertedBand: 'High' },
  { country: "Central African Republic", overallScore: 7.44, assertedBand: 'High' },
  { country: "Guinea-Bissau", overallScore: 7.3, assertedBand: 'High' },
  { country: "Republic of the Congo", overallScore: 7.27, assertedBand: 'High' },
  { country: "China", overallScore: 7.26, assertedBand: 'High' },
  { country: "Djibouti", overallScore: 6.93, assertedBand: 'High' },
  { country: "Niger", overallScore: 6.84, assertedBand: 'High' },
  { country: "Algeria", overallScore: 6.82, assertedBand: 'High' },
  { country: "Madagascar", overallScore: 6.77, assertedBand: 'High' },
  { country: "Turkmenistan", overallScore: 6.73, assertedBand: 'High' },
  { country: "Cambodia", overallScore: 6.72, assertedBand: 'High' },
  { country: "Vietnam", overallScore: 6.69, assertedBand: 'High' },
  { country: "Comoros", overallScore: 6.67, assertedBand: 'High' },
  { country: "Nicaragua", overallScore: 6.61, assertedBand: 'High' },
  { country: "Papua New Guinea", overallScore: 6.61, assertedBand: 'High' },
  { country: "Kenya", overallScore: 6.6, assertedBand: 'High' },
  { country: "Angola", overallScore: 6.55, assertedBand: 'High' },
  { country: "Eswatini", overallScore: 6.51, assertedBand: 'High' },
  { country: "Tajikistan", overallScore: 6.44, assertedBand: 'High' },
  { country: "Togo", overallScore: 6.44, assertedBand: 'High' },
  { country: "Guinea", overallScore: 6.43, assertedBand: 'High' },
  { country: "Suriname", overallScore: 6.42, assertedBand: 'High' },
  { country: "Cameroon", overallScore: 6.41, assertedBand: 'High' },
  { country: "Sierra Leone", overallScore: 6.41, assertedBand: 'High' },
  { country: "Mozambique", overallScore: 6.38, assertedBand: 'High' },
  { country: "Benin", overallScore: 6.33, assertedBand: 'High' },
  { country: "Solomon Islands", overallScore: 6.31, assertedBand: 'High' },
  { country: "Mauritania", overallScore: 6.29, assertedBand: 'High' },
  { country: "Liberia", overallScore: 6.26, assertedBand: 'High' },
  { country: "Mali", overallScore: 6.22, assertedBand: 'High' },
  { country: "Nigeria", overallScore: 6.18, assertedBand: 'High' },
  { country: "Kuwait", overallScore: 6.13, assertedBand: 'High' },
  { country: "United Arab Emirates", overallScore: 6.11, assertedBand: 'High' },
  { country: "Côte d'Ivoire", overallScore: 6.05, assertedBand: 'High' },
  { country: "Lesotho", overallScore: 6.04, assertedBand: 'High' },
  { country: "Zimbabwe", overallScore: 5.99, assertedBand: 'High' },
  { country: "Thailand", overallScore: 5.98, assertedBand: 'High' },
  { country: "Kyrgyzstan", overallScore: 5.96, assertedBand: 'High' },
  { country: "Sao Tome and Principe", overallScore: 5.96, assertedBand: 'High' },
  { country: "Lebanon", overallScore: 5.93, assertedBand: 'High' },
  { country: "Iraq", overallScore: 5.9, assertedBand: 'High' },
  { country: "Nepal", overallScore: 5.88, assertedBand: 'High' },
  { country: "Saudi Arabia", overallScore: 5.87, assertedBand: 'High' },
  { country: "Panama", overallScore: 5.83, assertedBand: 'High' },
  { country: "Gambia", overallScore: 5.76, assertedBand: 'High' },
  { country: "Burkina Faso", overallScore: 5.75, assertedBand: 'High' },
  { country: "Uganda", overallScore: 5.72, assertedBand: 'High' },
  { country: "Rwanda", overallScore: 5.71, assertedBand: 'High' },
  { country: "Belarus", overallScore: 5.7, assertedBand: 'High' },
  { country: "Ethiopia", overallScore: 5.68, assertedBand: 'High' },
  { country: "Tonga", overallScore: 5.67, assertedBand: 'High' },
  { country: "Honduras", overallScore: 5.66, assertedBand: 'High' },
  { country: "India", overallScore: 5.66, assertedBand: 'High' },
  { country: "El Salvador", overallScore: 5.65, assertedBand: 'High' },
  { country: "Türkiye", overallScore: 5.65, assertedBand: 'High' },
  { country: "Pakistan", overallScore: 5.63, assertedBand: 'High' },
  { country: "South Africa", overallScore: 5.63, assertedBand: 'High' },
  { country: "Bangladesh", overallScore: 5.62, assertedBand: 'High' },
  { country: "Malaysia", overallScore: 5.6, assertedBand: 'High' },
  { country: "Bolivia", overallScore: 5.58, assertedBand: 'High' },
  { country: "Timor-Leste", overallScore: 5.58, assertedBand: 'High' },
  { country: "Bosnia and Herzegovina", overallScore: 5.54, assertedBand: 'High' },
  { country: "Indonesia", overallScore: 5.52, assertedBand: 'High' },
  { country: "Mexico", overallScore: 5.52, assertedBand: 'High' },
  { country: "Tanzania", overallScore: 5.51, assertedBand: 'High' },
  { country: "Bhutan", overallScore: 5.49, assertedBand: 'High' },
  { country: "Philippines", overallScore: 5.48, assertedBand: 'High' },
  { country: "Azerbaijan", overallScore: 5.46, assertedBand: 'High' },
  { country: "Saint Kitts and Nevis", overallScore: 5.46, assertedBand: 'High' },
  { country: "Cape Verde", overallScore: 5.45, assertedBand: 'High' },
  { country: "Guatemala", overallScore: 5.44, assertedBand: 'High' },
  { country: "Malawi", overallScore: 5.44, assertedBand: 'High' },
  { country: "Brazil", overallScore: 5.4, assertedBand: 'High' },
  { country: "Ukraine", overallScore: 5.38, assertedBand: 'High' },
  { country: "Hong Kong, SAR, China", overallScore: 5.37, assertedBand: 'High' },
  { country: "Senegal", overallScore: 5.36, assertedBand: 'High' },
  { country: "Zambia", overallScore: 5.31, assertedBand: 'High' },
  { country: "Uzbekistan", overallScore: 5.27, assertedBand: 'High' },
  { country: "Qatar", overallScore: 5.25, assertedBand: 'High' },
  { country: "Egypt", overallScore: 5.22, assertedBand: 'High' },
  { country: "Serbia", overallScore: 5.21, assertedBand: 'High' },
  { country: "Kazakhstan", overallScore: 5.18, assertedBand: 'High' },
  { country: "Bahrain", overallScore: 5.16, assertedBand: 'High' },
  { country: "Cuba", overallScore: 5.16, assertedBand: 'High' },
  { country: "Guyana", overallScore: 5.16, assertedBand: 'High' },
  { country: "Hungary", overallScore: 5.16, assertedBand: 'High' },
  { country: "Sri Lanka", overallScore: 5.16, assertedBand: 'High' },
  { country: "Malta", overallScore: 5.15, assertedBand: 'High' },
  { country: "Ghana", overallScore: 5.13, assertedBand: 'High' },
  { country: "Bahamas", overallScore: 5.08, assertedBand: 'High' },
  { country: "Dominican Republic", overallScore: 5.08, assertedBand: 'High' },
  { country: "Colombia", overallScore: 5.05, assertedBand: 'High' },
  { country: "Morocco", overallScore: 5.04, assertedBand: 'High' },
  { country: "Bulgaria", overallScore: 5, assertedBand: 'Medium' },
  { country: "Costa Rica", overallScore: 4.97, assertedBand: 'Medium' },
  { country: "Germany", overallScore: 4.97, assertedBand: 'Medium' },
  { country: "Vanuatu", overallScore: 4.97, assertedBand: 'Medium' },
  { country: "Mongolia", overallScore: 4.96, assertedBand: 'Medium' },
  { country: "Barbados", overallScore: 4.91, assertedBand: 'Medium' },
  { country: "Ecuador", overallScore: 4.91, assertedBand: 'Medium' },
  { country: "Paraguay", overallScore: 4.91, assertedBand: 'Medium' },
  { country: "Marshall Islands", overallScore: 4.89, assertedBand: 'Medium' },
  { country: "Peru", overallScore: 4.88, assertedBand: 'Medium' },
  { country: "Grenada", overallScore: 4.85, assertedBand: 'Medium' },
  { country: "Jordan", overallScore: 4.85, assertedBand: 'Medium' },
  { country: "United States", overallScore: 4.83, assertedBand: 'Low' },
  { country: "Romania", overallScore: 4.81, assertedBand: 'Medium' },
  { country: "Jamaica", overallScore: 4.78, assertedBand: 'Medium' },
  { country: "Namibia", overallScore: 4.78, assertedBand: 'Medium' },
  { country: "Cyprus", overallScore: 4.77, assertedBand: 'Medium' },
  { country: "Italy", overallScore: 4.76, assertedBand: 'Medium' },
  { country: "Tunisia", overallScore: 4.75, assertedBand: 'Medium' },
  { country: "Fiji", overallScore: 4.73, assertedBand: 'Medium' },
  { country: "Japan", overallScore: 4.73, assertedBand: 'Medium' },
  { country: "Singapore", overallScore: 4.73, assertedBand: 'Medium' },
  { country: "Mauritius", overallScore: 4.65, assertedBand: 'Medium' },
  { country: "Moldova", overallScore: 4.64, assertedBand: 'Medium' },
  { country: "Canada", overallScore: 4.61, assertedBand: 'Medium' },
  { country: "Seychelles", overallScore: 4.6, assertedBand: 'Medium' },
  { country: "Saint Lucia", overallScore: 4.58, assertedBand: 'Medium' },
  { country: "Samoa", overallScore: 4.56, assertedBand: 'Medium' },
  { country: "Netherlands", overallScore: 4.53, assertedBand: 'Medium' },
  { country: "Korea, South", overallScore: 4.51, assertedBand: 'Medium' },
  { country: "Taiwan (Chinese Taipei)", overallScore: 4.49, assertedBand: 'Medium' },
  { country: "Poland", overallScore: 4.49, assertedBand: 'Medium' },
  { country: "Switzerland", overallScore: 4.47, assertedBand: 'Medium' },
  { country: "Belgium", overallScore: 4.46, assertedBand: 'Medium' },
  { country: "Argentina", overallScore: 4.44, assertedBand: 'Medium' },
  { country: "Ireland", overallScore: 4.4, assertedBand: 'Medium' },
  { country: "Slovakia", overallScore: 4.38, assertedBand: 'Medium' },
  { country: "Albania", overallScore: 4.36, assertedBand: 'Medium' },
  { country: "Montenegro", overallScore: 4.33, assertedBand: 'Medium' },
  { country: "Georgia", overallScore: 4.32, assertedBand: 'Medium' },
  { country: "Austria", overallScore: 4.28, assertedBand: 'Medium' },
  { country: "Chile", overallScore: 4.28, assertedBand: 'Medium' },
  { country: "Oman", overallScore: 4.25, assertedBand: 'Medium' },
  { country: "Spain", overallScore: 4.24, assertedBand: 'Medium' },
  { country: "Uruguay", overallScore: 4.23, assertedBand: 'Medium' },
  { country: "Brunei Darussalam", overallScore: 4.22, assertedBand: 'Medium' },
  { country: "North Macedonia", overallScore: 4.2, assertedBand: 'Medium' },
  { country: "Croatia", overallScore: 4.18, assertedBand: 'Medium' },
  { country: "Dominica", overallScore: 4.17, assertedBand: 'Medium' },
  { country: "Australia", overallScore: 4.13, assertedBand: 'Medium' },
  { country: "Botswana", overallScore: 4.12, assertedBand: 'Medium' },
  { country: "Trinidad and Tobago", overallScore: 4.12, assertedBand: 'Medium' },
  { country: "Liechtenstein", overallScore: 4.11, assertedBand: 'Medium' },
  { country: "Belize", overallScore: 4.06, assertedBand: 'Medium' },
  { country: "Israel", overallScore: 4.06, assertedBand: 'Medium' },
  { country: "Saint Vincent and the Grenadines", overallScore: 4.05, assertedBand: 'Medium' },
  { country: "United Kingdom", overallScore: 4.04, assertedBand: 'Medium' },
  { country: "Lithuania", overallScore: 4.03, assertedBand: 'Medium' },
  { country: "Latvia", overallScore: 4.01, assertedBand: 'Medium' },
  { country: "France", overallScore: 3.99, assertedBand: 'Medium' },
  { country: "Greece", overallScore: 3.99, assertedBand: 'Medium' },
  { country: "Antigua and Barbuda", overallScore: 3.98, assertedBand: 'Medium' },
  { country: "Armenia", overallScore: 3.98, assertedBand: 'Medium' },
  { country: "Luxembourg", overallScore: 3.97, assertedBand: 'Medium' },
  { country: "Nauru", overallScore: 3.88, assertedBand: 'Medium' },
  { country: "Portugal", overallScore: 3.83, assertedBand: 'Medium' },
  { country: "Czech Republic", overallScore: 3.82, assertedBand: 'Medium' },
  { country: "New Zealand", overallScore: 3.76, assertedBand: 'Medium' },
  { country: "Norway", overallScore: 3.73, assertedBand: 'Medium' },
  { country: "Slovenia", overallScore: 3.49, assertedBand: 'Medium' },
  { country: "Andorra", overallScore: 3.48, assertedBand: 'Medium' },
  { country: "Sweden", overallScore: 3.48, assertedBand: 'Medium' },
  { country: "Estonia", overallScore: 3.25, assertedBand: 'Medium' },
  { country: "Denmark", overallScore: 3.18, assertedBand: 'Medium' },
  { country: "San Marino", overallScore: 3.08, assertedBand: 'Medium' },
  { country: "Iceland", overallScore: 3.04, assertedBand: 'Medium' },
  { country: "Finland", overallScore: 3.03, assertedBand: 'Medium' },
];

const BY_COUNTRY = new Map<string, JurisdictionEntry>(TABLE.map((e) => [e.country, e]));

/**
 * CRRM v2.3 §4 / TAD §C.4 — derived, never read. The United States is Low
 * by identity; otherwise strictly-greater-than-5.00 is High, else Medium.
 * A country absent from the table scores High (Coordinator rule, 20 August
 * 2026); the fixture generator is responsible for only ever emitting
 * countries from the closed vocabulary this implies (TAD §C.4).
 */
export function jurisdictionBand(country: string): JurisdictionBand {
  if (country === 'United States') return 'Low';
  const entry = BY_COUNTRY.get(country);
  if (entry === undefined) return 'High';
  return entry.overallScore > 5.0 ? 'High' : 'Medium';
}

// --- Startup assertions (§C.4, §D.2.3) — both hard failures, run once on
// first import, not merely in `npm run check` ----------------------------

if (TABLE.length !== 177) {
  throw new Error(`src/engine/reference/jurisdictions.ts: expected 177 rows, found ${TABLE.length}`);
}

for (const entry of TABLE) {
  const derived = jurisdictionBand(entry.country);
  if (derived !== entry.assertedBand) {
    throw new Error(
      `src/engine/reference/jurisdictions.ts: derived band '${derived}' disagrees with asserted band '${entry.assertedBand}' for ${entry.country} (score ${entry.overallScore})`,
    );
  }
}

const lowEntries = TABLE.filter((e) => e.assertedBand === 'Low');
if (lowEntries.length !== 1 || lowEntries[0]?.country !== 'United States') {
  throw new Error(
    `src/engine/reference/jurisdictions.ts: expected exactly one Low row (United States), found ${lowEntries.length}: ${lowEntries.map((e) => e.country).join(', ')}`,
  );
}
