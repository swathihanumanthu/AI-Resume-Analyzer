// Comprehensive TypeScript definitions for AI Resume & JD Analyzer

export type FileType = 'pdf' | 'docx' | 'txt' | 'text';

export interface FileInput {
  name: string;
  type: FileType;
  content: string; // Plain text content extracted
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

export type MatchType = 'EXACT' | 'NORMALIZED' | 'SYNONYM' | 'SEMANTIC' | 'PARTIAL' | 'NOT_DETECTED';

export interface SkillMatchResult {
  jdSkill: string;
  canonicalSkill: string;
  resumeEvidence: string;
  matchType: MatchType;
  confidence: number; // 0 to 100
  scoreContribution: number;
  isMandatory: boolean;
  status: 'MATCHED' | 'PARTIALLY_MATCHED' | 'NOT_DETECTED';
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
  skillsMatch: DimensionScore; // max 30
  keywordMatch: DimensionScore; // max 15
  experienceProjectAlignment: DimensionScore; // max 15
  educationAlignment: DimensionScore; // max 10
  responsibilitiesAlignment: DimensionScore; // max 10
  resumeStructure: DimensionScore; // max 10
  atsParsingCompatibility: DimensionScore; // max 10
  totalScore: number; // 0-100
}

export type AlignmentTier = 'EXCELLENT' | 'STRONG' | 'GOOD' | 'MODERATE' | 'WEAK' | 'POOR';

export interface AlignmentScoreResult {
  score: number; // 0-100
  tier: AlignmentTier;
  label: string;
  explanation: string;
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
  score: number; // 0-100
  detected: boolean;
  problems: string[];
  missingInformation: string[];
  recommendations: string[];
}

export interface ProjectAnalysisResult {
  title: string;
  relevanceScore: number; // 0-100
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

export interface KeywordGapItem {
  jdRequirement: string;
  resumeFound: string;
  matchType: MatchType;
  status: 'MATCH' | 'PARTIAL' | 'MISSING';
  recommendation: string;
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

export interface InterviewQuestionItem {
  category: 'Technical' | 'Project' | 'Resume' | 'HR' | 'Behavioral' | 'Coding' | 'Scenario';
  question: string;
  whyAsked: string;
  suggestedFocus: string;
  isHighLikelihood?: boolean;
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

export interface FullAnalysisResult {
  id: string;
  timestamp: string;
  candidateName: string;
  resumeFilename: string;
  jobTitle: string;
  company: string;
  atsScore: AtsScoreBreakdown;
  alignmentScore: AlignmentScoreResult;
  matchedSkills: SkillMatchResult[];
  partiallyMatchedSkills: SkillMatchResult[];
  missingSkills: MissingSkillDetail[];
  keywordGaps: KeywordGapItem[];
  drawbacks: DrawbackItem[];
  sectionAnalysis: SectionAnalysisResult[];
  projectAnalysis: ProjectAnalysisResult[];
  recommendedSkills: RecommendedSkillItem[];
  courseRecommendations: CourseRecommendation[];
  projectRecommendations: ProjectRecommendation[];
  roadmap: ImprovementRoadmap;
  interviewQuestions: InterviewQuestionItem[];
  mostLikelyQuestions: InterviewQuestionItem[];
  rawEvidence: EvidenceItem[];
  usedLlmProvider: boolean;
}

export interface ResumeComparisonRow {
  candidateName: string;
  filename: string;
  atsScore: number;
  alignmentScore: number;
  matchedSkillsCount: number;
  missingSkillsCount: number;
  projectScore: number;
  overallTier: AlignmentTier;
  analysisId: string;
}

export interface MultiResumeAnalysisReport {
  jobTitle: string;
  company: string;
  totalResumesAnalyzed: number;
  comparisonTable: ResumeComparisonRow[];
  individualAnalyses: FullAnalysisResult[];
}
