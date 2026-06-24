import React, { useState, useEffect, useMemo } from "react";
import { 
  Business, 
  Branch, 
  Employee, 
  Transaction, 
  CashLedger, 
  Settlement, 
  AuditLog,
  SyncPacket
} from "./types.js";
import { PersonaHub } from "./components/PersonaHub.tsx";
import { LoginScreen } from "./components/LoginScreen.tsx";
import { OfflineSyncPanel } from "./components/OfflineSyncPanel.tsx";
import { RemittanceList } from "./components/RemittanceList.tsx";
import { SendMoneyForm } from "./components/SendMoneyForm.tsx";
import { ReceiveMoneyForm } from "./components/ReceiveMoneyForm.tsx";
import { SettlementsModule } from "./components/SettlementsModule.tsx";
import { AIIntelligenceCore } from "./components/AIIntelligenceCore.tsx";
import { ExecutiveDashboard } from "./components/ExecutiveDashboard.tsx";
import { ReportingModule } from "./components/ReportingModule.tsx";
import { formatCurrencyValue, calculateBranchBalances, generateReceiptTemplate } from "./utils.js";
import { 
  Building, 
  Users, 
  Send, 
  Coins, 
  Handshake, 
  Sparkles, 
  GitCompare, 
  Settings, 
  DollarSign, 
  Plus, 
  ShieldAlert, 
  FileCode,
  FileText,
  Activity,
  History,
  Info,
  ChevronDown,
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
  Menu
} from "lucide-react";

