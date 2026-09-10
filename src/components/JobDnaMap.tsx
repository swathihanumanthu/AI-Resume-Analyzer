'use client';

import React, { useState } from 'react';
import { JobDna, JobDnaItem, EvidenceItem, JobDnaMapNode, DnaClusterCategory } from '../types/analyzer';
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

interface JobDnaMapProps {
  jobDna: JobDna;
  rawEvidence: EvidenceItem[];
  jobTitle: string;
}

export default function JobDnaMap({ jobDna, rawEvidence, jobTitle }: JobDnaMapProps) {
  const [selectedNode, setSelectedNode] = useState<JobDnaMapNode | null>(null);
  const [activeClusterFilter, setActiveClusterFilter] = useState<string>('ALL');

  // Convert JobDna items into structured map nodes
  const mapNodes: JobDnaMapNode[] = jobDna.dnaItems.map((item, idx) => {
    const ev = rawEvidence.find(
      (e) => e.requirement.toLowerCase() === item.name.toLowerCase() || e.requirement.toLowerCase().includes(item.name.toLowerCase())
    );

    let matchStatus: JobDnaMapNode['matchStatus'] = 'NOT DETECTED';
    let confidence = 0;
    let scoreContribution = -item.weightPct * 0.1;
    let resumeEvidence = 'Not detected in resume';

    if (ev) {
      confidence = ev.confidence;
      scoreContribution = ev.scoreContribution;
      resumeEvidence = ev.foundEvidence;
      if (ev.status === 'MATCHED') {
        matchStatus = ev.matchType === 'EXACT' ? 'EXACT MATCH' : 'SEMANTIC MATCH';
      } else if (ev.status === 'PARTIALLY_MATCHED') {
        matchStatus = 'PARTIAL EVIDENCE';
      }
    }

    const cluster = getCategoryCluster(item.category, item.name);

    return {
      id: `node-${idx}-${item.name}`,
      name: item.name,
      cluster,
      importance: item.priority,
      matchStatus,
      confidence,
      scoreContribution: Math.round(scoreContribution * 10) / 10,
      resumeEvidence,
      recommendedAction:
        matchStatus === 'NOT DETECTED'
          ? `Gain genuine ${item.name} hands-on experience and document it through a project.`
          : matchStatus === 'PARTIAL EVIDENCE'
          ? `Quantify your experience with ${item.name} with specific metrics.`
          : undefined,
    };
  });

  const clusters: DnaClusterCategory[] = ['TECH STACK', 'EXPERIENCE', 'RESPONSIBILITIES', 'EDUCATION', 'TOOLS', 'SOFT SKILLS', 'DOMAIN', 'CERTIFICATIONS'];

  // SVG Radial Layout Calculations
  const width = 760;
  const height = 480;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 170;

  // Position nodes radially around the center
  const positionedNodes = mapNodes.map((node, index) => {
    const clusterIdx = clusters.indexOf(node.cluster);
    const clusterAngle = (clusterIdx / clusters.length) * 2 * Math.PI - Math.PI / 2;
    const offsetInCluster = (index % 3) * 0.25 - 0.25;
    const angle = clusterAngle + offsetInCluster;

    const rOffset = radius + (index % 2 === 0 ? 25 : -20);
    const x = Math.round(centerX + rOffset * Math.cos(angle));
    const y = Math.round(centerY + rOffset * Math.sin(angle));

    return { ...node, x, y };
  });

  const filteredNodes = activeClusterFilter === 'ALL'
    ? positionedNodes
    : positionedNodes.filter((n) => n.cluster === activeClusterFilter);

  const getStatusColor = (status: JobDnaMapNode['matchStatus']) => {
    switch (status) {
      case 'EXACT MATCH':
        return '#10b981'; // Green
      case 'SEMANTIC MATCH':
        return '#3b82f6'; // Blue
      case 'PARTIAL EVIDENCE':
        return '#f59e0b'; // Amber
      case 'NOT DETECTED':
      default:
        return '#ef4444'; // Red
    }
  };

  const getPriorityBadgeClass = (priority: JobDnaMapNode['importance']) => {
    switch (priority) {
      case 'CRITICAL': return 'priority-critical';
      case 'IMPORTANT': return 'priority-important';
      case 'USEFUL': return 'priority-useful';
      case 'BONUS': default: return 'priority-bonus';
    }
  };

  return (
    <div className="console-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            🧬 JOB DNA MAP — Constellation View
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Interactive requirement constellation mapped from target Job Description. Click any node to inspect evidence.
          </p>
        </div>

        {/* Cluster Filter Tabs */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            className={`prompt-chip ${activeClusterFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveClusterFilter('ALL')}
            style={{ fontWeight: activeClusterFilter === 'ALL' ? 700 : 500 }}
          >
            All Clusters ({mapNodes.length})
          </button>
          {clusters.map((c) => {
            const count = mapNodes.filter((n) => n.cluster === c).length;
            if (count === 0) return null;
            return (
              <button
                key={c}
                className="prompt-chip"
                onClick={() => setActiveClusterFilter(c)}
                style={{ fontWeight: activeClusterFilter === c ? 700 : 500, borderColor: activeClusterFilter === c ? 'var(--accent-primary)' : undefined }}
              >
                {c} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Radial Graph Container */}
      <div style={{ position: 'relative', width: '100%', overflowX: 'auto', background: 'var(--surface-card)', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid var(--border)' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', minWidth: '600px', height: 'auto', maxHeight: '500px' }}>
          <defs>
            <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background Orbit Ring */}
          <circle cx={centerX} cy={centerY} r={radius} fill="none" stroke="var(--border)" strokeWidth="1.5" strokeDasharray="6 6" />

          {/* Connecting Lines from Center to Nodes */}
          {filteredNodes.map((node) => (
            <line
              key={`line-${node.id}`}
              x1={centerX}
              y1={centerY}
              x2={node.x}
              y2={node.y}
              stroke={getStatusColor(node.matchStatus)}
              strokeWidth={selectedNode?.id === node.id ? '2.5' : '1'}
              strokeOpacity={selectedNode?.id === node.id ? '0.9' : '0.4'}
            />
          ))}

          {/* Center Target Role Node */}
          <circle cx={centerX} cy={centerY} r="48" fill="url(#centerGlow)" />
          <circle cx={centerX} cy={centerY} r="38" fill="var(--bg-secondary)" stroke="var(--accent-primary)" strokeWidth="2.5" />
          <text x={centerX} y={centerY - 4} textAnchor="middle" fill="var(--text-primary)" fontSize="11" fontWeight="800">
            TARGET ROLE
          </text>
          <text x={centerX} y={centerY + 12} textAnchor="middle" fill="var(--text-secondary)" fontSize="9" fontWeight="600">
            {jobTitle.length > 18 ? jobTitle.substring(0, 16) + '...' : jobTitle}
          </text>

          {/* Requirement Constellation Nodes */}
          {filteredNodes.map((node) => {
            const isSelected = selectedNode?.id === node.id;
            const nodeColor = getStatusColor(node.matchStatus);

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => setSelectedNode(node)}
                style={{ cursor: 'pointer' }}
              >
                {/* Node Ring */}
                <circle
                  r={isSelected ? '18' : '14'}
                  fill="var(--bg-secondary)"
                  stroke={nodeColor}
                  strokeWidth={isSelected ? '3' : '2'}
                />
                {/* Status Dot */}
                <circle r="4" fill={nodeColor} />

                {/* Requirement Label */}
                <text
                  y="26"
                  textAnchor="middle"
                  fill="var(--text-primary)"
                  fontSize="10"
                  fontWeight={isSelected ? '800' : '600'}
                  style={{ pointerEvents: 'none' }}
                >
                  {node.name.length > 14 ? node.name.substring(0, 12) + '..' : node.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Node Details Inspection Drawer / Modal overlay */}
        {selectedNode && (
          <div
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              maxWidth: '320px',
              background: 'var(--bg-secondary)',
              border: `2px solid ${getStatusColor(selectedNode.matchStatus)}`,
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              boxShadow: 'var(--shadow-glow)',
              zIndex: 10,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{selectedNode.name}</strong>
              <button
                onClick={() => setSelectedNode(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 700 }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <span className={`priority-tag ${getPriorityBadgeClass(selectedNode.importance)}`}>
                {selectedNode.importance}
              </span>
              <span className="priority-tag" style={{ background: 'var(--accent-glow)', color: 'var(--accent-primary)' }}>
                {selectedNode.cluster}
              </span>
            </div>

            <div style={{ fontSize: '0.85rem', marginBottom: '6px' }}>
              <strong>Status:</strong>{' '}
              <span style={{ color: getStatusColor(selectedNode.matchStatus), fontWeight: 700 }}>
                {selectedNode.matchStatus}
              </span>
            </div>

            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', background: 'var(--bg-primary)', padding: '8px', borderRadius: '6px', marginBottom: '8px' }}>
              📄 <strong>Resume Evidence:</strong> "{selectedNode.resumeEvidence}"
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Confidence: {selectedNode.confidence}% • Score Impact:{' '}
              <span style={{ color: selectedNode.scoreContribution >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                {selectedNode.scoreContribution >= 0 ? `+${selectedNode.scoreContribution}` : `${selectedNode.scoreContribution}`} pts
              </span>
            </div>

            {selectedNode.recommendedAction && (
              <div style={{ fontSize: '0.8rem', color: 'var(--warning)', background: 'var(--warning-bg)', padding: '8px', borderRadius: '6px' }}>
                💡 <strong>Action:</strong> {selectedNode.recommendedAction}
              </div>
            )}
          </div>
        )}
      </div>

      {/* JOB DNA LEGEND */}
      <div style={{ marginTop: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        <strong>Legend:</strong>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }}></span> ✓ EXACT MATCH
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6' }}></span> ◐ SEMANTIC MATCH
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }}></span> ⚠ PARTIAL EVIDENCE
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }}></span> ✕ NOT DETECTED
        </span>
      </div>
    </div>
  );
}

function getCategoryCluster(category: string, name: string): DnaClusterCategory {
  const cat = (category + ' ' + name).toLowerCase();
  if (cat.includes('language') || cat.includes('framework') || cat.includes('database') || cat.includes('cloud') || cat.includes('ai') || cat.includes('stack')) {
    return 'TECH STACK';
  }
  if (cat.includes('exp') || cat.includes('year') || cat.includes('senior') || cat.includes('lead')) {
    return 'EXPERIENCE';
  }
  if (cat.includes('degree') || cat.includes('bachelor') || cat.includes('master') || cat.includes('education')) {
    return 'EDUCATION';
  }
  if (cat.includes('tool') || cat.includes('git') || cat.includes('jira') || cat.includes('platform')) {
    return 'TOOLS';
  }
  if (cat.includes('certif') || cat.includes('aws certified') || cat.includes('pmp')) {
    return 'CERTIFICATIONS';
  }
  if (cat.includes('soft') || cat.includes('lead') || cat.includes('communication')) {
    return 'SOFT SKILLS';
  }
  if (cat.includes('resp') || cat.includes('build') || cat.includes('manage') || cat.includes('deploy')) {
    return 'RESPONSIBILITIES';
  }
  return 'DOMAIN';
}
