namespace sap.performance.dashboard.db;

using { cuid, managed } from '@sap/cds/common';

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
entity Users : cuid, managed {
  name               : String(100) not null;
  email              : String(150) not null;
  role               : String(40)  not null;
  active             : Boolean     default true;
  skills             : LargeString; // JSON array of strings
  certifications     : LargeString; // JSON array of Certification objects
  availabilityPercent: Integer     default 100;
  teamId             : String(50);
  avatarUrl          : String(500);
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------
entity Projects : cuid, managed {
  name            : String(200) not null;
  projectType     : String(20);
  managerId       : String(50)  not null;
  startDate       : Date;
  endDate         : Date;
  status          : String(20)  default 'PLANNED';
  priority        : String(20)  default 'MEDIUM';
  description     : LargeString;
  progress        : Integer     default 0;
  complexity      : String(20);
  techKeywords    : LargeString; // JSON array
  documentation   : LargeString;
  linkedAbaqueId  : String(50);
  abaqueEstimate  : LargeString; // JSON object
  wricef          : LargeString; // JSON object (ProjectWricef)
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------
entity Tasks : cuid, managed {
  projectId      : String(50)  not null;
  title          : String(200) not null;
  description    : LargeString;
  status         : String(20)  default 'TO_DO';
  priority       : String(20)  default 'MEDIUM';
  assigneeId     : String(50);
  plannedStart   : Date;
  plannedEnd     : Date;
  realStart      : Date;
  realEnd        : Date;
  progressPercent: Integer     default 0;
  estimatedHours : Decimal(6,2) default 0;
  actualHours    : Decimal(6,2) default 0;
  effortHours    : Decimal(6,2) default 0;
  isCritical     : Boolean     default false;
  riskLevel      : String(20)  default 'NONE';
  comments       : LargeString;
}

// ---------------------------------------------------------------------------
// Timesheets
// ---------------------------------------------------------------------------
entity Timesheets : cuid, managed {
  userId    : String(50) not null;
  date      : Date       not null;
  hours     : Decimal(4,2) default 0;
  projectId : String(50) not null;
  taskId    : String(50);
  comment   : String(500);
}

// ---------------------------------------------------------------------------
// Evaluations
// ---------------------------------------------------------------------------
entity Evaluations : cuid, managed {
  userId          : String(50) not null;
  evaluatorId     : String(50) not null;
  projectId       : String(50) not null;
  period          : String(20);
  score           : Decimal(4,2) default 0;
  qualitativeGrid : LargeString; // JSON object
  feedback        : LargeString;
  createdAt       : DateTime;
}

// ---------------------------------------------------------------------------
// Deliverables
// ---------------------------------------------------------------------------
entity Deliverables : cuid, managed {
  projectId          : String(50) not null;
  taskId             : String(50);
  type               : String(50);
  name               : String(200) not null;
  url                : String(500);
  fileRef            : String(500);
  validationStatus   : String(30)  default 'PENDING';
  functionalComment  : LargeString;
  createdAt          : DateTime;
}

// ---------------------------------------------------------------------------
// Tickets  ← PRIMARY DOMAIN
// ---------------------------------------------------------------------------
entity Tickets : cuid, managed {
  ticketCode           : String(30);
  projectId            : String(50)  not null;
  createdBy            : String(50)  not null;
  assignedTo           : String(50);
  assignedToRole       : String(40);
  status               : String(20)  default 'NEW';
  priority             : String(20)  default 'MEDIUM';
  nature               : String(30)  not null;
  title                : String(200) not null;
  description          : LargeString;
  dueDate              : Date;
  effortHours          : Decimal(6,2) default 0;
  effortComment        : String(500);
  functionalTesterId   : String(50);
  tags                 : LargeString; // JSON array of strings
  wricefId             : String(100);
  module               : String(20);
  estimationHours      : Decimal(6,2) default 0;
  complexity           : String(20)  default 'SIMPLE';
  estimatedViaAbaque   : Boolean     default false;
  documentationObjectIds : LargeString; // JSON array of strings
  history              : LargeString; // JSON array of TicketEvent objects
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
entity Notifications : cuid, managed {
  userId    : String(50) not null;
  type      : String(50);
  title     : String(200);
  message   : LargeString;
  read      : Boolean   default false;
  createdAt : DateTime;
}

// ---------------------------------------------------------------------------
// Allocations
// ---------------------------------------------------------------------------
entity Allocations : cuid, managed {
  userId            : String(50) not null;
  projectId         : String(50) not null;
  allocationPercent : Integer   default 0;
  startDate         : Date;
  endDate           : Date;
}

// ---------------------------------------------------------------------------
// LeaveRequests
// ---------------------------------------------------------------------------
entity LeaveRequests : cuid, managed {
  consultantId : String(50) not null;
  startDate    : Date       not null;
  endDate      : Date       not null;
  reason       : String(500);
  status       : String(20) default 'PENDING';
  managerId    : String(50) not null;
  createdAt    : DateTime;
  reviewedAt   : DateTime;
}

// ---------------------------------------------------------------------------
// TimeLogs
// ---------------------------------------------------------------------------
entity TimeLogs : cuid, managed {
  consultantId    : String(50) not null;
  ticketId        : String(50) not null;
  projectId       : String(50) not null;
  date            : Date       not null;
  durationMinutes : Integer    default 0;
  description     : LargeString;
  sentToStraTIME  : Boolean    default false;
  sentAt          : DateTime;
}

// ---------------------------------------------------------------------------
// Imputations
// ---------------------------------------------------------------------------
entity Imputations : cuid, managed {
  consultantId      : String(50) not null;
  ticketId          : String(50) not null;
  projectId         : String(50) not null;
  module            : String(20);
  date              : Date       not null;
  hours             : Decimal(4,2) default 0;
  description       : LargeString;
  validationStatus  : String(20) default 'DRAFT';
  periodKey         : String(20) not null;
  validatedBy       : String(50);
  validatedAt       : DateTime;
  createdAt         : DateTime;
}

// ---------------------------------------------------------------------------
// ImputationPeriods
// ---------------------------------------------------------------------------
entity ImputationPeriods : cuid, managed {
  periodKey      : String(20) not null;
  consultantId   : String(50) not null;
  startDate      : Date       not null;
  endDate        : Date       not null;
  status         : String(20) default 'DRAFT';
  totalHours     : Decimal(6,2) default 0;
  submittedAt    : DateTime;
  validatedBy    : String(50);
  validatedAt    : DateTime;
  sentToStraTIME : Boolean    default false;
  sentBy         : String(50);
  sentAt         : DateTime;
}

// ---------------------------------------------------------------------------
// Abaques (estimation matrices)
// ---------------------------------------------------------------------------
entity Abaques : cuid, managed {
  name    : String(200) not null;
  entries : LargeString; // JSON array of AbaqueEntry objects
}

// ---------------------------------------------------------------------------
// DocumentationObjects
// ---------------------------------------------------------------------------
entity DocumentationObjects : cuid, managed {
  title           : String(200) not null;
  description     : LargeString;
  type            : String(30)  default 'GENERAL';
  content         : LargeString;
  attachedFiles   : LargeString; // JSON array
  relatedTicketIds: LargeString; // JSON array of ticket IDs
  projectId       : String(50)  not null;
  authorId        : String(50)  not null;
  createdAt       : DateTime;
  updatedAt       : DateTime;
  sourceSystem    : String(20);
  sourceRefId     : String(200);
}

// ---------------------------------------------------------------------------
// ReferenceData
// ---------------------------------------------------------------------------
entity ReferenceData : cuid, managed {
  type   : String(30) not null;
  code   : String(50) not null;
  label  : String(100);
  active : Boolean    default true;
  order  : Integer;
}
