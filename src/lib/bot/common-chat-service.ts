import { analyzeSingleResume } from '../engine/analyzer-pipeline';
import { evaluateMockAnswer } from '../engine/mock-interviewer';
import { DEMO_JOB_DESCRIPTION, DEMO_RESUME_A } from '../demo/demo-data';
import { FullAnalysisResult } from '../../types/analyzer';

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
  buttons?: Array<{ label: string; action: string; webAppUrl?: string }>;
}

interface UserSession {
  jdText?: string;
  resumeText?: string;
  analysis?: FullAnalysisResult;
  isInterviewMode?: boolean;
  currentQuestionIdx?: number;
  step?: 'IDLE' | 'AWAITING_JD' | 'AWAITING_RESUME' | 'ANALYZED';
}

const sessionStore = new Map<string, UserSession>();

const PRESET_ROLES: Record<string, string> = {
  '/setrole_fullstack':
    'Senior Fullstack Engineer with React, Next.js, Node.js, TypeScript, PostgreSQL, REST APIs, System Design, AWS, Docker, CI/CD.',
  '/setrole_ai':
    'AI & Data Scientist Engineer with Python, PyTorch, TensorFlow, LLMs, Machine Learning, Data Processing, SQL, NLP, MLOps.',
  '/setrole_devops':
    'DevOps & Cloud Engineer with AWS, Kubernetes, Docker, Terraform, CI/CD Automation, Linux, Python, Monitoring.',
  '/setrole_android':
    'Mobile Application Developer with React Native, Kotlin, Flutter, Android SDK, iOS Swift, REST APIs, Mobile Security.',
};

const APP_URL = 'https://ai-resume-analyzer-sand-beta.vercel.app';

