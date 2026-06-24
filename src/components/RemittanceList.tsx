import React, { useState, useMemo } from "react";
import { Transaction, Branch, Employee } from "../types.js";
import { 
  Coins, 
  Send, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Search, 
  Filter, 
  Clock, 
  FileText, 
  ArrowRight,
  TrendingUp,
  Printer 
} from "lucide-react";
import { formatCurrencyValue } from "../utils.js";

interface RemittanceListProps {
  transactions: Transaction[];
  branches: Branch[];
  activeEmployee: Employee | null;
  onPayoutClick: (code: string) => void;
  onCancelClick: (code: string) => void;
  onPrintReceipt: (tx: Transaction) => void;
  onSendClick?: () => void;
}

export const RemittanceList: React.FC<RemittanceListProps> = ({
  transactions,
  branches,
  activeEmployee,
  onPayoutClick,
  onCancelClick,
  onPrintReceipt,
  onSendClick,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [branchFilter, setBranchFilter] = useState<string>("ALL");

  const branchNames = useMemo(() => {
    const map: { [id: string]: string } = {};
    branches.forEach((b) => {
      map[b.id] = b.name;
    });
    return map;
  }, [branches]);

  // Statistics calculation
  const stats = useMemo(() => {
    let totalVolume = 0;
    let totalCommission = 0;
    let pendingCount = 0;
    let completedVolume = 0;

    transactions.forEach((t) => {
      if (t.status !== "CANCELLED" && t.status !== "REVERSED") {
        totalVolume += t.amount;
        totalCommission += t.commission;
      }
      if (t.status === "PENDING" || t.status === "READY_FOR_PICKUP") {
        pendingCount++;
      }
      if (t.status === "PAID") {
        completedVolume += t.amount;
      }
    });

    return { totalVolume, totalCommission, pendingCount, completedVolume };
  }, [transactions]);

  // Filter transactions
  const filteredTx = useMemo(() => {
    return transactions.filter((t) => {
      // 1. Search Query Match
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = q === "" || 
        t.transactionCode.toLowerCase().includes(q) ||
        t.senderName.toLowerCase().includes(q) ||
        t.senderPhone.includes(q) ||
        t.receiverName.toLowerCase().includes(q) ||
        t.receiverPhone.includes(q) ||
        (t.pin && t.pin.includes(q));

      // 2. Status Match
      const matchStatus = statusFilter === "ALL" || t.status === statusFilter;

      // 3. Branch Match
      const matchBranch = branchFilter === "ALL" || 
        t.sourceBranchId === branchFilter || 
        t.destinationBranchId === branchFilter;

      return matchQuery && matchStatus && matchBranch;
    });
  }, [transactions, searchQuery, statusFilter, branchFilter]);

  const getStatusBadge = (status: Transaction["status"]) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "READY_FOR_PICKUP":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "PAID":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "CANCELLED":
        return "bg-rose-50 text-rose-700 border-rose-100";
      case "REVERSED":
        return "bg-slate-50 text-slate-700 border-slate-200";
      case "EXPIRED":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div id="remittance-list-container">
      {/* Title & Initiate Send Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-bold font-display text-slate-800">
            Remittance Ledger & Desk
          </h2>
          <p className="text-xs text-slate-500">
            Monitor real-time regional money transfer transactions, safe clearances, and pending payout claims.
          </p>
        </div>
        {activeEmployee?.role !== "AUDITOR" && onSendClick && (
          <button
            id="btn-ledger-initiate-send"
            type="button"
            onClick={onSendClick}
            className="self-start sm:self-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 shadow-sm hover:shadow transition-all cursor-pointer whitespace-nowrap"
          >
            <Send className="h-3.5 w-3.5" />
            Initiate Send Money
          </button>
        )}
      </div>

      {/* Dynamic stats cards widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider"> remittance volume </span>
            <div className="h-7 w-7 rounded-full bg-indigo-50 flex items-center justify-center">
              <Send className="h-4 w-4 text-indigo-500" />
            </div>
          </div>
          <div className="font-display font-bold text-slate-800 text-sm md:text-lg">
            {formatCurrencyValue(stats.totalVolume)}
          </div>
          <span className="text-[10px] text-emerald-500 font-semibold block mt-1">
            All registered transactions
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider"> commissions income </span>
            <div className="h-7 w-7 rounded-full bg-emerald-50 flex items-center justify-center">
              <Coins className="h-4 w-4 text-emerald-500" />
            </div>
          </div>
          <div className="font-display font-bold text-slate-800 text-sm md:text-lg">
            {formatCurrencyValue(stats.totalCommission)}
          </div>
          <span className="text-[10px] text-slate-500 block mt-1">
            NMT Co-op margins (2.0% fee)
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider"> funds paid out </span>
            <div className="h-7 w-7 rounded-full bg-indigo-50 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-indigo-500" />
            </div>
          </div>
          <div className="font-display font-bold text-slate-800 text-sm md:text-lg">
            {formatCurrencyValue(stats.completedVolume)}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            Claimed by verified receivers
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider"> pending transfers </span>
            <div className="h-7 w-7 rounded-full bg-amber-50 flex items-center justify-center">
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
          </div>
          <div className="font-display font-bold text-slate-850 text-sm md:text-lg">
            {stats.pendingCount}
          </div>
          <span className="text-[10px] text-amber-500 font-semibold block mt-1">
            Ready for branch pickup
          </span>
        </div>
      </div>

      {/* Remittance ledger table controls */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row items-center gap-3">
          {/* Search box */}
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search code, PIN, client name, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 pl-9 pr-4 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Filters controls */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-2 w-1/2 md:w-auto">
              <Filter className="h-3.5 w-3.5 text-slate-400 hidden md:block" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs rounded-lg py-1.5 px-3 focus:outline-none w-full md:w-auto"
              >
                <option value="ALL">All States</option>
                <option value="PENDING">Pending</option>
                <option value="READY_FOR_PICKUP">Ready for Pickup</option>
                <option value="PAID">Paid</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs rounded-lg py-1.5 px-3 focus:outline-none w-1/2 md:w-auto"
            >
              <option value="ALL">All Nodes</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name.replace("Branch", "")}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          {filteredTx.length === 0 ? (
            <div className="text-center py-10">
              <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-700">No active transfers found</h3>
              <p className="text-xs text-slate-500 mt-1">Try modifying your query or filter configurations.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                  <th className="px-4 py-3">Code / Date</th>
                  <th className="px-4 py-3">Sender (Origin)</th>
                  <th className="px-4 py-3">Recipient (Dest)</th>
                  <th className="px-4 py-3 text-right">Settlement Sum</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
                {filteredTx.map((t) => {
                  const isPending = t.status === "PENDING" || t.status === "READY_FOR_PICKUP";
                  const canCancel = activeEmployee?.role === "OWNER" || activeEmployee?.role === "MANAGER";
                  const isSourceNode = activeEmployee?.branchId === "ALL" || activeEmployee?.branchId === t.sourceBranchId;
                  
                  // Verification for disburser
                  const isTargetBranch = activeEmployee?.branchId === "ALL" || activeEmployee?.branchId === t.destinationBranchId;

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-mono font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                          {t.transactionCode}
                          {t.isOfflineCreated && (
                            <span className="text-[8px] bg-amber-500/10 text-amber-600 border border-amber-300/30 px-1 rounded font-sans font-semibold uppercase tracking-wider animate-pulse">
                              Offline Created
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(t.createdAt).toLocaleDateString()} {new Date(t.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-800">{t.senderName}</div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {t.senderPhone} • {branchNames[t.sourceBranchId]?.split(" ")[0]}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-800">{t.receiverName}</div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {t.receiverPhone} • {branchNames[t.destinationBranchId]?.split(" ")[0]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-semibold text-slate-900">{formatCurrencyValue(t.amount)}</div>
                        <div className="text-[9px] text-slate-500 mt-0.5 font-mono">
                          Fee: {formatCurrencyValue(t.commission)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block text-[10px] font-semibold border px-2.5 py-0.5 rounded-full select-none ${getStatusBadge(t.status)}`}>
                          {t.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-1.5 items-center">
                          {t.status === "PAID" && (
                            <div className="text-[10px] text-emerald-500 font-semibold mr-1.5 hidden sm:block">
                              Disbursed
                            </div>
                          )}
                          
                          {/* Receipt Printer */}
                          <button
                            id={`btn-print-${t.id}`}
                            onClick={() => onPrintReceipt(t)}
                            title="Generate Print Receipt"
                            className="p-1 px-1.5 rounded-md border border-slate-200 text-slate-500 bg-white hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>

                          {/* Payout Trigger Trigger */}
                          {isPending && isTargetBranch && (
                            <button
                              id={`btn-payout-${t.id}`}
                              onClick={() => onPayoutClick(t.transactionCode)}
                              className="px-2.5 py-1 text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded cursor-pointer"
                            >
                              Payout
                            </button>
                          )}

                          {isPending && !isTargetBranch && (
                            <div className="text-[9px] text-slate-400 italic mr-1 text-center font-bold" title="Recipient went to other branch location">
                              Other Node
                            </div>
                          )}

                          {/* Cancellation Button */}
                          {isPending && canCancel && isSourceNode && (
                            <button
                              id={`btn-cancel-${t.id}`}
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to cancel the transfer order "${t.transactionCode}" and refund ${formatCurrencyValue(t.amount + t.commission)} back to the sender?`)) {
                                  onCancelClick(t.transactionCode);
                                }
                              }}
                              className="px-2 py-1 text-[11px] font-medium border border-rose-200 text-rose-600 hover:bg-rose-50 rounded"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
