import {
  StructuredJD,
  StructuredResume,
  FullAnalysisResult,
  MultiResumeAnalysisReport,
  ResumeComparisonRow,
} from '../../types/analyzer';
import { parseJobDescription } from '../parser/jd-processor';
import { parseResume } from '../parser/resume-parser';
import { matchSkills } from './matching-engine';
import { generateEvidenceLayer } from './evidence-engine';
import { calculateAtsScore, calculateAlignmentScore } from './ats-scorer';
import { analyzeDrawbacks } from './drawback-analyzer';
import { analyzeSections, analyzeProjects } from './section-analyzer';
import {
  generateSkillRoadmap,
  generateCourseRecommendations,
  generateProjectRecommendations,
  generateImprovementRoadmap,
} from './recommendation-engine';
import { generateInterviewQuestions } from './interview-generator';

export function analyzeSingleResume(
  jdInput: string | StructuredJD,
  resumeInput: string | StructuredResume,
  resumeFilename: string = 'Resume.pdf'
): FullAnalysisResult {
  // 1. Process JD if string
  const jd: StructuredJD = typeof jdInput === 'string' ? parseJobDescription(jdInput) : jdInput;

  // 2. Process Resume if string
  const resume: StructuredResume =
    typeof resumeInput === 'string' ? parseResume(resumeInput, resumeFilename) : resumeInput;

  // 3. Match Skills
  const { matched, partiallyMatched, missing } = matchSkills(jd, resume);

  // 4. Generate Evidence Layer
  const rawEvidence = generateEvidenceLayer(jd, resume, matched, partiallyMatched, missing);

  // 5. Calculate Scores
  const atsScore = calculateAtsScore(jd, resume, matched, partiallyMatched, missing);
  const alignmentScore = calculateAlignmentScore(jd, resume, matched, partiallyMatched, missing);

  // 6. Drawback Analysis
  const drawbacks = analyzeDrawbacks(jd, resume, missing);

  // 7. Section & Project Analysis
  const sectionAnalysis = analyzeSections(jd, resume);
  const projectAnalysis = analyzeProjects(jd, resume);

  // 8. Missing Skill Details with Non-Presumptive Phrasing
  const missingSkillsDetailed = missing.map((m) => ({
    skill: m.jdSkill,
    isMandatory: m.isMandatory,
    whyItMatters: `The Job Description requires/prefers '${m.jdSkill}' for '${jd.jobTitle}'.`,
    currentImportance: m.isMandatory ? 'High (Mandatory Requirement)' : 'Medium (Preferred Skill)',
    suggestedPriority: m.isMandatory ? 'Priority 1' : 'Priority 2',
    suggestedResource: `Learn ${m.jdSkill} via official documentation or hands-on tutorials.`,
    suggestedProjectIdea: `Build a small application demonstrating ${m.jdSkill} REST API / database integration.`,
    phrasingNotice: `${m.canonicalSkill} was not detected in the uploaded resume.`,
  }));

  // 9. Keyword Gap Items
  const keywordGaps = missing.map((m) => ({
    jdRequirement: m.jdSkill,
    resumeFound: 'Not detected in resume',
    matchType: m.matchType,
    status: 'MISSING' as const,
    recommendation: `Add '${m.jdSkill}' to technical skills if experienced, or complete a beginner tutorial.`,
  }));

  // 10. Recommendations & Roadmap
  const recommendedSkills = generateSkillRoadmap(jd, missing);
  const courseRecommendations = generateCourseRecommendations(missing);
  const projectRecommendations = generateProjectRecommendations(jd, missing);
  const roadmap = generateImprovementRoadmap(resume, missing);

  // 11. Interview Question Generator
  const { allQuestions, mostLikelyQuestions } = generateInterviewQuestions(jd, resume, missing);

  const id = `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  return {
    id,
    timestamp: new Date().toISOString(),
    candidateName: resume.candidateName,
    resumeFilename: resume.filename || resumeFilename,
    jobTitle: jd.jobTitle,
    company: jd.company,
    atsScore,
    alignmentScore,
    matchedSkills: matched,
    partiallyMatchedSkills: partiallyMatched,
    missingSkills: missingSkillsDetailed,
    keywordGaps,
    drawbacks,
    sectionAnalysis,
    projectAnalysis,
    recommendedSkills,
    courseRecommendations,
    projectRecommendations,
    roadmap,
    interviewQuestions: allQuestions,
    mostLikelyQuestions,
    rawEvidence,
    usedLlmProvider: false,
  };
}

export function analyzeMultipleResumes(
  jdInput: string | StructuredJD,
  resumesInput: Array<{ content: string; filename: string }>
): MultiResumeAnalysisReport {
  const jd: StructuredJD = typeof jdInput === 'string' ? parseJobDescription(jdInput) : jdInput;

  const individualAnalyses = resumesInput.map((res) => analyzeSingleResume(jd, res.content, res.filename));

  const comparisonTable: ResumeComparisonRow[] = individualAnalyses.map((analysis) => {
    const avgProjScore =
      analysis.projectAnalysis.length > 0
        ? Math.round(
            analysis.projectAnalysis.reduce((sum, p) => sum + p.relevanceScore, 0) / analysis.projectAnalysis.length
          )
        : 50;

    return {
      candidateName: analysis.candidateName,
      filename: analysis.resumeFilename,
      atsScore: analysis.atsScore.totalScore,
      alignmentScore: analysis.alignmentScore.score,
      matchedSkillsCount: analysis.matchedSkills.length,
      missingSkillsCount: analysis.missingSkills.length,
      projectScore: avgProjScore,
      overallTier: analysis.alignmentScore.tier,
      analysisId: analysis.id,
    };
  });

  // Default Sort by ATS Score descending
  comparisonTable.sort((a, b) => b.atsScore - a.atsScore);

  return {
    jobTitle: jd.jobTitle,
    company: jd.company,
    totalResumesAnalyzed: individualAnalyses.length,
    comparisonTable,
    individualAnalyses,
  };
}
