// Canonical enum values. Stored as strings in SQLite; validated in the app layer.

export const ROLES = ["VISITOR", "BUYER", "OWNER", "AGENT", "BROKER", "DEVELOPER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const PROPERTY_TYPES = [
  "HOUSE",
  "CONDO",
  "APARTMENT",
  "TOWNHOUSE",
  "LOT",
  "COMMERCIAL",
  "OFFICE",
  "WAREHOUSE",
  "FARM",
  "RESORT",
  "INDUSTRIAL",
  "BUILDING",
  "OTHER",
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  HOUSE: "House",
  CONDO: "Condo",
  APARTMENT: "Apartment",
  TOWNHOUSE: "Townhouse",
  LOT: "Lot",
  COMMERCIAL: "Commercial",
  OFFICE: "Office",
  WAREHOUSE: "Warehouse",
  FARM: "Farm / Land",
  RESORT: "Resort",
  INDUSTRIAL: "Industrial",
  BUILDING: "Building",
  OTHER: "Other",
};

export const LISTING_TYPES = ["SALE", "RENT"] as const;
export type ListingType = (typeof LISTING_TYPES)[number];

export const FURNISHING = ["UNFURNISHED", "SEMI_FURNISHED", "FURNISHED"] as const;
export type Furnishing = (typeof FURNISHING)[number];
export const FURNISHING_LABELS: Record<Furnishing, string> = {
  UNFURNISHED: "Unfurnished",
  SEMI_FURNISHED: "Semi-furnished",
  FURNISHED: "Furnished",
};

export const LISTING_STATUS = [
  "DRAFT",
  "PENDING_REVIEW",
  "ACTIVE",
  "RESERVED",
  "SOLD",
  "RENTED",
  "EXPIRED",
  "REJECTED",
  "ARCHIVED",
] as const;
export type ListingStatus = (typeof LISTING_STATUS)[number];

export const VERIFICATION_STATUS = ["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUS)[number];

// Import record lifecycle (brief §14)
export const IMPORT_RECORD_STATUS = [
  "PENDING",
  "PROCESSING",
  "NEEDS_REVIEW",
  "DUPLICATE",
  "APPROVED",
  "REJECTED",
  "PUBLISHED",
  "ARCHIVED",
  "SOURCE_UNAVAILABLE",
] as const;
export type ImportRecordStatus = (typeof IMPORT_RECORD_STATUS)[number];

export const IMPORT_ADAPTERS = ["META", "BROKER_FEED", "CSV", "JSON", "XML", "MANUAL_URL"] as const;
export type ImportAdapter = (typeof IMPORT_ADAPTERS)[number];

export const IMAGE_RIGHTS = ["OWNED", "AUTHORISED", "PENDING_PERMISSION", "EXTERNAL_REF"] as const;
export type ImageRights = (typeof IMAGE_RIGHTS)[number];

// Listing freshness states (brief §16)
export const FRESHNESS = ["FRESH", "RECENTLY_UPDATED", "NEEDS_VERIFICATION", "POSSIBLY_STALE", "EXPIRED"] as const;
export type Freshness = (typeof FRESHNESS)[number];

export const LEAD_STAGES = ["NEW", "CONTACTED", "VIEWING", "OFFER", "WON", "LOST"] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

export const REPORT_REASONS = ["SCAM", "DUPLICATE", "WRONG_INFO", "SOLD", "OFFENSIVE", "OTHER"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const NOTIFICATION_TYPES = [
  "INQUIRY",
  "LISTING_APPROVED",
  "LISTING_REJECTED",
  "LISTING_EXPIRING",
  "DUPLICATE_DETECTED",
  "IMPORT_COMPLETED",
  "IMPORT_FAILED",
  "STATUS_CHANGED",
  "VIEWING",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
