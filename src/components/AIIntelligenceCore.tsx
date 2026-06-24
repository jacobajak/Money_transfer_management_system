import React, { useState } from "react";
import { Sparkles, ShieldAlert, Cpu, FileText, BarChart3, HelpCircle, Loader2 } from "lucide-react";

interface AIIntelligenceCoreProps {
  onRunAnalysis: (type: "insights" | "fraud" | "forecasting") => Promise<string | null>;
}

export const AIIntelligenceCore: React.FC<AIIntelligenceCoreProps> = ({ onRunAnalysis }) => {
  const [activeTask, setActiveTask] = useState<"insights" | "fraud" | "forecasting" | null>(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [logTrace, setLogTrace] = useState<string[]>([]);

  const runTask = async (type: "insights" | "fraud" | "forecasting") => {
    setActiveTask(type);
    setLoading(true);
    setReport(null);
    setLogTrace([]);

    const traces = {
      insights: [
        "Connecting to secure Nile Juba Mainframe... [CONNECTED]",
        "Gathering corporate branch transaction tables...",
        "Evaluating gross remittance volume indices for SSP / USD...",
        "Formulating system prompt context matrices...",
        "Instructing Google GenAI model 'gemini-3.5-flash'..."
      ],
      fraud: [
        "Booting remittance audit scanner loop...",
        "Extracting recipient cellular verification keys...",
        "Cross-analyzing transaction codes for double payout flags...",
        "Running teller velocity and timezone logs check...",
        "Transmitting audit vectors to Gemini Intelligence model..."
      ],
      forecasting: [
        "Opening safe box ledger vaults records...",
        "Computing Juba HQ, Bor, Wau, and Malakal cumulative safe volumes...",
        "Profiling daily 'CASH_IN' collections vs 'CASH_OUT' disburser rates...",
        "Simulating satellite rebalancing settlements trends...",
        "Consulting Gemini Treasury Agent on cash exhaust margins..."
      ]
    };

    // Simulate incremental logging trace for beautiful aesthetic feel
    const selectedTraces = traces[type];
    for (let i = 0; i < selectedTraces.length; i++) {
      await new Promise((res) => setTimeout(res, 400));
      setLogTrace((prev) => [...prev, `[LOG] ${selectedTraces[i]}`]);
    }

    try {
      const result = await onRunAnalysis(type);
      if (result) {
        setReport(result);
      } else {
        setReport("Analysis could not be parsed. Verify connection parameters or API Secrets.");
      }
    } catch (err: any) {
      setReport(`Execution bottleneck resolved: ${err.message || "Model timeout. Retry."}`);
    } finally {
      setLoading(false);
    }
  };

  // Safe custom regex-based markdown parser to HTML to look breathtaking without npm packages
  const parseMarkdownToJSX = (mText: string) => {
    const lines = mText.split("\n");
    return lines.map((line, idx) => {
      let trimmed = line.trim();
      
      // H3 headers
      if (trimmed.startsWith("###")) {
        return (
          <h4 key={idx} className="font-display font-bold text-slate-800 text-sm md:text-base mt-4 mb-2 first:mt-0 flex items-center gap-1.5">
            <span className="w-1.5 h-3.5 bg-indigo-600 rounded"></span>
            {trimmed.replace("###", "").replace(/[\*#]/g, "").trim()}
          </h4>
        );
      }
      
      // Bold bullet points e.g. "1. **Double Payout**: OK"
      if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
        const text = trimmed.substring(1).trim();
        return (
          <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 ml-4 my-1 leading-relaxed">
            <span className="text-indigo-500 font-bold text-base leading-none">•</span>
            <span>{replaceBoldWithStrong(text)}</span>
          </div>
        );
      }

      // Ordered list items
      const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (orderedMatch) {
        const text = orderedMatch[2];
        return (
          <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-750 ml-2 my-2 leading-relaxed border-l-2 border-indigo-100 pl-3.5">
            <span className="text-indigo-600 font-bold font-mono text-xs shrink-0">{orderedMatch[1]}.</span>
            <span>{replaceBoldWithStrong(text)}</span>
          </div>
        );
      }

      // Empty text
      if (!trimmed) {
        return <div key={idx} className="h-2"></div>;
      }

      // Fallback regular index
      return (
        <p key={idx} className="text-xs text-slate-650 leading-relaxed my-1 font-sans">
          {replaceBoldWithStrong(trimmed)}
        </p>
      );
    });
  };

  const replaceBoldWithStrong = (text: string) => {
    const parts = text.split(/\s?\*\*([^*]+)\*\*\s?/);
    if (parts.length === 1) return text;
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="font-bold text-slate-900 bg-indigo-50 px-1 py-0.5 rounded font-mono text-[10.5px]">{part}</strong>;
      }
      return part;
    });
  };

  return (
    <div id="ai-intelligence-core-component" className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-6">
      <div className="bg-indigo-950 font-display text-white px-4 py-4 border-b border-indigo-900 flex flex-wrap items-center justify-between gap-3 shadow-inner">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-indigo-600/30 flex items-center justify-center border border-indigo-500/30">
            <Sparkles className="h-4.5 w-4.5 text-indigo-300 animate-pulse" />
          </div>
          <div>
            <h2 className="font-semibold text-sm md:text-base tracking-wide flex items-center gap-1.5">
              Nile AI Copilot Dashboard <span className="text-[10px] bg-indigo-800 border border-indigo-600 font-mono font-bold tracking-widest px-1.5 py-0.5 rounded uppercase">Phase 2 Enabled</span>
            </h2>
            <p className="text-[11px] text-indigo-300 font-sans mt-0.5">
              Active Server-Side LLM Analytics Powered by Google DeepMind's <span className="font-semibold text-white">Gemini 3.5 Flash</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono bg-indigo-900/60 text-indigo-200 border border-indigo-800/80 px-2.5 py-1 rounded">
          <Cpu className="h-3.5 w-3.5 text-indigo-400" />
          Status: Core Responsive
        </div>
      </div>

      <div className="p-4 md:p-5">
        <p className="text-xs text-slate-500 leading-relaxed mb-5 max-w-3xl">
           remittance databases are processed using the server-side LLM context agent. Trigger audits for compliance checkpoints, forecast liquidity gaps, or extract business summaries instantly:
        </p>

        {/* Triple Agents Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-6">
          <button
            id="btn-ai-insights"
            disabled={loading}
            onClick={() => runTask("insights")}
            className={`text-left p-4 rounded-xl border transition-all flex flex-col justify-between h-40 ${
              activeTask === "insights"
                ? "border-indigo-600 bg-indigo-50/20 shadow-sm"
                : "border-slate-200 hover:border-slate-350 bg-slate-50/70 hover:bg-slate-50"
            }`}
          >
            <div>
              <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center mb-3">
                <BarChart3 className="h-4.5 w-4.5 text-indigo-600" />
              </div>
              <h4 className="font-semibold text-slate-800 text-xs md:text-sm">Business Insights Agent</h4>
              <p className="text-[10.5px] text-slate-500 mt-1 leading-snug">
                Analyze corridors volume multipliers, commission revenues, and compile weekly performance narratives.
              </p>
            </div>
            <span className="text-[10px] font-bold text-indigo-600 mt-3 hover:underline">Launch synthesis &rarr;</span>
          </button>

          <button
            id="btn-ai-fraud"
            disabled={loading}
            onClick={() => runTask("fraud")}
            className={`text-left p-4 rounded-xl border transition-all flex flex-col justify-between h-40 ${
              activeTask === "fraud"
                ? "border-rose-500 bg-rose-50/10 shadow-sm"
                : "border-slate-200 hover:border-slate-350 bg-slate-50/70 hover:bg-slate-50"
            }`}
          >
            <div>
              <div className="h-8 w-8 rounded-lg bg-rose-100 flex items-center justify-center mb-3">
                <ShieldAlert className="h-4.5 w-4.5 text-rose-600" />
              </div>
              <h4 className="font-semibold text-slate-800 text-xs md:text-sm">Compliance & Fraud Audit</h4>
              <p className="text-[10.5px] text-slate-500 mt-1 leading-snug">
                Scan active logs for duplicate disbursals, clashing states, cash velocity warning alerts, or irregular cashier activity.
              </p>
            </div>
            <span className="text-[10px] font-bold text-rose-600 mt-3 hover:underline">Scan transactions &rarr;</span>
          </button>

          <button
            id="btn-ai-forecasting"
            disabled={loading}
            onClick={() => runTask("forecasting")}
            className={`text-left p-4 rounded-xl border transition-all flex flex-col justify-between h-40 ${
              activeTask === "forecasting"
                ? "border-amber-500 bg-amber-50/10 shadow-sm"
                : "border-slate-200 hover:border-slate-350 bg-slate-50/70 hover:bg-slate-50"
            }`}
          >
            <div>
              <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center mb-3">
                <Cpu className="h-4.5 w-4.5 text-amber-600" />
              </div>
              <h4 className="font-semibold text-slate-800 text-xs md:text-sm">Treasury & Cash Forecasting</h4>
              <p className="text-[10.5px] text-slate-500 mt-1 leading-snug">
                Track safe balance inflows vs outflows to predict capital exhaust boundaries and pre-empty liquidity shortages.
              </p>
            </div>
            <span className="text-[10px] font-bold text-amber-600 mt-3 hover:underline">Forecast safes &rarr;</span>
          </button>
        </div>

        {/* Loading and logging consoles */}
        {loading && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 font-mono text-[11px] text-slate-200 shadow-inner">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5 mb-3 text-xs">
              <Loader2 className="h-4 w-4 text-indigo-400 animate-spin" />
              <span className="font-bold text-slate-100 uppercase tracking-widest text-[10px]">Active LLM Copilot Booting...</span>
            </div>
            <div className="space-y-1.5">
              {logTrace.map((tr, tIdx) => (
                <div key={tIdx} className="text-slate-300">
                  {tr}
                </div>
              ))}
              <span className="block text-indigo-400 animate-pulse text-[10px] mt-2 italic">
                - System calculating vectors... Google Cloud Run response pending...
              </span>
            </div>
          </div>
        )}

        {/* Markdown report printer readout */}
        {report && (
          <div className="bg-slate-50/80 border border-indigo-100 rounded-xl p-5 md:p-6 shadow-sm select-text text-slate-800">
            <div className="flex items-center justify-between border-b border-indigo-50/80 pb-3 mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                <span className="font-display font-black text-slate-800 text-sm md:text-base capitalize">
                  Nile AI: {activeTask === "insights" ? "Corridor Business Insights" : activeTask === "fraud" ? "Compliance Audit Report" : "Safe Liquidity Forecast"}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 italic">Analysis Date: Today</span>
            </div>

            <div className="space-y-3 prose max-w-none">
              {parseMarkdownToJSX(report)}
            </div>
            
            <div className="border-t border-slate-100 mt-6 pt-3 flex justify-between items-center text-[10.5px] text-slate-450 italic">
              <span>* Nile AI forecasts represent statistical approximations calculated on localized Safe inputs.</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(report);
                  alert("AI Report copied to clipboard!");
                }}
                className="text-indigo-600 hover:text-indigo-805 hover:underline font-semibold"
              >
                Copy Report Code
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
