import {
  StructuredJD,
  StructuredResume,
  SectionAnalysisResult,
  ProjectAnalysisResult,
} from '../../types/analyzer';

export function analyzeSections(
  jd: StructuredJD,
  resume: StructuredResume
): SectionAnalysisResult[] {
  const results: SectionAnalysisResult[] = [];

  // 1. Contact Information Section
  const hasEmail = !!resume.contact.email;
  const hasPhone = !!resume.contact.phone;
  const hasGithub = !!resume.contact.github;
  const hasLinkedin = !!resume.contact.linkedin;
  const contactScore = Math.min(
    100,
    (hasEmail ? 40 : 0) + (hasPhone ? 20 : 0) + (hasGithub ? 20 : 0) + (hasLinkedin ? 20 : 0)
  );

  results.push({
    sectionName: 'Contact Information',
    score: contactScore,
    detected: true,
    problems: [
      !hasEmail ? 'Missing professional email address.' : '',
      !hasGithub ? 'Missing GitHub profile link.' : '',
      !hasLinkedin ? 'Missing LinkedIn profile link.' : '',
    ].filter(Boolean),
    missingInformation: [
      !hasGithub ? 'GitHub portfolio link' : '',
      !hasLinkedin ? 'LinkedIn profile URL' : '',
    ].filter(Boolean),
    recommendations: [
      'Include a professional email (e.g. firstname.lastname@gmail.com).',
      'Add clickable HTTPS profile links for GitHub and LinkedIn in header.',
    ],
  });

  // 2. Professional Summary Section
  const hasSummary = !!resume.summary && resume.summary.length > 20;
  const summaryScore = hasSummary ? 85 : 30;
  results.push({
    sectionName: 'Professional Summary',
    score: summaryScore,
    detected: hasSummary,
    problems: !hasSummary ? ['Missing professional summary section.'] : ['Summary could be tighter and more JD-aligned.'],
    missingInformation: !hasSummary ? ['3-sentence career summary'] : [],
    recommendations: [
      `Write a 3-sentence summary highlighting target title '${jd.jobTitle}' and top skills (${jd.mustHaveSkills.slice(0, 3).join(', ')}).`,
    ],
  });

  // 3. Technical Skills Section
  const skillsDetected = resume.skills.length > 0;
  const skillCountScore = Math.min(100, Math.round((resume.skills.length / 10) * 100));
  results.push({
    sectionName: 'Technical Skills',
    score: skillsDetected ? skillCountScore : 20,
    detected: skillsDetected,
    problems: !skillsDetected ? ['No explicit Technical Skills section detected.'] : [],
    missingInformation: jd.mustHaveSkills.filter((s) => !resume.skills.includes(s)).map((s) => `${s} (Not detected)`),
    recommendations: [
      'Organize technical skills into clear categories: Languages, Frameworks, Databases, Cloud & Tools.',
    ],
  });

  // 4. Experience & Projects Section
  const hasExp = resume.experience.length > 0;
  const hasProj = resume.projects.length > 0;
  results.push({
    sectionName: 'Experience & Projects',
    score: hasExp && hasProj ? 90 : hasExp || hasProj ? 75 : 35,
    detected: hasExp || hasProj,
    problems: [
      !hasExp ? 'No formal work experience / internship section detected.' : '',
      !hasProj ? 'No technical projects section detected.' : '',
      !resume.hasMetrics ? 'Bullets lack numerical impact metrics (% growth, speedup, user count).' : '',
    ].filter(Boolean),
    missingInformation: !resume.hasMetrics ? ['Quantifiable metrics and business outcomes'] : [],
    recommendations: [
      'Start every bullet point with a strong action verb (Developed, Engineered, Optimized, Architected).',
      'Quantify results using numbers: "Improved page load speed by 35% through API caching."',
    ],
  });

  // 5. Education Section
  const hasEdu = resume.education.length > 0;
  results.push({
    sectionName: 'Education',
    score: hasEdu ? 95 : 40,
    detected: hasEdu,
    problems: !hasEdu ? ['Academic degree or institution not clearly detected.'] : [],
    missingInformation: !hasEdu ? ['Degree title, university name, and graduation year'] : [],
    recommendations: ['List Degree, Major/Specialization, University Name, and Graduation Year.'],
  });

  return results;
}

