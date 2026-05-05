"use client";
import { useState, useRef, useEffect } from "react";

const PHONE    = "919575877759";
const MAPS_URL = "https://maps.google.com/?q=Unique+Hospital+77+Motia+Talab+Rd+Kohefiza+Bhopal";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

const DEPARTMENTS  = ["Orthopedics","Joint Replacement","Spine Surgery","Trauma Care","General Medicine"];
const TIME_SLOTS   = ["9:00 AM","10:00 AM","11:00 AM","12:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM","6:00 PM","7:00 PM"];
const QUICK_QS     = ["Knee mein dard hai, kya karna chahiye?","Joint replacement mein kitna time lagta hai?","OPD timing kya hai?","Fees kitni hai?","Physiotherapy available hai?"];

type BookStep = "dept"|"date"|"time"|"details"|"confirm"|"done";
interface Msg  { role:"user"|"assistant"; content:string; }

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

// ── EasyBooking Modal ─────────────────────────────────────────────────────────
function EasyBooking({ onClose }: { onClose:()=>void }) {
  const [step,    setStep]    = useState<BookStep>("dept");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [bk, setBk] = useState({ department:"", date:"", dateLabel:"", time:"", name:"", phone:"", email:"" });
  const dates = getAvailableDates();
  const STEPS: BookStep[] = ["dept","date","time","details","confirm","done"];
  const idx      = STEPS.indexOf(step);
  const progress = (idx / (STEPS.length-2)) * 100;

  async function confirm() {
    if (!bk.name.trim() || bk.phone.length < 10) { setError("Sahi naam aur 10 digit phone likhein."); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/book`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ patient_name:bk.name, phone:bk.phone, department:bk.department,
          preferred_date:bk.date, preferred_time:bk.time, email:bk.email||"", symptoms:"", session_id:`easy_${Date.now()}` }),
      });
      const data = await res.json();
      if (data.success) setStep("done");
      else setError("Booking mein problem. Dobara try karein.");
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  }

  return (
    <div style={{position:"fixed",inset:0,zIndex:2000,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div style={{width:"100%",maxWidth:"100%",maxHeight:"92vh",background:"#fff",borderRadius:"24px 24px 0 0",display:"flex",flexDirection:"column",overflow:"hidden"}}>

        {/* Header */}
        <div style={{background:"linear-gradient(135deg,#0A5C96,#1a7bc4)",padding:"16px 20px 12px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <span style={{color:"#fff",fontWeight:700,fontSize:16}}>📅 Appointment Book Karein</span>
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
          <button onClick={() => setStep(STEPS[idx-1])} style={{textAlign:"left",padding:"10px 20px",background:"none",border:"none",color:"#64748b",fontSize:13,cursor:"pointer"}}>← Wapas</button>
        )}

        {/* Content */}
        <div style={{flex:1,overflowY:"auto",padding:"16px 20px 40px"}}>

          {/* STEP: dept */}
          {step==="dept" && <>
            <h3 style={H3}>Kaunsa Department?</h3>
            <p style={SUB}>Apna department chunein 👇</p>
            <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:16}}>
              {DEPARTMENTS.map(d => (
                <button key={d} onClick={() => { setBk(b=>({...b,department:d})); setStep("date"); }} style={optBtn(bk.department===d)}>{d}</button>
              ))}
            </div>
          </>}

          {/* STEP: date */}
          {step==="date" && <>
            <h3 style={H3}>Kaunsa Din?</h3>
            <p style={SUB}>{bk.department} · Date chunein 👇</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginTop:16}}>
              {dates.map(d => (
                <button key={d.value} onClick={() => { setBk(b=>({...b,date:d.value,dateLabel:d.label})); setStep("time"); }}
                  style={{padding:"12px 8px",borderRadius:14,textAlign:"center",cursor:"pointer",
                    background:bk.date===d.value?"#0A5C96":"#f8fafc",
                    color:bk.date===d.value?"#fff":"#1a2e44",
                    border:bk.date===d.value?"2px solid #0A5C96":"1.5px solid #e2e8f0"}}>
                  <div style={{fontSize:10,color:bk.date===d.value?"#93c5fd":"#64748b",marginBottom:2}}>{d.day}</div>
                  <div style={{fontWeight:700,fontSize:15}}>{d.label}</div>
                </button>
              ))}
            </div>
          </>}

          {/* STEP: time */}
          {step==="time" && <>
            <h3 style={H3}>Kaunsa Samay?</h3>
            <p style={SUB}>{bk.dateLabel} · Time chunein 👇</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:16}}>
              {TIME_SLOTS.map(t => (
                <button key={t} onClick={() => { setBk(b=>({...b,time:t})); setStep("details"); }} style={optBtn(bk.time===t)}>{t}</button>
              ))}
            </div>
          </>}

          {/* STEP: details */}
          {step==="details" && <>
            <h3 style={H3}>Aapki Details</h3>
            <p style={SUB}>{bk.department} · {bk.dateLabel} · {bk.time}</p>
            <div style={{marginTop:20,display:"flex",flexDirection:"column",gap:14}}>
              <div>
                <label style={LBL}>Aapka Naam *</label>
                <input value={bk.name} onChange={e=>setBk(b=>({...b,name:e.target.value}))}
                  placeholder="Pura naam likhein..." style={INP}/>
              </div>
              <div>
                <label style={LBL}>WhatsApp Number *</label>
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:"#64748b",fontSize:14}}>+91</span>
                  <input value={bk.phone} onChange={e=>setBk(b=>({...b,phone:e.target.value.replace(/\D/g,"")}))}
                    placeholder="10 digit" maxLength={10} type="tel" style={{...INP,paddingLeft:44}}/>
                </div>
                <div style={{fontSize:11,color:"#64748b",marginTop:4}}>Confirmation is number par aayegi</div>
              </div>
              <div>
                <label style={LBL}>Email Address <span style={{color:"#94a3b8",fontWeight:400}}>(optional)</span></label>
                <input value={bk.email||""} onChange={e=>setBk(b=>({...b,email:e.target.value}))}
                  placeholder="aapki@email.com" type="email" style={INP}/>
                <div style={{fontSize:11,color:"#64748b",marginTop:4}}>Confirmation email bhi aayegi</div>
              </div>
              {error && <div style={ERR}>{error}</div>}
              <button onClick={() => { if(!bk.name.trim()||bk.phone.length<10){setError("Naam aur phone zaroori hai.");return;} setError(""); setStep("confirm"); }}
                style={{...PBTN,opacity:(!bk.name.trim()||bk.phone.length<10)?0.4:1}}>Aage Badho →</button>
            </div>
          </>}

          {/* STEP: confirm */}
          {step==="confirm" && <>
            <h3 style={H3}>Confirm Karein</h3>
            <div style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:16,padding:20,marginTop:16}}>
              {[["Department",bk.department],["Date",bk.dateLabel],["Time",bk.time],["Patient",bk.name],["WhatsApp",`+91 ${bk.phone}`]].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <span style={{fontSize:13,color:"#64748b"}}>{k}</span>
                  <span style={{fontSize:13,fontWeight:700,color:"#0A5C96"}}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{background:"#f0fdf4",borderRadius:12,padding:"10px 14px",marginTop:12,fontSize:12,color:"#16a34a"}}>✅ WhatsApp pe confirmation aayegi</div>
            {error && <div style={{...ERR,marginTop:10}}>{error}</div>}
            <button onClick={confirm} disabled={loading} style={{...PBTN,marginTop:16,opacity:loading?0.6:1}}>
              {loading?"Book ho raha hai...":"✅ Appointment Book Karein"}
            </button>
          </>}

          {/* STEP: done */}
          {step==="done" && (
            <div style={{textAlign:"center",padding:"20px 0"}}>
              <div style={{fontSize:60,marginBottom:16}}>🎉</div>
              <h3 style={{fontSize:22,fontWeight:900,color:"#0A5C96",marginBottom:8}}>Appointment Booked!</h3>
              <p style={{fontSize:14,color:"#64748b",lineHeight:1.6,marginBottom:20}}>WhatsApp par confirmation bhej di gayi hai.<br/>2 ghante pehle reminder bhi aayega.</p>
              <div style={{background:"#f0f9ff",borderRadius:16,padding:20,textAlign:"left",marginBottom:20}}>
                {[["Department",bk.department],["Date",bk.dateLabel],["Time",bk.time],["Patient",bk.name]].map(([k,v])=>(
                  <div key={k} style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                    <span style={{fontSize:13,color:"#64748b"}}>{k}</span>
                    <span style={{fontSize:13,fontWeight:700,color:"#0A5C96"}}>{v}</span>
                  </div>
                ))}
              </div>
              <button onClick={onClose} style={PBTN}>Done ✓</button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ── AIChat Modal ──────────────────────────────────────────────────────────────
function AIChat({ onClose }: { onClose:()=>void }) {
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
      const reply = (data.reply||"Kuch problem aayi.").replace(/<booking_data>[\s\S]*?<\/booking_data>/g,"").trim();
      setMsgs(p=>[...p,{role:"assistant",content:reply}]);
      if (data.emergency) setMsgs(p=>[...p,{role:"assistant",content:"🚨 Emergency lag rahi hai! Abhi call karein ya Emergency mein aayein."}]);
    } catch { setMsgs(p=>[...p,{role:"assistant",content:"Network error. Please try again."}]); }
    finally { setLoading(false); }
  }

  return (
    <div style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div style={{width:"100%",maxWidth:480,height:"88vh",background:"#fff",borderRadius:"24px 24px 0 0",display:"flex",flexDirection:"column",overflow:"hidden"}}>

        <div style={{background:"linear-gradient(135deg,#1e40af,#3b82f6)",padding:"16px 20px",display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:38,height:38,borderRadius:"50%",background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🤖</div>
          <div style={{flex:1}}>
            <div style={{color:"#fff",fontWeight:700,fontSize:15}}>AI Health Assistant</div>
            <div style={{color:"rgba(255,255,255,0.75)",fontSize:11}}>Symptoms · Treatment · Hospital Info</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"rgba(255,255,255,0.8)",fontSize:22,cursor:"pointer"}}>✕</button>
        </div>

        {msgs.length===1 && (
          <div style={{padding:"12px 16px",borderBottom:"1px solid #f1f5f9"}}>
            <div style={{fontSize:11,color:"#94a3b8",marginBottom:8,fontWeight:600}}>JALDI POOCHEIN:</div>
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
                background:m.role==="user"?"#1e40af":"#f1f5f9",
                color:m.role==="user"?"#fff":"#1a2e44"}}>{m.content}</div>
            </div>
          ))}
          {loading && <div style={{display:"flex",gap:5,padding:"8px 14px"}}>
            {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:"#94a3b8",animation:`bop 1.2s ${i*0.2}s infinite`}}/>)}
          </div>}
          <div ref={bottomRef}/>
        </div>

        <div style={{padding:"8px 16px",background:"#fffbeb",borderTop:"1px solid #fef3c7",fontSize:11,color:"#92400e",textAlign:"center"}}>
          💡 Appointment book karne ke liye neeche wala button use karein
        </div>

        <div style={{padding:"12px 16px",borderTop:"1px solid #f1f5f9",display:"flex",gap:8,background:"#fff"}}>
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

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [chatOpen,    setChatOpen]    = useState(false);

  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",background:"#fff",minHeight:"100vh",color:"#1a2e44"}}>

      {bookingOpen && <EasyBooking onClose={()=>setBookingOpen(false)}/>}
      {chatOpen    && <AIChat      onClose={()=>setChatOpen(false)}/>}

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
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontWeight:900,fontSize:11,color:"#7c3aed",border:"1px solid #e2e8f0",borderRadius:8,padding:"4px 8px"}}>PWA</span>
            <button onClick={()=>setMenuOpen(!menuOpen)} style={{background:"none",border:"none",cursor:"pointer",padding:4}}>
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                {[0,1,2].map(i=><span key={i} style={{display:"block",width:20,height:2,background:"#334155",borderRadius:2,opacity:menuOpen&&i===1?0:1}}/>)}
              </div>
            </button>
          </div>
        </div>
        {menuOpen && (
          <div style={{borderTop:"1px solid #f1f5f9",background:"#fff",padding:"8px 16px 16px"}}>
            {["Services","About","Contact"].map(item=>(
              <a key={item} href={`#${item.toLowerCase()}`} onClick={()=>setMenuOpen(false)} style={{display:"block",padding:"12px 0",borderBottom:"1px solid #f8fafc",color:"#334155",textDecoration:"none",fontSize:14,fontWeight:500}}>{item}</a>
            ))}
          </div>
        )}
      </nav>

      {/* HERO */}
      <section style={{background:"linear-gradient(135deg,#deeefa,#c8e3f5,#b8d9f2)",overflow:"hidden"}}>
        <div style={{maxWidth:480,margin:"0 auto",display:"flex",alignItems:"flex-end",minHeight:280,position:"relative"}}>
          <div style={{flex:1,padding:"28px 20px"}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(10,92,150,0.1)",borderRadius:100,padding:"4px 10px",marginBottom:12}}>
              <span style={{fontSize:10,fontWeight:600,color:"#0A5C96"}}>✦ Bhopal's Trusted Ortho Centre</span>
            </div>
            <h1 style={{fontSize:26,fontWeight:900,lineHeight:1.15,marginBottom:10,color:"#0A5C96"}}>
              ORTHOPEDIC<br/><span style={{color:"#1a2e44"}}>EXCELLENCE</span><br/>IN BHOPAL
            </h1>
            <p style={{fontSize:14,color:"#334155",marginBottom:20}}>Compassionate Care, Smart Technology.</p>
            <button onClick={()=>setBookingOpen(true)} style={{display:"flex",alignItems:"center",gap:8,background:"#0A5C96",color:"#fff",padding:"13px 20px",borderRadius:100,fontWeight:700,fontSize:14,border:"none",cursor:"pointer",boxShadow:"0 4px 16px rgba(10,92,150,0.4)",marginBottom:10,width:"fit-content"}}>
              📅 Appointment Book Karein
            </button>
            <button onClick={()=>setChatOpen(true)} style={{display:"flex",alignItems:"center",gap:8,background:"#fff",color:"#0A5C96",border:"2px solid #0A5C96",padding:"11px 18px",borderRadius:100,fontWeight:600,fontSize:13,cursor:"pointer",width:"fit-content"}}>
              🤖 Doctor se Sawaal Poochein
            </button>
          </div>
          <div style={{width:140,flexShrink:0,alignSelf:"stretch",position:"relative",overflow:"hidden"}}>
            <img src="/hero_doctor.webp" alt="Doctor" style={{position:"absolute",bottom:0,right:0,height:"100%",width:"auto",objectFit:"cover",objectPosition:"top center"}} onError={(e)=>{(e.target as HTMLImageElement).style.display="none";}}/>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" style={{background:"#fff",padding:"24px 16px"}}>
        <div style={{maxWidth:480,margin:"0 auto"}}>
          <h2 style={{fontSize:20,fontWeight:800,marginBottom:16}}>Our Services</h2>
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
          <h2 style={{fontSize:20,fontWeight:800,marginBottom:16}}>Bhopal's Most Trusted</h2>
          {[{icon:"🏥",title:"State-of-the-Art OT",desc:"Modular OTs with latest arthroscopic equipment."},
            {icon:"👨‍⚕️",title:"Expert Surgeons",desc:"Fellowship-trained, 15+ years experience."},
            {icon:"📅",title:"Easy Booking",desc:"Calendar se date chunein, 30 seconds mein done."},
            {icon:"🤖",title:"AI Health Assistant",desc:"Symptoms discuss karein, doctor se better milein."}].map((item,i)=>(
            <div key={i} style={{display:"flex",alignItems:"flex-start",gap:14,background:"#fff",borderRadius:14,padding:"14px 16px",border:"1px solid #e2e8f0",marginBottom:10}}>
              <span style={{fontSize:24}}>{item.icon}</span>
              <div>
                <div style={{fontWeight:700,fontSize:14,marginBottom:2}}>{item.title}</div>
                <div style={{fontSize:12,color:"#64748b",lineHeight:1.5}}>{item.desc}</div>
              </div>
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
            <div style={{fontWeight:700,color:"#fff",fontSize:14}}>🚨 Medical Emergency?</div>
            <div style={{fontSize:11,color:"#fecaca",marginTop:2}}>Trauma team available 24/7</div>
          </div>
          <a href={`tel:+91${PHONE}`} style={{background:"#fff",color:"#dc2626",padding:"9px 16px",borderRadius:100,fontWeight:700,fontSize:12,textDecoration:"none"}}>📞 Call Now</a>
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
          📅 Book Appointment
        </button>
        <button onClick={()=>setChatOpen(true)} style={{flex:1,background:"#f1f5f9",color:"#1e40af",border:"2px solid #1e40af",borderRadius:100,padding:"14px 0",fontWeight:700,fontSize:13,cursor:"pointer"}}>
          🤖 AI Chat
        </button>
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
