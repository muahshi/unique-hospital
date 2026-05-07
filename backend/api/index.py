from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
import os, json, logging, httpx
from datetime import datetime
from typing import Optional

try:
    from supabase import create_client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False

try:
    import gspread
    from oauth2client.service_account import ServiceAccountCredentials
    GSPREAD_AVAILABLE = True
except ImportError:
    GSPREAD_AVAILABLE = False

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GROQ_API_KEY         = os.environ.get("GROQ_API_KEY", "")
SUPABASE_URL         = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
GOOGLE_CREDENTIALS   = os.environ.get("GOOGLE_CREDENTIALS", "")
GOOGLE_SHEET_ID      = os.environ.get("GOOGLE_SHEET_ID", "")
RESEND_API_KEY       = os.environ.get("RESEND_API_KEY", "")
FROM_EMAIL           = os.environ.get("FROM_EMAIL", "appointments@uniquehospital.in")
ADMIN_EMAIL          = os.environ.get("ADMIN_EMAIL", "admin@uniquehospital.in")
ALLOWED_ORIGINS      = os.environ.get("ALLOWED_ORIGINS", "https://uniquehospital.in,http://localhost:3000").split(",")

if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY not set")

# ── Supabase ──────────────────────────────────────────────────────────────────
supabase = None
if SUPABASE_AVAILABLE and SUPABASE_URL and SUPABASE_SERVICE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        logger.info("Supabase connected")
    except Exception as e:
        logger.warning(f"Supabase init failed: {e}")

# ── Google Sheets ─────────────────────────────────────────────────────────────
gsheet_ws = None
if GSPREAD_AVAILABLE and GOOGLE_CREDENTIALS and GOOGLE_SHEET_ID:
    try:
        creds_dict = json.loads(GOOGLE_CREDENTIALS)
        scope = ["https://spreadsheets.google.com/feeds","https://www.googleapis.com/auth/drive"]
        creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_dict, scope)
        gc = gspread.authorize(creds)
        gsheet_ws = gc.open_by_key(GOOGLE_SHEET_ID).sheet1
        logger.info("Google Sheets connected")
    except Exception as e:
        logger.warning(f"Google Sheets init failed: {e}")

