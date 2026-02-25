using { sap.performance.dashboard.db as db } from '../db/schema';

/**
 * Unified Performance Service – all entity sets exposed on one path.
 * Path matches the frontend: VITE_ODATA_BASE_URL = /odata/v4/performance
 *
 * Bound actions are registered in JS handlers (performance-service.js).
 * CAP auto-discovers this file and loads performance-service.js by convention.
 */
@path: '/odata/v4/performance'
service PerformanceService {

  // ---- Ticket domain -------------------------------------------------------
  entity Tickets             as projection on db.Tickets;

  // ---- User & Project stubs ------------------------------------------------
  entity Users               as projection on db.Users;
  entity Projects            as projection on db.Projects;

  // ---- Other entity stubs --------------------------------------------------
  entity Tasks               as projection on db.Tasks;
  entity Timesheets          as projection on db.Timesheets;
  entity Evaluations         as projection on db.Evaluations;
  entity Deliverables        as projection on db.Deliverables;
  entity Allocations         as projection on db.Allocations;
  entity LeaveRequests       as projection on db.LeaveRequests;

  // ---- Imputation domain ---------------------------------------------------
  entity Imputations         as projection on db.Imputations;
  entity ImputationPeriods   as projection on db.ImputationPeriods;
  entity TimeLogs            as projection on db.TimeLogs;

  // ---- Reference / Knowledge -----------------------------------------------
  entity Abaques             as projection on db.Abaques;
  entity DocumentationObjects as projection on db.DocumentationObjects;
  entity Notifications       as projection on db.Notifications;
  entity ReferenceData       as projection on db.ReferenceData;

  // ---- Bound actions on Imputations ----------------------------------------
  // POST /Imputations('<id>')/validate  { validatedBy }
  action validate(validatedBy: String) returns Imputations;
  // POST /Imputations('<id>')/reject    { validatedBy }
  action reject(validatedBy: String)   returns Imputations;

  // ---- Bound actions on ImputationPeriods ----------------------------------
  // POST /ImputationPeriods('<id>')/submit
  // POST /ImputationPeriods('<id>')/validate   { validatedBy }
  // POST /ImputationPeriods('<id>')/reject      { validatedBy }
  // POST /ImputationPeriods('<id>')/sendToStraTIME { sentBy }
  // (Registered via srv.on() in performance-service.js)

  // ---- Bound actions on TimeLogs ------------------------------------------
  // POST /TimeLogs('<id>')/sendToStraTIME
  // (Registered via srv.on() in performance-service.js)
}
