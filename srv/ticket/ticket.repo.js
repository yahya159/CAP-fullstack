'use strict';
/**
 * ticket.repo.js – ALL DB operations for Tickets.
 * NO business rules here. Only SELECT / INSERT / UPDATE / DELETE.
 */
const cds = require('@sap/cds');

class TicketRepo {
  get db() {
    return cds.db;
  }

  get Tickets() {
    return cds.db.entities['sap.performance.dashboard.db.Tickets'];
  }

  /** Count tickets for a given project (used for ticketCode generation) */
  async countForYear(year) {
    const result = await cds.db.run(
      `SELECT COUNT(*) as cnt FROM sap_performance_dashboard_db_Tickets
       WHERE ticketCode LIKE 'TK-${year}-%'`
    );
    return Number(result?.[0]?.cnt ?? 0);
  }

  /** Fetch a ticket by ID */
  async findById(id) {
    const { Tickets } = this;
    return cds.db.run(SELECT.one(Tickets).where({ ID: id }));
  }

  /** Persist a new ticket */
  async insert(data) {
    const { Tickets } = this;
    await cds.db.run(INSERT.into(Tickets).entries(data));
    return cds.db.run(SELECT.one(Tickets).where({ ID: data.ID }));
  }

  /** Update ticket fields */
  async update(id, changes) {
    const { Tickets } = this;
    await cds.db.run(UPDATE(Tickets).where({ ID: id }).with(changes));
    return cds.db.run(SELECT.one(Tickets).where({ ID: id }));
  }
}

module.exports = TicketRepo;
