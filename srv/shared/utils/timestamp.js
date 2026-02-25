'use strict';
/**
 * timestamp.js – pure stateless timestamp helpers.
 */

/**
 * Return the current moment as an ISO 8601 string.
 * @returns {string}
 */
const nowIso = () => new Date().toISOString();

module.exports = { nowIso };
