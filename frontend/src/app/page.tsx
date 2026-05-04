"use client";
import { useState } from "react";

const PHONE = "919575877759";
const WA_MSG = encodeURIComponent("Namaste! Mujhe Unique Hospital mein appointment book karni hai.");
const WA_URL = `https://wa.me/${PHONE}?text=${WA_MSG}`;
const ADDRESS = "77, Motia Talab Rd, Kohefiza, Bhopal, MP.";
const MAPS_URL = "https://maps.google.com/?q=Unique+Hospital+Kohefiza+Bhopal";

const services = [
  {
    id: "arthroscopy",
    title: "Arthroscopy",
    desc: "Minimally invasive joint surgeries.",
    icon: (
      <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14">
        <circle cx="35" cy="45" r="20" fill="#e8f3fb" stroke="#0A5C96" strokeWidth="2.5"/>
        <ellipse cx="35" cy="45" rx="10" ry="14" fill="#b8d9f5" stroke="#0A5C96" strokeWidth="2"/>
        <line x1="35" y1="31" x2="35" y2="59" stroke="#0A5C96" strokeWidth="1.5" strokeDasharray="3 2"/>
        <rect x="50" y="10" width="6" height="30" rx="3" fill="#0A5C96" transform="rotate(35 50 10)"/>
        <circle cx="53" cy="12" r="3" fill="#1a7bc4"/>
        <line x1="20" y1="35" x2="10" y2="35" stroke="#0A5C96" strokeWidth="2" strokeLinecap="round"/>
        <line x1="20" y1="45" x2="8" y2="45" stroke="#0A5C96" strokeWidth="2" strokeLinecap="round"/>
        <line x1="20" y1="55" x2="10" y2="55" stroke="#0A5C96" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "joint",
    title: "Joint Replacement",
    desc: "Complete hip & knee replacements.",
    icon: (
      <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14">
        <ellipse cx="40" cy="28" rx="14" ry="16" fill="#e8f3fb" stroke="#0A5C96" strokeWidth="2.5"/>
        <ellipse cx="40" cy="55" rx="14" ry="16" fill="#e8f3fb" stroke="#0A5C96" strokeWidth="2.5"/>
        <rect x="33" y="36" width="14" height="8" rx="2" fill="#0A5C96"/>
        <line x1="26" y1="28" x2="20" y2="28" stroke="#1a7bc4" strokeWidth="3" strokeLinecap="round"/>
        <line x1="54" y1="28" x2="60" y2="28" stroke="#1a7bc4" strokeWidth="3" strokeLinecap="round"/>
        <line x1="26" y1="55" x2="20" y2="55" stroke="#1a7bc4" strokeWidth="3" strokeLinecap="round"/>
        <line x1="54" y1="55" x2="60" y2="55" stroke="#1a7bc4" strokeWidth="3" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "emergency",
    title: "Emergency Care",
    desc: "24/7 critical orthopedic support.",
    icon: (
      <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14">
        <rect x="8" y="32" width="50" height="28" rx="6" fill="#fff0f0" stroke="#cc2222" strokeWidth="2.5"/>
        <rect x="32" y="25" width="16" height="12" rx="3" fill="#fff0f0" stroke="#cc2222" strokeWidth="2"/>
        <circle cx="20" cy="62" r="6" fill="#555" stroke="#333" strokeWidth="2"/>
        <circle cx="46" cy="62" r="6" fill="#555" stroke="#333" strokeWidth="2"/>
        <rect x="28" y="38" width="20" height="12" rx="2" fill="#e8f3fb" stroke="#0A5C96" strokeWidth="1.5"/>
        <line x1="38" y1="41" x2="38" y2="47" stroke="#cc2222" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="35" y1="44" x2="41" y2="44" stroke="#cc2222" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="57" cy="38" r="4" fill="#ff4444"/>
        <line x1="57" y1="35" x2="57" y2="41" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="54" y1="38" x2="60" y2="38" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "diagnostics",
    title: "Diagnostics",
    desc: "Advanced imaging & analysis.",
    icon: (
      <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14">
        <rect x="10" y="8" width="44" height="52" rx="4" fill="#e8f3fb" stroke="#0A5C96" strokeWidth="2.5"/>
        <rect x="18" y="16" width="28" height="36" rx="2" fill="#b8d9f5" stroke="#0A5C96" strokeWidth="1.5"/>
        <line x1="32" y1="20" x2="32" y2="48" stroke="#0A5C96" strokeWidth="1.5" strokeDasharray="2 2"/>
        <ellipse cx="32" cy="34" rx="7" ry="12" fill="none" stroke="#0A5C96" strokeWidth="1.5"/>
        <ellipse cx="32" cy="34" rx="3" ry="6" fill="#0A5C96" opacity="0.3"/>
        <rect x="20" y="62" width="24" height="6" rx="2" fill="#0A5C96"/>
        <rect x="28" y="58" width="8" height="4" rx="1" fill="#0A5C96"/>
      </svg>
    ),
  },
];

const stats = [
  { n: "5000+", l: "Surgeries Done" },
  { n: "15+", l: "Years Experience" },
  { n: "24/7", l: "Emergency Care" },
  { n: "98%", l: "Success Rate" },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="min-h-screen bg-white font-[var(--font-dm-sans)]">

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
              style={{ background: "linear-gradient(135deg, #0A5C96, #1a7bc4)" }}
            >
              UH
            </div>
            <div className="leading-tight">
              <p className="font-bold text-[#0A5C96] text-base tracking-tight">Unique Hospital</p>
              <p className="text-gray-400 text-[10px] tracking-wider uppercase">Bhopal, M.P.</p>
            </div>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#services" className="hover:text-[#0A5C96] transition-colors">Services</a>
            <a href="#about"    className="hover:text-[#0A5C96] transition-colors">About</a>
            <a href="#contact"  className="hover:text-[#0A5C96] transition-colors">Contact</a>
            <a
              href={WA_URL} target="_blank" rel="noopener noreferrer"
              className="pulse-green bg-[#25D366] hover:bg-[#1da851] text-white px-5 py-2 rounded-full text-sm font-semibold transition-all"
            >
              📅 Book Now
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden w-9 h-9 flex flex-col justify-center items-center gap-1.5"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <span className={`block w-5 h-0.5 bg-gray-600 transition-all ${menuOpen ? "rotate-45 translate-y-2" : ""}`}/>
            <span className={`block w-5 h-0.5 bg-gray-600 transition-all ${menuOpen ? "opacity-0" : ""}`}/>
            <span className={`block w-5 h-0.5 bg-gray-600 transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`}/>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-4 pt-2 flex flex-col gap-3 text-sm text-gray-700">
            <a href="#services" onClick={() => setMenuOpen(false)} className="py-2 border-b border-gray-50">Services</a>
            <a href="#about"    onClick={() => setMenuOpen(false)} className="py-2 border-b border-gray-50">About</a>
            <a href="#contact"  onClick={() => setMenuOpen(false)} className="py-2">Contact</a>
            <a
              href={WA_URL} target="_blank" rel="noopener noreferrer"
              className="mt-1 bg-[#25D366] text-white text-center py-3 rounded-full font-semibold"
            >
              📅 Book Appointment
            </a>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #e8f3fb 0%, #d0e8f7 50%, #c2dff4 100%)" }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 md:py-14 flex flex-col md:flex-row items-center gap-6 md:gap-0">

          {/* Text side */}
          <div className="flex-1 z-10">
            <span className="inline-block bg-[#0A5C96]/10 text-[#0A5C96] text-xs font-semibold px-3 py-1 rounded-full mb-4 tracking-wide uppercase">
              ✦ Bhopal's Trusted Orthopedic Centre
            </span>

            <h1 className="fade-up delay-1 text-3xl sm:text-4xl md:text-5xl font-bold text-[#0A5C96] leading-tight mb-3">
              ORTHOPEDIC<br />
              <span className="text-[#1a2e44]">EXCELLENCE</span><br />
              <span style={{ color: "#0A5C96" }}>IN BHOPAL</span>
            </h1>

            <p className="fade-up delay-2 text-gray-600 text-lg md:text-xl font-light mb-8 leading-relaxed">
              Compassionate Care,<br className="md:hidden" /> Smart Technology.
            </p>

            {/* Primary CTA */}
            <a
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="fade-up delay-3 pulse-green inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#1da851] text-white font-bold px-7 py-4 rounded-full text-base transition-all duration-300 hover:scale-105 shadow-lg shadow-green-200 mb-4"
            >
              <svg className="w-6 h-6 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Book Appointment via WhatsApp
            </a>

            <br />

            {/* Secondary CTA */}
            <a
              href="#services"
              className="fade-up delay-4 inline-flex items-center gap-2 border-2 border-[#0A5C96] text-[#0A5C96] font-semibold px-6 py-3 rounded-full text-sm hover:bg-[#0A5C96] hover:text-white transition-all duration-300"
            >
              View All Services →
            </a>
          </div>

          {/* Doctor image side */}
          <div className="fade-up delay-2 flex-shrink-0 w-52 md:w-72 relative">
            {/* Decorative circle behind doctor */}
            <div
              className="absolute inset-0 rounded-full scale-90 translate-y-4"
              style={{ background: "radial-gradient(circle, #b8d9f5 0%, transparent 70%)" }}
            />
            {/* We use a placeholder since actual image needs to be uploaded */}
            <div
              className="relative w-full aspect-[3/4] rounded-3xl overflow-hidden flex items-end justify-center"
              style={{ background: "linear-gradient(180deg, #c2dff4 0%, #a8cfe8 100%)" }}
            >
              {/* Doctor silhouette placeholder */}
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-4">
                <div className="w-24 h-24 rounded-full bg-[#0A5C96]/20 flex items-center justify-center mb-2">
                  <svg viewBox="0 0 60 60" className="w-16 h-16">
                    <circle cx="30" cy="18" r="12" fill="#0A5C96" opacity="0.7"/>
                    <path d="M10 55 Q10 35 30 35 Q50 35 50 55" fill="#0A5C96" opacity="0.7"/>
                    <rect x="22" y="28" width="16" height="8" rx="2" fill="white" opacity="0.9"/>
                    <line x1="30" y1="30" x2="30" y2="34" stroke="#0A5C96" strokeWidth="2"/>
                    <line x1="27" y1="32" x2="33" y2="32" stroke="#0A5C96" strokeWidth="2"/>
                  </svg>
                </div>
                <p className="text-[#0A5C96] font-semibold text-sm opacity-60">Dr. Specialist</p>
                <p className="text-[#0A5C96] text-xs opacity-40">Orthopedic Surgeon</p>
              </div>
              {/* PWA installed badge */}
              <div className="absolute top-3 right-3 bg-white rounded-lg px-2 py-1 shadow text-[10px] font-bold text-[#0A5C96] flex items-center gap-1">
                <span className="text-purple-600 font-black">PWA</span>
                <span className="text-gray-400 font-normal">Installed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="bg-[#0A5C96] text-white py-5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-4 gap-2 text-center">
          {stats.map((s, i) => (
            <div key={i}>
              <p className="text-xl sm:text-2xl font-bold">{s.n}</p>
              <p className="text-blue-200 text-[10px] sm:text-xs mt-0.5 leading-tight">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── QUICK SERVICES ── */}
      <section id="services" className="bg-white py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="mb-8">
            <p className="text-[#0A5C96] text-xs font-semibold tracking-widest uppercase mb-1">What We Offer</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1a2e44]">Quick Services</h2>
            <div className="mt-2 w-12 h-1 rounded-full bg-[#0A5C96]" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {services.map((s) => (
              <div
                key={s.id}
                className="group bg-white border border-gray-100 rounded-2xl p-5 hover:border-[#0A5C96]/30 hover:shadow-md hover:shadow-blue-50 transition-all duration-300 cursor-default"
              >
                <div className="mb-3">{s.icon}</div>
                <h3 className="font-bold text-[#1a2e44] text-sm sm:text-base mb-1">{s.title}</h3>
                <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA below services */}
          <div className="mt-8 text-center">
            <a
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="pulse-green inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1da851] text-white font-semibold px-8 py-3.5 rounded-full text-sm transition-all hover:scale-105 shadow-md shadow-green-100"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Book Appointment via WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE US ── */}
      <section id="about" className="bg-[#f8fafc] py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="mb-8">
            <p className="text-[#0A5C96] text-xs font-semibold tracking-widest uppercase mb-1">Why Unique Hospital</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1a2e44]">Bhopal's Most Trusted</h2>
            <div className="mt-2 w-12 h-1 rounded-full bg-[#0A5C96]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: "🏥", title: "State-of-the-Art OT", desc: "Modular operation theatres with latest laparoscopic & arthroscopic equipment." },
              { icon: "👨‍⚕️", title: "Expert Surgeons", desc: "Fellowship-trained orthopedic specialists with 15+ years combined experience." },
              { icon: "📱", title: "Smart Clinic System", desc: "AI-powered appointment triage, digital records & WhatsApp follow-up." },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-[#1a2e44] mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EMERGENCY BANNER ── */}
      <section className="bg-red-600 text-white py-5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <p className="font-bold text-lg">🚨 Medical Emergency?</p>
            <p className="text-red-100 text-sm">Our trauma team is available 24 hours, 7 days a week.</p>
          </div>
          <a
            href={`tel:+91${PHONE}`}
            className="bg-white text-red-600 font-bold px-6 py-3 rounded-full text-sm hover:bg-red-50 transition-colors shrink-0"
          >
            📞 Call Emergency Now
          </a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer id="contact" className="bg-[#0A5C96] text-white py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center font-bold text-sm">UH</div>
                <p className="font-bold text-lg">Unique Hospital</p>
              </div>
              <p className="text-blue-200 text-sm max-w-xs leading-relaxed">
                Orthopedic Excellence & Multi-Specialty Care in the heart of Bhopal, Madhya Pradesh.
              </p>
            </div>
            {/* Contact */}
            <div>
              <p className="font-semibold mb-3 text-blue-100 uppercase text-xs tracking-wider">Contact Us</p>
              <div className="space-y-2 text-sm text-blue-100">
                <a
                  href={MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 hover:text-white transition-colors"
                >
                  <span className="mt-0.5">📍</span>
                  <span>{ADDRESS}</span>
                </a>
                <a href={`tel:+91${PHONE}`} className="flex items-center gap-2 hover:text-white transition-colors">
                  <span>📞</span>
                  <span>{PHONE}</span>
                </a>
                <a href={WA_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors">
                  <span>💬</span>
                  <span>WhatsApp Appointment</span>
                </a>
              </div>
            </div>
            {/* Hours */}
            <div>
              <p className="font-semibold mb-3 text-blue-100 uppercase text-xs tracking-wider">OPD Hours</p>
              <div className="space-y-1 text-sm text-blue-100">
                <p>Mon – Sat: 9:00 AM – 8:00 PM</p>
                <p>Sunday: 10:00 AM – 2:00 PM</p>
                <p className="text-[#25D366] font-semibold">Emergency: 24 × 7</p>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-blue-400/30 pt-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-blue-200">
            <p>© {new Date().getFullYear()} Unique Hospital, Bhopal. All rights reserved.</p>
            <a
              href={MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              🗺️ View on Google Maps
            </a>
          </div>
        </div>
      </footer>

    </main>
  );
}
