import assert from 'node:assert';
import test from 'node:test';
import { cleanText } from '../src/lib/parser/text-cleaner.ts';
import { parseJobDescription } from '../src/lib/parser/jd-processor.ts';
import { parseResume } from '../src/lib/parser/resume-parser.ts';
import { normalizeSkill } from '../src/lib/taxonomy/skill-taxonomy.ts';
import { matchSkills } from '../src/lib/engine/matching-engine.ts';
import { calculateAtsScore, calculateAlignmentScore } from '../src/lib/engine/ats-scorer.ts';
import { analyzeDrawbacks } from '../src/lib/engine/drawback-analyzer.ts';
import { analyzeSingleResume, analyzeMultipleResumes } from '../src/lib/engine/analyzer-pipeline.ts';
import { DEMO_JOB_DESCRIPTION, DEMO_RESUME_A, DEMO_RESUME_B, DEMO_RESUME_C } from '../src/lib/demo/demo-data.ts';

test('1. Text cleaning and normalization', () => {
  const raw = '  React.js   \r\n\r\n  • Node.js  \t  ';
  const cleaned = cleanText(raw);
  assert.ok(cleaned.includes('React.js'));
  assert.ok(cleaned.includes('• Node.js'));
});

test('2. Skill Normalization & Taxonomy Lookup', () => {
  assert.strictEqual(normalizeSkill('React.js').canonical, 'React');
  assert.strictEqual(normalizeSkill('Postgres').canonical, 'PostgreSQL');
  assert.strictEqual(normalizeSkill('JS').canonical, 'JavaScript');
  assert.strictEqual(normalizeSkill('RESTful API').canonical, 'REST API');
});

test('3. Job Description Parsing', () => {
  const jd = parseJobDescription(DEMO_JOB_DESCRIPTION);
  assert.ok(jd.jobTitle.includes('Full-Stack'));
  assert.ok(jd.mustHaveSkills.includes('React'));
  assert.ok(jd.mustHaveSkills.includes('Node.js'));
  assert.ok(jd.mustHaveSkills.includes('PostgreSQL'));
  assert.ok(jd.mustHaveSkills.includes('Docker'));
});

test('4. Resume Parsing & Section Extraction', () => {
  const resume = parseResume(DEMO_RESUME_A, 'Alex_Johnson.pdf');
  assert.strictEqual(resume.candidateName, 'Alex Johnson');
  assert.strictEqual(resume.contact.email, 'alex.johnson@example.com');
  assert.ok(resume.skills.includes('React'));
  assert.ok(resume.skills.includes('PostgreSQL'));
  assert.ok(resume.skills.includes('Docker'));
  assert.strictEqual(resume.hasMetrics, true);
});

test('5. Exact, Synonym, and Semantic Skill Matching', () => {
  const jd = parseJobDescription(DEMO_JOB_DESCRIPTION);
  const resumeA = parseResume(DEMO_RESUME_A);
  const { matched, missing } = matchSkills(jd, resumeA);

  assert.ok(matched.some((m) => m.canonicalSkill === 'React'));
  assert.ok(matched.some((m) => m.canonicalSkill === 'Docker'));
  assert.ok(missing.length < 3);
});

test('6. Non-Presumptive Missing Skill Detection', () => {
  const jd = parseJobDescription(DEMO_JOB_DESCRIPTION);
  const resumeC = parseResume(DEMO_RESUME_C);
  const { missing } = matchSkills(jd, resumeC);

  const dockerMissing = missing.find((m) => m.canonicalSkill === 'Docker');
  assert.ok(dockerMissing);
  assert.ok(dockerMissing.resumeEvidence.includes('was not detected in the uploaded resume text'));
});

test('7. Transparent ATS 100-Point Scoring & Explainability', () => {
  const jd = parseJobDescription(DEMO_JOB_DESCRIPTION);
  const resumeA = parseResume(DEMO_RESUME_A);
  const { matched, partiallyMatched, missing } = matchSkills(jd, resumeA);

  const ats = calculateAtsScore(jd, resumeA, matched, partiallyMatched, missing);

  assert.ok(ats.totalScore >= 75);
  assert.strictEqual(ats.skillsMatch.maxPoints, 30);
  assert.ok(ats.skillsMatch.reason);
  assert.strictEqual(ats.keywordMatch.maxPoints, 15);
});

test('8. Alignment Score & Tier Classification', () => {
  const jd = parseJobDescription(DEMO_JOB_DESCRIPTION);
  const resumeA = parseResume(DEMO_RESUME_A);
  const { matched, partiallyMatched, missing } = matchSkills(jd, resumeA);

  const align = calculateAlignmentScore(jd, resumeA, matched, partiallyMatched, missing);

  assert.ok(align.score >= 70);
  assert.ok(['EXCELLENT', 'STRONG', 'GOOD'].includes(align.tier));
  assert.ok(align.explanation.includes('Candidate scored'));
});

test('9. Evidence-Based Drawback Detection', () => {
  const jd = parseJobDescription(DEMO_JOB_DESCRIPTION);
  const resumeB = parseResume(DEMO_RESUME_B);
  const { missing } = matchSkills(jd, resumeB);

  const drawbacks = analyzeDrawbacks(jd, resumeB, missing);
  assert.ok(drawbacks.length > 0);
  assert.ok(drawbacks[0].severity);
  assert.ok(drawbacks[0].whyItMatters);
});

test('10. End-to-End Single Resume Pipeline', () => {
  const analysis = analyzeSingleResume(DEMO_JOB_DESCRIPTION, DEMO_RESUME_A, 'Alex_Johnson.pdf');
  assert.ok(analysis.atsScore.totalScore > 0);
  assert.ok(analysis.rawEvidence.length > 0);
  assert.ok(analysis.interviewQuestions.length > 0);
  assert.strictEqual(analysis.usedLlmProvider, false);
});

test('11. Multi-Resume Processing & Sortable Comparison', () => {
  const report = analyzeMultipleResumes(DEMO_JOB_DESCRIPTION, [
    { content: DEMO_RESUME_A, filename: 'Candidate_A.pdf' },
    { content: DEMO_RESUME_B, filename: 'Candidate_B.pdf' },
    { content: DEMO_RESUME_C, filename: 'Candidate_C.pdf' },
  ]);

  assert.strictEqual(report.totalResumesAnalyzed, 3);
  assert.strictEqual(report.comparisonTable.length, 3);
  assert.ok(report.comparisonTable[0].atsScore >= report.comparisonTable[1].atsScore);
  assert.ok(report.comparisonTable[1].atsScore >= report.comparisonTable[2].atsScore);
});
