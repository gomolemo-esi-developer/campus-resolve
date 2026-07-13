/**
 * Generates unique IDs for admin entities
 * Format: PREFIX-TIMESTAMP-RANDOM
 * Example: CAMP-1708612345-abc123def
 */

export function generateId(prefix: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 11);
    return `${prefix}-${timestamp}-${random}`;
}

export const ID_PREFIXES = {
    CAMPUS: "CAMP",
    FACULTY: "FAC",
    DEPARTMENT: "DEPT",
    COURSE: "COURSE",
    MODULE: "MOD",
    STAFF: "STAFF",
    ROLE: "ROLE",
    RESIDENCE: "RES",
    EXTRACURRICULAR: "EXTRA",
} as const;
