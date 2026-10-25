import { Question, Finding, Visit, Assignee, QuestionCategory, Person } from '../types/gemba';

export function generateFindingId(): string {
  const num = Math.floor(100 + Math.random() * 900);
  return `FND-${num}`;
}

export function generateVisitId(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `VIS-${num}`;
}

export function generateEmailId(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `EML-${num}`;
}

export function generatePhotoId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let res = 'PHO-';
  for (let i = 0; i < 7; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

export function generatePersonId(existingPeople: Person[] = []): string {
  const existingIds = new Set(existingPeople.map((p) => p.id));
  let maxNum = 0;
  for (const p of existingPeople) {
    if (p.id && p.id.startsWith('PER-')) {
      const numPart = parseInt(p.id.replace('PER-', ''), 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
  }
  let candidateNum = maxNum + 1;
  while (existingIds.has(`PER-${String(candidateNum).padStart(3, '0')}`)) {
    candidateNum++;
  }
  return `PER-${String(candidateNum).padStart(3, '0')}`;
}

export function generateQuestionId(existingQuestions: Question[] = []): string {
  const existingIds = new Set(existingQuestions.map((q) => q.id));
  let maxNum = 0;
  for (const q of existingQuestions) {
    if (q.id && q.id.startsWith('IMP-Q-')) {
      const numPart = parseInt(q.id.replace('IMP-Q-', ''), 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
  }
  let candidateNum = maxNum + 1;
  while (existingIds.has(`IMP-Q-${candidateNum}`)) {
    candidateNum++;
  }
  return `IMP-Q-${candidateNum}`;
}

export function calculateCompletion(questions: Question[], answers: Record<string, string>) {
  const total = questions.length;
  let answered = 0;
  const unanswered: Question[] = [];

  for (const q of questions) {
    if (answers[q.id] && answers[q.id] !== '') {
      answered++;
    } else {
      unanswered.push(q);
    }
  }

  return {
    total,
    answered,
    isComplete: total > 0 && answered === total,
    unanswered,
  };
}

export interface CategorySummary {
  category: QuestionCategory;
  total: number;
  answered: number;
  findingsCount: number;
}

export function categorizeBreakdown(
  questions: Question[],
  answers: Record<string, string>,
  findings: Record<string, Finding>
): CategorySummary[] {
  const categories: QuestionCategory[] = ['Safety', 'Quality', '5S', 'RPS'];
  const map: Record<QuestionCategory, { total: number; answered: number; findingsCount: number }> = {
    Safety: { total: 0, answered: 0, findingsCount: 0 },
    Quality: { total: 0, answered: 0, findingsCount: 0 },
    '5S': { total: 0, answered: 0, findingsCount: 0 },
    RPS: { total: 0, answered: 0, findingsCount: 0 },
  };

  for (const q of questions) {
    const cat = q.category || 'Safety';
    if (!map[cat]) {
      map[cat] = { total: 0, answered: 0, findingsCount: 0 };
    }
    map[cat].total += 1;
    if (answers[q.id]) {
      map[cat].answered += 1;
    }
    if (findings[q.id] || answers[q.id] === 'No') {
      map[cat].findingsCount += 1;
    }
  }

  return categories.map((cat) => ({
    category: cat,
    total: map[cat].total,
    answered: map[cat].answered,
    findingsCount: map[cat].findingsCount,
  }));
}

export function formatGembaEmail(
  finding: Finding,
  visit: Partial<Visit>,
  recipient: Assignee
): { subject: string; body: string } {
  const dateFormatted = new Date().toLocaleString();
  const subject = `[GEMBA ACTION REQUIRED] ${finding.severity.toUpperCase()} ${finding.category} Finding at ${finding.area} (${finding.subArea})`;
  const photoCount = finding.photos ? finding.photos.length : 0;

  const body = `GEMBA WALK ACTION NOTIFICATION - REAL-TIME DISPATCH
===================================================

Incident ID: ${finding.id}
Area: ${finding.area} (${finding.subArea})
Date & Time: ${dateFormatted}
Observer: ${visit.observer || 'Inspector'}
Category: ${finding.category}
Priority / Severity: ${finding.severity.toUpperCase()}

CHECKLIST QUESTION:
${finding.questionText}

OBSERVATION & FINDING DESCRIPTION:
${finding.description || 'Observed hazard during gemba walk.'}

${finding.suggestedAction ? `SUGGESTED ACTION:\n${finding.suggestedAction}\n\n` : ''}CORRECTIVE ACTION REQUESTED:
Immediate containment and root cause analysis required.

ASSIGNED RESPONSIBLE PERSON:
Name: ${recipient.name}
Role: ${recipient.role}
Email: ${recipient.email}

Evidence Photos: ${photoCount} photo(s) captured and attached to Cloud Record.

Please review this finding and update resolution status in the GembaWalk portal.
===================================================`;

  return { subject, body };
}

export function convertToCsv(headers: string[], rows: (string | number)[][]): string {
  const escapeCsv = (val: string | number) => {
    const s = String(val ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const headerLine = headers.map(escapeCsv).join(',');
  const rowLines = rows.map((r) => r.map(escapeCsv).join(','));
  return [headerLine, ...rowLines].join('\n');
}
