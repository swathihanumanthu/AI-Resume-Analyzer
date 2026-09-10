import { StructuredJD, StructuredResume, SkillMatchResult, DrawbackItem } from '../../types/analyzer';

export function analyzeDrawbacks(
  jd: StructuredJD,
  resume: StructuredResume,
  missingSkills: SkillMatchResult[]
): DrawbackItem[] {
  const drawbacks: DrawbackItem[] = [];

  // 1. Missing Mandatory Skills (CRITICAL / HIGH)
  missingSkills.forEach((missing) => {
    if (missing.isMandatory) {
      drawbacks.push({
        severity: 'CRITICAL',
        problem: `Required Skill Not Detected: ${missing.jdSkill}`,
        whyItMatters: `The Job Description explicitly lists '${missing.jdSkill}' as a mandatory core requirement. Missing this term reduces automated ATS filter ranking.`,
        recommendedFix: `If you have experience with ${missing.jdSkill}, explicitly add it under Technical Skills and reference it in relevant project bullets. If you do not have experience, prioritize learning it.`,
        evidence: `JD Requirement: ${missing.jdSkill} | Resume Evidence: Not detected in text.`,
      });
    } else {
      drawbacks.push({
        severity: 'HIGH',
        problem: `Preferred Skill Not Detected: ${missing.jdSkill}`,
        whyItMatters: `Preferred skills set top candidates apart in competitive applicant pools.`,
        recommendedFix: `Consider incorporating ${missing.jdSkill} into your project portfolio or coursework if applicable.`,
        evidence: `JD Requirement: ${missing.jdSkill} (Preferred) | Resume Evidence: Not detected in text.`,
      });
    }
  });

  // 2. Lack of Measurable Metrics (HIGH)
  if (!resume.hasMetrics) {
    drawbacks.push({
      severity: 'HIGH',
      problem: 'Lack of Quantifiable Results & Performance Metrics',
      whyItMatters: 'Recruiters favor resumes with measurable business outcomes (e.g. "% performance improvement", "X users served", "$ revenue generated").',
      recommendedFix: 'Rewrite bullet points using the Google XYZ format: "Accomplished [X] as measured by [Y], by doing [Z]". Add specific metrics like percentage increases, latency reductions, or project scale.',
      evidence: 'No numerical percentage, user count, or performance metrics detected in project or experience bullets.',
    });
  }

  // 3. Missing GitHub / LinkedIn Links (MEDIUM)
  if (!resume.contact.github || !resume.contact.linkedin) {
    const missingLink = !resume.contact.github ? 'GitHub profile' : 'LinkedIn profile';
    drawbacks.push({
      severity: 'MEDIUM',
      problem: `Missing Professional Online Profile (${missingLink})`,
      whyItMatters: 'Technical recruiters and engineering managers check GitHub to verify source code quality and LinkedIn for professional background.',
      recommendedFix: 'Add clickable HTTPS URLs for your active GitHub and LinkedIn profiles in your resume header contact section.',
      evidence: `GitHub detected: ${resume.contact.github ? 'Yes' : 'No'} | LinkedIn detected: ${resume.contact.linkedin ? 'Yes' : 'No'}`,
    });
  }

  // 4. Generic Objective or Missing Summary (MEDIUM / LOW)
  if (!resume.summary || resume.summary.length < 30) {
    drawbacks.push({
      severity: 'MEDIUM',
      problem: 'Missing or Weak Professional Summary',
      whyItMatters: 'An impactful summary grounds your technical identity and highlights key JD alignment within the first 6 seconds of human review.',
      recommendedFix: `Draft a 3-sentence summary tailored to '${jd.jobTitle}': Highlight core technologies (${jd.mustHaveSkills.slice(0, 3).join(', ')}), total projects/experience, and career focus.`,
      evidence: 'Professional summary section is missing or fewer than 30 characters.',
    });
  }

  // 5. ATS Formatting Anomaly (HIGH / MEDIUM)
  resume.atsFormattingIssues.forEach((issue) => {
    drawbacks.push({
      severity: 'HIGH',
      problem: `ATS Formatting Anomaly: ${issue}`,
      whyItMatters: 'Non-standard headings or unreadable characters cause automated Applicant Tracking Systems to misparse or drop resume sections.',
      recommendedFix: 'Use clean standard section headers ("Technical Skills", "Experience", "Projects", "Education") without complex multi-column tables or unusual graphic symbols.',
      evidence: issue,
    });
  });

  return drawbacks;
}
