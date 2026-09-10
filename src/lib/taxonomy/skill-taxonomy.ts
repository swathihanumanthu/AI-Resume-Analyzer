// Comprehensive Technology Skill Taxonomy & Synonym Normalization Registry

export interface SkillTaxonomyEntry {
  canonical: string;
  category: 'Language' | 'Framework' | 'Database' | 'Cloud/DevOps' | 'AI/ML' | 'Tools/Concepts' | 'Soft Skills';
  synonyms: string[];
}

export const SKILL_TAXONOMY: SkillTaxonomyEntry[] = [
  // Programming Languages
  { canonical: 'JavaScript', category: 'Language', synonyms: ['js', 'ecmascript', 'vanilla js', 'modern javascript'] },
  { canonical: 'TypeScript', category: 'Language', synonyms: ['ts', 'typescript 4', 'typescript 5'] },
  { canonical: 'Python', category: 'Language', synonyms: ['python 3', 'python3', 'py'] },
  { canonical: 'Java', category: 'Language', synonyms: ['java 8', 'java 11', 'java 17', 'java 21', 'core java', 'java ee', 'jakarta ee'] },
  { canonical: 'C++', category: 'Language', synonyms: ['cpp', 'c plus plus', 'c/c++'] },
  { canonical: 'C#', category: 'Language', synonyms: ['csharp', 'c sharp', '.net c#'] },
  { canonical: 'Go', category: 'Language', synonyms: ['golang', 'go language'] },
  { canonical: 'Rust', category: 'Language', synonyms: ['rustlang'] },
  { canonical: 'SQL', category: 'Language', synonyms: ['structured query language', 'ansi sql', 'tsql', 'pl/sql'] },
  { canonical: 'HTML', category: 'Language', synonyms: ['html5', 'hypertext markup language'] },
  { canonical: 'CSS', category: 'Language', synonyms: ['css3', 'cascading style sheets'] },
  { canonical: 'PHP', category: 'Language', synonyms: ['php 8', 'php7'] },
  { canonical: 'Ruby', category: 'Language', synonyms: ['ruby on rails'] },

  // Frameworks & Web Tech
  { canonical: 'React', category: 'Framework', synonyms: ['react.js', 'reactjs', 'react js', 'react 18', 'react 19', 'react native'] },
  { canonical: 'Next.js', category: 'Framework', synonyms: ['nextjs', 'next js', 'next 14', 'next 15'] },
  { canonical: 'Node.js', category: 'Framework', synonyms: ['nodejs', 'node js', 'node'] },
  { canonical: 'Express.js', category: 'Framework', synonyms: ['express', 'expressjs', 'express js'] },
  { canonical: 'Vue.js', category: 'Framework', synonyms: ['vue', 'vuejs', 'vue js', 'vue 3', 'nuxt', 'nuxtjs'] },
  { canonical: 'Angular', category: 'Framework', synonyms: ['angularjs', 'angular 2+', 'angular 14'] },
  { canonical: 'FastAPI', category: 'Framework', synonyms: ['fast api', 'fastapi python'] },
  { canonical: 'Django', category: 'Framework', synonyms: ['django framework', 'django rest framework', 'drf'] },
  { canonical: 'Flask', category: 'Framework', synonyms: ['flask python'] },
  { canonical: 'Spring Boot', category: 'Framework', synonyms: ['spring', 'spring framework', 'spring mvc', 'spring data'] },
  { canonical: 'Tailwind CSS', category: 'Framework', synonyms: ['tailwind', 'tailwindcss'] },

  // Databases
  { canonical: 'PostgreSQL', category: 'Database', synonyms: ['postgres', 'postgresql db', 'pg', 'psql', 'postgres db'] },
  { canonical: 'MongoDB', category: 'Database', synonyms: ['mongo', 'mongodb atlas', 'mongoose'] },
  { canonical: 'MySQL', category: 'Database', synonyms: ['my sql', 'mysqldb'] },
  { canonical: 'Redis', category: 'Database', synonyms: ['redis cache', 'redis db', 'ioredis'] },
  { canonical: 'SQLite', category: 'Database', synonyms: ['sqlite3'] },
  { canonical: 'DynamoDB', category: 'Database', synonyms: ['amazon dynamodb', 'aws dynamodb'] },
  { canonical: 'Firebase', category: 'Database', synonyms: ['firestore', 'firebase realtime database'] },
  { canonical: 'Elasticsearch', category: 'Database', synonyms: ['elastic search', 'elk stack'] },

  // Cloud & DevOps
  { canonical: 'AWS', category: 'Cloud/DevOps', synonyms: ['amazon web services', 'aws cloud', 'amazon cloud', 'ec2', 's3', 'lambda'] },
  { canonical: 'Docker', category: 'Cloud/DevOps', synonyms: ['docker engine', 'docker containers', 'containerization', 'docker compose'] },
  { canonical: 'Kubernetes', category: 'Cloud/DevOps', synonyms: ['k8s', 'k8s cluster', 'kubectl'] },
  { canonical: 'CI/CD', category: 'Cloud/DevOps', synonyms: ['continuous integration', 'continuous deployment', 'github actions', 'jenkins', 'gitlab ci'] },
  { canonical: 'Terraform', category: 'Cloud/DevOps', synonyms: ['hashicorp terraform', 'infrastructure as code', 'iac'] },
  { canonical: 'Azure', category: 'Cloud/DevOps', synonyms: ['microsoft azure', 'azure cloud'] },
  { canonical: 'GCP', category: 'Cloud/DevOps', synonyms: ['google cloud', 'google cloud platform'] },
  { canonical: 'Linux', category: 'Cloud/DevOps', synonyms: ['ubuntu', 'debian', 'centos', 'bash', 'shell scripting', 'unix'] },

  // AI / ML / GenAI
  { canonical: 'Machine Learning', category: 'AI/ML', synonyms: ['ml', 'machine learning algorithms', 'scikit-learn', 'sklearn'] },
  { canonical: 'Deep Learning', category: 'AI/ML', synonyms: ['neural networks', 'dl'] },
  { canonical: 'PyTorch', category: 'AI/ML', synonyms: ['torch', 'pytorch 2'] },
  { canonical: 'TensorFlow', category: 'AI/ML', synonyms: ['tf', 'keras'] },
  { canonical: 'Generative AI', category: 'AI/ML', synonyms: ['genai', 'gen ai', 'llm', 'large language models', 'openai', 'gpt', 'rag', 'langchain'] },
  { canonical: 'NLP', category: 'AI/ML', synonyms: ['natural language processing', 'spacy', 'nltk', 'huggingface', 'transformers'] },

  // Tools & Architecture Concepts
  { canonical: 'REST API', category: 'Tools/Concepts', synonyms: ['restful api', 'rest apis', 'http rest api', 'restful apis', 'restful web services', 'http apis'] },
  { canonical: 'GraphQL', category: 'Tools/Concepts', synonyms: ['graphql api', 'apollo graphql'] },
  { canonical: 'System Design', category: 'Tools/Concepts', synonyms: ['software architecture', 'distributed systems', 'scalability', 'high availability'] },
  { canonical: 'Microservices', category: 'Tools/Concepts', synonyms: ['microservice architecture', 'event-driven architecture', 'kafka', 'rabbitmq'] },
  { canonical: 'Git', category: 'Tools/Concepts', synonyms: ['github', 'version control', 'git flow', 'gitlab'] },
  { canonical: 'Unit Testing', category: 'Tools/Concepts', synonyms: ['jest', 'vitest', 'mocha', 'junit', 'pytest', 'testing', 'tdd'] },
  { canonical: 'Agile', category: 'Tools/Concepts', synonyms: ['scrum', 'kanban', 'jira', 'sprint planning'] },
];

