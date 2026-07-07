# 🏦 SBI Credit Card Sales & Eligibility System
### Enterprise Banking Onboarding Platform — v2.0.0

A **production-ready full-stack banking onboarding application** built with React.js, Node.js/Express, and MongoDB Atlas. Inspired by SBI, ICICI, HDFC, and Axis Bank internal onboarding systems.

---

## 📂 Project Structure

```
sbi-cc-system/
├── frontend/                        # React.js Application
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   └── shared/
│   │   │       └── UI.jsx           # All reusable UI components
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Global auth state
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx        # Customer & Admin login
│   │   │   ├── OnboardingPage.jsx   # 5-step customer flow
│   │   │   └── AdminPage.jsx        # Full admin dashboard
│   │   ├── services/
│   │   │   └── api.js               # Axios API service
│   │   ├── App.jsx                  # Router & providers
│   │   ├── index.js                 # React entry point
│   │   └── index.css                # Global styles
│   ├── .env.example
│   └── package.json
│
├── backend/                         # Node.js / Express API
│   ├── server.js                    # Entry point
│   ├── models/
│   │   └── schemas.js               # 5 MongoDB Mongoose schemas
│   ├── routes/
│   │   ├── auth.js                  # Customer + Admin auth
│   │   ├── applications.js          # Application CRUD
│   │   ├── kyc.js                   # Document upload + OCR
│   │   ├── eligibility.js           # Eligibility engine
│   │   ├── admin.js                 # Admin-only ops
│   │   ├── reports.js               # Excel + QD reports
│   │   ├── notifications.js         # Email/WhatsApp dispatch
│   │   └── leads.js                 # Lead management
│   ├── middleware/
│   │   ├── auth.js                  # JWT + RBAC
│   │   └── upload.js                # Multer file validation
│   ├── services/
│   │   ├── ocrService.js            # Tesseract.js + Google Vision
│   │   ├── eligibilityEngine.js     # Smart scoring algorithm
│   │   ├── excelService.js          # ExcelJS report generation
│   │   ├── notificationService.js   # Nodemailer + Twilio
│   │   └── fraudDetection.js        # AI fraud checks
│   ├── config/
│   │   └── seed.js                  # Database seeder
│   ├── uploads/                     # Organized document storage
│   │   ├── pan/
│   │   ├── aadhaar/
│   │   ├── payslip/
│   │   ├── bankStatement/
│   │   └── misc/
│   ├── reports/                     # Generated Excel/PDF files
│   ├── logs/                        # Winston log files
│   ├── .env.example
│   └── package.json
│
└── README.md
```

---

## ✨ Features

### 👤 Customer Onboarding (5-Step Flow)
| Step | Description |
|------|-------------|
| 1 | Personal details — name, mobile, email, DOB, gender, address, pincode |
| 2 | KYC — PAN + Aadhaar upload with **AI-OCR auto-extraction & name matching** |
| 3 | Employment — salaried/self-employed with dynamic fields + document uploads |
| 4 | **Smart eligibility engine** — instant score + card recommendation |
| 5 | Review & submit with consent + WhatsApp/email confirmation |

### 🤖 AI-Powered OCR Engine
Supports Tesseract.js (free) or Google Vision API (premium):

| Document | Extracted Fields |
|----------|-----------------|
| PAN Card | PAN number, name, father's name, DOB, card type |
| Aadhaar Card | Masked Aadhaar, name, DOB, gender, full address, pincode, state |
| Payslip | Gross salary, net salary, company name, PF, TDS, pay period |
| Bank Statement | IFSC, bank name, closing balance, monthly credits/debits |
| GST Certificate | GST number, business name |

### ⚡ Eligibility Engine (6-Factor Scoring)
| Factor | Max Points |
|--------|-----------|
| Monthly Income | 35 |
| Age | 20 |
| Work Experience | 15 |
| Location Serviceability | 10 |
| Employment Type | 10 |
| Bank Balance | 10 |

**Decisions:** ≥80 → Approved | 65–79 → Conditionally Approved | 50–64 → Requires Review | <50 → Rejected

### 💳 Card Recommendations
| Card | Min Salary | Category |
|------|-----------|---------|
| SBI Elite | ₹75,000 | Premium |
| SBI Prime | ₹60,000 | Premium |
| SBI Cashback | ₹40,000 | Cashback |
| IRCTC SBI Card | ₹35,000 | Co-brand |
| SimplySAVE | ₹25,000 | Entry |
| Business Credit | ₹1,50,000 | Business |

### 📊 Admin Dashboard (10 Modules)
1. **Dashboard** — Stats cards, monthly bar chart, donut chart, team performance
2. **Applications** — Searchable table with status filters, QD view, approve/reject
3. **Lead Management** — Source tracking, priority, follow-up scheduling
4. **Document Verification** — Per-document verification queue
5. **Fraud Detection** — AI checks, duplicate PAN/Aadhaar, risk scoring
6. **Card Catalogue** — All 6 cards with features and visual previews
7. **CRM & Follow-ups** — WhatsApp/Email bulk send, reminder scheduling
8. **Team & Access** — RBAC user management, performance tracking
9. **Reports & Excel** — Excel export (3 sheets), QD batch generation
10. **Notifications** — Manual alert dispatch with templates

