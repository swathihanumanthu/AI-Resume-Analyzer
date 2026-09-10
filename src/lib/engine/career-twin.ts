import {
  StructuredJD,
  StructuredResume,
  SkillMatchResult,
  JobDna,
  JobDnaItem,
  RequirementPriority,
  CareerTwin,
  CareerTwinNode,
} from '../../types/analyzer';

export function buildJobDna(jd: StructuredJD): JobDna {
  const dnaItems: JobDnaItem[] = [];
  const categoriesMap = new Map<string, number>();

  const allSkills = Array.from(new Set([...jd.mustHaveSkills, ...jd.preferredSkills, ...jd.keywords]));

  allSkills.forEach((skill, idx) => {
    const isMust = jd.mustHaveSkills.includes(skill);
    let priority: RequirementPriority = 'USEFUL';

    if (isMust && idx < 3) priority = 'CRITICAL';
    else if (isMust) priority = 'IMPORTANT';
    else if (jd.preferredSkills.includes(skill)) priority = 'USEFUL';
    else priority = 'BONUS';

    const weightPct = priority === 'CRITICAL' ? 95 : priority === 'IMPORTANT' ? 80 : priority === 'USEFUL' ? 60 : 40;

    dnaItems.push({
      name: skill,
      category: isMust ? 'Core Requirement' : 'Preferred Skill',
      weightPct,
      priority,
      isMandatory: isMust,
    });

    const catKey = isMust ? 'Core Technical' : 'Preferred & Tools';
    categoriesMap.set(catKey, (categoriesMap.get(catKey) || 0) + 1);
  });

  const totalCatItems = Math.max(1, dnaItems.length);
  const categoryBreakdown = Array.from(categoriesMap.entries()).map(([cat, count]) => ({
    category: cat,
    pct: Math.round((count / totalCatItems) * 100),
  }));

  return {
    jobTitle: jd.jobTitle,
    company: jd.company,
    experienceRequired: jd.experience[0] || '2+ years',
    educationRequired: jd.education[0] || "Bachelor's degree",
    dnaItems,
    categoryBreakdown,
  };
}

export function buildCareerTwin(
  jd: StructuredJD,
  resume: StructuredResume,
  matchedSkills: SkillMatchResult[],
  partiallyMatchedSkills: SkillMatchResult[],
  missingSkills: SkillMatchResult[]
): CareerTwin {
  const technicalNodes: CareerTwinNode[] = [];
  const projectNodes: CareerTwinNode[] = [];
  const experienceNodes: CareerTwinNode[] = [];
  const educationNodes: CareerTwinNode[] = [];

  // 1. Technical Skills Nodes
  matchedSkills.forEach((m) => {
    technicalNodes.push({
      capability: m.jdSkill,
      category: 'Technical Skills',
      status: 'STRONG',
      evidenceSnippet: m.resumeEvidence,
    });
  });

  partiallyMatchedSkills.forEach((pm) => {
    technicalNodes.push({
      capability: pm.jdSkill,
      category: 'Technical Skills',
      status: 'PARTIAL',
      evidenceSnippet: pm.resumeEvidence,
    });
  });

  missingSkills.forEach((mis) => {
    technicalNodes.push({
      capability: mis.jdSkill,
      category: 'Technical Skills',
      status: 'NOT_DETECTED',
      evidenceSnippet: `${mis.canonicalSkill} was not detected in uploaded text.`,
    });
  });

  // 2. Project Nodes
  resume.projects.forEach((proj) => {
    const isAligned = proj.technologies.some((t) => jd.mustHaveSkills.includes(t));
    projectNodes.push({
      capability: proj.title,
      category: 'Projects',
      status: isAligned ? 'STRONG' : 'PARTIAL',
      evidenceSnippet: `Technologies: ${proj.technologies.join(', ') || 'General stack'}`,
    });
  });

  if (projectNodes.length === 0) {
    projectNodes.push({
      capability: 'Technical Projects',
      category: 'Projects',
      status: 'NOT_DETECTED',
      evidenceSnippet: 'No projects section detected in resume text.',
    });
  }

  // 3. Experience Nodes
  const hasExp = resume.experience.length > 0;
  experienceNodes.push({
    capability: hasExp ? `Experience (${resume.experience.length} roles)` : 'Work History',
    category: 'Experience',
    status: hasExp ? 'STRONG' : 'PARTIAL',
    evidenceSnippet: hasExp ? resume.experience[0].title : 'No explicit work experience section detected.',
  });

  // 4. Education Nodes
  const hasEdu = resume.education.length > 0;
  educationNodes.push({
    capability: hasEdu ? resume.education[0].degree : 'Academic Qualification',
    category: 'Education',
    status: hasEdu ? 'STRONG' : 'PARTIAL',
    evidenceSnippet: hasEdu ? resume.education[0].degree : 'Academic degree not explicitly detected.',
  });

  // Calculate Twin Alignment Pct
  const totalTech = Math.max(1, technicalNodes.length);
  const strongCount = technicalNodes.filter((n) => n.status === 'STRONG').length;
  const partialCount = technicalNodes.filter((n) => n.status === 'PARTIAL').length;

  const alignmentPct = Math.min(100, Math.max(15, Math.round(((strongCount + partialCount * 0.5) / totalTech) * 100)));

  return {
    alignmentPct,
    technicalNodes,
    projectNodes,
    experienceNodes,
    educationNodes,
    summaryMessage: `Your Career Twin is ${alignmentPct}% aligned with this role. ${
      missingSkills.length > 0 ? `The shortest path to improve alignment is learning ${missingSkills[0].jdSkill} and adding project evidence.` : 'You demonstrate high readiness across all core requirements!'
    }`,
  };
}
