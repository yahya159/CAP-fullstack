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

  /** Check whether a ticket code already exists */
  async existsByTicketCode(ticketCode) {
    const { Tickets } = this;
    const existing = await cds.db.run(
      SELECT.one(Tickets)
        .columns('ID')
        .where({ ticketCode })
    );
    return Boolean(existing);
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
