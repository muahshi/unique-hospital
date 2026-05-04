"use client";
import { useState, useRef, useEffect } from "react";

const PHONE = "919575877759";
const WA_NOTIFY_MSG = encodeURIComponent("Namaste! Mujhe appointment details chahiye.");
const WA_URL = `https://wa.me/${PHONE}?text=${WA_NOTIFY_MSG}`;
const MAPS_URL = "https://maps.google.com/?q=Unique+Hospital+77+Motia+Talab+Rd+Kohefiza+Bhopal";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChatMsg { role: "user" | "assistant"; content: string; }

// ─── SVG Icons ───────────────────────────────────────────────────────────────
function IconArthroscopy() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <circle cx="20" cy="26" r="13" fill="#EBF5FF" stroke="#4A90D9" strokeWidth="1.8"/>
      <ellipse cx="20" cy="26" rx="6" ry="9" fill="#C8E0F8" stroke="#4A90D9" strokeWidth="1.5"/>
      <line x1="20" y1="17" x2="20" y2="35" stroke="#4A90D9" strokeWidth="1.2" strokeDasharray="2 2"/>
      <rect x="28" y="6" width="4" height="20" rx="2" fill="#4A90D9" transform="rotate(30 28 6)"/>
    </svg>
  );
}
function IconJointReplacement() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <ellipse cx="22" cy="14" rx="9" ry="10" fill="#EBF5FF" stroke="#4A90D9" strokeWidth="1.8"/>
      <ellipse cx="22" cy="34" rx="9" ry="10" fill="#EBF5FF" stroke="#4A90D9" strokeWidth="1.8"/>
      <rect x="17" y="21" width="10" height="6" rx="2" fill="#0A5C96"/>
    </svg>
  );
}
function IconEmergency() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <rect x="4" y="20" width="32" height="18" rx="4" fill="#FFF0F0" stroke="#E53E3E" strokeWidth="1.8"/>
      <line x1="22" y1="27" x2="22" y2="31" stroke="#E53E3E" strokeWidth="2" strokeLinecap="round"/>
      <line x1="20" y1="29" x2="24" y2="29" stroke="#E53E3E" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
function IconDiagnostics() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <rect x="6" y="4" width="28" height="34" rx="3" fill="#EBF5FF" stroke="#4A90D9" strokeWidth="1.8"/>
      <ellipse cx="20" cy="21" rx="5" ry="8" fill="none" stroke="#0A5C96" strokeWidth="1.2"/>
    </svg>
  );
}

const services = [
  { id:"a", Icon:IconArthroscopy,      title:"Arthroscopy",       desc:"Minimally invasive joint surgeries." },
  { id:"j", Icon:IconJointReplacement, title:"Joint Replacement", desc:"Complete hip & knee replacements." },
  { id:"e", Icon:IconEmergency,        title:"Emergency Care",    desc:"24/7 critical orthopedic support." },
  { id:"d", Icon:IconDiagnostics,      title:"Diagnostics",       desc:"Advanced imaging & analysis." },
];

