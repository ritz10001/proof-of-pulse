"use client";

import Navbar from "@/components/Navbar";
import PixelHeart from "@/components/PixelHeart";
import TypingText from "@/components/TypingText";
import InteractiveGrid from "@/components/InteractiveGrid";
import CoinRain from "@/components/CoinRain";
import GlassShine from "@/components/GlassShine";

const SLOGANS = [
  "Your heartbeat. On-chain. Zero knowledge.",
  "Biometric truth without the data leak.",
  "Prove you're alive. Keep your secrets.",
  "Encrypted pulse. Immutable proof.",
];

function StatsCard({ value, label, sublabel }: { value: string; label: string; sublabel: string }) {
  return (
    <div className="flex flex-col gap-2 glass rounded-xl p-6">
      <span className="font-mono text-4xl font-black text-foreground">{value}</span>
      <span className="font-mono text-sm font-bold text-foreground/70">{label}</span>
      <span className="font-mono text-xs text-foreground/40">{sublabel}</span>
    </div>
  );
}

function StepCard({ step, title, desc, icon }: { step: string; title: string; desc: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col glass rounded-xl p-6 transition-all">
      <div className="flex items-center justify-between mb-6">
        <span className="font-mono text-sm text-foreground/30">{step}</span>
        <span className="text-pink-primary/50">{icon}</span>
      </div>
      <h3 className="font-mono text-xl font-black text-foreground mb-2">{title}</h3>
      <p className="text-sm text-foreground/50 leading-relaxed">{desc}</p>
    </div>
  );
}

