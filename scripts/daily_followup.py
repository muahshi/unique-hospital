"""
Daily Follow-up Script
- Runs via GitHub Actions every night at 9 PM IST
- Fetches today's completed appointments from Supabase
- Sends WhatsApp feedback link to each patient
"""
import os
import asyncio
import httpx
from datetime import date

SUPABASE_URL        = os.environ["SUPABASE_URL"]
SUPABASE_KEY        = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
WHATSAPP_TOKEN      = os.environ["WHATSAPP_TOKEN"]
WHATSAPP_PHONE_ID   = os.environ["WHATSAPP_PHONE_ID"]
FEEDBACK_FORM_URL   = os.environ.get("FEEDBACK_FORM_URL", "https://uniquehospital.in/feedback")

TODAY = date.today().strftime("%d-%m-%Y")

async def get_todays_appointments():
    """Fetch today's appointments from Supabase."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{SUPABASE_URL}/rest/v1/appointments",
            params={"preferred_date": f"eq.{TODAY}", "feedback_sent": "eq.false", "status": "neq.CANCELLED"},
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json",
            },
        )
        resp.raise_for_status()
        return resp.json()

async def send_whatsapp(to: str, name: str):
    """Send feedback WhatsApp message."""
    msg = (
        f"Namaste {name}! 🙏\n\n"
        f"Aaj Unique Hospital mein aane ke liye dhanyawad!\n\n"
        f"Aapka feedback humke liye bahut zaroori hai:\n"
        f"⭐ {FEEDBACK_FORM_URL}\n\n"
        f"2 minute mein share karein — isee hum aur behtar ho sakte hain.\n"
        f"— Unique Hospital Team, Bhopal"
    )
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            f"https://graph.facebook.com/v18.0/{WHATSAPP_PHONE_ID}/messages",
            json={"messaging_product":"whatsapp","to":to,"type":"text","text":{"body":msg}},
            headers={"Authorization":f"Bearer {WHATSAPP_TOKEN}","Content-Type":"application/json"},
        )
        return resp.status_code == 200

async def mark_feedback_sent(appt_id: str):
    """Update feedback_sent flag in Supabase."""
    async with httpx.AsyncClient() as client:
        await client.patch(
            f"{SUPABASE_URL}/rest/v1/appointments?id=eq.{appt_id}",
            json={"feedback_sent": True},
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json",
                "Prefer": "return=minimal",
            },
        )

async def main():
    print(f"Running daily follow-up for {TODAY}...")
    appointments = await get_todays_appointments()
    print(f"Found {len(appointments)} appointments to follow up")

    for appt in appointments:
        name  = appt.get("patient_name", "Patient")
        phone = appt.get("phone", "")
        appt_id = appt.get("id")
        if not phone:
            continue
        sent = await send_whatsapp(phone, name)
        if sent:
            await mark_feedback_sent(appt_id)
            print(f"✅ Feedback sent to {name} ({phone})")
        else:
            print(f"❌ Failed to send to {name} ({phone})")

    print("Done.")

if __name__ == "__main__":
    asyncio.run(main())
