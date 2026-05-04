from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
import os
import json
import logging
import httpx
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

GROQ_API_KEY        = os.environ.get("GROQ_API_KEY")
SUPABASE_URL        = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_KEY= os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
GOOGLE_CREDENTIALS  = os.environ.get("GOOGLE_CREDENTIALS")
GOOGLE_SHEET_ID     = os.environ.get("GOOGLE_SHEET_ID", "")
WHATSAPP_TOKEN      = os.environ.get("WHATSAPP_TOKEN", "")
WHATSAPP_PHONE_ID   = os.environ.get("WHATSAPP_PHONE_ID", "")
ADMIN_WA_NUMBER     = os.environ.get("ADMIN_WA_NUMBER", "")
ALLOWED_ORIGINS     = os.environ.get(
    "ALLOWED_ORIGINS", "https://uniquehospital.in,http://localhost:3000"
).split(",")

if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY environment variable is not set.")

supabase = None
if SUPABASE_AVAILABLE and SUPABASE_URL and SUPABASE_SERVICE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        logger.info("Supabase connected")
    except Exception as e:
        logger.warning(f"Supabase init failed: {e}")

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

app = FastAPI(title="Unique Hospital Smart Clinic API", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

groq_client = Groq(api_key=GROQ_API_KEY)

FAQ_CONTEXT = ""
FAQ_FILE = os.path.join(os.path.dirname(__file__), "faqs.json")
if os.path.exists(FAQ_FILE):
    try:
        with open(FAQ_FILE, "r", encoding="utf-8") as f:
            faqs = json.load(f)
        FAQ_CONTEXT = "\n".join(f"Q: {i['q']}\nA: {i['a']}" for i in faqs)
        logger.info(f"Loaded {len(faqs)} FAQs")
    except Exception as e:
        logger.warning(f"FAQ load failed: {e}")

BOOKING_SYSTEM_PROMPT = f"""You are an AI medical receptionist for Unique Hospital, Bhopal (Orthopedics & Multi-Specialty).

GOAL: Collect appointment details step-by-step:
1. Patient name
2. Phone number (10 digits)
3. Department (Orthopedics / Joint Replacement / Spine Surgery / Trauma / General Medicine)
4. Preferred date (DD-MM-YYYY, Mon-Sat only)
5. Preferred time (9AM-8PM)
6. Brief symptoms (optional)

EMERGENCY: If symptoms include chest pain, bleeding, accident, heart attack, stroke, unconscious, severe pain — immediately respond:
{{"emergency": true, "message": "Please call 112 or rush to our 24/7 Emergency: 77 Motia Talab Rd, Kohefiza, Bhopal. Our trauma team is ready."}}

When ALL details collected, include this EXACT block in your reply:
<booking_data>
{{"patient_name":"...","phone":"...","department":"...","preferred_date":"...","preferred_time":"...","symptoms":"..."}}
</booking_data>

FAQ Knowledge Base:
{FAQ_CONTEXT}

Rules:
- Respond in patient's language (Hindi/English/Hinglish)
- Be warm, concise, professional
- OPD Hours: Mon-Sat 9AM-8PM | Emergency: 24/7
"""

TRIAGE_SYSTEM_PROMPT = """You are a medical assistant for Unique Hospital, Bhopal.
Analyze patient message. Respond ONLY with valid JSON (no markdown, no preamble):
{"intent":"BOOKING|QUERY|EMERGENCY|UNKNOWN","confidence":"HIGH|MEDIUM|LOW","response_text":"reply in patient language max 160 words","next_action":"ROUTE_TO_RECEPTIONIST|SEND_DOCTOR_LIST|CALL_EMERGENCY|ASK_CLARIFICATION","language":"en|hi|hinglish"}
Emergency keywords: chest pain, bleeding, accident, heart attack, stroke, unconscious, severe pain."""


class ChatMessage(BaseModel):
    session_id: str
    message: str
    history: list = []

class AppointmentPayload(BaseModel):
    patient_name: str
    phone: str
    department: str
    preferred_date: str
    preferred_time: str
    symptoms: Optional[str] = ""
    session_id: Optional[str] = ""

class WhatsAppMessage(BaseModel):
    from_number: str
    patient_name: Optional[str] = "Patient"
    message: str
    timestamp: Optional[str] = None

class TriageResult(BaseModel):
    intent: str
    confidence: str
    response_text: str
    next_action: str
    language: str


async def save_to_supabase(data: dict) -> Optional[str]:
    if not supabase:
        return None
    try:
        result = supabase.table("appointments").insert(data).execute()
        return result.data[0]["id"] if result.data else None
    except Exception as e:
        logger.error(f"Supabase save error: {e}")
        return None

def save_to_gsheet(data: dict):
    if not gsheet_ws:
        return
    try:
        gsheet_ws.append_row([
            data.get("patient_name",""), data.get("phone",""),
            data.get("department",""), data.get("preferred_date",""),
            data.get("preferred_time",""), data.get("symptoms",""),
            data.get("status","PENDING"),
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        ])
    except Exception as e:
        logger.error(f"GSheet error: {e}")

async def send_whatsapp_notification(to_number: str, message: str):
    if not WHATSAPP_TOKEN or not WHATSAPP_PHONE_ID or not to_number:
        return
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                f"https://graph.facebook.com/v18.0/{WHATSAPP_PHONE_ID}/messages",
                json={"messaging_product":"whatsapp","to":to_number,"type":"text","text":{"body":message}},
                headers={"Authorization":f"Bearer {WHATSAPP_TOKEN}","Content-Type":"application/json"},
            )
            resp.raise_for_status()
            logger.info(f"WhatsApp sent to {to_number}")
    except Exception as e:
        logger.error(f"WhatsApp error: {e}")

