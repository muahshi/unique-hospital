"use client";
import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

const DEPARTMENTS = ["Orthopedics","Joint Replacement","Spine Surgery","Trauma Care","General Medicine"];
const TIME_SLOTS  = ["9:00 AM","10:00 AM","11:00 AM","12:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM","6:00 PM","7:00 PM"];

// Next 14 days (Mon–Sat only)
function getAvailableDates() {
  const dates: { label: string; value: string; day: string }[] = [];
  const today = new Date();
  let d = new Date(today);
  d.setDate(d.getDate() + 1); // Start from tomorrow
  while (dates.length < 14) {
    const dow = d.getDay();
    if (dow !== 0) { // Skip Sunday
      const dd = String(d.getDate()).padStart(2,"0");
      const mm = String(d.getMonth()+1).padStart(2,"0");
      const yyyy = d.getFullYear();
      const dayName = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][dow];
      const monthName = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()];
      dates.push({ label:`${dd} ${monthName}`, value:`${dd}-${mm}-${yyyy}`, day: dayName });
    }
    d.setDate(d.getDate()+1);
  }
  return dates;
}

type Step = "dept" | "date" | "time" | "details" | "confirm" | "done";

interface BookingState {
  department: string;
  date: string;
  dateLabel: string;
  time: string;
  name: string;
  phone: string;
}

