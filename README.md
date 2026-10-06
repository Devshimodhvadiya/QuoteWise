# QuoteWise – Smart Quotation Comparator

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178c6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6+-646cff.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-ffca28.svg)](https://firebase.google.com/)

> **QuoteWise** is an enterprise-grade procurement intelligence platform designed to eliminate bias and guesswork from vendor selection. It provides procurement teams with a multi-criteria weighted scoring engine, real-time interactive parameter tuning, automated recommendation insights, and visual vendor comparisons.

---

## 🎯 The Real-World Problem Solved

In corporate procurement, comparing vendor quotations solely on **price** frequently leads to delivery delays, hidden warranty costs, or poor product quality. On the other hand, manually calculating weighted scores across multiple vendor proposals in spreadsheets is:
- **Error-prone** and tedious
- **Lacking auditability** and transparency for stakeholders
- **Inflexible** when project priorities shift (e.g. rush delivery vs. cost cutting)

**QuoteWise** solves this by establishing a standardized, audit-ready comparison workflow:
1. Define a purchase requirement with detailed specifications, budget, and target delivery.
2. Invite and record multiple vendor quotations (unit pricing, delivery turnaround, warranty, and quality scores).
3. Evaluate proposals dynamically using a **4-Factor Weighted Algorithm** with interactive sliders.
4. Review Recharts-powered Bar and Radar charts showing trade-offs at a glance.
5. Save finalized comparisons for compliance and audit history.

---

## 🚀 Key Features

### 1. 🏢 Multi-Tenant Company Isolation & Role-Based Access Control (RBAC)
- **Data Isolation:** All data (Requirements, Vendors, Quotations, Comparisons) is strictly scoped to the user's `companyId`.
- **Roles:**
  - `Admin`: Full access including user role management and team oversight.
  - `Manager`: Create requirements, input quotations, run comparisons, and finalize decisions.
  - `Viewer`: Read-only access to requirements and comparison reports.

### 2. 📋 Purchase Requirements Lifecycle
- Create detailed specifications with categories (Hardware, Software, Office Supplies, Industrial, Services).
- Track requirements through state workflows: `Draft` ➔ `Open` ➔ `Under Review` ➔ `Completed` / `Cancelled`.
- Direct 1-click transition from requirement to comparison workbench.

### 3. 👥 Vendor Directory & Performance Ratings
- Manage vendor contact information, tax IDs/GSTIN, payment terms, and notes.
- Historical rating system (1.0 to 5.0 stars) feeding into the evaluation engine.

### 4. 📄 Multi-Line Quotation Tracking
- Record formal vendor bids with unit pricing, taxes, validity dates, delivery lead times, and warranty terms.
- Status management (`Pending`, `Accepted`, `Rejected`).

### 5. ⚖️ Interactive Smart Comparison Engine
- **Configurable Weights:** Adjust weight sliders in real time:
  - 💰 **Price Weight** (Lower is better: $\frac{\text{Min Price}}{\text{Vendor Price}} \times 100$)
  - 🛡️ **Warranty Weight** (Higher is better: $\frac{\text{Vendor Warranty}}{\text{Max Warranty}} \times 100$)
  - ⏱️ **Delivery Speed** (Lower is better: $\frac{\text{Min Delivery Days}}{\text{Vendor Delivery Days}} \times 100$)
  - ⭐ **Vendor Rating** (Higher is better: $\frac{\text{Vendor Rating}}{\text{Max Rating}} \times 100$)
- **Constraint Enforcement:** Weights automatically validate to sum to 100%.

---

## 🧠 Advanced Decision Support Architecture

QuoteWise is intentionally engineered as an **auditable decision-support platform** rather than a naive "lowest price" selector. In corporate procurement, selecting the cheapest bid often leads to project failures, missed deadlines, or inflated warranty costs. QuoteWise solves this with 6 integrated analytical pillars:

### 1. 🛡️ Hard Constraint Validation (Pre-Ranking Gatekeeper)
- **Hard Constraints vs. Weighted Criteria:** Weighted criteria evaluate preference trade-offs, while **Hard Constraints** enforce mandatory non-negotiable thresholds.
- **Supported Constraints:**
  - `Maximum Budget Cap (₹)`
  - `Maximum Delivery Turnaround (Days)`
  - `Minimum Warranty Period (Months)`
  - `Minimum Historical Vendor Rating (1.0 to 5.0)`
- **Disqualification Logic:** Any vendor violating even one hard constraint is flagged as **✕ Not Eligible** with exact reasons (e.g. *"Warranty is 6 months; minimum required is 12 months"*).
- Ineligible vendors are completely disqualified from winning the recommendation, regardless of how high their other scores are.
- If all vendors fail constraints, QuoteWise transparently indicates *"No eligible vendor found"* and itemizes every vendor's non-compliance.

### 2. 📊 Explainable Score Breakdown
- Avoids "black-box" scores by exposing the complete mathematical trail for every eligible vendor:
  - **Raw Input:** Actual price (₹), delivery days, warranty months, rating.
  - **Normalized Score (0–100):** Relative ranking benchmarked against the best quotation in the cohort.
  - **Applied Weight (%):** Active corporate priority.
  - **Weighted Contribution:** Formula: $\text{Normalized Score} \times \text{Weight}$.
  - **Final Composite Score:** $\sum \text{Weighted Contributions} \in [0, 100]$.
- Interactive row expansion reveals visual progress bars and contribution formulas for compliance audits.

### 3. 🔮 What-If Scenario Analysis (Live Simulator)
- Allows CFOs, procurement leads, and auditors to simulate alternative weighting strategies without reloading the page or altering saved data.
- **Interactive Controls:** Real-time sliders for Price, Warranty, Delivery, and Rating weights with instant 100% sum validation.
- **Dynamic Winner Comparison:**
  - Compares **Original Winner** against **Scenario Winner**.
  - Highlights `⚡ Recommendation Changed` when weighting shifts cause a new winner to emerge.
  - Provides a deterministic explanation: e.g. *"Vendor A became recommended because Delivery now has a higher weight (50% vs 20%)."*
- **Scenario Actions:**
  - `Reset Scenario`: Returns sliders to current comparison weights.
  - `Apply Scenario`: With confirmation dialog, applies simulated weights to the active comparison.

### 4. 🚩 Automatic Rule-Based Red Flags
- Zero third-party AI APIs; deterministic, auditable business logic evaluates risk:
  - 🔴 **CRITICAL:** Budget exceeded, warranty below required minimum, delivery exceeds maximum, rating below minimum, or general ineligibility.
  - 🟡 **WARNING:** Price > 20% above average quotation, or delivery within 85% of deadline.
  - 🔵 **INFO:** Price > 15% below average (signals potential scope omission or aggressive underbidding risk).

### 5. 💡 "Why This Vendor?" Recommendation Explanation
- Dynamic heuristic narrative synthesizing key strengths:
  - Identifies unique advantages: *"Lowest quoted price among eligible vendors"*, *"Fastest delivery turnaround"*, etc.
  - Identifies transparent trade-offs: *"Although quotation is higher than Vendor X, superior 36-month warranty and 4.8 rating produced the highest composite value."*

### 6. 💰 Savings & Budget Decision Summary
- Computes comprehensive financial impact metrics:
  - Average Cohort Quotation, Lowest & Highest Quotation.
  - **Procurement Savings Amount:** $\text{Average Price} - \text{Recommended Price}$.
  - **Savings Percentage:** $\frac{\text{Savings Amount}}{\text{Average Price}} \times 100$.
  - **Above-Average Cost Handling:** If the winner is above average due to premium specifications, clearly displays *"Above Average Cost: +₹..."* rather than misleading positive savings.
  - **Executive Dashboard:** Tracks cumulative **Total Procurement Savings** deduplicated across completed evaluations.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | React 19, TypeScript |
| **Build Tool & Bundler** | Vite 6 |
| **Styling & Design** | Tailwind CSS v4, Inter Typography, Custom Modern Glassmorphic Dashboard UI |
| **Icons & Charts** | Lucide React, Recharts (Bar & Radar charts) |
| **Routing** | React Router v7 |
| **Forms & Validation** | React Hook Form, Zod |
| **State & Notifications** | React Context (Auth & Session), React Hot Toast |
| **Database & Auth** | Firebase Authentication, Google Cloud Firestore |
| **Security** | Granular Firestore Security Rules (`firestore.rules`) |

---

## 📁 Project Structure

```
smart-quotation-comparison/
├── firestore.rules              # Production-grade Firestore security rules
├── index.html                   # HTML entry point with metadata
├── package.json                 # Project dependencies & scripts
├── tsconfig.json                # Strict TypeScript configuration
├── vite.config.ts               # Vite configuration with Tailwind CSS v4 & path aliases
├── src/
│   ├── App.tsx                  # Main app router with code-split lazy routes
│   ├── main.tsx                 # React DOM mount point
│   ├── index.css                # Global styles, fonts, and scrollbar styling
│   ├── types/
│   │   └── index.ts             # Strong TypeScript interfaces for all data models
│   ├── context/
│   │   └── AuthContext.tsx       # Firebase Auth provider with userProfile state
│   ├── firebase/
│   │   ├── config.ts            # Firebase app initialization & SDK instances
│   │   └── firestore.ts         # Type-safe CRUD operations for Firestore collections
│   ├── routes/
│   │   └── ProtectedRoute.tsx   # Route guards for authentication and role restrictions
│   ├── layouts/
│   │   └── AppLayout.tsx        # Responsive sidebar, navigation bar, and user profile header
│   ├── components/
│   │   └── ui/                  # Reusable UI component library
│   │       ├── Button.tsx       # Polymorphic button with loading states & variants
│   │       ├── Card.tsx         # Card and StatCard metrics component
│   │       ├── Modal.tsx        # Accessible dialog component
│   │       └── index.ts         # Badge, Input, Select, PageHeader, PageLoader, EmptyState
│   ├── pages/
│   │   ├── auth/                # Login, Register, Forgot Password
│   │   ├── dashboard/           # Metrics, Recent Requirements, Comparisons, Visual Analytics
│   │   ├── requirements/        # List, Create, Edit, Detail views
│   │   ├── vendors/             # Directory, Add/Edit modal, Contact details
│   │   ├── quotations/          # All quotations overview & filter
│   │   ├── comparisons/         # Saved comparisons, New comparison engine, Detail report
│   │   ├── history/             # Historical audit log of all completed evaluations
│   │   ├── admin/               # Admin User Management & Role Promotions
│   │   └── settings/            # Company information, weights guide, Demo Data Seeder
│   └── utils/
│       ├── comparison.ts        # Pure scoring algorithm, recommendation heuristics, currency formatters
│       ├── index.ts             # Date formatters, status colors, string helpers
│       └── seedData.ts          # Mock data generator for quick testing & portfolio demo
```

---

## 🔒 Security & Multi-Tenancy Architecture

All Firestore operations enforce strict tenant boundary checks using `firestore.rules`:

1. **Authentication Required:** Anonymous or unauthenticated requests are rejected.
2. **Company Isolation:** Users can only read and write documents where `resource.data.companyId == userCompany()`.
3. **Role Checks:**
   - Deleting requirements or quotations requires `Manager` or `Admin` role.
   - Modifying user roles (`users` collection) is strictly restricted to `Admin`.
4. **Data Integrity:** Comparison records are immutable once saved to preserve audit history.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm or yarn

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd smart-quotation-comparison
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update `.env` with your Firebase project credentials:
```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Deploy Firestore Security Rules
In the Firebase Console or via Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Production Build
```bash
npm run build
npm run preview
```

---

## 🏢 Multi-Tenant Workspace & Company Onboarding

QuoteWise strictly enforces **Company-Level Tenant Isolation**:

1. **Workspace Registration (`/register`):**
   - When a new company signs up, the creator is assigned as the **Administrator**.
   - Colleague team members registering under the same company name join as **Employees**.
   - Data between different companies is strictly separated: users only see vendors, requirements, quotations, and comparisons belonging to their organization.

2. **Employee Work Focus:**
   - In **Requirements**, **Quotations**, and **Comparisons**, users can toggle between **All Workspace** (company-wide view) and **My Tasks / My Submissions** (personal assignments).
   - Unauthorized access across companies is blocked at both client and Firestore security rules levels.

3. **User Management:**
   - Administrators can review all members of their company at `/admin/users` and promote or demote roles.

---

## 📄 License
MIT License. Built for enterprise procurement evaluation and portfolio demonstration.
