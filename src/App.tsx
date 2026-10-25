import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { GembaStorage } from './services/gembaStorage';
import {
  ObserverProfile,
  Question,
  Visit,
  Finding,
  Person,
  EmailNotification,
  AuditLog,
  SmtpConfig,
} from './types/gemba';
import { Header } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { StartWalkView } from './components/inspector/StartWalkView';
import { ChecklistWalkView } from './components/inspector/ChecklistWalkView';
import { ReviewSubmitView } from './components/inspector/ReviewSubmitView';
import { FindingsRegisterView } from './components/admin/FindingsRegisterView';
import { AnalyticsDashboardView } from './components/admin/AnalyticsDashboardView';
import { VisitsHistoryView } from './components/admin/VisitsHistoryView';
import { PeoplesView } from './components/admin/PeoplesView';
import { QuestionBankView } from './components/admin/QuestionBankView';
import { EmailAlertsView } from './components/admin/EmailAlertsView';
import { SystemAuditLogView } from './components/admin/SystemAuditLogView';
import { WorkbookSourceView } from './components/admin/WorkbookSourceView';
import { AdminLayout } from './components/admin/AdminLayout';
import { SmtpModal } from './components/admin/SmtpModal';
import { EmailService } from './services/emailService';
import { generateVisitId, generateEmailId, convertToCsv, generatePersonId, generateQuestionId } from './utils/gembaLogic';

