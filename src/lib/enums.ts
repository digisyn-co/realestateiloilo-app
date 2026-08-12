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

// ---------------------------------------------------------------------------
// Developer ecosystem (brief §5–28)
// ---------------------------------------------------------------------------

export const PROJECT_TYPES = ["CONDO", "SUBDIVISION", "TOWNHOUSE", "COMMERCIAL", "MIXED_USE", "OFFICE", "OTHER"] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];
export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  CONDO: "Condominium",
  SUBDIVISION: "Subdivision",
  TOWNHOUSE: "Townhouse",
  COMMERCIAL: "Commercial",
  MIXED_USE: "Mixed-use",
  OFFICE: "Office",
  OTHER: "Other",
};

export const PROJECT_STATUS = ["PRE_LAUNCH", "SELLING", "CONSTRUCTION", "NEAR_COMPLETION", "COMPLETED", "SOLD_OUT", "ARCHIVED"] as const;
export type ProjectStatus = (typeof PROJECT_STATUS)[number];
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  PRE_LAUNCH: "Pre-launch",
  SELLING: "Selling",
  CONSTRUCTION: "Construction",
  NEAR_COMPLETION: "Near completion",
  COMPLETED: "Completed",
  SOLD_OUT: "Sold out",
  ARCHIVED: "Archived",
};

export const VISIBILITY = ["PUBLIC", "AGENTS_ONLY", "PRIVATE"] as const;
export type Visibility = (typeof VISIBILITY)[number];
export const VISIBILITY_LABELS: Record<Visibility, string> = {
  PUBLIC: "Public",
  AGENTS_ONLY: "Agents only",
  PRIVATE: "Private",
};

export const DISTRIBUTION_MODES = ["ALL_AGENTS", "SELECTED_AGENCIES", "SELECTED_AGENTS", "INVITE_ONLY"] as const;
export type DistributionMode = (typeof DISTRIBUTION_MODES)[number];
export const DISTRIBUTION_LABELS: Record<DistributionMode, string> = {
  ALL_AGENTS: "All verified agents",
  SELECTED_AGENCIES: "Selected agencies",
  SELECTED_AGENTS: "Selected agents",
  INVITE_ONLY: "Invitation only",
};

export const UNIT_TYPES = ["STUDIO", "1BR", "2BR", "3BR", "LOFT", "PENTHOUSE", "TOWNHOUSE", "LOT", "COMMERCIAL", "OTHER"] as const;
export type UnitType = (typeof UNIT_TYPES)[number];

export const UNIT_STATUS = ["AVAILABLE", "RESERVED", "SOLD", "ON_HOLD", "UNAVAILABLE", "UNDER_CONTRACT"] as const;
export type UnitStatus = (typeof UNIT_STATUS)[number];
export const UNIT_STATUS_LABELS: Record<UnitStatus, string> = {
  AVAILABLE: "Available",
  RESERVED: "Reserved",
  SOLD: "Sold",
  ON_HOLD: "On hold",
  UNAVAILABLE: "Unavailable",
  UNDER_CONTRACT: "Under contract",
};

export const RESERVATION_STATUS = ["REQUESTED", "HELD", "RESERVED", "APPROVED", "REJECTED", "CANCELLED", "EXPIRED", "SOLD"] as const;
export type ReservationStatus = (typeof RESERVATION_STATUS)[number];

export const LEAD_OWNERSHIP = ["DEVELOPER", "AGENT", "SHARED"] as const;
export type LeadOwnership = (typeof LEAD_OWNERSHIP)[number];

export const PROJECT_LEAD_STATUS = ["NEW", "CONTACTED", "VIEWING", "RESERVED", "WON", "LOST"] as const;
export type ProjectLeadStatus = (typeof PROJECT_LEAD_STATUS)[number];

export const ACCESS_STATUS = ["REQUESTED", "APPROVED", "REJECTED", "REVOKED"] as const;
export type AccessStatus = (typeof ACCESS_STATUS)[number];

export const DOC_VISIBILITY = ["PUBLIC", "AGENT_ONLY"] as const;
export type DocVisibility = (typeof DOC_VISIBILITY)[number];

export const DEVELOPER_VERIFICATION = ["UNVERIFIED", "PENDING", "VERIFIED", "SUSPENDED"] as const;
export type DeveloperVerification = (typeof DEVELOPER_VERIFICATION)[number];

// Temporary reservation hold window (brief §21).
export const RESERVATION_HOLD_HOURS = 48;

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
  "AGENT_ACCESS_REQUEST",
  "AGENT_ACCESS_APPROVED",
  "RESERVATION_REQUEST",
  "RESERVATION_APPROVED",
  "RESERVATION_REJECTED",
  "NEW_PROJECT_LEAD",
  "DEVELOPER_VERIFIED",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
