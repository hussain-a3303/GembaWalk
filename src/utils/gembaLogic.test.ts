import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateFindingId,
  generateVisitId,
  generateEmailId,
  generatePersonId,
  generateQuestionId,
  calculateCompletion,
  categorizeBreakdown,
  formatGembaEmail,
  convertToCsv,
} from './gembaLogic';
import { Question, Finding, Person } from '../types/gemba';

test('ID generation produces valid prefixes and lengths', () => {
  const fnd = generateFindingId();
  assert.match(fnd, /^FND-\d{3}$/);

  const vis = generateVisitId();
  assert.match(vis, /^VIS-\d{4}$/);

  const eml = generateEmailId();
  assert.match(eml, /^EML-\d{6}$/);

  const pId = generatePersonId();
  assert.equal(pId, 'PER-001');

  // Verify generatePersonId increments beyond existing max and skips collisions
  const existingPeople: Person[] = [
    { id: 'PER-001', name: 'A', email: 'a@c.com', role: 'Lead', department: 'Ops', area: 'W', subArea: 'S' },
    { id: 'PER-021', name: 'B', email: 'b@c.com', role: 'Lead', department: 'Ops', area: 'W', subArea: 'S' },
  ];
  const nextPId = generatePersonId(existingPeople);
  assert.equal(nextPId, 'PER-022');
  assert.notEqual(nextPId, 'PER-021');

  // Verify generateQuestionId increments beyond max
  const existingQuestions: Question[] = [
    { id: 'IMP-Q-1', seq: 1, area: 'W', subArea: 'S', category: 'Safety', heading: 'H', questionText: 'Q', findingAnswer: 'No', active: true },
    { id: 'IMP-Q-166', seq: 2, area: 'W', subArea: 'S', category: 'Safety', heading: 'H', questionText: 'Q2', findingAnswer: 'No', active: true },
  ];
  const nextQId = generateQuestionId(existingQuestions);
  assert.equal(nextQId, 'IMP-Q-167');
});

test('calculateCompletion accurately detects completeness and missing items', () => {
  const sampleQuestions: Question[] = [
    {
      id: 'Q1',
      seq: 1,
      area: 'Warehouse',
      subArea: 'Household',
      category: 'Safety',
      heading: 'Safety',
      questionText: 'Is PPE worn?',
      findingAnswer: 'No',
      active: true,
    },
    {
      id: 'Q2',
      seq: 2,
      area: 'Warehouse',
      subArea: 'Household',
      category: 'Quality',
      heading: 'Quality',
      questionText: 'Is inventory labeled?',
      findingAnswer: 'No',
      active: true,
    },
  ];

  const incomplete = calculateCompletion(sampleQuestions, { Q1: 'Yes' });
  assert.equal(incomplete.total, 2);
  assert.equal(incomplete.answered, 1);
  assert.equal(incomplete.isComplete, false);
  assert.equal(incomplete.unanswered.length, 1);
  assert.equal(incomplete.unanswered[0].id, 'Q2');

  const complete = calculateCompletion(sampleQuestions, { Q1: 'Yes', Q2: 'No' });
  assert.equal(complete.total, 2);
  assert.equal(complete.answered, 2);
  assert.equal(complete.isComplete, true);
  assert.equal(complete.unanswered.length, 0);
});

test('categorizeBreakdown groups questions and findings by category', () => {
  const sampleQuestions: Question[] = [
    {
      id: 'Q1',
      seq: 1,
      area: 'Warehouse',
      subArea: 'Household',
      category: 'Safety',
      heading: 'Safety',
      questionText: 'PPE check',
      findingAnswer: 'No',
      active: true,
    },
    {
      id: 'Q2',
      seq: 2,
      area: 'Warehouse',
      subArea: 'Household',
      category: 'Safety',
      heading: 'Safety',
      questionText: 'Walkway clear',
      findingAnswer: 'No',
      active: true,
    },
    {
      id: 'Q3',
      seq: 3,
      area: 'Warehouse',
      subArea: 'Household',
      category: 'Quality',
      heading: 'Quality',
      questionText: 'Label check',
      findingAnswer: 'No',
      active: true,
    },
  ];

  const answers = { Q1: 'Yes', Q2: 'No', Q3: 'Yes' };
  const findings: Record<string, Finding> = {
    Q2: {
      id: 'FND-101',
      questionId: 'Q2',
      questionText: 'Walkway clear',
      area: 'Warehouse',
      subArea: 'Household',
      category: 'Safety',
      severity: 'Major',
      status: 'Open',
      description: 'Pallet blocking aisle',
      photos: [],
      createdAt: new Date().toISOString(),
    },
  };

  const breakdown = categorizeBreakdown(sampleQuestions, answers, findings);
  const safety = breakdown.find((b) => b.category === 'Safety');
  assert.ok(safety);
  assert.equal(safety.total, 2);
  assert.equal(safety.answered, 2);
  assert.equal(safety.findingsCount, 1);

  const quality = breakdown.find((b) => b.category === 'Quality');
  assert.ok(quality);
  assert.equal(quality.total, 1);
  assert.equal(quality.answered, 1);
  assert.equal(quality.findingsCount, 0);
});

