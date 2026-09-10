import {
  StructuredJD,
  StructuredResume,
  SkillMatchResult,
  RecommendedSkillItem,
  CourseRecommendation,
  ProjectRecommendation,
  ImprovementRoadmap,
} from '../../types/analyzer';

export function generateSkillRoadmap(
  jd: StructuredJD,
  missingSkills: SkillMatchResult[]
): RecommendedSkillItem[] {
  return missingSkills.map((missing, index) => {
    const isPriority1 = missing.isMandatory || index < 2;
    const isPriority2 = !isPriority1 && index < 5;

    const priority = isPriority1
      ? 'Priority 1 — Must Learn'
      : isPriority2
      ? 'Priority 2 — Valuable'
      : 'Priority 3 — Nice to Have';

    return {
      skill: missing.jdSkill,
      priority,
      isMandatory: missing.isMandatory,
      whyRelevant: `Required/Preferred by JD for '${jd.jobTitle}'. Learning ${missing.jdSkill} directly addresses your largest qualification gap.`,
      difficulty: isPriority1 ? 'Intermediate' : 'Beginner',
      estimatedLearningTime: isPriority1 ? '1–2 weeks' : '3–5 days',
      whatToLearnFirst: `Master ${missing.jdSkill} core syntax, configuration, and practical API integration patterns.`,
      howToDemonstrateOnGithub: `Build a standalone sample repository or add a feature branch demonstrating ${missing.jdSkill} in a production-ready application.`,
    };
  });
}

export function generateCourseRecommendations(
  missingSkills: SkillMatchResult[]
): CourseRecommendation[] {
  const resourceCatalog: Record<string, CourseRecommendation> = {
    Docker: {
      courseTitle: 'Docker Curriculum & Hands-on Containerization',
      provider: 'Docker Official Documentation',
      skillCovered: 'Docker',
      difficulty: 'Beginner',
      estimatedDuration: '4 hours',
      availabilityTag: 'Official Documentation',
      whyRecommended: 'Industry standard official guide for learning Docker container builds and docker-compose.',
      url: 'https://docs.docker.com/get-started/',
    },
    AWS: {
      courseTitle: 'AWS Cloud Practitioner Essentials',
      provider: 'AWS Skill Builder',
      skillCovered: 'AWS',
      difficulty: 'Beginner',
      estimatedDuration: '6 hours',
      availabilityTag: 'Free Tier',
      whyRecommended: 'Official free AWS training covering core cloud compute (EC2), storage (S3), and deployment.',
      url: 'https://explore.skillbuilder.aws/',
    },
    PostgreSQL: {
      courseTitle: 'PostgreSQL Tutorial & Relational Database Design',
      provider: 'PostgreSQL Documentation & PostgresTutorial',
      skillCovered: 'PostgreSQL',
      difficulty: 'Intermediate',
      estimatedDuration: '5 hours',
      availabilityTag: 'Official Documentation',
      whyRecommended: 'Comprehensive free documentation covering SQL indexing, relational queries, and schema design.',
      url: 'https://www.postgresqltutorial.com/',
    },
    React: {
      courseTitle: 'React Official Interactive Tutorial',
      provider: 'React.dev',
      skillCovered: 'React',
      difficulty: 'Beginner',
      estimatedDuration: '5 hours',
      availabilityTag: 'Official Documentation',
      whyRecommended: 'Modern React 18+ documentation with interactive code sandboxes covering hooks and state management.',
      url: 'https://react.dev/learn',
    },
    'REST API': {
      courseTitle: 'MDN HTTP & RESTful API Guidelines',
      provider: 'Mozilla Developer Network (MDN)',
      skillCovered: 'REST API',
      difficulty: 'Beginner',
      estimatedDuration: '3 hours',
      availabilityTag: 'Official Documentation',
      whyRecommended: 'Authoritative guide to HTTP methods, status codes, headers, and RESTful web service architecture.',
      url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP',
    },
    'CI/CD': {
      courseTitle: 'GitHub Actions Documentation & Workflow Automation',
      provider: 'GitHub Docs',
      skillCovered: 'CI/CD',
      difficulty: 'Intermediate',
      estimatedDuration: '3 hours',
      availabilityTag: 'Official Documentation',
      whyRecommended: 'Learn automated build, test, and deployment pipelines directly inside GitHub repositories.',
      url: 'https://docs.github.com/en/actions',
    },
    'Generative AI': {
      courseTitle: 'Google Cloud Generative AI Fundamentals',
      provider: 'Google Cloud Skills Boost',
      skillCovered: 'Generative AI',
      difficulty: 'Intermediate',
      estimatedDuration: '8 hours',
      availabilityTag: 'Free-to-Audit',
      whyRecommended: 'Official course covering LLMs, prompt engineering, and RAG architecture principles.',
      url: 'https://www.cloudskillsboost.google/course_templates/536',
    },
  };

  const recommendations: CourseRecommendation[] = [];

  missingSkills.forEach((missing) => {
    const entry = resourceCatalog[missing.canonicalSkill];
    if (entry) {
      recommendations.push(entry);
    } else {
      recommendations.push({
        courseTitle: `${missing.jdSkill} Free Developer Guide`,
        provider: 'FreeCodeCamp / Official Docs',
        skillCovered: missing.jdSkill,
        difficulty: 'Beginner',
        estimatedDuration: '4–6 hours',
        availabilityTag: 'Free Tutorial',
        whyRecommended: `Recommended resource to quickly build foundational competency in ${missing.jdSkill}.`,
        url: `https://www.google.com/search?q=${encodeURIComponent(missing.jdSkill + ' official documentation tutorial free')}`,
      });
    }
  });

  return recommendations;
}