# ── FAQ Knowledge Base ────────────────────────────────────────────────────────
FAQ_CONTEXT = ""
FAQ_FILE = os.path.join(os.path.dirname(__file__), "faqs.json")
if os.path.exists(FAQ_FILE):
    try:
        with open(FAQ_FILE, "r", encoding="utf-8") as f:
            faqs = json.load(f)
        FAQ_CONTEXT = "\n".join(f"Q: {i['q']}\nA: {i['a']}" for i in faqs)
    except: pass

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="Unique Hospital API", version="2.1.0")
app.add_middleware(CORSMiddleware, allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

groq_client = Groq(api_key=GROQ_API_KEY)

BOOKING_SYSTEM_PROMPT = f"""You are an AI medical receptionist for Unique Hospital, Bhopal (Orthopedics & Multi-Specialty).
Answer patient questions about symptoms, departments, treatments, and hospital info.
If symptoms suggest emergency (chest pain, bleeding, accident, stroke) respond: {{"emergency":true,"message":"..."}}
FAQ Knowledge Base:
{FAQ_CONTEXT}
Rules: Reply in patient's language (Hindi/English/Hinglish). Be warm and concise."""

TRIAGE_SYSTEM_PROMPT = """Medical assistant for Unique Hospital. Respond ONLY with JSON:
{"intent":"BOOKING|QUERY|EMERGENCY|UNKNOWN","confidence":"HIGH|MEDIUM|LOW","response_text":"reply max 160 words","next_action":"ROUTE_TO_RECEPTIONIST|SEND_DOCTOR_LIST|CALL_EMERGENCY|ASK_CLARIFICATION","language":"en|hi|hinglish"}"""

# ── Models ────────────────────────────────────────────────────────────────────
class ChatMessage(BaseModel):
    session_id: str
    message: str
    history: list = []

class AppointmentPayload(BaseModel):
    patient_name: str
    phone: str
    email: Optional[str] = ""
    department: str
    preferred_date: str
    preferred_time: str
    symptoms: Optional[str] = ""
    session_id: Optional[str] = ""

class TriageResult(BaseModel):
    intent: str; confidence: str; response_text: str; next_action: str; language: str

# ── Google Sheet helpers ──────────────────────────────────────────────────────
GSHEET_HEADERS = [
    "Unique_ID","Timestamp","Patient_Name","Phone","Email",
    "Department","Appointment_Date","Appointment_Time",
    "Status","Email_Sent","Symptoms","Session_ID"
]

def ensure_gsheet_headers():
    """Add header row if sheet is empty."""
    if not gsheet_ws: return
    try:
        if not gsheet_ws.row_values(1):
            gsheet_ws.append_row(GSHEET_HEADERS)
    except: pass

def save_to_gsheet(data: dict, email_sent: bool = False):
    if not gsheet_ws: return
    try:
        ensure_gsheet_headers()
        appt_id = (data.get("id") or "")[:8].upper()
        row = [
            appt_id,
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            data.get("patient_name", ""),
            data.get("phone", ""),
            data.get("email", ""),
            data.get("department", ""),
            data.get("preferred_date", ""),
            data.get("preferred_time", ""),
            data.get("status", "Pending"),
            "Yes" if email_sent else "No",
            data.get("symptoms", ""),
            data.get("session_id", ""),
        ]
        gsheet_ws.append_row(row)
        logger.info("Google Sheet updated")
    except Exception as e:
        logger.error(f"GSheet error: {e}")

# ── Supabase helpers ──────────────────────────────────────────────────────────
async def save_to_supabase(data: dict) -> Optional[str]:
    if not supabase: return None
    try:
        result = supabase.table("appointments").insert(data).execute()
        return result.data[0].get("id") if result.data else None
    except Exception as e:
        logger.error(f"Supabase error: {e}"); return None

# ── Resend Email ──────────────────────────────────────────────────────────────
def _patient_email_html(name, dept, date, time, appt_id):
    year = datetime.now().year
    rows = "".join(
        f'<tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:13px;">{k}</td>'
        f'<td style="padding:10px 0;border-bottom:1px solid #f1f5f9;text-align:right;color:#0A5C96;font-weight:700;font-size:13px;">{v}</td></tr>'
        for k,v in [("🏥 Department",dept),("📅 Date",date),("⏰ Time",time),("👤 Patient",name),("🔖 ID",appt_id[:8].upper() if appt_id else "N/A")]
    )
    return f"""<!DOCTYPE html><html lang="hi"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
  <tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:20px;overflow:hidden;max-width:560px;width:100%;">
    <tr><td style="background:linear-gradient(135deg,#0A5C96,#1a7bc4);padding:32px 40px;text-align:center;">
      <p style="margin:0 0 8px;display:inline-block;background:rgba(255,255,255,0.15);border-radius:12px;padding:8px 16px;color:#fff;font-size:20px;font-weight:900;">UH</p>
      <h1 style="color:#fff;margin:8px 0 0;font-size:24px;font-weight:800;">Unique Hospital</h1>
      <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px;">Bhopal's Trusted Orthopedic Centre</p>
    </td></tr>
    <tr><td style="background:#f0fdf4;padding:20px 40px;text-align:center;border-bottom:2px solid #bbf7d0;">
      <div style="font-size:40px;margin-bottom:8px;">✅</div>
      <h2 style="color:#16a34a;margin:0;font-size:20px;font-weight:800;">Appointment Confirmed!</h2>
      <p style="color:#64748b;margin:8px 0 0;font-size:13px;">Namaste {name} ji! Aapki appointment book ho gayi hai.</p>
    </td></tr>
    <tr><td style="padding:28px 40px;">
      <h3 style="color:#1a2e44;font-size:15px;font-weight:700;margin:0 0 16px;border-bottom:2px solid #e2e8f0;padding-bottom:10px;">📋 Appointment Details</h3>
      <table width="100%" cellpadding="0" cellspacing="0">{rows}</table>
    </td></tr>
    <tr><td style="padding:0 40px 24px;">
      <div style="background:#eff6ff;border:1px solid #bae6fd;border-radius:14px;padding:18px;">
        <p style="margin:0 0 8px;color:#0369a1;font-weight:700;font-size:13px;">📌 Yaad Rakhein:</p>
        <ul style="margin:0;padding-left:18px;color:#334155;font-size:12px;line-height:1.9;">
          <li>Appointment se <strong>15 minute pehle</strong> pahunchen</li>
          <li>Previous <strong>X-rays / Reports</strong> saath laayein</li>
          <li>OPD Hours: <strong>Mon–Sat, 9AM–8PM</strong></li>
          <li>Emergency: <strong>24×7 Available</strong></li>
        </ul>
      </div>
    </td></tr>
    <tr><td style="padding:0 40px 28px;">
      <div style="background:#f8fafc;border-radius:14px;padding:18px;text-align:center;">
        <p style="margin:0 0 4px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">📍 Hospital Address</p>
        <p style="margin:4px 0 0;color:#1a2e44;font-weight:600;font-size:14px;">77, Motia Talab Rd, Kohefiza, Bhopal — 462001</p>
        <a href="https://maps.google.com/?q=Unique+Hospital+Bhopal" style="display:inline-block;margin-top:12px;background:#0A5C96;color:#fff;padding:8px 18px;border-radius:100px;text-decoration:none;font-size:12px;font-weight:600;">🗺️ Google Maps par Dekhein</a>
      </div>
    </td></tr>
    <tr><td style="background:#0f172a;padding:20px 40px;text-align:center;">
      <p style="color:#94a3b8;font-size:12px;margin:0 0 4px;">Unique Hospital | 77 Motia Talab Rd, Kohefiza, Bhopal</p>
      <p style="color:#475569;font-size:11px;margin:0;">© {year} Unique Hospital. All rights reserved.</p>
      <p style="color:#475569;font-size:11px;margin:6px 0 0;">Koi sawaal? 📞 +91-9575877759</p>
    </td></tr>
  </table>
  </td></tr>
</table>
</body></html>"""

def _admin_email_html(name, phone, email, dept, date, time, appt_id):
    rows = "".join(
        f'<tr><td style="padding:8px 0;color:#64748b;font-size:13px;border-bottom:1px solid #f1f5f9;">{k}</td>'
        f'<td style="padding:8px 0;font-weight:700;color:#1a2e44;font-size:13px;text-align:right;border-bottom:1px solid #f1f5f9;">{v}</td></tr>'
        for k,v in [("Patient",name),("Phone",f"+91 {phone}"),("Email",email or "—"),("Department",dept),("Date",date),("Time",time),("Booking ID",appt_id[:8].upper() if appt_id else "N/A")]
    )
    ts = datetime.now().strftime('%d %b %Y, %I:%M %p')
    return f"""<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;background:#f1f5f9;padding:32px;">
<div style="max-width:500px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#0A5C96,#1a7bc4);padding:20px 28px;">
    <h2 style="color:#fff;margin:0;font-size:18px;">🔔 New Appointment Booked</h2>
    <p style="color:rgba(255,255,255,0.75);margin:6px 0 0;font-size:12px;">{ts}</p>
  </div>
  <div style="padding:24px 28px;">
    <table width="100%" cellpadding="0" cellspacing="0">{rows}</table>
  </div>
  <div style="background:#f8fafc;padding:14px 28px;text-align:center;font-size:11px;color:#94a3b8;">
    Unique Hospital Admin Notification • Do not reply
  </div>
</div>
</body></html>"""

async def send_emails(data: dict, appt_id: str) -> bool:
    if not RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not set — skipping email")
        return False
    name  = data.get("patient_name","")
    phone = data.get("phone","")
    email = data.get("email","")
    dept  = data.get("department","")
    date  = data.get("preferred_date","")
    time  = data.get("preferred_time","")
    headers = {"Authorization":f"Bearer {RESEND_API_KEY}","Content-Type":"application/json"}
    sent = False
    async with httpx.AsyncClient(timeout=15) as client:
        # Patient confirmation email
        # Note: On Resend free plan, emails only deliver to verified addresses.
        # Once domain is verified, patient email will deliver directly.
        # Until then, admin receives patient copy with reply-to set to patient.
        if email and "@" in email:
            try:
                # Try sending directly to patient
                r = await client.post("https://api.resend.com/emails", headers=headers, json={
                    "from": f"Unique Hospital <{FROM_EMAIL}>",
                    "to": [email],
                    "reply_to": [ADMIN_EMAIL],
                    "subject": f"✅ Appointment Confirmed — {dept} on {date}",
                    "html": _patient_email_html(name, dept, date, time, appt_id),
                })
                if r.status_code == 200:
                    sent = True
                    logger.info(f"Patient email delivered to {email}")
                else:
                    # Fallback: send patient copy to admin with patient email in subject
                    logger.warning(f"Patient email failed ({r.status_code}), sending copy to admin")
                    await client.post("https://api.resend.com/emails", headers=headers, json={
                        "from": f"Booking System <{FROM_EMAIL}>",
                        "to": [ADMIN_EMAIL],
                        "subject": f"📋 PATIENT COPY (forward to {email}) — {name} Appointment on {date}",
                        "html": _patient_email_html(name, dept, date, time, appt_id),
                    })
            except Exception as e:
                logger.error(f"Patient email error: {e}")

        # Admin notification email
        try:
            # Build recipient list: always admin, plus patient if domain verified
            to_list = [ADMIN_EMAIL]
            r = await client.post("https://api.resend.com/emails", headers=headers, json={
                "from": f"Booking System <{FROM_EMAIL}>",
                "to": to_list,
                "reply_to": [email] if email and "@" in email else [],
                "subject": f"🔔 New Booking: {name} — {dept} on {date}",
                "html": _admin_email_html(name, phone, email, dept, date, time, appt_id),
            })
            logger.info(f"Admin email: {r.status_code}")
            if not email: sent = r.status_code == 200
        except Exception as e:
            logger.error(f"Admin email error: {e}")
    return sent

# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/api/health")
async def health():
    return {"status":"ok","version":"2.1","supabase":supabase is not None,"sheets":gsheet_ws is not None,"resend":bool(RESEND_API_KEY)}

@app.post("/api/chat")
async def ai_chat(payload: ChatMessage):
    messages = [{"role":"system","content":BOOKING_SYSTEM_PROMPT}]
    messages += payload.history
    messages.append({"role":"user","content":payload.message})
    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile", messages=messages, temperature=0.4, max_tokens=600)
        ai_reply = completion.choices[0].message.content.strip()
    except Exception as e:
        raise HTTPException(status_code=503, detail="AI unavailable")
    emergency = '"emergency": true' in ai_reply or '"emergency":true' in ai_reply
    return {"reply": ai_reply.replace("<booking_data>","").split("</booking_data>")[0] if "<booking_data>" in ai_reply else ai_reply,
            "emergency": emergency}

@app.post("/api/book")
async def book_appointment(payload: AppointmentPayload):
    EMERGENCY_KW = ["chest pain","bleeding","accident","heart attack","stroke","unconscious","severe pain"]
    is_emergency = any(kw in (payload.symptoms or "").lower() for kw in EMERGENCY_KW)
    data = {
        "patient_name": payload.patient_name,
        "phone": payload.phone,
        "email": payload.email or "",
        "department": payload.department,
        "preferred_date": payload.preferred_date,
        "preferred_time": payload.preferred_time,
        "symptoms": payload.symptoms or "",
        "status": "Emergency" if is_emergency else "Pending",
        "created_at": datetime.now().isoformat(),
        "session_id": payload.session_id or "",
    }
    # Save to Supabase
    appt_id = await save_to_supabase(data) or f"UH{datetime.now().strftime('%d%H%M%S')}"
    data["id"] = appt_id
    # Send emails
    email_sent = await send_emails(data, appt_id)
    # Save to Google Sheet
    save_to_gsheet(data, email_sent)
    return {
        "success": True,
        "appointment_id": appt_id,
        "emergency": is_emergency,
        "email_sent": email_sent,
        "message": "Appointment booked! Confirmation email bhej di gayi.",
    }

@app.post("/api/webhook")
async def whatsapp_webhook(request: Request):
    body = await request.json()
    try:
        msg  = body["entry"][0]["changes"][0]["value"]["messages"][0]
        name = body["entry"][0]["changes"][0]["value"]["contacts"][0]["profile"]["name"]
        text = msg["text"]["body"]
    except: raise HTTPException(status_code=400, detail="Invalid payload")
    try:
        comp = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role":"system","content":TRIAGE_SYSTEM_PROMPT},
                      {"role":"user","content":f"Patient: {name}\nMessage: {text}"}],
            temperature=0.3, max_tokens=400)
        raw = comp.choices[0].message.content.strip()
        if raw.startswith("```"): raw = raw.split("```")[1]; raw = raw[4:] if raw.startswith("json") else raw
        return json.loads(raw)
    except: raise HTTPException(status_code=502, detail="AI parse failed")

