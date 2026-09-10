import {
  StructuredJD,
  StructuredResume,
  SkillMatchResult,
  AtsScoreBreakdown,
  DimensionScore,
  AlignmentScoreResult,
  AlignmentTier,
} from '../../types/analyzer';

export function calculateAtsScore(
  jd: StructuredJD,
  resume: StructuredResume,
  matchedSkills: SkillMatchResult[],
  partiallyMatchedSkills: SkillMatchResult[],
  missingSkills: SkillMatchResult[]
): AtsScoreBreakdown {
  // 1. Skills Match (30 pts)
  const totalRequired = Math.max(1, matchedSkills.length + partiallyMatchedSkills.length + missingSkills.length);
  const matchedCount = matchedSkills.length + partiallyMatchedSkills.length * 0.5;
  const skillsAwarded = Math.min(30, Math.round((matchedCount / totalRequired) * 30));
  const skillsLost = 30 - skillsAwarded;
  const skillsScore: DimensionScore = {
    maxPoints: 30,
    awardedPoints: skillsAwarded,
    lostPoints: skillsLost,
    reason:
      skillsLost > 0
        ? `Lost ${skillsLost} point(s) because ${missingSkills.length} JD requirement(s) (${missingSkills
            .slice(0, 3)
            .map((s) => s.jdSkill)
            .join(', ')}) were not detected in the resume.`
        : 'All required technical skills were successfully detected in the resume.',
    supportingEvidence: matchedSkills.map((m) => `${m.jdSkill}: ${m.resumeEvidence}`),
  };

  // 2. Keyword Match (15 pts)
  const jdKeywords = jd.keywords.length > 0 ? jd.keywords : ['Software', 'Development', 'Engineering'];
  let kwFound = 0;
  const kwFoundList: string[] = [];
  const resumeTextLower = resume.rawText.toLowerCase();

  jdKeywords.forEach((kw) => {
    if (resumeTextLower.includes(kw.toLowerCase())) {
      kwFound++;
      kwFoundList.push(kw);
    }
  });

  const kwAwarded = Math.min(15, Math.round((kwFound / jdKeywords.length) * 15));
  const kwLost = 15 - kwAwarded;
  const keywordScore: DimensionScore = {
    maxPoints: 15,
    awardedPoints: kwAwarded,
    lostPoints: kwLost,
    reason:
      kwLost > 0
        ? `Lost ${kwLost} point(s) due to key JD term gap. Detected ${kwFound}/${jdKeywords.length} core keywords.`
        : `Strong keyword match: Detected ${kwFound}/${jdKeywords.length} core JD keywords.`,
    supportingEvidence: kwFoundList.map((k) => `Matched keyword: '${k}'`),
  };

  // 3. Experience & Project Alignment (15 pts)
  let expAwarded = 10;
  const expReasons: string[] = [];

  if (resume.experience.length > 0) {
    expAwarded += 3;
    expReasons.push(`Work experience detected (${resume.experience.length} roles).`);
  }
  if (resume.projects.length > 0) {
    expAwarded += 2;
    expReasons.push(`Projects section detected (${resume.projects.length} projects).`);
  }
  if (resume.hasMetrics) {
    expReasons.push('Contains quantifiable achievements and numerical impact metrics.');
  } else {
    expAwarded = Math.max(8, expAwarded - 3);
    expReasons.push('Lacks quantifiable metrics (% growth, numerical results) in project/work bullets.');
  }

  expAwarded = Math.min(15, Math.max(4, expAwarded));
  const expLost = 15 - expAwarded;
  const expScore: DimensionScore = {
    maxPoints: 15,
    awardedPoints: expAwarded,
    lostPoints: expLost,
    reason:
      expLost > 0
        ? `Lost ${expLost} point(s) in Experience/Project alignment. Reason: ${expReasons.join(' ')}`
        : 'Excellent experience & project alignment with clear evidence and metrics.',
    supportingEvidence: expReasons,
  };

  // 4. Education Alignment (10 pts)
  const hasEdu = resume.education.length > 0 || /bachelor|master|degree|btech|be|bs|ms/i.test(resume.rawText);
  const eduAwarded = hasEdu ? 10 : 4;
  const eduLost = 10 - eduAwarded;
  const eduScore: DimensionScore = {
    maxPoints: 10,
    awardedPoints: eduAwarded,
    lostPoints: eduLost,
    reason:
      eduLost > 0
        ? `Lost ${eduLost} point(s) because degree or academic background was not clearly specified.`
        : 'Degree/academic background meets JD educational eligibility criteria.',
    supportingEvidence: resume.education.map((e) => e.degree),
  };

  // 5. Responsibilities Alignment (10 pts)
  let respAwarded = 7;
  const respEvidence: string[] = [];
  if (jd.responsibilities.length > 0) {
    let matchedResp = 0;
    jd.responsibilities.forEach((resp) => {
      const respWords = resp.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
      const matches = respWords.filter((w) => resumeTextLower.includes(w)).length;
      if (matches >= 2) {
        matchedResp++;
        respEvidence.push(`Matched responsibility phrase: '${resp}'`);
      }
    });
    respAwarded = Math.min(10, Math.max(3, Math.round((matchedResp / Math.max(1, jd.responsibilities.length)) * 10) + 4));
  } else {
    respAwarded = 8;
  }

  const respLost = 10 - respAwarded;
  const respScore: DimensionScore = {
    maxPoints: 10,
    awardedPoints: respAwarded,
    lostPoints: respLost,
    reason:
      respLost > 0
        ? `Lost ${respLost} point(s) because resume action bullets partially align with JD key responsibilities.`
        : 'Resume work bullets strongly demonstrate alignment with JD responsibilities.',
    supportingEvidence: respEvidence,
  };

  // 6. Resume Structure (10 pts)
  let structAwarded = 10;
  const structIssues: string[] = [];

  if (!resume.contact.email) {
    structAwarded -= 3;
    structIssues.push('Missing clear contact email.');
  }
  if (!resume.contact.github && !resume.contact.linkedin) {
    structAwarded -= 2;
    structIssues.push('Missing professional profile links (GitHub / LinkedIn).');
  }
  if (resume.sections.filter((s) => s.detected).length < 4) {
    structAwarded -= 2;
    structIssues.push('Fewer than 4 standard resume sections detected.');
  }

  structAwarded = Math.min(10, Math.max(3, structAwarded));
  const structLost = 10 - structAwarded;
  const structScore: DimensionScore = {
    maxPoints: 10,
    awardedPoints: structAwarded,
    lostPoints: structLost,
    reason:
      structLost > 0
        ? `Lost ${structLost} point(s) in Structure: ${structIssues.join(' ')}`
        : 'Well-structured resume with standard section headings and contact details.',
    supportingEvidence: structIssues,
  };

  // 7. ATS Parsing Compatibility (10 pts)
  let atsParsingAwarded = 10;
  const atsIssues = [...resume.atsFormattingIssues];

  if (atsIssues.length > 0) {
    atsParsingAwarded = Math.max(3, 10 - atsIssues.length * 3);
  }

  const atsParsingLost = 10 - atsParsingAwarded;
  const atsParsingScore: DimensionScore = {
    maxPoints: 10,
    awardedPoints: atsParsingAwarded,
    lostPoints: atsParsingLost,
    reason:
      atsParsingLost > 0
        ? `Lost ${atsParsingLost} point(s) in ATS Compatibility: ${atsIssues.join(' ')}`
        : 'Clean, standard text formatting suitable for automated ATS parser extraction.',
    supportingEvidence: atsIssues,
  };

  const totalScore = Math.min(
    100,
    skillsScore.awardedPoints +
      keywordScore.awardedPoints +
      expScore.awardedPoints +
      eduScore.awardedPoints +
      respScore.awardedPoints +
      structScore.awardedPoints +
      atsParsingScore.awardedPoints
  );

  return {
    skillsMatch: skillsScore,
    keywordMatch: keywordScore,
    experienceProjectAlignment: expScore,
    educationAlignment: eduScore,
    responsibilitiesAlignment: respScore,
    resumeStructure: structScore,
    atsParsingCompatibility: atsParsingScore,
    totalScore,
  };
}

