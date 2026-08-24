// TAD §C.4, §D.2.4 — engine-internal reference table. Import-restricted:
// nothing outside src/engine/ may import it (§L.3, TAD-2).
//
// Unlike the 177-row jurisdiction table (§D.1.1b), no generate-industries.ts
// is listed anywhere in TAD §D.1 — the NAICS list lives directly inside the
// canonical Methodology document at §3.1 as 48 short rows, not in a
// separate ingestible source file the way the Basel table does. Engineer
// decision (within remit, TAD §D.2.4's "as D.2.3" note): transcribe this
// table by hand as a frozen, provenance-stamped data module, the same
// discipline generate-declarations.ts and generate-jurisdictions.ts apply
// to their own sources — the source document is canonical, this file is
// never hand-edited against anything except that source, and a content
// change is a Methodology edit followed by a re-transcription. If this
// table ever grows past a size a human can transcribe reliably, that is a
// flag to the Coordinator for a dedicated generator, not a silent
// continuation of hand transcription.

export const SOURCE = 'Customer Risk Rating Methodology';
export const EDITION = 'v2.3';
export const ACCESSED = '2026-08-21';

interface IndustryEntry {
  readonly naics: string;
  readonly description: string;
}

// §3.1 High — 5 points. Businesses whose model is itself financial
// intermediation, or whose stock in trade is a high-value, readily
// transferable store of value.
const HIGH: readonly IndustryEntry[] = [
  { naics: '522390', description: 'Other Activities Related to Credit Intermediation' },
  { naics: '522320', description: 'Financial Transactions Processing, Reserve, and Clearinghouse Activities' },
  { naics: '522291', description: 'Consumer Lending' },
  { naics: '522299', description: 'International, Secondary Market, and All Other Non-depository Credit Intermediation' },
  { naics: '523160', description: 'Commodity Contracts Intermediation' },
  { naics: '713210', description: 'Casinos (except Casino Hotels)' },
  { naics: '423940', description: 'Jewelry, Watch, Precious Stone, and Precious Metal Merchant Wholesalers' },
  { naics: '458310', description: 'Jewelry Retailers' },
  { naics: '459510', description: 'Used Merchandise Retailers' },
  { naics: '813219', description: 'Other Grantmaking and Giving Services' },
];

// §3.1 Medium — 3 points. Businesses carrying a structural cash-handling
// exposure, or dealing in titled goods of significant value.
const MEDIUM: readonly IndustryEntry[] = [
  { naics: '445131', description: 'Convenience Retailers' },
  { naics: '445132', description: 'Vending Machine Operators' },
  { naics: '445320', description: 'Beer, Wine, and Liquor Retailers' },
  { naics: '457110', description: 'Gasoline Stations with Convenience Stores' },
  { naics: '722511', description: 'Full-Service Restaurants' },
  { naics: '722513', description: 'Limited-Service Restaurants' },
  { naics: '722514', description: 'Cafeterias, Grill Buffets, and Buffets' },
  { naics: '812930', description: 'Parking Lots and Garages' },
  { naics: '424940', description: 'Tobacco Product and Electronic Cigarette Merchant Wholesalers' },
  { naics: '456110', description: 'Pharmacies and Drug Retailers' },
  { naics: '441110', description: 'New Car Dealers' },
  { naics: '441120', description: 'Used Car Dealers' },
  { naics: '441210', description: 'Recreational Vehicle Dealers' },
  { naics: '441222', description: 'Boat Dealers' },
  { naics: '441227', description: 'Motorcycle, ATV, and All Other Motor Vehicle Dealers' },
  { naics: '441330', description: 'Automotive Parts and Accessories Retailers' },
  { naics: '444230', description: 'Outdoor Power Equipment Retailers' },
  { naics: '811111', description: 'General Automotive Repair' },
  { naics: '811114', description: 'Specialized Automotive Repair' },
  { naics: '811121', description: 'Automotive Body, Paint, and Interior Repair and Maintenance' },
  { naics: '561510', description: 'Travel Agencies' },
];

// §3.1 Low — 1 point. General merchandise and specialty retail, considered
// and tiered to the baseline rather than omitted.
const LOW: readonly IndustryEntry[] = [
  { naics: '444110', description: 'Home Centers' },
  { naics: '444120', description: 'Paint and Wallpaper Retailers' },
  { naics: '444240', description: 'Nursery, Garden Center, and Farm Supply Retailers' },
  { naics: '449110', description: 'Furniture Retailers' },
  { naics: '449121', description: 'Floor Covering Retailers' },
  { naics: '449129', description: 'All Other Home Furnishings Retailers' },
  { naics: '449210', description: 'Electronics and Appliance Retailers' },
  { naics: '455110', description: 'Department Stores' },
  { naics: '458110', description: 'Clothing and Clothing Accessories Retailers' },
  { naics: '458210', description: 'Shoe Retailers' },
  { naics: '459110', description: 'Sporting Goods Retailers' },
  { naics: '459120', description: 'Hobby, Toy, and Game Retailers' },
  { naics: '459130', description: 'Sewing, Needlework, and Piece Goods Retailers' },
  { naics: '459140', description: 'Musical Instrument and Supplies Retailers' },
  { naics: '459210', description: 'Book Retailers and News Dealers' },
  { naics: '459310', description: 'Florists' },
  { naics: '459410', description: 'Office Supplies and Stationery Retailers' },
  { naics: '459420', description: 'Gift, Novelty, and Souvenir Retailers' },
  { naics: '459999', description: 'All Other Miscellaneous Retailers' },
];

const BY_NAICS = new Map<string, { band: 1 | 3 | 5; description: string }>();
for (const e of HIGH) BY_NAICS.set(e.naics, { band: 5, description: e.description });
for (const e of MEDIUM) BY_NAICS.set(e.naics, { band: 3, description: e.description });
for (const e of LOW) BY_NAICS.set(e.naics, { band: 1, description: e.description });

/**
 * §3.1: "A business type not listed below is Low unless the institution's
 * periodic review adds it." A NAICS code absent from all three tiers is
 * Low (1) per that rule — also reported by the fixture generator (§D.2.4)
 * so an unintended code is visible rather than silently defaulted.
 */
export function industryBand(naics: string | null): 1 | 3 | 5 {
  if (naics === null) return 1; // §3: Individuals scored at the baseline, not excluded.
  return BY_NAICS.get(naics)?.band ?? 1;
}

/** The plain-English description the record table displays before the code in parentheses (DD §5). */
export function industryDescription(naics: string | null): string {
  if (naics === null) return 'Individual';
  return BY_NAICS.get(naics)?.description ?? 'Unclassified';
}

/** True when a code was not found in any tier — surfaced by the generator, never by the UI. */
export function isUnlistedNaics(naics: string | null): boolean {
  return naics !== null && !BY_NAICS.has(naics);
}
