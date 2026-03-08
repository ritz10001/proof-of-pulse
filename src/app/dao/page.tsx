"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PixelHeart from "@/components/PixelHeart";
import { useWallet } from "@/blockchain/providers/WalletProvider";
import { useDAO, Challenge, Submission } from "@/blockchain/hooks/useDAO";
import { ethers } from "ethers";

type Tab = "challenges" | "create" | "submit" | "vote";

// Escrow details stored per challenge (client-side for demo)
interface EscrowInfo {
  txHash: string;
  escrowSequence: number;
  sourceAddress: string;
  destinationAddress: string;
  amountXrp: string;
  finishAfter: string;
  cancelAfter: string;
}

// In-memory store for escrow info (keyed by escrowTxHash)
const escrowStore: Record<string, EscrowInfo> = {};

export default function DAOPage() {
  const { address, isConnected, connect, isInstalled } = useWallet();
  const dao = useDAO();

  const [tab, setTab] = useState<Tab>("challenges");
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [txResult, setTxResult] = useState<{ txHash: string; message?: string; xrplTxHash?: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Create challenge form
  const [cTitle, setCTitle] = useState("");
  const [cDesc, setCDesc] = useState("");
  const [cReward, setCReward] = useState("");
  const [cDuration, setCDuration] = useState("300");
  const [cDestAddress, setCDestAddress] = useState("");

  // Submit evidence form
  const [sChallengeId, setSChallengeId] = useState("");
  const [sXrplAddress, setSXrplAddress] = useState("");
  const [proofResult, setProofResult] = useState<any>(null);
  const [proofLoading, setProofLoading] = useState(false);

  // Escrow wallet info
  const [escrowWallet, setEscrowWallet] = useState<{ address: string; balance: string } | null>(null);

  const loadData = async () => {
    const [c, s] = await Promise.all([dao.fetchChallenges(), dao.fetchSubmissions()]);
    setChallenges(c);
    setSubmissions(s);
  };

  const loadEscrowWallet = async () => {
    try {
      const res = await fetch("/api/xrpl/wallet");
      if (res.ok) {
        const data = await res.json();
        setEscrowWallet(data);
      }
    } catch {}
  };

  useEffect(() => {
    loadData();
    loadEscrowWallet();
  }, []);

  // ---- CREATE CHALLENGE: locks XRP in XRPL escrow + creates on-chain challenge ----
  const handleCreateChallenge = async () => {
    if (!cTitle || !cReward) return;
    setActionLoading("create");
    setTxResult(null);

    try {
      // Step 1: Create XRPL escrow (lock funds)
      const destination = cDestAddress || escrowWallet?.address || "";
      const escrowRes = await fetch("/api/xrpl/create-escrow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountXrp: cReward,
          destinationAddress: destination,
        }),
      });

      if (!escrowRes.ok) {
        const err = await escrowRes.json();
        throw new Error(err.error || "Failed to create XRPL escrow");
      }

      const escrowData = await escrowRes.json();
      const escrowInfo: EscrowInfo = escrowData.escrow;

      // Step 2: Create challenge on EVM DAO contract (with escrow tx hash)
      const rewardWei = ethers.parseEther(cReward);
      const result = await dao.createChallenge(
        cTitle,
        cDesc,
        rewardWei,
        escrowInfo.txHash,
        parseInt(cDuration)
      );

      // Store escrow info for later release
      escrowStore[escrowInfo.txHash] = escrowInfo;

      setTxResult({
        txHash: result.txHash,
        message: `Challenge created! ${cReward} XRP locked in XRPL escrow.`,
        xrplTxHash: escrowInfo.txHash,
      });

      setCTitle(""); setCDesc(""); setCReward(""); setCDestAddress("");
      await loadData();
      await loadEscrowWallet();
    } catch (err: any) {
      setTxResult({ txHash: "", message: `Error: ${err.message}` });
    } finally {
      setActionLoading(null);
    }
  };

  // ---- SUBMIT EVIDENCE: runs proof engine on demo health data, uploads to IPFS ----
  const handleGenerateProof = async () => {
    setProofLoading(true);
    setProofResult(null);
    try {
      // Generate realistic demo workout data (20 min cardio session)
      const now = Date.now();
      const samples = [];
      for (let i = 0; i < 120; i++) {
        const t = i / 6; // minutes
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

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hr_samples: samples }),
      });

      if (!res.ok) throw new Error("Analysis failed");
      const data = await res.json();
      setProofResult(data);
    } catch (err: any) {
      setProofResult({ error: err.message });
    } finally {
      setProofLoading(false);
    }
  };

  const handleSubmitEvidence = async () => {
    if (!sChallengeId || !sXrplAddress || !proofResult?.attestation) return;
    setActionLoading("submit");
    setTxResult(null);

    try {
      // Upload proof to IPFS via attest endpoint
      const attestRes = await fetch("/api/attest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: address,
          hr_samples: proofResult.hr_timeline?.map((p: any) => ({
            timestamp: p.time,
            bpm: p.bpm,
          })) || [],
        }),
      });

      let evidenceUrl = "";
      if (attestRes.ok) {
        const attestData = await attestRes.json();
        evidenceUrl = attestData.pinata?.gateway_url || attestData.storage_id || `proof:${attestData.attestation_key || "demo"}`;
      } else {
        evidenceUrl = `proof:${proofResult.attestation.data_hash}`;
      }

      // Submit evidence to DAO contract
      const result = await dao.submitEvidence(parseInt(sChallengeId), evidenceUrl, sXrplAddress);
      setTxResult({
        txHash: result.txHash,
        message: `Evidence submitted! Confidence: ${proofResult.attestation.confidence}%. Awaiting DAO vote.`,
      });

      setSChallengeId(""); setSXrplAddress("");
      setProofResult(null);
      await loadData();
    } catch (err: any) {
      setTxResult({ txHash: "", message: `Error: ${err.message}` });
    } finally {
      setActionLoading(null);
    }
  };

  // ---- VOTE ----
  const handleVote = async (submissionId: number, approve: boolean) => {
    setActionLoading(`vote-${submissionId}`);
    setTxResult(null);
    try {
      const result = await dao.vote(submissionId, approve);
      setTxResult({ txHash: result.txHash, message: `Vote cast: ${approve ? "Approved" : "Denied"}` });
      await loadData();
    } catch (err: any) {
      setTxResult({ txHash: "", message: `Error: ${err.message}` });
    } finally {
      setActionLoading(null);
    }
  };

  // ---- FINALIZE: if approved, triggers XRPL EscrowFinish ----
  const handleFinalize = async (submissionId: number) => {
    setActionLoading(`finalize-${submissionId}`);
    setTxResult(null);
    try {
      // Step 1: Finalize on DAO contract
      const result = await dao.finalizeSubmission(submissionId);

      // Step 2: Check if approved — if so, release XRPL escrow
      const updatedSubmissions = await dao.fetchSubmissions();
      const sub = updatedSubmissions.find(s => s.id === submissionId);
      const challenge = challenges.find(c => c.id === sub?.challengeId);

      if (sub?.status === 1 && challenge?.escrowTxHash) {
        // Approved! Try to release escrow
        const escrowInfo = escrowStore[challenge.escrowTxHash];
        if (escrowInfo) {
          try {
            const releaseRes = await fetch("/api/xrpl/release-escrow", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                escrowOwner: escrowInfo.sourceAddress,
                escrowSequence: escrowInfo.escrowSequence,
              }),
            });

            if (releaseRes.ok) {
              const releaseData = await releaseRes.json();
              setTxResult({
                txHash: result.txHash,
                message: `Approved & XRP Released! Escrow funds sent to winner.`,
                xrplTxHash: releaseData.txHash,
              });
              await loadData();
              await loadEscrowWallet();
              return;
            }
          } catch (escrowErr: any) {
            console.warn("Escrow release attempt:", escrowErr.message);
          }
        }

        setTxResult({
          txHash: result.txHash,
          message: `Approved! Escrow release pending (finishAfter not yet reached — wait ~60s after challenge creation).`,
          xrplTxHash: challenge.escrowTxHash,
        });
      } else {
        setTxResult({
          txHash: result.txHash,
          message: sub?.status === 2 ? "Submission denied by DAO vote." : "Finalized.",
        });
      }

      await loadData();
    } catch (err: any) {
      setTxResult({ txHash: "", message: `Error: ${err.message}` });
    } finally {
      setActionLoading(null);
    }
  };

  const statusLabel = (s: number) => ["Pending", "Approved", "Denied"][s] || "Unknown";
  const statusColor = (s: number) => ["text-yellow-600", "text-green-600", "text-red-500"][s] || "";

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
            <span className="glass-pink text-[10px] font-mono px-2.5 py-1 text-pink-primary rounded-md">DAO</span>
          </div>
          <div className="flex items-center gap-2">
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
            Challenge Reward DAO
          </p>
          <h1 className="font-mono text-4xl md:text-5xl font-black text-foreground mb-4">
            Challenge. Prove. <span className="text-pink-primary">Earn.</span>
          </h1>
          <p className="text-foreground/50 max-w-xl">
            Verified workouts unlock real XRP rewards. Sponsors lock funds in XRPL escrow, your biometric proof triggers the payout.
          </p>
        </div>

        {/* ── DEMO FLOW PIPELINE ── */}
        <div className="glass rounded-xl p-6 mb-10">
          <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-pink-primary/50 mb-5">Demo Flow Pipeline</p>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {[
              { label: "Create Challenge", sub: "Sponsor sets reward" },
              { label: "Lock XRP", sub: "XRPL escrow created" },
              { label: "Workout", sub: "User exercises" },
              { label: "Prove", sub: "Biometric attestation" },
              { label: "DAO Vote", sub: "Members verify" },
              { label: "XRP Payout", sub: "Escrow released" },
            ].map((item, i) => (
              <div key={i} className="glass-pink rounded-lg p-3 text-center relative">
                <p className="font-mono text-[10px] text-pink-primary/40 mb-1">0{i + 1}</p>
                <p className="font-mono text-[10px] font-bold text-foreground/80">{item.label}</p>
                <p className="font-mono text-[9px] text-foreground/40">{item.sub}</p>
                {i < 5 && (
                  <div className="hidden md:block absolute right-[-10px] top-1/2 -translate-y-1/2 text-pink-primary/30 font-mono text-xs z-10">→</div>
                )}
              </div>
            ))}
          </div>
          {escrowWallet && (
            <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] font-mono text-foreground/40">
              <span>XRPL Escrow Wallet: <span className="text-pink-primary">{escrowWallet.address.slice(0, 12)}...</span></span>
              <span>Balance: <span className="text-foreground/60">{parseFloat(escrowWallet.balance).toFixed(2)} XRP</span></span>
              <span className="text-[9px] glass-pink px-2 py-0.5 rounded text-pink-primary/60">DEVNET</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-10">
          {(["challenges", "create", "submit", "vote"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setTxResult(null); }}
              className={`${tab === t ? "glass-pink-solid text-pink-dark" : "glass text-foreground/70"} px-5 py-2.5 font-mono text-xs tracking-wider uppercase rounded-lg cursor-pointer transition-all hover:scale-105`}
            >
              {t === "challenges" ? "Active Challenges" : t === "create" ? "Create Challenge" : t === "submit" ? "Submit Evidence" : "Vote & Finalize"}
            </button>
          ))}
        </div>

        {/* Tx success banner */}
        {txResult && txResult.txHash && (
          <div className="glass rounded-lg p-4 mb-8 space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-pink-primary font-mono text-xs">&#10003;</span>
              <span className="font-mono text-xs text-foreground/70">
                {txResult.message || "Transaction confirmed"}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-[11px] font-mono">
              {txResult.txHash && (
                <a
                  href={`https://explorer.testnet.xrplevm.org/tx/${txResult.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-primary hover:underline"
                >
                  EVM Tx: {txResult.txHash.slice(0, 16)}...
                </a>
              )}
              {txResult.xrplTxHash && (
                <a
                  href={`https://devnet.xrpl.org/transactions/${txResult.xrplTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-primary hover:underline"
                >
                  XRPL Tx: {txResult.xrplTxHash.slice(0, 16)}...
                </a>
              )}
            </div>
          </div>
        )}

        {/* Error-only banner */}
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

        {/* === TAB: CHALLENGES === */}
        {tab === "challenges" && (
          <div className="space-y-4">
            {challenges.length === 0 ? (
              <div className="glass rounded-xl p-10 text-center">
                <p className="font-mono text-sm text-foreground/40">No challenges yet. Be the first to create one.</p>
              </div>
            ) : (
              challenges.map((c) => {
                const subs = submissions.filter(s => s.challengeId === c.id);
                return (
                  <div key={c.id} className="glass rounded-xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-xs text-pink-primary/40">#{c.id}</span>
                          <h3 className="font-mono text-lg font-black text-foreground">{c.title}</h3>
                          {c.active ? (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-green-100 text-green-700">ACTIVE</span>
                          ) : (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">CLOSED</span>
                          )}
                        </div>
                        <p className="text-sm text-foreground/50 leading-relaxed">{c.description}</p>
                      </div>
                      <div className="text-right shrink-0 ml-6">
                        <p className="font-mono text-2xl font-black text-pink-primary">
                          {ethers.formatEther(c.rewardAmount)}
                        </p>
                        <p className="font-mono text-[10px] text-foreground/40 uppercase">XRP Reward</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-[11px] font-mono text-foreground/40">
                      <span>Creator: {c.creator.slice(0, 6)}...{c.creator.slice(-4)}</span>
                      <span>Vote window: {c.votingDuration < 3600 ? `${Math.round(c.votingDuration / 60)} min` : `${Math.round(c.votingDuration / 3600)} hr`}</span>
                      <span>Created: {new Date(c.createdAt * 1000).toLocaleDateString()}</span>
                      {c.escrowTxHash && (
                        <a
                          href={`https://devnet.xrpl.org/transactions/${c.escrowTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-pink-primary hover:underline"
                        >
                          XRPL Escrow →
                        </a>
                      )}
                    </div>
                    {subs.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-pink-primary/10 space-y-2">
                        <p className="font-mono text-[10px] text-foreground/40 uppercase tracking-wider">Submissions</p>
                        {subs.map(s => (
                          <div key={s.id} className="glass-pink rounded-lg p-3 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <span className="font-mono text-xs text-pink-primary/40">#{s.id}</span>
                              <span className="font-mono text-xs text-foreground/60">{s.submitter.slice(0, 8)}...</span>
                              <span className={`font-mono text-xs font-bold ${statusColor(s.status)}`}>
                                {statusLabel(s.status)}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 font-mono text-xs text-foreground/50">
                              <span className="text-green-600">{s.approveVotes} yes</span>
                              <span className="text-red-500">{s.denyVotes} no</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <button
              onClick={loadData}
              className="glass px-4 py-2 font-mono text-xs text-foreground/50 rounded-lg cursor-pointer hover:scale-105 transition-all"
            >
              Refresh
            </button>
          </div>
        )}

        {/* === TAB: CREATE CHALLENGE === */}
        {tab === "create" && (
          <div className="max-w-lg">
            <div className="glass rounded-xl p-8 space-y-5">
              <div className="glass-pink rounded-lg p-3 mb-2">
                <p className="font-mono text-[10px] text-pink-primary/70 leading-relaxed">
                  This will: 1) Create an XRPL Devnet escrow locking your reward XRP → 2) Register the challenge on the DAO smart contract with the escrow tx hash
                </p>
              </div>
              <div>
                <label className="font-mono text-xs tracking-[0.2em] uppercase text-foreground/40 mb-2 block">Challenge Title</label>
                <input
                  value={cTitle}
                  onChange={e => setCTitle(e.target.value)}
                  placeholder="e.g. 20-min Cardio Above Threshold"
                  className="w-full px-4 py-3 glass rounded-lg font-mono text-sm text-foreground placeholder:text-foreground/25 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-mono text-xs tracking-[0.2em] uppercase text-foreground/40 mb-2 block">Description</label>
                <textarea
                  value={cDesc}
                  onChange={e => setCDesc(e.target.value)}
                  placeholder="Complete 20 minutes of valid cardio with HR above threshold. Proof engine must return confidence >= 70%."
                  rows={3}
                  className="w-full px-4 py-3 glass rounded-lg font-mono text-sm text-foreground placeholder:text-foreground/25 focus:outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-xs tracking-[0.2em] uppercase text-foreground/40 mb-2 block">Reward (XRP)</label>
                  <input
                    value={cReward}
                    onChange={e => setCReward(e.target.value)}
                    placeholder="10"
                    type="number"
                    className="w-full px-4 py-3 glass rounded-lg font-mono text-sm text-foreground placeholder:text-foreground/25 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-mono text-xs tracking-[0.2em] uppercase text-foreground/40 mb-2 block">Vote Duration</label>
                  <select
                    value={cDuration}
                    onChange={e => setCDuration(e.target.value)}
                    className="w-full px-4 py-3 glass rounded-lg font-mono text-sm text-foreground focus:outline-none cursor-pointer"
                  >
                    <option value="120">2 minutes (demo)</option>
                    <option value="300">5 minutes</option>
                    <option value="900">15 minutes</option>
                    <option value="3600">1 hour</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="font-mono text-xs tracking-[0.2em] uppercase text-foreground/40 mb-2 block">
                  XRPL Destination Address <span className="text-foreground/25">(optional — defaults to escrow wallet)</span>
                </label>
                <input
                  value={cDestAddress}
                  onChange={e => setCDestAddress(e.target.value)}
                  placeholder="rXXXXX... (leave empty for self-escrow)"
                  className="w-full px-4 py-3 glass rounded-lg font-mono text-sm text-foreground placeholder:text-foreground/25 focus:outline-none"
                />
              </div>
              <button
                onClick={handleCreateChallenge}
                disabled={!isConnected || actionLoading === "create" || !cTitle || !cReward}
                className="w-full py-4 glass-pink-solid text-pink-dark font-mono font-bold text-sm tracking-wider uppercase rounded-lg cursor-pointer transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {actionLoading === "create" ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3 h-3 border-2 border-pink-dark/30 border-t-pink-dark rounded-full animate-spin" />
                    Creating Escrow & Challenge...
                  </span>
                ) : "Lock XRP & Create Challenge"}
              </button>
            </div>
          </div>
        )}

        {/* === TAB: SUBMIT EVIDENCE === */}
        {tab === "submit" && (
          <div className="max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Proof Generation */}
              <div className="glass rounded-xl p-6 space-y-5">
                <div>
                  <p className="font-mono text-xs tracking-[0.2em] uppercase text-pink-primary/60 mb-1">Step 1</p>
                  <h3 className="font-mono text-lg font-black text-foreground mb-2">Generate Proof</h3>
                  <p className="text-xs text-foreground/40">Run the biometric proof engine on your workout data to generate an attestation.</p>
                </div>

                <button
                  onClick={handleGenerateProof}
                  disabled={proofLoading}
                  className="w-full py-3 glass-pink-solid text-pink-dark font-mono font-bold text-xs tracking-wider uppercase rounded-lg cursor-pointer transition-all hover:scale-105 disabled:opacity-50"
                >
                  {proofLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-3 h-3 border-2 border-pink-dark/30 border-t-pink-dark rounded-full animate-spin" />
                      Analyzing Workout...
                    </span>
                  ) : "Run Proof Engine (Demo Data)"}
                </button>

                {proofResult?.attestation && (
                  <div className="glass-pink rounded-lg p-4 space-y-2">
                    <p className="font-mono text-[10px] tracking-wider uppercase text-pink-primary/60">Attestation Result</p>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div>
                        <span className="text-foreground/40">Confidence</span>
                        <p className={`font-bold ${proofResult.attestation.confidence >= 70 ? "text-green-600" : "text-yellow-600"}`}>
                          {proofResult.attestation.confidence}%
                        </p>
                      </div>
                      <div>
                        <span className="text-foreground/40">Activity</span>
                        <p className="text-foreground/80">{proofResult.attestation.activity_type}</p>
                      </div>
                      <div>
                        <span className="text-foreground/40">Duration</span>
                        <p className="text-foreground/80">{proofResult.attestation.duration_mins} min</p>
                      </div>
                      <div>
                        <span className="text-foreground/40">Avg HR</span>
                        <p className="text-foreground/80">{proofResult.attestation.avg_hr} bpm</p>
                      </div>
                      <div>
                        <span className="text-foreground/40">Max HR</span>
                        <p className="text-foreground/80">{proofResult.attestation.max_hr} bpm</p>
                      </div>
                      <div>
                        <span className="text-foreground/40">Recovery</span>
                        <p className="text-foreground/80">{proofResult.attestation.recovery_score}/100</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-pink-primary/10 space-y-1">
                      <div className="flex items-center gap-2 text-[11px] font-mono">
                        <span className={proofResult.attestation.analysis.is_natural_pattern ? "text-green-600" : "text-red-500"}>
                          {proofResult.attestation.analysis.is_natural_pattern ? "✓" : "✗"}
                        </span>
                        <span className="text-foreground/50">Natural pattern</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-mono">
                        <span className={proofResult.attestation.analysis.has_warmup ? "text-green-600" : "text-red-500"}>
                          {proofResult.attestation.analysis.has_warmup ? "✓" : "✗"}
                        </span>
                        <span className="text-foreground/50">Warmup detected</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-mono">
                        <span className={proofResult.attestation.analysis.has_cooldown ? "text-green-600" : "text-red-500"}>
                          {proofResult.attestation.analysis.has_cooldown ? "✓" : "✗"}
                        </span>
                        <span className="text-foreground/50">Cooldown detected</span>
                      </div>
                    </div>
                    <p className="text-[9px] font-mono text-foreground/30 break-all">
                      Hash: {proofResult.attestation.data_hash.slice(0, 32)}...
                    </p>
                  </div>
                )}

                {proofResult?.error && (
                  <div className="glass-pink rounded-lg p-3">
                    <p className="font-mono text-xs text-red-600">{proofResult.error}</p>
                  </div>
                )}
              </div>

              {/* Right: Submit Form */}
              <div className="glass rounded-xl p-6 space-y-5">
                <div>
                  <p className="font-mono text-xs tracking-[0.2em] uppercase text-pink-primary/60 mb-1">Step 2</p>
                  <h3 className="font-mono text-lg font-black text-foreground mb-2">Submit to DAO</h3>
                  <p className="text-xs text-foreground/40">Link your proof to a challenge and provide your XRPL address for payout.</p>
                </div>
                <div>
                  <label className="font-mono text-xs tracking-[0.2em] uppercase text-foreground/40 mb-2 block">Challenge</label>
                  <select
                    value={sChallengeId}
                    onChange={e => setSChallengeId(e.target.value)}
                    className="w-full px-4 py-3 glass rounded-lg font-mono text-sm text-foreground focus:outline-none cursor-pointer"
                  >
                    <option value="">Select a challenge...</option>
                    {challenges.filter(c => c.active).map(c => (
                      <option key={c.id} value={c.id}>
                        #{c.id} — {c.title} ({ethers.formatEther(c.rewardAmount)} XRP)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-mono text-xs tracking-[0.2em] uppercase text-foreground/40 mb-2 block">Your XRPL Payout Address</label>
                  <input
                    value={sXrplAddress}
                    onChange={e => setSXrplAddress(e.target.value)}
                    placeholder="rXXXXX..."
                    className="w-full px-4 py-3 glass rounded-lg font-mono text-sm text-foreground placeholder:text-foreground/25 focus:outline-none"
                  />
                </div>

                {proofResult?.attestation && (
                  <div className="glass-pink rounded-lg p-3 flex items-center gap-2">
                    <span className="text-green-600 font-mono text-xs">✓</span>
                    <span className="font-mono text-xs text-foreground/60">
                      Proof ready — {proofResult.attestation.confidence}% confidence
                    </span>
                  </div>
                )}

                <button
                  onClick={handleSubmitEvidence}
                  disabled={!isConnected || actionLoading === "submit" || !sChallengeId || !sXrplAddress || !proofResult?.attestation}
                  className="w-full py-4 glass-pink-solid text-pink-dark font-mono font-bold text-sm tracking-wider uppercase rounded-lg cursor-pointer transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {actionLoading === "submit" ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-3 h-3 border-2 border-pink-dark/30 border-t-pink-dark rounded-full animate-spin" />
                      Submitting to DAO...
                    </span>
                  ) : "Submit Evidence to DAO"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* === TAB: VOTE & FINALIZE === */}
        {tab === "vote" && (
          <div className="space-y-4">
            {submissions.length === 0 ? (
              <div className="glass rounded-xl p-10 text-center">
                <p className="font-mono text-sm text-foreground/40">No submissions yet.</p>
              </div>
            ) : (
              submissions.map((s) => {
                const challenge = challenges.find(c => c.id === s.challengeId);
                const isExpired = Date.now() / 1000 >= s.votingDeadline;
                return (
                  <div key={s.id} className="glass rounded-xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-mono text-xs text-pink-primary/40">Submission #{s.id}</span>
                          <span className={`font-mono text-xs font-bold ${statusColor(s.status)}`}>
                            {statusLabel(s.status)}
                          </span>
                          {s.finalized && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">FINALIZED</span>
                          )}
                        </div>
                        <p className="font-mono text-sm font-bold text-foreground mb-1">
                          Challenge: {challenge?.title || `#${s.challengeId}`}
                          {challenge && (
                            <span className="ml-2 text-pink-primary font-mono text-xs">
                              ({ethers.formatEther(challenge.rewardAmount)} XRP)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-foreground/50">
                          By {s.submitter.slice(0, 8)}...{s.submitter.slice(-4)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex gap-4 font-mono text-sm">
                          <span className="text-green-600 font-bold">{s.approveVotes} &#10003;</span>
                          <span className="text-red-500 font-bold">{s.denyVotes} &#10007;</span>
                        </div>
                        <p className="font-mono text-[10px] text-foreground/40 mt-1">
                          {isExpired ? "Voting ended" : `Ends ${new Date(s.votingDeadline * 1000).toLocaleTimeString()}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 text-[11px] font-mono text-foreground/40 mb-4">
                      <a href={s.evidenceUrl} target="_blank" rel="noopener noreferrer" className="text-pink-primary hover:underline">
                        View Evidence →
                      </a>
                      <span>XRPL Payout: {s.xrplAddress.slice(0, 12)}...</span>
                      {challenge?.escrowTxHash && (
                        <a
                          href={`https://devnet.xrpl.org/transactions/${challenge.escrowTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-pink-primary hover:underline"
                        >
                          Escrow Tx →
                        </a>
                      )}
                    </div>

                    {!s.finalized && (
                      <div className="flex gap-2">
                        {!isExpired && (
                          <>
                            <button
                              onClick={() => handleVote(s.id, true)}
                              disabled={!!actionLoading}
                              className="glass px-5 py-2 font-mono text-xs text-green-700 rounded-lg cursor-pointer hover:scale-105 transition-all disabled:opacity-50"
                            >
                              {actionLoading === `vote-${s.id}` ? "..." : "Approve"}
                            </button>
                            <button
                              onClick={() => handleVote(s.id, false)}
                              disabled={!!actionLoading}
                              className="glass px-5 py-2 font-mono text-xs text-red-600 rounded-lg cursor-pointer hover:scale-105 transition-all disabled:opacity-50"
                            >
                              Deny
                            </button>
                          </>
                        )}
                        {isExpired && (
                          <button
                            onClick={() => handleFinalize(s.id)}
                            disabled={!!actionLoading}
                            className="glass-pink-solid px-5 py-2 font-mono text-xs text-pink-dark rounded-lg cursor-pointer hover:scale-105 transition-all disabled:opacity-50"
                          >
                            {actionLoading === `finalize-${s.id}` ? (
                              <span className="flex items-center gap-2">
                                <span className="w-3 h-3 border-2 border-pink-dark/30 border-t-pink-dark rounded-full animate-spin" />
                                Finalizing & Releasing XRP...
                              </span>
                            ) : "Finalize & Release Escrow"}
                          </button>
                        )}
                      </div>
                    )}

                    {s.finalized && s.status === 1 && (
                      <div className="glass-pink rounded-lg p-3 flex items-center gap-2 mt-2">
                        <span className="text-green-600 text-sm">✓</span>
                        <span className="font-mono text-xs text-green-700 font-bold">
                          Approved — XRP escrow released to {s.xrplAddress.slice(0, 12)}...
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <button
              onClick={loadData}
              className="glass px-4 py-2 font-mono text-xs text-foreground/50 rounded-lg cursor-pointer hover:scale-105 transition-all"
            >
              Refresh
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
