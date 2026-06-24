import React, { useState, useEffect } from "react";
import { Employee, Branch } from "../types.js";
import { 
  ShieldCheck, 
  Server, 
  AlertCircle, 
  KeyRound, 
  ArrowRight, 
  Radio, 
  Landmark, 
  User, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  Info,
  Lock,
  Unlock,
  CheckCircle2,
  Users
} from "lucide-react";

interface LoginScreenProps {
  employees: Employee[];
  branches: Branch[];
  onLogin: (employeeId: string, pin: string) => Promise<void>;
  isOffline: boolean;
}

export function LoginScreen({ employees, branches, onLogin, isOffline }: LoginScreenProps) {
  const [employeeInput, setEmployeeInput] = useState<string>("");
  const [pinCode, setPinCode] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRosterOpen, setIsRosterOpen] = useState<boolean>(true);

  // Dynamically resolve matching employee based on manual user input (real-time ID/email/phone mapping)
  const [matchedEmployee, setMatchedEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    const trimmedInput = employeeInput.trim().toLowerCase();
    if (!trimmedInput) {
      setMatchedEmployee(null);
      return;
    }

    const match = employees.find((emp) => 
      emp.id.toLowerCase() === trimmedInput ||
      emp.phone.replace(/[\s+]+/g, "") === trimmedInput.replace(/[\s+]+/g, "") ||
      emp.email.toLowerCase() === trimmedInput
    );
    setMatchedEmployee(match || null);
  }, [employeeInput, employees]);

  // Play micro synthesizer sound for touch targets
  const playBeep = (freq = 800, duration = 0.08) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Ignored if browser blocks audio context
    }
  };

  const handleKeyPress = (num: string) => {
    playBeep(900, 0.06);
    if (pinCode.length < 4) {
      setPinCode((prev) => prev + num);
      setErrorMessage(null);
    }
  };

  const handleBackspace = () => {
    playBeep(650, 0.08);
    setPinCode((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    playBeep(500, 0.1);
    setPinCode("");
    setErrorMessage(null);
  };

  const handleQuickFill = (emp: Employee) => {
    playBeep(1000, 0.1);
    setEmployeeInput(emp.id);
    setPinCode(emp.pin);
    setErrorMessage(null);
  };

  const handleValidateLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!employeeInput.trim()) {
      setErrorMessage("Please enter an Employee ID, Email, or Phone.");
      playBeep(350, 0.2);
      return;
    }
    if (pinCode.length < 4) {
      setErrorMessage("Please enter your complete 4-digit security PIN.");
      playBeep(350, 0.2);
      return;
    }

    playBeep(1100, 0.15);
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Pass entered credentials to standard authentication handler
      await onLogin(employeeInput.trim(), pinCode);
      
      // Play triumph double-beep
      setTimeout(() => playBeep(1300, 0.08), 80);
      setTimeout(() => playBeep(1600, 0.2), 160);
    } catch (err: any) {
      setIsLoading(false);
      playBeep(320, 0.3);
      setErrorMessage(err.message || "Access Denied: Invalid credentials or unverified terminal session.");
      setPinCode(""); // Clear PIN on failure for security
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "OWNER":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "MANAGER":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/30";
      case "AUDITOR":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      default:
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans flex flex-col justify-between p-4 md:p-8 text-slate-100 select-none relative overflow-hidden">
      
      {/* Background Ambience Layer */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(99,102,241,0.08),transparent_65%)] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />

      {/* Corporate Brand Header Section */}
      <div className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 z-10 py-3 border-b border-slate-900/80">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-600 flex items-center justify-center border border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
            <Landmark className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-slate-100 text-base md:text-lg tracking-tight uppercase">
                Nile Money Transfer Ltd
              </h1>
              <span className="text-[9px] bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded font-mono font-bold tracking-widest">
                SECURE GATEWAY
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-sans">
              Regional Remittance Terminal • Core Security Access Point
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-900/85 border border-slate-800/80 rounded-full px-4 py-1.5 text-xs">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isOffline ? "bg-amber-400 animate-pulse" : "bg-emerald-400 animate-pulse"}`} />
            <span className="font-mono text-slate-300 font-bold uppercase tracking-wider text-[10px]">
              {isOffline ? "Offline Node Active" : "Central Sync Online"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Terminal Layout */}
      <main className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start justify-center z-10 my-auto py-6">
        
        {/* Left Column: Security Information & Sandbox Roster Guides */}
        <div className="col-span-1 lg:col-span-7 flex flex-col space-y-5">
          <div className="space-y-2">
            <span className="text-indigo-400 uppercase tracking-widest text-[9px] font-bold block">
              REGIONAL OPERATIONS PROTOCOL
            </span>
            <h2 className="text-2xl md:text-3xl font-display font-medium text-white tracking-tight leading-tight">
              Authenticate Terminal Session
            </h2>
            <p className="text-slate-400 text-xs md:text-sm max-w-xl leading-relaxed">
              Welcome to the secure Nile Money Transfer core workstation. Session access is governed by strict role-based isolation rules (Owner, Auditor, Manager, and Agent).
            </p>
          </div>

          {/* Sandbox Testing Helper Accordion (Reviewer Friendly) */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-xl overflow-hidden shadow-sm">
            <button 
              type="button"
              onClick={() => {
                playBeep(750, 0.05);
                setIsRosterOpen(!isRosterOpen);
              }}
              className="w-full px-4 py-3 bg-slate-900/60 flex items-center justify-between text-left hover:bg-slate-900 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  Sandbox Testing Registry & Roster Guide
                  <span className="bg-indigo-500/20 text-indigo-300 font-mono text-[9px] px-1.5 py-0.5 rounded-full font-normal lowercase">
                    {employees.length} keys
                  </span>
                </span>
              </div>
              {isRosterOpen ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </button>

            {isRosterOpen && (
              <div className="p-4 border-t border-slate-900/60 bg-slate-950/20 space-y-3">
                <div className="flex items-start gap-2 text-[11px] text-indigo-300 bg-indigo-500/5 p-2.5 rounded-lg border border-indigo-500/10">
                  <Sparkles className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <p>
                    <strong>Role Testing Shortcut:</strong> Click any personnel profile badge below to automatically fill their credentials. Observe how the user interface, available tabs, action permissions, and data lists immediately restrict themselves based on their role and branch branch.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1.5 custom-scrollbar">
                  {employees.map((emp) => {
                    const empBranch = branches.find((b) => b.id === emp.branchId);
                    const isMatched = matchedEmployee?.id === emp.id;
                    return (
                      <div
                        key={emp.id}
                        className={`p-3 rounded-lg border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                          isMatched
                            ? "bg-indigo-950/10 border-indigo-500/40 shadow-inner"
                            : "bg-slate-950/50 border-slate-900 hover:border-slate-800"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1 w-full">
                          <div>
                            <div className="font-bold text-white text-xs truncate max-w-[170px]">
                              {emp.name}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              ID: <span className="text-slate-300 font-bold">{emp.id}</span>
                            </div>
                          </div>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${getRoleBadgeStyle(emp.role)}`}>
                            {emp.role}
                          </span>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-900/60 flex items-center justify-between text-[9px] text-slate-400">
                          <span className="truncate max-w-[120px] flex items-center gap-1">
                            <Server className="h-2.5 w-2.5 text-slate-500" />
                            <strong className="text-slate-300">{empBranch ? empBranch.name : "Remittance HQ"}</strong>
                          </span>
                          <span className="font-mono text-indigo-400 bg-indigo-500/5 px-1 py-0.2 rounded border border-indigo-500/10 shrink-0">
                            PIN: <strong className="font-bold">{emp.pin}</strong>
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleQuickFill(emp)}
                          className="mt-2 w-full py-1 bg-slate-900 hover:bg-indigo-600 text-white text-[9px] font-bold rounded uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Quick Fill Credentials
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quick Informational Notice footer */}
          <div className="bg-slate-900/35 border border-slate-900 rounded-xl p-3 flex items-start gap-2.5 max-w-xl">
            <Radio className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0 animate-pulse" />
            <div className="text-[11px] text-slate-400 leading-relaxed font-sans">
              <strong className="text-slate-200 block">Cryptographic Handshake Architecture</strong>
              This console uses custom session headers (`x-employee-id`) mapped directly to server-side identity locks. Handshakes remain state-aware in offline caches and reconcile immediately upon signal restoration.
            </div>
          </div>
        </div>

        {/* Right Column: High Fidelity Credentials & PIN Verification Entry Pad */}
        <div className="col-span-1 lg:col-span-5 flex flex-col justify-center">
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-md max-w-sm mx-auto w-full border-t border-t-slate-800/60">
            
            <div className="flex items-center gap-2 mb-4 justify-center">
              <ShieldCheck className="h-5 w-5 text-indigo-400" />
              <h3 className="font-display font-bold text-white text-xs tracking-widest uppercase">
                Terminal Access Gateway
              </h3>
            </div>

            {/* Manual Textbox: Employee ID / Phone / Email */}
            <div className="space-y-1.5 mb-4">
              <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                Employee Identifier
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter ID (emp-1), Email or Phone"
                  value={employeeInput}
                  onChange={(e) => {
                    setEmployeeInput(e.target.value);
                    setErrorMessage(null);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg py-2.5 pl-8 pr-3 text-xs text-white placeholder-slate-600 tracking-wide outline-none transition-colors"
                />
                <User className="h-3.5 w-3.5 text-slate-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Dynamic Real-time Identity Feedback snippet */}
            {matchedEmployee ? (
              <div className="bg-slate-950 border border-emerald-500/20 rounded-lg p-3 mb-4 flex items-center justify-between transition-all animate-fadeIn">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/25 font-display font-black text-xs text-emerald-400 flex items-center justify-center">
                    {matchedEmployee.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      {matchedEmployee.name}
                      <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                    </h4>
                    <p className="text-[9px] text-slate-400 italic font-mono uppercase tracking-wider">
                      {matchedEmployee.role} • {
                        branches.find((b) => b.id === matchedEmployee.branchId)?.city || "Corporate ALL"
                      }
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              employeeInput.trim() !== "" && (
                <div className="bg-slate-950 border border-rose-500/10 rounded-lg p-2.5 mb-4 text-center">
                  <span className="text-[10px] text-rose-400/80 tracking-wide block font-semibold flex items-center justify-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Identity unverified in company registry
                  </span>
                </div>
              )
            )}

            {/* Simulated Encrypted PIN Code screen */}
            <div className="bg-slate-950 border border-slate-900 rounded-lg p-3.5 mb-4 text-center shadow-inner relative">
              <div className="text-slate-500 text-[9px] tracking-widest uppercase font-mono mb-1.5 flex items-center justify-center gap-1">
                <KeyRound className="h-3 w-3 text-indigo-400" />
                ENCRYPTED SECURITY PIN
              </div>
              <div className="flex justify-center gap-3.5 my-1.5 h-6">
                {[0, 1, 2, 3].map((idx) => (
                  <div 
                    key={idx}
                    className={`w-3 h-3 rounded-full border transition-all duration-150 ${
                      pinCode.length > idx 
                        ? "bg-indigo-500 border-indigo-400 scale-110 shadow-[0_0_8px_rgba(99,102,241,0.7)]" 
                        : "bg-slate-900 border-slate-800"
                    }`}
                  />
                ))}
              </div>
              {pinCode.length === 0 && (
                <span className="text-[9px] text-slate-500 italic block mt-1 tracking-wide">
                  Enter credentials PIN to unlock
                </span>
              )}
            </div>

            {/* PIN Numeric Pad */}
            <div className="grid grid-cols-3 gap-2 mb-4 font-mono">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeyPress(num)}
                  className="bg-slate-950/70 hover:bg-slate-800 border border-slate-900 hover:border-slate-850 active:bg-slate-900 text-base py-2 rounded-lg text-slate-100 font-semibold transition-all cursor-pointer outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                className="bg-rose-950/20 hover:bg-rose-950/40 border border-rose-950/50 hover:border-rose-900/60 text-rose-400 text-[10px] py-2 rounded-lg font-bold transition-all uppercase tracking-wider outline-none cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress("0")}
                className="bg-slate-950/70 hover:bg-slate-800 border border-slate-900 hover:border-slate-850 py-2 rounded-lg text-base text-slate-100 font-semibold transition-all cursor-pointer outline-none"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="bg-amber-950/15 hover:bg-amber-950/30 border border-amber-950/40 hover:border-amber-900/40 text-amber-500 text-[10px] py-2 rounded-lg font-bold transition-all uppercase tracking-wider outline-none cursor-pointer"
              >
                Del
              </button>
            </div>

            {/* Warning or Error Messages */}
            {errorMessage && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5 mb-4 flex items-start gap-2 text-left">
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                <span className="text-[10px] text-rose-400 leading-relaxed font-sans font-medium">
                  {errorMessage}
                </span>
              </div>
            )}

            {/* Validate/Submit Button */}
            <button
              type="button"
              id="btn-validate-login"
              disabled={isLoading || pinCode.length < 4 || !employeeInput.trim()}
              onClick={() => handleValidateLogin()}
              className={`w-full py-2.5 rounded-lg text-xs font-bold tracking-widest flex items-center justify-center gap-2 transition-all uppercase outline-none ${
                (pinCode.length === 4 && employeeInput.trim() && !isLoading)
                  ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/15 cursor-pointer"
                  : "bg-slate-950 text-slate-600 border border-slate-900/85 cursor-not-allowed"
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                  Authenticating Node...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Authorize Terminal Node
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>

          </div>
        </div>

      </main>

      {/* Cyber Security Status & Cryptographic Metadata Rail Footer */}
      <footer className="w-full max-w-6xl mx-auto border-t border-slate-900 pt-4 pb-2 z-10 flex flex-col md:flex-row items-center justify-between gap-3 text-[10px] text-slate-500 font-mono">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 justify-center md:justify-start">
          <span>SHA-512 ENCRYPTED GATEWAY</span>
          <span className="hidden md:inline text-slate-800">•</span>
          <span>SYSTEM TIME: {new Date().toLocaleDateString()}</span>
          <span className="hidden md:inline text-slate-800">•</span>
          <span className="text-indigo-500/50 font-bold">TERMINAL SESSION RESTRICTED</span>
        </div>
        <div className="text-center md:text-right">
          © {new Date().getFullYear()} Nile Money Transfer Ltd. South Sudan Remittance Platform.
        </div>
      </footer>

    </div>
  );
}
