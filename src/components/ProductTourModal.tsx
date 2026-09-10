'use client';

import React from 'react';
import { Sparkles, X, ChevronRight, ChevronLeft } from 'lucide-react';

interface ProductTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStep: number;
  onStepChange: (step: number) => void;
}

export default function ProductTourModal({ isOpen, onClose, currentStep, onStepChange }: ProductTourModalProps) {
  if (!isOpen) return null;

  const tourSteps = [
    { title: 'Step 1: Document Upload', desc: 'Upload Job Description & Candidate Resumes (PDF, DOCX, TXT, or text paste).' },
    { title: 'Step 2: Job DNA Extraction', desc: 'Extract requirement priorities (Critical 🔴, Important 🟠, Useful 🟡, Bonus 🟢).' },
    { title: 'Step 3: Career Twin Alignment', desc: 'Map candidate profile capabilities directly against target job expectations.' },
    { title: 'Step 4: Traceable Evidence Graph', desc: 'Verify score contributions against exact resume text evidence.' },
    { title: 'Step 5: Why Not 100% Deductions', desc: 'Audit exact point losses and missing evidence reasons.' },
    { title: 'Step 6: Gap → Action Pathway', desc: 'Structured learning roadmap: Learn → Practice → Prove → Update.' },
    { title: 'Step 7: What-If Career Simulator', desc: 'Simulate projected readiness improvements when closing specific gaps.' },
    { title: 'Step 8: 10-Second Recruiter Scan', desc: 'See what recruiters notice immediately vs. what remains hidden.' },
    { title: 'Step 9: Strict AI Interview Practice', desc: 'Practice customized technical questions with strict relevance rubrics.' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(4px)' }}>
      <div className="console-card" style={{ maxWidth: '540px', width: '92%', border: '2px solid var(--accent-primary)', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="brand-badge" style={{ fontSize: '0.75rem' }}>
              <Sparkles style={{ width: 12 }} /> ✨ GUIDED PRODUCT TOUR
            </span>
            <span style={{ fontSize: '0.75rem', background: 'var(--warning-bg)', color: 'var(--warning)', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
              SAMPLE DATA
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X style={{ width: 20 }} />
          </button>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 800, marginBottom: '4px' }}>
          TOUR STEP {currentStep + 1} OF 9
        </div>

        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>
          {tourSteps[currentStep].title}
        </h3>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          {tourSteps[currentStep].desc}
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            className="btn btn-secondary"
            onClick={() => onStepChange(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            <ChevronLeft style={{ width: 16 }} /> Previous
          </button>

          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {currentStep + 1} / 9
          </span>

          {currentStep < 8 ? (
            <button className="btn btn-hero" onClick={() => onStepChange(Math.min(8, currentStep + 1))}>
              Next Step <ChevronRight style={{ width: 16 }} />
            </button>
          ) : (
            <button className="btn btn-hero" onClick={onClose}>
              Complete Tour ✓
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