function GlassBlobs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-pink-primary/[0.06] blur-[100px]" />
      <div className="absolute top-[30%] right-[-10%] w-[600px] h-[600px] rounded-full bg-pink-light/[0.05] blur-[120px]" />
      <div className="absolute bottom-[-5%] left-[20%] w-[500px] h-[500px] rounded-full bg-pink-primary/[0.04] blur-[100px]" />
      <div className="absolute top-[60%] left-[-8%] w-[400px] h-[400px] rounded-full bg-red-heart/[0.03] blur-[80px]" />
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <GlassBlobs />
      <InteractiveGrid />
      <CoinRain />
      <GlassShine />
      <Navbar />

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 pt-24 text-center">
        {/* Live badge */}
        <div className="flex items-center gap-2 mb-8">
          <span className="w-2 h-2 rounded-full bg-pink-primary animate-pulse" />
          <span className="font-mono text-xs tracking-[0.25em] uppercase text-foreground/50">
            Live on XRP Ledger Testnet
          </span>
        </div>

        {/* Main title */}
        <div className="flex items-center gap-6 mb-6">
          <PixelHeart size={80} color="#d63555" className="pixel-pulse hidden md:block" />
          <h1 className="font-mono text-6xl md:text-8xl font-black tracking-tight text-foreground leading-none">
            PROOF OF
            <br />
            <span className="text-pink-primary">PULSE</span>
            <span className="inline-block w-3 h-3 bg-pink-light ml-2 mb-2" />
          </h1>
          <PixelHeart size={80} color="#d63555" className="pixel-pulse hidden md:block" />
        </div>

        {/* Tagline */}
        <p className="text-lg md:text-xl text-foreground/60 max-w-xl mb-4">
          Biometric attestation on XRP Ledger.
        </p>

        {/* Typing animation */}
        <div className="h-8 mb-10">
          <p className="font-mono text-sm md:text-base text-pink-primary/80">
            <TypingText phrases={SLOGANS} typingSpeed={60} deletingSpeed={30} pauseDuration={2500} />
          </p>
        </div>

        {/* CTA buttons */}
        <div className="flex gap-4 mb-20">
          <button className="glass-pink-solid px-8 py-3 text-pink-dark font-mono font-bold text-sm tracking-wider uppercase rounded-lg cursor-pointer transition-all">
            Get Started
          </button>
          <button className="glass px-8 py-3 text-foreground font-mono font-bold text-sm tracking-wider uppercase rounded-lg cursor-pointer transition-all">
            Source
          </button>
        </div>

        {/* Pixel heart divider */}
        <div className="flex items-center gap-3 mb-6">
          {[12, 16, 20, 24, 20, 16, 12].map((s, i) => (
            <PixelHeart key={i} size={s} color={i === 3 ? "#d63555" : "#e25d75"} className={i === 3 ? "pixel-pulse" : ""} />
          ))}
        </div>
      </main>

      {/* Stats Section */}
      <section id="stats" className="relative z-10 py-24">
        <div className="max-w-5xl mx-auto px-6">
          <p className="font-mono text-xs tracking-[0.3em] uppercase text-pink-primary/60 mb-8">
            Protocol Stats
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatsCard value="95" label="Confidence" sublabel="max score" />
            <StatsCard value="25 min" label="Duration" sublabel="workout" />
            <StatsCard value="177" label="Peak HR" sublabel="beats per min" />
            <StatsCard value="XRP" label="Network" sublabel="testnet" />
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-5xl mx-auto px-6">
        <hr className="border-pink-primary/10" />
      </div>

      {/* How it works */}
      <section id="how-it-works" className="relative z-10 py-24 pb-32">
        <div className="max-w-5xl mx-auto px-6">
          <p className="font-mono text-xs tracking-[0.3em] uppercase text-pink-primary/60 mb-4">
            How It Works
          </p>
          <h2 className="font-mono text-3xl md:text-4xl font-black text-foreground mb-12">
            Four Steps. One Proof.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <StepCard
              step="01"
              title="Upload"
              desc="Export HR data from Apple Health XML or use the built-in demo data."
              icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>}
            />
            <StepCard
              step="02"
              title="Analyze"
              desc="Engine detects fraud, computes HR zones, and scores confidence 0-100."
              icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>}
            />
            <StepCard
              step="03"
              title="Attest"
              desc="Oracle stores raw data on Pinata IPFS and submits proof to XRP Ledger."
              icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M9 12l2 2 4-4"/></svg>}
            />
            <StepCard
              step="04"
              title="Verify"
              desc="Anyone can verify the attestation on-chain. No raw biometrics exposed."
              icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>}
            />
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-5xl mx-auto px-6">
        <hr className="border-pink-primary/10" />
      </div>

      {/* Generate Proof Section */}
      <section id="generate" className="relative z-10 py-24 pb-32">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            {/* Left: Form */}
            <div>
              <h2 className="font-mono text-3xl md:text-4xl font-black text-foreground mb-10">
                Generate Your Proof.
              </h2>

              {/* Data Source */}
              <div className="mb-6">
                <p className="font-mono text-xs tracking-[0.2em] uppercase text-foreground/40 mb-3">
                  Data Source
                </p>
                <div className="flex flex-wrap gap-2">
                  <button className="glass-pink-solid px-4 py-2 text-pink-dark font-mono text-xs rounded-full cursor-pointer flex items-center gap-2 transition-all">
                    <PixelHeart size={12} color="#b52a45" />
                    Demo Data
                  </button>
                  <button className="glass px-4 py-2 text-foreground font-mono text-xs rounded-full cursor-pointer flex items-center gap-2 transition-all">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    Upload XML
                  </button>
                  <button className="glass px-4 py-2 text-foreground/40 font-mono text-xs rounded-full cursor-not-allowed flex items-center gap-2 opacity-60">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                    Apple Watch
                    <span className="text-[9px] glass-pink text-pink-primary px-1.5 py-0.5 rounded font-bold">SOON</span>
                  </button>
                </div>
              </div>

              {/* Info box */}
              <div className="glass rounded-lg p-4 mb-6">
                <p className="font-mono text-xs text-foreground/50 leading-relaxed">
                  <span className="font-bold text-foreground/70">Apple Watch app</span> — auto-sync workout data directly from your wrist. Grant permission once and your heart rate data flows automatically. No manual exports.
                </p>
              </div>

              {/* File upload */}
              <div className="mb-6">
                <p className="font-mono text-xs tracking-[0.2em] uppercase text-foreground/40 mb-3">
                  Apple Health Export
                </p>
                <div className="glass rounded-lg overflow-hidden">
                  <label className="px-4 py-3 glass-pink font-mono text-xs text-foreground/70 border-r-0 cursor-pointer transition-all inline-block">
                    Choose File
                    <input type="file" accept=".xml" className="hidden" />
                  </label>
                  <span className="px-4 font-mono text-xs text-foreground/30">No file chosen</span>
                </div>
              </div>

              {/* Workout date */}
              <div className="mb-6">
                <p className="font-mono text-xs tracking-[0.2em] uppercase text-foreground/40 mb-3">
                  Workout Date
                </p>
                <input
                  type="date"
                  defaultValue="2026-02-14"
                  className="w-full px-4 py-3 glass rounded-lg font-mono text-sm text-foreground focus:outline-none transition-all"
                />
              </div>

              {/* Wallet */}
              <div className="mb-8">
                <p className="font-mono text-xs tracking-[0.2em] uppercase text-foreground/40 mb-3">
                  XRP Account
                </p>
                <div className="flex items-center gap-2 glass rounded-lg px-4 py-3">
                  <span className="w-2 h-2 rounded-full bg-pink-primary" />
                  <span className="font-mono text-xs text-foreground/70 truncate">
                    rwS2wxYSdE387SZ8geN4oA1aNgy53Pgchd
                  </span>
                </div>
              </div>

              {/* Generate button */}
              <button className="w-full py-4 glass-pink-solid text-pink-dark font-mono font-bold text-sm tracking-wider uppercase rounded-lg cursor-pointer transition-all">
                Generate Proof
              </button>
            </div>

            {/* Right: What Happens */}
            <div>
              <p className="font-mono text-xs tracking-[0.3em] uppercase text-pink-primary/60 mb-8">
                What Happens
              </p>
              <div className="space-y-8">
                {[
                  { step: "01", title: "Parse", desc: "Heart rate samples are extracted from your Apple Health export — or streamed directly from the Apple Watch app." },
                  { step: "02", title: "Detect", desc: "The engine checks for fraud: flat data, erratic swings, missing warmup patterns." },
                  { step: "03", title: "Score", desc: "A confidence score (0-100) is computed from duration, variability, sampling density, and HR range." },
                  { step: "04", title: "Prove", desc: "The attestation is signed and submitted to the XRP Ledger. Raw data stays encrypted locally." },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <span className="font-mono text-xs text-pink-primary/40 pt-1 shrink-0">{item.step}</span>
                    <div>
                      <h4 className="font-mono text-lg font-black text-foreground mb-1">{item.title}</h4>
                      <p className="text-sm text-foreground/50 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
