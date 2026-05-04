"use client";
import { useState } from "react";

// --- COMPONENTS INLINED TO FIX BUILD ERROR ---
const EasyBooking = ({ onClose }: { onClose: () => void }) => (
  <div style={{ position: "fixed", inset: 0, background: "#fff", zIndex: 1000, padding: 20 }}>
    <button onClick={onClose} style={{ marginBottom: 20, cursor: 'pointer' }}>⬅️ Back</button>
    <h2 style={{ fontSize: 24, fontWeight: 800 }}>Easy Booking</h2>
    <p>Booking logic yahan ayega...</p>
  </div>
);

const AIChat = ({ onClose }: { onClose: () => void }) => (
  <div style={{ position: "fixed", inset: 0, background: "#f8fafc", zIndex: 1000, padding: 20 }}>
    <button onClick={onClose} style={{ marginBottom: 20, cursor: 'pointer' }}>⬅️ Back</button>
    <h2 style={{ fontSize: 24, fontWeight: 800 }}>AI Chat</h2>
    <p>Chat logic yahan ayega...</p>
  </div>
);

// --- MAIN PAGE CODE ---
const PHONE   = "919575877759";
const WA_URL  = `https://wa.me/${PHONE}?text=${encodeURIComponent("Namaste! Mujhe appointment book karni hai.")}`;
const MAPS_URL= "https://maps.google.com/?q=Unique+Hospital+77+Motia+Talab+Rd+Kohefiza+Bhopal";

const services = [
  { icon:"🦴", title:"Arthroscopy",       desc:"Minimally invasive joint surgeries." },
  { icon:"🦿", title:"Joint Replacement", desc:"Complete hip & knee replacements." },
  { icon:"🚨", title:"Emergency Care",    desc:"24/7 critical orthopedic support." },
  { icon:"🔬", title:"Diagnostics",       desc:"Advanced imaging & analysis." },
];

