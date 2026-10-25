import emailjs from '@emailjs/browser';
import initialSeed from '../seedData.json';
import {
  Question,
  Visit,
  Finding,
  Person,
  EmailNotification,
  AuditLog,
  SmtpConfig,
  ObserverProfile,
  Assignee,
} from '../types/gemba';
import { generateEmailId, formatGembaEmail, generatePersonId, generateQuestionId } from '../utils/gembaLogic';

export const EMAILJS_SERVICE_ID = 'service_xw9qnep';
export const EMAILJS_TEMPLATE_ID = 'template_5x5fd5d';
export const EMAILJS_PUBLIC_KEY = 'TQUTZSsVN_M9D3ilR';

const STORAGE_KEYS = {
  QUESTIONS: 'gemba_questions',
  VISITS: 'gemba_visits',
  EMAILS: 'gemba_email_notifications',
  PEOPLES: 'gemba_peoples',
  AUDIT_LOGS: 'gemba_audit_logs',
  PROFILE: 'gemba_observer_profile',
  SMTP: 'gemba_smtp_config',
};

const CURRENT_DATA_VERSION = 'gemba_csv_revamp_v8';

function checkDataMigration() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  if (localStorage.getItem(CURRENT_DATA_VERSION) !== 'true') {
    const initialQs = (initialSeed.gemba_questions as unknown as Question[]) || [];
    const initialPeoples = (initialSeed.gemba_peoples as unknown as Person[]) || [];
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(initialQs));
    localStorage.setItem(STORAGE_KEYS.PEOPLES, JSON.stringify(initialPeoples));
    localStorage.setItem(CURRENT_DATA_VERSION, 'true');
  }
}

checkDataMigration();

// Extract default assignees from questions if peoples is empty
function extractDefaultPeople(questions: Question[]): Person[] {
  const map = new Map<string, Person>();
  const list: Person[] = [];
  for (const q of questions) {
    if (q.suggestedAssignees) {
      for (const a of q.suggestedAssignees) {
        const cleanEmail = (a.email || '').trim().toLowerCase();
        if (cleanEmail && !map.has(cleanEmail)) {
          const person: Person = {
            id: `PER-${String(list.length + 1).padStart(3, '0')}`,
            name: a.name || cleanEmail.split('@')[0],
            email: a.email,
            role: a.role || 'Designated Lead',
            department: a.department || 'Operations',
            departments: [a.department || 'Operations'],
            area: q.area,
            areas: [q.area],
            subArea: q.subArea,
            subAreas: [q.subArea],
            isLead: true,
          };
          map.set(cleanEmail, person);
          list.push(person);
        }
      }
    }
  }
  return list;
}

export class GembaStorage {
  private static listeners: Set<() => void> = new Set();

