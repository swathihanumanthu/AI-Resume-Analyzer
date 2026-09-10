// Comprehensive TypeScript definitions for AI Career Intelligence

export type FileType = 'pdf' | 'docx' | 'txt' | 'text';

export interface FileInput {
  name: string;
  type: FileType;
  content: string;
  buffer?: Buffer;
  sizeBytes?: number;
}

export interface StructuredJD {
  rawText: string;
  jobTitle: string;
  company: string;
  mustHaveSkills: string[];
  preferredSkills: string[];
  programmingLanguages: string[];
  frameworks: string[];
  databases: string[];
  cloudDevOps: string[];
  aiMlGenAi: string[];
  education: string[];
  experience: string[];
  certifications: string[];
  responsibilities: string[];
  keywords: string[];
  toolsPlatforms: string[];
  location: string[];
}

export interface DetectedSection {
  section: 'contact' | 'summary' | 'education' | 'skills' | 'experience' | 'internships' | 'projects' | 'certifications' | 'achievements' | 'links';
  detected: boolean;
  content: string;
  confidence: number;
}

export interface StructuredResume {
  rawText: string;
  filename: string;
  candidateName: string;
  contact: {
    email?: string;
    phone?: string;
    location?: string;
    github?: string;
    linkedin?: string;
  };
  summary: string;
  sections: DetectedSection[];
  skills: string[];
  experience: {
    title: string;
    company: string;
    duration: string;
    description: string;
    bullets: string[];
  }[];
  projects: {
    title: string;
    description: string;
    technologies: string[];
    bullets: string[];
  }[];
  education: {
    degree: string;
    field: string;
    institution: string;
    year: string;
  }[];
  certifications: string[];
  achievements: string[];
  hasMetrics: boolean;
  atsFormattingIssues: string[];
}

export type RequirementPriority = 'CRITICAL' | 'IMPORTANT' | 'USEFUL' | 'BONUS';

export interface JobDnaItem {
  name: string;
  category: string;
  weightPct: number;
  priority: RequirementPriority;
  isMandatory: boolean;
}

export interface JobDna {
  jobTitle: string;
  company: string;
  experienceRequired: string;
  educationRequired: string;
  dnaItems: JobDnaItem[];
  categoryBreakdown: { category: string; pct: number }[];
}

export type CapabilityStatus = 'STRONG' | 'PARTIAL' | 'NOT_DETECTED';

export interface CareerTwinNode {
  capability: string;
  category: 'Technical Skills' | 'Projects' | 'Experience' | 'Education';
  status: CapabilityStatus;
  evidenceSnippet: string;
}

export interface CareerTwin {
  alignmentPct: number;
  technicalNodes: CareerTwinNode[];
  projectNodes: CareerTwinNode[];
  experienceNodes: CareerTwinNode[];
  educationNodes: CareerTwinNode[];
  summaryMessage: string;
}

export type MatchType = 'EXACT' | 'NORMALIZED' | 'SYNONYM' | 'SEMANTIC' | 'PARTIAL' | 'NOT_DETECTED';

export interface SkillMatchResult {
  jdSkill: string;
  canonicalSkill: string;
  resumeEvidence: string;
  matchType: MatchType;
  confidence: number;
  scoreContribution: number;
  isMandatory: boolean;
  status: 'MATCHED' | 'PARTIALLY_MATCHED' | 'NOT_DETECTED';
}

export interface MissingSkillDetail {
  skill: string;
  isMandatory: boolean;
  whyItMatters: string;
  currentImportance: string;
  suggestedPriority: string;
  suggestedResource: string;
  suggestedProjectIdea: string;
  phrasingNotice: string;
}

export interface EvidenceItem {
  requirement: string;
  category: string;
  foundEvidence: string;
  matchType: MatchType;
  confidence: number;
  scoreContribution: number;
  status: 'MATCHED' | 'PARTIALLY_MATCHED' | 'NOT_DETECTED';
}

export interface DimensionScore {
  maxPoints: number;
  awardedPoints: number;
  lostPoints: number;
  reason: string;
  supportingEvidence: string[];
}

export interface AtsScoreBreakdown {
  skillsMatch: DimensionScore;
  keywordMatch: DimensionScore;
  experienceProjectAlignment: DimensionScore;
  educationAlignment: DimensionScore;
  responsibilitiesAlignment: DimensionScore;
  resumeStructure: DimensionScore;
  atsParsingCompatibility: DimensionScore;
  totalScore: number;
}