async def send_emergency_alert(name: str, phone: str, symptoms: str):
    if not ADMIN_WA_NUMBER:
        return
    await send_whatsapp_notification(ADMIN_WA_NUMBER,
        f"EMERGENCY ALERT — Unique Hospital\n\nPatient: {name}\nPhone: {phone}\nReported: {symptoms}\nTime: {datetime.now().strftime('%d %b %Y, %I:%M %p')}\n\nPlease respond immediately.")

async def send_confirmation_whatsapp(phone, name, dept, appt_date, appt_time):
    await send_whatsapp_notification(phone,
        f"Appointment Confirmed — Unique Hospital\n\nNamaste {name}!\n\nDepartment: {dept}\nDate: {appt_date}\nTime: {appt_time}\n\n77, Motia Talab Rd, Kohefiza, Bhopal\nEmergency: 24/7\n\nAapko 2 ghante pehle reminder milega. Dhanyawad!")


@app.get("/api/health")
async def health_check():
    return {"status":"ok","service":"Unique Hospital API v2","supabase":supabase is not None,"google_sheets":gsheet_ws is not None}


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
        logger.error(f"Groq error: {e}")
        raise HTTPException(status_code=503, detail="AI service unavailable")

    emergency_triggered = False
    if '"emergency": true' in ai_reply or '"emergency":true' in ai_reply:
        emergency_triggered = True
        await send_emergency_alert("Unknown", "Unknown", payload.message)

    booking_saved = False
    appointment_id = None
    if "<booking_data>" in ai_reply and "</booking_data>" in ai_reply:
        try:
            bd_raw = ai_reply.split("<booking_data>")[1].split("</booking_data>")[0].strip()
            bd = json.loads(bd_raw)
            bd.update({"status":"PENDING","created_at":datetime.now().isoformat(),"session_id":payload.session_id})
            appointment_id = await save_to_supabase(bd)
            save_to_gsheet(bd)
            await send_confirmation_whatsapp(bd.get("phone",""),bd.get("patient_name",""),
                bd.get("department",""),bd.get("preferred_date",""),bd.get("preferred_time",""))
            booking_saved = True
        except Exception as e:
            logger.error(f"Booking save error: {e}")

    return {"reply":ai_reply,"booking_saved":booking_saved,"appointment_id":appointment_id,"emergency":emergency_triggered}


