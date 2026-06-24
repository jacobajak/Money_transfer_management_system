import React, { useState, useMemo } from "react";
import { Branch, Settlement, Employee } from "../types.js";
import { BilateralDebt, calculateRemittanceDebts, formatCurrencyValue } from "../utils.js";
import { Handshake, AlertCircle, ArrowRight, Check, X, ShieldAlert, Plus } from "lucide-react";

interface SettlementsModuleProps {
  branches: Branch[];
  settlements: Settlement[];
  transactions: any[];
  activeEmployee: Employee | null;
  onSettlementAction: (settlementData: {
    id?: string;
    fromBranchId?: string;
    toBranchId?: string;
    amount?: number;
    action: "CREATE" | "APPROVE" | "REJECT" | "SETTLE";
    notes?: string;
  }) => Promise<boolean>;
}

export const SettlementsModule: React.FC<SettlementsModuleProps> = ({
  branches,
  settlements,
  transactions,
  activeEmployee,
  onSettlementAction,
}) => {
  const [fromBranchId, setFromBranchId] = useState("");
  const [toBranchId, setToBranchId] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const canManageSettlement = activeEmployee?.role === "OWNER" || activeEmployee?.role === "MANAGER";

  // Calculate live netting debt
  const currentDebts = useMemo(() => {
    return calculateRemittanceDebts(branches, transactions, settlements);
  }, [branches, transactions, settlements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!fromBranchId || !toBranchId || !amount) {
      setError("Please specify source branch, recipient branch, and settlement amount.");
      return;
    }

    if (fromBranchId === toBranchId) {
      setError("Branch cannot settle with itself.");
      return;
    }

    if (amount <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }

    setLoading(true);
    try {
      const success = await onSettlementAction({
        fromBranchId,
        toBranchId,
        amount: Number(amount),
        action: "CREATE",
        notes,
      });

      if (success) {
        setSuccessMsg("Settlement request created and queued on Nil ledger.");
        setAmount("");
        setNotes("");
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit settlement.");
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = async (id: string, action: "APPROVE" | "REJECT" | "SETTLE") => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const success = await onSettlementAction({
        id,
        action,
      });
      if (success) {
        setSuccessMsg(`Settlement successfully marked as ${action === "SETTLE" ? "SETTLED (Balances adjusted)" : action}.`);
      }
    } catch (err: any) {
      setError(err.message || "Action execution failed.");
    } finally {
      setLoading(false);
    }
  };

  const branchNames = useMemo(() => {
    const map: { [id: string]: string } = {};
    branches.forEach((b) => {
      map[b.id] = b.name;
    });
    return map;
  }, [branches]);

  const getStatusStyle = (status: Settlement["status"]) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-50 text-yellow-700 border-yellow-250 font-bold animate-pulse";
      case "APPROVED":
        return "bg-blue-50 text-blue-700 border-blue-200 font-bold";
      case "REJECTED":
        return "bg-rose-50 text-rose-700 border-rose-200 font-bold";
      case "SETTLED":
        return "bg-emerald-50 text-emerald-700 border-emerald-250 font-bold";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div id="branch-settlement-module" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Debt netting calculations */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 md:p-5">
          <h3 className="font-display font-semibold text-slate-800 text-sm mb-1">
            Bilateral Branch Obligations Ledger (Remittance Netting)
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            Below are computed debts indicating which branches owe physical funds reimbursement based on execution discrepancies (e.g. cash surplus nodes vs outpacker drain nodes):
          </p>

          {currentDebts.length === 0 ? (
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 text-center text-xs text-slate-500 font-semibold">
              ✓ Balance Achieved: Branches owe no pending remittance netting dues.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[30rem] overflow-y-auto">
              {currentDebts.map((d, index) => (
                <div
                  key={index}
                  className="bg-slate-50/70 border border-slate-200 rounded-lg p-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-900 truncate max-w-[8rem]" title={d.fromBranchName}>
                        {d.fromBranchName.replace("Branch", "")}
                      </span>
                      <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
                      <span className="font-bold text-indigo-700 truncate max-w-[8rem]" title={d.toBranchName}>
                        {d.toBranchName.replace("Branch", "")}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 italic block mt-0.5">
                      Excess remittance cash collected remains at debtor
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-850 text-sm">
                      {formatCurrencyValue(d.amount)}
                    </span>
                    <button
                      onClick={() => {
                        setFromBranchId(d.fromBranchId);
                        setToBranchId(d.toBranchId);
                        setAmount(d.amount);
                        setNotes(`Settlement for calculated remittance obligation netting.`);
                      }}
                      className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 block mt-0.5 underline hover:cursor-pointer"
                    >
                      Autofill request
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Settlement creation request form */}
        {canManageSettlement && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 shadow-sm">
            <h3 className="font-display font-semibold text-slate-800 text-sm mb-3">
              Initiate Dynamic Settlement request
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-550 mb-1">
                    Debtor Node *
                  </label>
                  <select
                    value={fromBranchId}
                    onChange={(e) => setFromBranchId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded text-xs py-1 px-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">Select Debtor</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name.replace("Branch","")}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-550 mb-1">
                    Creditor Node *
                  </label>
                  <select
                    value={toBranchId}
                    onChange={(e) => setToBranchId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded text-xs py-1 px-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">Select Creditor</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name.replace("Branch","")}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-550 mb-1">
                  Settlement Amount SSP *
                </label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="SSP 500,000"
                  className="w-full bg-white border border-slate-200 rounded text-xs py-1 px-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-550 mb-1">
                  Reconciliation reference details
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Physical cash cargo shipment 12-June"
                  className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded text-xs py-1 px-2 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-slate-900 border border-slate-950 hover:bg-slate-800 text-white rounded text-xs font-bold font-sans transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="h-4.5 w-4.5" />
                {loading ? "Submitting..." : "Submit Settlement Request"}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Grid of existing requests */}
      <div className="lg:col-span-7 space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 md:p-5">
          <h3 className="font-display font-semibold text-slate-800 text-sm mb-3 flex items-center gap-2">
            <Handshake className="h-5 w-5 text-indigo-600" />
            Remittance Settlement requests Track (Safe Refunding)
          </h3>

          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-lg text-xs font-semibold mb-3 border border-rose-100">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold mb-3 border border-emerald-100">
              {successMsg}
            </div>
          )}

          {settlements.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400">
              No remittance settlement records tracked yet. Obligations calculated are settled physically by corporate.
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[35rem] overflow-y-auto">
              {settlements.map((s) => {
                const canApprove = activeEmployee?.role === "OWNER";
                const canCompleteSettle = activeEmployee?.role === "OWNER" || activeEmployee?.role === "MANAGER";

                return (
                  <div
                    key={s.id}
                    className="border border-slate-150/70 hover:border-slate-300 rounded-lg bg-slate-50/50 p-3.5 space-y-3 text-xs leading-relaxed"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-mono font-bold text-slate-400">ID: {s.id}</span>
                      <span className={`px-2 py-0.5 border text-[10px] font-bold uppercase rounded-full ${getStatusStyle(s.status)}`}>
                        {s.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs border-b border-dashed border-slate-200 pb-2.5">
                      <div>
                        <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Debit Branch</div>
                        <span className="font-semibold text-slate-800">
                          {branchNames[s.fromBranchId] || s.fromBranchId}
                        </span>
                      </div>
                      
                      <ArrowRight className="h-4 w-4 text-slate-400 mx-2" />

                      <div className="text-right">
                        <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Credit Branch</div>
                        <span className="font-semibold text-slate-800">
                          {branchNames[s.toBranchId] || s.toBranchId}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between py-1">
                      <div>
                        <span className="text-[10px] text-slate-450 block font-bold uppercase">Settlement Target</span>
                        <p className="text-slate-700 italic mt-0.5">"{s.notes || "No extra reference provided."}"</p>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 text-[10px] uppercase block font-bold">Settlement Sum</span>
                        <span className="text-base font-mono font-bold text-slate-850">
                          {formatCurrencyValue(s.amount)}
                        </span>
                      </div>
                    </div>

                    {/* Operational controls */}
                    <div className="flex justify-end gap-1.5 pt-2 border-t border-slate-200/50">
                      {s.status === "PENDING" && canApprove && (
                        <div className="flex gap-1">
                          <button
                            id={`btn-settlement-reject-${s.id}`}
                            onClick={() => handleActionClick(s.id, "REJECT")}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold px-2.5 py-1 rounded text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            <X className="h-3 w-3" />
                            Reject
                          </button>
                          <button
                            id={`btn-settlement-approve-${s.id}`}
                            onClick={() => handleActionClick(s.id, "APPROVE")}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 font-bold px-2.5 py-1 rounded text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="h-3 w-3" />
                            Approve
                          </button>
                        </div>
                      )}

                      {s.status === "APPROVED" && canCompleteSettle && (
                        <button
                          id={`btn-settlement-settle-${s.id}`}
                          onClick={() => handleActionClick(s.id, "SETTLE")}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 rounded text-[11px] flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                        >
                          <Check className="h-3 w-3" />
                          Finalize Physical Settle
                        </button>
                      )}

                      {s.status === "SETTLED" && (
                        <span className="text-[10px] text-emerald-500 font-bold italic flex items-center gap-1 select-none">
                          ✓ Physical safe ledger structures balanced and accounted.
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
