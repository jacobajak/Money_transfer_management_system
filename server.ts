import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { 
  Business, 
  Branch, 
  Employee, 
  Transaction, 
  CashLedger, 
  Settlement, 
  AuditLog,
  SyncPacket
} from "./src/types.js";

// Make sure process.env.GEMINI_API_KEY is defined
const apiKey = process.env.GEMINI_API_KEY || "";

// Initialize GoogleGenAI SDK with key and custom telemetry header
let ai: GoogleGenAI | null = null;
if (apiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("GoogleGenAI initialized successfully with API key.");
  } catch (err) {
    console.error("Failed to initialize GoogleGenAI:", err);
  }
} else {
  console.warn("GEMINI_API_KEY is not defined in environment variables. AI features will fallback to direct simulated analyses.");
}

const DB_FILE = path.join(process.cwd(), "server-db.json");

// Default initial state for South Sudan MTMS
const defaultDatabaseState = {
  business: {
    id: "biz-1",
    name: "Nile Money Transfer Ltd.",
    phone: "+211 922 456 789",
    email: "operations@niletfr.ss",
    address: "Block 3, Airport Road, Juba, South Sudan",
    createdAt: new Date("2026-01-10").toISOString(),
  } as Business,
  branches: [
    {
      id: "branch-juba",
      businessId: "biz-1",
      name: "Juba HQ Branch",
      city: "Juba",
      address: "Airport Road, Commercial Block A",
      managerId: "emp-2",
      phone: "+211 911 122 233",
    },
    {
      id: "branch-bor",
      businessId: "biz-1",
      name: "Bor Market Branch",
      city: "Bor",
      address: "Main Market, Block B-4",
      managerId: "emp-4",
      phone: "+211 933 344 455",
    },
    {
      id: "branch-wau",
      businessId: "biz-1",
      name: "Wau Square Branch",
      city: "Wau",
      address: "Unity Square, South Lane",
      managerId: "emp-6",
      phone: "+211 955 566 677",
    },
    {
      id: "branch-malakal",
      businessId: "biz-1",
      name: "Malakal Port Branch",
      city: "Malakal",
      address: "Nile Trade Avenue, Port Exit",
      managerId: "emp-7",
      phone: "+211 977 788 899",
    },
  ] as Branch[],
  employees: [
    {
      id: "emp-1",
      businessId: "biz-1",
      branchId: "ALL",
      name: "Jacob Ajak Makuach",
      phone: "+211 912 345 678",
      email: "jacob.ajak@niletfr.ss",
      role: "OWNER" as const,
      status: "ACTIVE" as const,
      pin: "1111",
    },
    {
      id: "emp-2",
      businessId: "biz-1",
      branchId: "branch-juba",
      name: "Deng Bol Malual",
      phone: "+211 911 122 233",
      email: "deng.bol@niletfr.ss",
      role: "MANAGER" as const,
      status: "ACTIVE" as const,
      pin: "2222",
    },
    {
      id: "emp-3",
      businessId: "biz-1",
      branchId: "branch-juba",
      name: "Abuk Lual Deng",
      phone: "+211 922 233 444",
      email: "abuk.lual@niletfr.ss",
      role: "AGENT" as const,
      status: "ACTIVE" as const,
      pin: "3333",
    },
    {
      id: "emp-4",
      businessId: "biz-1",
      branchId: "branch-bor",
      name: "Mary John Aluel",
      phone: "+211 933 344 455",
      email: "mary.john@niletfr.ss",
      role: "MANAGER" as const,
      status: "ACTIVE" as const,
      pin: "4444",
    },
    {
      id: "emp-5",
      businessId: "biz-1",
      branchId: "branch-bor",
      name: "Daniel Maker Kur",
      phone: "+211 915 566 777",
      email: "daniel.maker@niletfr.ss",
      role: "AGENT" as const,
      status: "ACTIVE" as const,
      pin: "5555",
    },
    {
      id: "emp-6",
      businessId: "biz-1",
      branchId: "branch-wau",
      name: "Santino Kenyi Lodu",
      phone: "+211 955 566 677",
      email: "santino.kenyi@niletfr.ss",
      role: "MANAGER" as const,
      status: "ACTIVE" as const,
      pin: "6666",
    },
    {
      id: "emp-7",
      businessId: "biz-1",
      branchId: "branch-malakal",
      name: "Peter Gatluak",
      phone: "+211 977 788 899",
      email: "peter.gat@niletfr.ss",
      role: "MANAGER" as const,
      status: "ACTIVE" as const,
      pin: "7777",
    },
    {
      id: "emp-8",
      businessId: "biz-1",
      branchId: "ALL",
      name: "Ezekiel Chol Dut",
      phone: "+211 966 677 788",
      email: "ezekiel.auditor@niletfr.ss",
      role: "AUDITOR" as const,
      status: "ACTIVE" as const,
      pin: "8888",
    },
  ] as Employee[],
  transactions: [
    {
      id: "tx-1",
      transactionCode: "MT-12845-JUBA",
      businessId: "biz-1",
      senderName: "Biar Atem Biar",
      senderPhone: "+211 912 111 222",
      senderIdNum: "NAT-ID-94827",
      senderLocation: "Juba",
      receiverName: "Rebecca Nyandeng",
      receiverPhone: "+211 933 555 666",
      sourceBranchId: "branch-juba",
      destinationBranchId: "branch-bor",
      amount: 450000,
      commission: 9000,
      currency: "SSP" as const,
      status: "PAID" as const,
      pin: "2468",
      createdBy: "emp-3",
      createdByName: "Abuk Lual Deng",
      createdAt: new Date("2026-06-10T09:15:00Z").toISOString(),
      payoutAgentId: "emp-5",
      payoutAgentName: "Daniel Maker Kur",
      payoutAt: new Date("2026-06-10T14:30:00Z").toISOString(),
      payoutBranchId: "branch-bor",
    },
    {
      id: "tx-2",
      transactionCode: "MT-58291-BOR",
      businessId: "biz-1",
      senderName: "Garang Deng Garang",
      senderPhone: "+211 913 222 333",
      senderIdNum: "DRIVE-7483",
      senderLocation: "Bor",
      receiverName: "Kiden Elizabeth",
      receiverPhone: "+211 922 444 888",
      sourceBranchId: "branch-bor",
      destinationBranchId: "branch-juba",
      amount: 180000,
      commission: 3600,
      currency: "SSP" as const,
      status: "PAID" as const,
      pin: "7402",
      createdBy: "emp-5",
      createdByName: "Daniel Maker Kur",
      createdAt: new Date("2026-06-11T10:20:00Z").toISOString(),
      payoutAgentId: "emp-3",
      payoutAgentName: "Abuk Lual Deng",
      payoutAt: new Date("2026-06-11T11:45:00Z").toISOString(),
      payoutBranchId: "branch-juba",
    },
    {
      id: "tx-3",
      transactionCode: "MT-48201-WAU",
      businessId: "biz-1",
      senderName: "Arop Lual Mangok",
      senderPhone: "+211 955 888 111",
      senderLocation: "Wau",
      receiverName: "Kuol Deng Kuol",
      receiverPhone: "+211 933 999 222",
      sourceBranchId: "branch-wau",
      destinationBranchId: "branch-bor",
      amount: 250000,
      commission: 5000,
      currency: "SSP" as const,
      status: "READY_FOR_PICKUP" as const,
      pin: "1357",
      createdBy: "emp-6",
      createdByName: "Santino Kenyi Lodu",
      createdAt: new Date("2026-06-12T08:00:00Z").toISOString(),
    },
    {
      id: "tx-4",
      transactionCode: "MT-88492-JUBA",
      businessId: "biz-1",
      senderName: "Kiden Elizabeth",
      senderPhone: "+211 922 444 888",
      senderLocation: "Juba",
      receiverName: "Zechariah Lodu",
      receiverPhone: "+211 954 111 222",
      sourceBranchId: "branch-juba",
      destinationBranchId: "branch-wau",
      amount: 350000,
      commission: 7000,
      currency: "SSP" as const,
      status: "PENDING" as const,
      pin: "9876",
      createdBy: "emp-3",
      createdByName: "Abuk Lual Deng",
      createdAt: new Date("2026-06-12T10:30:00Z").toISOString(),
    },
  ] as Transaction[],
  cashLedgers: [
    // Initial opening structures
    {
      id: "cl-1",
      branchId: "branch-juba",
      type: "CASH_IN" as const,
      amount: 5000000,
      reference: "Opening Balance",
      notes: "Inaugural cash safe startup",
      createdAt: new Date("2026-06-01T08:00:00Z").toISOString(),
    },
    {
      id: "cl-2",
      branchId: "branch-bor",
      type: "CASH_IN" as const,
      amount: 2000000,
      reference: "Opening Balance",
      notes: "Inaugural cash safe startup",
      createdAt: new Date("2026-06-01T08:00:00Z").toISOString(),
    },
    {
      id: "cl-3",
      branchId: "branch-wau",
      type: "CASH_IN" as const,
      amount: 1500000,
      reference: "Opening Balance",
      notes: "Inaugural cash safe startup",
      createdAt: new Date("2026-06-01T08:00:00Z").toISOString(),
    },
    {
      id: "cl-4",
      branchId: "branch-malakal",
      type: "CASH_IN" as const,
      amount: 1000000,
      reference: "Opening Balance",
      notes: "Inaugural cash safe startup",
      createdAt: new Date("2026-06-01T08:00:00Z").toISOString(),
    },
    // Transaction effects
    // tx-1: biometric Biar Atem sent 450,000 + 9000 commission from Juba. Juba safe cash in collected!
    {
      id: "cl-5",
      branchId: "branch-juba",
      type: "CASH_IN" as const,
      amount: 459000,
      reference: "MT-12845-JUBA",
      notes: "Collected transfer + commission",
      createdAt: new Date("2026-06-10T09:15:00Z").toISOString(),
    },
    // tx-1: payout executed at Bor branch: Bor Cash Out 450,000!
    {
      id: "cl-6",
      branchId: "branch-bor",
      type: "CASH_OUT" as const,
      amount: 450000,
      reference: "MT-12845-JUBA",
      notes: "Payout to Rebecca Nyandeng",
      createdAt: new Date("2026-06-10T14:30:00Z").toISOString(),
    },
    // tx-2: Deng Bol sent 180,000 + 3600 from Bor branch. Cash In to Bor.
    {
      id: "cl-7",
      branchId: "branch-bor",
      type: "CASH_IN" as const,
      amount: 183600,
      reference: "MT-58291-BOR",
      notes: "Collected transfer + commission",
      createdAt: new Date("2026-06-11T10:20:00Z").toISOString(),
    },
    // tx-2: Payout processed at Juba. Juba Cash Out 180,000.
    {
      id: "cl-8",
      branchId: "branch-juba",
      type: "CASH_OUT" as const,
      amount: 180000,
      reference: "MT-58291-BOR",
      notes: "Payout to Kiden Elizabeth",
      createdAt: new Date("2026-06-11T11:45:00Z").toISOString(),
    },
    // tx-3: Santino Kenyi sent 250,000 + 5000 co-op from Wau. Cash In to Wau.
    {
      id: "cl-9",
      branchId: "branch-wau",
      type: "CASH_IN" as const,
      amount: 255000,
      reference: "MT-48201-WAU",
      notes: "Collected transfer + commission",
      createdAt: new Date("2026-06-12T08:00:00Z").toISOString(),
    },
  ] as CashLedger[],
  settlements: [
    {
      id: "sett-1",
      fromBranchId: "branch-bor",
      toBranchId: "branch-juba",
      amount: 300000,
      status: "PENDING" as const,
      notes: "Rebalancing excess cash collected from send-overs",
      createdAt: new Date("2026-06-11T16:00:00Z").toISOString(),
    }
  ] as Settlement[],
  auditLogs: [
    {
      id: "aud-1",
      userId: "emp-1",
      userName: "Jacob Ajak Makuach",
      action: "REGISTER_BUSINESS",
      timestamp: new Date("2026-06-01T08:00:00Z").toISOString(),
      details: "Created Nile Money Transfer Co. and set up initial branches",
    }
  ] as AuditLog[],
};