export default function App() {
  // Current user / profile
  const [profile, setProfile] = useState<ObserverProfile | null>(() =>
    GembaStorage.getObserverProfile()
  );

  // Inspector state
  const [inspectorTab, setInspectorTab] = useState<'start' | 'checklist' | 'review'>('start');
  const [currentWalkId, setCurrentWalkId] = useState<string>(() => generateVisitId());
  const [activeArea, setActiveArea] = useState<string>('Warehouse');
  const [activeSubArea, setActiveSubArea] = useState<string>('Household Warehouse');
  const [activeObserver, setActiveObserver] = useState<string>('Jane Doe (Inspector)');
  const [activeDateTime, setActiveDateTime] = useState<string>(() => new Date().toISOString());
  const [answers, setAnswers] = useState<Record<string, 'Yes' | 'No' | 'N/A'>>({});
  const [findings, setFindings] = useState<Record<string, Finding>>({});

  // Admin state
  const [adminTab, setAdminTab] = useState<
    'dashboard' | 'findings' | 'visits' | 'peoples' | 'questions' | 'emails' | 'audit' | 'workbook'
  >('dashboard');
  const [isSmtpOpen, setIsSmtpOpen] = useState(false);

  // Storage synced states
  const [questions, setQuestions] = useState<Question[]>(() => GembaStorage.getQuestions());
  const [visits, setVisits] = useState<Visit[]>(() => GembaStorage.getVisits());
  const [peoples, setPeoples] = useState<Person[]>(() => GembaStorage.getPeoples());
  const [emails, setEmails] = useState<EmailNotification[]>(() => GembaStorage.getEmails());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => GembaStorage.getAuditLogs());
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>(() => GembaStorage.getSmtpConfig());

  // Subscribe to storage changes
  useEffect(() => {
    const unsub = GembaStorage.subscribe(() => {
      setQuestions(GembaStorage.getQuestions());
      setVisits(GembaStorage.getVisits());
      setPeoples(GembaStorage.getPeoples());
      setEmails(GembaStorage.getEmails());
      setAuditLogs(GembaStorage.getAuditLogs());
      setSmtpConfig(GembaStorage.getSmtpConfig());
      setProfile(GembaStorage.getObserverProfile());
    });
    return () => {
      unsub();
    };
  }, []);

  // Filter questions for the active walk (matching area and subArea, with Utilities having no sub-area)
  const walkQuestions = questions.filter((q) => {
    if (q.area !== activeArea) return false;
    if (activeArea === 'Utilities') return true;
    return q.subArea === activeSubArea;
  });

  // Quick action logins
  const handleQuickInspector = () => {
    const p: ObserverProfile = {
      name: 'Jane Doe (Inspector)',
      email: 'jane.doe@company.com',
      role: 'Inspector',
      department: 'Quality & Safety Operations',
    };
    GembaStorage.saveObserverProfile(p);
    setProfile(p);
    setInspectorTab('start');
  };

  const handleQuickAdmin = () => {
    const p: ObserverProfile = {
      name: 'Central Plant Administrator',
      email: 'admin.operations@company.com',
      role: 'Plant Administrator',
      department: 'Central EHS & Operations',
    };
    GembaStorage.saveObserverProfile(p);
    setProfile(p);
    setAdminTab('findings');
  };

  const handleLogin = (newProfile: ObserverProfile) => {
    GembaStorage.saveObserverProfile(newProfile);
    setProfile(newProfile);
    if (newProfile.role === 'Inspector') {
      setInspectorTab('start');
    } else {
      setAdminTab('findings');
    }
  };

  const handleExit = () => {
    GembaStorage.saveObserverProfile(null);
    setProfile(null);
  };

  // Walk handlers
  const handleStartWalk = (area: string, subArea: string, observer: string, date: string) => {
    setActiveArea(area);
    setActiveSubArea(subArea);
    setActiveObserver(observer);
    setActiveDateTime(date);
    setCurrentWalkId(generateVisitId());
    setAnswers({});
    setFindings({});
    setInspectorTab('checklist');
  };

  const handleAnswerQuestion = (qId: string, answer: 'Yes' | 'No' | 'N/A') => {
    setAnswers((prev) => ({ ...prev, [qId]: answer }));
    if (answer !== 'No') {
      // Remove finding if previously set to No
      setFindings((prev) => {
        const copy = { ...prev };
        delete copy[qId];
        return copy;
      });
    }
  };

  const handleUpdateFinding = (qId: string, finding: Finding) => {
    setFindings((prev) => ({ ...prev, [qId]: finding }));
  };

  const handleSaveDraft = () => {
    GembaStorage.addAuditLog(
      activeObserver,
      'WALK_DRAFT_SAVED',
      currentWalkId,
      `Draft saved for ${activeArea} > ${activeSubArea} (${Object.keys(answers).length} answered)`
    );
  };

  const handleSubmitWalk = (visit: Visit) => {
    GembaStorage.submitWalk(visit);
  };

  const handleStartNewWalk = () => {
    setCurrentWalkId(generateVisitId());
    setAnswers({});
    setFindings({});
    setInspectorTab('start');
  };

  // Admin handlers
  const handleUpdateFindingStatus = (
    findingId: string,
    status: Finding['status'],
    assignedTo?: Finding['assignedTo']
  ) => {
    GembaStorage.updateFindingStatus(findingId, status, assignedTo);
  };

  const handleAddPerson = (person: Person) => {
    const existingIds = new Set(peoples.map((p) => p.id));
    const safePerson = (!person.id || existingIds.has(person.id))
      ? { ...person, id: generatePersonId(peoples) }
      : person;
    const updated = [safePerson, ...peoples];
    GembaStorage.savePeoples(updated);
    GembaStorage.addAuditLog('Admin', 'PERSON_ADDED', safePerson.id, `Added ${safePerson.name} (${safePerson.email})`);
  };

  const handleDeletePerson = (id: string) => {
    const updated = peoples.filter((p) => p.id !== id);
    GembaStorage.savePeoples(updated);
    GembaStorage.addAuditLog('Admin', 'PERSON_DELETED', id, 'Deleted personnel entry');
  };

  const handleImportPeoples = (newPeoples: Person[]) => {
    const existingIds = new Set(peoples.map((p) => p.id));
    const allKnown = [...peoples];
    const sanitizedNew: Person[] = [];

    for (const p of newPeoples) {
      let finalId = p.id;
      if (!finalId || existingIds.has(finalId)) {
        finalId = generatePersonId(allKnown);
      }
      existingIds.add(finalId);
      const safeP = { ...p, id: finalId };
      sanitizedNew.push(safeP);
      allKnown.push(safeP);
    }

    const updated = [...sanitizedNew, ...peoples];
    GembaStorage.savePeoples(updated);
    GembaStorage.addAuditLog('Admin', 'PEOPLES_IMPORTED', `BATCH_${sanitizedNew.length}`, `Imported ${sanitizedNew.length} personnel from spreadsheet`);
  };

  const handleToggleQuestionActive = (id: string) => {
    const updated = questions.map((q) => (q.id === id ? { ...q, active: !q.active } : q));
    GembaStorage.saveQuestions(updated);
  };

  const handleAddQuestion = (q: Question) => {
    const existingIds = new Set(questions.map((item) => item.id));
    const safeQuestion = (!q.id || existingIds.has(q.id))
      ? { ...q, id: generateQuestionId(questions) }
      : q;
    const updated = [safeQuestion, ...questions];
    GembaStorage.saveQuestions(updated);
    GembaStorage.addAuditLog('Admin', 'QUESTION_ADDED', safeQuestion.id, `Created question: ${safeQuestion.questionText.slice(0, 40)}...`);
  };

  const handleUpdateQuestion = (q: Question) => {
    const updated = questions.map((item) => (item.id === q.id ? q : item));
    GembaStorage.saveQuestions(updated);
    GembaStorage.addAuditLog('Admin', 'QUESTION_UPDATED', q.id, `Updated question: ${q.id}`);
  };

  const handleDeleteQuestion = (id: string) => {
    const updated = questions.filter((q) => q.id !== id);
    GembaStorage.saveQuestions(updated);
    GembaStorage.addAuditLog('Admin', 'QUESTION_DELETED', id, `Deleted question: ${id}`);
  };

  const handleImportQuestions = (newQuestions: Question[]) => {
    GembaStorage.saveQuestions(newQuestions);
    GembaStorage.addAuditLog('Admin', 'QUESTIONS_IMPORTED', `BATCH_${newQuestions.length}`, `Imported ${newQuestions.length} questions from Excel workbook`);
  };

  const handleResetToSeed = () => {
    if (window.confirm('Reset all questions, visits, and configurations to original workbook seed data?')) {
      GembaStorage.resetToSeedData();
    }
  };

  const handleSendTestEmail = async (testEmail: string) => {
    const cleanEmail = (testEmail || '').trim() || smtpConfig.testRecipient || 'operations.lead@company.com';
    const testNotification: EmailNotification = {
      id: generateEmailId(),
      findingId: 'FND-TEST',
      visitId: 'VIS-TEST',
      recipientName: 'Reckitt Test Engineer',
      recipientEmail: cleanEmail,
      recipientRole: 'Safety Lead',
      area: 'Warehouse',
      subArea: 'Household Warehouse',
      category: 'Safety',
      severity: 'Major',
      subject: `[RECKITT GEMBA TEST DISPATCH] Verification for ${smtpConfig.displayName}`,
      body: `RECKITT GEMBA DISPATCH VERIFICATION\n\nDispatched from: ${smtpConfig.senderEmail}\nHost: ${smtpConfig.host}:${smtpConfig.port}\nTimestamp: ${new Date().toISOString()}\n\nYour GembaWalk action dispatch server is operational and verified.`,
      timestamp: new Date().toISOString(),
      status: 'Delivered',
    };
    const res = await EmailService.sendEmail(testNotification, smtpConfig);
    if (!res.success) {
      testNotification.status = 'Failed';
      testNotification.dispatchError = res.error;
    }
    GembaStorage.saveEmails([testNotification, ...emails]);
    GembaStorage.addAuditLog('Admin', 'TEST_EMAIL_SENT', cleanEmail, `Test email dispatched to ${cleanEmail} (${res.isLive ? 'EmailJS Live' : 'Simulated'})`);
    return res;
  };

  // Export handlers
  const allFindings = GembaStorage.getAllFindings();

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Findings sheet
    const findingsRows = allFindings.map((f) => [
      f.id,
      f.area,
      f.subArea,
      f.category,
      f.severity,
      f.status,
      f.description,
      f.suggestedAction || '',
      f.assignedTo?.name || '',
      f.assignedTo?.email || '',
      f.createdAt,
    ]);
    const wsFindings = XLSX.utils.aoa_to_sheet([
      ['ID', 'Area', 'Sub-Area', 'Category', 'Severity', 'Status', 'Description', 'Action', 'Assignee', 'Email', 'Created At'],
      ...findingsRows,
    ]);
    XLSX.utils.book_append_sheet(wb, wsFindings, 'Findings Register');

    // Visits sheet
    const visitsRows = visits.map((v) => [
      v.id,
      v.area,
      v.subArea,
      v.observer || v.visitorName,
      v.visitDate,
      v.status,
      Object.keys(v.findings || {}).length,
      Object.keys(v.answers || {}).length,
    ]);
    const wsVisits = XLSX.utils.aoa_to_sheet([
      ['Visit ID', 'Area', 'Sub-Area', 'Observer', 'Date', 'Status', 'Findings', 'Answers'],
      ...visitsRows,
    ]);
    XLSX.utils.book_append_sheet(wb, wsVisits, 'Visits History');

    // Questions sheet
    const questionsRows = questions.map((q) => [
      q.id,
      q.area,
      q.subArea,
      q.category,
      q.heading,
      q.questionText,
      q.findingAnswer,
      q.active ? 'Active' : 'Inactive',
    ]);
    const wsQuestions = XLSX.utils.aoa_to_sheet([
      ['ID', 'Area', 'Sub-Area', 'Category', 'Heading', 'Question Text', 'Finding Answer', 'Status'],
      ...questionsRows,
    ]);
    XLSX.utils.book_append_sheet(wb, wsQuestions, 'Question Bank');

    XLSX.writeFile(wb, `GembaWalk_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportCsv = () => {
    const headers = ['ID', 'Area', 'Sub-Area', 'Category', 'Severity', 'Status', 'Description', 'Assignee', 'Created At'];
    const rows = allFindings.map((f) => [
      f.id,
      f.area,
      f.subArea,
      f.category,
      f.severity,
      f.status,
      f.description,
      f.assignedTo?.name || '',
      f.createdAt,
    ]);
    const csv = convertToCsv(headers, rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `GembaWalk_Findings_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // If not logged in, show LoginScreen
  if (!profile) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        onQuickInspector={handleQuickInspector}
        onQuickAdmin={handleQuickAdmin}
      />
    );
  }

  const isInspector = profile.role === 'Inspector';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* Top Header */}
      <Header
        profile={profile}
        activeRole={profile.role}
        currentTab={isInspector ? inspectorTab : adminTab}
        onTabChange={(tab) => {
          if (isInspector) {
            setInspectorTab(tab as typeof inspectorTab);
          } else {
            setAdminTab(tab as typeof adminTab);
          }
        }}
        onExit={handleExit}
        walkId={currentWalkId}
        activeFindingsCount={Object.keys(findings).length}
        onOpenSmtp={() => setIsSmtpOpen(true)}
        onExportExcel={handleExportExcel}
        onExportCsv={handleExportCsv}
        findingCount={allFindings.length}
        visitsCount={visits.length}
        peoplesCount={peoples.length}
        questionsCount={questions.length}
        auditCount={auditLogs.length}
        canAccessChecklist={Boolean(activeArea && activeSubArea)}
        canAccessReview={Boolean(activeArea && activeSubArea)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {isInspector ? (
          <>
            {inspectorTab === 'start' && (
              <StartWalkView
                observerName={profile.name}
                onStartWalk={handleStartWalk}
                peoples={peoples}
              />
            )}

            {inspectorTab === 'checklist' && (
              <ChecklistWalkView
                questions={
                  walkQuestions.length > 0
                    ? walkQuestions
                    : questions.filter((q) => q.area === activeArea).slice(0, 7)
                }
                area={activeArea}
                subArea={activeSubArea}
                observer={activeObserver}
                answers={answers}
                findings={findings}
                onAnswer={handleAnswerQuestion}
                onUpdateFinding={handleUpdateFinding}
                onSaveDraft={handleSaveDraft}
                onCompleteWalk={() => setInspectorTab('review')}
                suggestedAssignees={peoples}
              />
            )}

            {inspectorTab === 'review' && (
              <ReviewSubmitView
                walkId={currentWalkId}
                area={activeArea}
                subArea={activeSubArea}
                observer={activeObserver}
                dateTime={activeDateTime}
                questions={
                  walkQuestions.length > 0
                    ? walkQuestions
                    : questions.filter((q) => q.area === activeArea).slice(0, 7)
                }
                answers={answers}
                findings={findings}
                onBackToChecklist={() => setInspectorTab('checklist')}
                onSubmitWalk={handleSubmitWalk}
                onGoToAdmin={() => {
                  setProfile({
                    name: 'Plant Administrator',
                    email: 'admin.operations@company.com',
                    role: 'Plant Administrator',
                    department: 'Central Operations',
                  });
                  setAdminTab('findings');
                }}
                onStartNewWalk={handleStartNewWalk}
              />
            )}
          </>
        ) : (
          <AdminLayout
            currentTab={adminTab}
            onOpenSmtp={() => setIsSmtpOpen(true)}
            onExportExcel={handleExportExcel}
            onExportCsv={handleExportCsv}
          >
            {/* Admin Tabs Content */}
            {adminTab === 'dashboard' && (
              <AnalyticsDashboardView
                visits={visits}
                findings={allFindings}
                onUpdateFindingStatus={handleUpdateFindingStatus}
              />
            )}

            {adminTab === 'findings' && (
              <FindingsRegisterView
                findings={allFindings}
                onUpdateStatus={handleUpdateFindingStatus}
                peoples={peoples}
              />
            )}

            {adminTab === 'visits' && <VisitsHistoryView visits={visits} />}

            {adminTab === 'peoples' && (
              <PeoplesView
                peoples={peoples}
                onAddPerson={handleAddPerson}
                onUpdatePerson={(p) => {
                  const updated = peoples.map((item) => (item.id === p.id ? p : item));
                  GembaStorage.savePeoples(updated);
                  GembaStorage.addAuditLog('Admin', 'PERSON_UPDATED', p.id, `Updated ${p.name} assignments`);
                }}
                onDeletePerson={handleDeletePerson}
                onImportPeoples={handleImportPeoples}
                onBulkDeletePeoples={(ids) => GembaStorage.bulkDeletePeoples(ids)}
              />
            )}

            {adminTab === 'questions' && (
              <QuestionBankView
                questions={questions}
                peoples={peoples}
                onToggleActive={handleToggleQuestionActive}
                onAddQuestion={handleAddQuestion}
                onUpdateQuestion={handleUpdateQuestion}
                onDeleteQuestion={handleDeleteQuestion}
                onBulkDeleteQuestions={(ids) => GembaStorage.bulkDeleteQuestions(ids)}
                onBulkSetQuestionsActive={(ids, active) => GembaStorage.bulkSetQuestionsActive(ids, active)}
                onImportQuestions={(newQs) => {
                  const merged = [...newQs, ...questions.filter((q) => !newQs.some((nq) => nq.id === q.id))];
                  handleImportQuestions(merged);
                }}
              />
            )}

            {adminTab === 'emails' && (
              <EmailAlertsView emails={emails} onOpenSmtp={() => setIsSmtpOpen(true)} />
            )}

            {adminTab === 'audit' && (
              <SystemAuditLogView
                logs={auditLogs}
                onClearLogs={() => GembaStorage.clearAuditLogs()}
              />
            )}

            {adminTab === 'workbook' && (
              <WorkbookSourceView
                questions={questions}
                onImportQuestions={handleImportQuestions}
                onResetToSeed={handleResetToSeed}
              />
            )}
          </AdminLayout>
        )}
      </main>

      {/* SMTP Setup Modal */}
      <SmtpModal
        config={smtpConfig}
        isOpen={isSmtpOpen}
        onClose={() => setIsSmtpOpen(false)}
        onSave={(cfg) => {
          setSmtpConfig(cfg);
          GembaStorage.saveSmtpConfig(cfg);
        }}
        onSendTestEmail={handleSendTestEmail}
      />
    </div>
  );
}
