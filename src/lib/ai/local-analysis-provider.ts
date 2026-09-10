import { AIProvider } from './ai-provider-interface';
import { StructuredJD, StructuredResume, FullAnalysisResult } from '../../types/analyzer';

export class LocalAnalysisProvider implements AIProvider {
  name = 'Deterministic Local Analysis Engine';

  isAvailable(): boolean {
    return true; // Always available offline with zero cost
  }

  async enhanceAnalysis(
    _jd: StructuredJD,
    _resume: StructuredResume,
    baseAnalysis: FullAnalysisResult
  ): Promise<FullAnalysisResult> {
    // Returns verified deterministic analysis without modification
    return { ...baseAnalysis, usedLlmProvider: false };
  }

  async answerChatQuestion(question: string, analysis: FullAnalysisResult): Promise<string> {
    const q = question.toLowerCase();

    if (q.includes('ats score') || q.includes('why is my score low') || q.includes('lost points')) {
      const lostSkills = analysis.atsScore.skillsMatch.lostPoints;
      const lostKw = analysis.atsScore.keywordMatch.lostPoints;
      const lostExp = analysis.atsScore.experienceProjectAlignment.lostPoints;

      return `Your AI ATS Compatibility Score is **${analysis.atsScore.totalScore}/100**. Here is the exact breakdown of lost points:
- **Skills Match (-${lostSkills} pts):** ${analysis.atsScore.skillsMatch.reason}
- **Keyword Match (-${lostKw} pts):** ${analysis.atsScore.keywordMatch.reason}
- **Experience Alignment (-${lostExp} pts):** ${analysis.atsScore.experienceProjectAlignment.reason}
- **Structure (-${analysis.atsScore.resumeStructure.lostPoints} pts):** ${analysis.atsScore.resumeStructure.reason}

To improve your score immediately, add your missing skills (${analysis.missingSkills.slice(0, 3).map((m) => m.skill).join(', ')}) into technical skills and project bullet points.`;
    }

    if (q.includes('missing') || q.includes('skill') || q.includes('gap')) {
      if (analysis.missingSkills.length === 0) {
        return `All key skills required by the Job Description were detected in your resume! You have high alignment for '${analysis.jobTitle}'.`;
      }
      return `The following core JD skills were **not detected** in your uploaded resume text:
${analysis.missingSkills.map((m) => `- **${m.skill}** (${m.currentImportance}): ${m.phrasingNotice}`).join('\n')}

*Recommendation:* If you possess experience with these technologies, explicitly list them. If not, prioritize learning ${analysis.missingSkills[0]?.skill || 'them'} first.`;
    }

    if (q.includes('summary') || q.includes('rewrite summary')) {
      const topSkills = analysis.matchedSkills.slice(0, 3).map((m) => m.jdSkill).join(', ') || 'modern full-stack technologies';
      return `Here is a tailored Professional Summary for **${analysis.jobTitle}**:

> "Results-driven Software Engineer with experience building scalable applications using ${topSkills}. Proven track record of delivering clean RESTful API services, robust database solutions, and containerized deployments aligned with ${analysis.company || 'industry'} requirements."`;
    }

    if (q.includes('project') || q.includes('which project')) {
      const rec = analysis.projectRecommendations[0];
      if (!rec) return 'Focus on building a full-stack project demonstrating your target JD skills.';
      return `Based on your skill gap analysis for '${analysis.jobTitle}', we recommend building:

**${rec.title}**
- **Problem Statement:** ${rec.problemStatement}
- **Technologies to Use:** ${rec.technologies.join(', ')}
- **Key Features:**
${rec.features.map((f) => `  - ${f}`).join('\n')}
- **GitHub Proof:** Include a Dockerfile, automated test suite, and live URL demo.`;
    }

    if (q.includes('question') || q.includes('interview')) {
      const topQs = analysis.interviewQuestions.slice(0, 4);
      return `Here are top interview questions customized for your resume and the ${analysis.jobTitle} position:

${topQs.map((q, idx) => `**${idx + 1}. [${q.category}]** ${q.question}\n*Focus:* ${q.suggestedFocus}`).join('\n\n')}`;
    }

    if (q.includes('learn first') || q.includes('priority')) {
      const topSkill = analysis.recommendedSkills[0];
      if (!topSkill) return 'You match all primary JD skill requirements!';
      return `You should prioritize learning **${topSkill.skill}** (${topSkill.priority}):
- **Why Relevant:** ${topSkill.whyRelevant}
- **Estimated Learning Time:** ${topSkill.estimatedLearningTime}
- **Where to Start:** ${topSkill.whatToLearnFirst}
- **GitHub Evidence:** ${topSkill.howToDemonstrateOnGithub}`;
    }

    // Default conversational response
    return `Based on your analysis for **${analysis.jobTitle}** (ATS Score: **${analysis.atsScore.totalScore}/100**):
- **Alignment:** ${analysis.alignmentScore.tier} Tier (${analysis.alignmentScore.score}/100)
- **Detected Skills:** ${analysis.matchedSkills.map((m) => m.jdSkill).join(', ') || 'General Technical Skills'}
- **Undetected Skills:** ${analysis.missingSkills.map((m) => m.skill).join(', ') || 'None'}

Feel free to ask me: *"Why is my ATS score low?"*, *"Rewrite my summary"*, *"Which project should I build?"*, or *"Give me interview questions"*.`;
  }
}
