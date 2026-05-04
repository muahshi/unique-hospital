"use client";
import { useState, useRef, useEffect } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

interface Msg { role: "user" | "assistant"; content: string; }

const QUICK_QUESTIONS = [
  "Knee mein dard hai, kya karna chahiye?",
  "Joint replacement surgery mein kitna time lagta hai?",
  "OPD timing kya hai?",
  "Doctor se milne ki fees kitni hai?",
  "Physiotherapy available hai?",
];

export default function AIChat({ onClose }: { onClose: () => void }) {
  const [msgs, setMsgs]     = useState<Msg[]>([{
    role:"assistant",
    content:"Namaste! 🙏 Main Unique Hospital ka AI Health Assistant hoon.\n\nAap mujhse apne symptoms, treatment options, ya hospital ke baare mein kuch bhi pooch sakte hain.\n\n⚠️ Appointment book karne ke liye neeche ka **\"Book Appointment\"** button use karein."
  }]);
  const [input, setInput]   = useState("");
  const [loading, setLoading]= useState(false);
  const [sessionId]         = useState(() => `chat_${Date.now()}`);
  const bottomRef           = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs]);

  async function send(text?: string) {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");
    setMsgs(p => [...p, { role:"user", content:msg }]);
    setLoading(true);
    const history = msgs.map(m => ({ role:m.role, content:m.content }));
    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ session_id:sessionId, message:msg, history }),
      });
      const data = await res.json();
      let reply = (data.reply || "Kuch problem aayi. Please dobara try karein.")
        .replace(/<booking_data>[\s\S]*?<\/booking_data>/g,"").trim();
      setMsgs(p => [...p, { role:"assistant", content:reply }]);
      if (data.emergency) {
        setMsgs(p => [...p, { role:"assistant", content:"🚨 Yeh emergency lag rahi hai! Kripya abhi **Call karein** ya seedha Emergency mein aayein. Doctor ko alert bhej diya gaya hai." }]);
      }
    } catch {
      setMsgs(p => [...p, { role:"assistant", content:"Network error. Please try again." }]);
    } finally { setLoading(false); }
  }

  return (
    <div style={{ position:"fixed", inset:0, zIndex:1000, background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div style={{ width:"100%", maxWidth:480, height:"88vh", background:"#fff", borderRadius:"24px 24px 0 0", display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Header */}
        <div style={{ background:"linear-gradient(135deg,#1e40af,#3b82f6)", padding:"16px 20px", display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:38, height:38, borderRadius:"50%", background:"rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🤖</div>
          <div style={{ flex:1 }}>
            <div style={{ color:"#fff", fontWeight:700, fontSize:15 }}>AI Health Assistant</div>
            <div style={{ color:"rgba(255,255,255,0.75)", fontSize:11 }}>Symptoms · Treatment · Hospital Info</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.8)", fontSize:22, cursor:"pointer" }}>✕</button>
        </div>

        {/* Quick Questions (only at start) */}
        {msgs.length === 1 && (
          <div style={{ padding:"12px 16px", borderBottom:"1px solid #f1f5f9" }}>
            <div style={{ fontSize:11, color:"#94a3b8", marginBottom:8, fontWeight:600 }}>JALDI POOCHEIN:</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {QUICK_QUESTIONS.map(q => (
                <button key={q} onClick={() => send(q)} style={{
                  background:"#f0f7ff", border:"1px solid #bae6fd", borderRadius:100,
                  padding:"6px 12px", fontSize:11, color:"#0369a1", cursor:"pointer", fontWeight:500
                }}>{q}</button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div style={{ flex:1, overflowY:"auto", padding:"16px", display:"flex", flexDirection:"column", gap:10 }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start" }}>
              <div style={{
                maxWidth:"82%", padding:"10px 14px", fontSize:14, lineHeight:1.6, whiteSpace:"pre-wrap",
                borderRadius: m.role==="user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: m.role==="user" ? "#1e40af" : "#f1f5f9",
                color: m.role==="user" ? "#fff" : "#1a2e44",
              }}>{m.content}</div>
            </div>
          ))}
          {loading && (
            <div style={{ display:"flex", gap:5, padding:"8px 14px" }}>
              {[0,1,2].map(i => <div key={i} style={{ width:8, height:8, borderRadius:"50%", background:"#94a3b8", animation:`bop 1.2s ${i*0.2}s infinite` }}/>)}
            </div>
          )}
          <div ref={bottomRef}/>
        </div>

        {/* Note */}
        <div style={{ padding:"8px 16px", background:"#fffbeb", borderTop:"1px solid #fef3c7", fontSize:11, color:"#92400e", textAlign:"center" }}>
          💡 Appointment book karne ke liye neeche wala button use karein
        </div>

        {/* Input */}
        <div style={{ padding:"12px 16px", borderTop:"1px solid #f1f5f9", display:"flex", gap:8, background:"#fff" }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==="Enter" && send()}
            placeholder="Apna sawaal likhein..."
            style={{ flex:1, border:"1.5px solid #e2e8f0", borderRadius:100, padding:"10px 16px", fontSize:14, outline:"none", fontFamily:"inherit" }}/>
          <button onClick={() => send()} disabled={loading || !input.trim()}
            style={{ background:"#1e40af", color:"#fff", border:"none", borderRadius:"50%", width:42, height:42, fontSize:18, cursor:"pointer", opacity:(loading||!input.trim())?0.4:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
            ➤
          </button>
        </div>
      </div>
      <style>{`@keyframes bop{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-7px)}}`}</style>
    </div>
  );
}

