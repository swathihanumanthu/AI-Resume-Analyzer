import { FullAnalysisResult, MultiResumeAnalysisReport } from '../../types/analyzer';

export interface ResumeItemPayload {
  id: string;
  candidateName: string;
  fileName: string;
  resumeText: string;
  analysis: FullAnalysisResult;
}

export interface CareerIntelligenceSession {
  id: string; // e.g. "cs_9f8e7d6c"
  jdText: string;
  resumes: ResumeItemPayload[];
  singleAnalysis?: FullAnalysisResult;
  multiReport?: MultiResumeAnalysisReport;
  createdAt: number;
  expiresAt: number;
  selectedResumeIndex?: number;
}

// Global persistent store across hot-reloads and API invocations
const globalForSessions = globalThis as unknown as {
  careerSessionStore?: Map<string, CareerIntelligenceSession>;
  userPlatformBindingStore?: Map<string, string>; // platform_senderId -> sessionId
};

if (!globalForSessions.careerSessionStore) {
  globalForSessions.careerSessionStore = new Map<string, CareerIntelligenceSession>();
}
if (!globalForSessions.userPlatformBindingStore) {
  globalForSessions.userPlatformBindingStore = new Map<string, string>();
}

const sessionStore = globalForSessions.careerSessionStore;
const userBindingsStore = globalForSessions.userPlatformBindingStore;

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function generateSessionId(): string {
  const rand = Math.random().toString(36).substring(2, 10);
  const time = Date.now().toString(36).slice(-4);
  return `cs_${rand}${time}`;
}

export function createCareerSession(
  jdText: string,
  resumes: ResumeItemPayload[],
  singleAnalysis?: FullAnalysisResult,
  multiReport?: MultiResumeAnalysisReport
): CareerIntelligenceSession {
  const id = generateSessionId();
  const now = Date.now();
  const session: CareerIntelligenceSession = {
    id,
    jdText,
    resumes,
    singleAnalysis: singleAnalysis || (resumes.length === 1 ? resumes[0].analysis : undefined),
    multiReport,
    createdAt: now,
    expiresAt: now + DEFAULT_TTL_MS,
  };

  sessionStore.set(id, session);
  return session;
}

export function getCareerSession(sessionId: string): CareerIntelligenceSession | null {
  if (!sessionId) return null;
  const cleanId = sessionId.trim();
  const session = sessionStore.get(cleanId);
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    sessionStore.delete(cleanId);
    return null;
  }
  return session;
}

export function bindUserToSession(platformUserKey: string, sessionId: string): CareerIntelligenceSession | null {
  const session = getCareerSession(sessionId);
  if (session) {
    userBindingsStore.set(platformUserKey, session.id);
  }
  return session;
}

export function getBoundSessionForUser(platformUserKey: string): CareerIntelligenceSession | null {
  const sessionId = userBindingsStore.get(platformUserKey);
  if (!sessionId) return null;
  return getCareerSession(sessionId);
}

export interface PlatformDeepLinks {
  telegram: string;
  whatsapp: string;
  discord: string;
  googleChat: string;
  sessionId?: string;
  isCustomized: boolean;
}

export function buildPlatformDeepLinks(sessionId?: string): PlatformDeepLinks {
  const telegramBotUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || process.env.TELEGRAM_BOT_USERNAME || 'CareerCopilotBot';
  const whatsappPhone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER || process.env.WHATSAPP_PHONE_NUMBER || '15551234567';
  const discordClientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || process.env.DISCORD_CLIENT_ID;
  const discordInviteUrl = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || (discordClientId ? `https://discord.com/oauth2/authorize?client_id=${discordClientId}&scope=bot&permissions=2048` : 'https://discord.com/app');
  const googleChatUrl = process.env.NEXT_PUBLIC_GOOGLE_CHAT_SPACE_URL || 'https://chat.google.com/';

  const startParam = sessionId ? sessionId : 'START';

  return {
    telegram: `https://t.me/${telegramBotUsername}?start=${startParam}`,
    whatsapp: `https://wa.me/${whatsappPhone}?text=START%20${startParam}`,
    discord: discordInviteUrl,
    googleChat: googleChatUrl,
    sessionId,
    isCustomized: !!(process.env.TELEGRAM_BOT_USERNAME || process.env.WHATSAPP_PHONE_NUMBER || process.env.DISCORD_CLIENT_ID),
  };
}
