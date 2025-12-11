/**
 * @file uuid.ts
 * @description Utility for generating UUIDs using Node's crypto module.
 */

import { randomUUID } from "crypto";

/**
 * Generates a new UUID string.
 *
 * @returns {string} Newly generated UUID.
 */
export function generateUuid(): string {
  return randomUUID();
}
