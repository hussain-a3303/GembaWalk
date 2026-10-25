import React, { useState } from 'react';
import { Mail, X, Check, Send, ExternalLink, CheckCircle2, AlertCircle, Key, FileCode } from 'lucide-react';
import { SmtpConfig } from '../../types/gemba';

interface SmtpModalProps {
  config: SmtpConfig;
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: SmtpConfig) => void;
  onSendTestEmail: (testEmail: string) => Promise<{ success: boolean; messageId?: string; error?: string } | void>;
}

export const SmtpModal: React.FC<SmtpModalProps> = ({
  config,
  isOpen,
  onClose,
  onSave,
  onSendTestEmail,
}) => {
  const [provider, setProvider] = useState<SmtpConfig['provider']>(config.provider || 'EmailJS');
  const [host, setHost] = useState(config.host || 'smtp.office365.com');
  const [port, setPort] = useState(config.port || 587);
  const [senderEmail, setSenderEmail] = useState(config.senderEmail || 'ehs.inspection@reckitt.com');
  const [appPassword, setAppPassword] = useState(config.appPassword || '');
  const [displayName, setDisplayName] = useState(config.displayName || 'Reckitt GembaWalk Safety Dispatcher');
  const [testRecipient, setTestRecipient] = useState(config.testRecipient || 'operations.lead@reckitt.com');

  // EmailJS API Keys
  const [emailJsServiceId, setEmailJsServiceId] = useState(config.emailJsServiceId || '');
  const [emailJsTemplateId, setEmailJsTemplateId] = useState(config.emailJsTemplateId || '');
  const [emailJsPublicKey, setEmailJsPublicKey] = useState(config.emailJsPublicKey || '');

  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleProviderSelect = (p: SmtpConfig['provider']) => {
    setProvider(p);
    if (p === 'Office 365') {
      setHost('smtp.office365.com');
      setPort(587);
    } else if (p === 'Outlook / Hotmail') {
      setHost('smtp-mail.outlook.com');
      setPort(587);
    } else if (p === 'Google Gmail') {
      setHost('smtp.gmail.com');
      setPort(587);
    } else if (p === 'EmailJS') {
      setHost('api.emailjs.com');
      setPort(443);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      provider,
      host,
      port,
      senderEmail,
      appPassword,
      displayName,
      testRecipient,
      emailJsServiceId,
      emailJsTemplateId,
      emailJsPublicKey,
      isLiveDispatchEnabled: Boolean(emailJsServiceId && emailJsTemplateId && emailJsPublicKey),
    });
    onClose();
  };

  const handleTest = async () => {
    const trimmed = (testRecipient || '').trim();
    if (!trimmed || !trimmed.includes('@')) {
      setTestResult({
        success: false,
        message: 'Please enter a valid recipient email address (e.g. name@company.com).',
      });
      return;
    }
    setIsSendingTest(true);
    setTestResult(null);

    try {
      const res = await onSendTestEmail(trimmed);
      if (res && !res.success) {
        setTestResult({
          success: false,
          message: res.error || 'Failed to dispatch test email. Check keys.',
        });
      } else {
        setTestResult({
          success: true,
          message: emailJsServiceId && emailJsPublicKey
            ? `Real email dispatched via EmailJS to ${trimmed}!`
            : `Test notification logged and queued for ${trimmed}. (Configure EmailJS keys below for live inbox delivery)`,
        });
      }
    } catch (err: unknown) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Error sending test email.',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070E24]/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#0B1736] text-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 border border-[#1E2E5C] shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#1E2E5C]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-reckitt-pink/20 border border-reckitt-pink/40 text-reckitt-pink flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white">
                Reckitt Email Backend &amp; SMTP Setup
              </h3>
              <p className="text-xs text-slate-300">
                Dispatches real-time findings to responsible assignees via EmailJS or direct SMTP.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Provider Switcher */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-2">
            Select Your Mail Service Solution:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['EmailJS', 'Office 365', 'Outlook / Hotmail', 'Google Gmail'] as SmtpConfig['provider'][]).map(
              (p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleProviderSelect(p)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition ${
                    provider === p
                      ? 'bg-reckitt-pink border-reckitt-pink text-white shadow-xs'
                      : 'bg-[#070E24] border-[#1E2E5C] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p}
                </button>
              )
            )}
          </div>
        </div>

        {/* EmailJS Live Dispatch Configuration Banner */}
        <div className="bg-[#070E24] border border-[#1E2E5C] rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-reckitt-pink" />
              <h4 className="font-bold text-xs text-white uppercase tracking-wider">
                EmailJS Real HTTP API Keys
              </h4>
            </div>
            <a
              href="https://dashboard.emailjs.com/admin"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-reckitt-pink hover:underline font-bold flex items-center gap-1"
            >
              Get EmailJS Keys
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Service ID <span className="text-reckitt-pink">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. service_xxxx"
                value={emailJsServiceId}
                onChange={(e) => setEmailJsServiceId(e.target.value)}
                className="w-full p-2 bg-[#0B1736] border border-[#1E2E5C] rounded-xl text-slate-100 font-mono focus:outline-none focus:border-reckitt-pink"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Template ID <span className="text-reckitt-pink">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. template_xxxx"
                value={emailJsTemplateId}
                onChange={(e) => setEmailJsTemplateId(e.target.value)}
                className="w-full p-2 bg-[#0B1736] border border-[#1E2E5C] rounded-xl text-slate-100 font-mono focus:outline-none focus:border-reckitt-pink"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Public Key <span className="text-reckitt-pink">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. user_xxxx / pub_xxxx"
                value={emailJsPublicKey}
                onChange={(e) => setEmailJsPublicKey(e.target.value)}
                className="w-full p-2 bg-[#0B1736] border border-[#1E2E5C] rounded-xl text-slate-100 font-mono focus:outline-none focus:border-reckitt-pink"
              />
            </div>
          </div>

          {/* Quick instructions box */}
          <div className="bg-[#0B1736]/60 border border-[#1E2E5C]/60 rounded-xl p-2.5 text-[11px] text-slate-300 space-y-1">
            <strong className="text-white block">Required Template Parameters in EmailJS:</strong>
            <p className="text-slate-400">
              Set your template variables to:{' '}
              <code className="text-reckitt-pink font-mono">&#123;&#123;to_name&#125;&#125;</code>,{' '}
              <code className="text-reckitt-pink font-mono">&#123;&#123;to_email&#125;&#125;</code>,{' '}
              <code className="text-reckitt-pink font-mono">&#123;&#123;subject&#125;&#125;</code>,{' '}
              <code className="text-reckitt-pink font-mono">&#123;&#123;message&#125;&#125;</code>,{' '}
              <code className="text-reckitt-pink font-mono">&#123;&#123;finding_id&#125;&#125;</code>,{' '}
              <code className="text-reckitt-pink font-mono">&#123;&#123;area&#125;&#125;</code>,{' '}
              <code className="text-reckitt-pink font-mono">&#123;&#123;severity&#125;&#125;</code>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* SMTP fallback inputs */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block font-bold text-slate-300 mb-1">SMTP Server Host</label>
              <input
                type="text"
                required
                value={host}
                onChange={(e) => setHost(e.target.value)}
                className="w-full p-2.5 bg-[#070E24] border border-[#1E2E5C] rounded-xl text-slate-100 font-mono focus:outline-none focus:border-reckitt-pink"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-300 mb-1">Port</label>
              <input
                type="number"
                required
                value={port}
                onChange={(e) => setPort(Number(e.target.value))}
                className="w-full p-2.5 bg-[#070E24] border border-[#1E2E5C] rounded-xl text-slate-100 font-mono focus:outline-none focus:border-reckitt-pink"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Sender Email Address <span className="text-reckitt-pink">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="ehs.inspection@reckitt.com"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                className="w-full p-2.5 bg-[#070E24] border border-[#1E2E5C] rounded-xl text-slate-100 font-mono focus:outline-none focus:border-reckitt-pink"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-300 mb-1">Sender Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full p-2.5 bg-[#070E24] border border-[#1E2E5C] rounded-xl text-slate-100 focus:outline-none focus:border-reckitt-pink"
              />
            </div>
          </div>

          {/* Test Email Box */}
          <div className="bg-[#070E24] border border-[#1E2E5C] rounded-2xl p-4 space-y-2">
            <label className="block font-bold text-slate-300">
              Send Live Test Email To:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="email"
                placeholder="your.email@reckitt.com"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                className="flex-1 p-2 bg-[#0B1736] border border-[#1E2E5C] rounded-xl text-slate-100 font-mono focus:outline-none focus:border-reckitt-pink"
              />
              <button
                type="button"
                disabled={isSendingTest}
                onClick={handleTest}
                className="px-4 py-2 bg-reckitt-pink hover:bg-reckitt-pink-hover text-white font-bold rounded-xl flex items-center gap-1.5 transition shadow-xs shrink-0 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {isSendingTest ? 'Sending...' : 'Send Test Email'}
              </button>
            </div>

            {testResult && (
              <div
                className={`p-2 rounded-xl text-[11px] font-medium flex items-center gap-1.5 ${
                  testResult.success
                    ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/70 border border-rose-500/40 text-rose-300'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#1E2E5C] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#070E24] hover:bg-slate-800 text-slate-300 font-bold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-reckitt-pink hover:bg-reckitt-pink-hover text-white font-bold rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-reckitt-pink/30"
            >
              <Check className="w-4 h-4" />
              Save &amp; Activate Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
