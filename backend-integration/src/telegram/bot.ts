import TelegramBot from "node-telegram-bot-api";
import { ethers } from "ethers";

// ── Config (read lazily so dotenv has loaded) ───────────────────────
const EXPLORER = "https://explorer.testnet.xrplevm.org";

// ── ABIs (minimal read+write) ───────────────────────────────────────
const INSURANCE_ABI = [
  "function nextCaseId() view returns (uint256)",
  "function getWellnessCase(uint256 caseId) view returns (tuple(uint256 id, address applicant, string evidenceURI, bytes32 proofHash, string summary, uint256 wellnessScore, uint256 currentPremium, uint256 proposedPremium, uint8 requestedTier, uint256 createdAt, uint256 votingDeadline, uint256 approveVotes, uint256 denyVotes, bool finalized, uint8 status))",
  "function voteOnCase(uint256 caseId, bool approve) external",
  "function finalizeCase(uint256 caseId) external",
  "function isMember(address) view returns (bool)",
  "function hasVoted(uint256, address) view returns (bool)",
];

const CHALLENGE_ABI = [
  "function challengeCount() view returns (uint256)",
  "function submissionCount() view returns (uint256)",
  "function challenges(uint256) view returns (uint256 id, string title, string description, address creator, uint256 rewardAmount, string escrowTxHash, uint256 votingDuration, bool active, uint256 createdAt)",
  "function submissions(uint256) view returns (uint256 id, uint256 challengeId, address submitter, string evidenceUrl, string xrplAddress, uint256 submittedAt, uint256 votingDeadline, uint8 status, uint256 approveVotes, uint256 denyVotes, bool finalized)",
  "function vote(uint256 submissionId, bool approve) external",
  "function finalizeSubmission(uint256 submissionId) external",
  "function hasVoted(uint256, address) view returns (bool)",
];

// ── State ───────────────────────────────────────────────────────────
const TIER_LABELS = ["High Risk", "Standard", "Improved", "Premium"];
const STATUS_LABELS = ["Pending", "Approved", "Denied"];
const chatDao: Record<number, "insurance" | "challenge"> = {};

// ── Contract helpers (lazy init) ────────────────────────────────────
let provider: ethers.JsonRpcProvider;
let wallet: ethers.Wallet;

function ensureWallet() {
  if (!provider) {
    const rpcUrl = process.env.NEXT_PUBLIC_XRP_EVM_RPC_URL || process.env.XRP_EVM_RPC_URL || "https://rpc.testnet.xrplevm.org";
    provider = new ethers.JsonRpcProvider(rpcUrl);
    const raw = process.env.ORACLE_PRIVATE_KEY || "";
    const key = raw.startsWith("0x") ? raw : `0x${raw}`;
    wallet = new ethers.Wallet(key, provider);
    console.log("[TG Bot] Oracle wallet:", wallet.address);
  }
}

function insuranceDao(signerMode = false) {
  ensureWallet();
  const addr = process.env.NEXT_PUBLIC_INSURANCE_DAO_ADDRESS || "";
  return new ethers.Contract(addr, INSURANCE_ABI, signerMode ? wallet : provider);
}

function challengeDao(signerMode = false) {
  ensureWallet();
  const addr = process.env.NEXT_PUBLIC_DAO_CONTRACT_ADDRESS || "";
  return new ethers.Contract(addr, CHALLENGE_ABI, signerMode ? wallet : provider);
}

function activeDao(chatId: number) {
  return chatDao[chatId] || "insurance";
}

