import React, { useState, useEffect } from "react";
import { Employee, Branch, Transaction } from "../types.js";
import { Coins, Search, ShieldAlert, CheckCircle, Clock, AlertTriangle, FileText, Clipboard, Printer, XCircle } from "lucide-react";
import { formatCurrencyValue, generateReceiptTemplate } from "../utils.js";

interface ReceiveMoneyFormProps {
  activeEmployee: Employee | null;
  branches: Branch[];
  transactions: Transaction[];
  isOffline: boolean;
  prefilledCode?: string;
  onProcessPayout: (payoutData: {
    transactionCode: string;
    pin: string;
    receiverPhone: string;
    payoutAgentId: string;
    payoutBranchId: string;
  }) => Promise<Transaction | null>;
}

export const ReceiveMoneyForm: React.FC<ReceiveMoneyFormProps> = ({
  activeEmployee,
  branches,
  transactions,
  isOffline,
  prefilledCode = "",
  onProcessPayout,
}) => {
  const [searchTerm, setSearchTerm] = useState(prefilledCode);
  const [matchedTx, setMatchedTx] = useState<Transaction | null>(null);
  
  const [pinInput, setPinInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successTx, setSuccessTx] = useState<Transaction | null>(null);

  useEffect(() => {
    if (prefilledCode) {
      setSearchTerm(prefilledCode);
      handleSearch(prefilledCode);
    }
  }, [prefilledCode, transactions]);

  const handleSearch = (termToSearch: string) => {
    setError(null);
    setSuccessTx(null);
    const cleaned = termToSearch.trim().toUpperCase();
    if (!cleaned) return;

    // Search by code, recipient phone, or PIN
    const tx = transactions.find(
      (t) =>
        t.transactionCode.toUpperCase() === cleaned ||
        t.receiverPhone.includes(cleaned) ||
        t.pin === cleaned
    );

    if (tx) {
      setMatchedTx(tx);
      // Pre-fill recipient phone verification field for helper
      setPhoneInput(tx.receiverPhone);
    } else {
      setMatchedTx(null);
      setError("No pending money transfer matches that Code, PIN, or Phone.");
    }
  };

  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!matchedTx) return;

    if (!pinInput.trim()) {
      setError("Beneficiary Security PIN is required to authorize safe disburser.");
      return;
    }

    if (pinInput !== matchedTx.pin) {
      setError("Access Denied: Invalid Security PIN. Payout rejected.");
      return;
    }

    if (!phoneInput.trim() || phoneInput.trim() !== matchedTx.receiverPhone) {
      setError("Verification Failed: Recipient phone number does not match registered transfer records.");
      return;
    }

    if (!activeEmployee || activeEmployee.branchId === "ALL") {
      setError("Full access audit role cannot authorize physical safe cash disburser. Switch to active local Branch agent.");
      return;
    }

    setLoading(true);
    try {
      const updated = await onProcessPayout({
        transactionCode: matchedTx.transactionCode,
        pin: pinInput,
        receiverPhone: phoneInput,
        payoutAgentId: activeEmployee.id,
        payoutBranchId: activeEmployee.branchId,
      });

      if (updated) {
        setSuccessTx(updated);
        setMatchedTx(null);
        setPinInput("");
        setPhoneInput("");
        setSearchTerm("");
      } else {
        setError("Physical cash disburser could not be processed on Nile Server.");
      }
    } catch (err: any) {
      setError(err.message || "Remittance payout authorize bottleneck resolved inside secure server node.");
    } finally {
      setLoading(false);
    }
  };

  const currentBranch = branches.find((b) => b.id === activeEmployee?.branchId);
  
  // Destination mismatch warnings
  const isBranchMismatch = matchedTx && activeEmployee && activeEmployee.branchId !== "ALL" && matchedTx.destinationBranchId !== activeEmployee.branchId;
  const destinationBranchObj = matchedTx ? branches.find(b => b.id === matchedTx.destinationBranchId) : null;

  const branchNames = React.useMemo(() => {
    const map: { [id: string]: string } = {};
    branches.forEach((b) => {
      map[b.id] = b.name;
    });
    return map;
  }, [branches]);

  return (
    <div id="receive-money-desk-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Search and validation col */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
          <h3 className="font-display font-semibold text-slate-800 text-sm mb-3">
            Remittance Retrieval and Verification
          </h3>
          
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type Transaction Code or PIN..."
                className="w-full bg-slate-50 pl-9 pr-3 py-1.5 border border-slate-200 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none font-bold uppercase"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch(searchTerm);
                }}
              />
            </div>
            <button
              type="button"
              id="btn-search-remittance"
              onClick={() => handleSearch(searchTerm)}
              className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
            >
              Search
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 font-mono">
            Audit remit identifiers: e.g. MT-12845-JUBA or Security PIN 1357
          </p>
        </div>

        {/* Payout receipts generator */}
        {successTx && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 text-center">
            <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="font-semibold text-slate-800 text-sm">Disbursed and Handed Out</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cash disburser is finalized. Recorded under Safe Node: {branchNames[successTx.payoutBranchId || ""] || successTx.payoutBranchId}
            </p>

            <div className="border border-slate-200 bg-slate-50 p-3 my-3 text-left font-mono text-[9px] select-text relative">
              <pre className="whitespace-pre-wrap">{generateReceiptTemplate(successTx, branchNames)}</pre>
            </div>

            <button
              onClick={() => setSuccessTx(null)}
              className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-[11px] text-slate-600 font-semibold rounded"
            >
              Ready for Next Receival
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 rounded-lg text-xs font-semibold border border-rose-100 flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Verification details readout panel col */}
      <div className="lg:col-span-7">
        {matchedTx ? (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-indigo-600" />
                <span className="font-display font-semibold text-slate-850 text-sm">
                  Active Remittance Record: <span className="font-bold text-slate-900 font-mono">{matchedTx.transactionCode}</span>
                </span>
              </div>
              <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded">
                {matchedTx.status}
              </span>
            </div>

            <div className="p-4 md:p-5 space-y-4">
              
              {/* Branch mismatch alert error warning */}
              {isBranchMismatch && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-amber-800">
                      Destination Node Mismatch Warning!
                    </h5>
                    <p className="text-[11px] text-amber-700 leading-relaxed mt-0.5 font-medium">
                      This transfer was dispatched to payout at <b>{destinationBranchObj?.name} ({destinationBranchObj?.city})</b>, but you are currently checking in at <b>{currentBranch?.name} ({currentBranch?.city})</b>.
                      <br />
                      <span className="font-bold text-amber-800">Operational check:</span> Paying out at non-matching terminals degrades physical safe box liquidity balance corridors. Ensure managerial confirmation.
                    </p>
                  </div>
                </div>
              )}

              {/* Status block checker */}
              {matchedTx.status === "PAID" && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-start gap-2.5">
                  <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold">This Transfer has already been disbursed:</span>
                    <p className="mt-1 font-mono text-[10px] text-emerald-700 leading-relaxed">
                      Payout Agent: {matchedTx.payoutAgentName || matchedTx.payoutAgentId}
                      <br />
                      Payout Date: {new Date(matchedTx.payoutAt || "").toLocaleString()}
                      <br />
                      Payout Location: {branchNames[matchedTx.payoutBranchId || ""] || matchedTx.payoutBranchId}
                    </p>
                  </div>
                </div>
              )}

              {matchedTx.status === "CANCELLED" && (
                <div className="p-3 px-3.5 bg-rose-50 border border-rose-250 text-rose-800 rounded-lg flex items-start gap-2.5">
                  <XCircle className="h-4 w-4 text-rose-600 mt-0.5" />
                  <div className="text-xs font-medium">
                    This transfer has been is cancelled/recalled and fully refunded to the sender. Payout has been strictly blocked on Nile Server registry rails.
                  </div>
                </div>
              )}

              {/* Sender & Recipient profile grids */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg leading-relaxed">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Sender Profile</span>
                  <div className="font-semibold text-slate-800 text-sm">{matchedTx.senderName}</div>
                  <div className="text-slate-500 mt-1">Tel: {matchedTx.senderPhone}</div>
                  <div className="text-slate-500">Origin: {matchedTx.senderLocation}</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg leading-relaxed">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Recipient Beneficiary</span>
                  <div className="font-semibold text-slate-800 text-sm">{matchedTx.receiverName}</div>
                  <div className="text-slate-500 mt-1">Tel: {matchedTx.receiverPhone}</div>
                  <div className="text-indigo-600 font-bold mt-1">Destination: {destinationBranchObj?.city || matchedTx.destinationBranchId} Node</div>
                </div>
              </div>

              {/* Remmit remittance amounts metadata */}
              <div className="p-4 bg-indigo-950 text-white rounded-lg flex items-center justify-between gap-4 font-sans">
                <div>
                  <span className="text-[9px] text-indigo-300 font-bold uppercase tracking-widest block font-bold">Transfer Payload Sum (SSP / USD)</span>
                  <div className="font-display font-black text-white text-lg md:text-xl font-mono mt-0.5">
                    {formatCurrencyValue(matchedTx.amount, matchedTx.currency)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-indigo-300 font-bold uppercase tracking-widest block">Transit Fee Paid At Source</span>
                  <div className="text-xs text-indigo-100 font-semibold font-mono mt-0.5">
                    {formatCurrencyValue(matchedTx.commission, matchedTx.currency)}
                  </div>
                </div>
              </div>

              {/* Security authentication input disburser validation form active */}
              {matchedTx.status !== "PAID" && matchedTx.status !== "CANCELLED" && (
                <form onSubmit={handlePayoutSubmit} className="space-y-4 pt-3 border-t border-slate-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                        Verify Recipient Phone *
                      </label>
                      <input
                        type="text"
                        required
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        placeholder="e.g. +211 933 555 666"
                        className="w-full bg-slate-50 px-3 py-1.5 border border-slate-200 text-xs rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-bold"
                      />
                      <span className="text-[10.5px] text-slate-400 block mt-1">Must exactly match registered number.</span>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 text-indigo-600">
                        Enter Secret security PIN (4 Digits) *
                      </label>
                      <input
                        type="password"
                        required
                        maxLength={6}
                        value={pinInput}
                        onChange={(e) => setPinInput(e.target.value)}
                        placeholder="••••"
                        className="w-full bg-slate-50 px-3 py-1.5 border border-indigo-200 text-xs rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-bold text-center text-sm tracking-widest"
                      />
                      <span className="text-[10px] text-slate-400 block mt-1">PIN presented by recipient.</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    id="btn-process-payout"
                    disabled={loading}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold font-sans transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-3"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {loading ? "Authorizing Disbursal..." : "Authorize Cash Payout and Disburse"}
                  </button>
                </form>
              )}

            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl h-96 flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <FileText className="h-12 w-12 text-slate-300 mb-3" />
            <h4 className="font-semibold text-slate-600 text-xs">Verify Remittance Identification First</h4>
            <p className="text-[11px] text-slate-500 mt-1 max-w-sm leading-relaxed">
              Use the retrieval search panel to look up a transfer by code, recipient telephone, or secret PIN.
              We will load, balance, and visual validate receiver identity and branch constraints before payout authorization.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