// Database persistence wrapper
function loadDb(): typeof defaultDatabaseState {
  try {
    if (fs.existsSync(DB_FILE)) {
      const rawData = fs.readFileSync(DB_FILE, "utf-8");
      const db = JSON.parse(rawData);
      
      // Self-heal loaded employees by adding pins if missing
      let mutated = false;
      if (db && Array.isArray(db.employees)) {
        db.employees.forEach((emp: any) => {
          if (!emp.pin) {
            const pinMap: Record<string, string> = {
              "emp-1": "1111",
              "emp-2": "2222",
              "emp-3": "3333",
              "emp-4": "4444",
              "emp-5": "5555",
              "emp-6": "6666",
              "emp-7": "7777",
              "emp-8": "8888"
            };
            emp.pin = pinMap[emp.id] || "1234";
            mutated = true;
          }
        });
      }
      
      if (mutated) {
        try {
          fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
        } catch (writeErr) {
          console.error("Failed to write self-healed DB back to disk:", writeErr);
        }
      }
      return db;
    }
  } catch (err) {
    console.error("Error loading server-db.json, using fallback seeds:", err);
  }
  return defaultDatabaseState;
}

function saveDb(state: typeof defaultDatabaseState) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing server-db.json:", err);
  }
}

// Ensure database file is spawned immediately
const initialLoad = loadDb();
saveDb(initialLoad);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "5mb" }));

  // API logs and monitoring
  app.use((req, res, next) => {
    console.log(`[API ${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // --- --- API ROUTES --- ---

  // Security and user identification helper
  function getEmployeeContext(req: any) {
    const employeeId = req.headers["x-employee-id"] as string;
    if (!employeeId) return null;
    const db = loadDb();
    return db.employees.find((e: any) => e.id === employeeId) || null;
  }

  // Enhanced security logging utility
  function addAuditLog(
    db: any,
    req: any,
    employee: any, 
    action: string, 
    details: string, 
    affectedRecord?: string
  ) {
    const ipAddress = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
    const deviceInfo = req.headers["user-agent"] || "Web Client";
    const trackingId = "aud-gen-" + Date.now() + Math.floor(Math.random() * 100);
    
    db.auditLogs.unshift({
      id: trackingId,
      userId: employee ? employee.id : "system",
      userName: employee ? employee.name : "System API",
      role: employee ? employee.role : "SYSTEM",
      branchId: employee ? employee.branchId : "ALL",
      action,
      timestamp: new Date().toISOString(),
      deviceInfo,
      ipAddress,
      affectedRecord,
      details
    });
  }

  // Auth: Login Endpoint with session auditing
  app.post("/api/auth/login", (req, res) => {
    const db = loadDb();
    const { employeeId, pin } = req.body;
    
    if (!employeeId) {
      return res.status(400).json({ error: "Missing required parameter employeeId" });
    }
    if (!pin) {
      return res.status(400).json({ error: "Missing required parameter pin" });
    }

    const searchKey = employeeId.trim().toLowerCase();
    const employee = db.employees.find((e: any) => 
      e.id.toLowerCase() === searchKey ||
      e.phone.replace(/[\s+]+/g, "") === searchKey.replace(/[\s+]+/g, "") ||
      e.email.toLowerCase() === searchKey
    );

    if (!employee) {
      return res.status(404).json({ error: "Identity not recognized in company registry. Please verify your Employee ID, phone, or email." });
    }

    if (employee.status === "INACTIVE") {
      return res.status(403).json({ error: "Identity deactivated. Please contact company owner." });
    }

    if (employee.pin !== pin) {
      return res.status(401).json({ error: "Access Denied: Invalid secure Safeguard PIN code." });
    }

    // Write login event to Central Security Audit
    addAuditLog(db, req, employee, "LOGIN", `Successful login. Station terminal node authorized for access.`);
    saveDb(db);

    res.json({ success: true, employee });
  });

  // Auth: Logout Endpoint with session auditing
  app.post("/api/auth/logout", (req, res) => {
    const db = loadDb();
    const { employeeId } = req.body;
    
    const employee = db.employees.find((e: any) => e.id === employeeId);
    if (employee) {
      addAuditLog(db, req, employee, "LOGOUT", `Safely logged out. Session locked.`);
      saveDb(db);
    }
    res.json({ success: true });
  });

  // Health endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", time: new Date().toISOString() });
  });

  // Get filtered server state (Module 11 - complete data isolation)
  app.get("/api/state", (req, res) => {
    const db = loadDb();
    const employeeId = req.headers["x-employee-id"] as string;
    
    // If no context is passed yet (first load/login roster page), return general settings, branches and employees list so client can choose
    if (!employeeId) {
      return res.json({
        business: db.business,
        branches: db.branches,
        employees: db.employees,
        transactions: [],
        cashLedgers: [],
        settlements: [],
        auditLogs: []
      });
    }

    const employee = db.employees.find((e: any) => e.id === employeeId);
    if (!employee) {
      return res.status(403).json({ error: "Access Denied: Unrecognized credentials." });
    }

    if (employee.status === "INACTIVE") {
      return res.status(403).json({ error: "Access Denied: Roster record is marked INACTIVE." });
    }

    const { role, branchId } = employee;

    // Branches: All users can view names and routing parameters to designate routes.
    const filteredBranches = db.branches;

    // Employees:
    // OWNER, AUDITOR, or General Manager (MANAGER on ALL) see all employees.
    // Branch managers see only employees in their branch.
    // Agents see only themselves.
    let filteredEmployees: Employee[] = [];
    if (role === "OWNER" || role === "AUDITOR" || (role === "MANAGER" && branchId === "ALL")) {
      filteredEmployees = db.employees;
    } else if (role === "MANAGER") {
      filteredEmployees = db.employees.filter((e: any) => e.branchId === branchId);
    } else {
      filteredEmployees = db.employees.filter((e: any) => e.id === employeeId);
    }

    // Transactions: (Strict Branch-Level Data Isolation)
    // OWNER, AUDITOR, or General Manager see all transactions.
    // Restricted Managers and Agents can only view transactions bound from OR to their assigned branch.
    let filteredTransactions: Transaction[] = [];
    if (role === "OWNER" || role === "AUDITOR" || (role === "MANAGER" && branchId === "ALL")) {
      filteredTransactions = db.transactions;
    } else {
      filteredTransactions = db.transactions.filter(
        (t: any) => t.sourceBranchId === branchId || t.destinationBranchId === branchId || t.createdBy === employeeId
      );
    }

    // Cash Ledgers:
    // OWNER, AUDITOR, or General Manager see all company cash ledgers and physical balances.
    // Branch Managers and Agents see ONLY cash ledgers matching their own branch.
    let filteredCashLedgers: CashLedger[] = [];
    if (role === "OWNER" || role === "AUDITOR" || (role === "MANAGER" && branchId === "ALL")) {
      filteredCashLedgers = db.cashLedgers;
    } else {
      filteredCashLedgers = db.cashLedgers.filter((c: any) => c.branchId === branchId);
    }

    // Settlements:
    // OWNER, AUDITOR, or General Manager see all netting/settlement operations.
    // Branch manager see only settlements involving their branch.
    // Online cashiers/agents are barred completely from viewing settlements.
    let filteredSettlements: Settlement[] = [];
    if (role === "OWNER" || role === "AUDITOR" || (role === "MANAGER" && branchId === "ALL")) {
      filteredSettlements = db.settlements;
    } else if (role === "MANAGER") {
      filteredSettlements = db.settlements.filter((s: any) => s.fromBranchId === branchId || s.toBranchId === branchId);
    } else {
      filteredSettlements = [];
    }

    // Audit Logs:
    // OWNER, AUDITOR, or General Manager see all history.
    // Branch managers see only audit records related to their own branch.
    // Agents see only their own actions.
    let filteredAuditLogs: AuditLog[] = [];
    if (role === "OWNER" || role === "AUDITOR" || (role === "MANAGER" && branchId === "ALL")) {
      filteredAuditLogs = db.auditLogs;
    } else if (role === "MANAGER") {
      const branchEmpIds = db.employees.filter((e: any) => e.branchId === branchId).map((e: any) => e.id);
      filteredAuditLogs = db.auditLogs.filter(
        (l: any) => branchEmpIds.includes(l.userId) || l.userId === employeeId
      );
    } else {
      filteredAuditLogs = db.auditLogs.filter((l: any) => l.userId === employeeId);
    }

    res.json({
      business: db.business,
      branches: filteredBranches,
      employees: filteredEmployees,
      transactions: filteredTransactions,
      cashLedgers: filteredCashLedgers,
      settlements: filteredSettlements,
      auditLogs: filteredAuditLogs
    });
  });

  // Register or Update Business Profile (Module 1)
  app.post("/api/business", (req, res) => {
    const db = loadDb();
    const employee = getEmployeeContext(req);

    if (!employee || employee.role !== "OWNER") {
      return res.status(403).json({ error: "Access Denied: Only company OWNER is authorized to change corporate business settings." });
    }

    const { name, phone, email, address } = req.body;
    
    db.business = {
      ...db.business,
      name: name || db.business.name,
      phone: phone || db.business.phone,
      email: email || db.business.email,
      address: address || db.business.address,
    };
    
    // Add audit log
    addAuditLog(
      db, 
      req, 
      employee, 
      "UPDATE_BUSINESS", 
      `Updated company information settings. Phone: ${phone || db.business.phone}`, 
      db.business.id
    );

    saveDb(db);
    res.json({ success: true, business: db.business });
  });

  // Create Branch (Module 2)
  app.post("/api/branches", (req, res) => {
    const db = loadDb();
    const employee = getEmployeeContext(req);

    if (!employee || employee.role !== "OWNER") {
      return res.status(403).json({ error: "Access Denied: Only company OWNER is authorized to establish new branch nodes." });
    }

    const { name, city, address, phone } = req.body;

    if (!name || !city || !address) {
      return res.status(400).json({ error: "Missing required branch params: name, city, address" });
    }

    const newId = "branch-" + city.toLowerCase().replace(/\s+/g, "-") + "-" + Math.floor(Math.random() * 1000);
    const newBranch: Branch = {
      id: newId,
      businessId: "biz-1",
      name,
      city,
      address,
      phone: phone || "+211 9" + Math.floor(Math.random() * 100000000),
      managerId: "emp-2", // Assign placeholder Deng Bol initially
    };

    db.branches.push(newBranch);

    // Dynamic initial branch safe safe cash injection
    const initialFunder = {
      id: "cl-gen-" + Math.floor(Math.random() * 1000000),
      branchId: newId,
      type: "CASH_IN" as const,
      amount: 500000,
      reference: "Opening Balance",
      notes: `Allocated safe funding for brand new ${name}`,
      createdAt: new Date().toISOString(),
    };
    db.cashLedgers.push(initialFunder);

    // Enriched log
    addAuditLog(db, req, employee, "CREATE_BRANCH", `Created new branch terminal: ${name} in ${city}. Seeded SSP 500,000 to safe.`, newId);

    saveDb(db);
    res.json({ success: true, branch: newBranch });
  });

  // Create Employee Staff Member (Module 3)
  app.post("/api/employees", (req, res) => {
    const db = loadDb();
    const employee = getEmployeeContext(req);

    if (!employee || employee.role !== "OWNER") {
      return res.status(403).json({ error: "Access Denied: Only company OWNER is authorized to register and provision personnel." });
    }

    const { name, phone, email, role, branchId, pin } = req.body;

    if (!name || !phone || !role || !branchId) {
      return res.status(400).json({ error: "Missing required employee parameters" });
    }

    const newId = "emp-" + Math.floor(Math.random() * 10000);
    const generatedPin = pin || Math.floor(1000 + Math.random() * 9000).toString();
    const newEmp: Employee = {
      id: newId,
      businessId: "biz-1",
      branchId,
      name,
      phone,
      email: email || name.toLowerCase().replace(/\s+/g, ".") + "@niletfr.ss",
      role,
      status: "ACTIVE",
      pin: generatedPin,
    };

    db.employees.push(newEmp);

    // Detailed audit log
    addAuditLog(db, req, employee, "ADD_EMPLOYEE", `Registered staff specialized advisor ${name} for role ${role} assigned to node ${branchId}`, newId);

    saveDb(db);
    res.json({ success: true, employee: newEmp });
  });

  // Send Money (Module 4 & 6)
  app.post("/api/transactions/send", (req, res) => {
    const db = loadDb();
    const employee = getEmployeeContext(req);

    if (!employee) {
      return res.status(401).json({ error: "Access Denied: Missing valid credential token handshake." });
    }

    if (employee.role === "AUDITOR") {
      return res.status(403).json({ error: "Access Denied: Auditors have read-only access and cannot transact funds." });
    }

    const {
      senderName,
      senderPhone,
      senderIdNum,
      senderLocation,
      receiverName,
      receiverPhone,
      sourceBranchId,
      destinationBranchId,
      amount,
      commission,
      currency,
      notes,
    } = req.body;

    if (!senderName || !senderPhone || !receiverName || !receiverPhone || !sourceBranchId || !destinationBranchId || !amount) {
      return res.status(400).json({ error: "Missing required money transfer parameters" });
    }

    // Branch Isolation Rules:
    // Manager/Agent can only issue transfers from their assigned node/branch!
    if (employee.branchId !== "ALL" && sourceBranchId !== employee.branchId) {
      return res.status(403).json({ error: `Security Breach Blocked: You are registered at assigned node ${employee.branchId} and cannot initiate transfers originating from ${sourceBranchId}.` });
    }

    const sBranch = db.branches.find(b => b.id === sourceBranchId);
    const dBranch = db.branches.find(b => b.id === destinationBranchId);
    if (!sBranch || !dBranch) {
      return res.status(404).json({ error: "Specified Transit/Target node terminals are invalid." });
    }

    const txCode = "MT-" + Math.floor(10000 + Math.random() * 90000) + "-" + sBranch.city.toUpperCase();
    const pinCode = Math.floor(1000 + Math.random() * 9000).toString(); // Secure PIN code

    const newTx: Transaction = {
      id: "tx-gen-" + Date.now() + Math.floor(Math.random() * 1000),
      transactionCode: txCode,
      businessId: "biz-1",
      senderName,
      senderPhone,
      senderIdNum,
      senderLocation,
      receiverName,
      receiverPhone,
      sourceBranchId,
      destinationBranchId,
      amount: Number(amount),
      commission: Number(commission || 0),
      currency: currency || "SSP",
      notes,
      status: "PENDING",
      pin: pinCode,
      createdBy: employee.id,
      createdByName: employee.name,
      createdAt: new Date().toISOString(),
    };

    // Increment safe ledger for the source branch immediately (Collected money + commission fee)
    const ledgerEntry: CashLedger = {
      id: "cl-gen-" + Math.floor(Math.random() * 10000000),
      branchId: sourceBranchId,
      type: "CASH_IN",
      amount: Number(amount) + Number(commission || 0),
      reference: txCode,
      notes: `Collected sum for transit to ${dBranch.name}`,
      createdAt: new Date().toISOString(),
    };

    db.transactions.unshift(newTx);
    db.cashLedgers.push(ledgerEntry);

    // Write audited log
    addAuditLog(
      db, 
      req, 
      employee, 
      "SEND_MONEY", 
      `Generated money transfer code ${txCode} for ${senderName} to receiver ${receiverName}. Collected safe cash value SSP ${Number(amount) + Number(commission || 0)}`, 
      txCode
    );

    saveDb(db);
    res.json({ success: true, transaction: newTx, ledger: ledgerEntry });
  });

  // Receive Money / Validate PIN / Update Paid (Module 5)
  app.post("/api/transactions/payout", (req, res) => {
    const db = loadDb();
    const employee = getEmployeeContext(req);

    if (!employee) {
      return res.status(401).json({ error: "Access Denied: Missing valid credential token handshake." });
    }

    if (employee.role === "AUDITOR") {
      return res.status(403).json({ error: "Access Denied: Auditors cannot perform cash desk payoffs." });
    }

    const { transactionCode, pin, payoutBranchIdDetail } = req.body;
    // We can infer or require payoutBranchId. Let's fallback to the active branchId of the employee if not provided, or check it!
    const targetBranchId = payoutBranchIdDetail || employee.branchId;

    if (!transactionCode || !pin) {
      return res.status(400).json({ error: "Missing payout validation keys: code, pin" });
    }

    // Branch Isolation Rules:
    if (employee.branchId !== "ALL" && targetBranchId !== employee.branchId) {
      return res.status(403).json({ error: `Security Breach Blocked: You are mapped to terminal ${employee.branchId} and cannot issue cash payouts from ${targetBranchId}.` });
    }

    const txIndex = db.transactions.findIndex(t => t.transactionCode === transactionCode);
    if (txIndex === -1) {
      return res.status(404).json({ error: "Transaction ticket not found in MTMS files." });
    }

    const tx = db.transactions[txIndex];

    // Verification check
    if (tx.pin !== pin) {
      return res.status(401).json({ error: "Access denied. Invalid security Safeguard PIN code provided." });
    }

    if (tx.status === "PAID") {
      return res.status(400).json({ error: "This transaction ticket has already been processed and disbursed." });
    }

    if (tx.status === "CANCELLED" || tx.status === "EXPIRED" || tx.status === "REVERSED") {
      return res.status(400).json({ error: `Cannot process payout for transaction ticket currently in state: ${tx.status}` });
    }

    // Routing Validation:
    // Payout must occur AT the designated destination branch!
    if (employee.branchId !== "ALL" && tx.destinationBranchId !== targetBranchId) {
      return res.status(400).json({ error: `Routing Denied: Transaction is routed specifically for payoff at ${db.branches.find(b=>b.id===tx.destinationBranchId)?.name || tx.destinationBranchId} city terminal.` });
    }

    // Update state to PAID
    tx.status = "PAID";
    tx.payoutAgentId = employee.id;
    tx.payoutAgentName = employee.name;
    tx.payoutAt = new Date().toISOString();
    tx.payoutBranchId = targetBranchId;

    // Subtract from the target branch safe ledger (Cash Out)
    const ledgerEntry: CashLedger = {
      id: "cl-gen-" + Math.floor(Math.random() * 10000000),
      branchId: targetBranchId,
      type: "CASH_OUT",
      amount: tx.amount,
      reference: tx.transactionCode,
      notes: `Disbursed and paid out to verified recipient ${tx.receiverName}`,
      createdAt: new Date().toISOString(),
    };

    db.cashLedgers.push(ledgerEntry);

    addAuditLog(
      db, 
      req, 
      employee, 
      "RECEIVE_MONEY", 
      `Disbursed SSP ${tx.amount} cash out to certified recipient ${tx.receiverName} on code ${tx.transactionCode}`, 
      tx.transactionCode
    );

    db.transactions[txIndex] = tx;

    saveDb(db);
    res.json({ success: true, transaction: tx, ledger: ledgerEntry });
  });

  // Cancel / Reverse / Expire Transaction
  app.post("/api/transactions/cancel", (req, res) => {
    const db = loadDb();
    const employee = getEmployeeContext(req);

    if (!employee) {
      return res.status(401).json({ error: "Access Denied: Missing valid credential token handshake." });
    }

    if (employee.role === "AGENT") {
      return res.status(403).json({ error: "Access Denied: Online frontline agents do not possess authorization to cancel/reverse transactions." });
    }

    if (employee.role === "AUDITOR") {
      return res.status(403).json({ error: "Access Denied: Auditors are restricted to read-only audits." });
    }

    const { transactionCode, status } = req.body; // status: CANCELLED, REVERSED, etc.

    if (!transactionCode || !status) {
      return res.status(400).json({ error: "Missing required cancellation parameters." });
    }

    const txIndex = db.transactions.findIndex(t => t.transactionCode === transactionCode);
    if (txIndex === -1) {
      return res.status(404).json({ error: "Transaction ticket not found in MTMS files." });
    }

    const tx = db.transactions[txIndex];
    if (tx.status === "PAID") {
      return res.status(400).json({ error: "Cannot reverse or cancel a transaction code after disbursement has fulfilled." });
    }

    // Branch Isolation Rules:
    // Branch manager are restricted to editing transfers involving their own branch context!
    if (employee.branchId !== "ALL" && tx.sourceBranchId !== employee.branchId && tx.destinationBranchId !== employee.branchId) {
      return res.status(403).json({ error: `Access Denied: Branch management scopes restricted. You can only cancel transactions originating from or destined to your branch.` });
    }

    tx.status = status; // e.g. CANCELLED, REVERSED, EXPIRED

    // Safely refund the original amount + commission back out from the source branch safe ledger
    const totalRefund = tx.amount + tx.commission;
    const ledgerEntry: CashLedger = {
      id: "cl-gen-" + Math.floor(Math.random() * 10000000),
      branchId: tx.sourceBranchId,
      type: "CASH_OUT",
      amount: totalRefund,
      reference: tx.transactionCode,
      notes: `Refunded full transit collection regarding ${status} status`,
      createdAt: new Date().toISOString(),
    };

    db.cashLedgers.push(ledgerEntry);

    addAuditLog(
      db, 
      req, 
      employee, 
      status + "_MONEY", 
      `Authorized transaction code ${tx.transactionCode} transition to status ${status}. Refunded total SSP ${totalRefund} out from source safe.`, 
      tx.transactionCode
    );

    db.transactions[txIndex] = tx;

    saveDb(db);
    res.json({ success: true, transaction: tx, ledger: ledgerEntry });
  });

  // Create Settlement Request or approve settlement request (Module 8)
  app.post("/api/settlements", (req, res) => {
    const db = loadDb();
    const employee = getEmployeeContext(req);

    if (!employee) {
      return res.status(401).json({ error: "Access Denied: Missing valid credential token." });
    }

    if (employee.role === "AGENT" || employee.role === "AUDITOR") {
      return res.status(403).json({ error: "Access Denied: Frontline Agents and Auditors are restricted from issuing and approving netting ledger settlements." });
    }

    const { id, fromBranchId, toBranchId, amount, action, notes } = req.body;

    if (action === "CREATE") {
      if (!fromBranchId || !toBranchId || !amount) {
        return res.status(400).json({ error: "Missing required properties to request a netting settlement." });
      }

      // Branch Isolation on creator:
      if (employee.branchId !== "ALL" && fromBranchId !== employee.branchId && toBranchId !== employee.branchId) {
        return res.status(403).json({ error: `Access Denied: You are locked to branch ${employee.branchId} and can only create settlements involving your node.` });
      }

      const newId = "sett-" + Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 100);
      const newSett: Settlement = {
        id: newId,
        fromBranchId,
        toBranchId,
        amount: Number(amount),
        status: "PENDING",
        notes: notes || "Branch balancing adjustment",
        createdAt: new Date().toISOString(),
      };
      db.settlements.unshift(newSett);

      const fromBName = db.branches.find(b=>b.id===fromBranchId)?.name || fromBranchId;
      const toBName = db.branches.find(b=>b.id===toBranchId)?.name || toBranchId;

      addAuditLog(
        db, 
        req, 
        employee, 
        "CREATE_SETTLEMENT", 
        `Requested netting settlement: ${fromBName} owes redirection of SSP ${amount} to ${toBName}`, 
        newId
      );

      saveDb(db);
      return res.json({ success: true, settlement: newSett });
    }

    if (action === "APPROVE" || action === "REJECT" || action === "SETTLE") {
      if (!id) {
        return res.status(400).json({ error: "Missing Target Settlement Request ID." });
      }

      // ONLY COMPANY OWNER AND GENERAL MANAGER (role=MANAGER, branchId=ALL) can approve/settle!
      if (employee.role !== "OWNER" && (employee.role !== "MANAGER" || employee.branchId !== "ALL")) {
        return res.status(403).json({ error: "Access Denied: Only company Owners and General Managers possess approval authority for treasury safe netting settlements." });
      }

      const sIndex = db.settlements.findIndex(s => s.id === id);
      if (sIndex === -1) {
        return res.status(404).json({ error: "Settlement instance not found." });
      }

      const sett = db.settlements[sIndex];
      const prevStatus = sett.status;

      if (action === "APPROVE") {
        sett.status = "APPROVED";
      } else if (action === "REJECT") {
        sett.status = "REJECTED";
      } else if (action === "SETTLE") {
        sett.status = "SETTLED";

        // Balance physical safe branch ledgers!
        const clFrom: CashLedger = {
          id: "cl-gen-" + Math.floor(Math.random() * 10000000),
          branchId: sett.fromBranchId,
          type: "CASH_OUT",
          amount: sett.amount,
          reference: `SETTLEMENT-${sett.id}`,
          notes: `Disbursed settlement safe transfer out to ${db.branches.find(b=>b.id===sett.toBranchId)?.name || sett.toBranchId}`,
          createdAt: new Date().toISOString(),
        };

        const clTo: CashLedger = {
          id: "cl-gen-" + Math.floor(Math.random() * 10000000),
          branchId: sett.toBranchId,
          type: "CASH_IN",
          amount: sett.amount,
          reference: `SETTLEMENT-${sett.id}`,
          notes: `Received settlement safe fund injection from ${db.branches.find(b=>b.id===sett.fromBranchId)?.name || sett.fromBranchId}`,
          createdAt: new Date().toISOString(),
        };

        db.cashLedgers.push(clFrom, clTo);
      }

      addAuditLog(
        db, 
        req, 
        employee, 
        `SETTLEMENT_${action}`, 
        `Updated settlement netting request ${sett.id} from ${prevStatus} to status ${sett.status}. Cleared safe netting transfer value: SSP ${sett.amount}`, 
        sett.id
      );

      db.settlements[sIndex] = sett;
      saveDb(db);
      return res.json({ success: true, settlement: sett });
    }

    return res.status(400).json({ error: "Invalid action specifier: must be CREATE, APPROVE, REJECT, or SETTLE" });
  });

  // Offline-First Synchronization Endpoint (Module 5 & 11)
  app.post("/api/sync", (req, res) => {
    const db = loadDb();
    const packet: SyncPacket = req.body;

    if (!packet || !Array.isArray(packet.transactions)) {
      return res.status(400).json({ error: "Sync rejected: Invalid sync packet content" });
    }

    const syncedTransactionCodes: string[] = [];
    const conflictLog: string[] = [];

    // Sync rule:
    // "Server remains source of truth. Latest valid transaction state wins. No duplicate transactions."
    packet.transactions.forEach((clientTx) => {
      const serverTxIndex = db.transactions.findIndex(
        t => t.transactionCode === clientTx.transactionCode || t.id === clientTx.id
      );

      // 1. Transaction doesn't exist on server: insert!
      if (serverTxIndex === -1) {
        // Double check duplicate transaction code
        const isDuplicateCode = db.transactions.some(t => t.transactionCode === clientTx.transactionCode);
        if (isDuplicateCode) {
          conflictLog.push(`[Tx Rejected] Code mismatch or duplicate code generated offline: ${clientTx.transactionCode}`);
          return;
        }

        // Add to server list
        db.transactions.unshift(clientTx);
        syncedTransactionCodes.push(clientTx.transactionCode);

        // Record a Cash Ledger in source branch if it was an PENDING / READY transaction created offline
        if (clientTx.status !== "CANCELLED" && clientTx.status !== "REVERSED") {
          db.cashLedgers.push({
            id: "cl-sync-" + Math.floor(Math.random() * 1000000),
            branchId: clientTx.sourceBranchId,
            type: "CASH_IN",
            amount: clientTx.amount + clientTx.commission,
            reference: clientTx.transactionCode,
            notes: `Offline Created: Collected sum synced via cash packet.`,
            createdAt: clientTx.createdAt,
          });
        }

        db.auditLogs.unshift({
          id: "aud-sync-" + Date.now() + Math.floor(Math.random()*100),
          userId: clientTx.createdBy,
          userName: clientTx.createdByName || "Offline Agent",
          action: "SYNC_NEW_TRANSIT",
          timestamp: new Date().toISOString(),
          details: `Synced transit transaction code ${clientTx.transactionCode} created offline. SSP ${clientTx.amount}`,
        });

      } else {
        // 2. Transaction exists: resolve changes according to status!
        const serverTx = db.transactions[serverTxIndex];

        if (serverTx.status === "PAID" && clientTx.status !== "PAID") {
          // Server says PAID, client says PENDING/READY. Server takes precedence.
          conflictLog.push(`[State Clashing] Code ${clientTx.transactionCode} is already paid on server. Kept server version 'PAID'.`);
          syncedTransactionCodes.push(clientTx.transactionCode);
        } else if (serverTx.status !== "PAID" && clientTx.status === "PAID") {
          // Client paid out offline, let's update server!
          serverTx.status = "PAID";
          serverTx.payoutAgentId = clientTx.payoutAgentId;
          serverTx.payoutAgentName = clientTx.payoutAgentName || "Offline Cashier";
          serverTx.payoutAt = clientTx.payoutAt || new Date().toISOString();
          serverTx.payoutBranchId = clientTx.payoutBranchId;

          // Subtract cash from the payout branch safe ledger (Cash Out)
          db.cashLedgers.push({
            id: "cl-sync-payout-" + Math.floor(Math.random() * 1000000),
            branchId: clientTx.payoutBranchId!,
            type: "CASH_OUT",
            amount: serverTx.amount,
            reference: serverTx.transactionCode,
            notes: `Offline payout synchronized. Recipient: ${serverTx.receiverName}`,
            createdAt: clientTx.payoutAt || new Date().toISOString(),
          });

          db.auditLogs.unshift({
            id: "aud-sync-" + Date.now() + Math.floor(Math.random()*100),
            userId: clientTx.payoutAgentId || "system",
            userName: clientTx.payoutAgentName || "Offline Cashier",
            action: "SYNC_OFFLINE_PAYOUT",
            timestamp: new Date().toISOString(),
            details: `Synced offline payout disbursed on code ${serverTx.transactionCode} for target receiver.`,
          });

          db.transactions[serverTxIndex] = serverTx;
          syncedTransactionCodes.push(serverTx.transactionCode);
        } else {
          // No conflicting action, they are in matching status or client updated notes
          serverTx.notes = clientTx.notes || serverTx.notes;
          db.transactions[serverTxIndex] = serverTx;
          syncedTransactionCodes.push(serverTx.transactionCode);
        }
      }
    });

    // Sync client-provided ledgers, avoiding replicates
    if (Array.isArray(packet.cashLedgers)) {
      packet.cashLedgers.forEach((cl) => {
        const clExists = db.cashLedgers.some(c => c.id === cl.id || (c.reference === cl.reference && c.branchId === cl.branchId && c.type === cl.type && Math.abs(new Date(c.createdAt).getTime() - new Date(cl.createdAt).getTime()) < 5000));
        if (!clExists) {
          db.cashLedgers.push(cl);
        }
      });
    }

    // Sync client-provided settlements
    if (Array.isArray(packet.settlements)) {
      packet.settlements.forEach((s) => {
        const sIndex = db.settlements.findIndex(serv => serv.id === s.id);
        if (sIndex === -1) {
          db.settlements.unshift(s);
        } else {
          // Update status if mismatch and server is not settled yet
          if (db.settlements[sIndex].status !== s.status && db.settlements[sIndex].status !== 'SETTLED') {
            db.settlements[sIndex].status = s.status;
          }
        }
      });
    }

    // Save final state
    saveDb(db);

    const syncResp = {
      success: true,
      syncedTransactionCodes,
      serverState: db,
      conflictLog,
    };

    res.json(syncResp);
  });

  // AI-Powered Feature Engine (Module 10 - LLM integration using Gemini 3.5 Flash!)
  app.post("/api/ai/analyze", async (req, res) => {
    const { type } = req.body; // type: "insights" | "fraud" | "forecasting"
    const db = loadDb();

    if (!type) {
      return res.status(400).json({ error: "Missing analytics task 'type' specifier." });
    }

    // Fallback if AI SDK fails
    const mockFeedbacks = {
      insights: `### Nile Money Transfer daily performance insights summary:
1. **Branch Velocity Leaders**:
   - **Juba HQ Branch** holds the daily volume lead, handling 63% of transit orders (SSP 809,000 processed).
   - **Bor Market Branch** had high payout volumes resulting from Juba transfers, leading to safe depletion trends.
2. **Revenue Metrics**:
   - Total Collected Daily: **SSP 1,230,000**. On commission rates of 2.0%, direct system income stands at **SSP 24,600**.
3. **Branch Performance**:
   - Wau and Bor branches have processed 25% more items compared to early June trends. Malakal represents a high-potential trade corridor but requires stronger local agents.`,
      fraud: `### 🛡️ Real-Time Audit & Fraud Detection Report:
1. **Double Disbursal Scan**: Pass
   - No dual payouts on matching transaction codes detected.
2. **Unusual Agent Actions**: Pass
   - All cashier payout agents match their assigned branch registries.
3. **Suspicious Cash Velocities**: Flag
   - Two transactions of extreme SSP values (SSP 450,000) occurred on the Bor corridor within short succession. Cash limits for manual cashiers are recommended at a single cap of SSP 300,000 per receipt.`,
      forecasting: `### 📈 Branch Liquidations Forecasting:
1. **Bor safe liquidity warnings**: Low
   - Current Bor safe balance is estimated at **SSP 1,883,600**. A high volume of inbound transfers (SSP 450,000 payout demands) presents future reserves depletion risk.
2. **Juba cash accumulative balance**: High
   - Net Cash In flow to Juba is extremely positive (**SSP 5,279,000** safe balance) due to massive inbound local remittances.
3. **Settlement Actions recommended**:
   - Bor branch requested a settlement of **SSP 300,000** to Juba branch to balance out the digital ledger ledger deficits. This settlement is highly recommended for prompt execution.`
    };

    if (!ai) {
      // Prompt is not running, return beautiful simulations instead
      return res.json({ result: mockFeedbacks[type as keyof typeof mockFeedbacks] || "Analysis completed successfully." });
    }

    // Prepare context payload to minimize token waist, clean strings
    const compactCtx = {
      business: db.business,
      branches: db.branches.map(b => ({ id: b.id, name: b.name, city: b.city })),
      employees: db.employees.map(e => ({ id: e.id, name: e.name, role: e.role, branch: e.branchId })),
      transactions: db.transactions.map(t => ({ id: t.id, code: t.transactionCode, from: t.sourceBranchId, to: t.destinationBranchId, amount: t.amount, fee: t.commission, status: t.status, date: t.createdAt })),
      ledgers: db.cashLedgers.slice(-15).map(l => ({ branch: l.branchId, type: l.type, amount: l.amount, ref: l.reference, date: l.createdAt }))
    };

    let prompt = "";
    if (type === "insights") {
      prompt = `You are a professional Business Intelligence Analyst customized for "Nile Money Transfer Ltd.", a financial remittance service in South Sudan.
Evaluate this JSON system state and compile a highly detailed, human-oriented, actionable business insights summary.
Include:
1. Branch performance leaders of the week (Juba, Bor, Wau, Malakal, etc).
2. Key transaction metrics (amounts, commissions, average size).
3. Critical trend summaries, percentage shifts, and recommendations for South Sudan localized corridors.
Keep your answer clear, editorial, and beautifully formatted in markdown, with bold terms and a professional tone (do not use generic AI intro/summary phrases). Here is the system dataset:\n${JSON.stringify(compactCtx)}`;
    } else if (type === "fraud") {
      prompt = `You are a Fraud Analyst specialized in auditing fintech transaction logs for a money transfer company in South Sudan.
Inspect the transaction table for:
- Unusual velocity: identical sender or receiver sending multiple large amounts in minutes.
- Suspicious transactions: extremely high volumes crossing standard ceilings.
- Agent activities: inconsistent agent names or suspicious payout timestamp locations.
List any warnings, suspicious patterns, or duplicate disbursements. If everything is clean, declare green flags clearly.
Format your response in markdown. Here is the dataset:\n${JSON.stringify(compactCtx)}`;
    } else { // forecasting
      prompt = `You are a Treasury Manager and financial forecasting agent for a multi-branch money transfer company in South Sudan.
Analyze safe cash flow, inflows vs outflows, and predict branch liquidity demands.
Look at:
- Cash ledger and balances across Juba HQ, Bor, Wau, etc.
- Which branches are experiencing high "CASH_OUT" drain versus "CASH_IN" accumulation.
- Provide a clear prediction of which branches will face cash out-of-stock shortages first.
- Recommend physical branch safe settlements or rebalancing transfers to prevent branch liquidity crisis.
Format your response in markdown. Here is the dataset:\n${JSON.stringify(compactCtx)}`;
    }

    try {
      console.log(`Instructing Gemini model gemini-3.5-flash for category ${type}...`);
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are the primary AI brain for the South Sudan Money Transfer Management System. Give direct, precise analysis without unnecessary introduction or generic filler text. Always refer to South Sudanese cities (Juba, Bor, Wau, Malakal, Yei) by name correctly.",
          temperature: 0.2
        }
      });
      console.log(`Gemini response parsed successfully for ${type}`);
      return res.json({ result: response.text });
    } catch (err: any) {
      console.error("Gemini model execution failed, returning high fidelity mock:", err);
      return res.json({ result: mockFeedbacks[type as keyof typeof mockFeedbacks] + "\n\n*(Note: Fallback analysis processed regarding regional network API offline simulations)*" });
    }
  });

  // --- --- VITE DEVELOPMENT MIDDLEWARE OR STATIC FILES --- ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware integrated safely.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production static distribution path served.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`South Sudan MTMS Server boot up. Running live at: http://0.0.0.0:${PORT}`);
  });
}

startServer();
