<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Nile Money Transfer System (NMTS)</title>
  <style>
    body {
      font-family: "Segoe UI", Roboto, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      background: #f9fafb;
      color: #333;
    }
    header {
      background: linear-gradient(135deg, #0f172a, #1e3a8a);
      color: #fff;
      padding: 2rem;
      text-align: center;
    }
    header h1 {
      margin: 0;
      font-size: 2.5rem;
    }
    section {
      padding: 2rem;
      max-width: 1000px;
      margin: auto;
    }
    h2 {
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 0.5rem;
      margin-top: 2rem;
      color: #1e3a8a;
    }
    ul {
      list-style: none;
      padding: 0;
    }
    ul li {
      background: #fff;
      margin: 0.5rem 0;
      padding: 1rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    code, pre {
      background: #f3f4f6;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-family: Consolas, monospace;
    }
    pre {
      padding: 1rem;
      overflow-x: auto;
    }
    .card {
      background: #fff;
      border-radius: 8px;
      padding: 1.5rem;
      margin: 1rem 0;
      box-shadow: 0 2px 6px rgba(0,0,0,0.08);
    }
    footer {
      background: #1e293b;
      color: #fff;
      text-align: center;
      padding: 1rem;
      margin-top: 2rem;
    }
  </style>
</head>
<body>
  <header>
    <h1>🌍 Nile Money Transfer System (NMTS)</h1>
    <p>A secure, resilient regional remittance platform</p>
  </header>

  <section>
    <h2>🌟 Key Capabilities</h2>
    <div class="card">
      <h3>Strict Data Isolation & Security Hierarchy</h3>
      <ul>
        <li><strong>Owner (Corporate Admin):</strong> Full master access to system state, branches, safes, and logs.</li>
        <li><strong>Auditor:</strong> Read-only compliance access to logs and transactions.</li>
        <li><strong>Branch Manager:</strong> Limited to their branch’s transactions, rosters, and safes.</li>
        <li><strong>Frontline Agent:</strong> Restricted to their own transactions and payouts.</li>
      </ul>
    </div>

    <div class="card">
      <h3>Remittance Lifecycle Management</h3>
      <ul>
        <li><strong>Send Money:</strong> Secure sender/receiver profiles, PIN codes, and ledger registration.</li>
        <li><strong>Validate & Payout:</strong> Real-time verification and cash disbursement.</li>
        <li><strong>Cancel & Reverse:</strong> Privileged reversal with refund calculations.</li>
      </ul>
    </div>

    <div class="card">
      <h3>Treasury Management & Cash Vault Safes</h3>
      <p>Continuous tracking of branch reserves with live safe tally monitoring.</p>
    </div>

    <div class="card">
      <h3>Inter-Branch Netting & Settlements</h3>
      <p>Automated netting requests with multi-step approval and settlement cycles.</p>
    </div>

    <div class="card">
      <h3>Offline-First Synchronization</h3>
      <p>Agents can transact offline with automatic sync upon network restoration.</p>
    </div>

    <div class="card">
      <h3>Phase 2 AI Core</h3>
      <p>Integrated Gemini SDK for anomaly detection, liquidity projections, and BI reporting.</p>
    </div>
  </section>

  <section>
    <h2>🛠️ Technology Stack</h2>
    <ul>
      <li><strong>Frontend:</strong> React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Motion</li>
      <li><strong>Backend:</strong> Express, TypeScript, JSON persistence</li>
      <li><strong>Docker:</strong> Multi-stage alpine builds, non-root execution</li>
    </ul>
  </section>

  <section>
    <h2>📦 Containerization & Docker Setup</h2>
    <pre><code>docker build -t nile-money-transfer .
docker run -d -p 3000:3000 --name nile-app nile-money-transfer</code></pre>
    <p>Open <a href="http://localhost:3000">http://localhost:3000</a> to verify execution.</p>
  </section>

  <section>
    <h2>🚀 Local Development Setup</h2>
    <pre><code>npm install
npm run dev
npm run build
npm start</code></pre>
  </section>

  <section>
    <h2>📁 Core Directory Structure</h2>
    <pre><code>├── Dockerfile
├── server.ts
├── server-db.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   └── components/
│       ├── LoginScreen.tsx
│       ├── PersonaHub.tsx
│       ├── SendMoneyForm.tsx
│       ├── ReceiveMoneyForm.tsx
│       ├── RemittanceList.tsx
│       ├── SettlementsModule.tsx
│       ├── ExecutiveDashboard.tsx
│       ├── ReportingModule.tsx
│       ├── AIIntelligenceCore.tsx
│       └── OfflineSyncPanel.tsx</code></pre>
  </section>

  <section>
    <h2>🔒 Security & Data Isolation</h2>
    <p>Requests are filtered by role-based context headers. Unauthorized operations return <code>403 Forbidden</code>.</p>
  </section>

  <footer>
    <p>📝 Nile Money Transfer System — Secure regional financial transactions under Central Bank compliance.</p>
  </footer>
</body>
</html>
