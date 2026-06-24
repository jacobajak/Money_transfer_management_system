import React, { useState, useEffect } from "react";
import { Employee, Branch, Transaction } from "../types.js";
import { Send, CheckCircle2, Clipboard, Printer, HelpCircle } from "lucide-react";
import { formatCurrencyValue, generateReceiptTemplate } from "../utils.js";

interface SendMoneyFormProps {
  activeEmployee: Employee | null;
  branches: Branch[];
  isOffline: boolean;
  onSendRemittance: (txData: {
    senderName: string;
    senderPhone: string;
    senderIdNum?: string;
    senderLocation: string;
    receiverName: string;
    receiverPhone: string;
    destinationBranchId: string;
    amount: number;
    commission: number;
    currency: "SSP" | "USD";
    notes?: string;
  }) => Promise<Transaction | null>;
}

export const SendMoneyForm: React.FC<SendMoneyFormProps> = ({
  activeEmployee,
  branches,
  isOffline,
  onSendRemittance,
}) => {
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [senderIdNum, setSenderIdNum] = useState("");
  const [senderLocation, setSenderLocation] = useState("");
  
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [destinationBranchId, setDestinationBranchId] = useState("");
  
  const [amount, setAmount] = useState<number | "">("");
  const [commission, setCommission] = useState<number>(0);
  const [isCommissionModified, setIsCommissionModified] = useState(false);
  const [currency, setCurrency] = useState<"SSP" | "USD">("SSP");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedTx, setCompletedTx] = useState<Transaction | null>(null);

  // Auto-set sender location based on current branch city
  useEffect(() => {
    if (activeEmployee && activeEmployee.branchId !== "ALL") {
      const activeBranch = branches.find((b) => b.id === activeEmployee.branchId);
      if (activeBranch) {
        setSenderLocation(activeBranch.city);
      }
    } else {
      setSenderLocation("Juba");
    }

    // Set default destination branch
    const otherBranches = branches.filter((b) => b.id !== activeEmployee?.branchId);
    if (otherBranches.length > 0 && !destinationBranchId) {
      setDestinationBranchId(otherBranches[0].id);
    }
  }, [activeEmployee, branches]);

  // Compute dynamic commission standard rate of 2%
  useEffect(() => {
    if (!isCommissionModified && typeof amount === "number") {
      setCommission(Math.round(amount * 0.02));
    }
  }, [amount, isCommissionModified]);

  const sourceBranch = branches.find((b) => b.id === activeEmployee?.branchId) || branches[0];
  const canModifyCommission = activeEmployee?.role === "OWNER" || activeEmployee?.role === "MANAGER";

  const totalCollected = (Number(amount) || 0) + commission;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!senderName.trim() || !senderPhone.trim() || !receiverName.trim() || !receiverPhone.trim() || !destinationBranchId || !amount) {
      setError("Please fill out all required remittance data fields.");
      return;
    }

    if (amount <= 0) {
      setError("Transit remittance amount must be greater than 0.");
      return;
    }

    setLoading(true);
    try {
      const tx = await onSendRemittance({
        senderName,
        senderPhone,
        senderIdNum: senderIdNum || undefined,
        senderLocation,
        receiverName,
        receiverPhone,
        destinationBranchId,
        amount: Number(amount),
        commission,
        currency,
        notes: notes || undefined,
      });

      if (tx) {
        setCompletedTx(tx);
        // Reset form
        setSenderName("");
        setSenderPhone("");
        setSenderIdNum("");
        setReceiverName("");
        setReceiverPhone("");
        setAmount("");
        setNotes("");
        setIsCommissionModified(false);
      } else {
        setError(" remitting could not be transacted.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected remittance processing bottleneck occurred.");
    } finally {
      setLoading(false);
    }
  };

  const branchNames = React.useMemo(() => {
    const map: { [id: string]: string } = {};
    branches.forEach((b) => {
      map[b.id] = b.name;
    });
    return map;
  }, [branches]);

  if (completedTx) {
    return (
      <div id="send-receipt-screen" className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 md:p-6 max-w-xl mx-auto">
        <div className="text-center mb-5">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-2" />
          <h2 className="font-display font-semibold text-slate-800 text-lg">
            Remittance Registered Successfully!
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isOffline ? (
              <span className="text-amber-500 font-bold tracking-wide animate-pulse">
                ⚠️ Saved Offline Mode (Handshake and Sync pending server connectivity)
              </span>
            ) : (
              "Synchronized immediately on Nile HQ system rails."
            )}
          </p>
        </div>

        <div className="border border-slate-300 rounded-lg bg-slate-50 p-4 mb-5 select-text font-mono text-[11px] leading-relaxed relative">
          <pre className="whitespace-pre-wrap">{generateReceiptTemplate(completedTx, branchNames)}</pre>
          <button
            onClick={() => {
              navigator.clipboard.writeText(generateReceiptTemplate(completedTx, branchNames));
              alert("Receipt copied to clipboard!");
            }}
            className="absolute top-3 right-3 py-1 px-2.5 rounded bg-white hover:bg-slate-100 text-[10px] text-slate-600 border border-slate-200 shadow-sm flex items-center gap-1.5 font-sans"
          >
            <Clipboard className="h-3 w-3" />
            Copy Slip
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              window.print();
            }}
            className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 rounded-lg flex items-center justify-center gap-2 border border-slate-200"
          >
            <Printer className="h-4 w-4" />
            Print Receipt
          </button>
          
          <button
            onClick={() => setCompletedTx(null)}
            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white rounded-lg flex items-center justify-center"
          >
            Create New Transfer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="send-money-form-container" className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
        <Send className="h-5 w-5 text-indigo-600" />
        <h2 className="font-display font-semibold text-slate-800 text-sm md:text-base">
          Send Money Desk Remittance Creation
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="p-4 md:p-5 space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 rounded-lg text-xs font-medium border border-rose-100">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sender Details */}
          <div className="space-y-3.5 p-3.5 bg-slate-50 border border-slate-200/60 rounded-lg">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Sender Details (Origin)
            </h3>
            
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                Sender Full Name *
              </label>
              <input
                type="text"
                required
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="e.g. John Atem Biar"
                className="w-full bg-white px-3 py-1.5 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                Sender Phone Number *
              </label>
              <input
                type="text"
                required
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value)}
                placeholder="e.g. +211 912 345 678"
                className="w-full bg-white px-3 py-1.5 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                  National ID Num (Opt)
                </label>
                <input
                  type="text"
                  value={senderIdNum}
                  onChange={(e) => setSenderIdNum(e.target.value)}
                  placeholder="e.g. ID-848"
                  className="w-full bg-white px-3 py-1.5 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                  Sender Location (Town)
                </label>
                <input
                  type="text"
                  disabled
                  value={senderLocation}
                  className="w-full bg-slate-100 cursor-not-allowed px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Receiver Details */}
          <div className="space-y-3.5 p-3.5 bg-slate-50 border border-slate-200/60 rounded-lg">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Receiver Details (Destination)
            </h3>
            
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                Receiver Full Name *
              </label>
              <input
                type="text"
                required
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                placeholder="e.g. Rebecca Nyandeng Lodu"
                className="w-full bg-white px-3 py-1.5 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                Receiver Phone Number *
              </label>
              <input
                type="text"
                required
                value={receiverPhone}
                onChange={(e) => setReceiverPhone(e.target.value)}
                placeholder="e.g. +211 933 555 666"
                className="w-full bg-white px-3 py-1.5 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                Destination Payout Branch *
              </label>
              <select
                required
                value={destinationBranchId}
                onChange={(e) => setDestinationBranchId(e.target.value)}
                className="w-full bg-white px-3 py-1.5 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="" disabled>Select Target Branch</option>
                {branches
                  .filter((b) => b.id !== activeEmployee?.branchId)
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.city})
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        {/* Amount & Currency Fees */}
        <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 flex items-center justify-between">
              Remittance Amount *
              <span className="text-[9px] font-semibold text-slate-400 font-mono">Limit: 10M SSP</span>
            </label>
            <div className="relative">
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="e.g. 100000"
                className="w-full bg-white pl-14 pr-3 py-1.5 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none font-bold"
              />
              <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-bold uppercase select-none font-mono">
                {currency}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 flex items-center justify-between">
               Remittance Commission FEE
              <span className="text-[9px] font-semibold text-indigo-500 font-sans">
                {isCommissionModified ? "Manual adjustment" : "Standard (2%)"}
              </span>
            </label>
            <div className="relative">
              <input
                type="number"
                disabled={!canModifyCommission}
                value={commission}
                onChange={(e) => {
                  setCommission(Number(e.target.value));
                  setIsCommissionModified(true);
                }}
                className={`w-full ${
                  canModifyCommission ? "bg-white" : "bg-slate-100 cursor-not-allowed text-slate-500"
                } pl-12 pr-3 py-1.5 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none font-semibold`}
              />
              <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-semibold uppercase select-none font-mono">
                {currency}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
              Select Currency Rail
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-0.5 bg-white border border-slate-200 rounded">
              <button
                type="button"
                onClick={() => setCurrency("SSP")}
                className={`py-1 rounded text-xs font-semibold text-center ${
                  currency === "SSP" ? "bg-slate-900 text-white" : "hover:bg-slate-50 text-slate-600"
                }`}
              >
                SSP (Denomination)
              </button>
              <button
                type="button"
                onClick={() => setCurrency("USD")}
                className={`py-1 rounded text-xs font-semibold text-center ${
                  currency === "USD" ? "bg-slate-900 text-white" : "hover:bg-slate-50 text-slate-600"
                }`}
              >
                USD ($ Remittance)
              </button>
            </div>
          </div>
        </div>

        {/* Note area */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
            Operator transit comments (Optional notes)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Cash collected from Bor cargo merchant..."
            className="w-full bg-slate-50 hover:bg-slate-50/50 px-3 py-2 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            rows={2}
          />
        </div>

        {/* Receipt compilation summary */}
        <div className="bg-indigo-950 text-white rounded-lg p-4 font-sans border border-indigo-900 block md:flex md:items-center md:justify-between gap-4">
          <div>
            <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">Remittance Transit Bill</span>
            <div className="text-sm font-semibold text-indigo-100 flex items-baseline gap-1 mt-0.5">
              Collected Amount: <span className="font-bold text-white text-base">{formatCurrencyValue(Number(amount) || 0, currency)}</span>
            </div>
            <div className="text-[10px] text-indigo-300 mt-0.5">
              Remit Service Fee: {formatCurrencyValue(commission, currency)}
            </div>
          </div>
          
          <div className="text-right border-t border-indigo-900 md:border-t-0 pt-2.5 md:pt-0 mt-2.5 md:mt-0 flex flex-col items-start md:items-end w-full md:w-auto">
            <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">Total Cash Collected</span>
            <div className="text-xl font-bold font-mono text-emerald-400">
              {formatCurrencyValue(totalCollected, currency)}
            </div>
            <span className="text-[9px] text-indigo-300 italic block">
              Charged to safe box: {sourceBranch.name} ({sourceBranch.city})
            </span>
          </div>
        </div>

        <button
          type="submit"
          id="btn-process-send"
          disabled={loading}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          <Send className="h-4 w-4" />
          {loading ? "Transacting..." : "Approve Remittance Transit"}
        </button>
      </form>
    </div>
  );
};
