import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider } from './ai-provider-interface';
import { StructuredJD, StructuredResume, FullAnalysisResult } from '../../types/analyzer';

export class GeminiProvider implements AIProvider {
  name = 'Google Gemini LLM Provider';
  private apiKey: string | undefined;
  private genAI: GoogleGenerativeAI | undefined;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY;
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    }
  }

  isAvailable(): boolean {
    return !!this.apiKey && !!this.genAI;
  }

  async enhanceAnalysis(
    _jd: StructuredJD,
    _resume: StructuredResume,
    baseAnalysis: FullAnalysisResult
  ): Promise<FullAnalysisResult> {
    if (!this.isAvailable() || !this.genAI) {
      return { ...baseAnalysis, usedLlmProvider: false };
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `Analyze this candidate resume for job title '${baseAnalysis.jobTitle}'.
Detected Skills: ${baseAnalysis.matchedSkills.map((m) => m.jdSkill).join(', ')}
Missing Skills: ${baseAnalysis.missingSkills.map((m) => m.skill).join(', ')}
Provide 2 short, high-impact bullet rewrite suggestions for their project experience without fabricating metrics or non-existent tech.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      if (text && baseAnalysis.projectAnalysis.length > 0) {
        baseAnalysis.projectAnalysis[0].rewriteBulletSuggestions.push(`Gemini AI Suggestion: ${text.substring(0, 180)}...`);
      }

      return { ...baseAnalysis, usedLlmProvider: true };
    } catch {
      // Fallback gracefully to deterministic output if API fails or rate-limits
      return { ...baseAnalysis, usedLlmProvider: false };
    }
  }

  async answerChatQuestion(question: string, analysisContext: FullAnalysisResult): Promise<string> {
    if (!this.isAvailable() || !this.genAI) {
      const fallback = new (await import('./local-analysis-provider')).LocalAnalysisProvider();
      return fallback.answerChatQuestion(question, analysisContext);
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `You are an expert AI Resume Coach and ATS Recruiter.
Candidate Context:
- Target Role: ${analysisContext.jobTitle}
- Candidate Name: ${analysisContext.candidateName}
- ATS Compatibility Score: ${analysisContext.atsScore.totalScore}/100
- Alignment Tier: ${analysisContext.alignmentScore.tier} (${analysisContext.alignmentScore.score}/100)
- Matched Skills: ${analysisContext.matchedSkills.map((m) => m.jdSkill).join(', ')}
- Missing Skills (Not Detected): ${analysisContext.missingSkills.map((m) => m.skill).join(', ')}

User Question: "${question}"

Instructions:
- Provide an accurate, encouraging, highly professional answer based on the facts provided above.
- Do NOT fabricate candidate experience, non-existent projects, or unstated achievements.
- If recommending missing skills, clarify that they were "not detected in the uploaded text".
- Keep response under 250 words using clean Markdown formatting.`;

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch {
      const fallback = new (await import('./local-analysis-provider')).LocalAnalysisProvider();
      return fallback.answerChatQuestion(question, analysisContext);
    }
  }
}
