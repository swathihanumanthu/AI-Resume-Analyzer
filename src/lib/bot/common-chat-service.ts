import { analyzeSingleResume } from '../engine/analyzer-pipeline';
import { LocalAnalysisProvider } from '../ai/local-analysis-provider';
import { GeminiProvider } from '../ai/gemini-provider';
import { DEMO_JOB_DESCRIPTION, DEMO_RESUME_A } from '../demo/demo-data';

export interface IncomingBotMessage {
  platform: 'telegram' | 'discord' | 'slack' | 'whatsapp' | 'googlechat';
  senderId: string;
  senderName: string;
  text: string;
  attachmentText?: string;
}

export interface BotResponse {
  replyText: string;
  platform: string;
  targetId: string;
}

// In-memory session store for current conversation contexts
const sessionStore = new Map<string, ReturnType<typeof analyzeSingleResume>>();

export async function processCommonChatService(msg: IncomingBotMessage): Promise<BotResponse> {
  const sessionKey = `${msg.platform}_${msg.senderId}`;
  let analysis = sessionStore.get(sessionKey);

  const textLower = msg.text.toLowerCase().trim();

  // 1. If text or attachment contains JD/Resume analysis trigger or upload
  if (msg.attachmentText || textLower.includes('analyze') || textLower.startsWith('/analyze') || textLower.includes('demo')) {
    const jdText = textLower.includes('demo') ? DEMO_JOB_DESCRIPTION : (msg.attachmentText || msg.text);
    const resumeText = msg.attachmentText || DEMO_RESUME_A;

    analysis = analyzeSingleResume(jdText, resumeText, `${msg.senderName}_Resume.pdf`);
    sessionStore.set(sessionKey, analysis);

    const replyText = `📊 **AI Resume Analysis Complete** for *${analysis.candidateName}*!

🎯 **Target Role:** ${analysis.jobTitle}
💯 **AI ATS Compatibility Score:** **${analysis.atsScore.totalScore}/100**
⭐ **JD Alignment:** **${analysis.alignmentScore.tier} Tier** (${analysis.alignmentScore.score}/100)

✅ **Matched Skills:** ${analysis.matchedSkills.slice(0, 4).map((m) => m.jdSkill).join(', ') || 'None'}
⚠️ **Undetected Skills:** ${analysis.missingSkills.slice(0, 3).map((m) => m.skill).join(', ') || 'None'}

💬 *Reply with commands like:*
- "Why is my ATS score low?"
- "What skills am I missing?"
- "Rewrite my summary"
- "Give me interview questions"`;

    return { replyText, platform: msg.platform, targetId: msg.senderId };
  }

  // 2. If session analysis does not exist yet, initialize default demo session
  if (!analysis) {
    analysis = analyzeSingleResume(DEMO_JOB_DESCRIPTION, DEMO_RESUME_A, 'Demo_Resume.pdf');
    sessionStore.set(sessionKey, analysis);
  }

  // 3. Delegate query to AI Provider (Gemini if key configured, else Local Heuristic Engine)
  const geminiKey = process.env.GEMINI_API_KEY;
  const aiProvider = geminiKey ? new GeminiProvider(geminiKey) : new LocalAnalysisProvider();

  const replyText = await aiProvider.answerChatQuestion(msg.text, analysis);
  return { replyText, platform: msg.platform, targetId: msg.senderId };
}