@app.post("/api/book")
async def book_appointment(payload: AppointmentPayload):
    EMERGENCY_KW = ["chest pain","bleeding","accident","heart attack","stroke","unconscious","severe pain","breathless"]
    is_emergency = any(kw in (payload.symptoms or "").lower() for kw in EMERGENCY_KW)
    data = {"patient_name":payload.patient_name,"phone":payload.phone,"department":payload.department,
            "preferred_date":payload.preferred_date,"preferred_time":payload.preferred_time,
            "symptoms":payload.symptoms,"status":"EMERGENCY" if is_emergency else "PENDING",
            "created_at":datetime.now().isoformat(),"session_id":payload.session_id}
    appointment_id = await save_to_supabase(data)
    save_to_gsheet(data)
    if is_emergency:
        await send_emergency_alert(payload.patient_name, payload.phone, payload.symptoms)
    await send_confirmation_whatsapp(payload.phone,payload.patient_name,payload.department,payload.preferred_date,payload.preferred_time)
    return {"success":True,"appointment_id":appointment_id,"emergency":is_emergency,"message":"Appointment booked! Confirmation sent."}


@app.post("/api/webhook", response_model=TriageResult)
async def whatsapp_webhook(payload: WhatsAppMessage):
    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role":"system","content":TRIAGE_SYSTEM_PROMPT},
                      {"role":"user","content":f"Patient: {payload.patient_name}\nMessage: {payload.message}"}],
            temperature=0.3, max_tokens=512)
        raw = completion.choices[0].message.content.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"): raw = raw[4:]
        parsed = json.loads(raw)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=502, detail="AI parse failed")
    except Exception as e:
        raise HTTPException(status_code=503, detail="AI unavailable")
    if parsed.get("intent") == "EMERGENCY":
        await send_emergency_alert(payload.patient_name or "Unknown", payload.from_number, payload.message)
    return TriageResult(intent=parsed.get("intent","UNKNOWN"),confidence=parsed.get("confidence","LOW"),
        response_text=parsed.get("response_text","Ek minute rukein..."),
        next_action=parsed.get("next_action","ASK_CLARIFICATION"),language=parsed.get("language","hinglish"))


@app.post("/api/webhook/raw")
async def raw_whatsapp_webhook(request: Request):
    body = await request.json()
    try:
        entry = body["entry"][0]; change = entry["changes"][0]["value"]
        msg_obj = change["messages"][0]; contact = change["contacts"][0]
        return await whatsapp_webhook(WhatsAppMessage(
            from_number=msg_obj["from"],patient_name=contact["profile"]["name"],
            message=msg_obj["text"]["body"],timestamp=msg_obj["timestamp"]))
    except (KeyError, IndexError) as e:
        raise HTTPException(status_code=400, detail=f"Invalid payload: {e}")


@app.get("/api/appointments")
async def get_appointments(status: Optional[str] = None, limit: int = 50):
    if not supabase:
        raise HTTPException(status_code=503, detail="Supabase not configured")
    try:
        q = supabase.table("appointments").select("*").order("created_at",desc=True).limit(limit)
        if status: q = q.eq("status", status)
        result = q.execute()
        return {"appointments":result.data,"count":len(result.data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/send-reminder")
async def send_reminder(appointment_id: str):
    if not supabase:
        raise HTTPException(status_code=503, detail="Supabase not configured")
    result = supabase.table("appointments").select("*").eq("id", appointment_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Appointment not found")
    appt = result.data[0]
    await send_whatsapp_notification(appt["phone"],
        f"Appointment Reminder — Unique Hospital\n\nNamaste {appt['patient_name']}!\n\nAapka appointment 2 ghante mein hai:\nDepartment: {appt['department']}\nTime: {appt['preferred_time']}\n\n77 Motia Talab Rd, Kohefiza, Bhopal. Waqt par aana na bhulen!")
    return {"success":True,"message":f"Reminder sent to {appt['phone']}"}
