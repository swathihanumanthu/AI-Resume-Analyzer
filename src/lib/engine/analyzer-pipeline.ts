import {
  StructuredJD,
  StructuredResume,
  FullAnalysisResult,
  MultiResumeAnalysisReport,
  ResumeComparisonRow,
  JobReadinessScore,
  ReadinessTier,
  SingleNextStep,
  GapActionItem,
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
import { buildJobDna, buildCareerTwin } from './career-twin';
import { findSkillAdjacencies } from './skill-adjacency';
import { analyzeRecruiterLens } from './recruiter-lens';
import { calculateWhatIfProjection } from './what-if-simulator';

export function analyzeSingleResume(
  jdInput: string | StructuredJD,
  resumeInput: string | StructuredResume,
  resumeFilename: string = 'Resume.pdf'
): FullAnalysisResult {
  // 1. Process JD & Resume
  const jd: StructuredJD = typeof jdInput === 'string' ? parseJobDescription(jdInput) : jdInput;
  const resume: StructuredResume =
    typeof resumeInput === 'string' ? parseResume(resumeInput, resumeFilename) : resumeInput;

  // 2. Match Skills & Evidence
  const { matched, partiallyMatched, missing } = matchSkills(jd, resume);
  const rawEvidence = generateEvidenceLayer(jd, resume, matched, partiallyMatched, missing);

  // 3. Scores
  const atsScore = calculateAtsScore(jd, resume, matched, partiallyMatched, missing);
  const alignmentScore = calculateAlignmentScore(jd, resume, matched, partiallyMatched, missing);

  // 4. Job Readiness Hero Score
  const readinessRaw = Math.round(alignmentScore.score * 0.5 + atsScore.totalScore * 0.5);
  const readinessValue = Math.min(100, Math.max(15, readinessRaw));

  let tier: ReadinessTier = '🔴 Opportunities to Improve';
  let label = 'Needs Resume Evidence';

  if (readinessValue >= 90) {
    tier = '🚀 Interview Ready';
    label = 'Interview Ready Candidate';
  } else if (readinessValue >= 80) {
    tier = '🟢 Strong Candidate';
    label = 'Strong Match for Target Role';
  } else if (readinessValue >= 70) {
    tier = '🟡 Almost Ready';
    label = 'Good Potential — Minor Gaps';
  } else if (readinessValue >= 50) {
    tier = '🟠 Needs Improvement';
    label = 'Moderate Alignment — Missing Core Skills';
  }

  const readinessScore: JobReadinessScore = {
    score: readinessValue,
    tier,
    label,
    summaryQuote:
      missing.length > 0
        ? `You're a ${tier.replace(/[🚀🟢🟡🟠🔴]/g, '').trim()} (${readinessValue}%), but ${missing.length} important gap(s) remain.`
        : `You are highly ready (${readinessValue}%) across all core requirements!`,
    subScores: {
      atsScore: atsScore.totalScore,
      skillMatch: Math.round((matched.length / Math.max(1, matched.length + missing.length)) * 100),
      experienceMatch: resume.experience.length > 0 ? 85 : 50,
      projectMatch: resume.projects.length > 0 ? 90 : 40,
      educationMatch: resume.education.length > 0 ? 100 : 60,
    },
  };

  // 5. Signature Features: Job DNA & Career Twin
  const jobDna = buildJobDna(jd);
  const careerTwin = buildCareerTwin(jd, resume, matched, partiallyMatched, missing);

  // 6. Why Aren't You at 100% Itemized Deductions
  const whyNot100: FullAnalysisResult['whyNot100'] = [];

  missing.forEach((m) => {
    const pts = m.isMandatory ? 6 : 3;
    whyNot100.push({
      deduction: pts,
      reason: `${m.jdSkill} was not detected in the uploaded resume.`,
      category: 'Undetected Requirement',
    });
  });

  if (!resume.hasMetrics) {
    whyNot100.push({
      deduction: 4,
      reason: 'Project and experience bullets lack quantifiable outcomes (% growth, numbers).',
      category: 'Impact & Metrics',
    });
  }
  if (!resume.contact.github || !resume.contact.linkedin) {
    whyNot100.push({
      deduction: 3,
      reason: 'Missing clickable GitHub or LinkedIn profile header links.',
      category: 'Profile Completeness',
    });
  }

  // 7. Skill Gap -> Action Engine
  const gapActions: GapActionItem[] = missing.map((m) => ({
    skill: m.jdSkill,
    statusNotice: `${m.canonicalSkill} was not detected in resume text.`,
    priority: m.isMandatory ? 'HIGH' : 'MEDIUM',
    estimatedEffort: m.isMandatory ? '3–5 days' : '1–2 days',
    learn: {
      topic: `Master ${m.jdSkill} fundamentals & integration patterns`,
      resource: `Official ${m.jdSkill} Documentation`,
      url: `https://www.google.com/search?q=${encodeURIComponent(m.jdSkill + ' official documentation')}`,
    },
    practice: {
      projectIdea: `Containerize or add ${m.jdSkill} API integration to an existing web project.`,
    },
    prove: {
      githubTip: `Add a clean README, Dockerfile, or workflow file in your GitHub repository demonstrating ${m.jdSkill}.`,
    },
    update: {
      resumeFix: `Mention ${m.jdSkill} in technical skills and reference it in a project bullet point only after gaining hands-on experience.`,
    },
  }));

  // 8. Skill Adjacency Engine
  const existingSkillNames = resume.skills;
  const missingSkillNames = missing.map((m) => m.canonicalSkill);
  const skillAdjacencies = findSkillAdjacencies(existingSkillNames, missingSkillNames);

  // 9. Your #1 Next Step
  const topMissing = missing[0]?.jdSkill || 'AWS Cloud Deployment';
  const nextStep: SingleNextStep = {
    title: `Containerize or build a small project demonstrating ${topMissing}.`,
    why: `'${topMissing}' is a high-priority JD requirement currently undetected in your resume text.`,
    estimatedEffort: '2–4 days',
    expectedBenefit: `Directly closes your top skill gap and increases your projected readiness score.`,
    actionSkill: topMissing,
  };

  // 10. What-If Simulator Projection
  const whatIf = calculateWhatIfProjection(readinessValue, missing);

  // 11. Recruiter Lens & 10-Second Test
  const recruiterLens = analyzeRecruiterLens(jd, resume, matched, missing);

  // 12. Resume Health Check
  const resumeHealth = {
    atsParsingPct: atsScore.atsParsingCompatibility.awardedPoints * 10,
    keywordCoveragePct: atsScore.keywordMatch.awardedPoints * 6.6,
    sectionCompletenessPct: atsScore.resumeStructure.awardedPoints * 10,
    readabilityPct: 90,
    evidenceQualityPct: resume.hasMetrics ? 85 : 60,
    biggestOpportunity: !resume.hasMetrics
      ? 'Your project descriptions explain what you built, but lack measurable outcomes (% speedup, users served).'
      : missing.length > 0
      ? `Add explicit evidence for target JD requirement '${missing[0].jdSkill}'.`
      : 'Maintain clear section headings and update your resume header links.',
    rawParsedSections: resume.sections.map((s) => ({
      heading: s.section.toUpperCase(),
      textSnippet: s.content ? s.content.substring(0, 100) + '...' : 'Section not detected',
      status: s.detected ? ('Healthy' as const) : ('Needs Attention' as const),
    })),
  };

  // 13. Drawbacks & Recommendations
  const drawbacks = analyzeDrawbacks(jd, resume, missing);
  const sectionAnalysis = analyzeSections(jd, resume);
  const projectAnalysis = analyzeProjects(jd, resume);
  const recommendedSkills = generateSkillRoadmap(jd, missing);
  const courseRecommendations = generateCourseRecommendations(jd, missing);
  const projectRecommendations = generateProjectRecommendations(jd, missing);
  const roadmap = generateImprovementRoadmap(resume, missing);
  const { allQuestions, mostLikelyQuestions } = generateInterviewQuestions(jd, resume, missing);

  const id = `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  return {
    id,
    timestamp: new Date().toISOString(),
    candidateName: resume.candidateName,
    resumeFilename: resume.filename || resumeFilename,
    jobTitle: jd.jobTitle,
    company: jd.company,
    jobDna,
    careerTwin,
    readinessScore,
    atsScore,
    alignmentScore,
    matchedSkills: matched,
    partiallyMatchedSkills: partiallyMatched,
    missingSkills: missing.map((m) => ({
      skill: m.jdSkill,
      isMandatory: m.isMandatory,
      whyItMatters: `The Job Description requires/prefers '${m.jdSkill}' for '${jd.jobTitle}'.`,
      currentImportance: m.isMandatory ? 'High (Mandatory Requirement)' : 'Medium (Preferred Skill)',
      suggestedPriority: m.isMandatory ? 'Priority 1' : 'Priority 2',
      suggestedResource: `Learn ${m.jdSkill} via official documentation or hands-on tutorials.`,
      suggestedProjectIdea: `Build a small application demonstrating ${m.jdSkill} REST API / database integration.`,
      phrasingNotice: `${m.canonicalSkill} was not detected in the uploaded resume.`,
    })),
    rawEvidence,
    whyNot100,
    gapActions,
    skillAdjacencies,
    nextStep,
    whatIf,
    recruiterLens,
    resumeHealth,
    sectionAnalysis,
    projectAnalysis,
    recommendedSkills,
    courseRecommendations,
    projectRecommendations,
    roadmap,
    interviewQuestions: allQuestions,
    mostLikelyQuestions,
    drawbacks,
    usedLlmProvider: false,
  };
}

export function analyzeMultipleResumes(
  jdInput: string | StructuredJD,
  resumesInput: Array<{ content: string; filename: string }>
): MultiResumeAnalysisReport {
  const jd: StructuredJD = typeof jdInput === 'string' ? parseJobDescription(jdInput) : jdInput;
  const individualAnalyses = resumesInput.map((res) => analyzeSingleResume(jd, res.content, res.filename));

  const comparisonTable: ResumeComparisonRow[] = individualAnalyses.map((analysis) => ({
    candidateName: analysis.candidateName,
    filename: analysis.resumeFilename,
    readinessScore: analysis.readinessScore.score,
    atsScore: analysis.atsScore.totalScore,
    matchedSkillsCount: analysis.matchedSkills ? analysis.matchedSkills.length : 0,
    missingSkillsCount: analysis.whyNot100 ? analysis.whyNot100.length : 0,
    overallTier: analysis.readinessScore.tier,
    analysisId: analysis.id,
    whyStrongestReason: `${analysis.readinessScore.score}% Job Readiness with ${analysis.careerTwin.technicalNodes.filter((n) => n.status === 'STRONG').length} strong technical skill matches.`,
  }));

  // Default Sort by Job Readiness Score descending
  comparisonTable.sort((a, b) => b.readinessScore - a.readinessScore);

  const topCandidate = comparisonTable[0];
  const whyTopCandidateIsStrongest = topCandidate
    ? `${topCandidate.candidateName} ranks first with ${topCandidate.readinessScore}% Job Readiness due to strongest mandatory skill coverage and verified project technical alignment.`
    : 'Comparative evaluation complete.';

  return {
    jobTitle: jd.jobTitle,
    company: jd.company,
    totalResumesAnalyzed: individualAnalyses.length,
    comparisonTable,
    individualAnalyses,
    whyTopCandidateIsStrongest,
  };
}