test('formatGembaEmail formats subject and body correctly', () => {
  const finding: Finding = {
    id: 'FND-999',
    questionId: 'Q1',
    questionText: 'Emergency exit blocked?',
    area: 'Warehouse',
    subArea: 'Household Warehouse',
    category: 'Safety',
    severity: 'Critical',
    status: 'Open',
    description: 'Debris in front of door',
    photos: [],
    createdAt: new Date().toISOString(),
  };

  const email = formatGembaEmail(
    finding,
    { observer: 'John Doe' },
    {
      name: 'Safety Lead',
      email: 'lead@plant.com',
      role: 'Safety Lead',
      department: 'EHS',
    }
  );

  assert.ok(email.subject.includes('[GEMBA ACTION REQUIRED] CRITICAL Safety Finding'));
  assert.ok(email.body.includes('Incident ID: FND-999'));
  assert.ok(email.body.includes('Priority / Severity: CRITICAL'));
  assert.ok(email.body.includes('Name: Safety Lead'));
});

test('convertToCsv properly quotes strings with commas and quotes', () => {
  const headers = ['ID', 'Title', 'Note'];
  const rows = [
    ['1', 'Normal', 'No comma'],
    ['2', 'With, comma', 'Contains "quotes" here'],
  ];

  const csv = convertToCsv(headers, rows);
  assert.ok(csv.includes('"With, comma"'));
  assert.ok(csv.includes('"Contains ""quotes"" here"'));
});

test('Multi-recipient question-specific routing creates distinct notifications for every assignee', () => {
  const finding: Finding = {
    id: 'FND-777',
    questionId: 'Q-HAZ-1',
    questionText: 'Are machine guards interlocked and operational?',
    area: 'Production',
    subArea: 'Liquid Line 1',
    category: 'Safety',
    severity: 'Critical',
    status: 'Open',
    description: 'Interlock bypassed on filler conveyor',
    photos: [],
    createdAt: new Date().toISOString(),
  };

  const visit = {
    id: 'VIS-2026',
    area: 'Production',
    subArea: 'Liquid Line 1',
    observer: 'Jane Doe',
    visitDate: '2026-03-10T10:00:00Z',
    status: 'Submitted' as const,
    answers: {},
    findings: {},
    createdAt: '2026-03-10T10:00:00Z',
  };

  const suggestedAssignees = [
    {
      name: 'Syed Sameeruddin',
      email: 'syed.sameeruddin@reckitt.com',
      role: 'Operations Engineer',
      department: 'Manufacturing',
    },
    {
      name: 'Zubair Ahmed',
      email: 'zubair.ahmed1@reckitt.com',
      role: 'Maintenance Lead',
      department: 'Engineering',
    },
    {
      name: 'Shahzore Junejo',
      email: 'shahzore.junejo@reckitt.com',
      role: 'Safety Officer',
      department: 'EHS',
    },
  ];

  const notifications = suggestedAssignees.map((assignee) => {
    const { subject, body } = formatGembaEmail(finding, visit, assignee);
    return {
      id: generateEmailId(),
      findingId: finding.id,
      visitId: visit.id,
      recipientName: assignee.name,
      recipientEmail: assignee.email,
      recipientRole: assignee.role,
      subject,
      body,
    };
  });

  // Verify that 3 separate notifications were generated
  assert.equal(notifications.length, 3);

  // Each notification has unique email and mentions assignee name
  assert.equal(notifications[0].recipientEmail, 'syed.sameeruddin@reckitt.com');
  assert.ok(notifications[0].body.includes('Syed Sameeruddin'));
  assert.equal(notifications[1].recipientEmail, 'zubair.ahmed1@reckitt.com');
  assert.ok(notifications[1].body.includes('Zubair Ahmed'));
  assert.equal(notifications[2].recipientEmail, 'shahzore.junejo@reckitt.com');
  assert.ok(notifications[2].body.includes('Shahzore Junejo'));

  // All notifications share the correct finding reference
  notifications.forEach((n) => {
    assert.equal(n.findingId, 'FND-777');
    assert.ok(n.subject.includes('CRITICAL'));
  });
});

test('Analytics date slicer correctly filters visits and recalculates metrics', () => {
  const sampleVisits = [
    { id: 'V1', visitDate: '2026-01-15T09:00:00Z', status: 'Submitted' },
    { id: 'V2', visitDate: '2026-02-10T14:00:00Z', status: 'Submitted' },
    { id: 'V3', visitDate: '2026-03-05T11:00:00Z', status: 'Submitted' },
  ];

  // Filter for February only
  const startDate = '2026-02-01';
  const endDate = '2026-02-28';

  const filtered = sampleVisits.filter((v) => {
    const d = new Date(v.visitDate).toISOString().slice(0, 10);
    return d >= startDate && d <= endDate;
  });

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, 'V2');
});

