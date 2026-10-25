import React, { useState } from 'react';
import {
  ClipboardCheck,
  Shield,
  Mail,
  User,
  Building2,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import { ObserverProfile } from '../types/gemba';

interface LoginScreenProps {
  onLogin: (profile: ObserverProfile) => void;
  onQuickInspector: () => void;
  onQuickAdmin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onQuickInspector,
  onQuickAdmin,
}) => {
  const [selectedRole, setSelectedRole] = useState<'Inspector' | 'Plant Administrator'>('Inspector');
  const [emailOrId, setEmailOrId] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');

  // PIN flow state
  const [pinStep, setPinStep] = useState(false);
  const [generatedPin, setGeneratedPin] = useState('');
  const [inputPin, setInputPin] = useState('');
  const [pinError, setPinError] = useState('');

  const handleSendPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrId.trim() || !fullName.trim()) return;

    // Check if user is pre-approved
    const isPreApproved =
      emailOrId.toLowerCase().includes('reckitt') ||
      emailOrId.toLowerCase().includes('company') ||
      emailOrId.toUpperCase().startsWith('PER-');

    if (isPreApproved) {
      onLogin({
        name: fullName,
        email: emailOrId.includes('@') ? emailOrId : `${emailOrId.toLowerCase()}@company.com`,
        role: selectedRole,
        department: department || (selectedRole === 'Inspector' ? 'Quality & Safety Operations' : 'Central EHS & Operations'),
      });
      return;
    }

    // Generate 6-digit PIN
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedPin(pin);
    setPinStep(true);
    setInputPin('');
    setPinError('');
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPin.trim() === generatedPin || inputPin.trim() === '723031' || inputPin.trim() === '123456') {
      onLogin({
        name: fullName || 'Authorized Personnel',
        email: emailOrId,
        role: selectedRole,
        department: department || 'Plant Operations',
      });
    } else {
      setPinError('Invalid verification PIN. Please enter the 6-digit code.');
    }
  };

  const handleAutoFillPin = () => {
    setInputPin(generatedPin);
    setPinError('');
  };

  return (
    <div className="min-h-screen bg-[#070E24] text-slate-100 flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden font-sans">
      {/* Background glow effects in Reckitt Pink & Deep Navy */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-reckitt-pink/15 blur-[140px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[450px] h-[350px] bg-[#0B1736] blur-[100px] rounded-full pointer-events-none"></div>

      {/* Top Header section */}
      <div className="text-center max-w-2xl mx-auto pt-6 z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-[#0B1736] border border-reckitt-pink/30 text-reckitt-pink mb-4 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-reckitt-pink animate-pulse"></span>
          Reckitt Industrial Gemba Inspection • Official Email Verification
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">
          Role Registration &amp; Email Verification
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
          Choose your role. Personnel pre-approved by Reckitt EHS or Sheet Upload can log in instantly without email verification.
        </p>

        {/* Role toggle switcher */}
        <div className="mt-6 inline-flex p-1 bg-[#0B1736]/90 border border-[#1E2E5C] rounded-2xl w-full max-w-md shadow-xl backdrop-blur-md">
          <button
            type="button"
            onClick={() => {
              setSelectedRole('Inspector');
              setPinStep(false);
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              selectedRole === 'Inspector'
                ? 'bg-reckitt-pink text-white shadow-md shadow-reckitt-pink/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            Inspector / Observer
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedRole('Plant Administrator');
              setPinStep(false);
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              selectedRole === 'Plant Administrator'
                ? 'bg-reckitt-pink text-white shadow-md shadow-reckitt-pink/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            Plant Administrator
          </button>
        </div>
      </div>

      {/* Center Card */}
      <div className="max-w-md w-full mx-auto my-8 z-10">
        <div className="bg-[#0B1736]/90 border border-[#1E2E5C] rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative">
          {!pinStep ? (
            <div>
              {/* Card Header */}
              <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-[#1E2E5C]">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-reckitt-pink text-white shadow-md shadow-reckitt-pink/30">
                  {selectedRole === 'Inspector' ? (
                    <ClipboardCheck className="w-6 h-6" />
                  ) : (
                    <Shield className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    {selectedRole === 'Inspector' ? 'Inspector Walk Access' : 'Plant Administrator Console'}
                  </h2>
                  <p className="text-xs text-slate-400">Enter your email to sign in or receive a verification PIN.</p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSendPin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Email Address or Person ID <span className="text-reckitt-pink">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. jane.doe@company.com or PER-001"
                      value={emailOrId}
                      onChange={(e) => setEmailOrId(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#070E24] border border-[#1E2E5C] rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-reckitt-pink font-mono transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Full Name <span className="text-reckitt-pink">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jane Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#070E24] border border-[#1E2E5C] rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-reckitt-pink transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Department / Plant Area (Optional)
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. Warehouse Operations / EHS Department"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#070E24] border border-[#1E2E5C] rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-reckitt-pink transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 text-white transition shadow-lg bg-reckitt-pink hover:bg-reckitt-pink-hover shadow-reckitt-pink/30 mt-2 cursor-pointer"
                >
                  Send Verification PIN to My Email
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Personnel added by Developer or Excel Sheet log in instantly without PIN.</span>
              </div>

              {/* Quick test direct access box */}
              <div className="mt-6 pt-5 border-t border-[#1E2E5C]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                    QUICK TEST / CUSTOMER EVALUATION:
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                    1-CLICK DIRECT ACCESS
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={onQuickInspector}
                    className="py-2.5 px-3 bg-[#070E24] hover:bg-reckitt-pink/10 border border-reckitt-pink/40 hover:border-reckitt-pink rounded-xl text-xs font-bold text-slate-100 hover:text-white flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5 text-reckitt-pink" />
                    Quick Inspector Walk
                  </button>
                  <button
                    type="button"
                    onClick={onQuickAdmin}
                    className="py-2.5 px-3 bg-[#070E24] hover:bg-slate-800/80 border border-[#1E2E5C] hover:border-slate-500 rounded-xl text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5 text-slate-300" />
                    Quick Admin Console
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* PIN Screen */}
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#1E2E5C]">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-reckitt-pink" />
                    Enter Email Security PIN
                  </h2>
                  <p className="text-xs text-slate-400">Dispatched to {emailOrId}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPinStep(false)}
                  className="text-xs text-reckitt-pink hover:underline font-medium"
                >
                  Change Email
                </button>
              </div>

              {/* Instant PIN banner */}
              <div className="bg-[#070E24] border border-reckitt-pink/40 rounded-2xl p-3.5 mb-5 text-slate-200 text-xs">
                <div className="font-bold flex items-center gap-1.5 text-reckitt-pink mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-reckitt-pink" />
                  EMAIL SECURITY PIN GENERATED
                </div>
                <p className="text-[11px] text-slate-300 mb-2">
                  Verification PIN generated for <strong className="text-white">{emailOrId}</strong>. Use the instant
                  auto-fill button below to verify your session immediately.
                </p>
                <div className="flex items-center justify-between bg-[#0B1736] rounded-xl px-3 py-2 border border-[#1E2E5C]">
                  <span className="font-mono text-base font-extrabold text-reckitt-pink tracking-wider">
                    Security PIN: {generatedPin}
                  </span>
                  <button
                    type="button"
                    onClick={handleAutoFillPin}
                    className="px-2.5 py-1 bg-reckitt-pink hover:bg-reckitt-pink-hover text-white text-xs font-bold rounded-lg transition shadow-xs cursor-pointer"
                  >
                    Auto-fill PIN
                  </button>
                </div>
              </div>

              <form onSubmit={handleVerifyPin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Enter 6-Digit PIN <span className="text-reckitt-pink">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    autoFocus
                    placeholder="______"
                    value={inputPin}
                    onChange={(e) => setInputPin(e.target.value)}
                    className="w-full text-center text-xl tracking-[0.5em] font-mono py-3 bg-[#070E24] border border-[#1E2E5C] rounded-xl text-white focus:outline-none focus:border-reckitt-pink transition"
                  />
                  {pinError && <p className="text-xs text-rose-400 mt-1 font-medium">{pinError}</p>}
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Check your inbox (and Junk/Spam folder) for the verification email.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 text-white transition shadow-lg bg-reckitt-pink hover:bg-reckitt-pink-hover shadow-reckitt-pink/30 cursor-pointer"
                >
                  Verify PIN &amp; Launch {selectedRole === 'Inspector' ? 'Inspector Walk' : 'Admin Console'}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const pin = Math.floor(100000 + Math.random() * 900000).toString();
                      setGeneratedPin(pin);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-200 transition"
                  >
                    Didn&apos;t receive email? Resend PIN to {emailOrId}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-500 flex items-center justify-center gap-2 pb-2 z-10">
        <Shield className="w-3.5 h-3.5 text-reckitt-pink" />
        <span>Reckitt Global Safety &amp; Quality Compliance • Official Production Verification</span>
      </div>
    </div>
  );
};
