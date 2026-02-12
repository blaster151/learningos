// Firestore Serialization Helpers
// Convert firebase-admin Timestamp objects to JSON-safe formats

import type { Timestamp } from "firebase-admin/firestore";

/**
 * Convert a Timestamp to ISO string, handling both firebase-admin and client Timestamps
 */
export function timestampToISO(ts: any): string | undefined {
  if (!ts) return undefined;
  if (typeof ts === "string") return ts;
  if (ts.toDate && typeof ts.toDate === "function") {
    return ts.toDate().toISOString();
  }
  if (ts._seconds !== undefined) {
    return new Date(ts._seconds * 1000 + (ts._nanoseconds || 0) / 1000000).toISOString();
  }
  return undefined;
}

/**
 * Recursively serialize an object, converting all Timestamps to ISO strings
 */
export function serializeDoc(doc: any): any {
  if (doc === null || doc === undefined) return doc;
  
  if (Array.isArray(doc)) {
    return doc.map(serializeDoc);
  }
  
  if (typeof doc === "object") {
    // Check if it's a Timestamp
    if (doc.toDate || doc._seconds !== undefined) {
      return timestampToISO(doc);
    }
    
    // Recursively serialize object properties
    const serialized: Record<string, any> = {};
    for (const [key, value] of Object.entries(doc)) {
      serialized[key] = serializeDoc(value);
    }
    return serialized;
  }
  
  return doc;
}
