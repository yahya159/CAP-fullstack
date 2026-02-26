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
const crypto = require('node:crypto');
const { nowIso } = require('./shared/utils/timestamp');

// Ticket domain handler – registered via require
const ticketImpl = require('./ticket/ticket.impl');

const DEMO_PASSWORD_BY_EMAIL = Object.freeze({
  'alice.admin@inetum.com': 'Admin#2026',
  'marc.manager@inetum.com': 'Manager#2026',
  'theo.tech@inetum.com': 'Tech#2026',
  'fatima.fonc@inetum.com': 'Func#2026',
  'pierre.pm@inetum.com': 'PM#2026',
  'diana.devco@inetum.com': 'DevCo#2026',
});

const extractEntityId = (req) => req.params?.[0]?.ID ?? req.params?.[0];

const safeEqual = (left, right) => {
  const leftBuffer = Buffer.from(String(left ?? ''), 'utf8');
  const rightBuffer = Buffer.from(String(right ?? ''), 'utf8');
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

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
  // AUTHENTICATION ACTION
  // =========================================================================

  // POST /authenticate { email, password }
  srv.on('authenticate', async (req) => {
    const email = String(req.data?.email ?? '').trim().toLowerCase();
    const password = String(req.data?.password ?? '');

    if (!email || !password) {
      req.reject(401, 'Invalid credentials');
      return;
    }

    const expectedPassword = DEMO_PASSWORD_BY_EMAIL[email];
    if (!expectedPassword || !safeEqual(password, expectedPassword)) {
      req.reject(401, 'Invalid credentials');
      return;
    }

    const { Users } = srv.entities;
    const activeUsers = await cds.db.run(SELECT.from(Users).where({ active: true }));
    const user = activeUsers.find((candidate) => String(candidate.email ?? '').toLowerCase() === email);
    if (!user) {
      req.reject(401, 'Invalid credentials');
      return;
    }

    return user;
  });

  // =========================================================================
  // STATE-MACHINE: allowed transitions
  // =========================================================================

  /** Allowed validationStatus transitions for Imputations */
  const IMPUTATION_TRANSITIONS = {
    validate: { from: ['DRAFT', 'SUBMITTED', 'REJECTED'], to: 'VALIDATED' },
    reject:   { from: ['DRAFT', 'SUBMITTED'],              to: 'REJECTED' },
  };

  /** Allowed status transitions for ImputationPeriods */
  const PERIOD_TRANSITIONS = {
    submit:   { from: ['DRAFT', 'REJECTED'],              to: 'SUBMITTED' },
    validate: { from: ['SUBMITTED'],                       to: 'VALIDATED' },
    reject:   { from: ['SUBMITTED'],                       to: 'REJECTED' },
  };

  // =========================================================================
  // SHARED ACTION HELPER – reduces per-action boilerplate
  // =========================================================================

  /**
   * Generic bound-action handler:
   *   1. Extract entity ID
   *   2. Fetch current record (fail 404 if missing)
   *   3. Optionally validate state-machine transition
   *   4. Apply changes and re-read
   */
  const registerBoundAction = ({
    action,
    entitySetName,
    statusField,
    transitions,
    buildChanges,
  }) => {
    srv.on(action, entitySetName, async (req) => {
      const EntitySet = srv.entities[entitySetName];
      const id = extractEntityId(req);
      if (!id) return req.reject(400, `Missing ${entitySetName} ID`);

      // Fetch current record
      const current = await cds.db.run(SELECT.one(EntitySet).where({ ID: id }));
      if (!current) return req.error(404, `${entitySetName} '${id}' not found`);

      // State-machine guard
      if (transitions) {
        const rule = transitions[action];
        if (rule) {
          const currentStatus = current[statusField];
          if (!rule.from.includes(currentStatus)) {
            return req.reject(
              409,
              `Cannot ${action} ${entitySetName} '${id}': current ${statusField} is '${currentStatus}', expected one of [${rule.from.join(', ')}]`
            );
          }
        }
      }

      const changes = buildChanges(req, current);
      await cds.db.run(UPDATE(EntitySet).where({ ID: id }).with(changes));
      return cds.db.run(SELECT.one(EntitySet).where({ ID: id }));
    });
  };

  // =========================================================================
  // IMPUTATION ACTIONS
  // =========================================================================

  registerBoundAction({
    action: 'validate',
    entitySetName: 'Imputations',
    statusField: 'validationStatus',
    transitions: IMPUTATION_TRANSITIONS,
    buildChanges: (req) => ({
      validationStatus: 'VALIDATED',
      validatedBy: req.data?.validatedBy || null,
      validatedAt: nowIso(),
    }),
  });

  registerBoundAction({
    action: 'reject',
    entitySetName: 'Imputations',
    statusField: 'validationStatus',
    transitions: IMPUTATION_TRANSITIONS,
    buildChanges: (req) => ({
      validationStatus: 'REJECTED',
      validatedBy: req.data?.validatedBy || null,
      validatedAt: nowIso(),
    }),
  });

  // =========================================================================
  // IMPUTATION PERIOD ACTIONS
  // =========================================================================

  registerBoundAction({
    action: 'submit',
    entitySetName: 'ImputationPeriods',
    statusField: 'status',
    transitions: PERIOD_TRANSITIONS,
    buildChanges: () => ({ status: 'SUBMITTED', submittedAt: nowIso() }),
  });

  registerBoundAction({
    action: 'validate',
    entitySetName: 'ImputationPeriods',
    statusField: 'status',
    transitions: PERIOD_TRANSITIONS,
    buildChanges: (req) => ({
      status: 'VALIDATED',
      validatedBy: req.data?.validatedBy,
      validatedAt: nowIso(),
    }),
  });

  registerBoundAction({
    action: 'reject',
    entitySetName: 'ImputationPeriods',
    statusField: 'status',
    transitions: PERIOD_TRANSITIONS,
    buildChanges: (req) => ({
      status: 'REJECTED',
      validatedBy: req.data?.validatedBy,
      validatedAt: nowIso(),
    }),
  });

  registerBoundAction({
    action: 'sendToStraTIME',
    entitySetName: 'ImputationPeriods',
    statusField: 'status',
    transitions: null, // no state-machine guard — can send anytime
    buildChanges: (req) => ({
      sentToStraTIME: true,
      sentBy: req.data?.sentBy,
      sentAt: nowIso(),
    }),
  });

  // =========================================================================
  // TIME LOG ACTIONS
  // =========================================================================

  registerBoundAction({
    action: 'sendToStraTIME',
    entitySetName: 'TimeLogs',
    statusField: null,
    transitions: null,
    buildChanges: () => ({ sentToStraTIME: true, sentAt: nowIso() }),
  });
};