// ── Formatting helpers ──────────────────────────────────────────────
function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function timeLeft(deadline: number): string {
  const secs = deadline - Math.floor(Date.now() / 1000);
  if (secs <= 0) return "Ended";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ── Bot Setup ───────────────────────────────────────────────────────
export function startTelegramBot() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
  if (!botToken) {
    console.warn("[TG Bot] No TELEGRAM_BOT_TOKEN set, skipping bot start");
    return null;
  }

  const bot = new TelegramBot(botToken, { polling: true });
  console.log("[TG Bot] Started in long-polling mode");

  // ── /start ──────────────────────────────────────────────────────
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    chatDao[chatId] = "insurance";
    ensureWallet();
    bot.sendMessage(chatId,
      `🫀 *Proof of Pulse DAO Bot*\n\n` +
      `Oracle wallet: \`${shortAddr(wallet.address)}\`\n` +
      `Active DAO: *Insurance Wellness DAO*\n\n` +
      `Commands:\n` +
      `/cases — View active proposals\n` +
      `/case <id> — View case details\n` +
      `/vote <id> yes|no — Vote on a proposal\n` +
      `/finalize <id> — Finalize a proposal\n` +
      `/switch — Toggle Insurance ↔ Challenge DAO\n` +
      `/status — Bot & contract info`,
      { parse_mode: "Markdown" }
    );
  });

  // ── /switch ─────────────────────────────────────────────────────
  bot.onText(/\/switch/, (msg) => {
    const chatId = msg.chat.id;
    const current = activeDao(chatId);
    const next = current === "insurance" ? "challenge" : "insurance";
    chatDao[chatId] = next;
    const label = next === "insurance" ? "Insurance Wellness DAO" : "Challenge Reward DAO";
    bot.sendMessage(chatId, `Switched to *${label}*`, { parse_mode: "Markdown" });
  });

  // ── /status ─────────────────────────────────────────────────────
  bot.onText(/\/status/, async (msg) => {
    const chatId = msg.chat.id;
    const dao = activeDao(chatId);
    try {
      ensureWallet();
      const balance = await provider.getBalance(wallet.address);
      const balXrp = ethers.formatEther(balance);
      let caseCount = "?";
      if (dao === "insurance") {
        caseCount = String(Number(await insuranceDao().nextCaseId()));
      } else {
        const cc = Number(await challengeDao().challengeCount());
        const sc = Number(await challengeDao().submissionCount());
        caseCount = `${cc} challenges, ${sc} submissions`;
      }
      const label = dao === "insurance" ? "Insurance Wellness DAO" : "Challenge Reward DAO";
      bot.sendMessage(chatId,
        `*Status*\n` +
        `DAO: ${label}\n` +
        `Oracle: \`${shortAddr(wallet.address)}\`\n` +
        `Balance: ${parseFloat(balXrp).toFixed(2)} XRP\n` +
        `Cases: ${caseCount}`,
        { parse_mode: "Markdown" }
      );
    } catch (err: any) {
      bot.sendMessage(chatId, `Error: ${err.message}`);
    }
  });

  // ── /cases ──────────────────────────────────────────────────────
  bot.onText(/\/cases/, async (msg) => {
    const chatId = msg.chat.id;
    const dao = activeDao(chatId);

    try {
      if (dao === "insurance") {
        const count = Number(await insuranceDao().nextCaseId());
        if (count === 0) {
          bot.sendMessage(chatId, "No wellness cases yet.");
          return;
        }
        let text = `*Insurance DAO — ${count} case(s)*\n\n`;
        for (let i = 0; i < count; i++) {
          const c = await insuranceDao().getWellnessCase(i);
          const status = STATUS_LABELS[Number(c.status)] || "Unknown";
          const tier = TIER_LABELS[Number(c.requestedTier)] || "?";
          const votes = `✅${Number(c.approveVotes)} ❌${Number(c.denyVotes)}`;
          const deadline = c.finalized ? "Finalized" : timeLeft(Number(c.votingDeadline));
          text += `*#${i}* | ${status} | Score: ${Number(c.wellnessScore)} | Tier: ${tier}\n`;
          text += `  Votes: ${votes} | ${deadline}\n`;
          text += `  Applicant: \`${shortAddr(c.applicant)}\`\n\n`;
        }
        bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
      } else {
        const challengeCount = Number(await challengeDao().challengeCount());
        const subCount = Number(await challengeDao().submissionCount());
        if (challengeCount === 0) {
          bot.sendMessage(chatId, "No challenges yet.");
          return;
        }
        let text = `*Challenge DAO — ${challengeCount} challenge(s), ${subCount} submission(s)*\n\n`;
        for (let i = 0; i < challengeCount; i++) {
          const ch = await challengeDao().challenges(i);
          text += `*Challenge #${i}:* ${ch.title}\n`;
          text += `  Reward: ${Number(ch.rewardAmount)} XRP | ${ch.active ? "Active" : "Closed"}\n\n`;
        }
        if (subCount > 0) {
          text += `*— Submissions —*\n`;
          for (let i = 0; i < subCount; i++) {
            const s = await challengeDao().submissions(i);
            const status = STATUS_LABELS[Number(s.status)] || "Unknown";
            const votes = `✅${Number(s.approveVotes)} ❌${Number(s.denyVotes)}`;
            const deadline = s.finalized ? "Finalized" : timeLeft(Number(s.votingDeadline));
            text += `*Sub #${i}* (Challenge #${Number(s.challengeId)}) | ${status}\n`;
            text += `  Votes: ${votes} | ${deadline}\n`;
            text += `  Submitter: \`${shortAddr(s.submitter)}\`\n\n`;
          }
        }
        bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
      }
    } catch (err: any) {
      bot.sendMessage(chatId, `Error fetching cases: ${err.message}`);
    }
  });

  // ── /case <id> ──────────────────────────────────────────────────
  bot.onText(/\/case (\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const id = parseInt(match![1]);
    const dao = activeDao(chatId);

    try {
      if (dao === "insurance") {
        const c = await insuranceDao().getWellnessCase(id);
        const status = STATUS_LABELS[Number(c.status)] || "Unknown";
        const tier = TIER_LABELS[Number(c.requestedTier)] || "?";
        ensureWallet();
        const hasVoted = await insuranceDao().hasVoted(id, wallet.address);

        let text = `*Insurance Case #${id}*\n\n`;
        text += `Applicant: \`${c.applicant}\`\n`;
        text += `Wellness Score: *${Number(c.wellnessScore)}*\n`;
        text += `Requested Tier: *${tier}*\n`;
        text += `Current Premium: $${Number(c.currentPremium)}\n`;
        text += `Proposed Premium: $${Number(c.proposedPremium)}\n`;
        text += `Status: *${status}*\n`;
        text += `Votes: ✅ ${Number(c.approveVotes)} | ❌ ${Number(c.denyVotes)}\n`;
        text += `Deadline: ${c.finalized ? "Finalized" : timeLeft(Number(c.votingDeadline))}\n`;
        text += `Summary: ${c.summary || "N/A"}\n`;
        text += `Oracle voted: ${hasVoted ? "Yes" : "No"}\n`;

        if (!c.finalized && !hasVoted) {
          text += `\nUse /vote ${id} yes or /vote ${id} no`;
        }
        if (!c.finalized && Number(c.votingDeadline) <= Math.floor(Date.now() / 1000)) {
          text += `\nVoting ended — use /finalize ${id}`;
        }

        bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
      } else {
        const s = await challengeDao().submissions(id);
        const status = STATUS_LABELS[Number(s.status)] || "Unknown";
        ensureWallet();
        const hasVoted = await challengeDao().hasVoted(id, wallet.address);

        let text = `*Submission #${id}* (Challenge #${Number(s.challengeId)})\n\n`;
        text += `Submitter: \`${s.submitter}\`\n`;
        text += `Status: *${status}*\n`;
        text += `Votes: ✅ ${Number(s.approveVotes)} | ❌ ${Number(s.denyVotes)}\n`;
        text += `Deadline: ${s.finalized ? "Finalized" : timeLeft(Number(s.votingDeadline))}\n`;
        text += `Evidence: ${s.evidenceUrl || "N/A"}\n`;
        text += `Oracle voted: ${hasVoted ? "Yes" : "No"}\n`;

        if (!s.finalized && !hasVoted) {
          text += `\nUse /vote ${id} yes or /vote ${id} no`;
        }
        if (!s.finalized && Number(s.votingDeadline) <= Math.floor(Date.now() / 1000)) {
          text += `\nVoting ended — use /finalize ${id}`;
        }

        bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
      }
    } catch (err: any) {
      bot.sendMessage(chatId, `Error: ${err.message}`);
    }
  });

  // ── /vote <id> yes|no ───────────────────────────────────────────
  bot.onText(/\/vote (\d+) (yes|no|approve|deny)/i, async (msg, match) => {
    const chatId = msg.chat.id;
    const id = parseInt(match![1]);
    const approve = ["yes", "approve"].includes(match![2].toLowerCase());
    const dao = activeDao(chatId);

    bot.sendMessage(chatId, `Submitting ${approve ? "✅ APPROVE" : "❌ DENY"} vote on #${id}...`);

    try {
      let tx: any;
      if (dao === "insurance") {
        const contract = insuranceDao(true);
        tx = await contract.voteOnCase(id, approve);
      } else {
        const contract = challengeDao(true);
        tx = await contract.vote(id, approve);
      }

      bot.sendMessage(chatId, `Tx sent: \`${tx.hash}\`\nWaiting for confirmation...`, { parse_mode: "Markdown" });
      const receipt = await tx.wait();
      bot.sendMessage(chatId,
        `Vote confirmed in block ${receipt.blockNumber}\n` +
        `[View on Explorer](${EXPLORER}/tx/${tx.hash})`,
        { parse_mode: "Markdown" }
      );
    } catch (err: any) {
      const reason = err.reason || err.message || "Unknown error";
      bot.sendMessage(chatId, `Vote failed: ${reason}`);
    }
  });

  // ── /finalize <id> ──────────────────────────────────────────────
  bot.onText(/\/finalize (\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const id = parseInt(match![1]);
    const dao = activeDao(chatId);

    bot.sendMessage(chatId, `Finalizing case #${id}...`);

    try {
      let tx: any;
      if (dao === "insurance") {
        const contract = insuranceDao(true);
        tx = await contract.finalizeCase(id);
      } else {
        const contract = challengeDao(true);
        tx = await contract.finalizeSubmission(id);
      }

      bot.sendMessage(chatId, `Tx sent: \`${tx.hash}\`\nWaiting for confirmation...`, { parse_mode: "Markdown" });
      const receipt = await tx.wait();

      let resultText = `Finalized in block ${receipt.blockNumber}\n[View on Explorer](${EXPLORER}/tx/${tx.hash})`;

      if (dao === "insurance") {
        try {
          const c = await insuranceDao().getWellnessCase(id);
          const status = STATUS_LABELS[Number(c.status)] || "Unknown";
          const tier = TIER_LABELS[Number(c.requestedTier)] || "?";
          resultText += `\n\nOutcome: *${status}*`;
          if (Number(c.status) === 1) {
            resultText += `\nTier upgraded to: *${tier}*`;
            resultText += `\nNew premium: *$${Number(c.proposedPremium)}/mo*`;
            const rebate = Number(c.currentPremium) - Number(c.proposedPremium);
            if (rebate > 0) {
              resultText += `\nRebate: *$${rebate}/mo* (${rebate} XRP escrow release pending)`;
            }
          }
        } catch {
          // couldn't fetch updated case
        }
      }

      bot.sendMessage(chatId, resultText, { parse_mode: "Markdown" });
    } catch (err: any) {
      const reason = err.reason || err.message || "Unknown error";
      bot.sendMessage(chatId, `Finalize failed: ${reason}`);
    }
  });

  // ── /help ───────────────────────────────────────────────────────
  bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    const dao = activeDao(chatId);
    const label = dao === "insurance" ? "Insurance Wellness DAO" : "Challenge Reward DAO";
    bot.sendMessage(chatId,
      `*Proof of Pulse DAO Bot*\n\n` +
      `Current DAO: *${label}*\n\n` +
      `/cases — List all proposals\n` +
      `/case <id> — View details of a specific case\n` +
      `/vote <id> yes — Approve a proposal\n` +
      `/vote <id> no — Deny a proposal\n` +
      `/finalize <id> — Finalize after voting ends\n` +
      `/switch — Toggle between DAOs\n` +
      `/status — Bot & contract info\n` +
      `/help — Show this message`,
      { parse_mode: "Markdown" }
    );
  });

  // ── Unknown command fallback ────────────────────────────────────
  bot.on("message", (msg) => {
    if (msg.text && msg.text.startsWith("/") &&
        !msg.text.match(/^\/(start|cases|case|vote|finalize|switch|status|help)/)) {
      bot.sendMessage(msg.chat.id, "Unknown command. Use /help for available commands.");
    }
  });

  return bot;
}