export type AlignmentTier = 'EXCELLENT' | 'STRONG' | 'GOOD' | 'MODERATE' | 'WEAK' | 'POOR';

export interface AlignmentScoreResult {
  score: number;
  tier: AlignmentTier;
  label: string;
  explanation: string;
}

export type ReadinessTier = '🚀 Interview Ready' | '🟢 Strong Candidate' | '🟡 Almost Ready' | '🟠 Needs Improvement' | '🔴 Opportunities to Improve';

export interface JobReadinessScore {
  score: number;
  tier: ReadinessTier;
  label: string;
  summaryQuote: string;
  subScores: {
    atsScore: number;
    skillMatch: number;
    experienceMatch: number;
    projectMatch: number;
    educationMatch: number;
  };
}

export type DrawbackSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface DrawbackItem {
  severity: DrawbackSeverity;
  problem: string;
  whyItMatters: string;
  recommendedFix: string;
  evidence: string;
}

export interface SectionAnalysisResult {
  sectionName: string;
  score: number;
  detected: boolean;
  problems: string[];
  missingInformation: string[];
  recommendations: string[];
}

export interface ProjectAnalysisResult {
  title: string;
  relevanceScore: number;
  technologies: string[];
  relevanceToJd: string;
  technicalComplexity: string;
  backendInvolvement: boolean;
  frontendInvolvement: boolean;
  databaseInvolvement: boolean;
  apiInvolvement: boolean;
  aiMlInvolvement: boolean;
  deploymentMentioned: boolean;
  hasMetrics: boolean;
  rewriteBulletSuggestions: string[];
}

export interface RecommendedSkillItem {
  skill: string;
  priority: 'Priority 1 — Must Learn' | 'Priority 2 — Valuable' | 'Priority 3 — Nice to Have';
  isMandatory: boolean;
  whyRelevant: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedLearningTime: string;
  whatToLearnFirst: string;
  howToDemonstrateOnGithub: string;
}

export type ResourceTag = 'Official Documentation' | 'Free Tutorial' | 'Free Video' | 'Free-to-Audit' | 'Free Tier';

export interface CourseRecommendation {
  courseTitle: string;
  provider: string;
  skillCovered: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedDuration: string;
  availabilityTag: ResourceTag;
  whyRecommended: string;
  url: string;
}

export interface ProjectRecommendation {
  title: string;
  problemStatement: string;
  technologies: string[];
  features: string[];
  expectedDifficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedDevTime: string;
  demonstratedJdRequirements: string[];
  githubEvidence: string[];
}

export interface ImprovementRoadmap {
  immediateFixes: string[];
  sevenDayPlan: string[];
  thirtyDayPlan: string[];
}

export interface SkillAdjacencyItem {
  existingSkill: string;
  targetMissingSkill: string;
  relationshipNote: string;
}

export interface GapActionItem {
  skill: string;
  statusNotice: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  estimatedEffort: string;
  learn: { topic: string; resource: string; url: string };
  practice: { projectIdea: string };
  prove: { githubTip: string };
  update: { resumeFix: string };
}

export interface SingleNextStep {
  title: string;
  why: string;
  estimatedEffort: string;
  expectedBenefit: string;
  actionSkill: string;
}

export interface WhatIfProjection {
  currentReadinessScore: number;
  availableGaps: Array<{ skill: string; pointsValue: number }>;
  disclaimer: string;
}

export interface TenSecondScan {
  visibleIn10Seconds: string[];
  notImmediatelyObvious: string[];
}

export interface RecruiterLens {
  firstImpression: string;
  strongestSignal: string;
  weakestSignal: string;
  missingSignal: string;
  recruiterRecommendation: string;
  tenSecondScan: TenSecondScan;
}

export interface ResumeHealth {
  atsParsingPct: number;
  keywordCoveragePct: number;
  sectionCompletenessPct: number;
  readabilityPct: number;
  evidenceQualityPct: number;
  biggestOpportunity: string;
  rawParsedSections: Array<{ heading: string; textSnippet: string; status: 'Healthy' | 'Needs Attention' }>;
}