export default function EasyBooking({ onClose }: { onClose: () => void }) {
  const [step, setStep]       = useState<Step>("dept");
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<BookingState>({ department:"", date:"", dateLabel:"", time:"", name:"", phone:"" });
  const [apptId, setApptId]   = useState("");
  const [error, setError]     = useState("");

  const dates = getAvailableDates();

  async function handleConfirm() {
    if (!booking.name.trim() || booking.phone.length < 10) {
      setError("Kripya sahi naam aur 10 digit phone number bharein."); return;
    }
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/book`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          patient_name: booking.name, phone: booking.phone,
          department: booking.department, preferred_date: booking.date,
          preferred_time: booking.time, symptoms:"",
          session_id: `easy_${Date.now()}`,
        }),
      });
      const data = await res.json();
      if (data.success) { setApptId(data.appointment_id || ""); setStep("done"); }
      else setError("Booking mein problem aayi. Dobara try karein.");
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  }

  // ── Step Screens ────────────────────────────────────────────────────────────

  const stepDept = (
    <div>
      <h3 style={headingStyle}>Kaunsa Department?</h3>
      <p style={subStyle}>Apna department chunein 👇</p>
      <div style={{ display:"flex", flexDirection:"column", gap:10, marginTop:16 }}>
        {DEPARTMENTS.map(d => (
          <button key={d} onClick={() => { setBooking(b => ({...b, department:d})); setStep("date"); }}
            style={optionBtn(booking.department===d)}>{d}</button>
        ))}
      </div>
    </div>
  );

  const stepDate = (
    <div>
      <h3 style={headingStyle}>Kaunsa Din?</h3>
      <p style={subStyle}>{booking.department} · Date chunein 👇</p>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginTop:16 }}>
        {dates.map(d => (
          <button key={d.value} onClick={() => { setBooking(b => ({...b, date:d.value, dateLabel:d.label})); setStep("time"); }}
            style={calBtn(booking.date===d.value)}>
            <div style={{ fontSize:10, color: booking.date===d.value?"#93c5fd":"#64748b", marginBottom:2 }}>{d.day}</div>
            <div style={{ fontWeight:700, fontSize:15 }}>{d.label}</div>
          </button>
        ))}
      </div>
    </div>
  );

  const stepTime = (
    <div>
      <h3 style={headingStyle}>Kaunsa Samay?</h3>
      <p style={subStyle}>{booking.dateLabel} · Time chunein 👇</p>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:16 }}>
        {TIME_SLOTS.map(t => (
          <button key={t} onClick={() => { setBooking(b => ({...b, time:t})); setStep("details"); }}
            style={optionBtn(booking.time===t)}>{t}</button>
        ))}
      </div>
    </div>
  );

  const stepDetails = (
    <div>
      <h3 style={headingStyle}>Aapki Details</h3>
      <p style={subStyle}>{booking.department} · {booking.dateLabel} · {booking.time}</p>
      <div style={{ marginTop:20, display:"flex", flexDirection:"column", gap:14 }}>
        <div>
          <label style={labelStyle}>Aapka Naam *</label>
          <input value={booking.name} onChange={e => setBooking(b => ({...b, name:e.target.value}))}
            placeholder="Pura naam likhein..." style={inputStyle}/>
        </div>
        <div>
          <label style={labelStyle}>WhatsApp Number *</label>
          <div style={{ position:"relative" }}>
            <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"#64748b", fontSize:14 }}>+91</span>
            <input value={booking.phone} onChange={e => setBooking(b => ({...b, phone:e.target.value.replace(/\D/,"")}))}
              placeholder="10 digit number" maxLength={10} type="tel"
              style={{...inputStyle, paddingLeft:44}}/>
          </div>
          <div style={{ fontSize:11, color:"#64748b", marginTop:4 }}>Confirmation is number par aayegi</div>
        </div>
        {error && <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, padding:"10px 14px", color:"#dc2626", fontSize:13 }}>{error}</div>}
        <button onClick={() => setStep("confirm")}
          disabled={!booking.name.trim() || booking.phone.length<10}
          style={{ ...primaryBtn, opacity:(!booking.name.trim()||booking.phone.length<10)?0.4:1 }}>
          Aage Badho →
        </button>
      </div>
    </div>
  );

  const stepConfirm = (
    <div>
      <h3 style={headingStyle}>Confirm Karein</h3>
      <div style={{ background:"#f0f9ff", border:"1px solid #bae6fd", borderRadius:16, padding:20, marginTop:16 }}>
        {[
          ["Department", booking.department],
          ["Date", booking.dateLabel],
          ["Time", booking.time],
          ["Patient", booking.name],
          ["WhatsApp", `+91 ${booking.phone}`],
        ].map(([k,v]) => (
          <div key={k} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <span style={{ fontSize:13, color:"#64748b" }}>{k}</span>
            <span style={{ fontSize:13, fontWeight:700, color:"#0A5C96" }}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{ background:"#f0fdf4", borderRadius:12, padding:"10px 14px", marginTop:12, fontSize:12, color:"#16a34a" }}>
        ✅ Confirm hone par WhatsApp pe confirmation aayega
      </div>
      {error && <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, padding:"10px 14px", color:"#dc2626", fontSize:13, marginTop:10 }}>{error}</div>}
      <button onClick={handleConfirm} disabled={loading} style={{ ...primaryBtn, marginTop:16, opacity:loading?0.6:1 }}>
        {loading ? "Book ho raha hai..." : "✅ Appointment Book Karein"}
      </button>
      <button onClick={() => setStep("details")} style={{ ...ghostBtn, marginTop:10 }}>← Wapas</button>
    </div>
  );

  const stepDone = (
    <div style={{ textAlign:"center", padding:"20px 0" }}>
      <div style={{ fontSize:60, marginBottom:16 }}>🎉</div>
      <h3 style={{ fontSize:22, fontWeight:900, color:"#0A5C96", marginBottom:8 }}>Appointment Booked!</h3>
      <p style={{ fontSize:14, color:"#64748b", lineHeight:1.6, marginBottom:20 }}>
        WhatsApp par confirmation bhej di gayi hai.<br/>
        Appointment se 2 ghante pehle reminder aayega.
      </p>
      <div style={{ background:"#f0f9ff", borderRadius:16, padding:20, textAlign:"left", marginBottom:20 }}>
        {[
          ["Department", booking.department],
          ["Date", booking.dateLabel],
          ["Time", booking.time],
          ["Patient", booking.name],
        ].map(([k,v]) => (
          <div key={k} style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ fontSize:13, color:"#64748b" }}>{k}</span>
            <span style={{ fontSize:13, fontWeight:700, color:"#0A5C96" }}>{v}</span>
          </div>
        ))}
      </div>
      <button onClick={onClose} style={primaryBtn}>Done ✓</button>
    </div>
  );

  const STEPS: Record<Step, JSX.Element> = {
    dept: stepDept, date: stepDate, time: stepTime,
    details: stepDetails, confirm: stepConfirm, done: stepDone
  };

  const STEP_ORDER: Step[] = ["dept","date","time","details","confirm","done"];
  const stepIdx = STEP_ORDER.indexOf(step);
  const progress = ((stepIdx) / (STEP_ORDER.length - 2)) * 100;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:1000, background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div style={{ width:"100%", maxWidth:480, maxHeight:"92vh", background:"#fff", borderRadius:"24px 24px 0 0", display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Header */}
        <div style={{ background:"linear-gradient(135deg,#0A5C96,#1a7bc4)", padding:"16px 20px 12px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
            <div style={{ color:"#fff", fontWeight:700, fontSize:16 }}>📅 Appointment Book Karein</div>
            <button onClick={onClose} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.8)", fontSize:22, cursor:"pointer" }}>✕</button>
          </div>
          {step !== "done" && (
            <div style={{ background:"rgba(255,255,255,0.2)", borderRadius:100, height:4 }}>
              <div style={{ height:4, borderRadius:100, background:"#fff", width:`${progress}%`, transition:"width 0.3s" }}/>
            </div>
          )}
        </div>

        {/* Back button */}
        {step !== "dept" && step !== "done" && (
          <button onClick={() => setStep(STEP_ORDER[stepIdx-1])}
            style={{ textAlign:"left", padding:"10px 20px", background:"none", border:"none", color:"#64748b", fontSize:13, cursor:"pointer" }}>
            ← Wapas
          </button>
        )}

        {/* Content */}
        <div style={{ flex:1, overflowY:"auto", padding:"16px 20px 32px" }}>
          {STEPS[step]}
        </div>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const headingStyle: React.CSSProperties = { fontSize:20, fontWeight:800, color:"#1a2e44", marginBottom:4 };
const subStyle: React.CSSProperties     = { fontSize:13, color:"#64748b" };
const labelStyle: React.CSSProperties  = { fontSize:13, fontWeight:600, color:"#334155", display:"block", marginBottom:6 };
const inputStyle: React.CSSProperties  = {
  width:"100%", border:"1.5px solid #e2e8f0", borderRadius:12,
  padding:"12px 14px", fontSize:14, outline:"none", fontFamily:"inherit",
  boxSizing:"border-box"
};
const primaryBtn: React.CSSProperties  = {
  width:"100%", background:"#0A5C96", color:"#fff",
  border:"none", borderRadius:100, padding:"15px 0",
  fontWeight:700, fontSize:15, cursor:"pointer",
  boxShadow:"0 4px 16px rgba(10,92,150,0.3)"
};
const ghostBtn: React.CSSProperties    = {
  width:"100%", background:"none", color:"#64748b",
  border:"1.5px solid #e2e8f0", borderRadius:100, padding:"13px 0",
  fontWeight:600, fontSize:14, cursor:"pointer"
};
function optionBtn(selected: boolean): React.CSSProperties {
  return {
    width:"100%", padding:"14px 16px", borderRadius:14, textAlign:"left",
    fontWeight:selected?700:500, fontSize:14, cursor:"pointer",
    background: selected?"#0A5C96":"#f8fafc",
    color: selected?"#fff":"#1a2e44",
    border: selected?"2px solid #0A5C96":"1.5px solid #e2e8f0",
    transition:"all 0.15s"
  };
}
function calBtn(selected: boolean): React.CSSProperties {
  return {
    padding:"12px 8px", borderRadius:14, textAlign:"center", cursor:"pointer",
    background: selected?"#0A5C96":"#f8fafc",
    color: selected?"#fff":"#1a2e44",
    border: selected?"2px solid #0A5C96":"1.5px solid #e2e8f0",
    transition:"all 0.15s"
  };
}

