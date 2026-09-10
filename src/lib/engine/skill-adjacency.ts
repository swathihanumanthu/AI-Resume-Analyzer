import { SkillAdjacencyItem } from '../../types/analyzer';

// Maintained foundation graph linking existing technologies to target skills
const ADJACENCY_MAP: Record<string, Array<{ target: string; note: string }>> = {
  JavaScript: [
    { target: 'TypeScript', note: 'Provides strong static typing and syntax foundation for TypeScript.' },
    { target: 'React', note: 'Core DOM manipulation and ES6 syntax prepare you for React components.' },
    { target: 'Node.js', note: 'JavaScript event loop and runtime knowledge directly translate to backend Node.js.' },
  ],
  'Node.js': [
    { target: 'Express.js', note: 'Backend event loop and HTTP module experience map directly to Express.' },
    { target: 'REST API', note: 'HTTP web service knowledge forms the foundation for building RESTful endpoints.' },
    { target: 'Docker', note: 'Backend microservice experience provides a practical foundation for containerization.' },
  ],
  Python: [
    { target: 'FastAPI', note: 'Python type hints and async knowledge directly apply to FastAPI.' },
    { target: 'Django', note: 'Core Python object-oriented programming maps directly to Django MVC.' },
    { target: 'Machine Learning', note: 'Python data structures and syntax provide a direct foundation for ML models.' },
  ],
  SQL: [
    { target: 'PostgreSQL', note: 'Relational query knowledge, joins, and indexing apply directly to PostgreSQL.' },
    { target: 'MySQL', note: 'ANSI SQL query syntax translates directly to MySQL schemas.' },
  ],
  React: [
    { target: 'Next.js', note: 'React component architecture and state management form the foundation for Next.js.' },
  ],
};

export function findSkillAdjacencies(
  existingSkills: string[],
  missingSkills: string[]
): SkillAdjacencyItem[] {
  const adjacencies: SkillAdjacencyItem[] = [];

  existingSkills.forEach((existing) => {
    const targets = ADJACENCY_MAP[existing];
    if (targets) {
      targets.forEach(({ target, note }) => {
        if (missingSkills.includes(target) && !adjacencies.some((a) => a.targetMissingSkill === target)) {
          adjacencies.push({
            existingSkill: existing,
            targetMissingSkill: target,
            relationshipNote: `Your experience with ${existing} ${note}`,
          });
        }
      });
    }
  });

  return adjacencies;
}