export async function processCommonChatService(msg: IncomingBotMessage): Promise<BotResponse> {
  const sessionKey = `${msg.platform}_${msg.senderId}`;
  let session = sessionStore.get(sessionKey);
  if (!session) {
    session = { step: 'IDLE' };
    sessionStore.set(sessionKey, session);
  }

  const textRaw = msg.text.trim();
  const textLower = textRaw.toLowerCase();

  const standardButtons = [
    { label: '📤 Open File Uploader App', action: '/app', webAppUrl: APP_URL },
    { label: '🔄 Change JD', action: '/set_jd' },
    { label: '❌ Missing Skills', action: '/missingskills' },
    { label: '🤖 Explain ATS Score', action: '/ats' },
    { label: '📝 Resume Improvements', action: '/improvements' },
    { label: '🎓 Learning Roadmap', action: '/roadmap' },
    { label: '🔮 What-If Score', action: '/whatif' },
    { label: '🎤 Mock Interview', action: '/interview' },
  ];

  // RESET / RESTART / START / CHANGE JD
  if (textLower === '/start' || textLower === 'hi' || textLower === 'hello' || textLower === '/reset' || textLower === '/set_jd') {
    session.step = 'AWAITING_JD';
    session.jdText = undefined;
    session.resumeText = undefined;
    session.analysis = undefined;

    const replyText = `🎯 **AI RESUME & JOB MATCH ANALYZER**

To calculate your exact ATS Match Score, we need two things:
1️⃣ **Job Description (JD)**
2️⃣ **Your Resume**

📋 **STEP 1: Select or Paste Job Description (JD)**

Pick a Target Role below, OR paste your custom Job Description text directly in this chat:`;

    return {
      replyText,
      platform: msg.platform,
      targetId: msg.senderId,
      buttons: [
        { label: '📂 Open File Uploader App', action: '/app', webAppUrl: APP_URL },
        { label: '💻 Fullstack Developer', action: '/setrole_fullstack' },
        { label: '🤖 AI / Data Scientist', action: '/setrole_ai' },
        { label: '☁️ DevOps Engineer', action: '/setrole_devops' },
        { label: '📱 Mobile Developer', action: '/setrole_android' },
      ],
    };
  }

  // HANDLE ROLE SELECTION
  if (PRESET_ROLES[textLower]) {
    session.jdText = PRESET_ROLES[textLower];
    session.step = 'AWAITING_RESUME';

    const roleName = textRaw.replace('/setrole_', '').toUpperCase();
    const replyText = `✅ **Job Description Set!** (${roleName} Role)

📄 **STEP 2: Attach / Upload Your Resume**

Please upload your **Resume File (PDF, DOCX, TXT)** or paste your resume text below to analyze your match against this JD!

*(Or tap the button below to open the Multi-File Uploader directly inside Telegram)*`;

    return {
      replyText,
      platform: msg.platform,
      targetId: msg.senderId,
      buttons: [
        { label: '📂 Open File Uploader App', action: '/app', webAppUrl: APP_URL },
        { label: '🔄 Change JD', action: '/set_jd' },
      ],
    };
  }

  // HANDLE DEMO MODE
  if (textLower === '/demo' || textLower === 'try demo resume') {
    session.jdText = DEMO_JOB_DESCRIPTION;
    session.resumeText = DEMO_RESUME_A;
    session.analysis = analyzeSingleResume(session.jdText, session.resumeText, 'Demo_Resume.pdf');
    session.step = 'ANALYZED';

    const a = session.analysis;
    const replyText = `📊 **[SAMPLE DEMO RESUME ANALYSIS]**

🎯 **JOB READINESS:** ${a.readinessScore.score}/100 (${a.readinessScore.tier})
🤖 **ATS SCORE:** ${a.atsScore.totalScore}/100
🔗 **JD ALIGNMENT:** ${a.alignmentScore.tier} Tier (${a.alignmentScore.score}/100)

✅ **Matched Skills:** ${a.matchedSkills.slice(0, 3).map((s) => s.jdSkill).join(', ') || 'None'}
⚠️ **Partial Skills:** ${a.partiallyMatchedSkills.slice(0, 2).map((s) => s.jdSkill).join(', ') || 'None'}
❌ **Not Detected Skills:** ${a.missingSkills.slice(0, 3).map((s) => s.skill).join(', ') || 'None'}

📌 **Biggest Gap:** ${a.gapActions[0]?.skill || 'AWS'} — ${a.gapActions[0]?.statusNotice || 'Gain hands-on experience.'}
📚 **Skills to Learn:** ${a.recommendedSkills.slice(0, 3).map((s) => s.skill).join(', ')}

💡 *Now send your own JD & Resume to analyze your real score!*`;

    return { replyText, platform: msg.platform, targetId: msg.senderId, buttons: standardButtons };
  }

  // HANDLE USER UPLOADING A RESUME FILE OR PASTING RESUME TEXT
  const hasUploadedFile = !!msg.attachmentText;
  const isPastedResume = textRaw.length > 80 && (textLower.includes('experience') || textLower.includes('education') || textLower.includes('skills'));

  if (hasUploadedFile || isPastedResume) {
    const resumeText = msg.attachmentText || textRaw;
    session.resumeText = resumeText;

    // Default to Fullstack Engineer JD if none set
    if (!session.jdText) {
      session.jdText = PRESET_ROLES['/setrole_fullstack'];
    }

    session.analysis = analyzeSingleResume(session.jdText, session.resumeText, `${msg.senderName}_Resume.pdf`);
    session.step = 'ANALYZED';

    const a = session.analysis;
    const matchedStr = a.matchedSkills.slice(0, 3).map((s) => s.jdSkill).join(', ') || 'None';
    const partialStr = a.partiallyMatchedSkills.slice(0, 2).map((s) => s.jdSkill).join(', ') || 'None';
    const missingStr = a.missingSkills.slice(0, 3).map((s) => s.skill).join(', ') || 'None';

    const replyText = `🎯 **MATCH ANALYSIS RESULT**

🎯 **JOB READINESS:** ${a.readinessScore.score}/100 (${a.readinessScore.tier})
🤖 **ATS SCORE:** ${a.atsScore.totalScore}/100
🔗 **JD ALIGNMENT:** ${a.alignmentScore.tier} Tier (${a.alignmentScore.score}/100)

✅ **Matched Skills:** ${matchedStr}
⚠️ **Partial Skills:** ${partialStr}
❌ **Not Detected Skills:** ${missingStr}

📌 **Biggest Gap:** ${a.gapActions[0]?.skill || 'AWS'} — ${a.gapActions[0]?.statusNotice || 'Gain hands-on experience.'}
📚 **Skills to Learn:** ${a.recommendedSkills.slice(0, 3).map((s) => s.skill).join(', ')}
🚀 **Recommended Projects:** ${a.projectRecommendations[0]?.title || 'Cloud-Native Job Tracker'}
🎓 **Learning Resources:** ${a.courseRecommendations[0]?.courseTitle || 'Official Documentation'}

Choose an option below to explore detailed insights:`;

    return { replyText, platform: msg.platform, targetId: msg.senderId, buttons: standardButtons };
  }

  // USER PASTES A CUSTOM JOB DESCRIPTION TEXT
  if (session.step === 'AWAITING_JD' && textRaw.length > 20 && !textRaw.startsWith('/')) {
    session.jdText = textRaw;
    session.step = 'AWAITING_RESUME';

    const replyText = `✅ **Custom Job Description Received!**

📄 **STEP 2: Attach / Upload Your Resume**

Please upload your **Resume File (PDF, DOCX, TXT)** or paste your resume text below to match against your custom JD!`;

    return {
      replyText,
      platform: msg.platform,
      targetId: msg.senderId,
      buttons: [
        { label: '📂 Open File Uploader App', action: '/app', webAppUrl: APP_URL },
        { label: '🔄 Change JD', action: '/set_jd' },
      ],
    };
  }

  // IF USER CLICKS /ANALYZE OR ASKS FOR ANALYSIS
  if (textLower === '/analyze' || textLower.includes('analyze')) {
    if (!session.jdText) {
      session.step = 'AWAITING_JD';
      return {
        replyText: `📋 **Job Description (JD) Required First!**

Please select a Target Role or paste your Job Description (JD) text first so we can match your skills:`,
        platform: msg.platform,
        targetId: msg.senderId,
        buttons: [
          { label: '📂 Open File Uploader App', action: '/app', webAppUrl: APP_URL },
          { label: '💻 Fullstack Developer', action: '/setrole_fullstack' },
          { label: '🤖 AI / Data Scientist', action: '/setrole_ai' },
          { label: '☁️ DevOps Engineer', action: '/setrole_devops' },
        ],
      };
    }

    if (!session.resumeText) {
      session.step = 'AWAITING_RESUME';
      return {
        replyText: `📄 **Resume File Required!**

Please attach/upload your Resume file (PDF, DOCX, TXT) or paste your resume text here in the chat to analyze against your chosen JD!`,
        platform: msg.platform,
        targetId: msg.senderId,
        buttons: [
          { label: '📂 Open File Uploader App', action: '/app', webAppUrl: APP_URL },
          { label: '🔄 Change JD', action: '/set_jd' },
        ],
      };
    }
  }

  // SUB-COMMANDS (Missing Skills, ATS, Improvements, Roadmap, Whatif, Interview)
  const a = session.analysis || analyzeSingleResume(session.jdText || DEMO_JOB_DESCRIPTION, session.resumeText || DEMO_RESUME_A, `${msg.senderName}_Resume.pdf`);

  // INTERVIEW MODE HANDLING
  if (session.isInterviewMode) {
    if (textLower === 'exit' || textLower === 'stop' || textLower === '/exit') {
      session.isInterviewMode = false;
      return {
        replyText: '🏁 **Mock Interview Mode Exited.** Select any option below to continue:',
        platform: msg.platform,
        targetId: msg.senderId,
        buttons: standardButtons,
      };
    }

    const questions = a.interviewQuestions;
    const currentQIdx = session.currentQuestionIdx || 0;
    const currentQ = questions[currentQIdx % questions.length];

    const evalRes = evaluateMockAnswer(currentQ, textRaw, a.careerTwin.summaryMessage);
    session.currentQuestionIdx = (currentQIdx + 1) % questions.length;
    const nextQ = questions[session.currentQuestionIdx];

    const replyText = `📊 **INTERVIEW ANSWER EVALUATION**

Status: ${evalRes.relevanceStatus}
Quality Tier: **${evalRes.answerQualityTier}** (Overall Score: ${evalRes.overallScorePct}%)

• **Relevance:** ${evalRes.questionRelevancePct}%
• **Technical Accuracy:** ${evalRes.technicalAccuracyPct}%
• **Concept Coverage:** ${evalRes.conceptCoveragePct}%
• **Depth:** ${evalRes.depthPct}%

💡 **Improvement Tip:** ${evalRes.suggestedImprovement}

---
🎤 **NEXT QUESTION:**
*"${nextQ.question}"*`;

    return { replyText, platform: msg.platform, targetId: msg.senderId };
  }

  if (textLower.includes('interview') || textLower.startsWith('/interview')) {
    session.isInterviewMode = true;
    session.currentQuestionIdx = 0;
    const firstQ = a.interviewQuestions[0];

    const replyText = `🎤 **MOCK INTERVIEW MODE STARTED**
Category: **${firstQ.category}**

Question 1:
*"${firstQ.question}"*

*(Type your answer below)*`;

    return { replyText, platform: msg.platform, targetId: msg.senderId };
  }

  if (textLower.includes('missing') || textLower.startsWith('/missingskills')) {
    const missingDetails = a.missingSkills
      .map((m) => `• **${m.skill}**: ${m.whyItMatters}`)
      .join('\n');
    return {
      replyText: `❌ **UNDETECTED SKILLS BREAKDOWN**\n\n${missingDetails}`,
      platform: msg.platform,
      targetId: msg.senderId,
      buttons: standardButtons,
    };
  }

  if (textLower.includes('ats') || textLower.startsWith('/ats')) {
    const ats = a.atsScore;
    return {
      replyText: `🤖 **ATS SCORE BREAKDOWN (${ats.totalScore}/100)**\n\n• Skills Match: ${ats.skillsMatch.awardedPoints}/${ats.skillsMatch.maxPoints}\n• Keyword Match: ${ats.keywordMatch.awardedPoints}/${ats.keywordMatch.maxPoints}\n• Structure: ${ats.resumeStructure.awardedPoints}/${ats.resumeStructure.maxPoints}`,
      platform: msg.platform,
      targetId: msg.senderId,
      buttons: standardButtons,
    };
  }

  if (textLower.includes('improve') || textLower.startsWith('/improvements')) {
    const recs = a.recruiterLens;
    return {
      replyText: `📝 **RESUME IMPROVEMENTS**\n\n👁️ First Impression: "${recs.firstImpression}"\n💡 Recruiter Tip: ${recs.recruiterRecommendation}`,
      platform: msg.platform,
      targetId: msg.senderId,
      buttons: standardButtons,
    };
  }

  if (textLower.includes('roadmap') || textLower.startsWith('/roadmap')) {
    const fixes = a.roadmap.immediateFixes.map((f) => `• ${f}`).join('\n');
    return {
      replyText: `🎓 **LEARNING ROADMAP**\n\n⚡ Immediate Fixes:\n${fixes}`,
      platform: msg.platform,
      targetId: msg.senderId,
      buttons: standardButtons,
    };
  }

  if (textLower.includes('whatif') || textLower.includes('what-if') || textLower.startsWith('/whatif')) {
    const gaps = a.whatIf.availableGaps.map((g) => `• **${g.skill}**: +${g.pointsValue}% boost`).join('\n');
    return {
      replyText: `🔮 **WHAT-IF CAREER SIMULATOR**\n\n${gaps}`,
      platform: msg.platform,
      targetId: msg.senderId,
      buttons: standardButtons,
    };
  }

  // FALLBACK GUIDE
  return {
    replyText: `👋 **Career Copilot Options:**

1️⃣ Select or paste a **Job Description (JD)**
2️⃣ Send or upload your **Resume File** (PDF/DOCX/TXT)

Or tap **'📂 Open File Uploader App'** below to use the full multi-file drag-and-drop web app directly inside Telegram!`,
    platform: msg.platform,
    targetId: msg.senderId,
    buttons: [
      { label: '📂 Open File Uploader App', action: '/app', webAppUrl: APP_URL },
      { label: '💻 Fullstack Developer JD', action: '/setrole_fullstack' },
      { label: '🤖 AI Engineer JD', action: '/setrole_ai' },
    ],
  };
}
