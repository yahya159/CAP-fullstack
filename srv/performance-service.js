'use strict';
/**
 * performance-service.js
 *
 * Top-level handler module loaded by CAP when it finds a .cds with the same name.
 * Responsibilities:
 *   1. Load ticket-domain handlers (via ticket.impl.js)
 *   2. Register action handlers for Imputations, ImputationPeriods, TimeLogs
 *   3. Register after-READ handlers to deserialize LargeString JSON fields on
 *      all other entity sets that use JSON array storage.
 *
 * No CSRF. No business logic (business logic lives in domain services).
 */

const cds = require('@sap/cds');
const { nowIso } = require('./shared/utils/timestamp');

// Ticket domain handler – registered via require
const ticketImpl = require('./ticket/ticket.impl');

module.exports = (srv) => {
  // ---- Register Ticket domain handlers -----------------------------------
  ticketImpl(srv);

  // ---- JSON deserialization for non-ticket entities ----------------------
  const JSON_ARRAY_ENTITIES = [
    { name: 'Users',               fields: ['skills', 'certifications'] },
    { name: 'Projects',            fields: ['techKeywords'] },
    { name: 'Abaques',             fields: ['entries'] },
    { name: 'DocumentationObjects',fields: ['attachedFiles', 'relatedTicketIds'] },
    { name: 'Evaluations',         fields: ['qualitativeGrid'] },
  ];

  JSON_ARRAY_ENTITIES.forEach(({ name, fields }) => {
    srv.after(['READ', 'CREATE', 'UPDATE'], name, (data) => {
      const rows = Array.isArray(data) ? data : (data ? [data] : []);
      rows.forEach((row) => {
        if (!row) return;
        fields.forEach((field) => {
          const val = row[field];
          if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
            try { row[field] = JSON.parse(val); } catch { /* leave as-is */ }
          }
        });
      });
    });
  });

  // ---- Serialize JSON arrays on CREATE/UPDATE for non-ticket entities ----
  const JSON_WRITE_ENTITIES = [
    { name: 'Users',               fields: ['skills', 'certifications'] },
    { name: 'Projects',            fields: ['techKeywords'] },
    { name: 'Abaques',             fields: ['entries'] },
    { name: 'DocumentationObjects',fields: ['attachedFiles', 'relatedTicketIds'] },
    { name: 'Evaluations',         fields: ['qualitativeGrid'] },
  ];

  JSON_WRITE_ENTITIES.forEach(({ name, fields }) => {
    srv.before(['CREATE', 'UPDATE'], name, (req) => {
      fields.forEach((field) => {
        if (Array.isArray(req.data[field]) || (req.data[field] && typeof req.data[field] === 'object')) {
          req.data[field] = JSON.stringify(req.data[field]);
        }
      });
    });
  });

  // ---- Default createdAt on entities without `managed` timestamp ---------
  const NEEDS_CREATEDAT = ['Notifications', 'Evaluations', 'Deliverables', 'LeaveRequests',
    'Imputations', 'ImputationPeriods', 'TimeLogs', 'Timesheets'];

  NEEDS_CREATEDAT.forEach((name) => {
    srv.before('CREATE', name, (req) => {
      if (!req.data.createdAt) req.data.createdAt = nowIso();
    });
  });

  // =========================================================================
  // IMPUTATION ACTIONS
  // =========================================================================

  // POST /Imputations('<id>')/validate   { validatedBy }
  srv.on('validate', 'Imputations', async (req) => {
    const { Imputations } = srv.entities;
    const id = req.params[0]?.ID ?? req.params[0];
    const validatedBy = req.data?.validatedBy;

    const changes = {
      validationStatus: 'VALIDATED',
      validatedBy: validatedBy || null,
      validatedAt: nowIso(),
    };
    await cds.db.run(UPDATE(Imputations).where({ ID: id }).with(changes));
    const result = await cds.db.run(SELECT.one(Imputations).where({ ID: id }));
    if (!result) req.error(404, `Imputation '${id}' not found`);
    return result;
  });

  // POST /Imputations('<id>')/reject   { validatedBy }
  srv.on('reject', 'Imputations', async (req) => {
    const { Imputations } = srv.entities;
    const id = req.params[0]?.ID ?? req.params[0];
    const validatedBy = req.data?.validatedBy;

    const changes = {
      validationStatus: 'REJECTED',
      validatedBy: validatedBy || null,
      validatedAt: nowIso(),
    };
    await cds.db.run(UPDATE(Imputations).where({ ID: id }).with(changes));
    const result = await cds.db.run(SELECT.one(Imputations).where({ ID: id }));
    if (!result) req.error(404, `Imputations '${id}' not found`);
    return result;
  });

  // =========================================================================
  // IMPUTATION PERIOD ACTIONS
  // =========================================================================

  // POST /ImputationPeriods('<id>')/submit
  srv.on('submit', 'ImputationPeriods', async (req) => {
    const { ImputationPeriods } = srv.entities;
    const id = req.params[0]?.ID ?? req.params[0];
    const changes = { status: 'SUBMITTED', submittedAt: nowIso() };
    await cds.db.run(UPDATE(ImputationPeriods).where({ ID: id }).with(changes));
    const result = await cds.db.run(SELECT.one(ImputationPeriods).where({ ID: id }));
    if (!result) req.error(404, `ImputationPeriod '${id}' not found`);
    return result;
  });

  // POST /ImputationPeriods('<id>')/validate   { validatedBy }
  srv.on('validate', 'ImputationPeriods', async (req) => {
    const { ImputationPeriods } = srv.entities;
    const id = req.params[0]?.ID ?? req.params[0];
    const validatedBy = req.data?.validatedBy;
    const changes = { status: 'VALIDATED', validatedBy, validatedAt: nowIso() };
    await cds.db.run(UPDATE(ImputationPeriods).where({ ID: id }).with(changes));
    const result = await cds.db.run(SELECT.one(ImputationPeriods).where({ ID: id }));
    if (!result) req.error(404, `ImputationPeriod '${id}' not found`);
    return result;
  });

  // POST /ImputationPeriods('<id>')/reject   { validatedBy }
  srv.on('reject', 'ImputationPeriods', async (req) => {
    const { ImputationPeriods } = srv.entities;
    const id = req.params[0]?.ID ?? req.params[0];
    const validatedBy = req.data?.validatedBy;
    const changes = { status: 'REJECTED', validatedBy, validatedAt: nowIso() };
    await cds.db.run(UPDATE(ImputationPeriods).where({ ID: id }).with(changes));
    const result = await cds.db.run(SELECT.one(ImputationPeriods).where({ ID: id }));
    if (!result) req.error(404, `ImputationPeriod '${id}' not found`);
    return result;
  });

  // POST /ImputationPeriods('<id>')/sendToStraTIME   { sentBy }
  srv.on('sendToStraTIME', 'ImputationPeriods', async (req) => {
    const { ImputationPeriods } = srv.entities;
    const id = req.params[0]?.ID ?? req.params[0];
    const sentBy = req.data?.sentBy;
    const changes = { sentToStraTIME: true, sentBy, sentAt: nowIso() };
    await cds.db.run(UPDATE(ImputationPeriods).where({ ID: id }).with(changes));
    const result = await cds.db.run(SELECT.one(ImputationPeriods).where({ ID: id }));
    if (!result) req.error(404, `ImputationPeriod '${id}' not found`);
    return result;
  });

  // =========================================================================
  // TIME LOG ACTIONS
  // =========================================================================

  // POST /TimeLogs('<id>')/sendToStraTIME
  srv.on('sendToStraTIME', 'TimeLogs', async (req) => {
    const { TimeLogs } = srv.entities;
    const id = req.params[0]?.ID ?? req.params[0];
    const changes = { sentToStraTIME: true, sentAt: nowIso() };
    await cds.db.run(UPDATE(TimeLogs).where({ ID: id }).with(changes));
    const result = await cds.db.run(SELECT.one(TimeLogs).where({ ID: id }));
    if (!result) req.error(404, `TimeLog '${id}' not found`);
    return result;
  });
};
