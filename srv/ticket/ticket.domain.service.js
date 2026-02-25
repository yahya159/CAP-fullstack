'use strict';
/**
 * ticket.domain.service.js – ALL business rules for Tickets.
 * NO direct DB calls; delegate to TicketRepo.
 * NO HTTP/CDS request handling; called by ticket.impl.js.
 */
const TicketRepo = require('./ticket.repo');
const { generateTicketCode } = require('../shared/utils/id');
const { nowIso } = require('../shared/utils/timestamp');

class TicketDomainService {
  constructor(_srv) {
    this.repo = new TicketRepo();
  }

  /**
   * beforeCreate – called by impl before CAP inserts the record.
   * Injects: ticketCode, createdAt, updatedAt, default status/effortHours/history.
   */
  async beforeCreate(req) {
    const data = req.data;

    // Guard required fields
    if (!data.projectId) req.error(400, 'projectId is required');
    if (!data.title)     req.error(400, 'title is required');
    if (!data.nature)    req.error(400, 'nature is required');

    // Auto-generate ticketCode: TK-YYYY-NNNN
    const year = new Date().getFullYear();
    const count = await this.repo.countForYear(year);
    data.ticketCode = generateTicketCode(year, count + 1);

    // Defaults
    data.status        = data.status       || 'NEW';
    data.effortHours   = data.effortHours  ?? 0;
    data.estimationHours = data.estimationHours ?? 0;
    data.createdAt     = data.createdAt    || nowIso();
    data.updatedAt     = nowIso();

    // Serialize JSON arrays
    data.history       = this._serializeArray(data.history ?? []);
    data.tags          = this._serializeArray(data.tags ?? []);
    data.documentationObjectIds = this._serializeArray(data.documentationObjectIds ?? []);
    data.skills        = this._serializeArray(data.skills ?? []);
  }

  /**
   * beforeUpdate – called by impl before CAP updates the record.
   * Injects updatedAt and re-serializes any JSON array fields.
   */
  async beforeUpdate(req) {
    const data = req.data;
    data.updatedAt = nowIso();

    // Re-serialize JSON arrays if they were provided as arrays
    if (Array.isArray(data.history)) {
      data.history = JSON.stringify(data.history);
    }
    if (Array.isArray(data.tags)) {
      data.tags = JSON.stringify(data.tags);
    }
    if (Array.isArray(data.documentationObjectIds)) {
      data.documentationObjectIds = JSON.stringify(data.documentationObjectIds);
    }
  }

  /**
   * afterRead – deserialize JSON array fields back into arrays.
   * Called after READ, CREATE, UPDATE to hydrate the response.
   */
  afterRead(data) {
    if (!data) return;
    const rows = Array.isArray(data) ? data : [data];
    for (const row of rows) {
      if (!row || typeof row !== 'object') continue;
      row.history                = this._deserializeArray(row.history);
      row.tags                   = this._deserializeArray(row.tags);
      row.documentationObjectIds = this._deserializeArray(row.documentationObjectIds);
    }
  }

  // ---- Private helpers ---------------------------------------------------

  _serializeArray(value) {
    if (Array.isArray(value)) return JSON.stringify(value);
    if (typeof value === 'string') return value; // already serialized
    return '[]';
  }

  _deserializeArray(value) {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.trim().startsWith('[')) {
      try { return JSON.parse(value); } catch { return []; }
    }
    return [];
  }
}

module.exports = TicketDomainService;
