# AEHA – Autonomous Ethical Hacking Assistant with Intelligent Penetration Testing Automation

**Course Project:** ITA1405 – Ethical Hacking  
**Target Platform:** Vercel (Edge & Serverless Node Runtime) + Neon Serverless PostgreSQL  
**Primary Execution Modes:** Safe Demo Mode (Default, 100% in-process Vercel), Web Passive Scanner, and External Isolated Lab Worker.

---

## 1. Project Purpose & Overview

AEHA is an intelligent assistant designed to automate authorized penetration testing and vulnerability lifecycle workflows:
- **Authorized Scope Enforcement & ROE:** Strict legal authorization verification, DNS-rebinding protection, and CIDR/IP validation before any scan action.
- **Attack Surface Reconnaissance & Discovery:** Automated discovery of hosts, operating systems, and service versions.
- **AI Vulnerability Analysis & Triage:** Structured LLM evaluation (via Vercel AI SDK) with a deterministic rule-based zero-dependency fallback. Clusters duplicate findings across tools and identifies false positives (e.g., scanner alerts on static assets).
- **Multi-Factor Risk Prioritization:** Calculates weighted risk scores (0–100) based on severity/CVSS, internet exposure, and asset criticality.
- **Human-in-the-Loop Approval Gates:** Mandatory approval required for sensitive actions (disabling services, disruptive configuration adjustments).
- **Reassessment & Verification:** Automatically re-tests remediated assets to confirm vulnerability closure.
- **Cryptographic Audit Chain (SHA-256):** Tamper-evident hash chaining across every security decision, scan event, approval, and user authentication action.
- **Enterprise Onboarding & RBAC:** Comprehensive self-registration with password complexity, admin approval workflow, one-time invite tokens, password reset with expiring tokens, rate-limiting, and profile management.
- **WCAG AA Theming:** System-wide dark/light/system theme toggling powered by `next-themes` and semantic CSS variables.

---

## 2. 4-Layer System Architecture

```text
User (Security Analyst / Admin / Viewer)
   ↓
[ Layer 1: Web Dashboard & Theme Engine ]
   Next.js 15 App Router • Tailwind CSS • next-themes • Recharts • Security Ops Console
   ↓
[ Layer 2: Application Server & Orchestration ]
   Next.js API Route Handlers on Vercel • Vercel Cron Queue (/api/cron/tick)
   Scope Guard Gatekeeper • AI Reasoning Engine (Vercel AI SDK + Rules Fallback)
   Sliding Window Rate Limiter • RBAC Middleware
   ↓                                   ↓
[ Layer 3: Database & Audit Ledger ]  [ Layer 4: Pluggable Scanner Adapters ]
   PostgreSQL on Neon (Serverless)      ├─ DemoScanner (Default, simulated CVEs & probes)
   Drizzle ORM                          ├─ WebPassiveScanner (Non-intrusive TLS/headers)
   SHA-256 Cryptographic Hash Chain     └─ WorkerScanner (External isolated lab worker)
```

---

## 3. Workflow State Machine

One Assessment Job progresses through the following sequential states:

```text
DRAFT
  ↓ (Assert authorized scope & check rules of engagement)
SCOPE_VALIDATED
  ↓ (Asset discovery & port fingerprinting)
RECON
  ↓ (Consolidate vulnerability findings)
SCANNING
  ↓ (AI duplicate clustering & false-positive triage)
ANALYZING
  ↓ (Flag sensitive remediations for authorization)
AWAITING_APPROVAL
  ↓ (Analyst approves/rejects; tracking remediation)
REMEDIATING
  ↓ (Re-scan affected hosts to confirm resolution)
REASSESSING
  ↓ (Executive report generated; SHA-256 integrity closed)
COMPLETED (or FAILED / CANCELLED)
```

---

## 4. User Onboarding, RBAC & Theming

### Role Hierarchy & Permissions
- **`ADMIN`:** Full access to all assessments, audit chain, system settings, approval gates, and `/admin/users` (approve/reject new registrations, change roles, disable/enable accounts, generate one-time 48-hour invite links).
- **`ANALYST`:** Create & run assessments, configure rules of engagement, approve sensitive remediation plans, and view reports and audit logs.
- **`VIEWER`:** Read-only access to completed assessments, reports, and audit logs. Restricted from mutating state machines or approving remediation tasks.

