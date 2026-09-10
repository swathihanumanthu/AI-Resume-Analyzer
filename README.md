# 🚀 AI Career Intelligence

> **"Know your match. See your gaps. Build your path."**

An explainable career intelligence platform that transforms any job description and resume into a personalized, evidence-based career roadmap.

---

## 🌟 Signature Features

1. **Job Readiness Hero Score (0–100%)**: Deterministic scoring across skills, experience, projects, education, and ATS parsing with tier ratings (`🚀 Interview Ready`, `🟢 Strong Candidate`, `🟡 Almost Ready`, `🟠 Needs Improvement`, `🔴 Opportunities to Improve`).
2. **Career Twin Alignment Map**: Side-by-side visual comparison linking target role expectations to candidate profile nodes (`✓ VERIFIED MATCH`, `◐ SEMANTIC MATCH`, `⚠ PARTIAL EVIDENCE`, `✕ NOT DETECTED`).
3. **Interactive SVG "Job DNA Map"**: Radial constellation / neural-network-style SVG requirement map centered on Target Role across 8 clusters (`TECH STACK`, `EXPERIENCE`, `RESPONSIBILITIES`, `EDUCATION`, `TOOLS`, `SOFT SKILLS`, `DOMAIN`, `CERTIFICATIONS`).
4. **Traceable Evidence Explorer**: Links every score contribution and deduction directly to exact text snippets in the candidate resume with zero black-box scoring.
5. **Why Isn't Your Readiness Score Higher?**: Transparent deduction breakdown drawer explaining exact points lost and evidence gaps.
6. **Skill Gap → Action Engine**: 4-step actionable learning path (`LEARN` → `PRACTICE` → `PROVE` → `UPDATE`) for every missing requirement.
7. **Skill Adjacency Engine**: Identifies candidate's existing foundation skills that accelerate learning missing technologies.
8. **Your #1 Next Step Engine**: Algorithmic calculation of the single highest-impact action based on JD priority, current foundation, effort, and readiness boost.
9. **WHAT-IF CAREER SIMULATOR**: Interactive skill checkboxes simulating projected readiness score increases (`82% → 88%`) with clear projection disclaimers.
10. **Recruiter Lens & 10-Second Resume Test**: Simulates 10-second recruiter scans (`VISIBLE IN FIRST 10 SECONDS` vs `NOT IMMEDIATELY OBVIOUS`) with signal analysis.
11. **Resume Health Audit**: Computed scores for ATS parseability, keyword coverage, evidence quality, structure, and readability.
12. **Strict AI Interviewer & Mock Practice**: Multi-dimensional rubrics, question relevance gating (<20% relevance flags off-topic answers as `🔴 Weak`), keyword-stuffing penalties, unsupported resume claim warnings, and adaptive follow-up prompts.
13. **Career Copilot Assistant**: Floating AI assistant drawer providing session-aware career advice.
14. **✨ Guided Product Tour**: Interactive 9-step guided tour explaining the full analysis pipeline with sample data.
15. **Multi-Format Export & Privacy**: Export reports as PDF, Markdown, or JSON. Processed strictly in-memory per session with no persistent document storage.

---

## 🧪 Quick Start & Testing

### Prerequisites
- Node.js 18+ and npm installed.

### Installation
```bash
# Clone the repository
git clone https://github.com/swathihanumanthu/AI-Resume-Analyzer.git
cd AI-Resume-Analyzer

# Install dependencies
npm install

# Run Vitest unit tests (16 tests)
npm test

# Build production bundle
npm run build

# Launch development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing

```bash
npm test
```
Verifies text extraction, skill taxonomy normalization, Job DNA map generation, Career Twin alignment, ATS score breakdown, What-If simulation, and strict mock interviewer evaluation.

---

## 📦 Deployment (Vercel)

Deploy directly to Vercel:
```bash
npx vercel
```
