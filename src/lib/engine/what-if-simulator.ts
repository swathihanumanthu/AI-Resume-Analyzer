import { SkillMatchResult, WhatIfProjection } from '../../types/analyzer';

export function calculateWhatIfProjection(
  currentReadinessScore: number,
  missingSkills: SkillMatchResult[]
): WhatIfProjection {
  const availableGaps = missingSkills.map((m) => {
    // Points boost if skill gap is closed and evidence added
    const pointsValue = m.isMandatory ? 4 : 2;
    return {
      skill: m.jdSkill,
      pointsValue,
    };
  });

  return {
    currentReadinessScore,
    availableGaps,
    disclaimer:
      'Projected score assumes you gain genuine hands-on experience and add verifiable evidence to your resume. This is a projected simulation, not a guaranteed interview outcome.',
  };
}
