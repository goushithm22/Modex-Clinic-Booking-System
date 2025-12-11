"use strict";
/**
 * @file uuid.ts
 * @description Utility for generating UUIDs using Node's crypto module.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUuid = generateUuid;
const crypto_1 = require("crypto");
/**
 * Generates a new UUID string.
 *
 * @returns {string} Newly generated UUID.
 */
function generateUuid() {
    return (0, crypto_1.randomUUID)();
}
