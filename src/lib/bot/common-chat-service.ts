import { analyzeSingleResume } from '../engine/analyzer-pipeline';
import { evaluateMockAnswer } from '../engine/mock-interviewer';
import { DEMO_JOB_DESCRIPTION, DEMO_RESUME_A } from '../demo/demo-data';
import { FullAnalysisResult, InterviewQuestionItem } from '../../types/analyzer';

export interface IncomingBotMessage {
  platform: 'telegram' | 'discord' | 'google-chat' | 'whatsapp' | 'slack';
  senderId: string;
  senderName: string;
  text: string;
  attachmentText?: string;
}

export interface BotResponse {
  replyText: string;
  platform: string;
  targetId: string;
  buttons?: Array<{ label: string; action: string }>;
}

interface UserSession {
  analysis: FullAnalysisResult;
  isInterviewMode: boolean;
  currentQuestionIdx: number;
}

// Session store key: `${platform}_${senderId}`
const sessionStore = new Map<string, UserSession>();

export async function processCommonChatService(msg: IncomingBotMessage): Promise<BotResponse> {
  const sessionKey = `${msg.platform}_${msg.senderId}`;
  let session = sessionStore.get(sessionKey);

  const textRaw = msg.text.trim();
  const textLower = textRaw.toLowerCase();

  // Helper to ensure analysis exists
  const getOrInitAnalysis = (): FullAnalysisResult => {
    if (!session) {
      const jd = msg.attachmentText || DEMO_JOB_DESCRIPTION;
      const res = msg.attachmentText || DEMO_RESUME_A;
      const analysis = analyzeSingleResume(jd, res, `${msg.senderName}_Resume.pdf`);
      session = { analysis, isInterviewMode: false, currentQuestionIdx: 0 };
      sessionStore.set(sessionKey, session);
    }
    return session.analysis;
  };

  // Standard Buttons
  const standardButtons = [
    { label: 'Analyze Resume', action: '/analyze' },
    { label: 'Missing Skills', action: '/missingskills' },
    { label: 'Explain ATS Score', action: '/ats' },
    { label: 'Improve Resume', action: '/improvements' },
    { label: 'Learning Roadmap', action: '/roadmap' },
    { label: 'What-If Score', action: '/whatif' },
    { label: 'Interview Me', action: '/interview' },
  ];

  // 1. UPLOAD / ANALYZING RESUME & START COMMAND
  if (
    msg.attachmentText ||
    textLower === '/start' ||
    textLower.includes('analyze') ||
    textLower.startsWith('/analyze') ||
    textLower.includes('upload')
  ) {
    if (!msg.attachmentText && (textLower === 'analyze my resume' || textLower === '/analyze') && !session) {
      // Prompt user to upload or try demo
      const jd = DEMO_JOB_DESCRIPTION;
      const res = DEMO_RESUME_A;
      const analysis = analyzeSingleResume(jd, res, `${msg.senderName}_Resume.pdf`);
      session = { analysis, isInterviewMode: false, currentQuestionIdx: 0 };
      sessionStore.set(sessionKey, session);
    } else {
      const jd = msg.attachmentText || DEMO_JOB_DESCRIPTION;
      const res = msg.attachmentText || DEMO_RESUME_A;
      const analysis = analyzeSingleResume(jd, res, `${msg.senderName}_Resume.pdf`);
      session = { analysis, isInterviewMode: false, currentQuestionIdx: 0 };
      sessionStore.set(sessionKey, session);
    }

    const a = session.analysis;
    const matchedStr = a.matchedSkills.slice(0, 3).map((s) => s.jdSkill).join(', ') || 'None';
    const partialStr = a.partiallyMatchedSkills.slice(0, 2).map((s) => s.jdSkill).join(', ') || 'None';
    const missingStr = a.missingSkills.slice(0, 3).map((s) => s.skill).join(', ') || 'None';

    const replyText = `🎯 **JOB READINESS:** ${a.readinessScore.score}/100 (${a.readinessScore.tier})
🤖 **ATS SCORE:** ${a.atsScore.totalScore}/100
🔗 **JD ALIGNMENT:** ${a.alignmentScore.tier} Tier (${a.alignmentScore.score}/100)

✅ **Matched Skills:** ${matchedStr}
⚠️ **Partial Skills:** ${partialStr}
❌ **Not Detected Skills:** ${missingStr}

📌 **Biggest Gap:** ${a.gapActions[0]?.skill || 'AWS'} — ${a.gapActions[0]?.statusNotice || 'Gain hands-on experience.'}
📚 **Skills to Learn:** ${a.recommendedSkills.slice(0, 3).map((s) => s.skill).join(', ')}
🚀 **Recommended Projects:** ${a.projectRecommendations[0]?.title || 'Cloud-Native Job Tracker'}
🎓 **Learning Resources:** ${a.courseRecommendations[0]?.courseTitle || 'Official Documentation'}
👔 **Recruiter Impression:** "${a.recruiterLens.firstImpression}"
📝 **Resume Improvements:** ${a.resumeHealth.biggestOpportunity}

Reply with buttons or commands:
• Missing Skills
• Explain ATS Score
• Improve Resume
• Learning Roadmap
• What-If Score
• Interview Me`;

    return { replyText, platform: msg.platform, targetId: msg.senderId, buttons: standardButtons };
  }

  // 2. INTERVIEW MODE HANDLING
  if (session && session.isInterviewMode) {
    if (textLower === 'exit' || textLower === 'stop' || textLower === '/exit') {
      session.isInterviewMode = false;
      return {
        replyText: '🏁 **Mock Interview Mode Exited.** Select any option below to continue:',
        platform: msg.platform,
        targetId: msg.senderId,
        buttons: standardButtons,
      };
    }

    const questions = session.analysis.interviewQuestions;
    const currentQ = questions[session.currentQuestionIdx % questions.length];

    // Evaluate candidate answer using strict mock interviewer engine
    const evalRes = evaluateMockAnswer(currentQ, textRaw, session.analysis.careerTwin.summaryMessage);

    session.currentQuestionIdx = (session.currentQuestionIdx + 1) % questions.length;
    const nextQ = questions[session.currentQuestionIdx];

    const replyText = `📊 **INTERVIEW ANSWER EVALUATION**

Status: ${evalRes.relevanceStatus}
Quality Tier: **${evalRes.answerQualityTier}** (Overall Score: ${evalRes.overallScorePct}%)

• **Relevance:** ${evalRes.questionRelevancePct}%
• **Technical Accuracy:** ${evalRes.technicalAccuracyPct}%
• **Concept Coverage:** ${evalRes.conceptCoveragePct}%
• **Depth:** ${evalRes.depthPct}%
• **Practical Evidence:** ${evalRes.practicalEvidencePct}%

${evalRes.resumeClaimWarning ? `${evalRes.resumeClaimWarning}\n\n` : ''}✓ **Demonstrated Concepts:** ${evalRes.demonstratedConcepts.join(', ') || 'None'}
✕ **Missing Concepts:** ${evalRes.missingConcepts.join(', ')}

💡 **Improvement Tip:** ${evalRes.suggestedImprovement}
💬 **Follow-Up:** "${evalRes.followUpQuestion}"

---
🎤 **NEXT QUESTION (${session.currentQuestionIdx + 1}/${questions.length}):**
*"${nextQ.question}"*

*(Type your answer below, or send 'exit' to quit mock interview mode)*`;

    return { replyText, platform: msg.platform, targetId: msg.senderId };
  }

  // 3. COMMAND: INTERVIEW ME
  if (textLower.includes('interview') || textLower.startsWith('/interview')) {
    const a = getOrInitAnalysis();
    session!.isInterviewMode = true;
    session!.currentQuestionIdx = 0;
    const firstQ = a.interviewQuestions[0];

    const replyText = `🎤 **MOCK INTERVIEW MODE STARTED**
Category: **${firstQ.category}**

Question 1:
*"${firstQ.question}"*

Focus: ${firstQ.suggestedFocus}

*(Type your answer below. Answers will be scored strictly for technical relevance, concept depth, and evidence)*`;

    return { replyText, platform: msg.platform, targetId: msg.senderId };
  }

  // 4. COMMAND: MISSING SKILLS
  if (textLower.includes('missing') || textLower.startsWith('/missingskills')) {
    const a = getOrInitAnalysis();
    const missingDetails = a.missingSkills
      .map((m) => `• **${m.skill}**: ${m.whyItMatters} Priority: ${m.suggestedPriority}`)
      .join('\n');

    const replyText = `❌ **UNDETECTED SKILLS BREAKDOWN**\n\n${missingDetails}\n\n💡 *Note: "Not detected" means no evidence was found in your resume. Add verifiable project experience to prove these skills.*`;
    return { replyText, platform: msg.platform, targetId: msg.senderId, buttons: standardButtons };
  }

  // 5. COMMAND: EXPLAIN ATS SCORE
  if (textLower.includes('ats') || textLower.startsWith('/ats')) {
    const a = getOrInitAnalysis();
    const ats = a.atsScore;

    const replyText = `🤖 **TRANSPARENT ATS SCORE BREAKDOWN (${ats.totalScore}/100)**

• **Skills Match:** ${ats.skillsMatch.awardedPoints}/${ats.skillsMatch.maxPoints} pts
• **Keyword Coverage:** ${ats.keywordMatch.awardedPoints}/${ats.keywordMatch.maxPoints} pts
• **Experience/Projects:** ${ats.experienceProjectAlignment.awardedPoints}/${ats.experienceProjectAlignment.maxPoints} pts
• **Education Alignment:** ${ats.educationAlignment.awardedPoints}/${ats.educationAlignment.maxPoints} pts
• **Responsibilities:** ${ats.responsibilitiesAlignment.awardedPoints}/${ats.responsibilitiesAlignment.maxPoints} pts
• **Structure:** ${ats.resumeStructure.awardedPoints}/${ats.resumeStructure.maxPoints} pts
• **ATS Parseability:** ${ats.atsParsingCompatibility.awardedPoints}/${ats.atsParsingCompatibility.maxPoints} pts`;

    return { replyText, platform: msg.platform, targetId: msg.senderId, buttons: standardButtons };
  }

  // 6. COMMAND: IMPROVE RESUME
  if (textLower.includes('improve') || textLower.startsWith('/improvements')) {
    const a = getOrInitAnalysis();
    const recs = a.recruiterLens;

    const replyText = `📝 **RESUME HEALTH & IMPROVEMENTS**

• **ATS Parseability:** ${a.resumeHealth.atsParsingPct}%
• **Keyword Coverage:** ${a.resumeHealth.keywordCoveragePct}%
• **Evidence Quality:** ${a.resumeHealth.evidenceQualityPct}%

👁️ **Recruiter First Impression:** "${recs.firstImpression}"
💪 **Strongest Signal:** ${recs.strongestSignal}
⚠️ **Weakest Signal:** ${recs.weakestSignal}
💡 **Recruiter Recommendation:** ${recs.recruiterRecommendation}`;

    return { replyText, platform: msg.platform, targetId: msg.senderId, buttons: standardButtons };
  }

  // 7. COMMAND: LEARNING ROADMAP
  if (textLower.includes('roadmap') || textLower.startsWith('/roadmap')) {
    const a = getOrInitAnalysis();
    const fixes = a.roadmap.immediateFixes.map((f) => `• ${f}`).join('\n');
    const step7 = a.roadmap.sevenDayPlan.map((f) => `• ${f}`).join('\n');

    const replyText = `🎓 **ACTIONABLE LEARNING ROADMAP**

⚡ **Immediate Fixes:**
${fixes}

📅 **7-Day Action Plan:**
${step7}`;

    return { replyText, platform: msg.platform, targetId: msg.senderId, buttons: standardButtons };
  }

  // 8. COMMAND: WHAT-IF SCORE
  if (textLower.includes('what-if') || textLower.includes('whatif') || textLower.startsWith('/whatif')) {
    const a = getOrInitAnalysis();
    const gaps = a.whatIf.availableGaps.map((g) => `• Acquire **${g.skill}**: +${g.pointsValue}% projected boost`).join('\n');

    const replyText = `🔮 **WHAT-IF CAREER SIMULATOR**

Current Readiness: **${a.readinessScore.score}%**

${gaps}

⚠️ *Disclaimer: Projected score assumes genuine hands-on experience and verifiable resume evidence.*`;

    return { replyText, platform: msg.platform, targetId: msg.senderId, buttons: standardButtons };
  }

  // Fallback: general query
  const a = getOrInitAnalysis();
  const replyText = `I am your Career Copilot. You can ask me about your readiness score (${a.readinessScore.score}%), missing skills, ATS score, or practice mock interview questions.

Try typing:
- "Missing Skills"
- "Explain ATS Score"
- "Improve Resume"
- "Learning Roadmap"
- "Interview Me"`;

  return { replyText, platform: msg.platform, targetId: msg.senderId, buttons: standardButtons };
}