@app.get("/api/appointments")
async def get_appointments(status: Optional[str]=None, limit: int=50):
    if not supabase: raise HTTPException(status_code=503, detail="Supabase not configured")
    q = supabase.table("appointments").select("*").order("created_at",desc=True).limit(limit)
    if status: q = q.eq("status", status)
    r = q.execute()
    return {"appointments":r.data,"count":len(r.data)}


# ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────

ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "hospital@2024")

def verify_admin(request: Request) -> bool:
    token = request.headers.get("X-Admin-Token", "")
    return token == ADMIN_PASSWORD

class StatusUpdate(BaseModel):
    appointment_id: str
    status: str  # Pending / Confirmed / Attended / Cancelled / Emergency

class AdminLogin(BaseModel):
    password: str

@app.post("/api/admin/login")
async def admin_login(payload: AdminLogin):
    if payload.password == ADMIN_PASSWORD:
        return {"success": True, "token": ADMIN_PASSWORD}
    raise HTTPException(status_code=401, detail="Wrong password")

@app.get("/api/admin/appointments")
async def admin_get_appointments(
    request: Request,
    status: Optional[str] = None,
    date: Optional[str] = None,
    dept: Optional[str] = None,
    limit: int = 100
):
    if not verify_admin(request):
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Try Supabase first
    if supabase:
        try:
            q = supabase.table("appointments").select("*").order("created_at", desc=True).limit(limit)
            if status: q = q.eq("status", status)
            if date:   q = q.eq("preferred_date", date)
            if dept:   q = q.eq("department", dept)
            r = q.execute()
            appts = r.data or []
        except Exception as e:
            logger.error(f"Supabase fetch error: {e}")
            appts = []
    else:
        appts = []

    # Fallback: Google Sheets
    if not appts and gsheet_ws:
        try:
            rows = gsheet_ws.get_all_records()
            appts = []
            for row in rows:
                if not row.get("Patient_Name"): continue
                a = {
                    "id": row.get("Unique_ID",""),
                    "patient_name": row.get("Patient_Name",""),
                    "phone": row.get("Phone",""),
                    "email": row.get("Email",""),
                    "department": row.get("Department",""),
                    "preferred_date": row.get("Appointment_Date",""),
                    "preferred_time": row.get("Appointment_Time",""),
                    "status": row.get("Status","Pending"),
                    "symptoms": row.get("Symptoms",""),
                    "created_at": row.get("Timestamp",""),
                }
                if status and a["status"] != status: continue
                if date and a["preferred_date"] != date: continue
                if dept and a["department"] != dept: continue
                appts.append(a)
            appts.reverse()
        except Exception as e:
            logger.error(f"GSheet fetch error: {e}")

    # Stats
    today = datetime.now().strftime("%d-%m-%Y")
    stats = {
        "total": len(appts),
        "today": sum(1 for a in appts if a.get("preferred_date") == today),
        "pending": sum(1 for a in appts if a.get("status") == "Pending"),
        "confirmed": sum(1 for a in appts if a.get("status") == "Confirmed"),
        "attended": sum(1 for a in appts if a.get("status") == "Attended"),
        "emergency": sum(1 for a in appts if a.get("status") == "Emergency"),
        "cancelled": sum(1 for a in appts if a.get("status") == "Cancelled"),
    }
    return {"appointments": appts, "stats": stats}

