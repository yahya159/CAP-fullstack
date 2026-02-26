using { sap.performance.dashboard.db as db } from '../db/schema';

/**
 * Unified Performance Service – all entity sets exposed on one path.
 * Path matches the frontend: VITE_ODATA_BASE_URL = /odata/v4/performance
 *
 * Bound actions are registered in JS handlers (performance-service.js).
 * CAP auto-discovers this file and loads performance-service.js by convention.
 */
@path: '/odata/v4/performance'
@requires: 'authenticated-user'
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
  entity Imputations as projection on db.Imputations actions {
    // POST /Imputations('<id>')/validate  { validatedBy }
    action validate(validatedBy: String) returns Imputations;
    // POST /Imputations('<id>')/reject    { validatedBy }
    action reject(validatedBy: String) returns Imputations;
  };

  entity ImputationPeriods as projection on db.ImputationPeriods actions {
    // POST /ImputationPeriods('<id>')/submit
    action submit() returns ImputationPeriods;
    // POST /ImputationPeriods('<id>')/validate   { validatedBy }
    action validate(validatedBy: String) returns ImputationPeriods;
    // POST /ImputationPeriods('<id>')/reject     { validatedBy }
    action reject(validatedBy: String) returns ImputationPeriods;
    // POST /ImputationPeriods('<id>')/sendToStraTIME { sentBy }
    action sendToStraTIME(sentBy: String) returns ImputationPeriods;
  };

  entity TimeLogs as projection on db.TimeLogs actions {
    // POST /TimeLogs('<id>')/sendToStraTIME
    action sendToStraTIME() returns TimeLogs;
  };

  // ---- WRICEF domain ---------------------------------------------------------
  entity Wricefs             as projection on db.Wricefs;
  entity WricefObjects       as projection on db.WricefObjects;

  // ---- Reference / Knowledge -----------------------------------------------
  entity Abaques             as projection on db.Abaques;
  entity DocumentationObjects as projection on db.DocumentationObjects;
  entity Notifications       as projection on db.Notifications;
  entity ReferenceData       as projection on db.ReferenceData;

  // ---- Authentication action ------------------------------------------------
  // POST /authenticate { email, password }
  action authenticate(email: String, password: String) returns Users;
}
