'use strict';
/**
 * ticket.impl.js – thin handler registration only.
 * Delegates ALL logic to ticket.domain.service.js.
 * Keep this file < 40 lines.
 */
const TicketDomainService = require('./ticket.domain.service');

module.exports = (srv) => {
  const domain = new TicketDomainService(srv);

  // Delegate CREATE to domain service
  srv.before('CREATE', 'Tickets', (req) => domain.beforeCreate(req));

  // Delegate UPDATE to domain service
  srv.before('UPDATE', 'Tickets', (req) => domain.beforeUpdate(req));

  // Default READ/LIST is handled by CAP generic provider (SQLite)
  // Custom projection of LargeString JSON fields on READ
  srv.after(['READ', 'CREATE', 'UPDATE'], 'Tickets', (data) => domain.afterRead(data));
};
