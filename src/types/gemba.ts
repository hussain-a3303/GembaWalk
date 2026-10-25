export type QuestionCategory = 'Safety' | 'Quality' | 'RPS' | '5S';

export type FindingSeverity = 'Minor' | 'Major' | 'Critical';
export type FindingStatus = 'Open' | 'In Progress' | 'Closed';

export interface Assignee {
  name: string;
  email: string;
  role: string;
  department: string;
}

export interface Question {
  id: string;
  seq: number;
  area: string;
  subArea: string;
  category: QuestionCategory;
  heading: string;
  questionText: string;
  findingAnswer: 'Yes' | 'No';
  findingTrigger?: string;
  active: boolean;
  version?: string;
  helpText?: string;
  sourceSheet?: string;
  sourceRow?: number;
  suggestedAssignees?: Assignee[];
}

export interface EvidencePhoto {
  id: string;
  name: string;
  sizeBytes: number;
  timestamp: string;
  uploadStatus: 'uploaded' | 'pending' | 'failed';
  dataUrl?: string;
}

export interface Finding {
  id: string;
  questionId: string;
  questionText: string;
  area: string;
  subArea: string;
  category: QuestionCategory;
  severity: FindingSeverity;
  status: FindingStatus;
  description: string;
  suggestedAction?: string;
  photos: EvidencePhoto[];
  assignedTo?: Assignee;
  assignedRecipients?: Assignee[];
  createdAt: string;
  resolvedAt?: string;
}

export interface Visit {
  id: string;
  area: string;
  subArea: string;
  observer: string;
  observerName?: string;
  visitorName?: string;
  visitDate: string;
  answers: Record<string, 'Yes' | 'No' | 'N/A'>;
  findings: Record<string, Finding>;
  adHocFindings?: Finding[];
  status: 'In Progress' | 'Submitted';
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
}

export interface Person {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  departments?: string[];
  area?: string;
  areas?: string[];
  subArea?: string;
  subAreas?: string[];
  isLead?: boolean;
}

export interface EmailNotification {
  id: string;
  findingId: string;
  visitId: string;
  recipientName: string;
  recipientEmail: string;
  recipientRole: string;
  area: string;
  subArea: string;
  category: string;
  severity: FindingSeverity;
  subject: string;
  body: string;
  timestamp: string;
  status: 'Delivered' | 'Pending' | 'Failed';
  providerDispatchId?: string;
  dispatchError?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  targetRef: string;
  eventDetails: string;
  clientIp?: string;
}

export interface SmtpConfig {
  provider: 'Office 365' | 'Outlook / Hotmail' | 'Google Gmail' | 'Custom SMTP' | 'EmailJS';
  host: string;
  port: number;
  senderEmail: string;
  appPassword: string;
  displayName: string;
  testRecipient?: string;
  // EmailJS API Integration settings
  emailJsServiceId?: string;
  emailJsTemplateId?: string;
  emailJsPublicKey?: string;
  isLiveDispatchEnabled?: boolean;
}

export interface ObserverProfile {
  name: string;
  email: string;
  role: 'Inspector' | 'Plant Administrator';
  department: string;
}
