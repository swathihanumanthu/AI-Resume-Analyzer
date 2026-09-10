'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Zap,
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Download,
  Moon,
  Sun,
  Lock,
  Layers,
  HelpCircle,
  MessageSquare,
} from 'lucide-react';
import {
  FullAnalysisResult,
  MultiResumeAnalysisReport,
} from '../types/analyzer';
import JobDnaMap from '../components/JobDnaMap';
import CareerTwinView from '../components/CareerTwinView';
import AiInterviewerPanel from '../components/AiInterviewerPanel';
import ProductTourModal from '../components/ProductTourModal';
import PrivacyModal from '../components/PrivacyModal';
import BotConnectModal, { BotPlatform } from '../components/BotConnectModal';

export default function CareerIntelligencePage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activeInputTab, setActiveInputTab] = useState<'upload' | 'paste'>('upload');
  const [jdText, setJdText] = useState('');
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [resumeFiles, setResumeFiles] = useState<File[]>([]);
  const [pastedResumeText, setPastedResumeText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Results & Selection State
  const [singleAnalysis, setSingleAnalysis] = useState<FullAnalysisResult | null>(null);
  const [multiReport, setMultiReport] = useState<MultiResumeAnalysisReport | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  // UI Journey & Drawer States
  const [activeJourneyStep, setActiveJourneyStep] = useState<'understand' | 'diagnose' | 'improve' | 'simulate' | 'prepare'>('understand');
  const [showWhyNot100, setShowWhyNot100] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [activeBotModal, setActiveBotModal] = useState<BotPlatform | null>(null);

  // Product Tour Modal State
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  // What-If Simulator Selected Skills State
  const [selectedWhatIfSkills, setSelectedWhatIfSkills] = useState<string[]>([]);

  // Application Readiness Checklist State
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    degree: true,
    programming: true,
    framework: true,
    cloud: false,
    project: true,
    certification: false,
    github: true,
    metrics: false,
  });

  // Career Copilot State
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotMessages, setCopilotMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    {
      sender: 'bot',
      text: 'Hello! I am your Career Copilot. Ask me about your readiness score, missing skills, how to reach 90%, or practice an interview question!',
    },
  ]);
  const [copilotInput, setCopilotInput] = useState('');
  const [isCopilotLoading, setIsCopilotLoading] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  // Guided Product Tour Loader (Sample Analysis Data)
  const handleStartProductTour = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDemo: true }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Sample data load failed');

      setMultiReport(json.data);
      if (json.data.individualAnalyses.length > 0) {
        setSingleAnalysis(json.data.individualAnalyses[0]);
        setSelectedCandidateId(json.data.individualAnalyses[0].id);
      }
      setIsTourOpen(true);
      setTourStep(0);
      setActiveJourneyStep('understand');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Sample load error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Main Document Analysis
  const handleAnalyze = async () => {
    setIsLoading(true);
    setErrorMsg('');
    setSingleAnalysis(null);
    setMultiReport(null);

    try {
      if (activeInputTab === 'upload') {
        if (!jdFile && !jdText) throw new Error('Please upload a Job Description file or paste the JD text.');
        if (resumeFiles.length === 0) throw new Error('Please upload at least one Resume file (PDF, DOCX, or TXT).');

        const formData = new FormData();
        if (jdFile) formData.append('jdFile', jdFile);
        else formData.append('jdText', jdText);
        resumeFiles.forEach((file) => formData.append('resumes', file));

        const res = await fetch('/api/analyze', { method: 'POST', body: formData });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Analysis failed');

        if (json.mode === 'single') {
          setSingleAnalysis(json.data);
        } else {
          setMultiReport(json.data);
          if (json.data.individualAnalyses.length > 0) {
            setSingleAnalysis(json.data.individualAnalyses[0]);
            setSelectedCandidateId(json.data.individualAnalyses[0].id);
          }
        }
      } else {
        if (!jdText) throw new Error('Please enter Job Description text.');
        if (!pastedResumeText) throw new Error('Please paste candidate resume text.');

        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jdText,
            resumes: [{ content: pastedResumeText, filename: 'Pasted_Resume.txt' }],
          }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Analysis failed');

        setSingleAnalysis(json.data);
      }
      setActiveJourneyStep('understand');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Analysis error');
    } finally {
      setIsLoading(false);
    }
  };

  // What-If Skill Toggle
  const toggleWhatIfSkill = (skill: string) => {
    setSelectedWhatIfSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  // Career Copilot Submission
  const handleSendCopilotPrompt = async (promptText?: string) => {
    const query = promptText || copilotInput.trim();
    if (!query || isCopilotLoading) return;

    setCopilotMessages((prev) => [...prev, { sender: 'user', text: query }]);
    if (!promptText) setCopilotInput('');
    setIsCopilotLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Copilot error');

      setCopilotMessages((prev) => [...prev, { sender: 'bot', text: json.replyText }]);
    } catch {
      setCopilotMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setIsCopilotLoading(false);
    }
  };

  // Export File Download
  const handleExport = async (format: 'pdf' | 'json' | 'markdown') => {
    if (!singleAnalysis) return;
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, analysis: singleAnalysis }),
      });

      if (format === 'pdf') {
        const htmlText = await res.text();
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(htmlText);
          win.document.close();
          win.print();
        }
      } else {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Career_Intelligence_${singleAnalysis.candidateName.replace(/\s+/g, '_')}.${format === 'markdown' ? 'md' : 'json'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch {
      alert('Export failed.');
    }
  };

  // Calculate What-If Projected Score
  const currentReadiness = singleAnalysis?.readinessScore.score || 0;
  const projectedBoost = selectedWhatIfSkills.reduce((sum, skill) => {
    const gap = singleAnalysis?.whatIf.availableGaps.find((g) => g.skill === skill);
    return sum + (gap?.pointsValue || 3);
  }, 0);
  const projectedReadiness = Math.min(100, currentReadiness + projectedBoost);

  return (
    <div className="container">
      {/* Header & Brand Navigation */}
      <header className="header-nav">
        <div>
          <div className="brand-badge">
            <Sparkles style={{ width: 14, height: 14 }} /> AI CAREER INTELLIGENCE
          </div>
          <h1 className="hero-title">Know your match. See your gaps. Build your path.</h1>
          <p className="hero-tagline">
            Turn any job description and resume into an evidence-based career action plan.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="btn btn-demo" onClick={handleStartProductTour} disabled={isLoading}>
            <Zap style={{ width: 16, height: 16 }} /> ✨ Guided Product Tour
          </button>
          <button className="btn btn-secondary" onClick={toggleTheme} aria-label="Toggle Theme">
            {theme === 'dark' ? <Sun style={{ width: 16, height: 16 }} /> : <Moon style={{ width: 16, height: 16 }} />}
          </button>
          <button
            className="privacy-banner"
            onClick={() => setShowPrivacyModal(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <Lock style={{ width: 14, height: 14 }} /> Processed for this session
          </button>
        </div>
      </header>

      {/* 1. HERO / INPUT HUB */}
      <div className="console-card">
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <button
            className={`btn ${activeInputTab === 'upload' ? 'btn-hero' : 'btn-secondary'}`}
            onClick={() => setActiveInputTab('upload')}
          >
            <Upload style={{ width: 16 }} /> File Upload (PDF / DOCX / TXT)
          </button>
          <button
            className={`btn ${activeInputTab === 'paste' ? 'btn-hero' : 'btn-secondary'}`}
            onClick={() => setActiveInputTab('paste')}
          >
            <FileText style={{ width: 16 }} /> Copy / Paste Text
          </button>
        </div>

        {activeInputTab === 'upload' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '4px' }}>
                Target Job Description <span style={{ fontSize: '0.78rem', color: 'var(--accent-primary)', fontWeight: 600 }}>(Single File Only)</span>
              </label>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                📌 Upload exactly 1 Job Description file (.pdf, .docx, .txt)
              </div>
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={(e) => setJdFile(e.target.files?.[0] || null)}
                style={{ display: 'block', width: '100%', marginBottom: '8px' }}
              />
              <textarea
                rows={3}
                placeholder="Or paste Job Description text..."
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'var(--surface-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '4px' }}>
                Candidate Resumes <span style={{ fontSize: '0.78rem', color: 'var(--success)', fontWeight: 600 }}>(Multiple Files Allowed)</span>
              </label>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                📁 Upload 1 or multiple candidate resume files simultaneously
              </div>
              <input
                type="file"
                multiple
                accept=".pdf,.docx,.txt"
                onChange={(e) => setResumeFiles(Array.from(e.target.files || []))}
                style={{ display: 'block', width: '100%', marginBottom: '12px' }}
              />
              {resumeFiles.length > 0 && (
                <div style={{ fontSize: '0.85rem', color: 'var(--success)' }}>
                  Selected {resumeFiles.length} file(s): {resumeFiles.map((f) => f.name).join(', ')}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px' }}>Job Description</label>
              <textarea
                rows={6}
                placeholder="Paste Job Description..."
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'var(--surface-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px' }}>Candidate Resume Text</label>
              <textarea
                rows={6}
                placeholder="Paste Resume text..."
                value={pastedResumeText}
                onChange={(e) => setPastedResumeText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'var(--surface-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>
        )}

        {errorMsg && (
          <div style={{ marginTop: '16px', padding: '12px', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: '8px', fontSize: '0.9rem' }}>
            <AlertTriangle style={{ width: 16, height: 16, display: 'inline', marginRight: '6px' }} />
            {errorMsg}
          </div>
        )}

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            🔒 Processed for this session
          </span>
          <button className="btn btn-hero" onClick={handleAnalyze} disabled={isLoading}>
            {isLoading ? 'Analyzing Readiness & Building Career Twin...' : 'Analyze my job readiness →'}
          </button>
        </div>
      </div>

      {/* Connect on Messaging Apps Card */}
      <div className="console-card" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          💬 Connect Career Copilot on Messaging Apps
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Click any platform card below to launch or connect Career Copilot directly in your favorite messaging app:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <div
            onClick={() => setActiveBotModal('telegram')}
            style={{
              background: 'var(--surface-elevated)',
              padding: '14px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            className="console-card-interactive"
          >
            <strong style={{ color: '#38bdf8', fontSize: '0.92rem', display: 'block', marginBottom: '4px' }}>✈️ Telegram Bot ↗</strong>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Webhook: <code>/api/webhooks/telegram</code></p>
            <span style={{ fontSize: '0.78rem', color: 'var(--accent-primary)', fontWeight: 600 }}>Click to launch bot & view commands →</span>
          </div>

          <div
            onClick={() => setActiveBotModal('discord')}
            style={{
              background: 'var(--surface-elevated)',
              padding: '14px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            className="console-card-interactive"
          >
            <strong style={{ color: '#818cf8', fontSize: '0.92rem', display: 'block', marginBottom: '4px' }}>💬 Discord Bot ↗</strong>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Webhook: <code>/api/webhooks/discord</code></p>
            <span style={{ fontSize: '0.78rem', color: 'var(--accent-primary)', fontWeight: 600 }}>Click to launch bot & view commands →</span>
          </div>

          <div
            onClick={() => setActiveBotModal('whatsapp')}
            style={{
              background: 'var(--surface-elevated)',
              padding: '14px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            className="console-card-interactive"
          >
            <strong style={{ color: '#34d399', fontSize: '0.92rem', display: 'block', marginBottom: '4px' }}>🟢 WhatsApp Bot ↗</strong>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Webhook: <code>/api/webhooks/whatsapp</code></p>
            <span style={{ fontSize: '0.78rem', color: 'var(--accent-primary)', fontWeight: 600 }}>Click to launch bot & view commands →</span>
          </div>

          <div
            onClick={() => setActiveBotModal('google-chat')}
            style={{
              background: 'var(--surface-elevated)',
              padding: '14px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            className="console-card-interactive"
          >
            <strong style={{ color: '#f472b6', fontSize: '0.92rem', display: 'block', marginBottom: '4px' }}>🔷 Google Chat App ↗</strong>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Webhook: <code>/api/webhooks/google-chat</code></p>
            <span style={{ fontSize: '0.78rem', color: 'var(--accent-primary)', fontWeight: 600 }}>Click to launch bot & view commands →</span>
          </div>
        </div>
      </div>

      {/* Multi-Resume Candidate Comparison Matrix */}
      {multiReport && (
        <div className="console-card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers style={{ color: 'var(--accent-primary)' }} /> Multi-Candidate Comparison Matrix ({multiReport.totalResumesAnalyzed} Resumes)
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            💡 {multiReport.whyTopCandidateIsStrongest}
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--surface-elevated)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Candidate</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Filename</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Job Readiness</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>ATS Score</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Tier</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {multiReport.comparisonTable.map((row) => (
                  <tr
                    key={row.analysisId}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: selectedCandidateId === row.analysisId ? 'var(--accent-glow)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '10px', fontWeight: 700 }}>{row.candidateName}</td>
                    <td style={{ padding: '10px' }}>{row.filename}</td>
                    <td style={{ padding: '10px', fontWeight: 900, color: 'var(--accent-primary)' }}>{row.readinessScore}%</td>
                    <td style={{ padding: '10px' }}>{row.atsScore} / 100</td>
                    <td style={{ padding: '10px' }}>
                      <span className="status-badge status-strong">{row.overallTier}</span>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                        onClick={() => {
                          setSelectedCandidateId(row.analysisId);
                          const found = multiReport.individualAnalyses.find((a) => a.id === row.analysisId);
                          if (found) setSingleAnalysis(found);
                        }}
                      >
                        Select Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Analysis Dashboard Console */}
      {singleAnalysis && (
        <div>
          {/* Journey Navigation Tabs */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '24px' }}>
            <button
              className={`btn ${activeJourneyStep === 'understand' ? 'btn-hero' : 'btn-secondary'}`}
              onClick={() => setActiveJourneyStep('understand')}
            >
              1. Understand (DNA & Twin)
            </button>
            <button
              className={`btn ${activeJourneyStep === 'diagnose' ? 'btn-hero' : 'btn-secondary'}`}
              onClick={() => setActiveJourneyStep('diagnose')}
            >
              2. Diagnose (Evidence & Gaps)
            </button>
            <button
              className={`btn ${activeJourneyStep === 'improve' ? 'btn-hero' : 'btn-secondary'}`}
              onClick={() => setActiveJourneyStep('improve')}
            >
              3. Improve (Action Path)
            </button>
            <button
              className={`btn ${activeJourneyStep === 'simulate' ? 'btn-hero' : 'btn-secondary'}`}
              onClick={() => setActiveJourneyStep('simulate')}
            >
              4. Simulate (What-If & Recruiter)
            </button>
            <button
              className={`btn ${activeJourneyStep === 'prepare' ? 'btn-hero' : 'btn-secondary'}`}
              onClick={() => setActiveJourneyStep('prepare')}
            >
              5. Prepare (AI Interviewer)
            </button>
          </div>

          {/* SCREEN 1 — UNDERSTAND */}
          {activeJourneyStep === 'understand' && (
            <div>
              {/* 2. Job Readiness Hero Meter */}
              <div className="readiness-hero">
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  🎯 Your Job Readiness Score
                </span>
                <div className="readiness-value">{singleAnalysis.readinessScore.score}%</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>
                  {singleAnalysis.readinessScore.tier}
                </div>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 16px auto' }}>
                  "{singleAnalysis.readinessScore.summaryQuote}"
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button className="btn btn-secondary" onClick={() => setShowWhyNot100(!showWhyNot100)}>
                    <HelpCircle style={{ width: 16 }} /> Why isn't your score higher?
                  </button>
                  <button className="btn btn-hero" onClick={() => setActiveJourneyStep('improve')}>
                    Build my roadmap →
                  </button>
                </div>
              </div>

              {/* Expandable Deduction Breakdown */}
              {showWhyNot100 && (
                <div className="console-card" style={{ borderLeft: '4px solid var(--warning)' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>
                    Why isn't your readiness score higher?
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    You are currently at {singleAnalysis.readinessScore.score}%. You lost point(s) due to the following evidence gaps:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {singleAnalysis.whyNot100.map((w, idx) => (
                      <div key={idx} style={{ background: 'var(--surface-elevated)', padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ color: 'var(--danger)', marginRight: '8px' }}>−{w.deduction} pts</strong>
                          <span style={{ fontSize: '0.9rem' }}>{w.reason}</span>
                        </div>
                        <span className="priority-tag priority-important">{w.category}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. CAREER TWIN */}
              <CareerTwinView
                careerTwin={singleAnalysis.careerTwin}
                candidateName={singleAnalysis.candidateName}
                jobTitle={singleAnalysis.jobTitle}
              />

              {/* 4. UNIQUE JOB DNA MAP */}
              <JobDnaMap
                jobDna={singleAnalysis.jobDna}
                rawEvidence={singleAnalysis.rawEvidence}
                jobTitle={singleAnalysis.jobTitle}
              />
            </div>
          )}

          {/* SCREEN 2 — DIAGNOSE */}
          {activeJourneyStep === 'diagnose' && (
            <div>
              {/* 5. Traceable Evidence Explorer */}
              <div className="console-card">
                <h2 style={{ fontSize: '1.25rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🔗 Traceable Evidence Explorer
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  Every score point and match conclusion is verified against actual resume text evidence.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {singleAnalysis.rawEvidence.map((ev, idx) => (
                    <div key={idx} className="evidence-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <strong style={{ fontSize: '0.95rem' }}>JD Requirement: {ev.requirement}</strong>
                        <span className={`status-badge ${ev.status === 'MATCHED' ? 'status-strong' : ev.status === 'PARTIALLY_MATCHED' ? 'status-partial' : 'status-missing'}`}>
                          {ev.status} ({ev.confidence}%)
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'var(--bg-primary)', padding: '8px', borderRadius: '6px', marginBottom: '6px' }}>
                        📄 <strong>Resume Evidence:</strong> "{ev.foundEvidence}"
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Match Type: {ev.matchType} • Score Contribution: +{ev.scoreContribution} pts
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6. Biggest Skill Gap Focus */}
              {singleAnalysis.gapActions.length > 0 && (
                <div className="console-card" style={{ borderLeft: '4px solid var(--danger)' }}>
                  <h2 style={{ fontSize: '1.25rem', marginBottom: '8px', color: 'var(--danger)' }}>
                    🚨 Your Biggest Gap: {singleAnalysis.gapActions[0].skill}
                  </h2>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    {singleAnalysis.gapActions[0].statusNotice} Close this gap to unlock the highest job readiness increase.
                  </p>
                  <button className="btn btn-hero" onClick={() => setActiveJourneyStep('improve')}>
                    See Learn → Practice → Prove Path →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SCREEN 3 — IMPROVE */}
          {activeJourneyStep === 'improve' && (
            <div>
              {/* 11. Learning Roadmap & Gap Action Engine */}
              <div className="console-card">
                <h2 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>
                  🚀 Skill Gap → Action Engine (Learn → Practice → Prove → Update)
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {singleAnalysis.gapActions.map((gap) => (
                    <div key={gap.skill} style={{ background: 'var(--surface-elevated)', padding: '18px', borderRadius: '14px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-primary)' }}>Skill Gap: {gap.skill}</h3>
                        <span className="priority-tag priority-critical">Priority {gap.priority} • Est. {gap.estimatedEffort}</span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                        <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: '8px' }}>
                          <strong style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', display: 'block', marginBottom: '4px' }}>1. LEARN</strong>
                          <p style={{ fontSize: '0.85rem' }}>{gap.learn.topic}</p>
                          <a href={gap.learn.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.78rem', color: 'var(--accent-primary)' }}>
                            {gap.learn.resource} ↗
                          </a>
                        </div>
                        <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: '8px' }}>
                          <strong style={{ fontSize: '0.8rem', color: 'var(--success)', display: 'block', marginBottom: '4px' }}>2. PRACTICE</strong>
                          <p style={{ fontSize: '0.85rem' }}>{gap.practice.projectIdea}</p>
                        </div>
                        <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: '8px' }}>
                          <strong style={{ fontSize: '0.8rem', color: 'var(--accent-purple)', display: 'block', marginBottom: '4px' }}>3. PROVE</strong>
                          <p style={{ fontSize: '0.85rem' }}>{gap.prove.githubTip}</p>
                        </div>
                        <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: '8px' }}>
                          <strong style={{ fontSize: '0.8rem', color: 'var(--warning)', display: 'block', marginBottom: '4px' }}>4. UPDATE</strong>
                          <p style={{ fontSize: '0.85rem' }}>{gap.update.resumeFix}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 7. #1 Next Step Engine */}
              <div className="console-card" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>🧠 Your #1 Next Step</h2>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-primary)', marginBottom: '6px' }}>{singleAnalysis.nextStep.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  <strong>Why:</strong> {singleAnalysis.nextStep.why} • <strong>Effort:</strong> {singleAnalysis.nextStep.estimatedEffort}
                </p>
                <button className="btn btn-hero" onClick={() => setActiveJourneyStep('simulate')}>
                  Simulate Closing This Gap →
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 4 — SIMULATE */}
          {activeJourneyStep === 'simulate' && (
            <div>
              {/* 8. WHAT-IF CAREER SIMULATOR */}
              <div className="console-card">
                <h2 style={{ fontSize: '1.25rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🔮 WHAT-IF CAREER SIMULATOR
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Select skills you plan to genuinely acquire to simulate your projected readiness score.
                </p>

                <div style={{ display: 'flex', gap: '24px', alignItems: 'center', background: 'var(--surface-elevated)', padding: '20px', borderRadius: '14px', marginBottom: '20px', border: '1px solid var(--border)' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>CURRENT READINESS</span>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)' }}>{currentReadiness}%</div>
                  </div>
                  <div style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>➔</div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>PROJECTED READINESS</span>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--success)' }}>{projectedReadiness}%</div>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px' }}>Select Gaps to Close:</label>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {singleAnalysis.whatIf.availableGaps.map((gap) => (
                      <label
                        key={gap.skill}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: selectedWhatIfSkills.includes(gap.skill) ? 'var(--accent-glow)' : 'var(--surface-elevated)',
                          border: '1px solid var(--border)',
                          padding: '8px 14px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedWhatIfSkills.includes(gap.skill)}
                          onChange={() => toggleWhatIfSkill(gap.skill)}
                        />
                        {gap.skill} (+{gap.pointsValue}%)
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--warning)', background: 'var(--warning-bg)', padding: '10px', borderRadius: '8px' }}>
                  ⚠️ {singleAnalysis.whatIf.disclaimer}
                </div>
              </div>

              {/* 9. RECRUITER LENS */}
              <div className="console-card">
                <h2 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>
                  👀 RECRUITER LENS — 10-Second Scan Test
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ background: 'var(--surface-elevated)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <h4 style={{ color: 'var(--success)', marginBottom: '8px' }}>VISIBLE IN FIRST 10 SECONDS</h4>
                    <ul style={{ paddingLeft: '18px', fontSize: '0.85rem' }}>
                      {singleAnalysis.recruiterLens.tenSecondScan.visibleIn10Seconds.map((item, idx) => (
                        <li key={idx} style={{ marginBottom: '6px' }}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div style={{ background: 'var(--surface-elevated)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <h4 style={{ color: 'var(--danger)', marginBottom: '8px' }}>NOT IMMEDIATELY OBVIOUS</h4>
                    <ul style={{ paddingLeft: '18px', fontSize: '0.85rem' }}>
                      {singleAnalysis.recruiterLens.tenSecondScan.notImmediatelyObvious.map((item, idx) => (
                        <li key={idx} style={{ marginBottom: '6px' }}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div style={{ background: 'var(--surface-elevated)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.9rem', marginBottom: '6px' }}>
                    <strong>First Impression:</strong> {singleAnalysis.recruiterLens.firstImpression}
                  </div>
                  <div style={{ fontSize: '0.9rem', marginBottom: '6px' }}>
                    <strong>Strongest Signal:</strong> {singleAnalysis.recruiterLens.strongestSignal}
                  </div>
                  <div style={{ fontSize: '0.9rem', marginBottom: '6px' }}>
                    <strong>Recruiter Recommendation:</strong> {singleAnalysis.recruiterLens.recruiterRecommendation}
                  </div>
                </div>
              </div>

              {/* 10. RESUME HEALTH */}
              <div className="console-card">
                <h2 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>🩺 Resume Health Audit</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ background: 'var(--surface-elevated)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ATS Parseability</span>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{singleAnalysis.resumeHealth.atsParsingPct}%</div>
                  </div>
                  <div style={{ background: 'var(--surface-elevated)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Keyword Coverage</span>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--success)' }}>{singleAnalysis.resumeHealth.keywordCoveragePct}%</div>
                  </div>
                  <div style={{ background: 'var(--surface-elevated)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Evidence Quality</span>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--warning)' }}>{singleAnalysis.resumeHealth.evidenceQualityPct}%</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 5 — PREPARE */}
          {activeJourneyStep === 'prepare' && (
            <div>
              {/* 12 & 13. STRICT AI INTERVIEWER */}
              <AiInterviewerPanel
                questions={singleAnalysis.interviewQuestions}
                resumeText={singleAnalysis.careerTwin.summaryMessage}
              />

              {/* 15. EXPORT REPORT */}
              <div className="console-card" style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>Download Full Analysis Report</h3>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button className="btn btn-secondary" onClick={() => handleExport('pdf')}>
                    <Download style={{ width: 14 }} /> Download PDF
                  </button>
                  <button className="btn btn-secondary" onClick={() => handleExport('markdown')}>
                    <Download style={{ width: 14 }} /> Download Markdown
                  </button>
                  <button className="btn btn-secondary" onClick={() => handleExport('json')}>
                    <Download style={{ width: 14 }} /> Download JSON
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 14. CAREER COPILOT ASSISTANT */}
      <button
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
          color: '#ffffff',
          border: 'none',
          boxShadow: '0 4px 20px rgba(37, 99, 235, 0.5)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
        }}
        onClick={() => setIsCopilotOpen(!isCopilotOpen)}
        aria-label="Open Career Copilot"
      >
        <MessageSquare style={{ width: 24, height: 24 }} />
      </button>

      {/* Copilot Drawer */}
      {isCopilotOpen && (
        <div className="copilot-drawer">
          <div className="copilot-header">
            <span>Career Copilot</span>
            <button onClick={() => setIsCopilotOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <XCircle style={{ width: 20 }} />
            </button>
          </div>

          <div style={{ padding: '8px 16px', display: 'flex', gap: '6px', overflowX: 'auto', background: 'var(--bg-primary)' }}>
            {['Why is my score low?', 'What should I learn first?', 'Rewrite my summary', 'Ask me interview questions'].map((chip) => (
              <button key={chip} className="prompt-chip" onClick={() => handleSendCopilotPrompt(chip)}>
                {chip}
              </button>
            ))}
          </div>

          <div className="chat-messages" style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {copilotMessages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  background: msg.sender === 'user' ? 'var(--accent-primary)' : 'var(--surface-elevated)',
                  color: msg.sender === 'user' ? '#ffffff' : 'var(--text-primary)',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  maxWidth: '85%',
                  fontSize: '0.88rem',
                }}
              >
                {msg.text}
              </div>
            ))}
            {isCopilotLoading && (
              <div style={{ alignSelf: 'flex-start', background: 'var(--surface-elevated)', color: 'var(--text-muted)', padding: '10px', borderRadius: '12px', fontSize: '0.85rem', fontStyle: 'italic' }}>
                Copilot is thinking...
              </div>
            )}
          </div>

          <div style={{ padding: '12px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Ask Copilot anything..."
              value={copilotInput}
              onChange={(e) => setCopilotInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendCopilotPrompt()}
              style={{ flex: 1, padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.88rem' }}
            />
            <button className="btn btn-hero" style={{ padding: '8px 14px' }} onClick={() => handleSendCopilotPrompt()}>
              Send
            </button>
          </div>
        </div>
      )}

      {/* Guided Product Tour Modal */}
      <ProductTourModal
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        currentStep={tourStep}
        onStepChange={(s) => setTourStep(s)}
      />

      {/* Session Privacy Modal */}
      <PrivacyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />

      {/* Messaging Bot Connect Modal */}
      <BotConnectModal
        platform={activeBotModal}
        onClose={() => setActiveBotModal(null)}
      />
    </div>
  );
}
