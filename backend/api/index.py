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
