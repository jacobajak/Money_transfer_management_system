# Nile Money Transfer System (NMTS)

A high-performance, secure, and resilient regional money transfer remittance platform designed to manage branches, personnel, safe ledgers, currency transactions, inter-branch settlements, and data audits. Includes dynamic role-based data isolation, offline-first synchronization, and built-in Phase 2 AI-powered operational auditing.

---

## 🌟 Key Capabilities

1. **Strict Data Isolation & Security Hierarchy (Module 11)**
   - **Owner (Corporate Admin)**: Complete master access to system state, settings, branches, rosters, all regional transactions, netting, physical safes, and logs.
   - **Auditor**: Full read-only compliance access to all historical logs, charts, safes, and transactions. Prevented from transacting or altering funds.
   - **Branch Manager**: Access limited to transactions, personnel rosters, physical safes, and settlement netting requests specifically bound to their assigned terminal.
   - **Frontline Agent (Terminal Cashier)**: Access limited exclusively to their own transactions, local safe drawer, and payout validations. Locked out from administrative, settlement approval, and cancellation functions.

2. **Remittance Lifecycle Management**
   - **Send Money (Modules 4 & 6)**: Captures sender & receiver profiles, destination branches, commissions, currency selection (SSP/USD), generates cryptographically safe verification PIN codes, and registers transactions in a secure ledger.
   - **Validate & Payout (Module 5)**: Real-time recipient verification matching transaction ticket codes, safeguard PIN validation, destination branch routing confirmation, and physical cash disbursements.
   - **Cancel & Reverse (Module 6)**: Authorizes privileged managers/owners to reverse pending transfers, automatically calculating total refund values (principal + commission) and releasing safe liabilities safely.

3. **Treasury Management & Cash Vault Safes (Modules 9 & 10)**
   - Continuous real-time tracking of branch physical safe reserves using `CASH_IN` and `CASH_OUT` ledgers.
   - Live safe tally monitoring and automatic closing balance calculations.

4. **Inter-Branch Netting & Settlements (Module 8)**
   - Formulates automated netting requests between branches to offset safe cash disparities.
   - Multi-step cycle: `CREATED` $\rightarrow$ `APPROVED`/`REJECTED` $\rightarrow$ `SETTLED`.
   - On settlement completion, cash ledger entries are automatically injected into both corresponding safes (`CASH_OUT` from the payer, `CASH_IN` into the receiver) to guarantee physical vault alignment.

5. **Offline-First Synchronization (Modules 5 & 11)**
   - Allows agents to dispatch remittances and adjust ledgers even under degraded local network conditions.
   - Locally caches actions in an offline queue, automatically resolving conflicts and synchronizing with the central server upon network restoration.

6. **Phase 2 AI Core (Gemini SDK)**
   - Direct server-side integration with the modern `@google/genai` TypeScript SDK.
   - Offers real-time anomaly detection, smart liquidity projections, and instant operational BI reporting.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Motion (Animations)
- **Backend**: Express Server, TypeScript (`tsx` runner), lightweight database file system persistence (`server-db.json`)
- **Docker/Containerization**: Multi-stage alpine builds optimized for micro-footprints and non-root execution security.

---

## 📦 Containerization & Docker Setup

Nile Money Transfer includes a production-ready, highly secure multi-stage Docker configuration that minimizes image sizes and secures execution using a dedicated non-root user.

### Prerequisites
- Docker Engine installed.
- Optional: Docker Compose.

### Dockerfile Breakdown
- **Build Stage**: Uses Node 20 alpine to install packages, compile the Vite React client into a static distribution, and bundle the backend TypeScript server into a streamlined `dist/server.cjs` file using `esbuild`.
- **Runner Stage**: Employs an ultra-lean Alpine image, fetches production-only dependencies, inherits `dist/` artifacts, and configures the `node` non-root user as the active process owner.

### Build and Run with Docker

1. **Build the Image**:
   ```bash
   docker build -t nile-money-transfer .
   ```

2. **Run the Container**:
   ```bash
   docker run -d -p 3000:3000 --name nile-app nile-money-transfer
   ```

3. **Verify Execution**:
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚀 Local Development Setup

To run the application locally outside of Docker:

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### Installation Steps

1. **Clone/Open project workspace** and install all dependencies:
   ```bash
   npm install
   ```

2. **Setup environment variables**:
   Create a `.env` file in the root directory based on `.env.example`:
   ```env
   PORT=3000
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   *This starts the custom Express + Vite middleware server concurrently in TypeScript mode.*

4. **Build the Application**:
   ```bash
   npm run build
   ```
   *Compiles frontend assets to `dist/` and compiles the server code to CJS using `esbuild`.*

5. **Run in Production Mode**:
   ```bash
   npm start
   ```

---

## 📁 Core Directory Structure

```text
├── Dockerfile                  # Multi-stage production container build manifest
├── .dockerignore               # Optimizes Docker builds by ignoring non-essential files
├── server.ts                   # Full-stack Node/Express server entry point
├── server-db.json              # Persistent mock database store (holds corporate rosters, safes, and tickets)
├── package.json                # Project script workflows and dependencies manifest
├── vite.config.ts              # Vite configurations and client bundles setup
├── src/
│   ├── main.tsx                # Client entry point
│   ├── App.tsx                 # Core application layout, API handlers, and tabs controller
│   ├── types.ts                # Strict TypeScript system interfaces
│   ├── utils.ts                # Currency formatters, vault calculations, receipt generators
│   └── components/
│       ├── LoginScreen.tsx         # Identity gateway and roster authentication gateway
│       ├── PersonaHub.tsx          # Fast sandbox switcher for testing multi-role workflows
│       ├── SendMoneyForm.tsx       # Transmit module with real-time fee calculation & routing rules
│       ├── ReceiveMoneyForm.tsx    # Payout validation desk, safeguard PIN checks
│       ├── RemittanceList.tsx      # Unified transactional ledger with search, filtering, and printing
│       ├── SettlementsModule.tsx   # Netting and branch treasury reconciliation suite
│       ├── ExecutiveDashboard.tsx  # Dynamic charts, metrics tracking, and branch balances
│       ├── ReportingModule.tsx     # Operational compliance logs and audits
│       ├── AIIntelligenceCore.tsx  # Phase 2 Gemini operational analytics hub
│       └── OfflineSyncPanel.tsx    # Queue management panel for offline-first actions
```

---

## 🔒 Security & Data Isolation Architecture

- **Handshake Context Header**: Every HTTP client request automatically mounts the active employee credentials as a context header (`x-employee-id`).
- **Context Filtering**: Inside `server.ts`, the middleware intercepts incoming requests to fetch the associated record in the roster. It filters response datasets dynamically before delivering objects back to the browser:
  - If a user is an `AGENT` assigned to Juba, `db.transactions` is pruned to only returns transactions originating or terminating in Juba, or created by that agent specifically.
  - Attempting to access unauthorized API operations (such as branch creations or business configuration profile adjustments) without being the designated `OWNER` results in a secure `403 Forbidden` response block.
  - Safe operations block agents and auditors from initiating or approving inter-branch settlements.

---

## 📝 License & Compliance

*Nile Money Transfer System is prepared specifically for secure regional digital financial transactions. All transfers are registered, stamped, and audited under strict security parameters matching Central Bank regulatory frameworks.*