// Helper mapping maps lowercase synonym string to Canonical string
const SYNONYM_MAP = new Map<string, string>();

SKILL_TAXONOMY.forEach((entry) => {
  SYNONYM_MAP.set(entry.canonical.toLowerCase(), entry.canonical);
  entry.synonyms.forEach((syn) => {
    SYNONYM_MAP.set(syn.toLowerCase(), entry.canonical);
  });
});

/**
 * Normalizes a raw skill string to its canonical taxonomy form if found,
 * otherwise returns trimmed title-case version of raw skill.
 */
export function normalizeSkill(rawSkill: string): { canonical: string; category?: string; isTaxonomyMatch: boolean } {
  if (!rawSkill) return { canonical: '', isTaxonomyMatch: false };
  const cleaned = rawSkill.trim().toLowerCase();

  // Exact canonical or synonym lookup
  if (SYNONYM_MAP.has(cleaned)) {
    const canonical = SYNONYM_MAP.get(cleaned)!;
    const entry = SKILL_TAXONOMY.find((e) => e.canonical === canonical);
    return { canonical, category: entry?.category, isTaxonomyMatch: true };
  }

  // Partial phrase matching (e.g. "React.js library" -> "React")
  for (const entry of SKILL_TAXONOMY) {
    const allForms = [entry.canonical, ...entry.synonyms];
    for (const form of allForms) {
      const regex = new RegExp(`\\b${escapeRegExp(form)}\\b`, 'i');
      if (regex.test(rawSkill)) {
        return { canonical: entry.canonical, category: entry.category, isTaxonomyMatch: true };
      }
    }
  }

  // Fallback: title-cased clean string
  const fallback = rawSkill.trim();
  return { canonical: fallback, isTaxonomyMatch: false };
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
