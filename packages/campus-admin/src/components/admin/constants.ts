/**
 * Centralized enum data and options for admin pages
 * Single source of truth for dropdowns, selections, and constants
 */

export const TITLES = ["Mr.", "Mrs.", "Ms.", "Dr.", "Prof.", "Rev.", "Hon.", "Sir", "Dame"];

export const LEVELS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export const RESIDENCE_TYPES = [
  "On-Campus",
  "Off-Campus",
  "Male",
  "Female",
  "Mixed",
  "Postgraduate",
];

export const ACCESS_SCOPES = [
  "Global",
  "Campus",
  "Faculty",
  "Department",
  "Residence",
];

// Database values map to display names
// Single source of truth for qualification type mapping
export const QUALIFICATION_TYPES_MAP: Record<string, string> = {
  HCert: "Higher Certificate",
  Dip: "Diploma",
  ND: "National Diploma",
  ExP: "Extended Programme",
  B: "Bachelor's Degree",
  BH: "Honours Degree",
  M: "Master's Degree",
  D: "Doctorate",
  PG: "Post Graduate",
  Hon: "Honours Degree",
  BT: "Bachelor's Degree", // Bachelor of Technology grouped under B
  MT: "Master's Degree", // Master of Technology grouped under M
  PhD: "Doctorate", // PhD grouped under D
};

// For frontend display, map qualification_type to abbreviated tab label
export const QUALIFICATION_ABBREVIATIONS: Record<string, string> = {
  HCert: "HCert",
  Dip: "Dip",
  ND: "ND",
  ExP: "ExP",
  B: "B",
  BH: "Hon",
  M: "M",
  D: "D",
  PG: "PG",
  Hon: "Hon",
  BT: "B",
  MT: "M",
  PhD: "D",
};

// Get display name from database abbreviation
export const getQualificationDisplayName = (dbValue: string): string => {
  return QUALIFICATION_TYPES_MAP[dbValue] || dbValue;
};

// Get tab abbreviation from database value
export const getQualificationTabLabel = (dbValue: string): string => {
  return QUALIFICATION_ABBREVIATIONS[dbValue] || dbValue;
};

// Legacy type for backward compatibility
export const QUALIFICATION_TYPES = {
  HCert: "Higher Certificate",
  Dip: "Diploma",
  ND: "National Diploma",
  ExP: "Extended Programme",
  B: "Bachelor's Degree",
  BH: "Honours Degree",
  M: "Master's Degree",
  D: "Doctorate",
  PG: "Post Graduate",
  Hon: "Honours Degree",
};

export type QualificationType = keyof typeof QUALIFICATION_TYPES;

export const QUALIFICATION_TYPES_LIST = Object.keys(
  QUALIFICATION_TYPES
) as QualificationType[];

export const ACTIVITY_CATEGORIES = [
  "Sports",
  "Indigenous Activities",
  "Religious",
  "Social Justice",
  "Student Governance",
];

/**
 * Validation rules and patterns
 */
export const VALIDATION = {
  ABBREVIATION_MIN: 3,
  ABBREVIATION_MAX: 10,
  INITIALS_MIN: 1,
  INITIALS_MAX: 3,
};

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  ABBREVIATION_LENGTH: `Abbreviation must be ${VALIDATION.ABBREVIATION_MIN}-${VALIDATION.ABBREVIATION_MAX} characters`,
  INITIALS_LENGTH: `Initials must be ${VALIDATION.INITIALS_MIN}-${VALIDATION.INITIALS_MAX} characters`,
  FIELD_REQUIRED: "This field is required",
  MUST_BE_UNIQUE: "This value must be unique",
};
