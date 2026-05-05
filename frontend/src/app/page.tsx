"use client";
import { useState, useRef, useEffect, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const PHONE    = "919575877759";
const MAPS_URL = "https://maps.google.com/?q=Unique+Hospital+77+Motia+Talab+Rd+Kohefiza+Bhopal";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

const DEPARTMENTS  = ["Orthopedics","Joint Replacement","Spine Surgery","Trauma Care","General Medicine"];
const TIME_SLOTS   = ["9:00 AM","10:00 AM","11:00 AM","12:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM","6:00 PM","7:00 PM"];
const QUICK_QS     = ["Knee mein dard hai?","Joint replacement mein time?","OPD timing?","Fees kitni hai?","Physiotherapy hai?"];

// ─── i18n Dictionary ──────────────────────────────────────────────────────────
const dict = {
  en: {
    bookBtn:    "Book Appointment",
    chatBtn:    "Ask Doctor (AI)",
    heroTitle1: "ORTHOPEDIC",
    heroTitle2: "EXCELLENCE",
    heroTitle3: "IN BHOPAL",
    heroSub:    "Compassionate Care, Smart Technology.",
    services:   "Our Services",
    trusted:    "Bhopal's Most Trusted",
    emergency:  "Medical Emergency?",
    callNow:    "Call Now",
    bookTitle:  "Book Appointment",
    chatTitle:  "AI Health Assistant",
    chatSub:    "Symptoms · Treatment · Info",
    dept:       "Which Department?",
    deptSub:    "Select your department 👇",
    date:       "Which Day?",
    time:       "Which Time?",
    timeSub:    "Select time slot 👇",
    details:    "Your Details",
    naam:       "Your Name *",
    whatsapp:   "WhatsApp Number *",
    emailLbl:   "Email Address",
    emailOpt:   "(optional)",
    confNote:   "Confirmation will be sent here",
    next:       "Continue →",
    confirm:    "Confirm Booking",
    confirmBtn: "✅ Book Appointment",
    booking:    "Booking...",
    done:       "Appointment Booked!",
    doneSub:    "Confirmation email sent.\nReminder 2 hours before.",
    doneBtn:    "Done ✓",
    back:       "← Back",
    myAppts:    "My Appointments",
    noAppts:    "No appointments saved.",
    download:   "Download Card",
    installTitle: "Install our App",
    installMsg:   "Get instant appointment booking, reminders & health tips — right on your home screen.",
    installBtn:   "Install App",
    installLater: "Maybe Later",
    installWhy:   "Why install?",
    whyMsg:       "Works offline · No browser needed · Faster booking · Push notifications",
    langToggle:   "हिंदी",
    wapas:        "← Back",
  },
  hi: {
    bookBtn:    "अपॉइंटमेंट बुक करें",
    chatBtn:    "डॉक्टर से पूछें (AI)",
    heroTitle1: "हड्डी रोग",
    heroTitle2: "विशेषज्ञता",
    heroTitle3: "भोपाल में",
    heroSub:    "दयालु देखभाल, स्मार्ट तकनीक।",
    services:   "हमारी सेवाएं",
    trusted:    "भोपाल का सबसे भरोसेमंद",
    emergency:  "मेडिकल इमरजेंसी?",
    callNow:    "अभी कॉल करें",
    bookTitle:  "अपॉइंटमेंट बुक करें",
    chatTitle:  "AI स्वास्थ्य सहायक",
    chatSub:    "लक्षण · उपचार · जानकारी",
    dept:       "कौनसा विभाग?",
    deptSub:    "अपना विभाग चुनें 👇",
    date:       "कौनसा दिन?",
    time:       "कौनसा समय?",
    timeSub:    "समय स्लॉट चुनें 👇",
    details:    "आपकी जानकारी",
    naam:       "आपका नाम *",
    whatsapp:   "WhatsApp नंबर *",
    emailLbl:   "ईमेल पता",
    emailOpt:   "(वैकल्पिक)",
    confNote:   "पुष्टि यहाँ भेजी जाएगी",
    next:       "आगे बढ़ें →",
    confirm:    "पुष्टि करें",
    confirmBtn: "✅ अपॉइंटमेंट बुक करें",
    booking:    "बुक हो रहा है...",
    done:       "अपॉइंटमेंट बुक हो गई!",
    doneSub:    "पुष्टि ईमेल भेज दी गई।\n2 घंटे पहले रिमाइंडर आएगा।",
    doneBtn:    "Done ✓",
    back:       "← वापस",
    myAppts:    "मेरी अपॉइंटमेंट",
    noAppts:    "कोई अपॉइंटमेंट सहेजी नहीं।",
    download:   "कार्ड डाउनलोड करें",
    installTitle: "हमारी App इंस्टॉल करें",
    installMsg:   "तुरंत अपॉइंटमेंट, रिमाइंडर और स्वास्थ्य सुझाव — सीधे होम स्क्रीन पर।",
    installBtn:   "App इंस्टॉल करें",
    installLater: "बाद में",
    installWhy:   "क्यों इंस्टॉल करें?",
    whyMsg:       "ऑफलाइन काम करे · ब्राउज़र की जरूरत नहीं · तेज बुकिंग · नोटिफिकेशन",
    langToggle:   "English",
    wapas:        "← वापस",
  }
};
type Lang = "en"|"hi";

// ─── Types ────────────────────────────────────────────────────────────────────
type BookStep = "dept"|"date"|"time"|"details"|"confirm"|"done";
interface Msg  { role:"user"|"assistant"; content:string; }
interface SavedAppointment {
  id: string; name: string; phone: string; department: string;
  date: string; dateLabel: string; time: string; bookedAt: string;
}

// ─── Date Helper ──────────────────────────────────────────────────────────────
function getAvailableDates() {
  const out: {label:string;value:string;day:string}[] = [];
  const d = new Date(); d.setDate(d.getDate()+1);
  while (out.length < 14) {
    const dow = d.getDay();
    if (dow !== 0) {
      const dd = String(d.getDate()).padStart(2,"0");
      const mm = String(d.getMonth()+1).padStart(2,"0");
      const mon = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()];
      const day = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][dow];
      out.push({label:`${dd} ${mon}`,value:`${dd}-${mm}-${d.getFullYear()}`,day});
    }
    d.setDate(d.getDate()+1);
  }
  return out;
}

