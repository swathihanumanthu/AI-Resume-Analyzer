import { StructuredJD, StructuredResume, SkillMatchResult, RecruiterLens } from '../../types/analyzer';

export function analyzeRecruiterLens(
  jd: StructuredJD,
  resume: StructuredResume,
  matchedSkills: SkillMatchResult[],
  missingSkills: SkillMatchResult[]
): RecruiterLens {
  const visibleIn10Seconds: string[] = [];
  const notImmediatelyObvious: string[] = [];

  // Top visible elements
  if (matchedSkills.length > 0) {
    visibleIn10Seconds.push(`Core Stack: ${matchedSkills.slice(0, 3).map((m) => m.jdSkill).join(', ')}`);
  }
  if (resume.projects.length > 0) {
    visibleIn10Seconds.push(`Relevant Project: '${resume.projects[0].title}'`);
  }
  if (resume.education.length > 0) {
    visibleIn10Seconds.push(`Degree: ${resume.education[0].degree}`);
  }

  // Not immediately obvious / hidden elements
  missingSkills.slice(0, 2).forEach((m) => {
    notImmediatelyObvious.push(`Undetected Requirement: ${m.jdSkill}`);
  });
  if (!resume.hasMetrics) {
    notImmediatelyObvious.push('Quantified Business Impact & Metrics');
  }
  if (!resume.contact.github || !resume.contact.linkedin) {
    notImmediatelyObvious.push('Clickable GitHub / LinkedIn Profile Headers');
  }

  const topMatch = matchedSkills[0]?.jdSkill || 'Technical Background';
  const topMissing = missingSkills[0]?.jdSkill || 'Cloud / DevOps Experience';

  return {
    firstImpression: `Strong foundational profile in ${topMatch} with clear project technical focus.`,
    strongestSignal: matchedSkills.length > 0
      ? `Verified experience with core JD technologies: ${matchedSkills.slice(0, 3).map((m) => m.jdSkill).join(', ')}.`
      : 'Demonstrates solid academic/coursework foundation.',
    weakestSignal: !resume.hasMetrics
      ? 'Project bullets explain what was built, but lack measurable outcomes (% speedup, users served).'
      : 'Bullet descriptions could provide deeper technical architecture detail.',
    missingSignal: missingSkills.length > 0
      ? `No explicit evidence detected in resume for '${topMissing}'.`
      : 'Clean keyword coverage across core requirements.',
    recruiterRecommendation: missingSkills.length > 0
      ? `Move your strongest project higher and explicitly mention '${topMissing}' if you have genuine experience.`
      : 'Highlight your top quantifiable achievements at the beginning of each project bullet.',
    tenSecondScan: {
      visibleIn10Seconds,
      notImmediatelyObvious,
    },
  };
}