export default function Home() {
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [chatOpen,    setChatOpen]    = useState(false);

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:"#fff", minHeight:"100vh", color:"#1a2e44" }}>

      {bookingOpen && <EasyBooking onClose={() => setBookingOpen(false)} />}
      {chatOpen    && <AIChat      onClose={() => setChatOpen(false)} />}

      {/* NAVBAR */}
      <nav style={{ position:"sticky", top:0, zIndex:50, background:"#fff", borderBottom:"1px solid #e8f0f8", boxShadow:"0 1px 8px rgba(10,92,150,0.06)" }}>
        <div style={{ maxWidth:480, margin:"0 auto", padding:"0 16px", height:58, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#0A5C96,#1a7bc4)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:13 }}>UH</div>
            <div>
              <div style={{ fontWeight:700, color:"#0A5C96", fontSize:16 }}>Unique Hospital</div>
              <div style={{ fontSize:9, color:"#94a3b8", letterSpacing:"0.12em", textTransform:"uppercase" }}>Bhopal, M.P.</div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontWeight:900, fontSize:11, color:"#7c3aed", border:"1px solid #e2e8f0", borderRadius:8, padding:"4px 8px" }}>PWA</span>
            <button onClick={() => setMenuOpen(!menuOpen)} style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                {[0,1,2].map(i => <span key={i} style={{ display:"block", width:20, height:2, background:"#334155", borderRadius:2, opacity:menuOpen&&i===1?0:1 }}/>)}
              </div>
            </button>
          </div>
        </div>
        {menuOpen && (
          <div style={{ borderTop:"1px solid #f1f5f9", background:"#fff", padding:"8px 16px 16px" }}>
            {["Services","About","Contact"].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMenuOpen(false)} style={{ display:"block", padding:"12px 0", borderBottom:"1px solid #f8fafc", color:"#334155", textDecoration:"none", fontSize:14, fontWeight:500 }}>{item}</a>
            ))}
          </div>
        )}
      </nav>

      {/* HERO */}
      <section style={{ background:"linear-gradient(135deg,#deeefa,#c8e3f5,#b8d9f2)", overflow:"hidden" }}>
        <div style={{ maxWidth:480, margin:"0 auto", display:"flex", alignItems:"flex-end", minHeight:280, position:"relative" }}>
          <div style={{ flex:1, padding:"28px 20px" }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:5, background:"rgba(10,92,150,0.1)", borderRadius:100, padding:"4px 10px", marginBottom:12 }}>
              <span style={{ fontSize:10, fontWeight:600, color:"#0A5C96" }}>✦ Bhopal's Trusted Ortho Centre</span>
            </div>
            <h1 style={{ fontSize:26, fontWeight:900, lineHeight:1.15, marginBottom:10, color:"#0A5C96" }}>
              ORTHOPEDIC<br/><span style={{ color:"#1a2e44" }}>EXCELLENCE</span><br/>IN BHOPAL
            </h1>
            <p style={{ fontSize:14, color:"#334155", marginBottom:20 }}>Compassionate Care, Smart Technology.</p>

            <button onClick={() => setBookingOpen(true)} style={{
              display:"flex", alignItems:"center", gap:8,
              background:"#0A5C96", color:"#fff",
              padding:"13px 20px", borderRadius:100,
              fontWeight:700, fontSize:14, border:"none", cursor:"pointer",
              boxShadow:"0 4px 16px rgba(10,92,150,0.4)", marginBottom:10, width:"fit-content"
            }}>📅 Appointment Book Karein</button>

            <button onClick={() => setChatOpen(true)} style={{
              display:"flex", alignItems:"center", gap:8,
              background:"#fff", color:"#0A5C96",
              border:"2px solid #0A5C96",
              padding:"11px 18px", borderRadius:100,
              fontWeight:600, fontSize:13, cursor:"pointer", width:"fit-content"
            }}>🤖 Doctor se Sawaal Poochein</button>
          </div>
          <div style={{ width:140, flexShrink:0, alignSelf:"stretch", position:"relative", overflow:"hidden" }}>
             {/* Note: Ensure hero_doctor.png exists in public folder */}
             <img src="/hero_doctor.png" alt="Doctor" style={{ position:"absolute", bottom:0, right:0, height:"100%", width:"auto", objectFit:"cover", objectPosition:"top center" }} onError={(e) => { (e.target as HTMLImageElement).style.display="none"; }}/>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" style={{ background:"#fff", padding:"24px 16px" }}>
        <div style={{ maxWidth:480, margin:"0 auto" }}>
          <h2 style={{ fontSize:20, fontWeight:800, marginBottom:16 }}>Our Services</h2>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {services.map((s,i) => (
              <div key={i} style={{ background:"#f8fafc", border:"1px solid #e8f0f8", borderRadius:16, padding:"16px 14px" }}>
                <div style={{ fontSize:30, marginBottom:8 }}>{s.icon}</div>
                <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{s.title}</div>
                <div style={{ fontSize:12, color:"#64748b", lineHeight:1.5 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section id="about" style={{ background:"#f8fafc", padding:"24px 16px" }}>
        <div style={{ maxWidth:480, margin:"0 auto" }}>
          <h2 style={{ fontSize:20, fontWeight:800, marginBottom:16 }}>Bhopal's Most Trusted</h2>
          {[
            { icon:"🏥", title:"State-of-the-Art OT",   desc:"Modular OTs with latest arthroscopic equipment." },
            { icon:"👨‍⚕️", title:"Expert Surgeons",        desc:"Fellowship-trained, 15+ years experience." },
            { icon:"📱", title:"Smart Booking System",   desc:"Calendar-based booking in under 30 seconds." },
            { icon:"💬", title:"AI Health Assistant",    desc:"Ask symptoms, get guidance before your visit." },
          ].map((item,i) => (
            <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:14, background:"#fff", borderRadius:14, padding:"14px 16px", border:"1px solid #e2e8f0", marginBottom:10 }}>
              <span style={{ fontSize:24 }}>{item.icon}</span>
              <div>
                <div style={{ fontWeight:700, fontSize:14, marginBottom:2 }}>{item.title}</div>
                <div style={{ fontSize:12, color:"#64748b", lineHeight:1.5 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* STATS */}
      <section style={{ background:"#0A5C96", padding:"20px 16px" }}>
        <div style={{ maxWidth:480, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", textAlign:"center", gap:8 }}>
          {[{n:"5000+",l:"Surgeries"},{n:"15+",l:"Years Exp"},{n:"24/7",l:"Emergency"},{n:"98%",l:"Success"}].map((s,i) => (
            <div key={i}><div style={{ fontSize:18, fontWeight:800, color:"#fff" }}>{s.n}</div><div style={{ fontSize:9, color:"#93c5fd", marginTop:2 }}>{s.l}</div></div>
          ))}
        </div>
      </section>

      {/* EMERGENCY */}
      <section style={{ background:"#dc2626", padding:"14px 16px" }}>
        <div style={{ maxWidth:480, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
          <div>
            <div style={{ fontWeight:700, color:"#fff", fontSize:14 }}>🚨 Medical Emergency?</div>
            <div style={{ fontSize:11, color:"#fecaca", marginTop:2 }}>Trauma team available 24/7</div>
          </div>
          <a href={`tel:+91${PHONE}`} style={{ background:"#fff", color:"#dc2626", padding:"9px 16px", borderRadius:100, fontWeight:700, fontSize:12, textDecoration:"none" }}>📞 Call Now</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contact" style={{ background:"#0f172a", padding:"24px 16px 100px" }}>
        <div style={{ maxWidth:480, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:12 }}>UH</div>
            <div style={{ fontWeight:700, color:"#fff", fontSize:15 }}>Unique Hospital</div>
          </div>
          <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10, textDecoration:"none" }}>
            <span>📍</span><span style={{ fontSize:13, color:"#94a3b8" }}>77, Motia Talab Rd, Kohefiza, Bhopal, MP.</span>
          </a>
          <a href={`tel:+91${PHONE}`} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16, textDecoration:"none" }}>
            <span>📞</span><span style={{ fontSize:13, color:"#94a3b8" }}>{PHONE}</span>
          </a>
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.08)", paddingTop:14 }}>
            <div style={{ fontSize:11, color:"#475569" }}>© {new Date().getFullYear()} Unique Hospital. All rights reserved.</div>
            <div style={{ display:"flex", gap:12, marginTop:6 }}>
              <span style={{ fontSize:10, color:"#64748b" }}>Mon–Sat: 9AM–8PM</span>
              <span style={{ fontSize:10, color:"#4ade80", fontWeight:600 }}>Emergency: 24×7</span>
            </div>
          </div>
        </div>
      </footer>

      {/* STICKY BOTTOM BAR */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:100, background:"#fff", borderTop:"1px solid #e2e8f0", padding:"12px 16px", display:"flex", gap:10, maxWidth:480, margin:"0 auto" }}>
        <button onClick={() => setBookingOpen(true)} style={{
          flex:2, background:"#0A5C96", color:"#fff", border:"none",
          borderRadius:100, padding:"14px 0", fontWeight:700, fontSize:14, cursor:"pointer",
          boxShadow:"0 2px 12px rgba(10,92,150,0.3)"
        }}>📅 Book Appointment</button>
        <button onClick={() => setChatOpen(true)} style={{
          flex:1, background:"#f1f5f9", color:"#0A5C96", border:"2px solid #0A5C96",
          borderRadius:100, padding:"14px 0", fontWeight:700, fontSize:13, cursor:"pointer"
        }}>🤖 AI Chat</button>
      </div>

    </div>
  );
}
