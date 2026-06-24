/**
 * South Sudan MTMS Shared Types
 */

export type Role = "OWNER" | "MANAGER" | "AGENT" | "AUDITOR";

export type TransactionStatus =
  | "PENDING"
  | "READY_FOR_PICKUP"
  | "PAID"
  | "CANCELLED"
  | "REVERSED"
  | "EXPIRED";

export type SettlementStatus = "PENDING" | "APPROVED" | "REJECTED" | "SETTLED";

export interface Business {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  createdAt: string;
}

export interface Branch {
  id: string;
  businessId: string;
  name: string;
  city: string;
  address: string;
  managerId: string; // Employee ID
  managerName?: string;
  phone?: string;
}

export interface Employee {
  id: string;
  businessId: string;
  branchId: string; // Can be "ALL" for OWNER / AUDITOR or specific Branch ID
  name: string;
  phone: string;
  email: string;
  role: Role;
  status: "ACTIVE" | "INACTIVE";
  pin: string;
}

export interface Transaction {
  id: string;
  transactionCode: string; // unique code, e.g. MT-7382-JUBA
  businessId: string;
  senderName: string;
  senderPhone: string;
  senderIdNum?: string;
  senderLocation: string;
  receiverName: string;
  receiverPhone: string;
  sourceBranchId: string;
  destinationBranchId: string;
  amount: number;
  commission: number;
  currency: "SSP" | "USD";
  notes?: string;
  status: TransactionStatus;
  pin: string;
  createdBy: string; // Employee ID
  createdByName?: string; // Cache employee name
  createdAt: string;
  payoutAgentId?: string;
  payoutAgentName?: string;
  payoutAt?: string;
  payoutBranchId?: string;
  isOfflineCreated?: boolean; // Flag to trace offline generated entries
}

export interface CashLedger {
  id: string;
  branchId: string;
  type: "CASH_IN" | "CASH_OUT" | "ADJUSTMENT";
  amount: number;
  reference: string; // "Opening Balance", transactionCode, etc.
  notes?: string;
  createdAt: string;
}

export interface Settlement {
  id: string;
  fromBranchId: string;
  toBranchId: string;
  amount: number;
  status: SettlementStatus;
  notes?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  role?: string;
  branchId?: string;
  action: string;
  timestamp: string;
  deviceInfo?: string;
  ipAddress?: string;
  affectedRecord?: string;
  details?: string;
}

export interface SyncPacket {
  transactions: Transaction[];
  cashLedgers: CashLedger[];
  settlements: Settlement[];
  auditLogs: AuditLog[];
}

export interface SyncResponse {
  success: boolean;
  syncedTransactionCodes: string[];
  serverState: {
    transactions: Transaction[];
    branches: Branch[];
    employees: Employee[];
    cashLedgers: CashLedger[];
    settlements: Settlement[];
    auditLogs: AuditLog[];
  };
  conflictLog: string[];
}