@app.get("/api/admin/appointment/{appt_id}")
async def get_single_appointment(appt_id: str, request: Request):
    """QR scan pe yeh route call hoga — single appointment details.
    Supports: full UUID, first-8-chars short ID, or partial match."""
    if not verify_admin(request):
        raise HTTPException(status_code=401, detail="Unauthorized")

    search_id = appt_id.strip().lower()
    short_id  = search_id[:8]

    # Supabase — try exact match first, then LIKE
    if supabase:
        try:
            # Exact UUID match
            r = supabase.table("appointments").select("*").eq("id", appt_id).execute()
            if r.data: return {"appointment": r.data[0]}

            # Partial match — fetch recent and filter in Python
            r2 = supabase.table("appointments").select("*").order("created_at", desc=True).limit(500).execute()
            for row in (r2.data or []):
                row_id = (row.get("id") or "").lower()
                if row_id.startswith(short_id) or search_id.startswith(row_id[:8]):
                    return {"appointment": row}
        except Exception as e:
            logger.error(f"Supabase single lookup error: {e}")

    # Google Sheet — flexible matching
    if gsheet_ws:
        try:
            rows = gsheet_ws.get_all_records()
            for row in rows:
                uid = (row.get("Unique_ID") or "").strip().lower()
                if uid == search_id or uid.startswith(short_id) or search_id.startswith(uid[:8]):
                    return {"appointment": {
                        "id":             row.get("Unique_ID",""),
                        "patient_name":   row.get("Patient_Name",""),
                        "phone":          row.get("Phone",""),
                        "email":          row.get("Email",""),
                        "department":     row.get("Department",""),
                        "preferred_date": row.get("Appointment_Date",""),
                        "preferred_time": row.get("Appointment_Time",""),
                        "status":         row.get("Status","Pending"),
                        "symptoms":       row.get("Symptoms",""),
                        "created_at":     row.get("Timestamp",""),
                    }}
        except Exception as e:
            logger.error(f"GSheet single lookup error: {e}")

    raise HTTPException(status_code=404, detail=f"Appointment not found: {appt_id}")