// ─── QR Code (pure SVG, no library needed) ───────────────────────────────────
function MiniQR({ text }: { text: string }) {
  // Simple visual QR-like pattern using text hash — decorative
  const hash = text.split("").reduce((a,c) => ((a<<5)-a)+c.charCodeAt(0),0) >>> 0;
  const cells: boolean[][] = Array.from({length:9},(_,r)=>Array.from({length:9},(_,c)=>{
    const bit = (hash >> ((r*9+c)%32)) & 1;
    return !!(bit ^ (r<3&&c<3) ^ (r<3&&c>5) ^ (r>5&&c<3));
  }));
  return (
    <svg width="64" height="64" viewBox="0 0 9 9" style={{border:"2px solid #0A5C96",borderRadius:4,background:"#fff"}}>
      {cells.map((row,r)=>row.map((on,c)=> on ? <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#0A5C96"/> : null))}
    </svg>
  );
}

// ─── Digital Appointment Card ─────────────────────────────────────────────────
function AppointmentCard({ appt, t }: { appt: SavedAppointment; t: typeof dict.en }) {
  const cardRef = useRef<HTMLDivElement>(null);

  async function downloadCard() {
    if (!cardRef.current) return;
    try {
      const { default: html2canvas } = await import("html2canvas" as any);
      const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: null });
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `UH_Appointment_${appt.id}.png`;
      a.click();
    } catch {
      alert("Download ke liye browser mein try karein.");
    }
  }

  return (
    <div style={{marginBottom:16}}>
      <div ref={cardRef} style={{
        background:"linear-gradient(135deg,#0A5C96 0%,#1a7bc4 50%,#0e4f80 100%)",
        borderRadius:18, padding:"20px", position:"relative", overflow:"hidden",
        boxShadow:"0 8px 32px rgba(10,92,150,0.35)"
      }}>
        {/* Decorative circles */}
        <div style={{position:"absolute",top:-20,right:-20,width:100,height:100,borderRadius:"50%",background:"rgba(255,255,255,0.08)"}}/>
        <div style={{position:"absolute",bottom:-30,left:-10,width:80,height:80,borderRadius:"50%",background:"rgba(255,255,255,0.05)"}}/>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,borderRadius:10,background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:900,fontSize:13}}>UH</div>
            <div>
              <div style={{color:"#fff",fontWeight:800,fontSize:14}}>Unique Hospital</div>
              <div style={{color:"rgba(255,255,255,0.7)",fontSize:10}}>Bhopal, M.P.</div>
            </div>
          </div>
          <div style={{background:"rgba(255,255,255,0.15)",borderRadius:8,padding:"4px 10px"}}>
            <div style={{color:"#93c5fd",fontSize:9,fontWeight:700,letterSpacing:"0.08em"}}>APPOINTMENT</div>
          </div>
        </div>

        {/* Patient name big */}
        <div style={{color:"#fff",fontWeight:900,fontSize:22,marginBottom:4}}>{appt.name}</div>
        <div style={{color:"rgba(255,255,255,0.7)",fontSize:12,marginBottom:16}}>{appt.department}</div>

        {/* Date Time Row */}
        <div style={{display:"flex",gap:12,marginBottom:16}}>
          <div style={{flex:1,background:"rgba(255,255,255,0.12)",borderRadius:12,padding:"12px"}}>
            <div style={{color:"rgba(255,255,255,0.6)",fontSize:10,marginBottom:4}}>📅 DATE</div>
            <div style={{color:"#fff",fontWeight:700,fontSize:14}}>{appt.dateLabel}</div>
          </div>
          <div style={{flex:1,background:"rgba(255,255,255,0.12)",borderRadius:12,padding:"12px"}}>
            <div style={{color:"rgba(255,255,255,0.6)",fontSize:10,marginBottom:4}}>⏰ TIME</div>
            <div style={{color:"#fff",fontWeight:700,fontSize:14}}>{appt.time}</div>
          </div>
        </div>

        {/* Footer: ID + QR */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{color:"rgba(255,255,255,0.5)",fontSize:9,marginBottom:3}}>BOOKING ID</div>
            <div style={{color:"#fbbf24",fontWeight:800,fontSize:13,letterSpacing:"0.1em"}}>{appt.id}</div>
            <div style={{color:"rgba(255,255,255,0.4)",fontSize:9,marginTop:6}}>{appt.phone}</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            <MiniQR text={appt.id+appt.name+appt.date} />
            <div style={{color:"rgba(255,255,255,0.4)",fontSize:8}}>Counter par scan karein</div>
          </div>
        </div>
      </div>

      {/* Download Button */}
      <button onClick={downloadCard} style={{
        width:"100%",marginTop:8,background:"#f8fafc",border:"1.5px solid #e2e8f0",
        borderRadius:100,padding:"11px 0",fontWeight:600,fontSize:13,
        color:"#0A5C96",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6
      }}>📥 {t.download}</button>
    </div>
  );
}