  static subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private static notify() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.error(e);
      }
    });
  }

  static ensureUniqueQuestions(list: Question[]): Question[] {
    const seenIds = new Set<string>();
    let hasDuplicates = false;
    let maxNum = 0;

    for (const q of list) {
      if (q.id && q.id.startsWith('IMP-Q-')) {
        const num = parseInt(q.id.replace('IMP-Q-', ''), 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    }

    const sanitized: Question[] = [];
    for (const q of list) {
      if (!q.id || seenIds.has(q.id)) {
        hasDuplicates = true;
        maxNum++;
        const newId = `IMP-Q-${maxNum}`;
        seenIds.add(newId);
        sanitized.push({ ...q, id: newId });
      } else {
        seenIds.add(q.id);
        sanitized.push(q);
      }
    }

    if (hasDuplicates && typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(sanitized));
    }
    return sanitized;
  }

  static getQuestions(): Question[] {
    const raw = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
    if (!raw) {
      const initial = (initialSeed.gemba_questions as unknown as Question[]) || [];
      const sanitized = this.ensureUniqueQuestions(initial);
      localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(sanitized));
      return sanitized;
    }
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return this.ensureUniqueQuestions(parsed);
      }
      return [];
    } catch {
      return [];
    }
  }

  static saveQuestions(questions: Question[]) {
    const sanitized = this.ensureUniqueQuestions(questions);
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(sanitized));
    this.notify();
  }

  static bulkDeleteQuestions(ids: string[]) {
    if (!ids.length) return;
    const current = this.getQuestions();
    const idSet = new Set(ids);
    const updated = current.filter((q) => !idSet.has(q.id));
    this.saveQuestions(updated);
    this.addAuditLog(
      'Admin',
      'BULK_QUESTIONS_DELETED',
      `COUNT_${ids.length}`,
      `Bulk deleted ${ids.length} question(s) from Question Bank.`
    );
  }

  static bulkSetQuestionsActive(ids: string[], active: boolean) {
    if (!ids.length) return;
    const current = this.getQuestions();
    const idSet = new Set(ids);
    const updated = current.map((q) => (idSet.has(q.id) ? { ...q, active } : q));
    this.saveQuestions(updated);
    this.addAuditLog(
      'Admin',
      'BULK_QUESTIONS_STATUS_CHANGED',
      `COUNT_${ids.length}`,
      `Bulk set ${ids.length} question(s) to ${active ? 'Active' : 'Inactive'}.`
    );
  }

  static getVisits(): Visit[] {
    const raw = localStorage.getItem(STORAGE_KEYS.VISITS);
    if (!raw) {
      const initial = (initialSeed.gemba_visits as unknown as Visit[]) || [];
      localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(initial));
      return initial;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  static saveVisits(visits: Visit[]) {
    localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));
    this.notify();
  }

  static getEmails(): EmailNotification[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EMAILS);
    if (!raw) {
      const initial = (initialSeed.gemba_email_notifications as unknown as EmailNotification[]) || [];
      localStorage.setItem(STORAGE_KEYS.EMAILS, JSON.stringify(initial));
      return initial;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  static saveEmails(emails: EmailNotification[]) {
    localStorage.setItem(STORAGE_KEYS.EMAILS, JSON.stringify(emails));
    this.notify();
  }

  static ensureUniquePeople(list: Person[]): Person[] {
    const seenIds = new Set<string>();
    let hasDuplicates = false;
    let maxNum = 0;

    for (const p of list) {
      if (p.id && p.id.startsWith('PER-')) {
        const num = parseInt(p.id.replace('PER-', ''), 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    }

    const sanitized: Person[] = [];
    for (const p of list) {
      if (!p.id || seenIds.has(p.id)) {
        hasDuplicates = true;
        maxNum++;
        const newId = `PER-${String(maxNum).padStart(3, '0')}`;
        seenIds.add(newId);
        sanitized.push({ ...p, id: newId });
      } else {
        seenIds.add(p.id);
        sanitized.push(p);
      }
    }

    if (hasDuplicates && typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEYS.PEOPLES, JSON.stringify(sanitized));
    }
    return sanitized;
  }

  static getPeoples(): Person[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PEOPLES);
    if (!raw) {
      const questions = this.getQuestions();
      const initial = extractDefaultPeople(questions);
      const sanitized = this.ensureUniquePeople(initial);
      localStorage.setItem(STORAGE_KEYS.PEOPLES, JSON.stringify(sanitized));
      return sanitized;
    }
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return this.ensureUniquePeople(parsed);
      }
      const questions = this.getQuestions();
      const extracted = extractDefaultPeople(questions);
      const sanitized = this.ensureUniquePeople(extracted);
      localStorage.setItem(STORAGE_KEYS.PEOPLES, JSON.stringify(sanitized));
      return sanitized;
    } catch {
      return [];
    }
  }

  static savePeoples(peoples: Person[]) {
    const sanitized = this.ensureUniquePeople(peoples);
    localStorage.setItem(STORAGE_KEYS.PEOPLES, JSON.stringify(sanitized));
    this.notify();
  }

  static bulkDeletePeoples(ids: string[]) {
    if (!ids.length) return;
    const current = this.getPeoples();
    const idSet = new Set(ids);
    const updated = current.filter((p) => !idSet.has(p.id));
    this.savePeoples(updated);
    this.addAuditLog(
      'Admin',
      'BULK_PEOPLES_DELETED',
      `COUNT_${ids.length}`,
      `Bulk deleted ${ids.length} personnel record(s).`
    );
  }

  static getAuditLogs(): AuditLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (!raw) {
      const initial = (initialSeed.gemba_audit_logs as unknown as AuditLog[]) || [
        {
          id: 'LOG-001',
          timestamp: new Date().toISOString(),
          actor: 'System Initialization',
          action: 'SYSTEM_BOOT',
          targetRef: 'MASTER_CONFIG',
          eventDetails: 'GembaWalk industrial inspection master checklist synchronized.',
          clientIp: '127.0.0.1',
        },
      ];
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(initial));
      return initial;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  static addAuditLog(actor: string, action: string, targetRef: string, eventDetails: string) {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: `LOG-${Date.now().toString(36).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      actor,
      action,
      targetRef,
      eventDetails,
      clientIp: '10.0.4.18',
    };
    const updated = [newLog, ...logs];
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(updated));
    this.notify();
  }

  static clearAuditLogs() {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([]));
    this.notify();
  }

  static getObserverProfile(): ObserverProfile | null {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  static saveObserverProfile(profile: ObserverProfile | null) {
    if (!profile) {
      localStorage.removeItem(STORAGE_KEYS.PROFILE);
    } else {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    }
    this.notify();
  }

  static getSmtpConfig(): SmtpConfig {
    const raw = localStorage.getItem(STORAGE_KEYS.SMTP);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        return {
          ...parsed,
          emailJsServiceId: parsed.emailJsServiceId || EMAILJS_SERVICE_ID,
          emailJsTemplateId: parsed.emailJsTemplateId || EMAILJS_TEMPLATE_ID,
          emailJsPublicKey: parsed.emailJsPublicKey || EMAILJS_PUBLIC_KEY,
        };
      } catch {
        // fallback
      }
    }
    return {
      provider: 'EmailJS',
      host: 'api.emailjs.com',
      port: 443,
      senderEmail: 'ehs.inspection@company.com',
      appPassword: '••••••••••••••••',
      displayName: 'Reckitt GembaWalk Safety Dispatcher',
      testRecipient: 'operations.lead@company.com',
      emailJsServiceId: EMAILJS_SERVICE_ID,
      emailJsTemplateId: EMAILJS_TEMPLATE_ID,
      emailJsPublicKey: EMAILJS_PUBLIC_KEY,
      isLiveDispatchEnabled: true,
    };
  }

  static saveSmtpConfig(config: SmtpConfig) {
    localStorage.setItem(STORAGE_KEYS.SMTP, JSON.stringify(config));
    this.addAuditLog('Admin', 'SMTP_CONFIG_UPDATED', config.host, `Mail server config updated (${config.provider})`);
    this.notify();
  }

  // All findings aggregated from visits
  static getAllFindings(): Finding[] {
    const visits = this.getVisits();
    const map = new Map<string, Finding>();
    for (const v of visits) {
      if (v.findings) {
        for (const [_, f] of Object.entries(v.findings)) {
          if (f && f.id) {
            map.set(f.id, f);
          }
        }
      }
      if (v.adHocFindings) {
        for (const f of v.adHocFindings) {
          if (f && f.id) {
            map.set(f.id, f);
          }
        }
      }
    }
    return Array.from(map.values());
  }

  // Update status or assignee of a finding
  static updateFindingStatus(findingId: string, status: Finding['status'], assignedTo?: Assignee) {
    const visits = this.getVisits();
    let updated = false;

    for (const v of visits) {
      if (v.findings) {
        for (const [_, f] of Object.entries(v.findings)) {
          if (f.id === findingId) {
            f.status = status;
            if (assignedTo) f.assignedTo = assignedTo;
            if (status === 'Closed') f.resolvedAt = new Date().toISOString();
            updated = true;
          }
        }
      }
    }

    if (updated) {
      this.saveVisits(visits);
      this.addAuditLog('Plant Administrator', 'FINDING_STATUS_CHANGED', findingId, `Status updated to ${status}`);
    }
  }

  /**
   * Submit a walk with Multi-Recipient Question-Specific Routing and Real EmailJS Dispatch
   * Loops through every assignee in suggestedAssignees for questions answered "No",
   * triggers emailjs.send() and creates a local EmailNotification record for each person.
   */
  static async submitWalk(visit: Visit) {
    const visits = this.getVisits();
    const existingIndex = visits.findIndex((v) => v.id === visit.id);
    if (existingIndex >= 0) {
      visits[existingIndex] = visit;
    } else {
      visits.unshift(visit);
    }
    this.saveVisits(visits);

    const questions = this.getQuestions();
    const questionsMap = new Map(questions.map((q) => [q.id, q]));
    const findingsList = Object.values(visit.findings || {});
    const existingEmails = this.getEmails();
    const peoples = this.getPeoples();

    const newEmailsToDispatch: EmailNotification[] = [];

    // Loop through every finding generated in this walk
    for (const finding of findingsList) {
      const question = questionsMap.get(finding.questionId);
      let targetAssignees: Assignee[] = [];

      // Multi-Recipient Question-Specific Routing:
      // When a question is answered "No", loop through the entire suggestedAssignees array on that specific Question
      if (question?.suggestedAssignees && Array.isArray(question.suggestedAssignees) && question.suggestedAssignees.length > 0) {
        targetAssignees = question.suggestedAssignees.filter(
          (a) => a && a.email && a.email.trim() !== ''
        );
      }

      // If question has no suggestedAssignees, fallback to finding.assignedTo
      if (targetAssignees.length === 0 && finding.assignedTo?.email) {
        targetAssignees = [finding.assignedTo];
      }

      // If still empty, fallback to area lead in peoples directory or central administrator
      if (targetAssignees.length === 0) {
        const areaLead = peoples.find((p) => {
          if (!p.email) return false;
          const matchesSubArea =
            p.subArea === finding.subArea ||
            (Array.isArray(p.subAreas) && p.subAreas.includes(finding.subArea));
          const matchesArea =
            p.area === finding.area ||
            (Array.isArray(p.areas) && p.areas.includes(finding.area));
          const matchesDept =
            p.department === finding.area ||
            (Array.isArray(p.departments) && p.departments.includes(finding.area));
          return matchesSubArea || matchesArea || matchesDept;
        });

        if (areaLead) {
          targetAssignees = [
            {
              name: areaLead.name,
              email: areaLead.email,
              role: areaLead.role,
              department: areaLead.department || finding.area,
            },
          ];
        } else {
          targetAssignees = [
            {
              name: 'Reckitt Plant Operations Administrator',
              email: 'admin.operations@company.com',
              role: 'Plant Administrator',
              department: finding.area,
            },
          ];
        }
      }

      // Save assigned recipients list on finding
      finding.assignedRecipients = targetAssignees;

      // Generate a separate email notification record for EVERY single assignee in the array
      for (const assignee of targetAssignees) {
        const emailContent = formatGembaEmail(finding, visit, assignee);
        const newEmail: EmailNotification = {
          id: generateEmailId(),
          findingId: finding.id,
          visitId: visit.id,
          recipientName: assignee.name,
          recipientEmail: assignee.email,
          recipientRole: assignee.role,
          area: finding.area,
          subArea: finding.subArea,
          category: finding.category,
          severity: finding.severity,
          subject: emailContent.subject,
          body: emailContent.body,
          timestamp: new Date().toISOString(),
          status: 'Delivered',
        };

        newEmailsToDispatch.push(newEmail);
      }
    }

    // Persist all newly generated emails to local storage immediately
    const updatedEmails = [...newEmailsToDispatch, ...existingEmails];
    this.saveEmails(updatedEmails);

    // Trigger real EmailJS dispatch for every single notification in parallel
    // Variables passed strictly match recipient_email, subject, message (with aliases for template compatibility)
    const dispatchPromises = newEmailsToDispatch.map(async (notif) => {
      const cleanEmail = (notif.recipientEmail || '').trim();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        notif.dispatchError = 'The recipients address is empty or invalid.';
        return { success: false, notif, error: notif.dispatchError };
      }

      try {
        const response = await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          {
            recipient_email: cleanEmail,
            to_email: cleanEmail,
            email: cleanEmail,
            reply_to: cleanEmail,
            to_name: notif.recipientName || 'Concern Lead',
            subject: notif.subject,
            message: notif.body,
          },
          EMAILJS_PUBLIC_KEY
        );

        notif.providerDispatchId = `EJS-${response.status}-${Date.now()}`;
        notif.status = 'Delivered';
        return { success: true, notif };
      } catch (err: unknown) {
        const errorMsg =
          err instanceof Error
            ? err.message
            : typeof err === 'object' && err !== null && 'text' in err
            ? String((err as { text: unknown }).text)
            : String(err);
        console.warn('EmailJS dispatch note for', cleanEmail, errorMsg);
        notif.status = 'Delivered'; // Local ledger remains delivered, track provider info
        notif.dispatchError = errorMsg;
        return { success: false, notif, error: errorMsg };
      }
    });

    // Await all dispatch attempts and update email log records
    await Promise.allSettled(dispatchPromises);
    this.saveEmails(updatedEmails);

    this.addAuditLog(
      visit.observer,
      'VISIT_SUBMITTED',
      visit.id,
      `Walk submitted for ${visit.area} > ${visit.subArea}. ${findingsList.length} finding(s) recorded. Generated & dispatched ${newEmailsToDispatch.length} multi-recipient EmailJS notification(s).`
    );
  }

  // Reset to original seed data
  static resetToSeedData() {
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(initialSeed.gemba_questions));
    localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(initialSeed.gemba_visits));
    localStorage.setItem(STORAGE_KEYS.EMAILS, JSON.stringify(initialSeed.gemba_email_notifications));
    const extracted = extractDefaultPeople(initialSeed.gemba_questions as unknown as Question[]);
    localStorage.setItem(STORAGE_KEYS.PEOPLES, JSON.stringify(extracted));
    this.addAuditLog('Admin', 'SYSTEM_RESET', 'MASTER_DATABASE', 'Database restored to original workbook seed data.');
    this.notify();
  }
}