@app.post("/api/admin/status")
async def update_status(payload: StatusUpdate, request: Request):
    """Status update karo — Supabase + Google Sheet dono mein."""
    if not verify_admin(request):
        raise HTTPException(status_code=401, detail="Unauthorized")

    VALID = ["Pending","Confirmed","Attended","Cancelled","Emergency"]
    if payload.status not in VALID:
        raise HTTPException(status_code=400, detail=f"Status must be one of: {VALID}")

    updated = False

    # Supabase update
    if supabase:
        try:
            supabase.table("appointments")\
                .update({"status": payload.status})\
                .eq("id", payload.appointment_id)\
                .execute()
            updated = True
        except Exception as e:
            logger.error(f"Supabase status update error: {e}")

    # Google Sheet update
    if gsheet_ws:
        try:
            rows = gsheet_ws.get_all_records()
            for i, row in enumerate(rows):
                uid = row.get("Unique_ID","")
                # Match full ID or short 8-char prefix
                if uid == payload.appointment_id or uid.upper()[:8] == payload.appointment_id.upper()[:8]:
                    # Row index is i+2 (1-indexed + header row)
                    # Status is column 9 (I)
                    gsheet_ws.update_cell(i + 2, 9, payload.status)
                    updated = True
                    break
        except Exception as e:
            logger.error(f"GSheet status update error: {e}")

    if not updated:
        raise HTTPException(status_code=404, detail="Appointment not found")

    return {"success": True, "appointment_id": payload.appointment_id, "new_status": payload.status}

@app.get("/api/admin/stats")
async def admin_stats(request: Request):
    """Dashboard ke liye summary stats."""
    if not verify_admin(request):
        raise HTTPException(status_code=401, detail="Unauthorized")

    today = datetime.now().strftime("%d-%m-%Y")
    dept_counts: dict = {}
    hour_counts: dict = {}

    if supabase:
        try:
            r = supabase.table("appointments").select("*").execute()
            appts = r.data or []
            today_appts = [a for a in appts if a.get("preferred_date") == today]

            for a in appts:
                d = a.get("department","Other")
                dept_counts[d] = dept_counts.get(d, 0) + 1

            for a in today_appts:
                t = a.get("preferred_time","")
                hour_counts[t] = hour_counts.get(t, 0) + 1

            return {
                "today": len(today_appts),
                "total": len(appts),
                "by_status": {
                    s: sum(1 for a in appts if a.get("status") == s)
                    for s in ["Pending","Confirmed","Attended","Cancelled","Emergency"]
                },
                "by_department": dept_counts,
                "today_by_time": hour_counts,
            }
        except Exception as e:
            logger.error(f"Stats error: {e}")

    return {"today": 0, "total": 0, "by_status": {}, "by_department": {}, "today_by_time": {}}
