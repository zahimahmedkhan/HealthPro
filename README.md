# HealthPro — Healthcare Management Platform

A full-stack MERN healthcare application with role-based access control, consent-based data sharing, AI-powered report analysis, and comprehensive audit logging. Built for patients, doctors, labs, and administrators.

## Features

### Authentication & Roles
- JWT authentication with access/refresh token rotation
- OTP-based email verification (with resend support)
- Four roles: **patient**, **doctor**, **lab**, **admin**
- Role-based route protection on frontend and backend

### Patient Features
- **Vitals Tracking** — record and monitor heart rate, blood pressure, temperature, SpO₂
- **AI Report Analysis** — upload medical reports (PDF), get AI-generated summaries via Google Gemini
- **Emergency Profile** — maintain critical info (blood group, allergies, medications, emergency contacts) shareable via a public no-auth link with QR code
- **Appointments** — book appointments with doctors who have approved access
- **Medication Reminders** — set up recurring reminders with email notifications
- **Access History** — see who viewed your records and when

### Doctor Features
- **Patient Access** — search for patients and request consent-based access
- **View Patient Data** — view vitals and AI insights only after patient approval
- **Appointment Management** — confirm, complete, or cancel patient appointments

### Lab Features
- **Upload for Patients** — upload lab reports directly to a patient's account (after consent)

### Admin Features
- **Account Verification** — approve/reject doctor and lab account registrations
- **Audit Logs** — review all system activity with filtering and pagination

### Security
- Consent-based access grants — doctors/labs must request and be approved before viewing patient data
- Audit logging on all sensitive data access (vitals, insights, emergency profiles)
- DOMPurify sanitization on all AI-generated HTML content
- Rate limiting on OTP resend

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 18 (Vite), Redux Toolkit, React Router, Ant Design, Tailwind CSS, Axios |
| Backend | Node.js, Express, Mongoose (MongoDB) |
| AI | Google Gemini API |
| Storage | Cloudinary (via Multer) |
| Email | Nodemailer (Gmail) |
| Auth | JWT (access + refresh tokens), bcrypt, OTP |

## Project Structure

```
HEALTH_CARE_APP/
├── backend/
│   ├── controllers/     # Route handlers
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express route definitions
│   ├── middlewares/      # Auth, role checks, access gating
│   ├── utils/           # Email, cron jobs, audit logging, AI
│   └── index.js         # Server entry point
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components (auth, dashboard)
│   │   ├── layouts/     # DashboardLayout, AuthLayout
│   │   ├── utils/       # Axios setup, PDF utils, helpers
│   │   └── redux/       # Redux store and slices
│   └── index.html
├── .gitignore
└── README.md
```

## Setup

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account
- Google Gemini API key
- Gmail account with app password (for Nodemailer)

### 1. Clone & Install

```bash
git clone <repo-url>
cd HEALTH_CARE_APP

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Environment Variables

Create `backend/.env` using `backend/.env.example` as a template:

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your actual credentials
```

Create `frontend/.env` using `frontend/.env.example` as a template:

```bash
cp frontend/.env.example frontend/.env
# Edit frontend/.env if needed (defaults work for local dev)
```

### 3. Run

```bash
# Backend (from backend/)
npm run dev

# Frontend (from frontend/)
npm run dev
```

The backend runs on `http://localhost:3000` and the frontend on `http://localhost:5173`.

## API Endpoints

| Group | Endpoint | Method | Access |
|-------|----------|--------|--------|
| Auth | `/api/auth/register` | POST | Public |
| Auth | `/api/auth/login` | POST | Public |
| Auth | `/api/auth/verify-email/:email` | POST | Public |
| Auth | `/api/auth/resend-otp/:email` | POST | Public |
| Auth | `/api/auth/user-profile` | GET | Protected |
| Admin | `/api/admin/pending-verifications` | GET | Admin |
| Admin | `/api/admin/approve-verification/:userId` | PATCH | Admin |
| Access | `/api/access/request` | POST | Doctor/Lab |
| Access | `/api/access/respond` | PATCH | Patient |
| Access | `/api/access/my-patients` | GET | Doctor/Lab |
| Vitals | `/api/vitals` | POST/GET | Patient |
| Vitals | `/api/vitals/patient/:patientId` | GET | Doctor (consented) |
| AI | `/api/ai/analyze` | POST | Patient |
| AI | `/api/ai/insights` | GET | Patient |
| AI | `/api/ai/insights/patient/:patientId` | GET | Doctor (consented) |
| Emergency | `/api/emergency` | PUT | Patient |
| Emergency | `/api/emergency/public/:userId` | GET | Public |
| Appointments | `/api/appointments` | POST | Patient |
| Appointments | `/api/appointments/my` | GET | Patient/Doctor |
| Medications | `/api/medications` | POST/GET | Patient |
| Audit | `/api/audit/my-history` | GET | Patient |
| Audit | `/api/audit/all` | GET | Admin |
| Lab | `/api/lab/upload/:patientId` | POST | Lab (consented) |

## License

MIT