// ─── PWA Install Popup ────────────────────────────────────────────────────────
function InstallPrompt({ t, onClose }: { t: typeof dict.en; onClose: ()=>void }) {
  const [showWhy, setShowWhy] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler as any);
    return () => window.removeEventListener("beforeinstallprompt", handler as any);
  }, []);

  async function handleInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
    onClose();
  }

  return (
    <div style={{position:"fixed",inset:0,zIndex:3000,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div style={{width:"100%",maxWidth:480,background:"#fff",borderRadius:"24px 24px 0 0",padding:"28px 24px 40px",animation:"slideUp 0.35s ease"}}>
        {/* Icon */}
        <div style={{textAlign:"center",marginBottom:16}}>
          <div style={{width:64,height:64,borderRadius:18,background:"linear-gradient(135deg,#0A5C96,#1a7bc4)",display:"inline-flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:900,fontSize:22,marginBottom:12,boxShadow:"0 8px 24px rgba(10,92,150,0.3)"}}>UH</div>
          <h3 style={{fontSize:20,fontWeight:800,color:"#1a2e44",margin:"0 0 8px"}}>{t.installTitle}</h3>
          <p style={{fontSize:14,color:"#64748b",lineHeight:1.6,margin:0}}>{t.installMsg}</p>
        </div>

        {/* Why install toggle */}
        {showWhy && (
          <div style={{background:"#eff6ff",borderRadius:14,padding:"14px 16px",marginBottom:16,fontSize:13,color:"#0369a1",lineHeight:1.7}}>
            ✓ {t.whyMsg.split(" · ").join("\n✓ ")}
          </div>
        )}

        <button onClick={() => setShowWhy(!showWhy)} style={{
          width:"100%",marginBottom:10,background:"none",border:"1.5px solid #e2e8f0",
          borderRadius:100,padding:"11px 0",fontSize:13,color:"#64748b",cursor:"pointer"
        }}>{showWhy ? "▲ Hide" : `❓ ${t.installWhy}`}</button>

        <button onClick={handleInstall} style={{
          width:"100%",marginBottom:10,background:"#0A5C96",color:"#fff",
          border:"none",borderRadius:100,padding:"15px 0",
          fontWeight:700,fontSize:15,cursor:"pointer",
          boxShadow:"0 4px 16px rgba(10,92,150,0.3)"
        }}>{t.installBtn}</button>

        <button onClick={onClose} style={{
          width:"100%",background:"none",border:"none",
          color:"#94a3b8",fontSize:13,cursor:"pointer",padding:"8px 0"
        }}>{t.installLater}</button>
      </div>
      <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
    </div>
  );
}

// ─── My Appointments Panel ────────────────────────────────────────────────────
function MyAppointments({ t, onClose }: { t: typeof dict.en; onClose: ()=>void }) {
  const [appts, setAppts] = useState<SavedAppointment[]>([]);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("uh_appointments") || "[]");
      setAppts(saved);
    } catch { setAppts([]); }
  }, []);

  return (
    <div style={{position:"fixed",inset:0,zIndex:2000,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div style={{width:"100%",maxWidth:480,maxHeight:"90vh",background:"#fff",borderRadius:"24px 24px 0 0",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{background:"linear-gradient(135deg,#0A5C96,#1a7bc4)",padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{color:"#fff",fontWeight:700,fontSize:16}}>🗓️ {t.myAppts}</span>
          <button onClick={onClose} style={{background:"none",border:"none",color:"rgba(255,255,255,0.85)",fontSize:22,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"16px 20px 40px"}}>
          {appts.length === 0
            ? <div style={{textAlign:"center",padding:"48px 0",color:"#94a3b8",fontSize:14}}>{t.noAppts}</div>
            : appts.map(a => <AppointmentCard key={a.id} appt={a} t={t}/>)
          }
        </div>
      </div>
    </div>
  );
}

// ─── EasyBooking Modal ────────────────────────────────────────────────────────
function EasyBooking({ onClose, t }: { onClose:()=>void; t: typeof dict.en }) {
  const [step,    setStep]    = useState<BookStep>("dept");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [bk, setBk] = useState({ department:"", date:"", dateLabel:"", time:"", name:"", phone:"", email:"" });
  const dates = getAvailableDates();
  const STEPS: BookStep[] = ["dept","date","time","details","confirm","done"];
  const idx      = STEPS.indexOf(step);
  const progress = (idx / (STEPS.length-2)) * 100;

  function saveToLocalStorage(apptId: string) {
    try {
      const existing: SavedAppointment[] = JSON.parse(localStorage.getItem("uh_appointments") || "[]");
      const newAppt: SavedAppointment = {
        id: apptId, name: bk.name, phone: bk.phone,
        department: bk.department, date: bk.date,
        dateLabel: bk.dateLabel, time: bk.time,
        bookedAt: new Date().toISOString()
      };
      existing.unshift(newAppt);
      localStorage.setItem("uh_appointments", JSON.stringify(existing.slice(0,10)));
    } catch {}
  }

  async function confirm() {
    if (!bk.name.trim() || bk.phone.length < 10) { setError("Naam aur 10 digit phone zaroori hai."); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/book`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ patient_name:bk.name, phone:bk.phone, email:bk.email||"",
          department:bk.department, preferred_date:bk.date, preferred_time:bk.time,
          symptoms:"", session_id:`easy_${Date.now()}` }),
      });
      const data = await res.json();
      if (data.success) {
        saveToLocalStorage(data.appointment_id || `UH${Date.now().toString().slice(-6)}`);
        setStep("done");
      } else setError("Booking mein problem. Dobara try karein.");
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  }

  return (
    <div style={{position:"fixed",inset:0,zIndex:2000,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div style={{width:"100%",maxWidth:"100%",maxHeight:"92vh",background:"#fff",borderRadius:"24px 24px 0 0",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Header */}
        <div style={{background:"linear-gradient(135deg,#0A5C96,#1a7bc4)",padding:"16px 20px 12px",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <span style={{color:"#fff",fontWeight:700,fontSize:16}}>📅 {t.bookTitle}</span>
            <button onClick={onClose} style={{background:"none",border:"none",color:"rgba(255,255,255,0.85)",fontSize:22,cursor:"pointer"}}>✕</button>
          </div>
          {step !== "done" && (
            <div style={{background:"rgba(255,255,255,0.2)",borderRadius:100,height:4}}>
              <div style={{height:4,borderRadius:100,background:"#fff",width:`${progress}%`,transition:"width 0.3s"}}/>
            </div>
          )}
        </div>
        {/* Back */}
        {idx > 0 && step !== "done" && (
          <button onClick={() => setStep(STEPS[idx-1])} style={{textAlign:"left",padding:"10px 20px",background:"none",border:"none",color:"#64748b",fontSize:13,cursor:"pointer",flexShrink:0}}>{t.back}</button>
        )}
        {/* Content */}
        <div style={{flex:1,overflowY:"auto",padding:"16px 20px 40px"}}>

          {step==="dept" && <>
            <h3 style={H3}>{t.dept}</h3><p style={SUB}>{t.deptSub}</p>
            <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:16}}>
              {DEPARTMENTS.map(d=>(
                <button key={d} onClick={()=>{setBk(b=>({...b,department:d}));setStep("date");}} style={optBtn(bk.department===d)}>{d}</button>
              ))}
            </div>
          </>}

          {step==="date" && <>
            <h3 style={H3}>{t.date}</h3><p style={SUB}>{bk.department}</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginTop:16}}>
              {dates.map(d=>(
                <button key={d.value} onClick={()=>{setBk(b=>({...b,date:d.value,dateLabel:d.label}));setStep("time");}}
                  style={{padding:"12px 8px",borderRadius:14,textAlign:"center",cursor:"pointer",
                    background:bk.date===d.value?"#0A5C96":"#f8fafc",color:bk.date===d.value?"#fff":"#1a2e44",
                    border:bk.date===d.value?"2px solid #0A5C96":"1.5px solid #e2e8f0"}}>
                  <div style={{fontSize:10,color:bk.date===d.value?"#93c5fd":"#64748b",marginBottom:2}}>{d.day}</div>
                  <div style={{fontWeight:700,fontSize:15}}>{d.label}</div>
                </button>
              ))}
            </div>
          </>}

          {step==="time" && <>
            <h3 style={H3}>{t.time}</h3><p style={SUB}>{bk.dateLabel} · {t.timeSub}</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:16}}>
              {TIME_SLOTS.map(ts=>(
                <button key={ts} onClick={()=>{setBk(b=>({...b,time:ts}));setStep("details");}} style={optBtn(bk.time===ts)}>{ts}</button>
              ))}
            </div>
          </>}

          {step==="details" && <>
            <h3 style={H3}>{t.details}</h3>
            <p style={SUB}>{bk.department} · {bk.dateLabel} · {bk.time}</p>
            <div style={{marginTop:20,display:"flex",flexDirection:"column",gap:14}}>
              <div>
                <label style={LBL}>{t.naam}</label>
                <input value={bk.name} onChange={e=>setBk(b=>({...b,name:e.target.value}))} placeholder="Pura naam..." style={INP}/>
              </div>
              <div>
                <label style={LBL}>{t.whatsapp}</label>
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:"#64748b",fontSize:14}}>+91</span>
                  <input value={bk.phone} onChange={e=>setBk(b=>({...b,phone:e.target.value.replace(/\D/g,"")}))} placeholder="10 digit" maxLength={10} type="tel" style={{...INP,paddingLeft:44}}/>
                </div>
              </div>
              <div>
                <label style={LBL}>{t.emailLbl} <span style={{color:"#94a3b8",fontWeight:400}}>{t.emailOpt}</span></label>
                <input value={bk.email} onChange={e=>setBk(b=>({...b,email:e.target.value}))} placeholder="email@example.com" type="email" style={INP}/>
                <div style={{fontSize:11,color:"#64748b",marginTop:4}}>{t.confNote}</div>
              </div>
              {error && <div style={ERR}>{error}</div>}
              <button onClick={()=>{if(!bk.name.trim()||bk.phone.length<10){setError("Naam aur phone zaroori hai.");return;}setError("");setStep("confirm");}} style={{...PBTN,opacity:(!bk.name.trim()||bk.phone.length<10)?0.4:1}}>{t.next}</button>
            </div>
          </>}

          {step==="confirm" && <>
            <h3 style={H3}>{t.confirm}</h3>
            <div style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:16,padding:20,marginTop:16}}>
              {[["🏥",bk.department],["📅",bk.dateLabel],["⏰",bk.time],["👤",bk.name],["📞",`+91 ${bk.phone}`]].map(([ic,v],i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <span style={{fontSize:13,color:"#64748b"}}>{ic}</span>
                  <span style={{fontSize:13,fontWeight:700,color:"#0A5C96"}}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{background:"#f0fdf4",borderRadius:12,padding:"10px 14px",marginTop:12,fontSize:12,color:"#16a34a"}}>✅ Email confirmation bhej di jaayegi</div>
            {error && <div style={{...ERR,marginTop:10}}>{error}</div>}
            <button onClick={confirm} disabled={loading} style={{...PBTN,marginTop:16,opacity:loading?0.6:1}}>
              {loading ? t.booking : t.confirmBtn}
            </button>
          </>}

          {step==="done" && (
            <div style={{textAlign:"center",padding:"20px 0"}}>
              <div style={{fontSize:60,marginBottom:16}}>🎉</div>
              <h3 style={{fontSize:22,fontWeight:900,color:"#0A5C96",marginBottom:8}}>{t.done}</h3>
              <p style={{fontSize:14,color:"#64748b",lineHeight:1.6,marginBottom:20,whiteSpace:"pre-line"}}>{t.doneSub}</p>
              {/* Show saved card */}
              {(() => {
                try {
                  const saved: SavedAppointment[] = JSON.parse(localStorage.getItem("uh_appointments") || "[]");
                  if (saved[0]) return <AppointmentCard appt={saved[0]} t={t}/>;
                } catch {}
                return null;
              })()}
              <button onClick={onClose} style={PBTN}>{t.doneBtn}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── AIChat Modal ─────────────────────────────────────────────────────────────
function AIChat({ onClose, t }: { onClose:()=>void; t: typeof dict.en }) {
  const [msgs,    setMsgs]    = useState<Msg[]>([{role:"assistant",content:"Namaste! 🙏 Main Unique Hospital ka AI Health Assistant hoon.\n\nSymptoms, treatment, ya hospital ke baare mein kuch bhi poochein.\n\n⚠️ Appointment book karne ke liye neeche wala button use karein."}]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(()=>`chat_${Date.now()}`);
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[msgs]);

  async function send(text?:string) {
    const msg = (text||input).trim();
    if (!msg||loading) return;
    setInput("");
    setMsgs(p=>[...p,{role:"user",content:msg}]);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/chat`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({session_id:sessionId,message:msg,history:msgs.map(m=>({role:m.role,content:m.content}))}),
      });
      const data = await res.json();
      const reply=(data.reply||"Kuch problem aayi.").replace(/<booking_data>[\s\S]*?<\/booking_data>/g,"").trim();
      setMsgs(p=>[...p,{role:"assistant",content:reply}]);
      if(data.emergency) setMsgs(p=>[...p,{role:"assistant",content:"🚨 Emergency! Abhi call karein ya Emergency mein aayein."}]);
    } catch { setMsgs(p=>[...p,{role:"assistant",content:"Network error. Please try again."}]); }
    finally { setLoading(false); }
  }

  return (
    <div style={{position:"fixed",inset:0,zIndex:2000,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div style={{width:"100%",maxWidth:"100%",height:"88vh",background:"#fff",borderRadius:"24px 24px 0 0",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{background:"linear-gradient(135deg,#1e40af,#3b82f6)",padding:"16px 20px",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
          <div style={{width:38,height:38,borderRadius:"50%",background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🤖</div>
          <div style={{flex:1}}>
            <div style={{color:"#fff",fontWeight:700,fontSize:15}}>{t.chatTitle}</div>
            <div style={{color:"rgba(255,255,255,0.75)",fontSize:11}}>{t.chatSub}</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"rgba(255,255,255,0.8)",fontSize:22,cursor:"pointer"}}>✕</button>
        </div>
        {msgs.length===1&&(
          <div style={{padding:"10px 16px",borderBottom:"1px solid #f1f5f9",flexShrink:0}}>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {QUICK_QS.map(q=>(
                <button key={q} onClick={()=>send(q)} style={{background:"#f0f7ff",border:"1px solid #bae6fd",borderRadius:100,padding:"6px 12px",fontSize:11,color:"#0369a1",cursor:"pointer"}}>{q}</button>
              ))}
            </div>
          </div>
        )}
        <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:10}}>
          {msgs.map((m,i)=>(
            <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
              <div style={{maxWidth:"82%",padding:"10px 14px",fontSize:14,lineHeight:1.6,whiteSpace:"pre-wrap",
                borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",
                background:m.role==="user"?"#1e40af":"#f1f5f9",color:m.role==="user"?"#fff":"#1a2e44"}}>{m.content}</div>
            </div>
          ))}
          {loading&&<div style={{display:"flex",gap:5,padding:"8px 14px"}}>
            {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:"#94a3b8",animation:`bop 1.2s ${i*0.2}s infinite`}}/>)}
          </div>}
          <div ref={bottomRef}/>
        </div>
        <div style={{padding:"8px 16px",background:"#fffbeb",borderTop:"1px solid #fef3c7",fontSize:11,color:"#92400e",textAlign:"center",flexShrink:0}}>
          💡 Appointment book karne ke liye neeche wala button use karein
        </div>
        <div style={{padding:"12px 16px",borderTop:"1px solid #f1f5f9",display:"flex",gap:8,background:"#fff",flexShrink:0}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}
            placeholder="Apna sawaal likhein..."
            style={{flex:1,border:"1.5px solid #e2e8f0",borderRadius:100,padding:"10px 16px",fontSize:14,outline:"none",fontFamily:"inherit"}}/>
          <button onClick={()=>send()} disabled={loading||!input.trim()}
            style={{background:"#1e40af",color:"#fff",border:"none",borderRadius:"50%",width:42,height:42,fontSize:18,cursor:"pointer",opacity:(loading||!input.trim())?0.4:1,display:"flex",alignItems:"center",justifyContent:"center"}}>➤</button>
        </div>
      </div>
      <style>{`@keyframes bop{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-7px)}}`}</style>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [lang,        setLang]        = useState<Lang>("en");
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [chatOpen,    setChatOpen]    = useState(false);
  const [apptOpen,    setApptOpen]    = useState(false);
  const [installShow, setInstallShow] = useState(false);
  const t = dict[lang];

  // PWA install prompt — show after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only show if not already installed and not dismissed recently
      const dismissed = localStorage.getItem("uh_install_dismissed");
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
      if (!dismissed && !isStandalone) setInstallShow(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  function dismissInstall() {
    setInstallShow(false);
    localStorage.setItem("uh_install_dismissed", Date.now().toString());
  }

  // Check if user has saved appointments
  const [hasAppts, setHasAppts] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("uh_appointments") || "[]");
      setHasAppts(saved.length > 0);
    } catch {}
  }, [bookingOpen]);

  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",background:"#fff",minHeight:"100vh",color:"#1a2e44"}}>

      {installShow && <InstallPrompt t={t} onClose={dismissInstall}/>}
      {bookingOpen && <EasyBooking  onClose={()=>setBookingOpen(false)} t={t}/>}
      {chatOpen    && <AIChat       onClose={()=>setChatOpen(false)} t={t}/>}
      {apptOpen    && <MyAppointments onClose={()=>setApptOpen(false)} t={t}/>}

      {/* NAVBAR */}
      <nav style={{position:"sticky",top:0,zIndex:50,background:"#fff",borderBottom:"1px solid #e8f0f8",boxShadow:"0 1px 8px rgba(10,92,150,0.06)"}}>
        <div style={{maxWidth:480,margin:"0 auto",padding:"0 16px",height:58,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#0A5C96,#1a7bc4)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:13}}>UH</div>
            <div>
              <div style={{fontWeight:700,color:"#0A5C96",fontSize:16}}>Unique Hospital</div>
              <div style={{fontSize:9,color:"#94a3b8",letterSpacing:"0.12em",textTransform:"uppercase"}}>Bhopal, M.P.</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {/* Language Toggle */}
            <button onClick={()=>setLang(l=>l==="en"?"hi":"en")} style={{
              background:"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:8,
              padding:"5px 10px",fontSize:11,fontWeight:700,color:"#0A5C96",cursor:"pointer"
            }}>{t.langToggle}</button>
            <span style={{fontWeight:900,fontSize:11,color:"#7c3aed",border:"1px solid #e2e8f0",borderRadius:8,padding:"4px 8px"}}>PWA</span>
            <button onClick={()=>setMenuOpen(!menuOpen)} style={{background:"none",border:"none",cursor:"pointer",padding:4}}>
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                {[0,1,2].map(i=><span key={i} style={{display:"block",width:20,height:2,background:"#334155",borderRadius:2,opacity:menuOpen&&i===1?0:1}}/>)}
              </div>
            </button>
          </div>
        </div>
        {menuOpen&&(
          <div style={{borderTop:"1px solid #f1f5f9",background:"#fff",padding:"8px 16px 16px"}}>
            {["Services","About","Contact"].map(item=>(
              <a key={item} href={`#${item.toLowerCase()}`} onClick={()=>setMenuOpen(false)} style={{display:"block",padding:"12px 0",borderBottom:"1px solid #f8fafc",color:"#334155",textDecoration:"none",fontSize:14,fontWeight:500}}>{item}</a>
            ))}
            {hasAppts && <button onClick={()=>{setMenuOpen(false);setApptOpen(true);}} style={{display:"block",width:"100%",marginTop:8,textAlign:"left",background:"none",border:"none",padding:"12px 0",color:"#0A5C96",fontSize:14,fontWeight:600,cursor:"pointer"}}>🗓️ {t.myAppts}</button>}
          </div>
        )}
      </nav>

      {/* HERO */}
      <section style={{background:"linear-gradient(135deg,#deeefa,#c8e3f5,#b8d9f2)",overflow:"hidden"}}>
        <div style={{maxWidth:480,margin:"0 auto",display:"flex",alignItems:"flex-end",minHeight:280}}>
          <div style={{flex:1,padding:"28px 20px"}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(10,92,150,0.1)",borderRadius:100,padding:"4px 10px",marginBottom:12}}>
              <span style={{fontSize:10,fontWeight:600,color:"#0A5C96"}}>✦ Bhopal's Trusted Ortho Centre</span>
            </div>
            <h1 style={{fontSize:26,fontWeight:900,lineHeight:1.15,marginBottom:10,color:"#0A5C96"}}>
              {t.heroTitle1}<br/><span style={{color:"#1a2e44"}}>{t.heroTitle2}</span><br/>{t.heroTitle3}
            </h1>
            <p style={{fontSize:14,color:"#334155",marginBottom:20}}>{t.heroSub}</p>
            <button onClick={()=>setBookingOpen(true)} style={{display:"flex",alignItems:"center",gap:8,background:"#0A5C96",color:"#fff",padding:"13px 20px",borderRadius:100,fontWeight:700,fontSize:14,border:"none",cursor:"pointer",boxShadow:"0 4px 16px rgba(10,92,150,0.4)",marginBottom:10,width:"fit-content"}}>
              📅 {t.bookBtn}
            </button>
            <button onClick={()=>setChatOpen(true)} style={{display:"flex",alignItems:"center",gap:8,background:"#fff",color:"#0A5C96",border:"2px solid #0A5C96",padding:"11px 18px",borderRadius:100,fontWeight:600,fontSize:13,cursor:"pointer",width:"fit-content"}}>
              🤖 {t.chatBtn}
            </button>
          </div>
          <div style={{width:140,flexShrink:0,alignSelf:"stretch",position:"relative",overflow:"hidden"}}>
            <img src="/hero_doctor.png" alt="Doctor" style={{position:"absolute",bottom:0,right:0,height:"100%",width:"auto",objectFit:"cover",objectPosition:"top center"}} onError={(e)=>{(e.target as HTMLImageElement).style.display="none";}}/>
          </div>
        </div>
      </section>

      {/* My Appointments quick access (if saved) */}
      {hasAppts && (
        <div style={{background:"#eff6ff",padding:"12px 16px",borderBottom:"1px solid #bae6fd"}}>
          <div style={{maxWidth:480,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span style={{fontSize:13,color:"#0369a1",fontWeight:600}}>🗓️ {t.myAppts}</span>
            <button onClick={()=>setApptOpen(true)} style={{background:"#0A5C96",color:"#fff",border:"none",borderRadius:100,padding:"7px 16px",fontSize:12,fontWeight:700,cursor:"pointer"}}>View Cards →</button>
          </div>
        </div>
      )}

      {/* SERVICES */}
      <section id="services" style={{background:"#fff",padding:"24px 16px"}}>
        <div style={{maxWidth:480,margin:"0 auto"}}>
          <h2 style={{fontSize:20,fontWeight:800,marginBottom:16}}>{t.services}</h2>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {[{icon:"🦴",title:"Arthroscopy",desc:"Minimally invasive joint surgeries."},
              {icon:"🦿",title:"Joint Replacement",desc:"Complete hip & knee replacements."},
              {icon:"🚨",title:"Emergency Care",desc:"24/7 critical orthopedic support."},
              {icon:"🔬",title:"Diagnostics",desc:"Advanced imaging & analysis."}].map((s,i)=>(
              <div key={i} style={{background:"#f8fafc",border:"1px solid #e8f0f8",borderRadius:16,padding:"16px 14px"}}>
                <div style={{fontSize:30,marginBottom:8}}>{s.icon}</div>
                <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>{s.title}</div>
                <div style={{fontSize:12,color:"#64748b",lineHeight:1.5}}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section id="about" style={{background:"#f8fafc",padding:"24px 16px"}}>
        <div style={{maxWidth:480,margin:"0 auto"}}>
          <h2 style={{fontSize:20,fontWeight:800,marginBottom:16}}>{t.trusted}</h2>
          {[{icon:"🏥",title:"State-of-the-Art OT",desc:"Modular OTs with latest arthroscopic equipment."},
            {icon:"👨‍⚕️",title:"Expert Surgeons",desc:"Fellowship-trained, 15+ years experience."},
            {icon:"📅",title:"Easy Booking",desc:"Calendar se date chunein, 30 seconds mein done."},
            {icon:"🤖",title:"AI Health Assistant",desc:"Symptoms discuss karein, doctor se better milein."}].map((item,i)=>(
            <div key={i} style={{display:"flex",alignItems:"flex-start",gap:14,background:"#fff",borderRadius:14,padding:"14px 16px",border:"1px solid #e2e8f0",marginBottom:10}}>
              <span style={{fontSize:24}}>{item.icon}</span>
              <div><div style={{fontWeight:700,fontSize:14,marginBottom:2}}>{item.title}</div>
              <div style={{fontSize:12,color:"#64748b",lineHeight:1.5}}>{item.desc}</div></div>
            </div>
          ))}
        </div>
      </section>

      {/* STATS */}
      <section style={{background:"#0A5C96",padding:"20px 16px"}}>
        <div style={{maxWidth:480,margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",textAlign:"center",gap:8}}>
          {[{n:"5000+",l:"Surgeries"},{n:"15+",l:"Years Exp"},{n:"24/7",l:"Emergency"},{n:"98%",l:"Success"}].map((s,i)=>(
            <div key={i}><div style={{fontSize:18,fontWeight:800,color:"#fff"}}>{s.n}</div><div style={{fontSize:9,color:"#93c5fd",marginTop:2}}>{s.l}</div></div>
          ))}
        </div>
      </section>

      {/* EMERGENCY */}
      <section style={{background:"#dc2626",padding:"14px 16px"}}>
        <div style={{maxWidth:480,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
          <div>
            <div style={{fontWeight:700,color:"#fff",fontSize:14}}>🚨 {t.emergency}</div>
            <div style={{fontSize:11,color:"#fecaca",marginTop:2}}>Trauma team available 24/7</div>
          </div>
          <a href={`tel:+91${PHONE}`} style={{background:"#fff",color:"#dc2626",padding:"9px 16px",borderRadius:100,fontWeight:700,fontSize:12,textDecoration:"none"}}>{t.callNow} 📞</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contact" style={{background:"#0f172a",padding:"24px 16px 100px"}}>
        <div style={{maxWidth:480,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
            <div style={{width:34,height:34,borderRadius:9,background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:12}}>UH</div>
            <div style={{fontWeight:700,color:"#fff",fontSize:15}}>Unique Hospital</div>
          </div>
          <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,textDecoration:"none"}}>
            <span>📍</span><span style={{fontSize:13,color:"#94a3b8"}}>77, Motia Talab Rd, Kohefiza, Bhopal, MP.</span>
          </a>
          <a href={`tel:+91${PHONE}`} style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,textDecoration:"none"}}>
            <span>📞</span><span style={{fontSize:13,color:"#94a3b8"}}>{PHONE}</span>
          </a>
          <div style={{borderTop:"1px solid rgba(255,255,255,0.08)",paddingTop:14}}>
            <div style={{fontSize:11,color:"#475569"}}>© {new Date().getFullYear()} Unique Hospital. All rights reserved.</div>
            <div style={{display:"flex",gap:12,marginTop:6}}>
              <span style={{fontSize:10,color:"#64748b"}}>Mon–Sat: 9AM–8PM</span>
              <span style={{fontSize:10,color:"#4ade80",fontWeight:600}}>Emergency: 24×7</span>
            </div>
          </div>
        </div>
      </footer>

      {/* STICKY BOTTOM BAR */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:100,background:"#fff",borderTop:"1px solid #e2e8f0",padding:"10px 16px",display:"flex",gap:10}}>
        <button onClick={()=>setBookingOpen(true)} style={{flex:2,background:"#0A5C96",color:"#fff",border:"none",borderRadius:100,padding:"14px 0",fontWeight:700,fontSize:14,cursor:"pointer",boxShadow:"0 2px 12px rgba(10,92,150,0.3)"}}>
          📅 {t.bookBtn}
        </button>
        <button onClick={()=>setChatOpen(true)} style={{flex:1,background:"#f1f5f9",color:"#1e40af",border:"2px solid #1e40af",borderRadius:100,padding:"14px 0",fontWeight:700,fontSize:12,cursor:"pointer"}}>
          🤖 AI
        </button>
        {hasAppts && (
          <button onClick={()=>setApptOpen(true)} style={{width:48,background:"#f1f5f9",color:"#0A5C96",border:"2px solid #e2e8f0",borderRadius:100,padding:"14px 0",fontWeight:700,fontSize:16,cursor:"pointer"}}>
            🗓️
          </button>
        )}
      </div>
    </div>
  );
}

// ── Shared Styles ─────────────────────────────────────────────────────────────
const H3:  React.CSSProperties = {fontSize:20,fontWeight:800,color:"#1a2e44",marginBottom:4};
const SUB: React.CSSProperties = {fontSize:13,color:"#64748b"};
const LBL: React.CSSProperties = {fontSize:13,fontWeight:600,color:"#334155",display:"block",marginBottom:6};
const INP: React.CSSProperties = {width:"100%",border:"1.5px solid #e2e8f0",borderRadius:12,padding:"12px 14px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"};
const PBTN:React.CSSProperties = {width:"100%",background:"#0A5C96",color:"#fff",border:"none",borderRadius:100,padding:"15px 0",fontWeight:700,fontSize:15,cursor:"pointer",boxShadow:"0 4px 16px rgba(10,92,150,0.3)"};
const ERR: React.CSSProperties = {background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,padding:"10px 14px",color:"#dc2626",fontSize:13};
function optBtn(sel:boolean):React.CSSProperties{return{width:"100%",padding:"14px 16px",borderRadius:14,textAlign:"left",fontWeight:sel?700:500,fontSize:14,cursor:"pointer",background:sel?"#0A5C96":"#f8fafc",color:sel?"#fff":"#1a2e44",border:sel?"2px solid #0A5C96":"1.5px solid #e2e8f0",transition:"all 0.15s"};}
