import {
  StructuredJD,
  StructuredResume,
  SkillMatchResult,
  InterviewQuestionItem,
} from '../../types/analyzer';

export function generateInterviewQuestions(
  jd: StructuredJD,
  resume: StructuredResume,
  missingSkills: SkillMatchResult[]
): {
  allQuestions: InterviewQuestionItem[];
  mostLikelyQuestions: InterviewQuestionItem[];
} {
  const questions: InterviewQuestionItem[] = [];

  // 1. Technical Questions (based on JD required skills)
  jd.mustHaveSkills.forEach((skill, idx) => {
    questions.push({
      id: `q_tech_${idx}`,
      category: 'Technical',
      question: `How do you handle performance optimization, concurrency, or scaling when working with ${skill}?`,
      whyAsked: `JD explicitly lists ${skill} as a core technical requirement.`,
      suggestedFocus: `Discuss real-world experience, memory management, or architectural best practices using ${skill}.`,
      isHighLikelihood: true,
    });
  });

  // 2. Project Questions (based on candidate's projects)
  resume.projects.forEach((proj, idx) => {
    questions.push({
      id: `q_proj_${idx}`,
      category: 'Project',
      question: `In your project '${proj.title}', what was the hardest technical challenge you encountered, and how did you resolve it?`,
      whyAsked: `Verifies hands-on problem solving and technical ownership in listed project work.`,
      suggestedFocus: `Use the STAR method (Situation, Task, Action, Result) and highlight technical decisions made with ${proj.technologies.join(', ') || 'your tech stack'}.`,
      isHighLikelihood: true,
    });
  });

  // 3. Gap Questions (based on missing skills)
  missingSkills.slice(0, 2).forEach((missing, idx) => {
    questions.push({
      id: `q_gap_${idx}`,
      category: 'Scenario',
      question: `The job description requires experience with ${missing.jdSkill}, which was not explicitly listed in your resume bullets. Have you worked with ${missing.jdSkill} in coursework or self-directed projects?`,
      whyAsked: `Addresses key qualification gap identified between JD and resume.`,
      suggestedFocus: `Be honest, highlight fast-learning capability, and reference transferable concepts from related technologies you master.`,
      isHighLikelihood: true,
    });
  });

  // 4. Behavioral Questions
  questions.push({
    id: 'q_beh_1',
    category: 'Behavioral',
    question: 'Describe a situation where a requirement changed late in a development sprint. How did you adapt your architecture and task priorities?',
    whyAsked: 'Evaluates adaptability, communication, and agile mindset under shifting deadline pressures.',
    suggestedFocus: 'Focus on clear team communication, trade-off analysis, and pragmatic technical execution.',
  });

  // 5. HR / Fit Questions
  questions.push({
    id: 'q_hr_1',
    category: 'HR',
    question: `Why are you interested in joining ${jd.company || 'our team'} as a ${jd.jobTitle}?`,
    whyAsked: 'Assesses genuine interest in the company domain and role responsibilities.',
    suggestedFocus: `Connect your technical background in ${jd.mustHaveSkills.slice(0, 2).join(', ')} with the company's product mission.`,
  });

  // 6. Coding / Algorithmic Questions
  questions.push({
    id: 'q_code_1',
    category: 'Coding',
    question: 'How would you design a rate-limiter middleware or API caching layer to handle high traffic spikes?',
    whyAsked: 'Tests algorithmic complexity, data structures (Token Bucket / Sliding Window), and API middleware mechanics.',
    suggestedFocus: 'Explain Redis sliding window counter or token bucket algorithm with time & space complexity.',
  });

  // 7. Scenario-Based Questions
  questions.push({
    id: 'q_scen_1',
    category: 'Scenario',
    question: 'If a production database query experiences severe latency spikes during peak hours, how would you diagnose and fix the bottleneck?',
    whyAsked: 'Evaluates real-world debugging, SQL query execution plans (EXPLAIN ANALYZE), indexing, and connection pooling.',
    suggestedFocus: 'Walk through log inspection, EXPLAIN ANALYZE, index creation, and caching layer implementation.',
  });

  const mostLikelyQuestions = questions.filter((q) => q.isHighLikelihood).slice(0, 5);

  return {
    allQuestions: questions,
    mostLikelyQuestions: mostLikelyQuestions.length > 0 ? mostLikelyQuestions : questions.slice(0, 5),
  };
}
