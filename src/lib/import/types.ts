// Shared shapes for the import pipeline (brief §13–21).

import { ImageRights, ListingType, PropertyType } from "../enums";

/** A listing as it arrives from an external source, before normalisation. */
export type RawListing = {
  sourceListingId?: string;
  sourceUrl?: string;
  title?: string;
  description?: string;
  price?: number | string;
  currency?: string;
  listingType?: string;
  propertyType?: string;
  address?: string;
  barangay?: string;
  city?: string;
  province?: string;
  latitude?: number | string;
  longitude?: number | string;
  bedrooms?: number | string;
  bathrooms?: number | string;
  floorArea?: number | string;
  lotArea?: number | string;
  parking?: number | string;
  images?: { url: string; rights?: ImageRights }[];
  contactPhone?: string;
  contactName?: string;
  [key: string]: unknown;
};

/** A cleaned, typed listing ready for dedup + review. */
export type NormalizedListing = {
  sourceListingId?: string;
  sourceUrl?: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  listingType: ListingType;
  propertyType: PropertyType;
  address?: string;
  barangay?: string;
  city: string;
  province: string;
  latitude?: number;
  longitude?: number;
  bedrooms?: number;
  bathrooms?: number;
  floorArea?: number;
  lotArea?: number;
  parking?: number;
  images: { url: string; rights: ImageRights }[];
  contactPhone?: string;
  contactName?: string;
  warnings: string[]; // fields we could not confidently normalise
};

export type FetchResult = {
  ok: boolean;
  records: RawListing[];
  error?: string;
  attribution?: string;
};

/** The interface every ingestion source implements (brief §19). */
export interface MarketplaceAdapter {
  readonly key: string; // matches ImportAdapter enum
  readonly label: string;
  /** True only when this source is legally/technically authorised to ingest. */
  isAuthorised(config: AdapterConfig): boolean;
  /** Pull raw records. Must only retrieve data the user is authorised to import. */
  fetch(config: AdapterConfig): Promise<FetchResult>;
}

export type AdapterConfig = {
  authorised?: boolean;
  attribution?: string;
  // adapter-specific:
  feedUrl?: string;
  url?: string; // manual single URL
  csv?: string; // raw CSV text
  json?: string; // raw JSON text
  xml?: string; // raw XML text
  records?: RawListing[]; // pre-parsed (mock/tests)
  [key: string]: unknown;
};
