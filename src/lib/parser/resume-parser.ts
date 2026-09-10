import { StructuredResume, DetectedSection } from '../../types/analyzer';
import { cleanText } from './text-cleaner';
import { SKILL_TAXONOMY } from '../taxonomy/skill-taxonomy';

export function parseResume(rawText: string, filename: string = 'Resume.pdf'): StructuredResume {
  const text = cleanText(rawText);
  const lowerText = text.toLowerCase();
  const lines = text.split('\n');

  // 1. Candidate Name (usually top line)
  let candidateName = filename.replace(/\.(pdf|docx|txt)$/i, '').replace(/[-_]/g, ' ');
  if (lines.length > 0 && lines[0].length < 40 && !/@|github|linkedin|http/i.test(lines[0])) {
    candidateName = lines[0].replace(/[^a-zA-Z\s.]/g, '').trim() || candidateName;
  }

  // 2. Contact details extraction
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const githubMatch = text.match(/(?:github\.com\/|github:\s*)([a-zA-Z0-9_-]+)/i);
  const linkedinMatch = text.match(/(?:linkedin\.com\/in\/|linkedin:\s*)([a-zA-Z0-9_-]+)/i);

  const contact = {
    email: emailMatch ? emailMatch[0] : undefined,
    phone: phoneMatch ? phoneMatch[0] : undefined,
    github: githubMatch ? `https://github.com/${githubMatch[1]}` : undefined,
    linkedin: linkedinMatch ? `https://linkedin.com/in/${linkedinMatch[1]}` : undefined,
    location: undefined,
  };

  // 3. Detect Sections
  const detectedSections: DetectedSection[] = [
    { section: 'contact', detected: !!(contact.email || contact.phone), content: text.slice(0, 300), confidence: contact.email ? 0.95 : 0.6 },
    { section: 'summary', detected: /summary|objective|profile|about me/i.test(text), content: '', confidence: 0 },
    { section: 'education', detected: /education|academic|degree|university|college|btech|be|bs|ms/i.test(text), content: '', confidence: 0 },
    { section: 'skills', detected: /skills|technical skills|technologies|proficiencies|competencies/i.test(text), content: '', confidence: 0 },
    { section: 'experience', detected: /experience|work history|employment|career/i.test(text), content: '', confidence: 0 },
    { section: 'internships', detected: /internship|internships|trainee/i.test(text), content: '', confidence: 0 },
    { section: 'projects', detected: /projects|academic projects|personal projects/i.test(text), content: '', confidence: 0 },
    { section: 'certifications', detected: /certifications|licenses|courses/i.test(text), content: '', confidence: 0 },
    { section: 'achievements', detected: /achievements|awards|honors|accomplishments/i.test(text), content: '', confidence: 0 },
    { section: 'links', detected: !!(contact.github || contact.linkedin), content: `${contact.github || ''} ${contact.linkedin || ''}`, confidence: 0.9 },
  ];

  // Section content parsing
  let currentSectionName: DetectedSection['section'] | null = null;
  const sectionContentMap: Record<string, string[]> = {};

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.length === 0) return;

    if (/^(professional\s+)?summary|profile|about me|objective$/i.test(trimmed)) {
      currentSectionName = 'summary';
      sectionContentMap['summary'] = sectionContentMap['summary'] || [];
      return;
    }
    if (/^(technical\s+)?skills|technologies|proficiencies$/i.test(trimmed)) {
      currentSectionName = 'skills';
      sectionContentMap['skills'] = sectionContentMap['skills'] || [];
      return;
    }
    if (/^(work\s+)?experience|employment history|work history$/i.test(trimmed)) {
      currentSectionName = 'experience';
      sectionContentMap['experience'] = sectionContentMap['experience'] || [];
      return;
    }
    if (/^projects|academic projects|key projects$/i.test(trimmed)) {
      currentSectionName = 'projects';
      sectionContentMap['projects'] = sectionContentMap['projects'] || [];
      return;
    }
    if (/^education|academic background$/i.test(trimmed)) {
      currentSectionName = 'education';
      sectionContentMap['education'] = sectionContentMap['education'] || [];
      return;
    }
    if (/^certifications|licenses$/i.test(trimmed)) {
      currentSectionName = 'certifications';
      sectionContentMap['certifications'] = sectionContentMap['certifications'] || [];
      return;
    }

    if (currentSectionName) {
      sectionContentMap[currentSectionName] = sectionContentMap[currentSectionName] || [];
      sectionContentMap[currentSectionName].push(trimmed);
    }
  });

  detectedSections.forEach((sec) => {
    if (sectionContentMap[sec.section]) {
      sec.content = sectionContentMap[sec.section].join('\n');
      sec.confidence = 0.9;
    }
  });

  const summary = sectionContentMap['summary'] ? sectionContentMap['summary'].join(' ') : '';

  // 4. Skills Extraction matching taxonomy
  const skillsSet = new Set<string>();
  SKILL_TAXONOMY.forEach((entry) => {
    const forms = [entry.canonical, ...entry.synonyms];
    for (const form of forms) {
      const escaped = form.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?:\\b|[^a-zA-Z0-9])${escaped}(?:\\b|[^a-zA-Z0-9])`, 'i');
      if (regex.test(lowerText)) {
        skillsSet.add(entry.canonical);
        break;
      }
    }
  });

  // 5. Experience Extraction
  const experience: StructuredResume['experience'] = [];
  const expLines = sectionContentMap['experience'] || [];
  let currentExp: StructuredResume['experience'][0] | null = null;

  expLines.forEach((line) => {
    const isHeader = /(?:developer|engineer|intern|lead|consultant|analyst|architect|manager)\s+at\s+([A-Za-z0-9\s]+)|^(Senior|Junior|Full Stack|Software|Backend|Frontend)\s+[A-Za-z\s]+$/i.test(line);
    if (isHeader || !currentExp) {
      if (currentExp) experience.push(currentExp);
      currentExp = {
        title: line,
        company: 'Company',
        duration: 'Duration',
        description: line,
        bullets: [],
      };
    } else {
      if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
        currentExp.bullets.push(line.replace(/^[•\-\*\s]+/, ''));
      } else {
        currentExp.bullets.push(line);
      }
    }
  });
  if (currentExp) experience.push(currentExp);

  // 6. Projects Extraction
  const projects: StructuredResume['projects'] = [];
  const projLines = sectionContentMap['projects'] || [];
  let currentProj: StructuredResume['projects'][0] | null = null;

  projLines.forEach((line) => {
    const isProjHeader = line.length < 50 && !line.startsWith('•') && !line.startsWith('-');
    if (isProjHeader && projLines.indexOf(line) % 4 === 0) {
      if (currentProj) projects.push(currentProj);
      currentProj = {
        title: line,
        description: line,
        technologies: [],
        bullets: [],
      };
    } else if (currentProj) {
      if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
        currentProj.bullets.push(line.replace(/^[•\-\*\s]+/, ''));
      } else {
        currentProj.description += ' ' + line;
      }
    }
  });
  if (currentProj) projects.push(currentProj);

  // Extract technologies inside projects
  projects.forEach((proj) => {
    const pText = (proj.title + ' ' + proj.description + ' ' + proj.bullets.join(' ')).toLowerCase();
    SKILL_TAXONOMY.forEach((entry) => {
      const forms = [entry.canonical, ...entry.synonyms];
      for (const form of forms) {
        const escaped = form.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (new RegExp(`\\b${escaped}\\b`, 'i').test(pText)) {
          if (!proj.technologies.includes(entry.canonical)) proj.technologies.push(entry.canonical);
          break;
        }
      }
    });
  });

  // 7. Education Extraction
  const education: StructuredResume['education'] = [];
  const eduLines = sectionContentMap['education'] || [];
  eduLines.forEach((line) => {
    if (/degree|bachelor|master|b\.?tech|m\.?tech|b\.?s|m\.?s|computer science|engineering|university|college/i.test(line)) {
      education.push({
        degree: line,
        field: 'Computer Science / Engineering',
        institution: 'University / Institute',
        year: 'Graduated',
      });
    }
  });

  // 8. Certifications & Achievements
  const certifications = sectionContentMap['certifications'] || [];
  const achievements = sectionContentMap['achievements'] || [];

  // 9. Metrics Detection (e.g. 40%, $10k, 500+ users, 2x faster)
  const hasMetrics = /\b(?:\d+%\b|\$\d+|\d+\+|\d+x\b|\b\d+\s+(?:users|requests|customers|clients|percent|seconds|ms|queries)\b)/i.test(text);

  // 10. ATS Formatting Anomaly Detector
  const atsFormattingIssues: string[] = [];
  if (text.includes('  \t  ') || text.includes('\0')) {
    atsFormattingIssues.push('Contains abnormal tab characters or unreadable null bytes.');
  }
  if (!contact.email) {
    atsFormattingIssues.push('Missing clear contact email address in standard header text.');
  }
  if (!detectedSections.find((s) => s.section === 'skills' && s.detected)) {
    atsFormattingIssues.push('Missing explicit "Technical Skills" section heading.');
  }
  if (!detectedSections.find((s) => s.section === 'experience' && s.detected) && !detectedSections.find((s) => s.section === 'projects' && s.detected)) {
    atsFormattingIssues.push('Missing clear Experience or Projects section headings.');
  }
  if (lines.length > 250) {
    atsFormattingIssues.push('Resume length is excessively long (>250 lines) which may degrade ATS parsing.');
  }

  return {
    rawText: text,
    filename,
    candidateName,
    contact,
    summary,
    sections: detectedSections,
    skills: Array.from(skillsSet),
    experience,
    projects,
    education,
    certifications,
    achievements,
    hasMetrics,
    atsFormattingIssues,
  };
}
