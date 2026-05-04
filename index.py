from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
import os
import json
import logging

# ─── Logging ────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─── Environment Validation ──────────────────────────────────────────────────
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY environment variable is not set.")

ALLOWED_ORIGINS = os.environ.get(
    "ALLOWED_ORIGINS",
    "https://uniquehospital.in,http://localhost:3000"
).split(",")

# ─── App Init ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Unique Hospital Smart Clinic API",
    description="AI-powered WhatsApp webhook for appointment triage",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Groq Client ─────────────────────────────────────────────────────────────
groq_client = Groq(api_key=GROQ_API_KEY)

# ─── Models ──────────────────────────────────────────────────────────────────
class WhatsAppMessage(BaseModel):
    from_number: str
    patient_name: str | None = "Patient"
    message: str
    timestamp: str | None = None


class TriageResult(BaseModel):
    intent: str          # BOOKING | QUERY | EMERGENCY | UNKNOWN
    confidence: str      # HIGH | MEDIUM | LOW
    response_text: str
    next_action: str
    language: str        # en | hi | hinglish


# ─── System Prompt ───────────────────────────────────────────────────────────
SYSTEM_PROMPT = """
You are a smart medical assistant for Unique Hospital, Bhopal — a leading orthopedic 
and multi-specialty hospital in Madhya Pradesh, India.

Your task is to analyze incoming patient WhatsApp messages and respond with a 
structured JSON object. Do NOT include any preamble or explanation — ONLY valid JSON.

Classify the patient's message intent into exactly one of:
- BOOKING: Patient wants to book, reschedule, or cancel an appointment
- QUERY: General question about doctors, timings, fees, facilities, or treatments
- EMERGENCY: Medical emergency, severe pain, accident, stroke, or urgent situation
- UNKNOWN: Cannot determine intent clearly

Respond with ONLY this JSON structure:
{
  "intent": "BOOKING|QUERY|EMERGENCY|UNKNOWN",
  "confidence": "HIGH|MEDIUM|LOW",
  "response_text": "A warm, helpful reply in the same language as the patient (Hindi/English/Hinglish). Keep it under 160 words.",
  "next_action": "ROUTE_TO_RECEPTIONIST|SEND_DOCTOR_LIST|CALL_EMERGENCY|ASK_CLARIFICATION",
  "language": "en|hi|hinglish"
}

Hospital details:
- Name: Unique Hospital
- Location: Bhopal, Madhya Pradesh
- Specialties: Orthopedics, Joint Replacement, Spine Surgery, Trauma Care
- OPD Hours: Monday-Saturday, 9 AM to 8 PM
- Emergency: 24/7
- Appointment: Via WhatsApp or calling the helpline
"""


# ─── Routes ──────────────────────────────────────────────────────────────────
@app.get("/api/health")
async def health_check():
    """Health check endpoint for uptime monitoring."""
    return {"status": "ok", "service": "Unique Hospital Smart Clinic API"}


@app.post("/api/webhook", response_model=TriageResult)
async def whatsapp_webhook(payload: WhatsAppMessage):
    """
    Receives a WhatsApp-formatted message, runs Groq AI triage,
    and returns a structured response with intent classification.
    """
    logger.info(f"Incoming message from {payload.from_number}: {payload.message[:60]}...")

    user_content = f"""
Patient Name: {payload.patient_name or 'Unknown'}
Message: {payload.message}
"""

    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
            temperature=0.3,
            max_tokens=512,
        )

        raw_response = completion.choices[0].message.content.strip()
        logger.info(f"Groq response: {raw_response[:100]}...")

        # Strip markdown fences if present
        if raw_response.startswith("```"):
            raw_response = raw_response.split("```")[1]
            if raw_response.startswith("json"):
                raw_response = raw_response[4:]

        parsed = json.loads(raw_response)

        return TriageResult(
            intent=parsed.get("intent", "UNKNOWN"),
            confidence=parsed.get("confidence", "LOW"),
            response_text=parsed.get("response_text", "Ek minute rukein, hum aapki help karenge."),
            next_action=parsed.get("next_action", "ASK_CLARIFICATION"),
            language=parsed.get("language", "hinglish"),
        )

    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error: {e} | Raw: {raw_response}")
        raise HTTPException(status_code=502, detail="AI response parsing failed.")
    except Exception as e:
        logger.error(f"Groq API error: {e}")
        raise HTTPException(status_code=503, detail="AI service temporarily unavailable.")


@app.post("/api/webhook/raw")
async def raw_webhook(request: Request):
    """
    Raw webhook endpoint for direct WhatsApp Business API callbacks.
    Parses standard WhatsApp Cloud API payload format.
    """
    body = await request.json()

    try:
        entry = body["entry"][0]
        change = entry["changes"][0]["value"]
        msg_obj = change["messages"][0]
        contact = change["contacts"][0]

        payload = WhatsAppMessage(
            from_number=msg_obj["from"],
            patient_name=contact["profile"]["name"],
            message=msg_obj["text"]["body"],
            timestamp=msg_obj["timestamp"],
        )

        return await whatsapp_webhook(payload)

    except (KeyError, IndexError) as e:
        logger.warning(f"Malformed WhatsApp payload: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid WhatsApp payload: {str(e)}")
