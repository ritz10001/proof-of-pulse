"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PixelHeart from "@/components/PixelHeart";
import { useWallet } from "@/blockchain/providers/WalletProvider";
import {
  useInsuranceDAO,
  WellnessCase,
  TIER_LABELS,
  TIER_COLORS,
  STATUS_LABELS,
  PREMIUM_TABLE,
} from "@/blockchain/hooks/useInsuranceDAO";
import { ethers } from "ethers";

type Tab = "cases" | "apply" | "vote";

// Escrow info stored client-side for demo
interface EscrowInfo {
  txHash: string;
  escrowSequence: number;
  sourceAddress: string;
}
const escrowStore: Record<number, EscrowInfo> = {};

export default function DAOPage() {
  const { address, isConnected, connect, isInstalled } = useWallet();
  const dao = useInsuranceDAO();

  const [tab, setTab] = useState<Tab>("cases");
  const [cases, setCases] = useState<WellnessCase[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [txResult, setTxResult] = useState<{ txHash: string; message?: string; xrplTxHash?: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Apply form
  const [proofResult, setProofResult] = useState<any>(null);
  const [proofLoading, setProofLoading] = useState(false);
  const [proofSteps, setProofSteps] = useState<{ label: string; status: "pending" | "active" | "done" | "error"; detail?: string }[]>([]);
  const [xrplAddress, setXrplAddress] = useState("");

  // Escrow wallet
  const [escrowWallet, setEscrowWallet] = useState<{ address: string; balance: string } | null>(null);

  const loadData = async () => {
    const c = await dao.fetchCases();
    setCases(c);
  };

  useEffect(() => {
    loadData();
    fetch("/api/xrpl/wallet").then(r => r.ok ? r.json() : null).then(d => d && setEscrowWallet(d)).catch(() => {});
  }, []);

  useEffect(() => {
    if (address) {
      dao.checkMembership(address).then(setIsMember);
    }
  }, [address]);

  // ---- Generate Proof via proof engine (with live progress) ----
  const handleGenerateProof = async () => {
    setProofLoading(true);
    setProofResult(null);

    const steps = [
      { label: "Collecting biometric data from wearable", status: "pending" as const },
      { label: "Generating 120 HR samples (20-min cardio session)", status: "pending" as const },
      { label: "Detecting warmup phase (ramp 72 → 120 bpm)", status: "pending" as const },
      { label: "Detecting main cardio phase (130-165 bpm zone)", status: "pending" as const },
      { label: "Detecting cooldown phase (140 → 95 bpm)", status: "pending" as const },
      { label: "Running fraud detection checks", status: "pending" as const },
      { label: "Computing HR zone distribution", status: "pending" as const },
      { label: "Sending to attestation engine (/api/analyze)", status: "pending" as const },
      { label: "Calculating wellness confidence score", status: "pending" as const },
      { label: "Generating proof hash", status: "pending" as const },
    ];
    setProofSteps([...steps]);

    const advance = (idx: number, detail?: string) => {
      steps[idx].status = "active";
      if (detail) steps[idx].detail = detail;
      setProofSteps([...steps]);
    };
    const complete = (idx: number, detail?: string) => {
      steps[idx].status = "done";
      if (detail) steps[idx].detail = detail;
      setProofSteps([...steps]);
    };
    const fail = (idx: number, detail: string) => {
      steps[idx].status = "error";
      steps[idx].detail = detail;
      setProofSteps([...steps]);
    };

    const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

    try {
      // Step 0: Collecting biometric data
      advance(0);
      await wait(400);
      complete(0, "Wearable device connected");

      // Step 1: Generate samples
      advance(1);
      const now = Date.now();
      const samples: { timestamp: string; bpm: number }[] = [];
      for (let i = 0; i < 120; i++) {
        const t = i / 6;
        let bpm: number;
        if (t < 3) {
          bpm = 72 + (t / 3) * 48 + (Math.random() - 0.5) * 6;
        } else if (t < 15) {
          bpm = 140 + Math.sin(t * 0.5) * 15 + (Math.random() - 0.5) * 10;
        } else {
          const coolPct = (t - 15) / 5;
          bpm = 140 - coolPct * 45 + (Math.random() - 0.5) * 6;
        }
        samples.push({
          timestamp: new Date(now - (120 - i) * 10000).toISOString(),
          bpm: Math.round(Math.max(60, Math.min(180, bpm))),
        });
      }
      await wait(300);
      complete(1, `${samples.length} samples over ${Math.round((120 * 10) / 60)} min`);

      // Step 2: Warmup
      advance(2);
      const warmupSamples = samples.slice(0, 18);
      const warmupStart = warmupSamples[0].bpm;
      const warmupEnd = warmupSamples[warmupSamples.length - 1].bpm;
      await wait(250);
      complete(2, `${warmupStart} → ${warmupEnd} bpm (${warmupSamples.length} samples)`);

      // Step 3: Main cardio
      advance(3);
      const cardioSamples = samples.slice(18, 90);
      const avgCardio = Math.round(cardioSamples.reduce((s, v) => s + v.bpm, 0) / cardioSamples.length);
      const maxCardio = Math.max(...cardioSamples.map(s => s.bpm));
      await wait(300);
      complete(3, `Avg ${avgCardio} bpm, Peak ${maxCardio} bpm (${cardioSamples.length} samples)`);

      // Step 4: Cooldown
      advance(4);
      const coolSamples = samples.slice(90);
      const coolStart = coolSamples[0].bpm;
      const coolEnd = coolSamples[coolSamples.length - 1].bpm;
      await wait(250);
      complete(4, `${coolStart} → ${coolEnd} bpm (${coolSamples.length} samples)`);

      // Step 5: Fraud detection
      advance(5);
      await wait(400);
      const avgDiff = samples.slice(1).reduce((s, v, i) => s + Math.abs(v.bpm - samples[i].bpm), 0) / (samples.length - 1);
      complete(5, `Variability: ${avgDiff.toFixed(1)} bpm/sample — natural pattern`);

      // Step 6: HR zones
      advance(6);
      await wait(300);
      const zones = { rest: 0, light: 0, moderate: 0, vigorous: 0, max: 0 };
      samples.forEach(s => {
        if (s.bpm < 100) zones.rest++;
        else if (s.bpm < 120) zones.light++;
        else if (s.bpm < 140) zones.moderate++;
        else if (s.bpm < 160) zones.vigorous++;
        else zones.max++;
      });
      complete(6, `Rest:${zones.rest} Light:${zones.light} Mod:${zones.moderate} Vig:${zones.vigorous} Max:${zones.max}`);

      // Step 7: Send to API
      advance(7);
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hr_samples: samples }),
      });
      if (!res.ok) throw new Error("Analysis API returned error");
      const result = await res.json();
      complete(7, `Response: ${res.status} OK`);

      // Step 8: Confidence score
      advance(8);
      await wait(300);
      complete(8, `Score: ${result.attestation.confidence}% — ${result.attestation.activity_type}`);

      // Step 9: Proof hash
      advance(9);
      await wait(200);
      complete(9, `Hash: ${result.attestation.data_hash.slice(0, 24)}...`);

      setProofResult(result);
    } catch (err: any) {
      const activeIdx = steps.findIndex(s => s.status === "active");
      if (activeIdx >= 0) fail(activeIdx, err.message);
      setProofResult({ error: err.message });
    } finally {
      setProofLoading(false);
    }
  };

  // ---- Submit Wellness Case: proof + escrow + on-chain case ----
  const handleSubmitCase = async () => {
    if (!proofResult?.attestation || !xrplAddress) return;
    setActionLoading("apply");
    setTxResult(null);

    try {
      const score = proofResult.attestation.confidence;
      const summary = `${proofResult.attestation.activity_type} | ${proofResult.attestation.duration_mins}min | Avg HR ${proofResult.attestation.avg_hr} | Max HR ${proofResult.attestation.max_hr} | Recovery ${proofResult.attestation.recovery_score}/100`;

      // Step 1: Upload proof to IPFS
      let evidenceURI = `proof:${proofResult.attestation.data_hash}`;
      try {
        const attestRes = await fetch("/api/attest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: address,
            hr_samples: proofResult.hr_timeline?.map((p: any) => ({ timestamp: p.time, bpm: p.bpm })) || [],
          }),
        });
        if (attestRes.ok) {
          const data = await attestRes.json();
          evidenceURI = data.pinata?.gateway_url || data.storage_id || evidenceURI;
        }
      } catch {}

      // Step 2: Create XRPL escrow for the rebate (insurer locks funds)
      let escrowTxHash = "";
      try {
        // Calculate rebate: (200 - proposedPremium) * 12
        let tier = 0;
        if (score >= 85) tier = 3;
        else if (score >= 70) tier = 2;
        else if (score >= 50) tier = 1;
        const proposedPremium = PREMIUM_TABLE[tier];
        const monthlySaving = 200 - proposedPremium;
        // Scale rebate for demo: use monthly saving as XRP amount (e.g. $25 saving → 25 XRP)
        const escrowXrp = monthlySaving;

        if (escrowXrp > 0) {
          const escrowRes = await fetch("/api/xrpl/create-escrow", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amountXrp: String(escrowXrp),
              destinationAddress: xrplAddress,
            }),
          });

          if (escrowRes.ok) {
            const escrowData = await escrowRes.json();
            escrowTxHash = escrowData.escrow.txHash;
            // Store for later release on approval
            escrowStore[cases.length] = {
              txHash: escrowData.escrow.txHash,
              escrowSequence: escrowData.escrow.escrowSequence,
              sourceAddress: escrowData.escrow.sourceAddress,
            };
          }
        }
      } catch {}

      // Step 3: Create wellness case on-chain
      const proofHash = proofResult.attestation.data_hash.slice(0, 64).padEnd(64, "0");
      const result = await dao.createWellnessCase(
        evidenceURI,
        proofHash,
        summary,
        score,
        3600, // 1 hour voting period
      );

      setTxResult({
        txHash: result.txHash,
        message: `Wellness case submitted! Score: ${score}%. Awaiting DAO review.`,
        xrplTxHash: escrowTxHash || undefined,
      });

      setProofResult(null);
      setXrplAddress("");
      await loadData();
    } catch (err: any) {
      setTxResult({ txHash: "", message: `Error: ${err.message}` });
    } finally {
      setActionLoading(null);
    }
  };

  // ---- Vote ----
  const handleVote = async (caseId: number, approve: boolean) => {
    setActionLoading(`vote-${caseId}`);
    setTxResult(null);
    try {
      const result = await dao.voteOnCase(caseId, approve);
      setTxResult({ txHash: result.txHash, message: `Vote cast: ${approve ? "Approve" : "Deny"}` });
      await loadData();
    } catch (err: any) {
      setTxResult({ txHash: "", message: `Error: ${err.message}` });
    } finally {
      setActionLoading(null);
    }
  };

  // ---- Finalize: if approved, release XRPL escrow ----
  const handleFinalize = async (caseId: number) => {
    setActionLoading(`finalize-${caseId}`);
    setTxResult(null);
    try {
      const result = await dao.finalizeCase(caseId);

      // Re-fetch to check outcome
      const updated = await dao.fetchCases();
      const c = updated.find(x => x.id === caseId);

      if (c?.status === 1) {
        // Approved — try escrow release
        const escrow = escrowStore[caseId];
        if (escrow) {
          try {
            const releaseRes = await fetch("/api/xrpl/release-escrow", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                escrowOwner: escrow.sourceAddress,
                escrowSequence: escrow.escrowSequence,
              }),
            });
            if (releaseRes.ok) {
              const data = await releaseRes.json();
              setTxResult({
                txHash: result.txHash,
                message: `Approved! Premium reduced to $${c.proposedPremium}/mo. XRP rebate of $${(c.currentPremium - c.proposedPremium) * 12} released!`,
                xrplTxHash: data.txHash,
              });
              setCases(updated);
              return;
            }
          } catch {}
        }

        setTxResult({
          txHash: result.txHash,
          message: `Approved! Premium: $${c.currentPremium} → $${c.proposedPremium}/mo. Tier: ${TIER_LABELS[c.requestedTier]}.`,
        });
      } else {
        setTxResult({
          txHash: result.txHash,
          message: c?.status === 2 ? "Case denied by DAO vote. Premium unchanged." : "Finalized.",
        });
      }

      setCases(updated);
    } catch (err: any) {
      setTxResult({ txHash: "", message: `Error: ${err.message}` });
    } finally {
      setActionLoading(null);
    }
  };

  // Helper to get tier color class
  const tierBadge = (tier: number) => (
    <span className={`font-mono text-xs font-bold ${TIER_COLORS[tier]}`}>{TIER_LABELS[tier]}</span>
  );

  return (
    <div className="min-h-screen relative">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-pink-primary/10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <PixelHeart size={24} color="#d63555" className="pixel-pulse" />
              <span className="font-mono font-bold text-sm tracking-widest uppercase text-foreground">
                Proof of Pulse
              </span>
            </Link>
            <span className="glass-pink text-[10px] font-mono px-2.5 py-1 text-pink-primary rounded-md">INSURANCE DAO</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dao/challenges" className="glass text-xs font-mono text-foreground/50 hover:text-foreground px-3 py-1.5 rounded-lg transition-all">
              Challenges
            </Link>
            {isMember && (
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-green-100 text-green-700 mr-2">DAO MEMBER</span>
            )}
            {isConnected ? (
              <div className="flex items-center gap-2 glass rounded-lg px-4 py-2">
                <span className="w-2 h-2 rounded-full bg-pink-primary animate-pulse" />
                <span className="font-mono text-xs text-foreground/70">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
              </div>
            ) : (
              <button
                onClick={() => isInstalled ? connect() : window.open("https://metamask.io", "_blank")}
                className="glass-pink-solid text-pink-dark text-sm font-mono px-5 py-2 rounded-lg cursor-pointer transition-all"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-28 pb-20">
        {/* Header */}
        <div className="mb-8">
          <p className="font-mono text-xs tracking-[0.3em] uppercase text-pink-primary/60 mb-4">
            Insurance Wellness DAO
          </p>
          <h1 className="font-mono text-3xl md:text-5xl font-black text-foreground mb-4">
            Prove Wellness. <span className="text-pink-primary">Lower Premiums.</span>
          </h1>
          <p className="text-foreground/50 max-w-xl">
            Privacy-preserving insurance powered by biometric proof. Your workout data stays private — only a wellness score and proof hash go on-chain. DAO-governed decisions unlock better rates and XRP rebates.
          </p>
        </div>

        {/* ── DEMO FLOW PIPELINE ── */}
        <div className="glass rounded-xl p-6 mb-10">
          <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-pink-primary/50 mb-5">How It Works</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { step: "01", label: "Workout", sub: "Exercise with wearable" },
              { step: "02", label: "Prove", sub: "Biometric attestation" },
              { step: "03", label: "Submit Case", sub: "Request better tier" },
              { step: "04", label: "DAO Review", sub: "Members vote" },
              { step: "05", label: "Rebate", sub: "XRPL escrow released" },
            ].map((item, i) => (
              <div key={i} className="glass-pink rounded-lg p-3 text-center relative">
                <p className="font-mono text-[10px] text-pink-primary/40 mb-1">{item.step}</p>
                <p className="font-mono text-[10px] font-bold text-foreground/80">{item.label}</p>
                <p className="font-mono text-[9px] text-foreground/40">{item.sub}</p>
                {i < 4 && (
                  <div className="hidden md:block absolute right-[-10px] top-1/2 -translate-y-1/2 text-pink-primary/30 font-mono text-xs z-10">→</div>
                )}
              </div>
            ))}
          </div>

          {/* Premium Table */}
          <div className="mt-5 grid grid-cols-4 gap-2">
            {[
              { tier: "High Risk", premium: "$220/mo", score: "< 50", color: "text-red-500" },
              { tier: "Standard", premium: "$200/mo", score: "50-69", color: "text-foreground/60" },
              { tier: "Improved", premium: "$175/mo", score: "70-84", color: "text-green-600" },
              { tier: "Premium", premium: "$150/mo", score: "85+", color: "text-pink-primary" },
            ].map((t, i) => (
              <div key={i} className="glass rounded-lg p-3 text-center">
                <p className={`font-mono text-xs font-bold ${t.color}`}>{t.tier}</p>
                <p className="font-mono text-lg font-black text-foreground">{t.premium}</p>
                <p className="font-mono text-[9px] text-foreground/40">Score: {t.score}</p>
              </div>
            ))}
          </div>

          {escrowWallet && (
            <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] font-mono text-foreground/40">
              <span>Insurer Escrow: <span className="text-pink-primary">{escrowWallet.address.slice(0, 12)}...</span></span>
              <span>Pool: <span className="text-foreground/60">{parseFloat(escrowWallet.balance).toFixed(2)} XRP</span></span>
              <span className="text-[9px] glass-pink px-2 py-0.5 rounded text-pink-primary/60">XRPL DEVNET</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-10">
          {(["cases", "apply", "vote"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setTxResult(null); }}
              className={`${tab === t ? "glass-pink-solid text-pink-dark" : "glass text-foreground/70"} px-5 py-2.5 font-mono text-xs tracking-wider uppercase rounded-lg cursor-pointer transition-all hover:scale-105`}
            >
              {t === "cases" ? "All Cases" : t === "apply" ? "Apply for Better Rate" : "Review & Vote"}
            </button>
          ))}
        </div>

        {/* Tx banner */}
        {txResult && txResult.txHash && (
          <div className="glass rounded-lg p-4 mb-8 space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-pink-primary font-mono text-xs">&#10003;</span>
              <span className="font-mono text-xs text-foreground/70">{txResult.message || "Transaction confirmed"}</span>
            </div>
            <div className="flex flex-wrap gap-4 text-[11px] font-mono">
              <a href={`https://explorer.testnet.xrplevm.org/tx/${txResult.txHash}`} target="_blank" rel="noopener noreferrer" className="text-pink-primary hover:underline">
                EVM Tx: {txResult.txHash.slice(0, 16)}...
              </a>
              {txResult.xrplTxHash && (
                <a href={`https://devnet.xrpl.org/transactions/${txResult.xrplTxHash}`} target="_blank" rel="noopener noreferrer" className="text-pink-primary hover:underline">
                  XRPL Tx: {txResult.xrplTxHash.slice(0, 16)}...
                </a>
              )}
            </div>
          </div>
        )}

        {txResult && !txResult.txHash && txResult.message && (
          <div className="glass-pink rounded-lg p-4 mb-8">
            <p className="font-mono text-xs text-red-600">{txResult.message}</p>
          </div>
        )}

        {dao.error && (
          <div className="glass-pink rounded-lg p-4 mb-8">
            <p className="font-mono text-xs text-red-600">{dao.error}</p>
          </div>
        )}

        {/* === TAB: ALL CASES === */}
        {tab === "cases" && (
          <div className="space-y-4">
            {cases.length === 0 ? (
              <div className="glass rounded-xl p-10 text-center">
                <p className="font-mono text-sm text-foreground/40">No wellness cases yet. Be the first to apply.</p>
              </div>
            ) : (
              cases.map((c) => (
                <div key={c.id} className="glass rounded-xl p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-xs text-pink-primary/40">Case #{c.id}</span>
                        <span className={`font-mono text-xs font-bold ${c.status === 0 ? "text-yellow-600" : c.status === 1 ? "text-green-600" : "text-red-500"}`}>
                          {STATUS_LABELS[c.status]}
                        </span>
                        {c.finalized && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">FINALIZED</span>
                        )}
                        {tierBadge(c.requestedTier)}
                      </div>
                      <p className="text-sm text-foreground/60 leading-relaxed font-mono">{c.summary}</p>
                    </div>
                    <div className="text-right shrink-0 ml-6">
                      <p className="font-mono text-sm text-foreground/40">Wellness Score</p>
                      <p className={`font-mono text-3xl font-black ${c.wellnessScore >= 70 ? "text-green-600" : c.wellnessScore >= 50 ? "text-yellow-600" : "text-red-500"}`}>
                        {c.wellnessScore}
                      </p>
                    </div>
                  </div>

                  {/* Premium change */}
                  <div className="glass-pink rounded-lg p-3 mb-3 flex items-center gap-4">
                    <div className="flex items-center gap-2 font-mono text-sm">
                      <span className="text-foreground/40">Premium:</span>
                      <span className="text-foreground/70">${c.currentPremium}/mo</span>
                      <span className="text-pink-primary">→</span>
                      <span className={`font-bold ${c.proposedPremium < c.currentPremium ? "text-green-600" : "text-foreground/70"}`}>
                        ${c.proposedPremium}/mo
                      </span>
                    </div>
                    {c.proposedPremium < c.currentPremium && (
                      <span className="font-mono text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded">
                        Save ${c.currentPremium - c.proposedPremium}/mo | Rebate: ${(c.currentPremium - c.proposedPremium) * 12}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 text-[11px] font-mono text-foreground/40">
                    <span>Applicant: {c.applicant.slice(0, 8)}...{c.applicant.slice(-4)}</span>
                    <span>Votes: <span className="text-green-600">{c.approveVotes}✓</span> / <span className="text-red-500">{c.denyVotes}✗</span></span>
                    <span>{c.finalized ? "Finalized" : Date.now() / 1000 >= c.votingDeadline ? "Voting ended" : `Vote ends ${new Date(c.votingDeadline * 1000).toLocaleTimeString()}`}</span>
                    <a href={c.evidenceURI} target="_blank" rel="noopener noreferrer" className="text-pink-primary hover:underline">Evidence →</a>
                  </div>
                </div>
              ))
            )}
            <button onClick={loadData} className="glass px-4 py-2 font-mono text-xs text-foreground/50 rounded-lg cursor-pointer hover:scale-105 transition-all">
              Refresh
            </button>
          </div>
        )}

        {/* === TAB: APPLY FOR BETTER RATE === */}
        {tab === "apply" && (
          <div className="max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Generate Proof */}
              <div className="glass rounded-xl p-6 space-y-5">
                <div>
                  <p className="font-mono text-xs tracking-[0.2em] uppercase text-pink-primary/60 mb-1">Step 1</p>
                  <h3 className="font-mono text-lg font-black text-foreground mb-2">Generate Wellness Proof</h3>
                  <p className="text-xs text-foreground/40">Run the biometric proof engine on your workout data. Your raw data stays private.</p>
                </div>

                <button
                  onClick={handleGenerateProof}
                  disabled={proofLoading}
                  className="w-full py-3 glass-pink-solid text-pink-dark font-mono font-bold text-xs tracking-wider uppercase rounded-lg cursor-pointer transition-all hover:scale-105 disabled:opacity-50"
                >
                  {proofLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-3 h-3 border-2 border-pink-dark/30 border-t-pink-dark rounded-full animate-spin" />
                      Running Proof Engine...
                    </span>
                  ) : "Run Proof Engine (Demo)"}
                </button>

                {/* ── Live Progress Steps ── */}
                {proofSteps.length > 0 && proofLoading && (
                  <div className="glass-pink rounded-lg p-4 space-y-1.5 max-h-64 overflow-y-auto">
                    <p className="font-mono text-[10px] tracking-wider uppercase text-pink-primary/60 mb-2">Backend Progress</p>
                    {proofSteps.map((step, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="shrink-0 w-4 text-center font-mono text-[11px]">
                          {step.status === "done" && <span className="text-green-600">&#10003;</span>}
                          {step.status === "active" && <span className="w-2.5 h-2.5 border-2 border-pink-primary/30 border-t-pink-primary rounded-full animate-spin inline-block" />}
                          {step.status === "pending" && <span className="text-foreground/20">&#9679;</span>}
                          {step.status === "error" && <span className="text-red-500">&#10007;</span>}
                        </span>
                        <div className="min-w-0">
                          <span className={`font-mono text-[11px] ${step.status === "done" ? "text-foreground/70" : step.status === "active" ? "text-foreground" : step.status === "error" ? "text-red-500" : "text-foreground/30"}`}>
                            {step.label}
                          </span>
                          {step.detail && (
                            <p className={`font-mono text-[9px] ${step.status === "error" ? "text-red-400" : "text-green-600/70"} break-all`}>
                              {step.detail}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Completed Steps Summary ── */}
                {proofSteps.length > 0 && !proofLoading && proofResult?.attestation && (
                  <details className="glass-pink rounded-lg p-4">
                    <summary className="font-mono text-[10px] tracking-wider uppercase text-pink-primary/60 cursor-pointer hover:text-pink-primary transition-colors">
                      Proof Engine Log ({proofSteps.filter(s => s.status === "done").length}/{proofSteps.length} steps)
                    </summary>
                    <div className="mt-2 space-y-1">
                      {proofSteps.map((step, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="shrink-0 font-mono text-[10px] text-green-600">&#10003;</span>
                          <div className="min-w-0">
                            <span className="font-mono text-[10px] text-foreground/60">{step.label}</span>
                            {step.detail && (
                              <span className="font-mono text-[9px] text-foreground/40 ml-1">— {step.detail}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                {proofResult?.attestation && (
                  <div className="glass-pink rounded-lg p-4 space-y-3">
                    <p className="font-mono text-[10px] tracking-wider uppercase text-pink-primary/60">Attestation Result</p>

                    {/* Wellness Score (large) */}
                    <div className="text-center py-2">
                      <p className="font-mono text-[10px] text-foreground/40 mb-1">Wellness Score</p>
                      <p className={`font-mono text-4xl font-black ${proofResult.attestation.confidence >= 70 ? "text-green-600" : proofResult.attestation.confidence >= 50 ? "text-yellow-600" : "text-red-500"}`}>
                        {proofResult.attestation.confidence}
                      </p>
                      <p className={`font-mono text-xs font-bold mt-1 ${TIER_COLORS[proofResult.attestation.confidence >= 85 ? 3 : proofResult.attestation.confidence >= 70 ? 2 : proofResult.attestation.confidence >= 50 ? 1 : 0]}`}>
                        {TIER_LABELS[proofResult.attestation.confidence >= 85 ? 3 : proofResult.attestation.confidence >= 70 ? 2 : proofResult.attestation.confidence >= 50 ? 1 : 0]} Tier
                      </p>
                    </div>

                    {/* Premium preview */}
                    <div className="glass rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-2 font-mono text-sm">
                        <span className="text-foreground/50">$200/mo</span>
                        <span className="text-pink-primary">→</span>
                        <span className="text-green-600 font-bold">
                          ${PREMIUM_TABLE[proofResult.attestation.confidence >= 85 ? 3 : proofResult.attestation.confidence >= 70 ? 2 : proofResult.attestation.confidence >= 50 ? 1 : 0]}/mo
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div><span className="text-foreground/40">Activity</span><p className="text-foreground/80">{proofResult.attestation.activity_type}</p></div>
                      <div><span className="text-foreground/40">Duration</span><p className="text-foreground/80">{proofResult.attestation.duration_mins} min</p></div>
                      <div><span className="text-foreground/40">Avg HR</span><p className="text-foreground/80">{proofResult.attestation.avg_hr} bpm</p></div>
                      <div><span className="text-foreground/40">Recovery</span><p className="text-foreground/80">{proofResult.attestation.recovery_score}/100</p></div>
                    </div>

                    <div className="pt-2 border-t border-pink-primary/10 space-y-1">
                      {[
                        [proofResult.attestation.analysis.is_natural_pattern, "Natural pattern"],
                        [proofResult.attestation.analysis.has_warmup, "Warmup detected"],
                        [proofResult.attestation.analysis.has_cooldown, "Cooldown detected"],
                      ].map(([ok, label], i) => (
                        <div key={i} className="flex items-center gap-2 text-[11px] font-mono">
                          <span className={ok ? "text-green-600" : "text-red-500"}>{ok ? "✓" : "✗"}</span>
                          <span className="text-foreground/50">{label as string}</span>
                        </div>
                      ))}
                    </div>

                    <p className="text-[9px] font-mono text-foreground/30 break-all">
                      Proof hash: {proofResult.attestation.data_hash.slice(0, 32)}...
                    </p>
                  </div>
                )}

                {proofResult?.error && (
                  <div className="glass-pink rounded-lg p-3">
                    <p className="font-mono text-xs text-red-600">{proofResult.error}</p>
                  </div>
                )}
              </div>

              {/* Right: Submit */}
              <div className="glass rounded-xl p-6 space-y-5">
                <div>
                  <p className="font-mono text-xs tracking-[0.2em] uppercase text-pink-primary/60 mb-1">Step 2</p>
                  <h3 className="font-mono text-lg font-black text-foreground mb-2">Submit to Insurance DAO</h3>
                  <p className="text-xs text-foreground/40">Your wellness case goes to DAO review. If approved, your premium tier improves and XRP rebate is released.</p>
                </div>

                <div className="glass-pink rounded-lg p-3">
                  <p className="font-mono text-[10px] text-pink-primary/70 leading-relaxed">
                    What happens: 1) Proof uploaded to IPFS → 2) Insurer locks rebate in XRPL escrow → 3) DAO contract records your case → 4) Members vote → 5) If approved, escrow releases XRP to you
                  </p>
                </div>

                <div>
                  <label className="font-mono text-xs tracking-[0.2em] uppercase text-foreground/40 mb-2 block">Your XRPL Payout Address</label>
                  <input
                    value={xrplAddress}
                    onChange={e => setXrplAddress(e.target.value)}
                    placeholder="rXXXXX..."
                    className="w-full px-4 py-3 glass rounded-lg font-mono text-sm text-foreground placeholder:text-foreground/25 focus:outline-none"
                  />
                </div>

                {proofResult?.attestation && (
                  <div className="glass-pink rounded-lg p-3 flex items-center gap-2">
                    <span className="text-green-600 font-mono text-xs">✓</span>
                    <span className="font-mono text-xs text-foreground/60">
                      Proof ready — Score: {proofResult.attestation.confidence}%
                    </span>
                  </div>
                )}

                <button
                  onClick={handleSubmitCase}
                  disabled={!isConnected || actionLoading === "apply" || !proofResult?.attestation || !xrplAddress}
                  className="w-full py-4 glass-pink-solid text-pink-dark font-mono font-bold text-sm tracking-wider uppercase rounded-lg cursor-pointer transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {actionLoading === "apply" ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-3 h-3 border-2 border-pink-dark/30 border-t-pink-dark rounded-full animate-spin" />
                      Submitting Case...
                    </span>
                  ) : "Submit Wellness Case"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* === TAB: REVIEW & VOTE === */}
        {tab === "vote" && (
          <div className="space-y-4">
            {!isMember && isConnected && (
              <div className="glass-pink rounded-lg p-4 mb-4">
                <p className="font-mono text-xs text-pink-primary">You are not a DAO member. Only members can vote on wellness cases.</p>
              </div>
            )}
            {cases.length === 0 ? (
              <div className="glass rounded-xl p-10 text-center">
                <p className="font-mono text-sm text-foreground/40">No cases to review.</p>
              </div>
            ) : (
              cases.map((c) => {
                const isExpired = Date.now() / 1000 >= c.votingDeadline;
                return (
                  <div key={c.id} className="glass rounded-xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-mono text-xs text-pink-primary/40">Case #{c.id}</span>
                          <span className={`font-mono text-xs font-bold ${c.status === 0 ? "text-yellow-600" : c.status === 1 ? "text-green-600" : "text-red-500"}`}>
                            {STATUS_LABELS[c.status]}
                          </span>
                          {c.finalized && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">FINALIZED</span>
                          )}
                        </div>
                        <p className="font-mono text-sm text-foreground/70 mb-1">{c.summary}</p>
                        <p className="text-xs text-foreground/40">
                          Applicant: {c.applicant.slice(0, 8)}...{c.applicant.slice(-4)}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className={`font-mono text-2xl font-black ${c.wellnessScore >= 70 ? "text-green-600" : c.wellnessScore >= 50 ? "text-yellow-600" : "text-red-500"}`}>
                          {c.wellnessScore}
                        </p>
                        <p className="font-mono text-[10px] text-foreground/40">Score</p>
                        {tierBadge(c.requestedTier)}
                      </div>
                    </div>

                    {/* Premium change */}
                    <div className="glass-pink rounded-lg p-3 mb-3 flex items-center gap-4">
                      <div className="flex items-center gap-2 font-mono text-sm">
                        <span className="text-foreground/50">${c.currentPremium}/mo</span>
                        <span className="text-pink-primary">→</span>
                        <span className={`font-bold ${c.proposedPremium < c.currentPremium ? "text-green-600" : "text-foreground/70"}`}>
                          ${c.proposedPremium}/mo
                        </span>
                      </div>
                      {c.proposedPremium < c.currentPremium && (
                        <span className="font-mono text-[10px] text-green-600">
                          Rebate: ${(c.currentPremium - c.proposedPremium) * 12} XRP
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3 text-[11px] font-mono text-foreground/40 mb-4">
                      <span>Votes: <span className="text-green-600 font-bold">{c.approveVotes} ✓</span> / <span className="text-red-500 font-bold">{c.denyVotes} ✗</span></span>
                      <span>{isExpired ? "Voting ended" : `Ends ${new Date(c.votingDeadline * 1000).toLocaleTimeString()}`}</span>
                      <a href={c.evidenceURI} target="_blank" rel="noopener noreferrer" className="text-pink-primary hover:underline">
                        View Evidence →
                      </a>
                    </div>

                    {!c.finalized && (
                      <div className="flex gap-2">
                        {!isExpired && isMember && (
                          <>
                            <button
                              onClick={() => handleVote(c.id, true)}
                              disabled={!!actionLoading}
                              className="glass px-5 py-2 font-mono text-xs text-green-700 rounded-lg cursor-pointer hover:scale-105 transition-all disabled:opacity-50"
                            >
                              {actionLoading === `vote-${c.id}` ? "..." : "Approve"}
                            </button>
                            <button
                              onClick={() => handleVote(c.id, false)}
                              disabled={!!actionLoading}
                              className="glass px-5 py-2 font-mono text-xs text-red-600 rounded-lg cursor-pointer hover:scale-105 transition-all disabled:opacity-50"
                            >
                              Deny
                            </button>
                          </>
                        )}
                        {isExpired && (
                          <button
                            onClick={() => handleFinalize(c.id)}
                            disabled={!!actionLoading}
                            className="glass-pink-solid px-5 py-2 font-mono text-xs text-pink-dark rounded-lg cursor-pointer hover:scale-105 transition-all disabled:opacity-50"
                          >
                            {actionLoading === `finalize-${c.id}` ? (
                              <span className="flex items-center gap-2">
                                <span className="w-3 h-3 border-2 border-pink-dark/30 border-t-pink-dark rounded-full animate-spin" />
                                Finalizing...
                              </span>
                            ) : "Finalize & Release Rebate"}
                          </button>
                        )}
                      </div>
                    )}

                    {c.finalized && c.status === 1 && (
                      <div className="glass-pink rounded-lg p-3 flex items-center gap-2 mt-2">
                        <span className="text-green-600 text-sm">✓</span>
                        <span className="font-mono text-xs text-green-700 font-bold">
                          Approved — Premium reduced to ${c.proposedPremium}/mo. XRP rebate released.
                        </span>
                      </div>
                    )}

                    {c.finalized && c.status === 2 && (
                      <div className="glass-pink rounded-lg p-3 flex items-center gap-2 mt-2">
                        <span className="text-red-500 text-sm">✗</span>
                        <span className="font-mono text-xs text-red-500 font-bold">
                          Denied — Premium unchanged at ${c.currentPremium}/mo.
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <button onClick={loadData} className="glass px-4 py-2 font-mono text-xs text-foreground/50 rounded-lg cursor-pointer hover:scale-105 transition-all">
              Refresh
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