export function generateProjectRecommendations(
  jd: StructuredJD,
  missingSkills: SkillMatchResult[]
): ProjectRecommendation[] {
  const missingNames = missingSkills.map((m) => m.canonicalSkill);
  const techStack = Array.from(new Set([...jd.mustHaveSkills.slice(0, 3), ...missingNames.slice(0, 2)]));

  const projects: ProjectRecommendation[] = [];

  // Project 1: Core Full-Stack Application
  projects.push({
    title: `AI-Powered ${jd.jobTitle.replace(/Engineer|Developer/i, '').trim()} Analytics Dashboard`,
    problemStatement: `Build an enterprise dashboard addressing core ${jd.company || 'target employer'} domain requirements.`,
    technologies: techStack.length > 0 ? techStack : ['React', 'Node.js', 'PostgreSQL', 'REST API'],
    features: [
      'User Authentication & Role-Based Access Control',
      'RESTful API Endpoints with Structured JSON Responses',
      'Database Schema Migration & Optimized Indexing',
      'Docker Containerization & GitHub Actions CI/CD Pipeline',
    ],
    expectedDifficulty: 'Intermediate',
    estimatedDevTime: '10–14 days',
    demonstratedJdRequirements: techStack,
    githubEvidence: [
      'Comprehensive README with architectural diagram & setup instructions',
      'Docker Compose file and passing GitHub Actions workflow badge',
    ],
  });

  // Project 2: High-Performance Backend Service
  if (missingNames.includes('Docker') || missingNames.includes('CI/CD') || missingNames.includes('AWS')) {
    projects.push({
      title: 'Cloud-Native Containerized Microservice & Pipeline',
      problemStatement: 'Demonstrate production cloud deployment, container orchestration, and automated CI/CD testing.',
      technologies: ['Docker', 'CI/CD', 'Node.js', 'REST API'],
      features: [
        'Multi-stage Dockerfile optimization for lightweight image size',
        'GitHub Actions pipeline executing automated Vitest unit tests',
        'Automated health check monitoring endpoint',
      ],
      expectedDifficulty: 'Intermediate',
      estimatedDevTime: '5–7 days',
      demonstratedJdRequirements: ['Docker', 'CI/CD', 'REST API'],
      githubEvidence: [
        'Live deployment URL link in GitHub repository description',
        'Clean commits demonstrating test-driven development (TDD)',
      ],
    });
  }

  return projects;
}

export function generateImprovementRoadmap(
  resume: StructuredResume,
  missingSkills: SkillMatchResult[]
): ImprovementRoadmap {
  const missingStr = missingSkills.slice(0, 2).map((m) => m.jdSkill).join(' & ');

  return {
    immediateFixes: [
      'Add clickable HTTPS links for your GitHub and LinkedIn profiles in your resume header.',
      'Rewrite top project bullets using numerical impact metrics (% speedup, user count, data size).',
      'Ensure standard section headings ("Technical Skills", "Experience", "Projects", "Education").',
    ],
    sevenDayPlan: [
      missingStr ? `Complete introductory hands-on tutorial for ${missingStr}.` : 'Review core algorithms and system design concepts.',
      'Refactor existing project descriptions on GitHub to include comprehensive README files.',
      'Tailor your professional summary to explicitly match the target Job Description title.',
    ],
    thirtyDayPlan: [
      'Build and deploy a full-stack portfolio project incorporating missing JD technologies.',
      'Obtain an entry-level technical certification (e.g. AWS Cloud Practitioner or Docker Certified).',
      'Practice technical interview coding and system design scenario questions.',
    ],
  };
}
