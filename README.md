# 🏥 Unique Hospital — Smart PWA

> Bhopal ke sabse trusted orthopedic hospital ka AI-powered Progressive Web App.
> AI chat, easy appointment booking, email confirmations, aur Google Sheets integration — sab ek jagah.

**Live URL:** [unique-hospital-bice.vercel.app](https://unique-hospital-bice.vercel.app)

---

## ✨ Features

| Feature | Status |
|---------|--------|
| 📅 Easy Appointment Booking (Calendar + Time Picker) | ✅ Working |
| 🤖 AI Health Assistant (Groq LLaMA 3.3) | ✅ Working |
| 📧 Email Confirmation via Resend | ✅ Working |
| 🗂️ Google Sheets Auto-Entry | ✅ Working |
| 🗄️ Supabase Database | ✅ Working |
| 📱 PWA (Installable on Phone) | ✅ Working |
| 🚨 Emergency Detection + Alert | ✅ Working |
| 💬 WhatsApp Notifications | 🔜 Future |
| 📲 SMS via Msg91 | 🔜 Future |

---

## 🗂️ Project Structure

```
unique-hospital/
├── frontend/                    # Next.js 14 PWA
│   ├── src/
│   │   └── app/
│   │       ├── page.tsx         # Main page — booking + AI chat
│   │       ├── layout.tsx       # App shell + PWA meta
│   │       └── globals.css
│   ├── public/
│   │   ├── sw.js                # Service Worker (push notifications)
│   │   ├── manifest.json        # PWA manifest
│   │   └── hero_doctor.png
│   └── package.json
│
├── backend/
│   └── api/
│       ├── index.py             # FastAPI — all routes
│       ├── faqs.json            # AI knowledge base (10 FAQs)
│       └── requirements.txt
│
├── supabase/
│   └── schema.sql               # Database schema — run in Supabase SQL Editor
│
├── scripts/
│   └── daily_followup.py        # GitHub Actions cron — daily feedback WhatsApp
│
├── .github/
│   └── workflows/
│       └── daily-followup.yml   # Runs every night 9 PM IST
│
└── vercel.json                  # Monorepo routing config
```

---

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- Python 3.11+
- Git

### 1. Clone karo

```bash
git clone https://github.com/muahshi/unique-hospital.git
cd unique-hospital
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

### 3. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn api.index:app --reload --port 8000
# Runs on http://localhost:8000
```

### 4. Environment Variables

`backend/.env` file banao (`.env.example` copy karo):

```bash
cp backend/.env.example backend/.env
```

---

## 🔑 Environment Variables

### Vercel mein dalne wale (sab already daal diye hain ✅)

| Variable | Description | Status |
|----------|-------------|--------|
| `GROQ_API_KEY` | Groq AI API key | ✅ Set |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ Set |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | ✅ Set |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (backend) | ✅ Set |
| `GOOGLE_CREDENTIALS` | Service account JSON string | ✅ Set |
| `GOOGLE_SHEET_ID` | Google Sheet ID | ✅ Set |
| `RESEND_API_KEY` | Resend email API key | ✅ Set |
| `ADMIN_EMAIL` | muahshi.mubi@gmail.com | ✅ Set |
| `FROM_EMAIL` | onboarding@resend.dev (temp) | ✅ Set |
| `ALLOWED_ORIGINS` | CORS allowed origins | ✅ Set |

### Future mein add karne wale

| Variable | Description |
|----------|-------------|
| `WHATSAPP_TOKEN` | WhatsApp Cloud API token |
| `WHATSAPP_PHONE_ID` | WhatsApp phone number ID |
| `ADMIN_WA_NUMBER` | Doctor ka WhatsApp number |
| `MSG91_API_KEY` | SMS notifications (Msg91) |

---

## 🗄️ Database (Supabase)

### Setup

1. [supabase.com](https://supabase.com) → Project → SQL Editor
2. `supabase/schema.sql` ka sara content paste karo → Run

### Appointments Table — Columns

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Auto-generated primary key |
| `patient_name` | TEXT | Patient ka naam |
| `phone` | TEXT | WhatsApp number |
| `email` | TEXT | Email address (optional) |
| `department` | TEXT | Orthopedics / Joint Replacement etc. |
| `preferred_date` | TEXT | DD-MM-YYYY format |
| `preferred_time` | TEXT | 9:00 AM — 7:00 PM |
| `symptoms` | TEXT | Brief symptoms (optional) |
| `status` | TEXT | Pending / Confirmed / Emergency / Cancelled |
| `session_id` | TEXT | Booking session tracking |
| `created_at` | TIMESTAMPTZ | Auto timestamp |

---

## 📊 Google Sheets

### Sheet Name: `Unique_hospital`

### Columns (Row 1 — Headers)

```
Unique_ID | Timestamp | Patient_Name | Phone | Email | Department | Appointment_Date | Appointment_Time | Status | Email_Sent | Symptoms | Session_ID
```

### Google Service Account ko Sheet share karna

1. `GOOGLE_CREDENTIALS` env var mein se `client_email` dhundho:
   ```json
   {"client_email": "something@project.iam.gserviceaccount.com"}
   ```
2. Google Sheet → Share → us email ko **Editor** access do

---

## 📧 Email System (Resend)

### Kaise kaam karta hai

```
Patient books appointment
        ↓
Backend /api/book route call hoti hai
        ↓
Supabase mein save hota hai
        ↓
Google Sheet mein entry hoti hai
        ↓
Resend se 2 emails jaati hain:
  1. Admin ko → New booking notification
  2. Patient ko → Branded confirmation email
```

### Abhi ki limitation (Free Plan)

Resend free plan mein patient email sirf tab jaayegi jab domain verify ho.
**Temporary fix:** Admin ko "PATIENT COPY (forward to patient@email)" email aati hai.

### Domain Verify karna (Permanent Fix)

1. [resend.com](https://resend.com) → Domains → Add Domain
2. `uniquehospital.in` add karo
3. DNS records apne domain provider mein daal do (GoDaddy/Hostinger)
4. Verified hone ke baad Vercel mein update karo:
   ```
   FROM_EMAIL = appointments@uniquehospital.in
   ```

---

## 🤖 AI System

### Model
**Groq LLaMA 3.3 70B** — Ultra fast inference

### 2 Modes

**1. AI Health Assistant (`/api/chat`)**
- Patient symptoms discuss kar sakta hai
- Hospital info, department suggestions
- Emergency detect karta hai (chest pain, bleeding, accident etc.)
- Doctor ko alert bhejta hai

**2. WhatsApp Triage (`/api/webhook`)**
- Incoming WhatsApp messages classify karta hai
- BOOKING / QUERY / EMERGENCY / UNKNOWN
- Future use ke liye ready

### Knowledge Base (`faqs.json`)

10 pre-loaded FAQs jo AI context mein load hoti hain:
- OPD timing
- Emergency availability
- Department list
- Fees, location, insurance
- Knee replacement experience

Aur FAQs add karne ke liye `backend/api/faqs.json` edit karo:
```json
{"q": "Aapka sawaal?", "a": "Jawab yahan..."}
```

---

## 📱 PWA Features

- **Installable** — Android/iOS home screen pe add kar sakte hain
- **Offline Support** — Basic caching via Service Worker
- **Push Notifications** — Service worker ready (`public/sw.js`)
- **QR Code** — Hospital counter pe laga sakte hain, scan karte hi booking open

---

## 🔌 API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/health` | System status check |
| POST | `/api/chat` | AI Health Assistant chat |
| POST | `/api/book` | Appointment book karo |
| GET | `/api/appointments` | Sab appointments dekho (admin) |
| POST | `/api/webhook` | WhatsApp message triage |
| POST | `/api/send-reminder` | Manual reminder bhejo |

### `/api/book` — Request Body

```json
{
  "patient_name": "Mubashir",
  "phone": "9575877758",
  "email": "patient@email.com",
  "department": "Joint Replacement",
  "preferred_date": "07-05-2026",
  "preferred_time": "3:00 PM",
  "symptoms": "",
  "session_id": "easy_1234567890"
}
```

### `/api/chat` — Request Body

```json
{
  "session_id": "chat_1234567890",
  "message": "Knee mein dard hai kya karna chahiye?",
  "history": [
    {"role": "user", "content": "previous message"},
    {"role": "assistant", "content": "previous reply"}
  ]
}
```

---

## ⏰ Automated Cron Jobs

### Daily Follow-up (GitHub Actions)

**File:** `.github/workflows/daily-followup.yml`
**Schedule:** Har roz 9 PM IST (3:30 PM UTC)

**Kya karta hai:**
1. Aaj ke sab appointments Supabase se fetch karta hai
2. Jin patients ko feedback nahi bheja, unhe WhatsApp feedback link bhejta hai
3. `feedback_sent = true` mark kar deta hai

**GitHub Secrets add karne hain:**
```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
WHATSAPP_TOKEN
WHATSAPP_PHONE_ID
FEEDBACK_FORM_URL
```

---

## 🚨 Emergency System

Ye keywords detect hone par doctor ko turant alert jaata hai:
```
chest pain | bleeding | accident | heart attack
stroke | unconscious | severe pain | breathless
```

**Flow:**
1. Patient AI chat mein ya booking mein emergency keyword likhta hai
2. AI reply mein `{"emergency": true}` aata hai
3. Doctor ke WhatsApp pe instant alert jaata hai (jab `ADMIN_WA_NUMBER` set ho)
4. Patient ko emergency helpline dikhti hai

---

## 🔮 Future Roadmap

- [ ] **WhatsApp Business API** — Appointment confirmations + 2hr pre-reminders
- [ ] **Msg91 SMS** — SMS fallback for patients without WhatsApp
- [ ] **Doctor Dashboard** — Admin panel to manage appointments
- [ ] **Google Calendar Sync** — Doctor ke calendar mein auto-add
- [ ] **Patient History** — Returning patient recognition
- [ ] **Multi-language** — Hindi + English toggle
- [ ] **Payment Gateway** — Online OPD fee payment

---

## 👨‍💻 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, PWA |
| Backend | FastAPI (Python), Vercel Serverless |
| AI | Groq Cloud — LLaMA 3.3 70B |
| Database | Supabase (PostgreSQL) |
| Spreadsheet | Google Sheets API |
| Email | Resend |
| Hosting | Vercel |
| CI/CD | GitHub Actions |

---

## 📞 Hospital Info

| | |
|-|-|
| **Name** | Unique Hospital |
| **Specialty** | Orthopedics & Multi-Specialty |
| **Address** | 77, Motia Talab Rd, Kohefiza, Bhopal — 462001 |
| **OPD Hours** | Monday – Saturday, 9 AM to 8 PM |
| **Emergency** | 24×7 |
| **Phone** | +91-9575877759 |

---

*Built with ❤️ for Unique Hospital, Bhopal*