// ─── AI Chat Component ────────────────────────────────────────────────────────
function AIChatBooking({ onClose }: { onClose: () => void }) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    { role: "assistant", content: "Namaste! 🙏 Main Unique Hospital ka AI receptionist hoon.\n\nKya aap appointment book karna chahte hain? Mujhe batayein aur main step-by-step help karunga!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [bookingDone, setBookingDone] = useState(false);
  const [sessionId] = useState(() => `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMsgs(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    const history = msgs.map(m => ({ role: m.role, content: m.content }));
    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message: userMsg, history }),
      });
      const data = await res.json();
      const reply = data.reply || "Kuch problem aayi. Kripya dobara try karein.";
      // Clean <booking_data>...</booking_data> from displayed reply
      const cleanReply = reply.replace(/<booking_data>[\s\S]*?<\/booking_data>/g, "").trim();
      setMsgs(prev => [...prev, { role: "assistant", content: cleanReply }]);
      if (data.booking_saved) setBookingDone(true);
      if (data.emergency) {
        setMsgs(prev => [...prev, {
          role: "assistant",
          content: "🚨 Emergency detected! Doctor ko alert bhej diya gaya hai. Kripya turant 📞 Call karein ya Emergency mein aayein!"
        }]);
      }
    } catch {
      setMsgs(prev => [...prev, { role: "assistant", content: "Network error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.55)", display: "flex",
      alignItems: "flex-end", justifyContent: "center"
    }}>
      <div style={{
        width: "100%", maxWidth: 480, height: "85vh",
        background: "#fff", borderRadius: "20px 20px 0 0",
        display: "flex", flexDirection: "column", overflow: "hidden"
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg,#0A5C96,#1a7bc4)",
          padding: "16px 20px", display: "flex", alignItems: "center", gap: 12
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: "50%",
            background: "rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18
          }}>🤖</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>AI Receptionist</div>
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 11 }}>
              {bookingDone ? "✅ Booking Confirmed!" : "Appointment Book Karein"}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: "#fff",
            fontSize: 22, cursor: "pointer", padding: "0 4px"
          }}>✕</button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}>
          {msgs.map((m, i) => (
            <div key={i} style={{
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start"
            }}>
              <div style={{
                maxWidth: "80%",
                background: m.role === "user" ? "#0A5C96" : "#f1f5f9",
                color: m.role === "user" ? "#fff" : "#1a2e44",
                borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                padding: "10px 14px", fontSize: 14, lineHeight: 1.5,
                whiteSpace: "pre-wrap",
              }}>{m.content}</div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", gap: 6, padding: "8px 14px" }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: "50%", background: "#94a3b8",
                  animation: `bounce 1.2s ${i*0.2}s infinite`
                }}/>
              ))}
            </div>
          )}
          <div ref={bottomRef}/>
        </div>

        {/* Input */}
        {!bookingDone ? (
          <div style={{
            padding: "12px 16px", borderTop: "1px solid #f1f5f9",
            display: "flex", gap: 10, alignItems: "center",
            background: "#fff"
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Apna jawab likhein..."
              style={{
                flex: 1, border: "1.5px solid #e2e8f0", borderRadius: 100,
                padding: "10px 16px", fontSize: 14, outline: "none",
                fontFamily: "inherit"
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                background: "#0A5C96", color: "#fff",
                border: "none", borderRadius: "50%",
                width: 42, height: 42, fontSize: 18,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
                display: "flex", alignItems: "center", justifyContent: "center"
              }}
            >➤</button>
          </div>
        ) : (
          <div style={{ padding: "16px", background: "#f0fdf4", textAlign: "center" }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>✅</div>
            <div style={{ fontWeight: 700, color: "#16a34a", fontSize: 14 }}>Appointment Booked!</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>WhatsApp confirmation bhej di gayi hai.</div>
            <button onClick={onClose} style={{
              marginTop: 12, background: "#0A5C96", color: "#fff",
              border: "none", borderRadius: 100, padding: "10px 24px",
              fontSize: 13, fontWeight: 600, cursor: "pointer"
            }}>Done</button>
          </div>
        )}
      </div>
      <style>{`
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-8px)} }
      `}</style>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div style={{ fontFamily:"'DM Sans', sans-serif", background:"#fff", minHeight:"100vh", color:"#1a2e44" }}>

      {/* AI Chat Modal */}
      {chatOpen && <AIChatBooking onClose={() => setChatOpen(false)} />}

      {/* ── NAVBAR ───────────────────────────────────────────────────── */}
      <nav style={{
        position:"sticky", top:0, zIndex:50,
        background:"#fff", borderBottom:"1px solid #e8f0f8",
        boxShadow:"0 1px 8px rgba(10,92,150,0.06)"
      }}>
        <div style={{ maxWidth:480, margin:"0 auto", padding:"0 16px", height:58, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#0A5C96,#1a7bc4)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:13 }}>UH</div>
            <div style={{ lineHeight:1.2 }}>
              <div style={{ fontWeight:700, color:"#0A5C96", fontSize:16 }}>Unique Hospital</div>
              <div style={{ fontSize:9, color:"#94a3b8", letterSpacing:"0.12em", textTransform:"uppercase" }}>Bhopal, M.P.</div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:4, border:"1px solid #e2e8f0", borderRadius:8, padding:"4px 8px", background:"#f8fafc" }}>
              <span style={{ fontWeight:900, fontSize:11, color:"#7c3aed" }}>PWA</span>
              <span style={{ fontSize:9, color:"#94a3b8" }}>Installed</span>
            </div>
            <button onClick={() => setMenuOpen(!menuOpen)} style={{ background:"none", border:"none", cursor:"pointer", padding:4 }} aria-label="Menu">
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                {[0,1,2].map(i => (
                  <span key={i} style={{ display:"block", width:20, height:2, background:"#334155", borderRadius:2, transition:"all 0.2s",
                    transform: menuOpen&&i===0?"rotate(45deg) translate(4px,4px)":menuOpen&&i===2?"rotate(-45deg) translate(4px,-4px)":"none",
                    opacity: menuOpen&&i===1?0:1 }}/>
                ))}
              </div>
            </button>
          </div>
        </div>
        {menuOpen && (
          <div style={{ borderTop:"1px solid #f1f5f9", background:"#fff", padding:"8px 16px 16px" }}>
            {["Services","About","Contact"].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMenuOpen(false)} style={{ display:"block", padding:"12px 0", borderBottom:"1px solid #f8fafc", color:"#334155", textDecoration:"none", fontSize:14, fontWeight:500 }}>{item}</a>
            ))}
            <button onClick={() => { setMenuOpen(false); setChatOpen(true); }} style={{
              display:"block", width:"100%", marginTop:12, background:"#0A5C96",
              color:"#fff", textAlign:"center", padding:"12px 0",
              borderRadius:100, fontWeight:700, fontSize:14, border:"none", cursor:"pointer"
            }}>🤖 Book via AI Chat</button>
          </div>
        )}
      </nav>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section style={{ background:"linear-gradient(135deg,#deeefa 0%,#c8e3f5 60%,#b8d9f2 100%)", overflow:"hidden", position:"relative" }}>
        <div style={{ maxWidth:480, margin:"0 auto", display:"flex", alignItems:"flex-end", minHeight:300, position:"relative" }}>
          <div style={{ flex:1, padding:"28px 20px 28px", zIndex:2 }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:5, background:"rgba(10,92,150,0.1)", borderRadius:100, padding:"4px 10px", marginBottom:12 }}>
              <span style={{ fontSize:8 }}>✦</span>
              <span style={{ fontSize:10, fontWeight:600, color:"#0A5C96", letterSpacing:"0.05em" }}>Bhopal's Trusted Ortho Centre</span>
            </div>
            <h1 style={{ fontSize:26, fontWeight:900, lineHeight:1.15, marginBottom:10, color:"#0A5C96" }}>
              ORTHOPEDIC<br/><span style={{ color:"#1a2e44" }}>EXCELLENCE</span><br/><span style={{ color:"#0A5C96" }}>IN BHOPAL</span>
            </h1>
            <p style={{ fontSize:15, color:"#334155", lineHeight:1.5, marginBottom:22 }}>Compassionate Care,<br/>Smart Technology.</p>

            {/* PRIMARY CTA — AI Booking */}
            <button onClick={() => setChatOpen(true)} style={{
              display:"inline-flex", alignItems:"center", gap:8,
              background:"#0A5C96", color:"#fff",
              padding:"13px 20px", borderRadius:100,
              fontWeight:700, fontSize:13, border:"none", cursor:"pointer",
              boxShadow:"0 4px 16px rgba(10,92,150,0.35)",
              marginBottom:10
            }}>
              🤖 Book Appointment (AI Chat)
            </button>
            <br/>
            <a href="#services" style={{ display:"inline-flex", alignItems:"center", gap:6, border:"1.5px solid #0A5C96", color:"#0A5C96", padding:"10px 18px", borderRadius:100, fontWeight:600, fontSize:13, textDecoration:"none", marginTop:4 }}>
              View All Services →
            </a>
          </div>
          <div style={{ width:155, flexShrink:0, alignSelf:"stretch", position:"relative", overflow:"hidden" }}>
            <img src="/hero_doctor.png" alt="Orthopedic Specialist" style={{ position:"absolute", bottom:0, right:0, height:"100%", width:"auto", maxWidth:"none", objectFit:"cover", objectPosition:"top center" }}
              onError={(e) => { (e.target as HTMLImageElement).style.display="none"; }}
            />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
      <section style={{ background:"#f8fafc", padding:"24px 16px" }}>
        <div style={{ maxWidth:480, margin:"0 auto" }}>
          <h2 style={{ fontSize:18, fontWeight:800, marginBottom:4, color:"#1a2e44" }}>Book in 3 Simple Steps</h2>
          <p style={{ fontSize:12, color:"#64748b", marginBottom:16 }}>No phone calls. No waiting. AI handles everything.</p>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {[
              { n:"1", title:"Chat with AI", desc:"Apni symptoms aur preference batayein." },
              { n:"2", title:"AI Confirms Slot", desc:"Data Supabase + Google Sheets mein save hota hai." },
              { n:"3", title:"WhatsApp Confirmation", desc:"Instantly confirmation + reminder milega." },
            ].map((s,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:14, background:"#fff", borderRadius:14, padding:"14px 16px", border:"1px solid #e2e8f0" }}>
                <div style={{ width:32, height:32, borderRadius:"50%", background:"#0A5C96", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:14, flexShrink:0 }}>{s.n}</div>
                <div>
                  <div style={{ fontWeight:700, fontSize:14, color:"#1a2e44", marginBottom:2 }}>{s.title}</div>
                  <div style={{ fontSize:12, color:"#64748b" }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setChatOpen(true)} style={{
            width:"100%", marginTop:16, background:"#0A5C96", color:"#fff",
            border:"none", borderRadius:100, padding:"14px 0",
            fontWeight:700, fontSize:14, cursor:"pointer",
            boxShadow:"0 4px 16px rgba(10,92,150,0.25)"
          }}>🤖 Start AI Booking Now</button>
        </div>
      </section>

      {/* ── SERVICES ──────────────────────────────────────────────────── */}
      <section id="services" style={{ background:"#fff", padding:"24px 16px" }}>
        <div style={{ maxWidth:480, margin:"0 auto" }}>
          <h2 style={{ fontSize:20, fontWeight:800, marginBottom:16, color:"#1a2e44" }}>Quick Services</h2>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {services.map(({ id, Icon, title, desc }) => (
              <div key={id} style={{ background:"#fff", border:"1px solid #e8f0f8", borderRadius:16, padding:"16px 14px", boxShadow:"0 1px 6px rgba(10,92,150,0.05)" }}>
                <div style={{ marginBottom:10 }}><Icon /></div>
                <div style={{ fontWeight:700, fontSize:14, marginBottom:4, color:"#1a2e44" }}>{title}</div>
                <div style={{ fontSize:12, color:"#64748b", lineHeight:1.5 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHATSAPP (Notifications only) ─────────────────────────────── */}
      <section style={{ background:"#f0f9f4", padding:"20px 16px" }}>
        <div style={{ maxWidth:480, margin:"0 auto" }}>
          <div style={{ fontSize:12, color:"#64748b", textAlign:"center", marginBottom:10 }}>
            💬 WhatsApp sirf notifications ke liye — confirmations & reminders
          </div>
          <a href={WA_URL} target="_blank" rel="noopener noreferrer" style={{
            display:"flex", alignItems:"center", justifyContent:"center", gap:10,
            background:"#25D366", color:"#fff", padding:"14px 20px", borderRadius:100,
            fontWeight:700, fontSize:14, textDecoration:"none",
            boxShadow:"0 4px 20px rgba(37,211,102,0.3)"
          }}>
            <svg width="18" height="18" fill="white" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            WhatsApp Alerts Subscribe
          </a>
        </div>
      </section>

      {/* ── WHY US ────────────────────────────────────────────────────── */}
      <section id="about" style={{ background:"#fff", padding:"24px 16px" }}>
        <div style={{ maxWidth:480, margin:"0 auto" }}>
          <h2 style={{ fontSize:20, fontWeight:800, marginBottom:4, color:"#1a2e44" }}>Bhopal's Most Trusted</h2>
          <p style={{ fontSize:13, color:"#64748b", marginBottom:16 }}>Orthopedic & Multi-Specialty Care in the heart of Bhopal, MP.</p>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {[
              { icon:"🏥", title:"State-of-the-Art OT", desc:"Modular operation theatres with latest arthroscopic equipment." },
              { icon:"👨‍⚕️", title:"Expert Surgeons", desc:"Fellowship-trained orthopedic specialists with 15+ years experience." },
              { icon:"🤖", title:"AI-Powered Booking", desc:"Book appointments via AI chat. Data saved to Supabase + Google Sheets instantly." },
              { icon:"📱", title:"WhatsApp Alerts", desc:"Auto confirmation, pre-appointment reminder & emergency alerts." },
            ].map((item, i) => (
              <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:14, background:"#f8fafc", borderRadius:14, padding:"14px 16px", border:"1px solid #f1f5f9" }}>
                <span style={{ fontSize:26, lineHeight:1 }}>{item.icon}</span>
                <div>
                  <div style={{ fontWeight:700, fontSize:14, marginBottom:3, color:"#1a2e44" }}>{item.title}</div>
                  <div style={{ fontSize:12, color:"#64748b", lineHeight:1.5 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────── */}
      <section style={{ background:"#0A5C96", padding:"20px 16px" }}>
        <div style={{ maxWidth:480, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", textAlign:"center", gap:8 }}>
          {[{n:"5000+",l:"Surgeries"},{n:"15+",l:"Years Exp"},{n:"24/7",l:"Emergency"},{n:"98%",l:"Success"}].map((s,i) => (
            <div key={i}>
              <div style={{ fontSize:18, fontWeight:800, color:"#fff" }}>{s.n}</div>
              <div style={{ fontSize:9, color:"#93c5fd", marginTop:2 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── EMERGENCY STRIP ───────────────────────────────────────────── */}
      <section style={{ background:"#dc2626", padding:"14px 16px" }}>
        <div style={{ maxWidth:480, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
          <div>
            <div style={{ fontWeight:700, color:"#fff", fontSize:14 }}>🚨 Medical Emergency?</div>
            <div style={{ fontSize:11, color:"#fecaca", marginTop:2 }}>Our trauma team is available 24/7</div>
          </div>
          <a href={`tel:+91${PHONE}`} style={{ background:"#fff", color:"#dc2626", padding:"9px 16px", borderRadius:100, fontWeight:700, fontSize:12, textDecoration:"none", whiteSpace:"nowrap" }}>📞 Call Now</a>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer id="contact" style={{ background:"#0f172a", padding:"24px 16px 32px" }}>
        <div style={{ maxWidth:480, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:12 }}>UH</div>
            <div style={{ fontWeight:700, color:"#fff", fontSize:15 }}>Unique Hospital</div>
          </div>
          <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10, textDecoration:"none" }}>
            <span style={{ fontSize:16 }}>📍</span>
            <span style={{ fontSize:13, color:"#94a3b8", lineHeight:1.4 }}>77, Motia Talab Rd, Kohefiza, Bhopal, MP.</span>
            <span style={{ fontSize:18, marginLeft:"auto" }}>🗺️</span>
          </a>
          <a href={`tel:+91${PHONE}`} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16, textDecoration:"none" }}>
            <span style={{ fontSize:16 }}>📞</span>
            <span style={{ fontSize:13, color:"#94a3b8" }}>{PHONE}</span>
          </a>
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.08)", paddingTop:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
              <div style={{ fontSize:11, color:"#475569" }}>© {new Date().getFullYear()} Unique Hospital. All rights reserved.</div>
              <div style={{ display:"flex", gap:12 }}>
                {["Mon–Sat: 9AM–8PM","Emergency: 24×7"].map((t,i) => (
                  <span key={i} style={{ fontSize:10, color:i===1?"#4ade80":"#64748b", fontWeight:i===1?600:400 }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating AI Chat Button */}
      <button
        onClick={() => setChatOpen(true)}
        style={{
          position:"fixed", bottom:24, right:20, zIndex:999,
          background:"linear-gradient(135deg,#0A5C96,#1a7bc4)",
          color:"#fff", border:"none", borderRadius:"50%",
          width:60, height:60, fontSize:26, cursor:"pointer",
          boxShadow:"0 6px 24px rgba(10,92,150,0.45)",
          display:"flex", alignItems:"center", justifyContent:"center"
        }}
        aria-label="Book Appointment"
      >🤖</button>
    </div>
  );
}