export function calculateAlignmentScore(
  jd: StructuredJD,
  resume: StructuredResume,
  matchedSkills: SkillMatchResult[],
  partiallyMatchedSkills: SkillMatchResult[],
  missingSkills: SkillMatchResult[]
): AlignmentScoreResult {
  // Independent Alignment Formula focusing on Core Mandatory Skills & Project Relevance
  const totalMandatory = Math.max(1, jd.mustHaveSkills.length);
  const matchedMandatory = matchedSkills.filter((m) => m.isMandatory).length;
  const mandatoryRatio = matchedMandatory / totalMandatory;

  const projectTechMatchRatio =
    resume.projects.length > 0
      ? resume.projects.filter((p) => p.technologies.some((t) => jd.mustHaveSkills.includes(t))).length / resume.projects.length
      : 0.5;

  const alignmentRaw = Math.round(mandatoryRatio * 65 + projectTechMatchRatio * 25 + (resume.hasMetrics ? 10 : 0));
  const score = Math.min(100, Math.max(15, alignmentRaw));

  let tier: AlignmentTier = 'POOR';
  let label = 'Poor Match';

  if (score >= 90) {
    tier = 'EXCELLENT';
    label = '90–100 = Excellent Match';
  } else if (score >= 80) {
    tier = 'STRONG';
    label = '80–89 = Strong Match';
  } else if (score >= 70) {
    tier = 'GOOD';
    label = '70–79 = Good Match';
  } else if (score >= 60) {
    tier = 'MODERATE';
    label = '60–69 = Moderate Match';
  } else if (score >= 40) {
    tier = 'WEAK';
    label = '40–59 = Weak Match';
  } else {
    tier = 'POOR';
    label = '0–39 = Poor Match';
  }

  const missingListStr = missingSkills
    .slice(0, 3)
    .map((s) => s.jdSkill)
    .join(', ');

  const explanation =
    missingSkills.length > 0
      ? `Candidate scored ${score}/100 (${tier} Tier). High alignment in detected technical skills (${matchedSkills.length} matches), but lost score because key required JD skills (${missingListStr}) were not detected in resume text.`
      : `Candidate scored ${score}/100 (${tier} Tier). High alignment across all required technical skills, projects, and domain experience.`;

  return { score, tier, label, explanation };
}