### Onboarding & Security Features
- **Registration (`/register`):** Validated with Zod (minimum 10 characters, at least 1 number, at least 1 symbol). New self-registered accounts receive `VIEWER` role with `PENDING_APPROVAL` status. Login is strictly blocked until approved by an administrator.
- **Admin User Management (`/admin/users`):** Dedicated admin console displaying pending approval accounts, instant one-click Approve / Reject, role promotion/demotion, account disable/enable, and an **Invite User** generator that creates a cryptographic 48-hour one-time link that bypasses approval.
- **Forgot & Reset Password (`/forgot-password` and `/reset-password/[token]`):** Generates a 1-hour single-use token. Dispatches an email via Resend when `RESEND_API_KEY` is configured, or provides a copyable link in the admin UI for demo setups.
- **User Profile (`/profile`):** View role, email, change display name, and update password with current-password verification.
- **Rate Limiting & Audit Trail:** Built-in sliding-window rate limiter protecting login, registration, and reset endpoints. All user status changes, role updates, invite creations, and reset activities are automatically logged to the append-only SHA-256 audit ledger.
- **Accessible Theming (`Light / Dark / System`):** Zero hardcoded component colors; fully responsive shadcn semantic CSS tokens with WCAG AA compliant contrast for charts, severity badges, and code blocks.

---

## 5. Quick Start (Local Development)

### Prerequisites
- Node.js 18+ or 20+ (Node v24 supported)
- npm 10+ or 11+
- (Optional) Docker for running the local lab worker

### Step 1: Clone and Install Dependencies
```bash
git clone <your-repository-url>
cd EH-CP
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Key defaults provided in `.env.example`:
- `AUTH_SECRET`: Random 32+ character string
- `ADMIN_EMAIL`: `admin@aeha.local`
- `ADMIN_PASSWORD`: `AdminSecurePassword123!`
- `DEFAULT_MODE`: `demo`

*(Note: If `DATABASE_URL` is omitted, the application runs in offline demo mode using memory caches for instant exploration!)*

### Step 3: Run the Test Suite
```bash
npm run test
```
Runs 32 comprehensive Vitest unit tests covering:
- Scope Guard & Private IP rejection (11 tests)
- Risk Scorer & Multi-factor weighting (4 tests)
- AI Engine, Deduplication & False-positive triage (4 tests)
- Cryptographic SHA-256 Audit Chain & Tamper Detection (3 tests)
- Password validation, Rate limiter, Token hashing & RBAC permissions (10 tests)

### Step 4: Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. Step-by-Step Vercel Deployment

Deploying AEHA to Vercel requires zero binary dependencies:

1. **Push Code to GitHub:**
   ```bash
   git add .
   git commit -m "feat: complete AEHA ethical hacking assistant"
   git branch -M main
   git remote add origin https://github.com/<your-username>/aeha-ethical-hacking-assistant.git
   git push -u origin main
   ```

2. **Import Project into Vercel:**
   - Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
   - Select your GitHub repository.
   - Framework preset will automatically detect **Next.js**.

3. **Attach Neon Serverless PostgreSQL Database:**
   - In the Vercel dashboard project creation page, click **Storage** or navigate to the Marketplace and add **Neon Postgres**.
   - Vercel will automatically inject `DATABASE_URL` and `POSTGRES_URL` into your environment variables.

4. **Configure Environment Variables in Vercel:**
   Add the following in **Settings → Environment Variables**:
   | Variable | Value | Description |
   | :--- | :--- | :--- |
   | `AUTH_SECRET` | *(Random 32-char string)* | NextAuth v5 session secret |
   | `AUTH_URL` | `https://<your-vercel-app>.vercel.app` | Production root URL |
   | `ADMIN_EMAIL` | `admin@aeha.local` | Default administrator |
   | `ADMIN_PASSWORD` | `AdminSecurePassword123!` | Secure admin password |
   | `CRON_SECRET` | *(Random secret string)* | Protects `/api/cron/tick` |
   | `WORKER_TOKEN` | *(Secret token)* | Authenticates scanner worker |
   | `WORKER_HMAC_SECRET`| *(Secret HMAC key)* | Signs worker telemetry |
   | `DEFAULT_MODE` | `demo` | Safe Vercel default mode |
   | `RESEND_API_KEY` | *(Optional)* | For password reset emails via Resend |
   | `GOOGLE_GENERATIVE_AI_API_KEY` | *(Optional)* | Google Gemini API Key |
   | `OPENAI_API_KEY` | *(Optional)* | OpenAI API Key |
   | `ANTHROPIC_API_KEY` | *(Optional)* | Anthropic Claude Key |

   *(Note: If no AI key is configured, AEHA automatically operates using its built-in deterministic rule engine!)*