### 🔐 Security Architecture
- **JWT Authentication** — 8h access + 7d refresh tokens
- **bcrypt** — 12 salt round password hashing
- **Helmet.js** — 15 HTTP security headers
- **Rate Limiting** — 300 req/15min global, 30/15min on auth
- **RBAC** — 5 roles: Manager, Team Leader, Sales Executive, Telecaller, Risk Analyst
- **Multer** — MIME type check, 5MB limit, randomized filenames
- **Audit Logging** — Every admin action logged with IP and timestamp
- **Winston** — Structured JSON logging with error/combined files

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18.0
- npm ≥ 9.0
- MongoDB Atlas account (free tier works)

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and secrets
npm run seed       # Create admin users & demo data
npm run dev        # Start with nodemon (development)
npm start          # Start for production
```

### 2. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local
# Confirm REACT_APP_API_URL=http://localhost:5000/api
npm start          # Development server (port 3000)
npm run build      # Production build
```

### 3. Default Login Credentials
| Staff ID | Password | Role |
|----------|----------|------|
| SBI-MGR-001 | Admin@123 | Manager |
| SBI-TL-001  | Admin@123 | Team Leader |
| SBI-SE-001  | Admin@123 | Sales Executive |
| SBI-TC-001  | Admin@123 | Telecaller |
| SBI-RA-001  | Admin@123 | Risk Analyst |

---

## 🌐 Deployment

### Frontend → Vercel
```bash
# Push frontend/ to GitHub
# Import project in vercel.com
# Set environment variable:
#   REACT_APP_API_URL = https://your-backend.render.com/api
npm run build   # Vercel runs this automatically
```

### Backend → Render
```bash
# Push backend/ to GitHub
# Create new Web Service in render.com
# Build command:  npm install
# Start command:  node server.js
# Add all .env variables in Render dashboard
```

### Database → MongoDB Atlas
```
1. Create cluster at cloud.mongodb.com
2. Create database user with readWrite role
3. Network access → Add 0.0.0.0/0 (for Render)
4. Get connection string → paste as MONGODB_URI
5. Run seed: node config/seed.js
```

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/customer/login | None | Customer login (name+mobile+email) |
| POST | /api/auth/admin/login | None | Admin login (staffId+password) |
| POST | /api/auth/refresh | None | Refresh access token |
| GET | /api/auth/me | JWT | Get current user |
| POST | /api/auth/admin/create | JWT+Manager | Create staff account |

### Applications
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/applications | None | Submit new application |
| GET | /api/applications | JWT | List with filters & pagination |
| GET | /api/applications/:id | JWT | Get single application |
| PATCH | /api/applications/:id/status | JWT+TL | Update status |
| POST | /api/applications/:id/notes | JWT | Add CRM note |
| PATCH | /api/applications/:id/assign | JWT+TL | Assign to staff |

### KYC & OCR
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/kyc/:appId/kyc-docs | None | Upload PAN+Aadhaar → OCR |
| POST | /api/kyc/:appId/employment-docs | None | Upload payslips, bank stmt → OCR |

### Reports
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/reports/excel | JWT | Download Excel report |
| GET | /api/reports/qd/:appId | JWT | Get QD profile JSON |
| GET | /api/reports/dashboard-stats | JWT | Analytics data |

---

## 👥 Role Permissions Matrix

| Feature | Manager | Team Leader | Sales Exec | Telecaller | Risk Analyst |
|---------|:-------:|:-----------:|:----------:|:----------:|:------------:|
| View Applications | ✅ | ✅ | ✅ (own) | ✅ (own) | ✅ |
| Approve / Reject | ✅ | ✅ | ❌ | ❌ | ✅ |
| Assign Leads | ✅ | ✅ | ❌ | ❌ | ❌ |
| Export Excel | ✅ | ✅ | ✅ | ❌ | ✅ |
| Manage Staff | ✅ | ❌ | ❌ | ❌ | ❌ |
| Fraud Reports | ✅ | ✅ | ❌ | ❌ | ✅ |
| CRM Notes | ✅ | ✅ | ✅ | ✅ | ❌ |
| Delete Application | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## ⚙️ Key Environment Variables

| Variable | Required | Description |
|----------|:--------:|-------------|
| MONGODB_URI | ✅ | MongoDB Atlas connection string |
| JWT_SECRET | ✅ | Min 32 chars random string |
| JWT_REFRESH_SECRET | ✅ | Min 32 chars random string |
| EMAIL_USER | ⚡ | Gmail address for notifications |
| EMAIL_PASS | ⚡ | Gmail App Password (16 chars) |
| TWILIO_ACCOUNT_SID | ⚡ | WhatsApp via Twilio |
| GOOGLE_VISION_KEY_FILE | ⚡ | Enhanced OCR (optional) |

---

## 🏗️ Tech Stack

### Frontend
- **React 18** — UI framework
- **React Router v6** — Client-side routing
- **Axios** — HTTP client with interceptors
- **React Hot Toast** — Notifications
- **Custom CSS** — Banking-grade UI (no external CSS framework)

### Backend
- **Node.js + Express 4** — REST API server
- **MongoDB + Mongoose 8** — Database + ORM
- **Tesseract.js** — Open-source OCR engine
- **Google Cloud Vision** — Premium OCR (optional)
- **ExcelJS** — Excel report generation (3 sheets)
- **Nodemailer** — Email notifications (HTML templates)
- **Twilio** — WhatsApp notifications
- **JWT + bcrypt** — Authentication & password security
- **Helmet + Rate Limiter** — API security
- **Multer** — File upload with MIME validation
- **Winston** — Structured logging
- **PDFKit** — PDF generation (QD profiles)

---

## 📄 License
MIT License — Free for educational and commercial use.

## 🤝 Support
SBI Credit Card Division | 1800-11-2211 | creditcard@sbi.co.in
