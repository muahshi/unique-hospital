"use client";
import { useState } from "react";

// --- COMPONENTS DEFINED LOCALLY (No imports needed) ---

const EasyBooking = ({ onClose }: { onClose: () => void }) => (
  <div style={{ position: "fixed", inset: 0, background: "white", zIndex: 100, padding: 20 }}>
    <button onClick={onClose} style={{ marginBottom: 20 }}>⬅️ Back</button>
    <h2 style={{ fontSize: 24, fontWeight: 800 }}>Booking Form</h2>
    <p>5-Step Booking UI yahan build karein...</p>
  </div>
);

const AIChat = ({ onClose }: { onClose: () => void }) => (
  <div style={{ position: "fixed", inset: 0, background: "#f8fafc", zIndex: 100, padding: 20 }}>
    <button onClick={onClose} style={{ marginBottom: 20 }}>⬅️ Back</button>
    <h2 style={{ fontSize: 24, fontWeight: 800 }}>AI Assistant</h2>
    <p>Chat logic yahan build karein...</p>
  </div>
);

// --- MAIN HOME PAGE ---

const PHONE   = "919575877759";
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
      <nav style={{ position:"sticky", top:0, zIndex:50, background:"#fff", borderBottom:"1px solid #e8f0f8" }}>
        <div style={{ maxWidth:480, margin:"0 auto", padding:"0 16px", height:58, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"#0A5C96", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:13 }}>UH</div>
            <div>
              <div style={{ fontWeight:700, color:"#0A5C96", fontSize:16 }}>Unique Hospital</div>
              <div style={{ fontSize:9, color:"#94a3b8", textTransform:"uppercase" }}>Bhopal, M.P.</div>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section style={{ background:"linear-gradient(135deg,#deeefa,#c8e3f5)", padding:"40px 20px" }}>
        <div style={{ maxWidth:480, margin:"0 auto", textAlign:"center" }}>
          <h1 style={{ fontSize:26, fontWeight:900, marginBottom:10, color:"#0A5C96" }}>ORTHOPEDIC EXCELLENCE</h1>
          <p style={{ marginBottom:20 }}>Compassionate Care, Smart Technology.</p>
          <button onClick={() => setBookingOpen(true)} style={{ background:"#0A5C96", color:"#fff", padding:"13px 20px", borderRadius:100, border:"none", fontWeight:700, cursor:"pointer" }}>
            📅 Appointment Book Karein
          </button>
        </div>
      </section>

      {/* STICKY BOTTOM BAR */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:100, background:"#fff", borderTop:"1px solid #e2e8f0", padding:"12px 16px", display:"flex", gap:10, maxWidth:480, margin:"0 auto" }}>
        <button onClick={() => setBookingOpen(true)} style={{ flex:2, background:"#0A5C96", color:"#fff", borderRadius:100, padding:"14px 0", border:"none", fontWeight:700, cursor:"pointer" }}>
          📅 Book Appointment
        </button>
        <button onClick={() => setChatOpen(true)} style={{ flex:1, background:"#f1f5f9", color:"#0A5C96", borderRadius:100, padding:"14px 0", border:"2px solid #0A5C96", fontWeight:700, cursor:"pointer" }}>
          🤖 AI Chat
        </button>
      </div>

    </div>
  );
}
