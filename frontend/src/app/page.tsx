"use client";

import { useState } from "react";

const HOSPITAL_PHONE = "919XXXXXXXXX"; // Replace with actual WhatsApp number
const WHATSAPP_MESSAGE = encodeURIComponent(
  "Namaste! Mujhe Unique Hospital mein appointment book karni hai."
);
const WHATSAPP_URL = `https://wa.me/${HOSPITAL_PHONE}?text=${WHATSAPP_MESSAGE}`;

const specialties = [
  {
    icon: "🦴",
    title: "Orthopedic Surgery",
    desc: "Joint replacement, fracture management & bone health",
  },
  {
    icon: "🦵",
    title: "Joint Replacement",
    desc: "Knee, hip & shoulder replacement with precision",
  },
  {
    icon: "🧠",
    title: "Spine Care",
    desc: "Slipped disc, spondylosis & spinal deformity treatment",
  },
  {
    icon: "⚡",
    title: "Emergency Trauma",
    desc: "24/7 trauma & accident care with rapid response",
  },
];

const stats = [
  { number: "10,000+", label: "Patients Treated" },
  { number: "15+", label: "Years Experience" },
  { number: "98%", label: "Success Rate" },
  { number: "24/7", label: "Emergency Care" },
];

const doctors = [
  {
    name: "Dr. [Name]",
    spec: "Senior Orthopedic Surgeon",
    qual: "MS Ortho, AIIMS Delhi",
  },
  {
    name: "Dr. [Name]",
    spec: "Joint Replacement Specialist",
    qual: "MCh Ortho, PGIMER",
  },
  {
    name: "Dr. [Name]",
    spec: "Spine Surgery Expert",
    qual: "MS Ortho, Fellowship USA",
  },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="relative min-h-screen bg-[#0a1628] overflow-x-hidden">
      {/* Background decorative orbs */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-[#0f2040] opacity-40 blur-[120px] pointer-events-none -z-0" />
      <div className="fixed bottom-1/4 right-0 w-[400px] h-[400px] rounded-full bg-[#c9a84c] opacity-5 blur-[100px] pointer-events-none -z-0" />

      {/* NAVBAR */}
      <nav className="relative z-50 flex items-center justify-between px-6 md:px-12 py-5 border-b border-[#c9a84c]/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-[#c9a84c]/60 flex items-center justify-center">
            <span className="text-[#c9a84c] text-lg">✦</span>
          </div>
          <div>
            <p className="font-cormorant text-[#f8f6f0] font-semibold text-lg leading-tight tracking-wide">
              Unique Hospital
            </p>
            <p className="text-[#8a9bb5] text-xs tracking-widest uppercase">
              Bhopal, M.P.
            </p>
          </div>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8 text-sm text-[#8a9bb5] font-dm-sans">
          <a href="#specialties" className="hover:text-[#c9a84c] transition-colors">Specialties</a>
          <a href="#doctors" className="hover:text-[#c9a84c] transition-colors">Doctors</a>
          <a href="#about" className="hover:text-[#c9a84c] transition-colors">About</a>
          <a href="#contact" className="hover:text-[#c9a84c] transition-colors">Contact</a>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#c9a84c] text-[#0a1628] px-5 py-2 rounded-full text-sm font-semibold hover:bg-[#e8c97a] transition-all duration-300"
          >
            Book Now
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-[#c9a84c] text-2xl"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden relative z-40 bg-[#0f2040] border-b border-[#c9a84c]/10 px-6 py-4 flex flex-col gap-4 text-[#8a9bb5] text-sm">
          <a href="#specialties" onClick={() => setMenuOpen(false)}>Specialties</a>
          <a href="#doctors" onClick={() => setMenuOpen(false)}>Doctors</a>
          <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
          <a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="relative z-10 px-6 md:px-12 pt-20 pb-28 max-w-6xl mx-auto">
        <div className="max-w-3xl">
          <p className="fade-up fade-up-delay-1 text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-6 font-dm-sans">
            ✦ Trusted Healthcare in Bhopal since 2009
          </p>

          <h1 className="fade-up fade-up-delay-2 font-cormorant text-5xl md:text-7xl font-light leading-[1.1] mb-6">
            <span className="text-[#f8f6f0]">Advanced Care,</span>
            <br />
            <span className="gold-shimmer font-semibold">
              Compassionate Healing
            </span>
          </h1>

          <p className="fade-up fade-up-delay-3 text-[#8a9bb5] text-lg md:text-xl leading-relaxed mb-10 font-light max-w-xl">
            Unique Hospital brings world-class orthopedic and multi-specialty
            care to Bhopal. Expert surgeons, modern facilities, and a patient-
            first approach — all under one roof.
          </p>

          <div className="fade-up fade-up-delay-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Primary CTA — WhatsApp */}
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="relative pulse-ring inline-flex items-center gap-3 bg-[#c9a84c] hover:bg-[#e8c97a] text-[#0a1628] font-semibold px-8 py-4 rounded-full text-base transition-all duration-300 hover:scale-105 shadow-[0_0_30px_rgba(201,168,76,0.25)]"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Book Appointment
            </a>

            {/* Secondary CTA — Call */}
            <a
              href="tel:+917XXXXXXXXX"
              className="inline-flex items-center gap-2 border border-[#c9a84c]/30 text-[#c9a84c] px-7 py-4 rounded-full text-base hover:border-[#c9a84c] hover:bg-[#c9a84c]/5 transition-all duration-300"
            >
              <span>📞</span> Call Now
            </a>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="relative z-10 border-y border-[#c9a84c]/10 bg-[#0f2040]/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <p className="font-cormorant text-3xl md:text-4xl gold-shimmer font-semibold">
                {s.number}
              </p>
              <p className="text-[#8a9bb5] text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SPECIALTIES */}
      <section
        id="specialties"
        className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 py-24"
      >
        <div className="text-center mb-14">
          <p className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-3">
            Our Expertise
          </p>
          <h2 className="font-cormorant text-4xl md:text-5xl text-[#f8f6f0] font-light">
            Medical Specialties
          </h2>
          <div className="gold-line w-24 mx-auto mt-4" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {specialties.map((s, i) => (
            <div
              key={i}
              className="group bg-[#0f2040] border border-[#c9a84c]/10 rounded-2xl p-6 hover:border-[#c9a84c]/40 hover:bg-[#162d55] transition-all duration-300 cursor-default"
            >
              <span className="text-4xl mb-4 block">{s.icon}</span>
              <h3 className="font-cormorant text-xl text-[#f8f6f0] font-semibold mb-2">
                {s.title}
              </h3>
              <p className="text-[#8a9bb5] text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DOCTORS */}
      <section
        id="doctors"
        className="relative z-10 bg-[#0f2040]/40 py-24"
      >
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="text-center mb-14">
            <p className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-3">
              Meet Our Team
            </p>
            <h2 className="font-cormorant text-4xl md:text-5xl text-[#f8f6f0] font-light">
              Expert Doctors
            </h2>
            <div className="gold-line w-24 mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {doctors.map((d, i) => (
              <div
                key={i}
                className="bg-[#0a1628] border border-[#c9a84c]/10 rounded-2xl p-8 text-center hover:border-[#c9a84c]/30 transition-all duration-300"
              >
                <div className="w-20 h-20 rounded-full bg-[#162d55] border border-[#c9a84c]/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">👨‍⚕️</span>
                </div>
                <h3 className="font-cormorant text-xl text-[#f8f6f0] font-semibold">
                  {d.name}
                </h3>
                <p className="text-[#c9a84c] text-sm mt-1">{d.spec}</p>
                <p className="text-[#8a9bb5] text-xs mt-1">{d.qual}</p>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-block border border-[#c9a84c]/30 text-[#c9a84c] text-sm px-5 py-2 rounded-full hover:bg-[#c9a84c]/10 transition-all"
                >
                  Book Consultation
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 py-24">
        <div className="bg-gradient-to-br from-[#0f2040] to-[#162d55] border border-[#c9a84c]/20 rounded-3xl p-10 md:p-16 text-center shadow-[0_0_60px_rgba(201,168,76,0.05)]">
          <p className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-4">
            Smart Clinic
          </p>
          <h2 className="font-cormorant text-4xl md:text-5xl text-[#f8f6f0] font-light mb-4">
            Ready to Book Your Visit?
          </h2>
          <p className="text-[#8a9bb5] text-lg mb-8 max-w-xl mx-auto">
            Chat with our AI-powered assistant on WhatsApp — available 24/7 for
            appointments, queries, and emergencies.
          </p>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="relative pulse-ring inline-flex items-center gap-3 bg-[#c9a84c] hover:bg-[#e8c97a] text-[#0a1628] font-semibold px-10 py-4 rounded-full text-base transition-all duration-300 hover:scale-105"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            WhatsApp pe Book Karein
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        id="contact"
        className="relative z-10 border-t border-[#c9a84c]/10 px-6 md:px-12 py-10"
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <p className="font-cormorant text-[#f8f6f0] text-lg font-semibold">
              Unique Hospital
            </p>
            <p className="text-[#8a9bb5] text-sm">
              Your Address, Bhopal, Madhya Pradesh 462001
            </p>
          </div>
          <div className="text-center">
            <p className="text-[#8a9bb5] text-xs">
              © {new Date().getFullYear()} Unique Hospital. All rights reserved.
            </p>
          </div>
          <div className="flex gap-4">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#c9a84c] text-sm hover:underline"
            >
              WhatsApp
            </a>
            <a href="tel:+917XXXXXXXXX" className="text-[#c9a84c] text-sm hover:underline">
              Call
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
      }