5. **Run Database Migrations and Seed Data:**
   In your local terminal (pointing to the Neon `DATABASE_URL`):
   ```bash
   # Push Drizzle schema to Neon
   npx drizzle-kit push

   # Seed demo assessments, findings, and audit log chain
   npm run db:seed
   ```

6. **Deploy & Verify:**
   - Click **Deploy**. Vercel will execute `next build` and deploy serverless functions.
   - Vercel Cron will automatically pick up `/api/cron/tick` from `vercel.json` to execute every minute.

---

## 7. Optional Real Scanner Worker (Lab Environment)

For running real `nmap` and `owasp-zap` scans against an isolated lab target (e.g. OWASP Juice Shop / DVWA), use the `/worker` daemon:

### Architecture
- The worker runs inside an isolated Docker network.
- **Outbound only:** Polls `GET /api/worker/next-job` using `WORKER_TOKEN`.
- **Local Scope Guard:** Strictly enforces `ALLOWED_CIDRS` (e.g. `10.0.4.0/24`) and refuses any outside target.
- **Cryptographic Result Signing:** Submits results to `POST /api/worker/results` signed with an `HMAC-SHA256` signature.

### How to Run the Worker
```bash
cd worker
docker-compose up --build
```
This starts:
1. `aeha-lab-juice-shop` on `10.0.4.50:3000` (Deliberately vulnerable test target).
2. `aeha-scanner-worker` on `10.0.4.99` (Worker polling your app at `APP_URL`).

---

## 8. Demo Accounts & Acceptance Testing Checklist

### Pre-configured Credentials
- **Admin Role:** `admin@aeha.local` / `AdminSecurePassword123!`
- **Analyst Role:** `analyst@aeha.local` / `AnalystSecurePassword123!`

### Acceptance Checklist
- [x] **`npm run test`**: 32 unit tests pass covering scope guard, risk formula, AI triage, onboarding validations, and SHA-256 hash chaining.
- [x] **`npm run build`**: Builds with 0 errors and zero native dependencies.
- [x] **User Onboarding & Admin Gate**: Self-registration with strict password policy, pending approval state, admin user approvals, and one-time invites.
- [x] **Light / Dark / System Theme**: System-wide theme toggle with zero hardcoded component colors and WCAG AA contrast.
- [x] **State Machine Execution**: Full step progression from `DRAFT` through `COMPLETED`.
- [x] **Scope Guard Protection**: Blocks loopback (`127.0.0.1`), cloud metadata (`169.254.169.254`), and out-of-scope targets in passive mode.
- [x] **AI False-Positive & Duplicate Detection**: Identifies static assets misdiagnosed as SQLi and clusters duplicate CVEs.
- [x] **Human Approval Gate**: Sensitive remediations (e.g. Spring4Shell upgrade or PostgreSQL TLS reload) halt at `AWAITING_APPROVAL` until analyst signs off.
- [x] **Report Generation**: Export in formal Executive PDF/HTML, Technical CSV, and JSON schemas.
- [x] **Cryptographic Audit Ledger**: Append-only SHA-256 hash chain with instant "Verify Integrity" tamper detection.

---

## 9. Limitations & Security Policy

1. **Defensive & Detection Focus:** AEHA is an ethical hacking and vulnerability management tool. It does not deliver weaponized exploits, execute denial-of-service, or harvest credentials.
2. **Serverless Limits:** Because Vercel serverless functions have short timeouts (10–60s) and do not support raw socket binaries like Nmap, live network scanning is routed either through non-intrusive HTTP checks (Passive Mode) or the dedicated external Python worker (Worker Mode).
