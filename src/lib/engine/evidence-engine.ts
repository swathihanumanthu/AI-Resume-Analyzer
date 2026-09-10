import { StructuredJD, StructuredResume, SkillMatchResult, EvidenceItem } from '../../types/analyzer';

export function generateEvidenceLayer(
  jd: StructuredJD,
  resume: StructuredResume,
  matched: SkillMatchResult[],
  partiallyMatched: SkillMatchResult[],
  missing: SkillMatchResult[]
): EvidenceItem[] {
  const evidenceList: EvidenceItem[] = [];

  // 1. Mandatory Skills Evidence
  matched.forEach((m) => {
    evidenceList.push({
      requirement: m.jdSkill,
      category: 'Mandatory Skill',
      foundEvidence: m.resumeEvidence,
      matchType: m.matchType,
      confidence: m.confidence,
      scoreContribution: m.scoreContribution,
      status: 'MATCHED',
    });
  });

  partiallyMatched.forEach((pm) => {
    evidenceList.push({
      requirement: pm.jdSkill,
      category: 'Skill Requirement',
      foundEvidence: pm.resumeEvidence,
      matchType: pm.matchType,
      confidence: pm.confidence,
      scoreContribution: pm.scoreContribution,
      status: 'PARTIALLY_MATCHED',
    });
  });

  missing.forEach((mis) => {
    evidenceList.push({
      requirement: mis.jdSkill,
      category: mis.isMandatory ? 'Mandatory Skill' : 'Preferred Skill',
      foundEvidence: `${mis.canonicalSkill} was not detected in the uploaded resume text.`,
      matchType: 'NOT_DETECTED',
      confidence: 0,
      scoreContribution: 0,
      status: 'NOT_DETECTED',
    });
  });

  // 2. Education Evidence
  if (jd.education.length > 0) {
    const resumeEdu = resume.education.map((e) => e.degree).join('; ');
    const hasEdu = resume.education.length > 0;
    evidenceList.push({
      requirement: `Education: ${jd.education.join(', ')}`,
      category: 'Education Eligibility',
      foundEvidence: hasEdu ? `Found degree: ${resumeEdu}` : 'Degree section was not explicitly detected in resume text.',
      matchType: hasEdu ? 'EXACT' : 'NOT_DETECTED',
      confidence: hasEdu ? 95 : 0,
      scoreContribution: hasEdu ? 10 : 0,
      status: hasEdu ? 'MATCHED' : 'NOT_DETECTED',
    });
  }

  // 3. Experience Alignment Evidence
  if (jd.experience.length > 0) {
    const hasExp = resume.experience.length > 0 || resume.projects.length > 0;
    evidenceList.push({
      requirement: `Experience: ${jd.experience.join(', ')}`,
      category: 'Experience Requirement',
      foundEvidence: hasExp
        ? `Resume documents ${resume.experience.length} work experience role(s) and ${resume.projects.length} project(s).`
        : 'Work experience section was not detected in resume text.',
      matchType: hasExp ? 'SYNONYM' : 'NOT_DETECTED',
      confidence: hasExp ? 85 : 0,
      scoreContribution: hasExp ? 12 : 0,
      status: hasExp ? 'MATCHED' : 'NOT_DETECTED',
    });
  }

  return evidenceList;
}
