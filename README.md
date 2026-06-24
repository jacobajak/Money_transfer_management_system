<div align="center">

# 🏦 Nile Money Transfer System (NMTS)

<p>
  <b>Secure • Resilient • Offline-First Regional Remittance Platform</b>
</p>

<p>
  <img src="https://img.shields.io/badge/React-18-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Express.js-Backend-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Docker-Production_Ready-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/AI-Gemini-orange?style=for-the-badge" />
</p>

<p>
  High-performance money transfer infrastructure designed for secure branch operations,
  treasury management, inter-branch settlements, compliance auditing, and AI-powered
  financial intelligence.
</p>

</div>

---

## 📖 Overview

<table>
<tr>
<td width="50%">

### 🎯 Mission

Provide a secure and scalable regional remittance platform that enables:

* Money transfers
* Cash payouts
* Treasury monitoring
* Branch reconciliation
* Compliance auditing
* AI-powered anomaly detection

</td>

<td width="50%">

### ⚡ Highlights

✅ Role-Based Access Control

✅ Offline-First Operations

✅ Multi-Branch Settlement Engine

✅ Safe Ledger Tracking

✅ AI Operational Intelligence

✅ Docker Ready

</td>
</tr>
</table>

---

## 🌟 Key Capabilities

### 🔐 1. Strict Data Isolation & Security Hierarchy

<table>
<tr>
<th>Role</th>
<th>Access Level</th>
</tr>

<tr>
<td><b>Owner</b></td>
<td>Complete control over branches, personnel, safes, settlements, logs, and system configuration.</td>
</tr>

<tr>
<td><b>Auditor</b></td>
<td>Read-only visibility across all transactions, logs, reports, and compliance data.</td>
</tr>

<tr>
<td><b>Branch Manager</b></td>
<td>Controls branch operations, personnel, safes, and settlement workflows.</td>
</tr>

<tr>
<td><b>Agent</b></td>
<td>Restricted to personal transactions, payouts, and assigned cash drawer.</td>
</tr>

</table>

---

### 💸 2. Remittance Lifecycle Management

<div>

#### Send Money

* Sender & receiver registration
* Destination branch routing
* Multi-currency support (SSP/USD)
* Fee calculation
* Secure PIN generation

#### Validate & Payout

* Ticket verification
* PIN validation
* Branch confirmation
* Secure cash disbursement

#### Cancel & Reverse

* Manager approval workflow
* Automated refund calculations
* Safe liability release

</div>

---

### 🏦 3. Treasury Management & Safe Tracking

<table>
<tr>
<td>

✔ Real-time safe balances

✔ CASH_IN ledgers

✔ CASH_OUT ledgers

✔ Branch liquidity monitoring

✔ Automatic closing balances

</td>
</tr>
</table>

---

### 🔄 4. Inter-Branch Netting & Settlement

```text
CREATED
    │
    ▼
APPROVED / REJECTED
    │
    ▼
SETTLED
```

#### Settlement Automation

| Action                | Ledger Impact   |
| --------------------- | --------------- |
| Payer Branch          | CASH_OUT        |
| Receiver Branch       | CASH_IN         |
| Settlement Completion | Vault Alignment |

---

### 🌐 5. Offline-First Synchronization

> Designed for unreliable network environments.

Features:

* Local action queue
* Automatic synchronization
* Conflict resolution
* Transaction persistence
* Network recovery handling

---

### 🤖 6. AI Intelligence Core

Powered by Gemini SDK.

#### Capabilities

| Feature               | Description                    |
| --------------------- | ------------------------------ |
| Anomaly Detection     | Detect suspicious transactions |
| Liquidity Forecasting | Predict cash shortages         |
| Operational BI        | Real-time insights             |
| Compliance Alerts     | Identify irregular activity    |

---

# 🛠 Technology Stack

<table>

<tr>
<th>Layer</th>
<th>Technology</th>
</tr>

<tr>
<td>Frontend</td>
<td>React 18, Vite, TypeScript, Tailwind CSS, Recharts</td>
</tr>

<tr>
<td>Backend</td>
<td>Express, TypeScript, ESBuild</td>
</tr>

<tr>
<td>Persistence</td>
<td>server-db.json</td>
</tr>

<tr>
<td>AI</td>
<td>Google Gemini SDK</td>
</tr>

<tr>
<td>Containerization</td>
<td>Docker Multi-Stage Builds</td>
</tr>

</table>

---

# 📦 Docker Deployment

<details>
<summary><b>View Docker Instructions</b></summary>

### Build

```bash
docker build -t nile-money-transfer .
```

### Run

```bash
docker run -d -p 3000:3000 \
--name nile-app \
nile-money-transfer
```

### Verify

Open:

```text
http://localhost:3000
```

</details>

---

# 🚀 Local Development

### Installation

```bash
npm install
```

### Environment Variables

```env
PORT=3000
GEMINI_API_KEY=your_gemini_api_key_here
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

### Start Production

```bash
npm start
```

---

# 📁 Project Structure

```text
src/
├── App.tsx
├── main.tsx
├── types.ts
├── utils.ts
│
└── components/
    ├── LoginScreen.tsx
    ├── PersonaHub.tsx
    ├── SendMoneyForm.tsx
    ├── ReceiveMoneyForm.tsx
    ├── RemittanceList.tsx
    ├── SettlementsModule.tsx
    ├── ExecutiveDashboard.tsx
    ├── ReportingModule.tsx
    ├── AIIntelligenceCore.tsx
    └── OfflineSyncPanel.tsx
```

---

# 🔒 Security Architecture

<div>

### Request Context Security

Every request carries:

```http
x-employee-id
```

### Access Enforcement

* Dynamic response filtering
* Branch-level isolation
* Role-based authorization
* Settlement approval restrictions
* Secure 403 rejection handling

</div>

---

# 📊 Operational Workflow

```text
Customer
    │
    ▼
Send Money
    │
    ▼
Secure Ledger
    │
    ▼
Destination Branch
    │
    ▼
PIN Validation
    │
    ▼
Cash Payout
```

---

# 📝 License & Compliance

<div align="center">

**Nile Money Transfer System**

Secure regional remittance infrastructure designed for regulated financial environments.

All transactions are:

✅ Logged

✅ Audited

✅ Traceable

✅ Settlement Verified

✅ Compliance Ready

</div>

---

<div align="center">

### 🚀 Built for Secure Regional Financial Operations

</div>
