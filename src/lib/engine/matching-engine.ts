import { StructuredJD, StructuredResume, SkillMatchResult, MatchType } from '../../types/analyzer';
import { SKILL_TAXONOMY, normalizeSkill } from '../taxonomy/skill-taxonomy';

export function matchSkills(jd: StructuredJD, resume: StructuredResume): {
  matched: SkillMatchResult[];
  partiallyMatched: SkillMatchResult[];
  missing: SkillMatchResult[];
} {
  const matched: SkillMatchResult[] = [];
  const partiallyMatched: SkillMatchResult[] = [];
  const missing: SkillMatchResult[] = [];

  const resumeLowerText = resume.rawText.toLowerCase();
  const allJdSkills = Array.from(new Set([...jd.mustHaveSkills, ...jd.keywords]));

  allJdSkills.forEach((jdSkill) => {
    const isMandatory = jd.mustHaveSkills.includes(jdSkill);
    const normalized = normalizeSkill(jdSkill);
    const canonical = normalized.canonical || jdSkill;

    // Find entry in taxonomy for synonym forms
    const taxonomyEntry = SKILL_TAXONOMY.find((e) => e.canonical === canonical);
    const formsToTest = taxonomyEntry
      ? [taxonomyEntry.canonical, ...taxonomyEntry.synonyms]
      : [jdSkill, canonical];

    let foundMatch: { matchType: MatchType; confidence: number; evidence: string } | null = null;

    // 1. Exact & Normalized Check
    for (const form of formsToTest) {
      const formLower = form.toLowerCase();
      const escaped = formLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?:^|[^a-zA-Z0-9+#.-])(${escaped})(?:$|[^a-zA-Z0-9+#.-])`, 'i');

      if (regex.test(resumeLowerText)) {
        // Extract surrounding sentence evidence
        const evidenceSnippet = extractEvidenceSentence(resume.rawText, formLower);
        if (formLower === jdSkill.toLowerCase()) {
          foundMatch = { matchType: 'EXACT', confidence: 100, evidence: evidenceSnippet };
        } else if (normalized.isTaxonomyMatch && formLower === canonical.toLowerCase()) {
          foundMatch = { matchType: 'NORMALIZED', confidence: 95, evidence: evidenceSnippet };
        } else {
          foundMatch = { matchType: 'SYNONYM', confidence: 90, evidence: evidenceSnippet };
        }
        break;
      }
    }

    // 2. Semantic / Concept Check (if not exact/synonym match)
    if (!foundMatch) {
      foundMatch = checkSemanticSkillMatch(canonical, resume);
    }

    // Assign score contribution (base points per skill)
    const basePoints = isMandatory ? 4 : 2;

    if (foundMatch) {
      const scoreContribution = Math.round((basePoints * foundMatch.confidence) / 100);
      const matchResult: SkillMatchResult = {
        jdSkill,
        canonicalSkill: canonical,
        resumeEvidence: foundMatch.evidence,
        matchType: foundMatch.matchType,
        confidence: foundMatch.confidence,
        scoreContribution,
        isMandatory,
        status: foundMatch.confidence >= 80 ? 'MATCHED' : 'PARTIALLY_MATCHED',
      };

      if (matchResult.status === 'MATCHED') {
        matched.push(matchResult);
      } else {
        partiallyMatched.push(matchResult);
      }
    } else {
      missing.push({
        jdSkill,
        canonicalSkill: canonical,
        resumeEvidence: `${canonical} was not detected in the uploaded resume text.`,
        matchType: 'NOT_DETECTED',
        confidence: 0,
        scoreContribution: 0,
        isMandatory,
        status: 'NOT_DETECTED',
      });
    }
  });

  return { matched, partiallyMatched, missing };
}

function checkSemanticSkillMatch(canonicalSkill: string, resume: StructuredResume): { matchType: MatchType; confidence: number; evidence: string } | null {
  const lowerText = resume.rawText.toLowerCase();

  // Semantic concept rules
  const semanticRules: Record<string, { triggers: string[]; confidence: number; note: string }> = {
    'REST API': {
      triggers: ['http api', 'express.js', 'backend services', 'json api', 'endpoints', 'axios', 'fetch api'],
      confidence: 78,
      note: 'Demonstrates web service backend/API consumption in resume experience',
    },
    'AWS': {
      triggers: ['cloud deployment', 'ec2', 's3 bucket', 'cloud infrastructure', 'aws lambda', 'cloud host'],
      confidence: 80,
      note: 'Mentions cloud infrastructure or AWS cloud services in experience',
    },
    'Docker': {
      triggers: ['container', 'containerized', 'dockerfile', 'docker-compose', 'image build'],
      confidence: 85,
      note: 'Demonstrates containerization practice in projects or work history',
    },
    'PostgreSQL': {
      triggers: ['relational database', 'sql database', 'typeorm', 'prisma', 'knex', 'rdbms'],
      confidence: 72,
      note: 'Mentions SQL relational database OR ORM usage in resume',
    },
    'CI/CD': {
      triggers: ['automated build', 'github actions', 'jenkins pipeline', 'deployment pipeline', 'automated testing'],
      confidence: 82,
      note: 'Mentions build automation or continuous deployment pipelines',
    },
    'Generative AI': {
      triggers: ['openai api', 'llm integration', 'rag pipeline', 'prompt engineering', 'langchain', 'vector database'],
      confidence: 88,
      note: 'Demonstrates large language model integration or RAG application in projects',
    },
    'Unit Testing': {
      triggers: ['jest', 'vitest', 'testing library', 'test suite', 'unit tests', 'test coverage'],
      confidence: 90,
      note: 'Mentions automated test runner or unit testing framework in resume',
    },
  };

  const rule = semanticRules[canonicalSkill];
  if (rule) {
    for (const trigger of rule.triggers) {
      if (lowerText.includes(trigger)) {
        const evidence = extractEvidenceSentence(resume.rawText, trigger);
        return {
          matchType: 'SEMANTIC',
          confidence: rule.confidence,
          evidence: `Semantic Match: ${evidence} (${rule.note})`,
        };
      }
    }
  }

  return null;
}

function extractEvidenceSentence(fullText: string, searchTerm: string): string {
  const lines = fullText.split('\n');
  for (const line of lines) {
    if (line.toLowerCase().includes(searchTerm.toLowerCase())) {
      const trimmed = line.trim().replace(/^[•\-\*\s]+/, '');
      return trimmed.length > 120 ? trimmed.substring(0, 117) + '...' : trimmed;
    }
  }
  return `Detected keyword '${searchTerm}' in resume body context.`;
}