export type DnaClusterCategory =
  | 'TECH STACK'
  | 'EXPERIENCE'
  | 'RESPONSIBILITIES'
  | 'EDUCATION'
  | 'TOOLS'
  | 'SOFT SKILLS'
  | 'DOMAIN'
  | 'CERTIFICATIONS';

export interface JobDnaMapNode {
  id: string;
  name: string;
  cluster: DnaClusterCategory;
  importance: RequirementPriority;
  matchStatus: 'EXACT MATCH' | 'SEMANTIC MATCH' | 'PARTIAL EVIDENCE' | 'NOT DETECTED';
  confidence: number;
  scoreContribution: number;
  resumeEvidence: string;
  recommendedAction?: string;
  x?: number;
  y?: number;
}

export interface InterviewQuestionItem {
  id: string;
  category: 'Technical' | 'Project' | 'Coding' | 'System Design' | 'Behavioral' | 'HR' | 'Scenario';
  question: string;
  whyAsked: string;
  suggestedFocus: string;
  isHighLikelihood?: boolean;
}

export type InterviewerMode =
  | 'Technical Interview'
  | 'Project Interview'
  | 'Resume Deep Dive'
  | 'HR Interview'
  | 'Behavioral Interview'
  | 'System Design'
  | 'Coding Interview';

export type InterviewDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface MockAnswerEvaluation {
  overallScorePct: number;
  questionRelevancePct: number;
  technicalAccuracyPct: number;
  conceptCoveragePct: number;
  depthPct: number;
  clarityPct: number;
  practicalEvidencePct: number;
  isRelevant: boolean;
  relevanceStatus: string;
  answerQualityTier: '🟢 Strong' | '🟡 Partial' | '🔴 Weak';
  whatYouDidWell: string;
  demonstratedConcepts: string[];
  partiallyDemonstratedConcepts: string[];
  missingConcepts: string[];
  suggestedImprovement: string;
  resumeClaimWarning?: string;
  followUpQuestion?: string;
}

export interface FullAnalysisResult {
  id: string;
  candidateId: string;
  timestamp: string;
  candidateName: string;
  resumeFilename: string;
  jobTitle: string;
  company: string;
  
  // Signature Features
  jobDna: JobDna;
  careerTwin: CareerTwin;
  readinessScore: JobReadinessScore;
  atsScore: AtsScoreBreakdown;
  alignmentScore: AlignmentScoreResult;
  matchedSkills: SkillMatchResult[];
  partiallyMatchedSkills: SkillMatchResult[];
  missingSkills: MissingSkillDetail[];
  rawEvidence: EvidenceItem[];
  whyNot100: Array<{ deduction: number; reason: string; category: string }>;
  gapActions: GapActionItem[];
  skillAdjacencies: SkillAdjacencyItem[];
  nextStep: SingleNextStep;
  whatIf: WhatIfProjection;
  recruiterLens: RecruiterLens;
  resumeHealth: ResumeHealth;
  
  // Section & Project Audits
  sectionAnalysis: SectionAnalysisResult[];
  projectAnalysis: ProjectAnalysisResult[];

  // Roadmap & Prep
  recommendedSkills: RecommendedSkillItem[];
  courseRecommendations: CourseRecommendation[];
  projectRecommendations: ProjectRecommendation[];
  roadmap: ImprovementRoadmap;
  interviewQuestions: InterviewQuestionItem[];
  mostLikelyQuestions: InterviewQuestionItem[];
  drawbacks: DrawbackItem[];
  usedLlmProvider: boolean;
}

export interface ResumeComparisonRow {
  candidateId: string;
  candidateName: string;
  filename: string;
  readinessScore: number;
  atsScore: number;
  alignmentScore: number;
  matchedSkillsCount: number;
  missingSkillsCount: number;
  skillsMatchPct: number;
  projectRelevanceScore: number;
  overallTier: ReadinessTier;
  analysisId: string;
  whyStrongestReason?: string;
}

export interface MultiResumeAnalysisReport {
  jobTitle: string;
  company: string;
  totalResumesAnalyzed: number;
  comparisonTable: ResumeComparisonRow[];
  individualAnalyses: FullAnalysisResult[];
  failedFiles?: Array<{ fileName: string; reason: string }>;
  whyTopCandidateIsStrongest: string;
}
