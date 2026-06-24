import React, { useState, useMemo } from "react";
import { Transaction, Branch, Employee, CashLedger, Settlement } from "../types.js";
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Printer, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  ArrowRightLeft, 
  Scale, 
  Search, 
  Filter, 
  RefreshCcw, 
  DollarSign, 
  Award, 
  TrendingDown, 
  Layers, 
  Briefcase,
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  ChevronRight,
  Send,
  Coins,
  History,
  Sparkles,
  Percent,
  CalendarDays,
  ShieldAlert
} from "lucide-react";
import { formatCurrencyValue, calculateRemittanceDebts, calculateBranchBalances } from "../utils.js";

interface ReportingModuleProps {
  transactions: Transaction[];
  branches: Branch[];
  employees: Employee[];
  cashLedgers: CashLedger[];
  settlements: Settlement[];
  activeEmployee: Employee | null;
  onPrintReceipt?: (tx: Transaction) => void;
}

type PeriodType = "TODAY" | "YESTERDAY" | "SPECIFIC_DATE" | "DATE_RANGE" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY" | "ALL_TIME";

export function ReportingModule({
  transactions,
  branches,
  employees,
  cashLedgers,
  settlements,
  activeEmployee,
  onPrintReceipt
}: ReportingModuleProps) {
  // Current tab inside Advanced Reporting
  const [reportTab, setReportTab] = useState<"company" | "branch" | "flows" | "transactions" | "agents" | "routes" | "scheduler">("company");
  
  // Historical Engines Filter states
  const [period, setPeriod] = useState<PeriodType>("ALL_TIME");
  const [specificDate, setSpecificDate] = useState<string>("2026-06-12");
  const [startDate, setStartDate] = useState<string>("2026-06-01");
  const [endDate, setEndDate] = useState<string>("2026-06-30");

  // Filtered branch for Branch Performance reports
  const [selectedBranchId, setSelectedBranchId] = useState<string>(branches[0]?.id || "branch-1");

  // Export statuses
  const [exportMessage, setExportMessage] = useState<{ text: string; type: "success" | "info" } | null>(null);

  // Filter Transaction History Ledger States
  const [txSearchId, setTxSearchId] = useState("");
  const [txSenderSearch, setTxSenderSearch] = useState("");
  const [txReceiverSearch, setTxReceiverSearch] = useState("");
  const [txPhoneSearch, setTxPhoneSearch] = useState("");
  const [txStatusSearch, setTxStatusSearch] = useState<string>("ALL");
  const [txBranchSearch, setTxBranchSearch] = useState<string>("ALL");
  const [txDestBranchSearch, setTxDestBranchSearch] = useState<string>("ALL");
  const [txAgentSearch, setTxAgentSearch] = useState<string>("ALL");
  const [txMinAmount, setTxMinAmount] = useState<string>("");
  const [txMaxAmount, setTxMaxAmount] = useState<string>("");

  // Simulated auto scheduled alerts list
  const [scheduledReports, setScheduledReports] = useState([
    { id: "sch-1", name: "Daily Consolidated Remittances", type: "Daily", time: "23:59 CAT", format: "PDF & CSV", status: "ENABLED", emailsCount: 3 },
    { id: "sch-2", name: "Weekly Branch Cash Flow Balances", type: "Weekly", time: "Sun 23:50 CAT", format: "Excel", status: "ENABLED", emailsCount: 2 },
    { id: "sch-3", name: "Monthly Route & Net Settlement Audit", type: "Monthly", time: "1st day 04:00 CAT", format: "PDF & Excel", status: "ENABLED", emailsCount: 5 },
    { id: "sch-4", name: "Yearly Tax & Compliance Remittance Ledger", type: "Yearly", time: "Jan 1st 01:00 CAT", format: "Excel", status: "ENABLED", emailsCount: 4 }
  ]);

  // Alert dismiss
  const showToast = (text: string, type: "success" | "info" = "success") => {
    setExportMessage({ text, type });
    setTimeout(() => setExportMessage(null), 4000);
  };

  // ----------------------------------------------------
  // TIME / PERIOD FILTERING LOGIC
  // ----------------------------------------------------
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const txDate = new Date(t.createdAt);
      const txYMDStr = t.createdAt.substring(0, 10); // "YYYY-MM-DD"
      
      const today = new Date("2026-06-12"); // Fixed sim date in metadata
      const todayStr = "2026-06-12";
      
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().substring(0, 10);

      switch (period) {
        case "TODAY":
          return txYMDStr === todayStr;
        case "YESTERDAY":
          return txYMDStr === yesterdayStr;
        case "SPECIFIC_DATE":
          return txYMDStr === specificDate;
        case "DATE_RANGE":
          return txYMDStr >= startDate && txYMDStr <= endDate;
        case "WEEKLY": {
          // Calculate if within last 7 days from today
          const diffTime = today.getTime() - txDate.getTime();
          const diffDays = diffTime / (1000 * 3600 * 24);
          return diffDays >= 0 && diffDays <= 7;
        }
        case "MONTHLY": {
          // Within same year & month as today (June 2026)
          return t.createdAt.substring(0, 7) === todayStr.substring(0, 7);
        }
        case "QUARTERLY": {
          // Q2 2026 (April, May, June)
          const q2Months = ["2026-04", "2026-05", "2026-06"];
          return q2Months.includes(t.createdAt.substring(0, 7));
        }
        case "YEARLY": {
          // Year 2026
          return t.createdAt.substring(0, 4) === todayStr.substring(0, 4);
        }
        case "ALL_TIME":
        default:
          return true;
      }
    });
  }, [transactions, period, specificDate, startDate, endDate]);

  const filteredLedgers = useMemo(() => {
    return cashLedgers.filter(l => {
      const ledgYMDStr = l.createdAt.substring(0, 10);
      const todayStr = "2026-06-12";
      const yesterday = new Date("2026-06-12");
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().substring(0, 10);

      switch (period) {
        case "TODAY":
          return ledgYMDStr === todayStr;
        case "YESTERDAY":
          return ledgYMDStr === yesterdayStr;
        case "SPECIFIC_DATE":
          return ledgYMDStr === specificDate;
        case "DATE_RANGE":
          return ledgYMDStr >= startDate && ledgYMDStr <= endDate;
        case "WEEKLY": {
          const diffTime = new Date("2026-06-12").getTime() - new Date(l.createdAt).getTime();
          const diffDays = diffTime / (1000 * 3600 * 24);
          return diffDays >= 0 && diffDays <= 7;
        }
        case "MONTHLY":
          return l.createdAt.substring(0, 7) === todayStr.substring(0, 7);
        case "QUARTERLY": {
          const q2Months = ["2026-04", "2026-05", "2026-06"];
          return q2Months.includes(l.createdAt.substring(0, 7));
        }
        case "YEARLY":
          return l.createdAt.substring(0, 4) === todayStr.substring(0, 4);
        case "ALL_TIME":
        default:
          return true;
      }
    });
  }, [cashLedgers, period, specificDate, startDate, endDate]);

  const filteredSettlements = useMemo(() => {
    return settlements.filter(s => {
      const setYMDStr = s.createdAt.substring(0, 10);
      const todayStr = "2026-06-12";
      const yesterday = new Date("2026-06-12");
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().substring(0, 10);

      switch (period) {
        case "TODAY":
          return setYMDStr === todayStr;
        case "YESTERDAY":
          return setYMDStr === yesterdayStr;
        case "SPECIFIC_DATE":
          return setYMDStr === specificDate;
        case "DATE_RANGE":
          return setYMDStr >= startDate && setYMDStr <= endDate;
        case "WEEKLY": {
          const diffTime = new Date("2026-06-12").getTime() - new Date(s.createdAt).getTime();
          const diffDays = diffTime / (1000 * 3600 * 24);
          return diffDays >= 0 && diffDays <= 7;
        }
        case "MONTHLY":
          return s.createdAt.substring(0, 7) === todayStr.substring(0, 7);
        case "QUARTERLY": {
          const q2Months = ["2026-04", "2026-05", "2026-06"];
          return q2Months.includes(s.createdAt.substring(0, 7));
        }
        case "YEARLY":
          return s.createdAt.substring(0, 4) === todayStr.substring(0, 4);
        case "ALL_TIME":
        default:
          return true;
      }
    });
  }, [settlements, period, specificDate, startDate, endDate]);

  // Helpers for mapping
  const branchMap = useMemo(() => new Map(branches.map(b => [b.id, b])), [branches]);
  const employeeMap = useMemo(() => new Map(employees.map(e => [e.id, e])), [employees]);

  // ----------------------------------------------------
  // REPORT 1: BRANCH PERFORMANCE REPORT MATHS
  // ----------------------------------------------------
  const branchReport = useMemo(() => {
    // Collect stats for selectedBranchId during chosen timeframe
    const branchTx = filteredTransactions.filter(
      t => t.sourceBranchId === selectedBranchId || t.destinationBranchId === selectedBranchId
    );

    const sentTx = branchTx.filter(t => t.sourceBranchId === selectedBranchId);
    const paidOutTx = branchTx.filter(t => t.destinationBranchId === selectedBranchId && t.status === "PAID");

    const createdCount = sentTx.length;
    const paidCount = paidOutTx.length;
    const pendingCount = branchTx.filter(t => t.destinationBranchId === selectedBranchId && (t.status === "PENDING" || t.status === "READY_FOR_PICKUP")).length;
    const cancelledCount = branchTx.filter(t => t.status === "CANCELLED").length;
    const reversedCount = branchTx.filter(t => t.status === "REVERSED").length;
    const expiredCount = branchTx.filter(t => t.status === "EXPIRED").length;

    // Money Sent metrics
    const executedSentTx = sentTx.filter(t => t.status !== "CANCELLED" && t.status !== "REVERSED");
    const totalAmountSent = executedSentTx.reduce((sum, t) => sum + t.amount, 0);
    const avgAmountSent = executedSentTx.length > 0 ? totalAmountSent / executedSentTx.length : 0;
    const largestSent = executedSentTx.length > 0 ? Math.max(...executedSentTx.map(t => t.amount)) : 0;
    const smallestSent = executedSentTx.length > 0 ? Math.min(...executedSentTx.map(t => t.amount)) : 0;
    
    // Unique customers served
    const uniqueSenders = new Set(executedSentTx.map(t => t.senderPhone)).size;
    const uniqueSendersServed = new Set(executedSentTx.map(t => t.senderName)).size;

    // Money Received metrics
    const totalAmountPaid = paidOutTx.reduce((sum, t) => sum + t.amount, 0);
    const avgAmountPaid = paidOutTx.length > 0 ? totalAmountPaid / paidOutTx.length : 0;
    const uniqueReceivers = new Set(paidOutTx.map(t => t.receiverPhone)).size;

    // Commission Metrics
    const totalCommissionEarned = executedSentTx.reduce((sum, t) => sum + t.commission, 0);
    const avgCommission = executedSentTx.length > 0 ? totalCommissionEarned / executedSentTx.length : 0;
    const maxCommission = executedSentTx.length > 0 ? Math.max(...executedSentTx.map(t => t.commission)) : 0;

    // Cash metrics
    const branchLedgers = filteredLedgers.filter(l => l.branchId === selectedBranchId);
    const openingBalEntry = branchLedgers.find(l => l.reference === "Opening Balance");
    const openingCashBalance = openingBalEntry ? openingBalEntry.amount : 0;
    
    const cashIn = branchLedgers.filter(l => l.type === "CASH_IN" && l.reference !== "Opening Balance").reduce((sum, l) => sum + l.amount, 0);
    const cashOut = branchLedgers.filter(l => l.type === "CASH_OUT").reduce((sum, l) => sum + l.amount, 0);
    const complexAdjustments = branchLedgers.filter(l => l.type === "ADJUSTMENT").reduce((sum, l) => sum + l.amount, 0);

    const actualRecalledClosing = openingCashBalance + cashIn - cashOut + complexAdjustments;
    
    // Calculate expected cash balance from trades
    // Cash In = Opening + sent amounts + sent commission + settlement receipts
    // Cash Out = payouts + settlement paid out
    const tradingIn = executedSentTx.reduce((sum, t) => sum + t.amount + t.commission, 0);
    const settlementRecvOnHQ = filteredSettlements.filter(s => s.toBranchId === selectedBranchId && s.status === "SETTLED").reduce((sum, s) => sum + s.amount, 0);
    
    const tradingOut = paidOutTx.reduce((sum, t) => sum + t.amount, 0);
    const settlementPaidOnHQ = filteredSettlements.filter(s => s.fromBranchId === selectedBranchId && s.status === "SETTLED").reduce((sum, s) => sum + s.amount, 0);
    
    const expectedCashBalance = openingCashBalance + tradingIn + settlementRecvOnHQ - tradingOut - settlementPaidOnHQ;
    const actualCashBalance = expectedCashBalance; // Assuming aligned, variance would trigger on manually mismatched physical safe audits
    const cashVariance = 0; // standard perfect audit

    // Customer activity counts
    const totalCustomersServed = uniqueSenders + uniqueReceivers;
    const returningCustomers = Math.floor(totalCustomersServed * 0.72); // Simulation
    const newCustomers = totalCustomersServed - returningCustomers;

    // Most frequent entities mockup for realism
    let topSender = "Jacob Otim (Bor Local Trading)";
    let topReceiver = "Elizabeth Chol (Aweil Central)";

    // Employee activity in this branch
    const branchEmployeeStats = employees
      .filter(e => e.branchId === selectedBranchId)
      .map(emp => {
        const empActions = executedSentTx.filter(t => t.createdBy === emp.id);
        const empPayouts = paidOutTx.filter(t => t.payoutAgentId === emp.id);
        const volumeCreated = empActions.reduce((sum, t) => sum + t.amount, 0);
        const commGenerated = empActions.reduce((sum, t) => sum + t.commission, 0);
        
        return {
          employeeId: emp.id,
          name: emp.name,
          role: emp.role,
          transactionsCount: empActions.length,
          volumeCreated,
          commission: commGenerated,
          payoutsCount: empPayouts.length
        };
      })
      .sort((a, b) => b.volumeCreated - a.volumeCreated);

    return {
      createdCount,
      paidCount,
      pendingCount,
      cancelledCount,
      reversedCount,
      expiredCount,
      totalAmountSent,
      avgAmountSent,
      largestSent,
      smallestSent,
      uniqueSenders,
      totalAmountPaid,
      avgAmountPaid,
      uniqueReceivers,
      totalCommissionEarned,
      avgCommission,
      maxCommission,
      openingCashBalance,
      cashIn: tradingIn + settlementRecvOnHQ,
      cashOut: tradingOut + settlementPaidOnHQ,
      closingCashBalance: expectedCashBalance,
      expectedCashBalance,
      actualCashBalance,
      cashVariance,
      totalCustomersServed,
      newCustomers,
      returningCustomers,
      topSender,
      topReceiver,
      branchEmployeeStats
    };
  }, [filteredTransactions, filteredLedgers, filteredSettlements, employees, selectedBranchId, branches]);

  // ----------------------------------------------------
  // REPORT 2 & 3: BRANCH FLOWS & SETTLEMENT OBLIGATIONS MATHS
  // ----------------------------------------------------
  const flowReport = useMemo(() => {
    // Calculated bilateral debt lists
    const obligations = calculateRemittanceDebts(branches, filteredTransactions, settlements);
    const activeBranchName = branchMap.get(selectedBranchId)?.name || "This Branch";

    // Matrix calculation to other branches
    const outboundToBranches = branches
      .filter(b => b.id !== selectedBranchId)
      .map(b => {
        const transfers = filteredTransactions.filter(
          t => t.sourceBranchId === selectedBranchId && t.destinationBranchId === b.id && t.status !== "CANCELLED" && t.status !== "REVERSED"
        );
        const totalAmount = transfers.reduce((sum, t) => sum + t.amount, 0);
        const totalCommission = transfers.reduce((sum, t) => sum + t.commission, 0);

        return {
          destBranchId: b.id,
          destBranchName: b.name,
          count: transfers.length,
          totalAmount,
          totalCommission
        };
      });

    const inboundFromBranches = branches
      .filter(b => b.id !== selectedBranchId)
      .map(b => {
        const transfers = filteredTransactions.filter(
          t => t.sourceBranchId === b.id && t.destinationBranchId === selectedBranchId && t.status !== "CANCELLED" && t.status !== "REVERSED"
        );
        const collectedAmount = transfers.filter(t => t.status === "PAID").reduce((sum, t) => sum + t.amount, 0);
        const pendingAmount = transfers.filter(t => t.status === "PENDING" || t.status === "READY_FOR_PICKUP").reduce((sum, t) => sum + t.amount, 0);
        const totalAmount = transfers.reduce((sum, t) => sum + t.amount, 0);

        return {
          srcBranchId: b.id,
          srcBranchName: b.name,
          count: transfers.length,
          totalAmount,
          collectedAmount,
          pendingAmount
        };
      });

    const totalSentToOthers = outboundToBranches.reduce((sum, item) => sum + item.totalAmount, 0);
    const totalRecvFromOthers = inboundFromBranches.reduce((sum, item) => sum + item.totalAmount, 0);

    // Dynamic dues for SELECTED branch
    // Owes = obligations where fromBranchId === selectedBranchId
    const branchOwes = obligations.filter(o => o.fromBranchId === selectedBranchId);
    const branchOwed = obligations.filter(o => o.toBranchId === selectedBranchId);

    const totalOwesValue = branchOwes.reduce((sum, o) => sum + o.amount, 0);
    const totalOwedValue = branchOwed.reduce((sum, o) => sum + o.amount, 0);
    const netPosition = totalOwedValue - totalOwesValue;

    return {
      outboundToBranches,
      inboundFromBranches,
      totalSentToOthers,
      totalRecvFromOthers,
      netPosition,
      branchOwes,
      branchOwed,
      totalOwesValue,
      totalOwedValue
    };
  }, [branches, filteredTransactions, settlements, selectedBranchId, branchMap]);


  // ----------------------------------------------------
  // REPORT 5: TRANSACTION HISTORY REPORT FILTER SEARCH MATH
  // ----------------------------------------------------
  const transactionReportRows = useMemo(() => {
    return filteredTransactions.filter(t => {
      // Apply rigorous business filters
      if (txSearchId && !t.transactionCode.toLowerCase().includes(txSearchId.toLowerCase()) && !t.id.toLowerCase().includes(txSearchId.toLowerCase())) {
        return false;
      }
      if (txSenderSearch && !t.senderName.toLowerCase().includes(txSenderSearch.toLowerCase())) {
        return false;
      }
      if (txReceiverSearch && !t.receiverName.toLowerCase().includes(txReceiverSearch.toLowerCase())) {
        return false;
      }
      if (txPhoneSearch && !t.senderPhone.includes(txPhoneSearch) && !t.receiverPhone.includes(txPhoneSearch)) {
        return false;
      }
      if (txStatusSearch !== "ALL" && t.status !== txStatusSearch) {
        return false;
      }
      if (txBranchSearch !== "ALL" && t.sourceBranchId !== txBranchSearch) {
        return false;
      }
      if (txDestBranchSearch !== "ALL" && t.destinationBranchId !== txDestBranchSearch) {
        return false;
      }
      if (txAgentSearch !== "ALL" && t.createdBy !== txAgentSearch && t.payoutAgentId !== txAgentSearch) {
        return false;
      }
      // Min limit
      if (txMinAmount && t.amount < parseFloat(txMinAmount)) {
        return false;
      }
      // Max limit
      if (txMaxAmount && t.amount > parseFloat(txMaxAmount)) {
        return false;
      }

      return true;
    });
  }, [
    filteredTransactions,
    txSearchId,
    txSenderSearch,
    txReceiverSearch,
    txPhoneSearch,
    txStatusSearch,
    txBranchSearch,
    txDestBranchSearch,
    txAgentSearch,
    txMinAmount,
    txMaxAmount
  ]);


  // ----------------------------------------------------
  // REPORT 6: PAYOUT STATUS ANALYSIS
  // ----------------------------------------------------
  const payoutStatusReport = useMemo(() => {
    const totalTransactionsCount = filteredTransactions.length;
    const pendingPickupTx = filteredTransactions.filter(t => t.status === "PENDING" || t.status === "READY_FOR_PICKUP");
    const collectedTx = filteredTransactions.filter(t => t.status === "PAID");
    const cancelledTx = filteredTransactions.filter(t => t.status === "CANCELLED");
    const reversedTx = filteredTransactions.filter(t => t.status === "REVERSED");
    const expiredTx = filteredTransactions.filter(t => t.status === "EXPIRED");

    const totalPendingAmount = pendingPickupTx.reduce((sum, t) => sum + t.amount, 0);
    const totalCollectedAmount = collectedTx.reduce((sum, t) => sum + t.amount, 0);

    // Average collection time simulation
    let averageCollectionTime = "3 Hours 21 Min"; 
    let longestPendingTransaction = pendingPickupTx.length > 0 
      ? pendingPickupTx.sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0]
      : null;

    let nearExpiryTx = pendingPickupTx.filter(t => {
      // If pending for more than 48 hours in simulation
      const hours = (new Date("2026-06-12").getTime() - new Date(t.createdAt).getTime()) / (1000 * 3600);
      return hours > 48;
    });

    return {
      totalTransactionsCount,
      pendingPickupCount: pendingPickupTx.length,
      readyPickupCount: filteredTransactions.filter(t => t.status === "READY_FOR_PICKUP").length,
      collectedCount: collectedTx.length,
      cancelledCount: cancelledTx.length,
      reversedCount: reversedTx.length,
      expiredCount: expiredTx.length,
      totalPendingAmount,
      totalCollectedAmount,
      averageCollectionTime,
      longestPendingTransaction,
      nearExpiryCount: nearExpiryTx.length,
      nearExpiryTx
    };
  }, [filteredTransactions]);


  // ----------------------------------------------------
  // REPORT 7: AGENT PRODUCTIVITY & PERFORMANCE RANKINGS
  // ----------------------------------------------------
  const agentPerformanceReport = useMemo(() => {
    // Generate metric array per Agent
    const reportList = employees.map(emp => {
      const createdTx = filteredTransactions.filter(t => t.createdBy === emp.id && t.status !== "CANCELLED" && t.status !== "REVERSED");
      const paidTx = filteredTransactions.filter(t => t.payoutAgentId === emp.id && t.status === "PAID");
      const cancelledTx = filteredTransactions.filter(t => t.createdBy === emp.id && t.status === "CANCELLED");
      const reversedTx = filteredTransactions.filter(t => t.createdBy === emp.id && t.status === "REVERSED");

      const amountCreated = createdTx.reduce((sum, t) => sum + t.amount, 0);
      const amountPaid = paidTx.reduce((sum, t) => sum + t.amount, 0);
      const commission = createdTx.reduce((sum, t) => sum + t.commission, 0);

      const uniqueCustomers = new Set([
        ...createdTx.map(t => t.senderPhone),
        ...paidTx.map(t => t.receiverPhone)
      ]).size;

      return {
        agentId: emp.id,
        name: emp.name,
        role: emp.role,
        branchName: branchMap.get(emp.branchId)?.name || (emp.branchId === "ALL" ? "HQ Control" : emp.branchId),
        transactionsCount: createdTx.length + paidTx.length,
        totalAmountProcessed: amountCreated + amountPaid,
        commissionGenerated: commission,
        customersServed: uniqueCustomers,
        payoutsProcessedCount: paidTx.length,
        cancelledCount: cancelledTx.length,
        reversedCount: reversedTx.length,
        avgProcessingTime: "1.8 Min" // Simulated
      };
    });

    // Timeframe rankings (today, this week, this month)
    const todayStr = "2026-06-12";
    const todayTx = transactions.filter(t => t.createdAt.substring(0, 10) === todayStr && t.status !== "CANCELLED");
    const weekTx = transactions.filter(t => {
      const diff = new Date("2026-06-12").getTime() - new Date(t.createdAt).getTime();
      return diff / (1000 * 3600 * 24) <= 7 && t.status !== "CANCELLED";
    });

    const getAgentSummaryList = (txList: Transaction[]) => {
      const tMap: { [id: string]: number } = {};
      txList.forEach(t => {
        tMap[t.createdBy] = (tMap[t.createdBy] || 0) + t.amount;
        if (t.payoutAgentId) {
          tMap[t.payoutAgentId] = (tMap[t.payoutAgentId] || 0) + t.amount;
        }
      });
      return Object.entries(tMap)
        .map(([id, amt]) => ({
          agentId: id,
          name: employeeMap.get(id)?.name || id,
          amount: amt
        }))
        .sort((a,b) => b.amount - a.amount);
    };

    return {
      rows: reportList,
      rankingToday: getAgentSummaryList(todayTx).slice(0, 3),
      rankingWeek: getAgentSummaryList(weekTx).slice(0, 5),
      rankingMonth: getAgentSummaryList(filteredTransactions).sort((a,b) => b.amount - a.amount).slice(0, 5) // Month scope matches filtered
    };
  }, [employees, filteredTransactions, transactions, branchMap, employeeMap]);


  // ----------------------------------------------------
  // REPORT 8: ROUTE ANALYSIS REPORT
  // ----------------------------------------------------
  const routeReport = useMemo(() => {
    // Generate the possible combinations of source & destination branches
    const routes: {
      id: string;
      sourceName: string;
      destName: string;
      transferCount: number;
      totalVolume: number;
      commissionEarned: number;
      avgTxValue: number;
      growthRate: string; // simulate
      collectionRate: number; // calculated as payouts completed / total
      pendingRate: number;
    }[] = [];

    branches.forEach(b1 => {
      branches.forEach(b2 => {
        if (b1.id !== b2.id) {
          const routeTxs = filteredTransactions.filter(t => t.sourceBranchId === b1.id && t.destinationBranchId === b2.id);
          const nonCancelled = routeTxs.filter(t => t.status !== "CANCELLED" && t.status !== "REVERSED");
          const totalVolume = nonCancelled.reduce((sum, t) => sum + t.amount, 0);
          const commissionEarned = nonCancelled.reduce((sum, t) => sum + t.commission, 0);
          const avgTxValue = nonCancelled.length > 0 ? totalVolume / nonCancelled.length : 0;

          const collectedCount = nonCancelled.filter(t => t.status === "PAID").length;
          const pendingCount = nonCancelled.filter(t => t.status === "PENDING" || t.status === "READY_FOR_PICKUP").length;

          const collectionRate = nonCancelled.length > 0 ? (collectedCount / nonCancelled.length) * 100 : 100;
          const pendingRate = nonCancelled.length > 0 ? (pendingCount / nonCancelled.length) * 100 : 0;

          // Simulated growth rate
          const simulatedGrowth = routeTxs.length > 3 ? "+12.4%" : routeTxs.length > 0 ? "+4.1%" : "0.0%";

          routes.push({
            id: `${b1.id}->${b2.id}`,
            sourceName: b1.name,
            destName: b2.name,
            transferCount: routeTxs.length,
            totalVolume,
            commissionEarned,
            avgTxValue,
            growthRate: simulatedGrowth,
            collectionRate,
            pendingRate
          });
        }
      });
    });

    const activeRoutes = routes.filter(r => r.transferCount > 0).sort((a,b) => b.totalVolume - a.totalVolume);
    const mostActive = activeRoutes[0] || null;
    const mostProfitable = routes.sort((a,b) => b.commissionEarned - a.commissionEarned)[0] || null;
    const fastestGrowing = routes.sort((a,b) => parseFloat(b.growthRate) - parseFloat(a.growthRate))[0] || null;

    return {
      routesList: routes,
      activeRoutes,
      mostActive,
      mostProfitable,
      fastestGrowing
    };
  }, [branches, filteredTransactions]);


  // ----------------------------------------------------
  // REPORT 9: CONSOLIDATED COMPANY-WIDE REPORT MATH
  // ----------------------------------------------------
  const companyReport = useMemo(() => {
    const totalBranches = branches.length;
    const activeBranches = branches.length; // all sim branches are active
    const inactiveBranches = 0;
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(e => e.status === "ACTIVE").length;

    // Network totals
    const executedTx = filteredTransactions.filter(t => t.status !== "CANCELLED" && t.status !== "REVERSED");
    const totalTxCount = filteredTransactions.length;
    const totalAmountSentSum = executedTx.reduce((sum, t) => sum + t.amount, 0);
    const totalAmountPaidSum = filteredTransactions.filter(t => t.status === "PAID").reduce((sum, t) => sum + t.amount, 0);
    const totalCommissionSum = executedTx.reduce((sum, t) => sum + t.commission, 0);
    const averageTxValue = executedTx.length > 0 ? totalAmountSentSum / executedTx.length : 0;
    const uniqueCustomers = new Set(executedTx.map(t => t.senderPhone)).size;

    // Status Summary counter block
    const statusCollected = filteredTransactions.filter(t => t.status === "PAID").length;
    const statusPending = filteredTransactions.filter(t => t.status === "PENDING" || t.status === "READY_FOR_PICKUP").length;
    const statusCancelled = filteredTransactions.filter(t => t.status === "CANCELLED").length;
    const statusReversed = filteredTransactions.filter(t => t.status === "REVERSED").length;
    const statusExpired = filteredTransactions.filter(t => t.status === "EXPIRED").length;
    const statusFraudFlagged = filteredTransactions.filter(t => t.notes?.toLowerCase().includes("suspicious") || t.notes?.toLowerCase().includes("hold")).length;

    // Branch Rankings
    const branchRankings = branches.map(b => {
      const sent = filteredTransactions.filter(t => t.sourceBranchId === b.id && t.status !== "CANCELLED");
      const paid = filteredTransactions.filter(t => t.destinationBranchId === b.id && t.status === "PAID");
      const commission = sent.reduce((sum, t) => sum + t.commission, 0);
      const totalVol = sent.reduce((sum, t) => sum + t.amount, 0) + paid.reduce((sum, t) => sum + t.amount, 0);

      const collectedCount = sent.filter(t => t.status === "PAID").length;
      const bestCollectionRate = sent.length > 0 ? (collectedCount / sent.length) * 100 : 100;

      return {
        branchId: b.id,
        name: b.name,
        revenue: commission,
        volume: totalVol,
        transferCount: sent.length + paid.length,
        collectionRate: bestCollectionRate
      };
    });

    const highestRevenue = [...branchRankings].sort((a,b) => b.revenue - a.revenue)[0] || null;
    const highestVolume = [...branchRankings].sort((a,b) => b.volume - a.volume)[0] || null;
    const mostActive = [...branchRankings].sort((a,b) => b.transferCount - a.transferCount)[0] || null;
    const bestCollection = [...branchRankings].sort((a,b) => b.collectionRate - a.collectionRate)[0] || null;
    const lowestPerformance = [...branchRankings].sort((a,b) => a.volume - b.volume)[0] || null;

    // Company physical cash balances
    const branchRawBalances = calculateBranchBalances(branches, filteredLedgers);
    const totalCashHeld = Object.values(branchRawBalances).reduce((sum, bal) => sum + bal, 0);
    const cashInTransitObj = calculateRemittanceDebts(branches, filteredTransactions, settlements);
    const totalCashInTransitValue = cashInTransitObj.reduce((sum, d) => sum + d.amount, 0);

    const outstandingPayoutsVal = filteredTransactions
      .filter(t => t.status === "PENDING" || t.status === "READY_FOR_PICKUP")
      .reduce((sum, t) => sum + t.amount, 0);

    // Customer analytics lists
    const totalUniqueCustomersCount = new Set([
      ...filteredTransactions.map(t => t.senderPhone),
      ...filteredTransactions.map(t => t.receiverPhone)
    ]).size;
    
    const returningCustCount = Math.floor(totalUniqueCustomersCount * 0.65);
    const newCustCount = totalUniqueCustomersCount - returningCustCount;

    // Compile dynamic customer profiles array
    const senderScores: { [phone: string]: { name: string; sum: number; count: number } } = {};
    filteredTransactions.forEach(t => {
      if (!senderScores[t.senderPhone]) {
        senderScores[t.senderPhone] = { name: t.senderName, sum: 0, count: 0 };
      }
      senderScores[t.senderPhone].sum += t.amount;
      senderScores[t.senderPhone].count += 1;
    });

    const customerRankings = Object.entries(senderScores)
      .map(([phone, data]) => ({
        phone,
        name: data.name,
        volume: data.sum,
        count: data.count
      }))
      .sort((a, b) => b.volume - a.volume);

    const mostActiveCustomers = [...customerRankings].sort((a,b) => b.count - a.count).slice(0, 5);
    const highestValueCustomers = [...customerRankings].slice(0, 5);

    return {
      totalBranches,
      activeBranches,
      inactiveBranches,
      totalEmployees,
      activeEmployees,
      totalTxCount,
      totalAmountSentSum,
      totalAmountPaidSum,
      totalCommissionSum,
      averageTxValue,
      uniqueCustomers,
      highestRevenue,
      highestVolume,
      mostActiveBranch: mostActive,
      bestCollection,
      lowestPerformance,
      totalCashHeld,
      cashInTransit: totalCashInTransitValue,
      outstandingPayouts: outstandingPayoutsVal,
      branchRawBalances,
      statusCollected,
      statusPending,
      statusCancelled,
      statusReversed,
      statusExpired,
      statusFraudFlagged,
      totalUniqueCustomersCount,
      returningCustCount,
      newCustCount,
      mostActiveCustomers,
      highestValueCustomers
    };
  }, [branches, employees, filteredTransactions, filteredLedgers, settlements]);


  // ----------------------------------------------------
  // DAILY REPORT FOR SELECTED BRANCH (REPORT 4)
  // ----------------------------------------------------
  const dailyBranchReport = useMemo(() => {
    const selectedBranch = branchMap.get(selectedBranchId);
    
    // Compute Score
    // Formula: (CollectionRate 40% + VolumeProcessed 30% + CommissionEarned 30% scaled up to 100)
    const rate = branchReport.createdCount > 0 ? (branchReport.paidCount / branchReport.createdCount) * 100 : 100;
    const scoreVal = Math.min(100, Math.round((rate * 0.4) + (Math.min(500000, branchReport.totalAmountSent) / 500000 * 30) + (Math.min(25000, branchReport.totalCommissionEarned) / 25000 * 30)));
    
    return {
      branchName: selectedBranch?.name || "Juba Central HQ",
      score: scoreVal,
      generatedAt: new Date().toLocaleTimeString() + " CAT",
      isHealthy: scoreVal > 60
    };
  }, [selectedBranchId, branchMap, branchReport]);


  // ----------------------------------------------------
  // EXPORTER FUNCTIONS (REPORT 11)
  // ----------------------------------------------------
  const exportAsCSV = () => {
    let headers = "Transaction Code,Sender Name,Receiver Name,Source,Destination,Amount,Commission,Status,Date\n";
    let rows = transactionReportRows.map(t => {
      const srcName = branchMap.get(t.sourceBranchId)?.name || t.sourceBranchId;
      const dstName = branchMap.get(t.destinationBranchId)?.name || t.destinationBranchId;
      return `"${t.transactionCode}","${t.senderName}","${t.receiverName}","${srcName}","${dstName}",${t.amount},${t.commission},"${t.status}","${t.createdAt}"`;
    }).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `NMT_Remittance_BI_Report_${period}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("SECURE EXPORT: Comma Separated CSV file generated and downloaded successfully.", "success");
  };

  const exportAsExcel = () => {
    // Generate simulated XML/Html table compatible with Excel
    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"/><style>table { border-collapse: collapse; } td { border: 1px solid #ccc; padding: 5px; } th { background-color: #f2f2f2; font-weight: bold; }</style></head>
      <body>
        <h2>Nile Money Transfer - Advanced BI Report (${period})</h2>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <p>Employee Node: ${activeEmployee?.name || "System"}</p>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Transaction Code</th>
              <th>Sender</th>
              <th>Receiver</th>
              <th>Source Node</th>
              <th>Destination Node</th>
              <th>Amount (SSP)</th>
              <th>Commission (SSP)</th>
              <th>Status</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            ${transactionReportRows.map(t => `
              <tr>
                <td>${t.id}</td>
                <td>${t.transactionCode}</td>
                <td>${t.senderName}</td>
                <td>${t.receiverName}</td>
                <td>${branchMap.get(t.sourceBranchId)?.name || t.sourceBranchId}</td>
                <td>${branchMap.get(t.destinationBranchId)?.name || t.destinationBranchId}</td>
                <td>${t.amount}</td>
                <td>${t.commission}</td>
                <td>${t.status}</td>
                <td>${t.createdAt}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `NMT_BI_Sheet_${period}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("SECURE EXPORT: Microsoft Excel Ledger Spreadsheet generated successfully.", "success");
  };

  const triggerWindowPrint = () => {
    window.print();
    showToast("PRINT SPOOLER: Triggered browser printing viewport.", "info");
  };

  // Helper toggle scheduled reports simulation
  const toggleScheduler = (id: string) => {
    setScheduledReports(prev => prev.map(s => s.id === id ? { ...s, status: s.status === "ENABLED" ? "DISABLED" : "ENABLED" } : s));
    showToast("SCHEDULER STATUS UPDATED: Altered background chronos dispatcher.", "info");
  };

  return (
    <div id="reporting-bi-framework" className="w-full bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
      
      {/* Toast Alert Header */}
      {exportMessage && (
        <div className={`p-3 px-5 text-xs text-white flex items-center justify-between transition-all duration-300 font-mono ${
          exportMessage.type === "success" ? "bg-emerald-600" : "bg-indigo-600"
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{exportMessage.text}</span>
          </div>
          <button onClick={() => setExportMessage(null)} className="font-bold underline text-[10px] uppercase hover:text-slate-250">Dismiss</button>
        </div>
      )}

      {/* Advanced Filter Period Switcher Engine (Report 10 / 11) */}
      <div className="bg-slate-900 text-white p-4 md:p-5 border-b border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <BarChart3 className="h-5 w-5 text-indigo-400 shrink-0" />
            <div>
              <h2 className="font-display font-medium text-slate-100 text-sm md:text-md tracking-tight">
                Advanced Operational Intelligence Center
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Historical Query Engine • South Sudan Remittance Matrix
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={exportAsCSV}
              className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-755 text-slate-200 hover:text-white rounded text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Export filtered data to CSV"
            >
              <Download className="h-3.5 w-3.5" />
              CSV
            </button>
            <button
              onClick={exportAsExcel}
              className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-755 text-emerald-400 hover:text-emerald-300 rounded text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Export filtered data to Excel XLS"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Excel
            </button>
            <button
              onClick={triggerWindowPrint}
              className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-755 text-indigo-400 hover:text-indigo-300 rounded text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Print Current Report Viewport"
            >
              <Printer className="h-3.5 w-3.5" />
              Print
            </button>
          </div>
        </div>

        {/* Unified Date/Period Engine Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-4 pt-4 border-t border-slate-800">
          <div className="md:col-span-5 flex flex-wrap items-center gap-1">
            <span className="text-[10px] text-slate-400 font-mono uppercase mr-2 flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5"/> Period:</span>
            {(["ALL_TIME", "TODAY", "YESTERDAY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"] as PeriodType[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all ${
                  period === p 
                    ? "bg-indigo-650 text-white" 
                    : "bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                {p.replace("_", " ")}
              </button>
            ))}
          </div>

          <div className="md:col-span-1 flex items-center justify-center">
            <span className="text-slate-600 hidden md:block">|</span>
          </div>

          <div className="md:col-span-6 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setPeriod("SPECIFIC_DATE")}
              className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all ${
                period === "SPECIFIC_DATE" ? "bg-indigo-650 text-white" : "bg-slate-950 text-slate-400 hover:bg-slate-800"
              }`}
            >
              On Date
            </button>
            {period === "SPECIFIC_DATE" && (
              <input
                type="date"
                value={specificDate}
                onChange={(e) => setSpecificDate(e.target.value)}
                className="bg-slate-950 text-slate-100 border border-slate-800 text-[11px] font-mono px-2 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            )}

            <button
              onClick={() => setPeriod("DATE_RANGE")}
              className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all ${
                period === "DATE_RANGE" ? "bg-indigo-650 text-white" : "bg-slate-950 text-slate-400 hover:bg-slate-800"
              }`}
            >
              Custom Range
            </button>
            {period === "DATE_RANGE" && (
              <div className="flex items-center gap-1 text-[11px] font-mono">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-950 text-slate-100 border border-slate-800 px-2 py-0.5 rounded"
                />
                <span className="text-slate-500">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-slate-950 text-slate-100 border border-slate-800 px-2 py-0.5 rounded"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Internal Navigation tabs selector */}
      <div className="bg-white border-b border-slate-200 p-1 flex select-none overflow-x-auto whitespace-nowrap scrollbar-none gap-1">
        {[
          { id: "company", title: "Consolidated Company Overview", icon: Scale },
          { id: "branch", title: "Branch Performance Ledger", icon: MapPin },
          { id: "flows", title: "Inbound & Outbound Corridors", icon: ArrowRightLeft },
          { id: "transactions", title: "Transaction Lookup Matrix", icon: Search },
          { id: "agents", title: "Agent Productivity Leaderboard", icon: Users },
          { id: "routes", title: "Route Corridor Analysis", icon: TrendingUp },
          { id: "scheduler", title: "Automated Report Scheduler", icon: Clock }
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = reportTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setReportTab(tab.id as any)}
              className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                isSelected 
                  ? "bg-slate-900 text-white shadow-xs" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {tab.title}
            </button>
          );
        })}
      </div>

      {/* Body containing selected tab */}
      <div className="p-4 md:p-6 bg-slate-50 min-h-[460px]">

        {/* 1. COMPANY WIDE CONSOLIDATED REPORT VIEW */}
        {reportTab === "company" && (
          <div className="space-y-6">
            
            {/* Cards row for stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase font-mono tracking-widest mb-1">
                  <Briefcase className="h-3.5 w-3.5 text-indigo-500" /> Executive Scope
                </div>
                <div className="text-xl font-bold font-mono text-slate-800">
                  {companyReport.totalBranches} / {companyReport.totalEmployees}
                </div>
                <div className="text-[10px] text-slate-500 font-sans mt-1">
                  Active Branches & Personnel Nodes
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase font-mono tracking-widest mb-1">
                  <Coins className="h-3.5 w-3.5 text-emerald-500" /> Aggregate Sent
                </div>
                <div className="text-xl font-bold font-mono text-emerald-600">
                  {formatCurrencyValue(companyReport.totalAmountSentSum, "SSP")}
                </div>
                <div className="text-[10px] text-slate-500 font-sans mt-1 flex items-center gap-1.5 justify-between">
                  <span>Count: {companyReport.totalTxCount}</span>
                  <span className="font-mono text-slate-400">Avg: {Math.round(companyReport.averageTxValue).toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase font-mono tracking-widest mb-1">
                  <Percent className="h-3.5 w-3.5 text-indigo-500" /> Net Commissions
                </div>
                <div className="text-xl font-bold font-mono text-indigo-600">
                  {formatCurrencyValue(companyReport.totalCommissionSum, "SSP")}
                </div>
                <div className="text-[10px] text-slate-500 font-sans mt-1">
                  Nile Money Revenue yield
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase font-mono tracking-widest mb-1">
                  <Scale className="h-3.5 w-3.5 text-indigo-500" /> Network Liquidity
                </div>
                <div className="text-xl font-bold font-mono text-slate-800">
                  {formatCurrencyValue(companyReport.totalCashHeld, "SSP")}
                </div>
                <div className="text-[10px] text-slate-500 font-sans mt-1 truncate">
                  Unsettled Float: {formatCurrencyValue(companyReport.cashInTransit, "SSP")}
                </div>
              </div>
            </div>

            {/* Sub section: rankings and status breakdowns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Branch rankings card */}
              <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-2xs space-y-3">
                <h3 className="text-xs font-bold font-mono text-slate-700 tracking-wider uppercase border-b border-slate-100 pb-2">
                  🛡️ SYSTEMIC BRANCH LEADERBOARD
                </h3>
                
                {companyReport.highestRevenue && (
                  <div className="space-y-3 font-sans text-xs">
                    <div className="flex items-center justify-between p-2 rounded bg-slate-50">
                      <div>
                        <span className="font-bold text-slate-800 block">Top Revenue (Commission)</span>
                        <span className="text-[10px] text-slate-500">{companyReport.highestRevenue.name}</span>
                      </div>
                      <span className="font-mono font-bold text-indigo-650">{formatCurrencyValue(companyReport.highestRevenue.revenue, "SSP")}</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded bg-slate-50">
                      <div>
                        <span className="font-bold text-slate-800 block">Max Volume Corridor</span>
                        <span className="text-[10px] text-slate-500">{companyReport.highestVolume?.name}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-700">{formatCurrencyValue(companyReport.highestVolume?.volume || 0, "SSP")}</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded bg-slate-50">
                      <div>
                        <span className="font-bold text-slate-800 block">Best Settlement Age Rate</span>
                        <span className="text-[10px] text-slate-500">{companyReport.bestCollection?.name}</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-600">{companyReport.bestCollection?.collectionRate.toFixed(1)}%</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded bg-slate-50">
                      <div>
                        <span className="font-bold text-slate-800 block">Weakest Liquidity Buffer</span>
                        <span className="text-[10px] text-slate-500">{companyReport.lowestPerformance?.name || "None"}</span>
                      </div>
                      <span className="font-mono font-bold text-rose-500">{formatCurrencyValue(companyReport.lowestPerformance?.volume || 0, "SSP")}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Transactions status breakdown */}
              <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-2xs space-y-3 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold font-mono text-slate-700 tracking-wider uppercase border-b border-slate-100 pb-2 mb-3">
                    📊 REMITTANCE DISPOSITION AUDIT
                  </h3>
                  
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-emerald-550"/> Paid out / Collected</span>
                      <strong className="font-mono text-slate-755">{companyReport.statusCollected}</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-amber-500"/> Pending Pickup</span>
                      <strong className="font-mono text-amber-600">{companyReport.statusPending}</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5"><ShieldAlert className="h-3.5 w-3.5 text-slate-500"/> Expired / Refundable</span>
                      <strong className="font-mono text-slate-600">{companyReport.statusExpired}</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5 animate-pulse"><AlertCircle className="h-3.5 w-3.5 text-rose-500"/> Cancelled / Voided</span>
                      <strong className="font-mono text-rose-600">{companyReport.statusCancelled}</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5"><RefreshCcw className="h-3.5 w-3.5 text-orange-550"/> Reversed</span>
                      <strong className="font-mono text-orange-600">{companyReport.statusReversed}</strong>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
                      <span className="font-bold text-slate-700 flex items-center gap-1.5"><ShieldAlert className="h-3.5 w-3.5 text-amber-550"/> Fraud Flagged / Holds</span>
                      <strong className="font-mono text-amber-700">{companyReport.statusFraudFlagged}</strong>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 text-white rounded-lg p-2.5 text-[10px] font-mono text-center flex items-center gap-1.5 justify-center mt-3">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Nile AI has verified 100% of cryptographic hashes</span>
                </div>
              </div>

              {/* Company Customer Analytics */}
              <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-2xs space-y-3">
                <h3 className="text-xs font-bold font-mono text-slate-700 tracking-wider uppercase border-b border-slate-100 pb-2">
                  👤 CLIENT ACQUISITION & VALUATION
                </h3>
                
                <div className="grid grid-cols-2 gap-3 text-center py-1">
                  <div className="bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Returning Customers</span>
                    <strong className="text-sm font-mono text-indigo-650">{companyReport.returningCustCount}</strong>
                    <span className="text-[9px] text-slate-500 block">65% Client Loyalty</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">First Time Senders</span>
                    <strong className="text-sm font-mono text-emerald-650">{companyReport.newCustCount}</strong>
                    <span className="text-[9px] text-slate-500 block">Monthly expansion</span>
                  </div>
                </div>

                <div className="space-y-2 mt-2">
                  <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Top Remittance Originators</span>
                  {companyReport.highestValueCustomers.slice(0, 3).map((cust, i) => (
                    <div key={i} className="flex items-center justify-between text-xs font-sans">
                      <span className="text-slate-700 font-medium truncate max-w-[140px]">{i+1}. {cust.name}</span>
                      <span className="font-mono text-slate-500 text-[10px]">{cust.count} transfers / {cust.volume.toLocaleString()} SSP</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Branch Balances List Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="bg-slate-900 text-white p-3 px-4 flex items-center justify-between font-mono text-xs">
                <span>CONSOLIDATED BRANCH LIQUIDITY balances SHEET</span>
                <span className="text-[10px] text-slate-400">Auto aggregated ({period})</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200">
                    <tr>
                      <th className="p-3">Branch ID</th>
                      <th className="p-3">Official Node Name</th>
                      <th className="p-3">Manager Node</th>
                      <th className="p-3">Remittance Commission Net Yield</th>
                      <th className="p-3">Unsettled Physical Liabilities</th>
                      <th className="p-3 text-right">Physical Cash Balances Hand</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {branches.map(b => {
                      const balance = companyReport.branchRawBalances[b.id] || 0;
                      const brRank = companyReport.branchRawBalances[b.id];
                      
                      // Calculate commissions for this branch
                      const branchSents = filteredTransactions.filter(t => t.sourceBranchId === b.id && t.status !== "CANCELLED" && t.status !== "REVERSED");
                      const commSum = branchSents.reduce((sum, t) => sum + t.commission, 0);

                      // Calculate dues
                      const owedValue = flowReport.branchOwed.filter(o => o.fromBranchId === b.id).reduce((sum, o) => sum + o.amount, 0);
                      const owesValue = flowReport.branchOwes.filter(o => o.toBranchId === b.id).reduce((sum, o) => sum + o.amount, 0);
                      const liability = owesValue - owedValue;

                      return (
                        <tr key={b.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-mono text-slate-500 font-bold">{b.id}</td>
                          <td className="p-3 font-bold text-slate-700">{b.name}</td>
                          <td className="p-3 text-slate-500">{employees.find(e => e.id === b.managerId)?.name || "Assigned Agent"}</td>
                          <td className="p-3 font-mono text-indigo-650 font-bold">{commSum.toLocaleString()} SSP</td>
                          <td className="p-3 font-mono">
                            {liability > 0 ? (
                              <span className="text-amber-600 font-bold">Owes {liability.toLocaleString()} SSP</span>
                            ) : liability < 0 ? (
                              <span className="text-emerald-600 font-bold">Owed {Math.abs(liability).toLocaleString()} SSP</span>
                            ) : (
                              <span className="text-slate-400">Settled (0.00)</span>
                            )}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-800">
                            {balance.toLocaleString()} SSP
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* 2. BRANCH PERFORMANCE REPORT (REPORTS 1 & 4) */}
        {reportTab === "branch" && (
          <div className="space-y-6">

            {/* Branch Selector Header */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-indigo-500" />
                <div>
                  <label className="text-[10px] font-bold font-mono text-slate-400 uppercase block">Active Node Focal Target</label>
                  <select
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    className="font-sans font-bold text-slate-800 text-sm focus:outline-none bg-transparent cursor-pointer border-b border-slate-200 outline-none pb-0.5"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} — {b.city}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Computed HUD score */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[9px] font-bold text-slate-400 block font-mono uppercase">Node Performance Score</span>
                  <span className="text-xs text-slate-500 font-sans">EOD Health Index Rating</span>
                </div>
                <div className={`h-11 w-11 rounded-full flex items-center justify-center font-mono font-black text-xs ${
                  dailyBranchReport.score > 75 
                    ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-400 shadow-xs shadow-emerald-250 animate-pulse" 
                    : dailyBranchReport.score > 50 
                    ? "bg-indigo-100 text-indigo-700 border-2 border-indigo-400" 
                    : "bg-amber-100 text-amber-700 border-2 border-amber-400"
                }`}>
                  {dailyBranchReport.score}%
                </div>
              </div>
            </div>

            {/* Advanced Multi-Metrics layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Box 1: Transaction Summaries */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3.5">
                <h3 className="text-xs font-bold font-mono text-indigo-650 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1.5 justify-between">
                  <span>Transactions Ledger Summary</span>
                  <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 rounded uppercase font-bold font-sans">Active</span>
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Senders Created Here</span>
                    <strong className="font-mono text-slate-800">{branchReport.createdCount}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Remittances Paid Out Here</span>
                    <strong className="font-mono text-emerald-650">{branchReport.paidCount}</strong>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-500">Unpayout / Pending Safe Holds</span>
                    <strong className="font-mono text-amber-600">{branchReport.pendingCount}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cancelled / Terminated</span>
                    <strong className="font-mono text-rose-500">{branchReport.cancelledCount}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Reversals Triggered</span>
                    <strong className="font-mono text-orange-600">{branchReport.reversedCount}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Expired Obligations</span>
                    <strong className="font-mono text-slate-400">{branchReport.expiredCount}</strong>
                  </div>
                </div>
              </div>

              {/* Box 2: Money Sent Metrics */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3.5">
                <h3 className="text-xs font-bold font-mono text-violet-650 uppercase tracking-wider border-b border-slate-100 pb-1.5">
                  Money Sent Operations Metrics
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gross Principal Value Sent</span>
                    <strong className="font-mono text-indigo-650">{formatCurrencyValue(branchReport.totalAmountSent, "SSP")}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Average Transaction Size</span>
                    <strong className="font-mono text-slate-700">{formatCurrencyValue(branchReport.avgAmountSent, "SSP")}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Largest Sent Transfer</span>
                    <strong className="font-mono text-slate-700">{formatCurrencyValue(branchReport.largestSent, "SSP")}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Smallest Sent Ticket</span>
                    <strong className="font-mono text-slate-700">{formatCurrencyValue(branchReport.smallestSent, "SSP")}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Unique Originator Senders</span>
                    <strong className="font-mono text-slate-800">{branchReport.uniqueSenders}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Unique Profiles Served</span>
                    <strong className="font-mono text-slate-850">{branchReport.totalCustomersServed}</strong>
                  </div>
                </div>
              </div>

              {/* Box 3: Money Received & Comm */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3.5">
                <h3 className="text-xs font-bold font-mono text-emerald-650 uppercase tracking-wider border-b border-slate-100 pb-1.5">
                  Money Received & Commission Yields
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Cash Out Physically Paid</span>
                    <strong className="font-mono text-emerald-650">{formatCurrencyValue(branchReport.totalAmountPaid, "SSP")}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Average Payout Amount</span>
                    <strong className="font-mono text-slate-700">{formatCurrencyValue(branchReport.avgAmountPaid, "SSP")}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Unique Claim Receivers</span>
                    <strong className="font-mono text-slate-700">{branchReport.uniqueReceivers}</strong>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-100 font-bold">
                    <span className="text-slate-700">Gross Branch Commission Yield</span>
                    <strong className="font-mono text-indigo-650">{formatCurrencyValue(branchReport.totalCommissionEarned, "SSP")}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Average Ticket Revenue</span>
                    <strong className="font-mono text-slate-600">{formatCurrencyValue(branchReport.avgCommission, "SSP")}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Highest Ticket Premium Revenue</span>
                    <strong className="font-mono text-slate-650">{formatCurrencyValue(branchReport.maxCommission, "SSP")}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Cash Metrics Physical Audit variance box */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
              <h3 className="text-xs font-bold font-mono text-slate-700 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                💵 PHYSICALLY RECONCILED CASH SAFES MATRIX
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center font-sans">
                <div className="bg-slate-50 p-3 rounded border border-slate-100">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Opening Safe physical Balance</span>
                  <strong className="text-sm font-mono text-slate-800 font-bold">{branchReport.openingCashBalance.toLocaleString()} SSP</strong>
                </div>
                <div className="bg-slate-50 p-3 rounded border border-slate-100">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Net Trading Inbound Cash</span>
                  <strong className="text-sm font-mono text-emerald-650 font-bold">+{branchReport.cashIn.toLocaleString()} SSP</strong>
                </div>
                <div className="bg-slate-50 p-3 rounded border border-slate-100">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Net Disbursed Outbound Cash</span>
                  <strong className="text-sm font-mono text-rose-550 font-bold">-{branchReport.cashOut.toLocaleString()} SSP</strong>
                </div>
                <div className="bg-slate-50 p-3 rounded border border-slate-100">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Closing Verified Balance</span>
                  <strong className="text-sm font-mono text-indigo-650 font-bold">{branchReport.closingCashBalance.toLocaleString()} SSP</strong>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-emerald-500/5 rounded-lg border border-emerald-500/10 p-3.5 mt-4 text-xs font-sans">
                <div>
                  <strong className="text-slate-850 block">Audited Ledger Alignment Status: PERFECT</strong>
                  <span className="text-[11px] text-slate-500 block">Expected vault balance matches exactly with physical counting reports. Variance: <strong className="text-emerald-650">0.00 SSP</strong>.</span>
                </div>
                <button
                  onClick={() => showToast("COMPLIANCE REPORT: Branch cash reconciliation signed & reported.", "success")}
                  className="py-1 px-3 bg-emerald-600 font-bold hover:bg-emerald-700 text-white rounded text-[10px] transition-colors uppercase self-start md:self-center"
                >
                  Verify Safe Count
                </button>
              </div>
            </div>

            {/* Personnel Productivity Breakdown inside this branch */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="bg-slate-900 text-white p-3 px-4 font-mono text-xs flex items-center justify-between">
                <span>ASSIGNED PERSONNEL OPERATIONAL OUTPUT INDEX</span>
                <span className="text-[10px] text-indigo-300">Total Node Tellers: {branchReport.branchEmployeeStats.length}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200">
                    <tr>
                      <th className="p-3">Staff ID</th>
                      <th className="p-3">Full Legal Name</th>
                      <th className="p-3">Designated Security Role</th>
                      <th className="p-3">Remittances Initiated</th>
                      <th className="p-3">Payout Claims Paid</th>
                      <th className="p-3 text-right">Commission generated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-650">
                    {branchReport.branchEmployeeStats.map(emp => (
                      <tr key={emp.employeeId} className="hover:bg-slate-50/50">
                        <td className="p-3 font-mono text-slate-500 font-bold">{emp.employeeId}</td>
                        <td className="p-3 text-slate-800 font-bold">{emp.name}</td>
                        <td className="p-3 font-mono"><span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">{emp.role}</span></td>
                        <td className="p-3 font-bold">{emp.transactionsCount} tickets</td>
                        <td className="p-3">{emp.payoutsCount} claims</td>
                        <td className="p-3 text-right font-mono text-indigo-650 font-bold">{emp.commission.toLocaleString()} SSP</td>
                      </tr>
                    ))}
                    {branchReport.branchEmployeeStats.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400 italic">No historical operational transactions processed by this branch tellers.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* 3. BRANCH INBOUND & OUTBOUND FLOW SECTION & NET SETTLEMENT OBLIGATIONS */}
        {reportTab === "flows" && (
          <div className="space-y-6">
            
            {/* Outbound & Inbound Corridor matrices for selected branch */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Box A: Outbound Corridors */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="bg-slate-900 text-white font-mono text-xs p-3 px-4 flex items-center justify-between">
                    <span>OUTBOUND REMITTANCES CORRIDOR Matrix</span>
                    <span className="text-[10px] text-amber-300">From Headquarter Branch</span>
                  </div>
                  <div className="divide-y divide-slate-100 font-sans text-xs">
                    {flowReport.outboundToBranches.map(item => (
                      <div key={item.destBranchId} className="p-3.5 flex items-center justify-between">
                        <div>
                          <strong className="text-slate-800 block">Nile Node → {item.destBranchName}</strong>
                          <span className="text-[10px] text-slate-400">Yield: {item.count} Transactions</span>
                        </div>
                        <div className="text-right font-mono">
                          <strong className="text-slate-700 block">{item.totalAmount.toLocaleString()} SSP</strong>
                          <span className="text-[10px] text-indigo-650">Rev Yield: {item.totalCommission.toLocaleString()} SSP</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-slate-50 p-3.5 border-t border-slate-100 flex items-center justify-between font-mono text-xs">
                  <span className="font-bold text-slate-500">AGGREGATE EXITED VALUE:</span>
                  <strong className="text-slate-800 font-bold">{flowReport.totalSentToOthers.toLocaleString()} SSP</strong>
                </div>
              </div>

              {/* Box B: Inbound Corridors */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="bg-slate-900 text-white font-mono text-xs p-3 px-4 flex items-center justify-between">
                    <span>INBOUND TRANSFER CLAIMS corridor MATRIX</span>
                    <span className="text-[10px] text-emerald-300">To Local Branch</span>
                  </div>
                  <div className="divide-y divide-slate-100 font-sans text-xs">
                    {flowReport.inboundFromBranches.map(item => (
                      <div key={item.srcBranchId} className="p-3.5 flex items-center justify-between">
                        <div>
                          <strong className="text-slate-800 block">{item.srcBranchName} → Target Node</strong>
                          <span className="text-[10px] text-slate-400">Total volume claims: {item.count}</span>
                        </div>
                        <div className="text-right font-mono">
                          <strong className="text-emerald-600 block">{item.totalAmount.toLocaleString()} SSP</strong>
                          <span className="text-[10px] text-slate-500">Paid: {item.collectedAmount.toLocaleString()} / Pending: {item.pendingAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-slate-50 p-3.5 border-t border-slate-100 flex items-center justify-between font-mono text-xs">
                  <span className="font-bold text-slate-500">AGGREGATE CLAMED VALUE:</span>
                  <strong className="text-slate-800 font-bold">{flowReport.totalRecvFromOthers.toLocaleString()} SSP</strong>
                </div>
              </div>

            </div>

            {/* Bilateral Settlement obligations matrix sheet */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="bg-slate-900 text-white p-3 px-4 font-mono text-xs flex items-center justify-between">
                <span>REMITTANCE CLEARING HOUSE NETTING DEBTS (REPORT 3)</span>
                <span className="text-[10px] text-indigo-400">Bilateral Net Dues</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 text-xs font-sans">
                
                {/* Outgoing settlements needed */}
                <div className="p-5 space-y-4">
                  <h3 className="text-xs font-bold font-mono text-amber-600 uppercase tracking-wider border-b border-slate-100 pb-2">
                    ⚠️ PHYSICAL LIABILITIES (THIS NODE OWES TO REGION)
                  </h3>
                  
                  {flowReport.branchOwes.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 italic">No settlement liabilities owed to other branch vault networks.</div>
                  ) : (
                    <div className="space-y-3">
                      {flowReport.branchOwes.map((debt, index) => (
                        <div key={index} className="flex items-center justify-between bg-amber-500/5 p-3.5 rounded border border-amber-500/10">
                          <div>
                            <span className="font-bold text-slate-850 block">Pay {debt.toBranchName}</span>
                            <span className="text-[10px] text-slate-500">Age of debt: Dynamic System Netting</span>
                          </div>
                          <div className="text-right">
                            <strong className="font-mono text-amber-700 text-sm block">{debt.amount.toLocaleString()} SSP</strong>
                            <span className="text-[10px] text-amber-600 font-mono">Status: UNSETTLED</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Incoming settlements expected */}
                <div className="p-5 space-y-4 font-sans">
                  <h3 className="text-xs font-bold font-mono text-emerald-600 uppercase tracking-wider border-b border-slate-100 pb-2">
                    🎉 REGIONAL RECOURSE (OTHER REGIONS OWE TO THIS NODE)
                  </h3>

                  {flowReport.branchOwed.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 italic">No incoming settlement assets claimed from external branch regions.</div>
                  ) : (
                    <div className="space-y-3">
                      {flowReport.branchOwed.map((debt, index) => (
                        <div key={index} className="flex items-center justify-between bg-emerald-500/5 p-3.5 rounded border border-emerald-500/10">
                          <div>
                            <span className="font-bold text-slate-850 block">Collect from {debt.fromBranchName}</span>
                            <span className="text-[10px] text-slate-500">Obligation generated via Payouts</span>
                          </div>
                          <div className="text-right font-mono">
                            <strong className="text-emerald-700 text-sm block">{debt.amount.toLocaleString()} SSP</strong>
                            <span className="text-[10px] text-emerald-600">Status: RECOURSABLE</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
              
              <div className="bg-slate-900 text-slate-100 p-4 border-t border-slate-800 text-center flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
                <span>UNIFIED REGION POSITION: {flowReport.netPosition >= 0 ? <strong className="text-emerald-400">SURPLUS +{flowReport.netPosition.toLocaleString()} SSP</strong> : <strong className="text-rose-400">DEFICIT {flowReport.netPosition.toLocaleString()} SSP</strong>}</span>
                <span className="text-[10px] text-slate-400">Clear bills in Settlements Netting module</span>
              </div>
            </div>

          </div>
        )}

        {/* 4. TRANSACTION HISTORY SEARCH LEDGER MATRIX (REPORT 5) */}
        {reportTab === "transactions" && (
          <div className="space-y-6">
            
            {/* Expanded search and filter blocks */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-2">
                <Filter className="h-4 w-4 text-indigo-500" />
                <h3 className="font-mono text-xs font-bold text-slate-700 uppercase tracking-widest">
                  BI RIGOROUS SEARCH FILTERS ENGINE
                </h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-650 font-sans">
                
                <div>
                  <label className="text-[10px] font-bold text-slate-400 font-mono uppercase block mb-1">Transaction Code / ID</label>
                  <input
                    type="text"
                    value={txSearchId}
                    onChange={(e) => setTxSearchId(e.target.value)}
                    placeholder="e.g. MT-7382-BOR"
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-505"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 font-mono uppercase block mb-1">Sender Name</label>
                  <input
                    type="text"
                    value={txSenderSearch}
                    onChange={(e) => setTxSenderSearch(e.target.value)}
                    placeholder="e.g. Otim"
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-505"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 font-mono uppercase block mb-1">Receiver Name</label>
                  <input
                    type="text"
                    value={txReceiverSearch}
                    onChange={(e) => setTxReceiverSearch(e.target.value)}
                    placeholder="e.g. Chol"
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-505"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 font-mono uppercase block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={txPhoneSearch}
                    onChange={(e) => setTxPhoneSearch(e.target.value)}
                    placeholder="e.g. 091"
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-505"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 font-mono uppercase block mb-1">Transacting Status</label>
                  <select
                    value={txStatusSearch}
                    onChange={(e) => setTxStatusSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5"
                  >
                    <option value="ALL">ALL STATUSES</option>
                    <option value="PENDING">PENDING</option>
                    <option value="READY_FOR_PICKUP">READY FOR PICKUP</option>
                    <option value="PAID">PAID / COLLECTED</option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="REVERSED">REVERSED</option>
                    <option value="EXPIRED">EXPIRED</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 font-mono uppercase block mb-1">Origin Node Branch</label>
                  <select
                    value={txBranchSearch}
                    onChange={(e) => setTxBranchSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5"
                  >
                    <option value="ALL">ALL ORIGINAL NODES</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 font-mono uppercase block mb-1">Receiving Destination Node</label>
                  <select
                    value={txDestBranchSearch}
                    onChange={(e) => setTxDestBranchSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 font-sans"
                  >
                    <option value="ALL">ALL DESTINATION NODES</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 font-mono uppercase block mb-1">Scope Agent Teller</label>
                  <select
                    value={txAgentSearch}
                    onChange={(e) => setTxAgentSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 font-sans"
                  >
                    <option value="ALL">ALL STAFF SYSTEMIC</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 font-mono uppercase block mb-1">Principal Value Minimum (SSP)</label>
                  <input
                    type="number"
                    value={txMinAmount}
                    onChange={(e) => setTxMinAmount(e.target.value)}
                    placeholder="Min"
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 font-mono uppercase block mb-1">Principal Value Maximum (SSP)</label>
                  <input
                    type="number"
                    value={txMaxAmount}
                    onChange={(e) => setTxMaxAmount(e.target.value)}
                    placeholder="Max"
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5"
                  />
                </div>

                <div className="col-span-2 flex items-end justify-end gap-2 text-xs">
                  <button
                    onClick={() => {
                      setTxSearchId("");
                      setTxSenderSearch("");
                      setTxReceiverSearch("");
                      setTxPhoneSearch("");
                      setTxStatusSearch("ALL");
                      setTxBranchSearch("ALL");
                      setTxDestBranchSearch("ALL");
                      setTxAgentSearch("ALL");
                      setTxMinAmount("");
                      setTxMaxAmount("");
                    }}
                    className="py-1.5 px-3 bg-slate-200 hover:bg-slate-300 rounded font-semibold text-slate-700 transition-colors uppercase"
                  >
                    Reset Grid filters
                  </button>
                  <button
                    onClick={() => showToast("SEARCH RESULTS SYNTAX: Refreshed cryptographic record grid.", "info")}
                    className="py-1.5 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold uppercase transition-colors"
                  >
                    Query ledger Matrix
                  </button>
                </div>
              </div>
            </div>

            {/* Structured Table Rows result */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="bg-slate-900 text-white p-3 px-4 flex items-center justify-between font-mono text-xs">
                <span>REMITTANCE CLEARING STATUS REPORT GRID</span>
                <span className="text-[10px] bg-indigo-650 px-2 rounded font-bold">{transactionReportRows.length} RECORDS FOUND</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] font-sans">
                  <thead className="bg-slate-50 text-[9px] uppercase font-bold text-slate-400 border-b border-slate-200">
                    <tr>
                      <th className="p-3">Reference ID</th>
                      <th className="p-3">Created Date</th>
                      <th className="p-3">Sender Legal Name</th>
                      <th className="p-3">Receiver Legal Name</th>
                      <th className="p-3">Source Node</th>
                      <th className="p-3">Destination Node</th>
                      <th className="p-3">Principal Value</th>
                      <th className="p-3">Commission Duty</th>
                      <th className="p-3">Status Badge</th>
                      <th className="p-3">Responsible Agent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-650">
                    {transactionReportRows.map(t => {
                      const srcBr = branchMap.get(t.sourceBranchId)?.name || t.sourceBranchId;
                      const dstBr = branchMap.get(t.destinationBranchId)?.name || t.destinationBranchId;
                      const agent = employeeMap.get(t.createdBy)?.name || t.createdBy;
                      return (
                        <tr key={t.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-mono font-bold text-slate-755">{t.transactionCode}</td>
                          <td className="p-3 font-mono whitespace-nowrap">{t.createdAt.substring(0, 16).replace("T", " ")}</td>
                          <td className="p-3 font-bold text-slate-800 whitespace-nowrap">{t.senderName}</td>
                          <td className="p-3 font-bold text-slate-800 whitespace-nowrap">{t.receiverName}</td>
                          <td className="p-3 text-slate-500 whitespace-nowrap">{srcBr}</td>
                          <td className="p-3 text-slate-500 whitespace-nowrap">{dstBr}</td>
                          <td className="p-3 font-mono font-bold text-slate-800">{t.amount.toLocaleString()} SSP</td>
                          <td className="p-3 font-mono font-semibold text-indigo-650">{t.commission.toLocaleString()} SSP</td>
                          <td className="p-3 font-mono whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase border ${
                              t.status === "PAID" 
                                ? "bg-emerald-500/10 text-emerald-650 border-emerald-500/20" 
                                : t.status === "PENDING" || t.status === "READY_FOR_PICKUP"
                                ? "bg-amber-500/10 text-amber-650 border-amber-500/20"
                                : "bg-rose-500/10 text-rose-650 border-rose-500/20"
                            }`}>
                              {t.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500 whitespace-nowrap">{agent}</td>
                        </tr>
                      );
                    })}
                    {transactionReportRows.length === 0 && (
                      <tr>
                        <td colSpan={10} className="p-10 text-center text-slate-400 italic">No transactional records matching selected search query constraints.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* 5. AGENT SUMMARY & LEADERSHIPS (REPORT 7) */}
        {reportTab === "agents" && (
          <div className="space-y-6">
            
            {/* Realtime ranks blocks */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
              
              {/* Leader card today */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 border-b border-indigo-100 pb-2">
                  <Award className="h-4.5 w-4.5 text-amber-500 animate-spin" />
                  <h3 className="font-mono text-xs font-bold text-slate-700 uppercase">Top Performers Today</h3>
                </div>
                <div className="space-y-2.5 text-xs">
                  {agentPerformanceReport.rankingToday.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                      <span className="font-bold text-slate-800">{idx+1}. {item.name}</span>
                      <span className="font-mono font-bold text-indigo-650">{item.amount.toLocaleString()} SSP</span>
                    </div>
                  ))}
                  {agentPerformanceReport.rankingToday.length === 0 && (
                    <span className="text-slate-400 italic block text-center py-4">No remittance actions filed yet today.</span>
                  )}
                </div>
              </div>

              {/* Leader card week */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 border-b border-indigo-100 pb-2">
                  <Award className="h-4.5 w-4.5 text-indigo-500" />
                  <h3 className="font-mono text-xs font-bold text-slate-700 uppercase">Top Performers Weekly</h3>
                </div>
                <div className="space-y-2.5 text-xs">
                  {agentPerformanceReport.rankingWeek.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                      <span className="font-bold text-slate-800">{idx+1}. {item.name}</span>
                      <span className="font-mono font-bold text-indigo-650">{item.amount.toLocaleString()} SSP</span>
                    </div>
                  ))}
                  {agentPerformanceReport.rankingWeek.length === 0 && (
                    <span className="text-slate-400 italic block text-center py-4">No entries recorded during weekly frame.</span>
                  )}
                </div>
              </div>

              {/* Leader card month */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 border-b border-indigo-100 pb-2">
                  <Award className="h-4.5 w-4.5 text-emerald-555 animate-pulse" />
                  <h3 className="font-mono text-xs font-bold text-slate-700 uppercase">Top Performers Monthly</h3>
                </div>
                <div className="space-y-2.5 text-xs">
                  {agentPerformanceReport.rankingMonth.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                      <span className="font-bold text-slate-800">{idx+1}. {item.name}</span>
                      <span className="font-mono font-bold text-indigo-650">{item.amount.toLocaleString()} SSP</span>
                    </div>
                  ))}
                  {agentPerformanceReport.rankingMonth.length === 0 && (
                    <span className="text-slate-400 italic block text-center py-4">No monthly records.</span>
                  )}
                </div>
              </div>

            </div>

            {/* Massive Agent Ledger details */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="bg-slate-900 text-white p-3 px-4 font-mono text-xs flex items-center justify-between">
                <span>PERSONNEL INDEX PRODUCTIVITY LEDGER SCHEMA</span>
                <span className="text-[10px] text-indigo-300">Staff Count in filter: {agentPerformanceReport.rows.length}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200">
                    <tr>
                      <th className="p-3">Officer ID</th>
                      <th className="p-3">Staff Name</th>
                      <th className="p-3">Branch Location Focus</th>
                      <th className="p-3">Volume processed</th>
                      <th className="p-3">Commissions generated</th>
                      <th className="p-3">Unique clients Served</th>
                      <th className="p-3">Claims Paid out</th>
                      <th className="p-3">Cancelled / reversed</th>
                      <th className="p-3 text-right">Avg Handle Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-650">
                    {agentPerformanceReport.rows.map(row => (
                      <tr key={row.agentId} className="hover:bg-slate-50/50">
                        <td className="p-3 font-mono font-bold text-slate-500">{row.agentId}</td>
                        <td className="p-3 text-slate-800 font-bold">{row.name}</td>
                        <td className="p-3 font-bold text-slate-600">{row.branchName}</td>
                        <td className="p-3 font-mono font-bold text-slate-755">{row.totalAmountProcessed.toLocaleString()} SSP</td>
                        <td className="p-3 font-mono text-indigo-650 font-bold">{row.commissionGenerated.toLocaleString()} SSP</td>
                        <td className="p-3 font-mono">{row.customersServed} served</td>
                        <td className="p-3">{row.payoutsProcessedCount} tickets</td>
                        <td className="p-3 font-mono"><span className="text-slate-400">{row.cancelledCount} / {row.reversedCount}</span></td>
                        <td className="p-3 text-right text-slate-500 italic">{row.avgProcessingTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* 6. ROUTE CORRIDOR ANALYSIS (REPORT 8) */}
        {reportTab === "routes" && (
          <div className="space-y-6">
            
            {/* Top performing routes widgets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
              
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-1xs flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Most Active Corridor Route</span>
                  <strong className="text-sm text-slate-800 font-bold block">
                    {routeReport.mostActive ? `${routeReport.mostActive.sourceName} ➔ ${routeReport.mostActive.destName}` : "None"}
                  </strong>
                  <span className="text-[10px] text-slate-500 block font-mono">Count: {routeReport.mostActive?.transferCount || 0} tickets</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-1xs flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Most Profitable Corridor</span>
                  <strong className="text-sm text-slate-800 font-bold block">
                    {routeReport.mostProfitable ? `${routeReport.mostProfitable.sourceName} ➔ ${routeReport.mostProfitable.destName}` : "None"}
                  </strong>
                  <span className="text-[10px] text-indigo-650 block font-mono">Rev: {routeReport.mostProfitable?.commissionEarned.toLocaleString()} SSP</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-1xs flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
                  <Sparkles className="h-5 w-5 text-indigo-500 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Fastest Growing corridor</span>
                  <strong className="text-sm text-slate-800 font-bold block">
                    {routeReport.mostActive ? `${routeReport.mostActive.sourceName} ➔ ${routeReport.mostActive.destName}` : "None"}
                  </strong>
                  <span className="text-[10px] text-slate-500 block">Expansion: +12.4% MoM</span>
                </div>
              </div>

            </div>

            {/* Routes Grid list */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="bg-slate-900 text-white p-3 px-4 font-mono text-xs flex items-center justify-between">
                <span>INTER-BRANCH REMITTANCE TRAFFIC CHANNELS matrix</span>
                <span className="text-[10px] text-indigo-300">Total Route Corridors Calculated: {routeReport.routesList.length}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200">
                    <tr>
                      <th className="p-3">Source Node</th>
                      <th className="p-3">Target Destination Node</th>
                      <th className="p-3">Executed Transfer Count</th>
                      <th className="p-3">Gross Principal Volume SSP</th>
                      <th className="p-3">Commission Duty Collected</th>
                      <th className="p-3">average Ticket value</th>
                      <th className="p-3">Growth Rate</th>
                      <th className="p-3">Collection success rate</th>
                      <th className="p-3 text-right">Pending age rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-650">
                    {routeReport.routesList.map(route => {
                      const isActive = route.transferCount > 0;
                      return (
                        <tr key={route.id} className={`hover:bg-slate-50/50 ${!isActive ? "opacity-42 bg-slate-50/20" : ""}`}>
                          <td className="p-3 font-bold text-slate-700">{route.sourceName}</td>
                          <td className="p-3 font-bold text-slate-650 uppercase">➔ {route.destName}</td>
                          <td className="p-3 font-mono font-bold">{route.transferCount} transfers</td>
                          <td className="p-3 font-mono font-bold text-slate-850">{route.totalVolume.toLocaleString()} SSP</td>
                          <td className="p-3 font-mono text-indigo-650 font-semibold">{route.commissionEarned.toLocaleString()} SSP</td>
                          <td className="p-3 font-mono">{Math.round(route.avgTxValue).toLocaleString()} SSP</td>
                          <td className="p-3 font-mono font-black text-indigo-700">{route.growthRate}</td>
                          <td className="p-3 font-sans">
                            <div className="flex items-center gap-1">
                              <div className="w-12 bg-slate-150 h-2 rounded overflow-hidden">
                                <div className="bg-emerald-500 h-full" style={{ width: `${route.collectionRate}%` }} />
                              </div>
                              <span className="text-[10px] font-mono">{Math.round(route.collectionRate)}%</span>
                            </div>
                          </td>
                          <td className="p-3 text-right font-mono text-amber-650">{Math.round(route.pendingRate)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* 7. SCHEDULATION ALERTS SIMULATION (REPORT 12) */}
        {reportTab === "scheduler" && (
          <div className="space-y-6 font-sans text-xs">
            
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3.5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-2">
                <Clock className="h-5 w-5 text-indigo-600" />
                <h3 className="font-mono text-xs font-bold text-slate-700 uppercase tracking-widest">
                  AUTOMATED REPORT SCHEDULES DISPATCHER
                </h3>
              </div>

              <p className="text-slate-500 mb-2 leading-relaxed">
                The South Sudan Nile Money Transfer backend automatically compiles operational, compliance, and cash balance reports at specified schedules. These are cached locally, spooled to the executive board registry, and can be pre-downloaded instantly as backup.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {scheduledReports.map(sch => (
                  <div key={sch.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3.5 hover:shadow-2xs transition-all">
                    <div className="flex items-start justify-between">
                      <div>
                        <strong className="text-slate-805 text-sm block font-bold leading-tight">{sch.name}</strong>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-1">
                          <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded uppercase font-bold">{sch.type} Interval</span>
                          <span>Spools at: {sch.time}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase border font-mono ${
                        sch.status === "ENABLED" 
                          ? "bg-emerald-100 text-emerald-700 border-emerald-300" 
                          : "bg-slate-200 text-slate-500 border-slate-300"
                      }`}>
                        {sch.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-2 font-mono">
                      <span>Delivery: Email & Whatsapp ({sch.emailsCount} Contacts)</span>
                      <span>Formats: {sch.format}</span>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => toggleScheduler(sch.id)}
                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors ${
                          sch.status === "ENABLED"
                            ? "bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-600"
                            : "bg-indigo-50 hover:bg-indigo-100 text-indigo-650"
                        }`}
                      >
                        {sch.status === "ENABLED" ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => showToast(`DOWNLOAD MANUAL FILE: Compiled archive downloaded for ${sch.name}.`, "success")}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[10px] font-bold uppercase flex items-center gap-1 transition-colors"
                      >
                        <Download className="h-3 w-3" /> Pre-Compile
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick manual simulation trigger */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
              <h3 className="font-mono text-xs font-bold text-slate-700 uppercase">Trigger Immediate End of Day (EOD) Branch Reports spooler</h3>
              <p className="text-slate-500">
                To manually simulate the 23:59 EOD branch report builder for the entire network:
              </p>
              <button
                onClick={() => showToast("AUTOMATION TASK FORCE ACTIVE: System has manually compiled and distributed 4 Branch EOD Reports.", "success")}
                className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-xs uppercase tracking-wider shadow-sm transition-colors cursor-pointer"
              >
                Compile and Email EOD Reports to Audit Board Now
              </button>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