export function analyzeProjects(
  jd: StructuredJD,
  resume: StructuredResume
): ProjectAnalysisResult[] {
  if (!resume.projects || resume.projects.length === 0) {
    return [
      {
        title: 'Project Evidence Missing',
        relevanceScore: 30,
        technologies: [],
        relevanceToJd: 'No explicit projects section was detected in the resume text.',
        technicalComplexity: 'Low',
        backendInvolvement: false,
        frontendInvolvement: false,
        databaseInvolvement: false,
        apiInvolvement: false,
        aiMlInvolvement: false,
        deploymentMentioned: false,
        hasMetrics: false,
        rewriteBulletSuggestions: [
          `Build and document a full-stack project demonstrating ${jd.mustHaveSkills.slice(0, 3).join(', ')}.`,
        ],
      },
    ];
  }

  return resume.projects.map((proj) => {
    const pText = (proj.title + ' ' + proj.description + ' ' + proj.bullets.join(' ')).toLowerCase();

    // Check tech involvement flags
    const backendInvolvement = /backend|express|node|fastapi|django|spring|server|microservice/i.test(pText);
    const frontendInvolvement = /frontend|react|next|vue|angular|ui|interface|responsive/i.test(pText);
    const databaseInvolvement = /database|postgres|mongo|sql|redis|db|typeorm|prisma/i.test(pText);
    const apiInvolvement = /api|rest|graphql|endpoint|json|http/i.test(pText);
    const aiMlInvolvement = /ai|ml|machine learning|llm|openai|rag|model|pytorch|tensorflow/i.test(pText);
    const deploymentMentioned = /deploy|docker|aws|vercel|cloud|render|heroku|k8s|ci\/cd/i.test(pText);
    const hasMetrics = /\b(?:\d+%|\$\d+|\d+x|\b\d+\s+users\b|\b\d+\s+ms\b)/i.test(pText);

    // Calculate relevance to JD
    const matchedJdTechs = proj.technologies.filter((t) => jd.mustHaveSkills.includes(t) || jd.keywords.includes(t));
    const techRatio = matchedJdTechs.length / Math.max(1, jd.mustHaveSkills.length);

    let relevanceScore = Math.min(100, Math.round(50 + techRatio * 35 + (hasMetrics ? 15 : 0)));
    if (matchedJdTechs.length === 0) relevanceScore = Math.max(40, relevanceScore - 20);

    const rewriteBulletSuggestions: string[] = [];
    if (proj.bullets.length > 0) {
      const firstBullet = proj.bullets[0];
      if (!hasMetrics) {
        rewriteBulletSuggestions.push(
          `Enhanced Bullet: "${firstBullet} — achieving a 35% reduction in API response time and supporting 500+ concurrent requests."`
        );
      }
      if (jd.mustHaveSkills.length > 0 && !proj.technologies.includes(jd.mustHaveSkills[0])) {
        rewriteBulletSuggestions.push(
          `Tech Alignment Suggestion: Highlight how '${jd.mustHaveSkills[0]}' or equivalent principles were utilized in this project.`
        );
      }
    } else {
      rewriteBulletSuggestions.push(
        `Suggested Bullet: "Architected ${proj.title} using ${proj.technologies.join(', ') || 'modern frameworks'}, handling backend API routes and deployment."`
      );
    }

    return {
      title: proj.title || 'Technical Project',
      relevanceScore,
      technologies: proj.technologies,
      relevanceToJd:
        matchedJdTechs.length > 0
          ? `Directly demonstrates JD technologies: ${matchedJdTechs.join(', ')}`
          : `General technical project. Consider aligning bullet points explicitly with JD requirements.`,
      technicalComplexity: proj.technologies.length > 3 || (backendInvolvement && frontendInvolvement) ? 'High' : 'Moderate',
      backendInvolvement,
      frontendInvolvement,
      databaseInvolvement,
      apiInvolvement,
      aiMlInvolvement,
      deploymentMentioned,
      hasMetrics,
      rewriteBulletSuggestions,
    };
  });
}
