import { describe, it, expect } from 'vitest';
import { cleanText } from '../src/lib/parser/text-cleaner';
import { parseJobDescription } from '../src/lib/parser/jd-processor';
import { parseResume } from '../src/lib/parser/resume-parser';
import { normalizeSkill } from '../src/lib/taxonomy/skill-taxonomy';
import { matchSkills } from '../src/lib/engine/matching-engine';
import { calculateAtsScore, calculateAlignmentScore } from '../src/lib/engine/ats-scorer';
import { analyzeDrawbacks } from '../src/lib/engine/drawback-analyzer';
import { analyzeSingleResume, analyzeMultipleResumes } from '../src/lib/engine/analyzer-pipeline';
import { DEMO_JOB_DESCRIPTION, DEMO_RESUME_A, DEMO_RESUME_B, DEMO_RESUME_C } from '../src/lib/demo/demo-data';

describe('MVP 1 Acceptance Suite — End-to-End Pipeline', () => {
  it('1. Text cleaning and normalization', () => {
    const raw = '  React.js   \r\n\r\n  • Node.js  \t  ';
    const cleaned = cleanText(raw);
    expect(cleaned).toContain('React.js');
    expect(cleaned).toContain('• Node.js');
  });

  it('2. Skill Normalization & Taxonomy Lookup', () => {
    expect(normalizeSkill('React.js').canonical).toBe('React');
    expect(normalizeSkill('Postgres').canonical).toBe('PostgreSQL');
    expect(normalizeSkill('JS').canonical).toBe('JavaScript');
    expect(normalizeSkill('RESTful API').canonical).toBe('REST API');
  });

  it('3. Job Description Parsing', () => {
    const jd = parseJobDescription(DEMO_JOB_DESCRIPTION);
    expect(jd.jobTitle).toContain('Full-Stack');
    expect(jd.mustHaveSkills).toContain('React');
    expect(jd.mustHaveSkills).toContain('Node.js');
    expect(jd.mustHaveSkills).toContain('PostgreSQL');
    expect(jd.mustHaveSkills).toContain('Docker');
  });

  it('4. Resume Parsing & Section Extraction', () => {
    const resume = parseResume(DEMO_RESUME_A, 'Alex_Johnson.pdf');
    expect(resume.candidateName).toBe('Alex Johnson');
    expect(resume.contact.email).toBe('alex.johnson@example.com');
    expect(resume.skills).toContain('React');
    expect(resume.skills).toContain('PostgreSQL');
    expect(resume.skills).toContain('Docker');
    expect(resume.hasMetrics).toBe(true);
  });

  it('5. Exact, Synonym, and Semantic Skill Matching', () => {
    const jd = parseJobDescription(DEMO_JOB_DESCRIPTION);
    const resumeA = parseResume(DEMO_RESUME_A);
    const { matched, missing } = matchSkills(jd, resumeA);

    expect(matched.some((m) => m.canonicalSkill === 'React')).toBe(true);
    expect(matched.some((m) => m.canonicalSkill === 'Docker')).toBe(true);
    expect(missing.length).toBeLessThan(3);
  });

  it('6. Non-Presumptive Missing Skill Detection', () => {
    const jd = parseJobDescription(DEMO_JOB_DESCRIPTION);
    const resumeC = parseResume(DEMO_RESUME_C);
    const { missing } = matchSkills(jd, resumeC);

    expect(missing.some((m) => m.canonicalSkill === 'Docker')).toBe(true);
    const dockerMissing = missing.find((m) => m.canonicalSkill === 'Docker');
    expect(dockerMissing?.resumeEvidence).toContain('was not detected in the uploaded resume text');
  });

  it('7. Transparent ATS 100-Point Scoring & Explainability', () => {
    const jd = parseJobDescription(DEMO_JOB_DESCRIPTION);
    const resumeA = parseResume(DEMO_RESUME_A);
    const { matched, partiallyMatched, missing } = matchSkills(jd, resumeA);

    const ats = calculateAtsScore(jd, resumeA, matched, partiallyMatched, missing);

    expect(ats.totalScore).toBeGreaterThanOrEqual(75);
    expect(ats.skillsMatch.maxPoints).toBe(30);
    expect(ats.skillsMatch.reason).toBeDefined();
    expect(ats.keywordMatch.maxPoints).toBe(15);
  });

  it('8. Alignment Score & Tier Classification', () => {
    const jd = parseJobDescription(DEMO_JOB_DESCRIPTION);
    const resumeA = parseResume(DEMO_RESUME_A);
    const { matched, partiallyMatched, missing } = matchSkills(jd, resumeA);

    const align = calculateAlignmentScore(jd, resumeA, matched, partiallyMatched, missing);

    expect(align.score).toBeGreaterThanOrEqual(70);
    expect(['EXCELLENT', 'STRONG', 'GOOD']).toContain(align.tier);
    expect(align.explanation).toContain('Candidate scored');
  });

  it('9. Evidence-Based Drawback Detection', () => {
    const jd = parseJobDescription(DEMO_JOB_DESCRIPTION);
    const resumeB = parseResume(DEMO_RESUME_B);
    const { missing } = matchSkills(jd, resumeB);

    const drawbacks = analyzeDrawbacks(jd, resumeB, missing);
    expect(drawbacks.length).toBeGreaterThan(0);
    expect(drawbacks[0].severity).toBeDefined();
    expect(drawbacks[0].whyItMatters).toBeDefined();
  });

  it('10. End-to-End Single Resume Pipeline', () => {
    const analysis = analyzeSingleResume(DEMO_JOB_DESCRIPTION, DEMO_RESUME_A, 'Alex_Johnson.pdf');
    expect(analysis.atsScore.totalScore).toBeGreaterThan(0);
    expect(analysis.rawEvidence.length).toBeGreaterThan(0);
    expect(analysis.interviewQuestions.length).toBeGreaterThan(0);
    expect(analysis.usedLlmProvider).toBe(false);
  });

  it('11. Multi-Resume Processing & Candidate IDs', () => {
    const report = analyzeMultipleResumes(DEMO_JOB_DESCRIPTION, [
      { content: DEMO_RESUME_A, filename: 'Candidate_A.pdf' },
      { content: DEMO_RESUME_B, filename: 'Candidate_B.pdf' },
      { content: DEMO_RESUME_C, filename: 'Candidate_C.pdf' },
    ]);

    expect(report.totalResumesAnalyzed).toBe(3);
    expect(report.comparisonTable.length).toBe(3);
    expect(report.individualAnalyses.length).toBe(3);

    // Verify candidate IDs
    expect(report.individualAnalyses[0].candidateId).toBe('candidate-1');
    expect(report.individualAnalyses[1].candidateId).toBe('candidate-2');
    expect(report.individualAnalyses[2].candidateId).toBe('candidate-3');

    // Verify shared JD context
    expect(report.jobTitle).toContain('Full-Stack');
    expect(report.individualAnalyses.every((a) => a.jobTitle === report.jobTitle)).toBe(true);
  });

  it('12. Multi-Resume Scale Tests (1, 2, 5, 10 Resumes)', () => {
    // 1 resume
    const report1 = analyzeMultipleResumes(DEMO_JOB_DESCRIPTION, [{ content: DEMO_RESUME_A, filename: 'Res1.pdf' }]);
    expect(report1.totalResumesAnalyzed).toBe(1);

    // 2 resumes
    const report2 = analyzeMultipleResumes(DEMO_JOB_DESCRIPTION, [
      { content: DEMO_RESUME_A, filename: 'Res1.pdf' },
      { content: DEMO_RESUME_B, filename: 'Res2.pdf' },
    ]);
    expect(report2.totalResumesAnalyzed).toBe(2);

    // 5 resumes
    const list5 = Array.from({ length: 5 }, (_, i) => ({
      content: i % 2 === 0 ? DEMO_RESUME_A : DEMO_RESUME_B,
      filename: `Resume_${i + 1}.pdf`,
    }));
    const report5 = analyzeMultipleResumes(DEMO_JOB_DESCRIPTION, list5);
    expect(report5.totalResumesAnalyzed).toBe(5);

    // 10 resumes
    const list10 = Array.from({ length: 10 }, (_, i) => ({
      content: i % 3 === 0 ? DEMO_RESUME_A : i % 3 === 1 ? DEMO_RESUME_B : DEMO_RESUME_C,
      filename: `Resume_${i + 1}.pdf`,
    }));
    const report10 = analyzeMultipleResumes(DEMO_JOB_DESCRIPTION, list10);
    expect(report10.totalResumesAnalyzed).toBe(10);
    expect(report10.comparisonTable.length).toBe(10);
  });

  it('13. Multi-Resume Comparison Table Sortability & Winner Highlight', () => {
    const report = analyzeMultipleResumes(DEMO_JOB_DESCRIPTION, [
      { content: DEMO_RESUME_A, filename: 'Senior.pdf' },
      { content: DEMO_RESUME_B, filename: 'Mid.pdf' },
      { content: DEMO_RESUME_C, filename: 'Junior.pdf' },
    ]);

    // Comparison rows check
    expect(report.comparisonTable[0].readinessScore).toBeGreaterThanOrEqual(report.comparisonTable[1].readinessScore);
    expect(report.comparisonTable[1].readinessScore).toBeGreaterThanOrEqual(report.comparisonTable[2].readinessScore);
    expect(report.whyTopCandidateIsStrongest).toContain('Strongest Match');
    expect(report.comparisonTable[0].alignmentScore).toBeDefined();
    expect(report.comparisonTable[0].skillsMatchPct).toBeDefined();
    expect(report.comparisonTable[0].projectRelevanceScore).toBeDefined();
  });

  it('14. Partial Failure Handling with failedFiles', () => {
    const failedFiles = [{ fileName: 'Corrupted.pdf', reason: 'Unable to extract readable text from this PDF.' }];
    const report = analyzeMultipleResumes(
      DEMO_JOB_DESCRIPTION,
      [
        { content: DEMO_RESUME_A, filename: 'Valid_A.pdf' },
        { content: DEMO_RESUME_B, filename: 'Valid_B.pdf' },
      ],
      failedFiles
    );

    expect(report.totalResumesAnalyzed).toBe(2);
    expect(report.failedFiles).toBeDefined();
    expect(report.failedFiles?.length).toBe(1);
    expect(report.failedFiles?.[0].fileName).toBe('Corrupted.pdf');
  });
});
