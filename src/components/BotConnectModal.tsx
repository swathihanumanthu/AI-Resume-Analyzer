'use client';

import React from 'react';
import { X, ExternalLink, MessageSquare, Sparkles } from 'lucide-react';

export type BotPlatform = 'telegram' | 'discord' | 'whatsapp' | 'google-chat';

interface BotConnectModalProps {
  platform: BotPlatform | null;
  onClose: () => void;
}

export default function BotConnectModal({ platform, onClose }: BotConnectModalProps) {
  if (!platform) return null;

  const details = {
    telegram: {
      title: '✈️ Telegram Bot Connection',
      color: '#38bdf8',
      webhook: '/api/webhooks/telegram',
      launchUrl: 'https://t.me/',
      command: '/start',
      instruction: 'Open Telegram, start a chat with Career Copilot bot, and send your resume or type /start to get instant analysis reports.',
      buttonText: 'Open Telegram App ↗',
    },
    discord: {
      title: '💬 Discord Bot Connection',
      color: '#818cf8',
      webhook: '/api/webhooks/discord',
      launchUrl: 'https://discord.com/app',
      command: '/analyze',
      instruction: 'Add Career Copilot to your Discord server or DM. Type /analyze to trigger instant Job Readiness analysis.',
      buttonText: 'Open Discord App ↗',
    },
    whatsapp: {
      title: '🟢 WhatsApp Bot Connection',
      color: '#34d399',
      webhook: '/api/webhooks/whatsapp',
      launchUrl: 'https://api.whatsapp.com/send?text=Analyze%20my%20resume',
      command: 'Analyze my resume',
      instruction: 'Send "Analyze my resume" or attach your PDF resume in WhatsApp to receive instant ATS & readiness reports.',
      buttonText: 'Open WhatsApp Chat ↗',
    },
    'google-chat': {
      title: '🔷 Google Chat App Connection',
      color: '#f472b6',
      webhook: '/api/webhooks/google-chat',
      launchUrl: 'https://chat.google.com/',
      command: 'Analyze resume',
      instruction: 'Add Career Copilot space app in Google Workspace Chat. Message "Analyze resume" to receive career intelligence reports.',
      buttonText: 'Open Google Chat ↗',
    },
  }[platform];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        backdropFilter: 'blur(6px)',
      }}
      onClick={onClose}
    >
      <div
        className="console-card"
        style={{
          maxWidth: '500px',
          width: '92%',
          border: `2px solid ${details.color}`,
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: details.color, display: 'flex', alignItems: 'center', gap: '8px' }}>
            {details.title}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X style={{ width: 20 }} />
          </button>
        </div>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
          {details.instruction}
        </p>

        <div style={{ background: 'var(--surface-elevated)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: '20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>API Webhook Endpoint:</div>
          <code style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', display: 'block', marginBottom: '10px' }}>
            {details.webhook}
          </code>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Example Trigger Command:</div>
          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            "{details.command}"
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <a
            href={details.launchUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-hero"
            style={{ textDecoration: 'none' }}
          >
            {details.buttonText}
          </a>
        </div>
      </div>
    </div>
  );
}
