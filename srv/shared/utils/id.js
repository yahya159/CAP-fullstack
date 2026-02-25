'use strict';
/**
 * id.js – pure stateless ID helpers.
 * No imports from other layers.
 */

/**
 * Generate a ticket code in the format TK-YYYY-NNNN
 * @param {number} year
 * @param {number} seq – 1-based sequence number for this year
 * @returns {string}
 */
const generateTicketCode = (year, seq) =>
  `TK-${year}-${String(seq).padStart(4, '0')}`;

/**
 * Generate a simple unique ID (fallback when cuid is not available)
 */
const simpleId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

module.exports = { generateTicketCode, simpleId };