export default function App() {
  // Global backend state loaded from Server API
  const [serverState, setServerState] = useState<{
    business: Business;
    branches: Branch[];
    employees: Employee[];
    transactions: Transaction[];
    cashLedgers: CashLedger[];
    settlements: Settlement[];
    auditLogs: AuditLog[];
  } | null>(null);

  const [activeTab, setActiveTab] = useState<string>("remittances");
  const [activeEmployeeId, setActiveEmployeeId] = useState<string>("emp-1"); // Starts as Jacob (Owner)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Selected code context for payout pre-filling
  const [selectedPayoutCode, setSelectedPayoutCode] = useState<string>("");

  // Offline local queue state
  const [offlineSends, setOfflineSends] = useState<Transaction[]>([]);
  const [offlinePayouts, setOfflinePayouts] = useState<any[]>([]);
  const [offlineLedgers, setOfflineLedgers] = useState<CashLedger[]>([]);

  // Manual safe balance adjustment form state
  const [adjAmount, setAdjAmount] = useState<number | "">("");
  const [adjType, setAdjType] = useState<"CASH_IN" | "CASH_OUT">("CASH_IN");
  const [adjNotes, setAdjNotes] = useState<string>("");
  const [adjError, setAdjError] = useState<string | null>(null);

  // Business registration profile form state
  const [bizName, setBizName] = useState("");
  const [bizPhone, setBizPhone] = useState("");
  const [bizEmail, setBizEmail] = useState("");
  const [bizAddress, setBizAddress] = useState("");

  // Branch creation form state
  const [brName, setBrName] = useState("");
  const [brCity, setBrCity] = useState("Bor");
  const [brAddress, setBrAddress] = useState("");
  const [brPhone, setBrPhone] = useState("");

  // Employee creation form state
  const [empFullName, setEmpFullName] = useState("");
  const [empPhone, setEmpPhone] = useState("");
  const [empRole, setEmpRole] = useState<"MANAGER" | "AGENT" | "AUDITOR">("AGENT");
  const [empBranchId, setEmpBranchId] = useState("");

  // Receipt popup display trigger modal
  const [activeReceipt, setActiveReceipt] = useState<Transaction | null>(null);

  // Navigation sidebar & mobile states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavVisible, setIsMobileNavVisible] = useState(false);
  const [navGroupsExpanded, setNavGroupsExpanded] = useState({
    core: true,
    finance: true,
    admin: true,
  });

  const toggleNavGroup = (group: "core" | "finance" | "admin") => {
    setNavGroupsExpanded((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  // 1. Initial State Load
  const fetchState = async () => {
    try {
      setLoading(true);
      const headers: Record<string, string> = {};
      if (activeEmployeeId) {
        headers["x-employee-id"] = activeEmployeeId;
      }
      const res = await fetch("/api/state", { headers });
      if (!res.ok) throw new Error("Connection with Nile main server failed.");
      const data = await res.json();
      setServerState(data);
      
      // Sync state input forms
      if (data.business) {
        setBizName(data.business.name);
        setBizPhone(data.business.phone);
        setBizEmail(data.business.email);
        setBizAddress(data.business.address);
      }
      if (data.branches && data.branches.length > 0) {
        setEmpBranchId(data.branches[0].id);
      }
      setError(null);
    } catch (err: any) {
      setError("Working with offline seed backups. Could not query network server API.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();

    // Retrieve offline items from localStorage on startup
    try {
      const storedSends = localStorage.getItem("nile_offline_sends");
      const storedPayouts = localStorage.getItem("nile_offline_payouts");
      const storedLedgers = localStorage.getItem("nile_offline_ledgers");
      if (storedSends) setOfflineSends(JSON.parse(storedSends));
      if (storedPayouts) setOfflinePayouts(JSON.parse(storedPayouts));
      if (storedLedgers) setOfflineLedgers(JSON.parse(storedLedgers));
    } catch (e) {
      console.error("Local storage read failure:", e);
    }
  }, [activeEmployeeId, isLoggedIn]);

  // Compute Active Person context objects
  const activeEmployee = useMemo(() => {
    if (!serverState) return null;
    return serverState.employees.find((e) => e.id === activeEmployeeId) || null;
  }, [serverState, activeEmployeeId]);

  // Handle automatic workspace switching on role changes
  useEffect(() => {
    if (activeEmployee) {
      if (activeEmployee.role === "OWNER" || activeEmployee.role === "AUDITOR") {
        setActiveTab("dashboard");
      } else {
        setActiveTab("remittances");
      }
    }
  }, [activeEmployeeId, serverState]);

  // Combined client state including offline operations pending synchronization
  const combinedState = useMemo(() => {
    if (!serverState) return null;

    // Filter out duplicates. Server state takes absolute precedence
    const transactions = [...serverState.transactions];
    const cashLedgers = [...serverState.cashLedgers];
    const settlements = [...serverState.settlements];
    const auditLogs = [...serverState.auditLogs];

    // Merge offline sends if they are not already on server
    offlineSends.forEach((ot) => {
      if (!transactions.some((t) => t.transactionCode === ot.transactionCode)) {
        transactions.unshift(ot);
      }
    });

    // Apply offline payout disburser overlays (mark matched remittances status to 'PAID')
    offlinePayouts.forEach((op) => {
      const idx = transactions.findIndex((t) => t.transactionCode === op.code);
      if (idx !== -1 && transactions[idx].status !== "PAID") {
        transactions[idx] = {
          ...transactions[idx],
          status: "PAID",
          payoutAgentId: op.agentId,
          payoutAgentName: "Offline Agent",
          payoutAt: op.payoutAt,
          payoutBranchId: op.branchId
        };
      }
    });

    // Merge offline manual adjustments
    offlineLedgers.forEach((ol) => {
      if (!cashLedgers.some((c) => c.id === ol.id)) {
        cashLedgers.push(ol);
      }
    });

    return {
      business: serverState.business,
      branches: serverState.branches,
      employees: serverState.employees,
      transactions,
      cashLedgers,
      settlements,
      auditLogs
    };
  }, [serverState, offlineSends, offlinePayouts, offlineLedgers]);

  // Combined branch safe balances calculate
  const safeBalances = useMemo(() => {
    if (!combinedState) return {};
    return calculateBranchBalances(combinedState.branches, combinedState.cashLedgers);
  }, [combinedState]);

  const currentBranch = useMemo(() => {
    if (!combinedState || !activeEmployee) return null;
    return combinedState.branches.find((b) => b.id === activeEmployee.branchId) || null;
  }, [combinedState, activeEmployee]);

  // 2. Offline-First triggers
  const handleToggleOffline = (offline: boolean) => {
    setIsOffline(offline);
    // Log trace
    if (serverState) {
      const logMsg: AuditLog = {
        id: "aud-conn-" + Date.now(),
        userId: activeEmployeeId,
        userName: activeEmployee?.name || "Cashier",
        action: offline ? "DISCONNECT_NETWORK" : "CONNECT_NETWORK",
        timestamp: new Date().toISOString(),
        details: offline 
          ? "Switched terminal connection to OFFLINE mode dynamically. Remittances queue buffered in client storage." 
          : "Switched connection status to ONLINE. Locked and loaded handshake."
      };
      setServerState({
        ...serverState,
        auditLogs: [logMsg, ...serverState.auditLogs]
      });
    }
  };

  // 3. Send Remittance Handler
  const handleSendRemittance = async (txData: {
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
  }): Promise<Transaction | null> => {
    if (!serverState || !activeEmployee) return null;

    if (isOffline) {
      // Create local offline Transaction
      const branchCity = serverState.branches.find(b => b.id === activeEmployee.branchId)?.city?.toUpperCase() || "JUBA";
      const txCode = "MT-OFF-" + Math.floor(10000 + Math.random() * 90000) + "-" + branchCity;
      const pinCode = Math.floor(1000 + Math.random() * 9000).toString();

      const newOfflineTx: Transaction = {
        id: "tx-off-" + Date.now() + Math.round(Math.random() * 100),
        transactionCode: txCode,
        businessId: "biz-1",
        senderName: txData.senderName,
        senderPhone: txData.senderPhone,
        senderIdNum: txData.senderIdNum,
        senderLocation: txData.senderLocation,
        receiverName: txData.receiverName,
        receiverPhone: txData.receiverPhone,
        sourceBranchId: activeEmployee.branchId,
        destinationBranchId: txData.destinationBranchId,
        amount: txData.amount,
        commission: txData.commission,
        currency: txData.currency,
        notes: txData.notes,
        status: "PENDING",
        pin: pinCode,
        createdBy: activeEmployee.id,
        createdByName: activeEmployee.name,
        createdAt: new Date().toISOString(),
        isOfflineCreated: true
      };

      // Create offline collected cash ledger
      const newOfflineLedger: CashLedger = {
        id: "cl-off-" + Date.now() + Math.round(Math.random() * 1000),
        branchId: activeEmployee.branchId,
        type: "CASH_IN",
        amount: txData.amount + txData.commission,
        reference: txCode,
        notes: "Collected cash sent offline queue",
        createdAt: new Date().toISOString()
      };

      const updatedSends = [newOfflineTx, ...offlineSends];
      const updatedLedgers = [...offlineLedgers, newOfflineLedger];

      setOfflineSends(updatedSends);
      setOfflineLedgers(updatedLedgers);

      // Save to client
      localStorage.setItem("nile_offline_sends", JSON.stringify(updatedSends));
      localStorage.setItem("nile_offline_ledgers", JSON.stringify(updatedLedgers));

      return newOfflineTx;
    } else {
      // Submits to online API node list
      const res = await fetch("/api/transactions/send", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-employee-id": activeEmployeeId
        },
        body: JSON.stringify({
          ...txData,
          sourceBranchId: activeEmployee.branchId === "ALL"
            ? (serverState.branches.find(b => b.city === txData.senderLocation || b.id === "branch-juba")?.id || serverState.branches[0].id)
            : activeEmployee.branchId,
          createdBy: activeEmployee.id
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || " Remittance order failed to submit.");
      }

      const outcome = await res.json();
      
      // Pull down updated state to preserve absolute synchronization
      await fetchState();
      
      return outcome.transaction;
    }
  };

  // 4. Payout Disbursal Handler
  const handleProcessPayout = async (payoutData: {
    transactionCode: string;
    pin: string;
    receiverPhone: string;
    payoutAgentId: string;
    payoutBranchId: string;
  }): Promise<Transaction | null> => {
    if (!combinedState || !activeEmployee) return null;

    if (isOffline) {
      // Record offline disburser log
      const matchedIdx = combinedState.transactions.findIndex(t => t.transactionCode === payoutData.transactionCode);
      if (matchedIdx === -1) throw new Error("Transaction record target not found.");
      
      const originalTx = combinedState.transactions[matchedIdx];

      const payoutRecord = {
        code: payoutData.transactionCode,
        pin: payoutData.pin,
        receiverPhone: payoutData.receiverPhone,
        payoutAt: new Date().toISOString(),
        agentId: activeEmployee.id,
        branchId: activeEmployee.branchId
      };

      // Local ledger cash out
      const newOfflineLedger: CashLedger = {
        id: "cl-off-" + Date.now() + Math.round(Math.random() * 1000),
        branchId: activeEmployee.branchId,
        type: "CASH_OUT",
        amount: originalTx.amount,
        reference: originalTx.transactionCode,
        notes: "Offline paid cash payout disburser",
        createdAt: new Date().toISOString()
      };

      const updatedPayouts = [...offlinePayouts, payoutRecord];
      const updatedLedgers = [...offlineLedgers, newOfflineLedger];

      setOfflinePayouts(updatedPayouts);
      setOfflineLedgers(updatedLedgers);

      localStorage.setItem("nile_offline_payouts", JSON.stringify(updatedPayouts));
      localStorage.setItem("nile_offline_ledgers", JSON.stringify(updatedLedgers));

      // Return simulated paid transaction overlay
      return {
        ...originalTx,
        status: "PAID",
        payoutAgentId: activeEmployee.id,
        payoutAgentName: activeEmployee.name,
        payoutAt: payoutRecord.payoutAt,
        payoutBranchId: activeEmployee.branchId
      };
    } else {
      const res = await fetch("/api/transactions/payout", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-employee-id": activeEmployeeId
        },
        body: JSON.stringify(payoutData)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Authorization for disburser failed on Nile main server.");
      }

      const outcome = await res.json();
      await fetchState();
      return outcome.transaction;
    }
  };

  // 5. Cancellation Refund Handler
  const handleCancelTransaction = async (code: string) => {
    if (isOffline) {
      alert("⚠️ Direct Cancellation & Refund is disabled in Regional Offline state. Reconnect to main network to audit transactions.");
      return;
    }

    try {
      const res = await fetch("/api/transactions/cancel", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-employee-id": activeEmployeeId
        },
        body: JSON.stringify({
          transactionCode: code,
          status: "CANCELLED",
          actorId: activeEmployeeId
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Cancellation processing failed.");
      }

      alert(`Succesfully marked code "${code}" as CANCELLED. Refund disbursed to sender.`);
      await fetchState();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  // 6. Sync trigger
  const handleSyncTrigger = async () => {
    if (isOffline) return null;

    try {
      const syncPacket: SyncPacket = {
        transactions: offlineSends,
        cashLedgers: offlineLedgers,
        settlements: [],
        auditLogs: []
      };

      // Add offline payouts in transaction forms as Paid copies
      offlinePayouts.forEach((op) => {
        const matched = combinedState?.transactions.find(t => t.transactionCode === op.code);
        if (matched) {
          syncPacket.transactions.push({
            ...matched,
            status: "PAID",
            payoutAgentId: op.agentId,
            payoutAgentName: "Offline Tellers Dashboard",
            payoutAt: op.payoutAt,
            payoutBranchId: op.branchId
          });
        }
      });

      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-employee-id": activeEmployeeId
        },
        body: JSON.stringify(syncPacket)
      });

      if (!res.ok) throw new Error("Sync pipeline handshaked failed. Backend server rejected.");

      const result = await res.json();

      // Clear offline buffer caches completely
      setOfflineSends([]);
      setOfflinePayouts([]);
      setOfflineLedgers([]);
      localStorage.removeItem("nile_offline_sends");
      localStorage.removeItem("nile_offline_payouts");
      localStorage.removeItem("nile_offline_ledgers");

      // Update server state from returned sync master state
      setServerState(result.serverState);

      return {
        success: true,
        syncedTransactionCodes: result.syncedTransactionCodes,
        conflictLog: result.conflictLog
      };
    } catch (err) {
      console.error("Sync trigger failure:", err);
      throw err;
    }
  };

  // 7. Settlement Actions Creator
  const handleSettlementAction = async (settlementData: {
    id?: string;
    fromBranchId?: string;
    toBranchId?: string;
    amount?: number;
    action: "CREATE" | "APPROVE" | "REJECT" | "SETTLE";
    notes?: string;
  }): Promise<boolean> => {
    if (isOffline) {
      alert("⚠️ Cross-Branch physical treasury settlements cannot run in Regional Offline state.");
      return false;
    }

    try {
      const res = await fetch("/api/settlements", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-employee-id": activeEmployeeId
        },
        body: JSON.stringify(settlementData)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Settlement directive rejected by Nile treasury.");
      }

      await fetchState();
      return true;
    } catch (err: any) {
      alert("Settlement Error: " + err.message);
      return false;
    }
  };

  // 8. Run Gemini AI Analyzer
  const handleRunAIAnalysis = async (type: "insights" | "fraud" | "forecasting"): Promise<string | null> => {
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-employee-id": activeEmployeeId
        },
        body: JSON.stringify({ type })
      });
      if (!res.ok) throw new Error("AI Agent model processing bottleneck.");
      const data = await res.json();
      return data.result;
    } catch (err) {
      console.error("Gemini core offline:", err);
      return null;
    }
  };

  // 9. Manual Safe Balance Adjustment Form Trigger
  const handleManualSafeAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    setAdjError(null);

    if (!adjAmount || !adjNotes.trim()) {
      setAdjError("Specify adjustment cash sum and describe core adjustments details.");
      return;
    }

    if (!activeEmployee || activeEmployee.branchId === "ALL") {
      setAdjError("Admin role cannot allocate safe adjustments. Switch to active local Branch Manager.");
      return;
    }

    // Generate local Adjustment ledger entry
    const newAdjLedger: CashLedger = {
      id: "cl-adj-" + Date.now(),
      branchId: activeEmployee.branchId,
      type: adjType === "CASH_IN" ? "CASH_IN" : "CASH_OUT",
      amount: Number(adjAmount),
      reference: "Manager Safe Correction",
      notes: adjNotes,
      createdAt: new Date().toISOString()
    };

    if (isOffline) {
      const updatedLedgers = [...offlineLedgers, newAdjLedger];
      setOfflineLedgers(updatedLedgers);
      localStorage.setItem("nile_offline_ledgers", JSON.stringify(updatedLedgers));
      alert("Adjustments cached in local offline buffer safe. Sync to record globally.");
    } else {
      // Push via sync packet
      fetch("/api/sync", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-employee-id": activeEmployeeId
        },
        body: JSON.stringify({
          transactions: [],
          cashLedgers: [newAdjLedger],
          settlements: [],
          auditLogs: []
        })
      })
      .then(res => res.json())
      .then(res => {
        setServerState(res.serverState);
        alert("Safe adjusted and saved immediately to Nile Main database.");
      })
      .catch(err => {
        console.error(err);
        alert("Backend sync for adjustment failed. Cached local backup.");
      });
    }

    setAdjAmount("");
    setAdjNotes("");
  };

  // 10. Forms Submissions: Business profile, Branch node, Staff roster
  const handleUpdateBusinessProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/business", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-employee-id": activeEmployeeId
        },
        body: JSON.stringify({
          name: bizName,
          phone: bizPhone,
          email: bizEmail,
          address: bizAddress
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Action failed");
      }
      alert("Business registration profile updated successfully.");
      await fetchState();
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const handleCreateBranchNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brName || !brCity || !brAddress) {
      alert("Please fill out required branch details.");
      return;
    }

    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-employee-id": activeEmployeeId
        },
        body: JSON.stringify({
          name: brName,
          city: brCity,
          address: brAddress,
          phone: brPhone
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Branch creation rejected");
      }
      alert(`Terminal branch ${brName} established in ${brCity}. Seeded SSP 500,000 for safe opening balance.`);
      setBrName("");
      setBrAddress("");
      setBrPhone("");
      await fetchState();
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const handleRegisterEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empFullName || !empPhone || !empBranchId) {
      alert("Please specify name, phone, and assign branch node terminal.");
      return;
    }

    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-employee-id": activeEmployeeId
        },
        body: JSON.stringify({
          name: empFullName,
          phone: empPhone,
          role: empRole,
          branchId: empBranchId
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Roster registration failed.");
      }
      alert(`Staff specialist ${empFullName} registered and mapped.`);
      setEmpFullName("");
      setEmpPhone("");
      await fetchState();
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  // Render variables
  const syncQueueData = {
    transactions: offlineSends,
    payoutEntries: offlinePayouts
  };

  const branchNames = useMemo(() => {
    const map: { [id: string]: string } = {};
    if (combinedState) {
      combinedState.branches.forEach((b) => {
        map[b.id] = b.name;
      });
    }
    return map;
  }, [combinedState]);

  if (loading && !combinedState) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <Sparkles className="h-10 w-10 text-indigo-600 animate-spin mb-4" />
        <h1 className="font-display font-bold text-slate-800 text-lg">Retrieving Remittance Network Registry...</h1>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">Synchronizing live Juba Remittance and Vault Ledgers. Please pause...</p>
      </div>
    );
  }

  if (!combinedState) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="h-12 w-12 text-rose-500 mb-4" />
        <h1 className="font-display font-bold text-slate-800 text-lg">System Initialization Handshake Blocked</h1>
        <p className="text-xs text-slate-500 mt-1.5 max-w-sm">The MTMS registry database system could not handshake. Restart backend terminal or verify environment setup.</p>
        <button onClick={fetchState} className="mt-4 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded shadow">
          Retry Handshake
        </button>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <LoginScreen
        employees={combinedState.employees}
        branches={combinedState.branches}
        isOffline={isOffline}
        onLogin={async (empId, pin) => {
          try {
            const res = await fetch("/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ employeeId: empId, pin })
            });
            if (!res.ok) {
              const errData = await res.json();
              throw new Error(errData.error || "Authentication failed. Invalid secure PIN code.");
            }
            // If offline, we sync or directly set local active identity
            setActiveEmployeeId(empId);
            setIsLoggedIn(true);
          } catch (err: any) {
            console.error("Auth login tracking failed", err);
            throw err;
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      
      {/* 1. Sleek corporate banner brand head */}
      <header className="bg-slate-900 border-b border-indigo-950 text-white select-none">
        <div className="w-full max-w-7xl mx-auto px-4 py-4 md:py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-600 flex items-center justify-center border border-indigo-500 font-display font-bold text-sm tracking-widest text-white shadow shadow-indigo-600/30">
              NMT
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-black text-slate-100 text-base tracking-tight leading-none md:text-lg">
                  {combinedState.business.name}
                </h1>
                <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase tracking-wider">
                  MTMS v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-sans">
                South Sudan Remittances, Safe Logs, and Automated Cash Settlements
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 w-full sm:w-auto font-mono text-xs">
            <div className="bg-slate-800/80 px-3 py-1.5 rounded text-left border border-slate-750">
              <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block font-sans">Remote Server Node</span>
              <span className="text-emerald-400 font-bold block mt-0.5 leading-none flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                ACTIVE (Port 3000)
              </span>
            </div>

            <div className="bg-slate-800/80 px-3 py-1.5 rounded text-left border border-slate-755 hidden md:block">
              <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block font-sans">State HQ Location</span>
              <span className="text-slate-200 block font-bold font-sans mt-0.5">Juba, South Sudan</span>
            </div>

            {activeEmployee && (
              <div className="bg-slate-800/80 px-3 py-1.5 rounded text-left border border-slate-750 flex items-center gap-3">
                <div className="text-left hidden lg:block">
                  <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block font-sans">Access Bearer</span>
                  <span className="text-indigo-300 font-bold block mt-0.5 leading-none truncate max-w-[120px] font-sans">
                    {activeEmployee.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await fetch("/api/auth/logout", {
                        method: "POST",
                        headers: { 
                          "Content-Type": "application/json",
                          "x-employee-id": activeEmployeeId
                        },
                        body: JSON.stringify({ employeeId: activeEmployeeId })
                      });
                    } catch (err) {
                      console.error("Auth logout tracking failed", err);
                    }
                    setIsLoggedIn(false);
                  }}
                  className="px-2.5 py-1 bg-slate-950 hover:bg-rose-950 hover:text-rose-400 border border-slate-800 hover:border-rose-900 rounded-md font-sans text-[10px] font-bold text-slate-300 transition-colors uppercase cursor-pointer"
                  title="Lock terminal workspace session"
                >
                  Lock
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main wrapper viewport layout */}
      <main className="w-full max-w-7xl mx-auto px-4 pt-6">
        
        {/* Swappable Persona Sim Hub */}
        <PersonaHub
          employees={combinedState.employees}
          branches={combinedState.branches}
          activeEmployeeId={activeEmployeeId}
          onSelectEmployee={async (empId) => {
            const emp = combinedState.employees.find(e => e.id === empId);
            if (emp) {
              try {
                await fetch("/api/auth/login", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ employeeId: empId, pin: emp.pin })
                });
              } catch (err) {
                console.error("Persona simulation login log failed", err);
              }
            }
            setActiveEmployeeId(empId);
          }}
        />

        {/* Offline Sync Console Controller */}
        <OfflineSyncPanel
          isOffline={isOffline}
          onToggleOffline={handleToggleOffline}
          syncQueue={syncQueueData}
          onTriggerSync={handleSyncTrigger}
        />

        {/* Dynamic Warning Indicator when offline has queued, unsynced actions */}
        {!isOffline && (offlineSends.length > 0 || offlinePayouts.length > 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 px-4 mb-6 flex items-center justify-between gap-3 text-xs flex-wrap animate-pulse shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0" />
              <span className="text-amber-800 font-medium">
                <b>Reconciliation alert:</b> You have <b>{offlineSends.length + offlinePayouts.length} buffered regional transfers</b> created while offline. Restore connection and final-sync ledgers.
              </span>
            </div>
            <button
              onClick={handleSyncTrigger}
              className="py-1 px-3 bg-amber-600 hover:bg-amber-700 font-bold text-white text-[11px] rounded transition-all shadow-inner"
            >
              Reconcile Buffer Now
            </button>
          </div>
        )}

        {/* Collapsible, Grouped Left Navigation Sidebar Frame */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Collapsible Left Workspace Sidebar */}
          <div className={`${isSidebarCollapsed ? "lg:col-span-1" : "lg:col-span-3"} transition-all duration-300 bg-white border border-slate-200 rounded-xl p-3 md:p-4 shadow-sm`}>
            
            {/* Sidebar toggle button (desktop only) */}
            <div className="hidden lg:flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
              {!isSidebarCollapsed && (
                <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Workspace Desk</span>
              )}
              <button 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-1 px-1.5 rounded bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors mx-auto lg:mx-0"
                title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {isSidebarCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
              </button>
            </div>

            {/* Mobile Nav Header */}
            <div className="lg:hidden flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Workspaces Menu</span>
              <button
                onClick={() => setIsMobileNavVisible(!isMobileNavVisible)}
                className="py-1 px-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Menu className="h-3.5 w-3.5" />
                {isMobileNavVisible ? "Hide Groups" : "Show Groups"}
              </button>
            </div>

            {/* Navigation Body (Visible on desktop or when mobile is visible) */}
            <div className={`${!isMobileNavVisible ? "hidden lg:block font-sans" : "block font-sans"} space-y-4`}>
              
              {/* Group 1: CORE OPERATIONS */}
              <div className="space-y-1">
                <div 
                  onClick={() => !isSidebarCollapsed && toggleNavGroup('core')}
                  className={`flex items-center justify-between py-1.5 px-2 select-none ${isSidebarCollapsed ? "" : "cursor-pointer hover:bg-slate-50 rounded"}`}
                >
                  <div className="flex items-center gap-2 text-slate-500">
                    <Activity className="h-4 w-4 text-indigo-600" />
                    {!isSidebarCollapsed && <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Core Desk</span>}
                  </div>
                  {!isSidebarCollapsed && (
                    <span>
                      {navGroupsExpanded.core ? <ChevronUp className="h-3 w-3 text-slate-400" /> : <ChevronDown className="h-3 w-3 text-slate-400" />}
                    </span>
                  )}
                </div>

                {/* Sub Menu Links */}
                {(navGroupsExpanded.core || isSidebarCollapsed) && (
                  <div className={`space-y-1 ${isSidebarCollapsed ? "" : "pl-1 mt-1"}`}>
                    {(activeEmployee?.role === "OWNER" || activeEmployee?.role === "AUDITOR") && (
                      <button
                        id="tab-dashboard"
                        onClick={() => setActiveTab("dashboard")}
                        className={`w-full py-2 px-2.5 rounded-lg text-xs font-medium flex items-center gap-2 cursor-pointer transition-all ${
                          activeTab === "dashboard"
                            ? "bg-slate-905 text-slate-800 shadow-sm font-bold border-l-4 border-indigo-500 bg-slate-100"
                            : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/50"
                        }`}
                        title="Executive Board Home"
                      >
                        <Activity className="h-4 w-4 text-indigo-600 shrink-0" />
                        {!isSidebarCollapsed && <span className="truncate font-semibold text-slate-755">Executive Board Home</span>}
                      </button>
                    )}

                    <button
                      id="tab-remittances"
                      onClick={() => { setActiveTab("remittances"); setSelectedPayoutCode(""); }}
                      className={`w-full py-2 px-2.5 rounded-lg text-xs font-medium flex items-center gap-2 cursor-pointer transition-all ${
                        activeTab === "remittances"
                          ? "bg-slate-900 text-white shadow-sm font-bold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                      title="remittance Ledger"
                    >
                      <History className="h-4 w-4 shrink-0" />
                      {!isSidebarCollapsed && <span className="truncate">remittance Ledger</span>}
                    </button>
                    
                    {activeEmployee?.role !== "AUDITOR" && (
                      <button
                        id="tab-send"
                        onClick={() => setActiveTab("send")}
                        className={`w-full py-2 px-2.5 rounded-lg text-xs font-medium flex items-center gap-2 cursor-pointer transition-all ${
                          activeTab === "send"
                            ? "bg-indigo-650 text-white shadow-sm font-bold"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                        }`}
                        title="Send Money Desk"
                      >
                        <Send className="h-4 w-4 shrink-0" />
                        {!isSidebarCollapsed && <span className="truncate">Send Money Desk</span>}
                      </button>
                    )}

                    {activeEmployee?.role !== "AUDITOR" && (
                      <button
                        id="tab-receive"
                        onClick={() => setActiveTab("receive")}
                        className={`w-full py-2 px-2.5 rounded-lg text-xs font-medium flex items-center gap-2 cursor-pointer transition-all ${
                          activeTab === "receive"
                            ? "bg-emerald-650 text-white shadow-sm font-bold"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                        }`}
                        title="Receive claim Terminal"
                      >
                        <Coins className="h-4 w-4 shrink-0" />
                        {!isSidebarCollapsed && <span className="truncate">Receive claim Terminal</span>}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Group 2: VAULT & SETTLEMENTS */}
              <div className="space-y-1">
                <div 
                  onClick={() => !isSidebarCollapsed && toggleNavGroup('finance')}
                  className={`flex items-center justify-between py-1.5 px-2 select-none ${isSidebarCollapsed ? "" : "cursor-pointer hover:bg-slate-50 rounded"}`}
                >
                  <div className="flex items-center gap-2 text-slate-500">
                    <Building className="h-4 w-4 text-emerald-600" />
                    {!isSidebarCollapsed && <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Treasury & Vault</span>}
                  </div>
                  {!isSidebarCollapsed && (
                    <span>
                      {navGroupsExpanded.finance ? <ChevronUp className="h-3 w-3 text-slate-400" /> : <ChevronDown className="h-3 w-3 text-slate-400" />}
                    </span>
                  )}
                </div>

                {(navGroupsExpanded.finance || isSidebarCollapsed) && (
                  <div className={`space-y-1 ${isSidebarCollapsed ? "" : "pl-1 mt-1"}`}>
                    <button
                      id="tab-cash"
                      onClick={() => setActiveTab("cash")}
                      className={`w-full py-2 px-2.5 rounded-lg text-xs font-medium flex items-center gap-2 cursor-pointer transition-all ${
                        activeTab === "cash"
                          ? "bg-slate-900 text-white shadow-sm font-bold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                      title="Cash Safes & Logs"
                    >
                      <Building className="h-4 w-4 shrink-0" />
                      {!isSidebarCollapsed && <span className="truncate">Cash Safes & Logs</span>}
                    </button>

                    <button
                      id="tab-settlements"
                      onClick={() => setActiveTab("settlements")}
                      className={`w-full py-2 px-2.5 rounded-lg text-xs font-medium flex items-center gap-2 cursor-pointer transition-all ${
                        activeTab === "settlements"
                          ? "bg-slate-900 text-white shadow-sm font-bold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                      title="Branch Settlements Netting"
                    >
                      <Handshake className="h-4 w-4 shrink-0" />
                      {!isSidebarCollapsed && <span className="truncate">Settlements Netting</span>}
                    </button>

                    {(activeEmployee?.role === "OWNER" || activeEmployee?.role === "MANAGER" || activeEmployee?.role === "AUDITOR") && (
                      <button
                        id="tab-reports"
                        onClick={() => setActiveTab("reports")}
                        className={`w-full py-2 px-2.5 rounded-lg text-xs font-medium flex items-center gap-2 cursor-pointer transition-all ${
                          activeTab === "reports"
                            ? "bg-slate-905 text-slate-800 shadow-sm font-bold border-l-4 border-emerald-500 bg-slate-100"
                            : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/50"
                        }`}
                        title="Advanced Operational BI"
                      >
                        <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                        {!isSidebarCollapsed && <span className="truncate font-semibold text-slate-755">Operational BI & Reports</span>}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Group 3: COMPLIANCE & INTELLIGENCE */}
              <div className="space-y-1">
                <div 
                  onClick={() => !isSidebarCollapsed && toggleNavGroup('admin')}
                  className={`flex items-center justify-between py-1.5 px-2 select-none ${isSidebarCollapsed ? "" : "cursor-pointer hover:bg-slate-50 rounded"}`}
                >
                  <div className="flex items-center gap-2 text-slate-500">
                    <Settings className="h-4 w-4 text-teal-600" />
                    {!isSidebarCollapsed && <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">System & Admin</span>}
                  </div>
                  {!isSidebarCollapsed && (
                    <span>
                      {navGroupsExpanded.admin ? <ChevronUp className="h-3 w-3 text-slate-400" /> : <ChevronDown className="h-3 w-3 text-slate-400" />}
                    </span>
                  )}
                </div>

                {(navGroupsExpanded.admin || isSidebarCollapsed) && (
                  <div className={`space-y-1 ${isSidebarCollapsed ? "" : "pl-1 mt-1"}`}>
                    <button
                      id="tab-settings"
                      onClick={() => setActiveTab("settings")}
                      className={`w-full py-2 px-2.5 rounded-lg text-xs font-medium flex items-center gap-2 cursor-pointer transition-all ${
                        activeTab === "settings"
                          ? "bg-slate-900 text-white shadow-sm font-bold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                      title="Nodes Directory & Staff"
                    >
                      <Settings className="h-4 w-4 shrink-0" />
                      {!isSidebarCollapsed && <span className="truncate">Staff & Nodes</span>}
                    </button>

                    <button
                      id="tab-ai"
                      onClick={() => setActiveTab("ai")}
                      className={`w-full py-2 px-2.5 rounded-lg text-xs font-medium flex items-center gap-2 cursor-pointer transition-all ${
                        activeTab === "ai"
                          ? "bg-indigo-950 text-indigo-300 border border-indigo-900 shadow-sm font-bold animate-pulse"
                          : "text-indigo-650 hover:text-indigo-900 hover:bg-indigo-50/50"
                      }`}
                      title="Phase 2 AI Core"
                    >
                      <Sparkles className="h-4 w-4 shrink-0 text-indigo-500" />
                      {!isSidebarCollapsed && <span className="truncate">Phase 2 AI Core</span>}
                    </button>
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* Active Workspace Viewport Frame */}
          <div className={`${isSidebarCollapsed ? "lg:col-span-11" : "lg:col-span-9"} transition-all duration-300 space-y-6 w-full overflow-hidden`}>

        {/* Tab views switcher context panel */}
        {activeTab === "dashboard" && (
          <ExecutiveDashboard
            transactions={combinedState.transactions}
            branches={combinedState.branches}
            employees={combinedState.employees}
            cashLedgers={combinedState.cashLedgers}
            settlements={combinedState.settlements}
            onNavigateToTab={(tabId) => setActiveTab(tabId)}
            onPrintReceipt={(tx) => setActiveReceipt(tx)}
          />
        )}

        {activeTab === "reports" && (
          <ReportingModule
            transactions={combinedState.transactions}
            branches={combinedState.branches}
            employees={combinedState.employees}
            cashLedgers={combinedState.cashLedgers}
            settlements={combinedState.settlements}
            activeEmployee={activeEmployee}
            onPrintReceipt={(tx) => setActiveReceipt(tx)}
          />
        )}

        {activeTab === "remittances" && (
          <RemittanceList
            transactions={combinedState.transactions}
            branches={combinedState.branches}
            activeEmployee={activeEmployee}
            onPayoutClick={(code) => {
              setSelectedPayoutCode(code);
              setActiveTab("receive");
            }}
            onCancelClick={(code) => handleCancelTransaction(code)}
            onPrintReceipt={(tx) => setActiveReceipt(tx)}
            onSendClick={() => setActiveTab("send")}
          />
        )}

        {activeTab === "send" && (
          <SendMoneyForm
            activeEmployee={activeEmployee}
            branches={combinedState.branches}
            isOffline={isOffline}
            onSendRemittance={handleSendRemittance}
          />
        )}

        {activeTab === "receive" && (
          <ReceiveMoneyForm
            activeEmployee={activeEmployee}
            branches={combinedState.branches}
            transactions={combinedState.transactions}
            isOffline={isOffline}
            prefilledCode={selectedPayoutCode}
            onProcessPayout={handleProcessPayout}
          />
        )}

        {activeTab === "settlements" && (
          <SettlementsModule
            branches={combinedState.branches}
            settlements={combinedState.settlements}
            transactions={combinedState.transactions}
            activeEmployee={activeEmployee}
            onSettlementAction={handleSettlementAction}
          />
        )}

        {activeTab === "ai" && (
          <AIIntelligenceCore
            onRunAnalysis={handleRunAIAnalysis}
          />
        )}

        {/* Safes management logs view */}
        {activeTab === "cash" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Safe visual counters widgets */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 shadow-sm">
                <h3 className="font-display font-semibold text-slate-850 text-sm mb-4 flex items-center justify-between">
                  Corporate Physical Safe Tally
                  <span className="text-[10px] text-slate-400 font-mono">Closing Balance logs active</span>
                </h3>
                
                <div className="space-y-4">
                  {combinedState.branches.map((b) => {
                    const balance = safeBalances[b.id] || 0;
                    const maxCapacitySim = 10000000; // 10M SSP Sim cap
                    const ratio = Math.min((balance / maxCapacitySim) * 100, 100);

                    return (
                      <div key={b.id} className="text-xs leading-none">
                        <div className="flex items-center justify-between font-semibold text-slate-700 mb-1.5">
                          <span className="truncate">{b.name}</span>
                          <span className="font-mono font-bold text-slate-900">{formatCurrencyValue(balance)}</span>
                        </div>
                        {/* Progress meter */}
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/40 relative">
                          <div 
                            style={{ width: `${ratio}%` }}
                            className={`h-full rounded-full transition-all duration-300 ${
                              balance < 500000 
                                ? "bg-rose-500" 
                                : balance > 7000000 
                                ? "bg-indigo-600" 
                                : "bg-emerald-500"
                            }`}
                          ></div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                          <span>Seeded cap</span>
                          <span>
                            {balance < 500000 ? (
                              <span className="text-rose-500 font-bold animate-pulse">⚠️ Liquidity Low warnings</span>
                            ) : (
                              <span className="text-emerald-500 font-bold">✓ Safe Balance OK</span>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Adjust safe manual balancing form panel */}
              {activeEmployee && activeEmployee.branchId !== "ALL" ? (
                <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 shadow-sm">
                  <h3 className="font-display font-semibold text-slate-800 text-sm mb-1">
                    Manual Safe Adjustment
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
                     adjust branch safes (e.g. cash deliveries or safe box audit adjustments) for active node: <b>{currentBranch?.name}</b>:
                  </p>

                  <form onSubmit={handleManualSafeAdjustment} className="space-y-3.5 text-xs">
                    {adjError && (
                      <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 font-semibold rounded text-[11px]">
                        {adjError}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                          Adjustment Amount (SSP) *
                        </label>
                        <input
                          type="number"
                          required
                          value={adjAmount}
                          onChange={(e) => setAdjAmount(e.target.value === "" ? "" : Number(e.target.value))}
                          placeholder="e.g. 100000"
                          className="w-full bg-white border border-slate-200 rounded py-1 px-2.5 focus:outline-none font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                          Type *
                        </label>
                        <select
                          value={adjType}
                          onChange={(e) => setAdjType(e.target.value as any)}
                          className="w-full bg-white border border-slate-200 rounded py-1 px-2.5 focus:outline-none font-semibold"
                        >
                          <option value="CASH_IN">Safe Deposit (In)</option>
                          <option value="CASH_OUT">Safe Withdrawal (Out)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                        Adjustment notes & comments *
                      </label>
                      <input
                        type="text"
                        required
                        value={adjNotes}
                        onChange={(e) => setAdjNotes(e.target.value)}
                        placeholder="e.g. Safe opening capital balance correction..."
                        className="w-full bg-slate-50 border border-slate-200 py-1.5 px-2 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-1.5 bg-slate-900 border border-slate-950 hover:bg-slate-800 text-white font-bold rounded shadow-inner cursor-pointer"
                    >
                      Authorize Safe Correction
                    </button>
                    
                    {isOffline && (
                      <span className="block text-[9px] text-amber-500 text-center animate-pulse tracking-wide font-semibold mt-1">
                        ⚠️ Simulated offline balance adjustments will buffer local cache.
                      </span>
                    )}
                  </form>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-4 text-center text-xs text-slate-400">
                  <Info className="h-5 w-5 text-slate-350 mx-auto mb-2" />
                  Management lock: Only branch managers can authorize physical safe inventory adjustments. Swapped employee persona branch must be local node.
                </div>
              )}
            </div>

            {/* General Ledger entries list */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 md:p-5 overflow-hidden">
                <h3 className="font-display font-semibold text-slate-800 mb-3 flex items-center justify-between">
                  Safe Cash remitting logs (Auditorial Ledger)
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-150">
                        <th className="px-3 py-2.5">Date</th>
                        <th className="px-3 py-2.5">Branch Terminal Location</th>
                        <th className="px-3 py-2.5">Type</th>
                        <th className="px-3 py-2.5 text-right">Sum</th>
                        <th className="px-3 py-2.5">Audit Reference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {[...combinedState.cashLedgers].reverse().map((cl, cIdx) => {
                        const targetBr = combinedState.branches.find(b => b.id === cl.branchId);
                        return (
                          <tr key={cl.id || cIdx} className="hover:bg-slate-50/50">
                            <td className="px-3 py-2.5 font-mono text-[10px]">
                              {new Date(cl.createdAt).toLocaleDateString()} {new Date(cl.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </td>
                            <td className="px-3 py-2.5 font-medium text-slate-800">
                              {targetBr?.name || cl.branchId}
                            </td>
                            <td className="px-3 py-2.5 font-bold">
                              {cl.type === "CASH_IN" ? (
                                <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase text-[10px]">Cash In</span>
                              ) : cl.type === "CASH_OUT" ? (
                                <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded uppercase text-[10px]">Cash Out</span>
                              ) : (
                                <span className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase text-[10px]">Adjust</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">
                              {formatCurrencyValue(cl.amount)}
                            </td>
                            <td className="px-3 py-3 font-medium text-slate-600" title={cl.notes}>
                              <div className="font-mono text-[10.5px] font-bold text-slate-800">{cl.reference}</div>
                              <span className="text-[10px] text-slate-400 block font-normal mt-0.5">{cl.notes}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Corporate administration tab */}
        {activeTab === "settings" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Corporate Profile & Branch Creation Form */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Profile card */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 shadow-sm">
                <h3 className="font-display font-semibold text-slate-800 text-sm mb-3">
                  Remittance Corporate registration (Module 1)
                </h3>
                
                {activeEmployee?.role === "OWNER" ? (
                  <form onSubmit={handleUpdateBusinessProfile} className="space-y-3.5 text-xs">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">remit Name *</label>
                      <input
                        type="text"
                        required
                        value={bizName}
                        onChange={(e) => setBizName(e.target.value)}
                        className="w-full bg-slate-50 px-2 py-1.5 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none font-bold"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Corporate Phone *</label>
                        <input
                          type="text"
                          required
                          value={bizPhone}
                          onChange={(e) => setBizPhone(e.target.value)}
                          className="w-full bg-slate-50 px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Corporate Email *</label>
                        <input
                          type="email"
                          required
                          value={bizEmail}
                          onChange={(e) => setBizEmail(e.target.value)}
                          className="w-full bg-slate-50 px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">HQ Physical Registered Address *</label>
                      <input
                        type="text"
                        required
                        value={bizAddress}
                        onChange={(e) => setBizAddress(e.target.value)}
                        className="w-full bg-slate-50 px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded shadow-inner cursor-pointer text-xs"
                    >
                      Update Corporate credentials
                    </button>
                  </form>
                ) : (
                  <div className="bg-slate-50/70 p-3 border border-slate-200 rounded-lg text-xs leading-relaxed text-slate-500">
                    <ShieldAlert className="h-4 w-4 text-slate-400 inline mr-1.5" />
                    Manager and agents are locked from editing corporate license credentials. Select Jacob Ajak (Owner) profile above to manage credentials.
                  </div>
                )}
              </div>

              {/* Branch Node Creation Form (Module 2) */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 shadow-sm">
                <h3 className="font-display font-semibold text-slate-800 text-sm mb-3">
                  Setup New Terminal Node (Module 2)
                </h3>
                
                {activeEmployee?.role === "OWNER" ? (
                  <form onSubmit={handleCreateBranchNode} className="space-y-3.5 text-xs">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Branch Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Bentiu Market Branch"
                        value={brName}
                        onChange={(e) => setBrName(e.target.value)}
                        className="w-full bg-slate-50 px-2 py-1.5 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">City / Location *</label>
                        <select
                          value={brCity}
                          onChange={(e) => setBrCity(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded py-1 px-1 focus:outline-none"
                        >
                          <option value="Juba">Juba</option>
                          <option value="Bor">Bor</option>
                          <option value="Wau">Wau</option>
                          <option value="Malakal">Malakal</option>
                          <option value="Bentiu">Bentiu</option>
                          <option value="Yei">Yei</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Terminal Telephone (Opt)</label>
                        <input
                          type="text"
                          placeholder="+211 922..."
                          value={brPhone}
                          onChange={(e) => setBrPhone(e.target.value)}
                          className="w-full bg-slate-50 px-2 py-1 border border-slate-200 rounded focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Node physical location address *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Block C, Custom Market Lane"
                        value={brAddress}
                        onChange={(e) => setBrAddress(e.target.value)}
                        className="w-full bg-slate-50 px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-750 text-white font-bold rounded shadow-inner text-xs cursor-pointer"
                    >
                      Establish Node
                    </button>
                  </form>
                ) : (
                  <div className="bg-slate-50/75 p-3 border border-slate-200 rounded-lg text-xs leading-relaxed text-slate-550">
                    <ShieldAlert className="h-4 w-4 text-slate-405 inline mr-1.5" />
                    Branch creation is gated. Requires Owner credentials to establish regional remittance terminal slots.
                  </div>
                )}
              </div>

            </div>

            {/* Employee roster grid & registry (Module 3) */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Employee registration card */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 shadow-sm">
                <h3 className="font-display font-semibold text-slate-800 text-sm mb-3">
                  Staff register Roster (Module 3)
                </h3>
                
                {activeEmployee?.role === "OWNER" && (
                  <form onSubmit={handleRegisterEmployee} className="p-3.5 bg-slate-50 border border-slate-150 rounded-lg space-y-3.5 text-xs mb-5">
                    <h4 className="font-bold text-slate-500 text-[10px] uppercase tracking-wider">Register Operational Specialist</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Full Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Chol Dut Akot"
                          value={empFullName}
                          onChange={(e) => setEmpFullName(e.target.value)}
                          className="w-full bg-white px-2 py-1 border border-slate-200 rounded focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Telephone *</label>
                        <input
                          type="text"
                          required
                          placeholder="+211 911 345..."
                          value={empPhone}
                          onChange={(e) => setEmpPhone(e.target.value)}
                          className="w-full bg-white px-2 py-1 border border-slate-200 rounded focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Security Role *</label>
                        <select
                          value={empRole}
                          onChange={(e) => setEmpRole(e.target.value as any)}
                          className="w-full bg-white border border-slate-200 rounded py-1 px-1 focus:outline-none"
                        >
                          <option value="MANAGER">Manager (Branch administrator)</option>
                          <option value="AGENT">Agent (Terminal Cashier dispatcher)</option>
                          <option value="AUDITOR">Auditor (Compliance auditor review)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Assigned Operational Node *</label>
                        <select
                          value={empBranchId}
                          onChange={(e) => setEmpBranchId(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded py-1 px-1 focus:outline-none"
                        >
                          <option value="ALL">ALL NODES (HQ Owner/Auditors)</option>
                          {combinedState.branches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded shadow shadow-slate-950/25 cursor-pointer"
                    >
                      Map Employee to Nile Roster
                    </button>
                  </form>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 font-bold uppercase text-[10px] text-slate-400 border-b border-slate-150">
                        <th className="px-3 py-2">Full Name</th>
                        <th className="px-3 py-2">Assigned Terminal Node</th>
                        <th className="px-3 py-2">Role Badge</th>
                        <th className="px-3 py-2">Telephone</th>
                        <th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {combinedState.employees.map((emp) => {
                        const assignedBr = combinedState.branches.find(b => b.id === emp.branchId);
                        return (
                          <tr key={emp.id} className="hover:bg-slate-50/50">
                            <td className="px-3 py-2.5 font-semibold text-slate-800">{emp.name}</td>
                            <td className="px-3 py-2.5 text-slate-655 font-mono text-[10.5px]">
                              {assignedBr ? assignedBr.name : "Remittance ALL HQ"}
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="bg-slate-100 text-slate-800 border border-slate-200 font-bold px-1.5 py-0.5 rounded text-[10px] tracking-wide">
                                {emp.role}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 font-mono text-[10px] text-slate-500">{emp.phone}</td>
                            <td className="px-3 py-2.5">
                              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                ACTIVE
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Branch Directory list details */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 shadow-sm">
                <h3 className="font-display font-semibold text-slate-800 text-sm mb-3">
                  Node directory Terminal status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed">
                  {combinedState.branches.map(b => (
                    <div key={b.id} className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
                      <div className="font-bold text-slate-800">{b.name}</div>
                      <div className="text-slate-500 font-mono text-[10.5px] mt-1">ID: {b.id} • City: {b.city}</div>
                      <div className="text-slate-500">Address: {b.address}</div>
                      <div className="text-[10px] font-semibold text-indigo-600 mt-1">Seeded Vault: Active</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

          </div> {/* Closes Active Workspace Viewport Frame */}
        </div> {/* Closes Collapsible, Grouped Left Navigation Sidebar Frame */}

      </main>

      {/* 11. Printable receipts popup trigger modal overlay */}
      {activeReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-55 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xl p-5 max-w-lg w-full relative">
            <h3 className="font-display font-semibold text-slate-800 text-sm mb-3">remittance Receipt Slip</h3>
            
            <div className="border border-slate-200 bg-slate-50 p-4 rounded-lg select-text font-mono text-[10.5px] leading-relaxed mb-4 overflow-x-auto max-h-[30rem] overflow-y-auto">
              <pre>{generateReceiptTemplate(activeReceipt, branchNames)}</pre>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateReceiptTemplate(activeReceipt!, branchNames));
                  alert("Receipt copied!");
                }}
                className="py-1.5 px-3 border border-slate-200 hover:border-slate-300 text-slate-600 rounded text-xs font-semibold"
              >
                Copy Content
              </button>
              <button
                onClick={() => window.print()}
                className="py-1.5 px-3 bg-slate-900 text-white rounded text-xs font-semibold"
              >
                Launch Printer
              </button>
              <button
                onClick={() => setActiveReceipt(null)}
                className="py-1.5 px-3 bg-rose-600 text-white rounded text-xs font-semibold"
              >
                Dismiss Receipt
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
