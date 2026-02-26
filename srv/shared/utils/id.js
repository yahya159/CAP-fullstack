'use strict';
const crypto = require('node:crypto');
/**
 * id.js - pure stateless ID helpers.
 * No imports from other layers.
 */

/**
 * Generate a ticket code in the format TK-YYYY-XXXXXX
 * @param {number} year
 * @returns {string}
 */
const generateTicketCode = (year) =>
  `TK-${year}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

/**
 * Generate a simple unique ID (fallback when cuid is not available)
 */
const simpleId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

module.exports = { generateTicketCode, simpleId };
