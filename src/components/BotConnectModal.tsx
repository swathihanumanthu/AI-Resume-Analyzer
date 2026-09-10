'use client';

import React, { useState, useEffect } from 'react';
import { X, ExternalLink, MessageSquare, Smartphone, Play, CheckCircle, Copy, Sparkles } from 'lucide-react';

export type BotPlatform = 'telegram' | 'discord' | 'whatsapp' | 'google-chat';

interface BotConnectModalProps {
  platform: BotPlatform | null;
  onClose: () => void;
}

export default function BotConnectModal({ platform, onClose }: BotConnectModalProps) {
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copied, setCopied] = useState(false);

  const details = platform
    ? {
        telegram: {
          title: '✈️ Telegram Bot Connection',
          color: '#38bdf8',
          webhook: '/api/webhooks/telegram',
          appScheme: 'tg://msg?text=/start',
          launchUrl: 'https://t.me/CareerCopilotBot?start=analyze',
          command: '/start',
          instruction: 'Open Telegram app directly or view the live bot output below.',
          buttonText: '🚀 Open Telegram App',
        },
        discord: {
          title: '💬 Discord Bot Connection',
          color: '#818cf8',
          webhook: '/api/webhooks/discord',
          appScheme: 'discord://',
          launchUrl: 'https://discord.com/app',
          command: '/analyze',
          instruction: 'Open Discord app directly or view the live bot output below.',
          buttonText: '🚀 Open Discord App',
        },
        whatsapp: {
          title: '🟢 WhatsApp Bot Connection',
          color: '#34d399',
          webhook: '/api/webhooks/whatsapp',
          appScheme: 'whatsapp://send?text=Analyze%20my%20resume',
          launchUrl: 'https://api.whatsapp.com/send?text=Analyze%20my%20resume',
          command: 'Analyze my resume',
          instruction: 'Open WhatsApp app directly or view the live bot output below.',
          buttonText: '🚀 Open WhatsApp App',
        },
        'google-chat': {
          title: '🔷 Google Chat App Connection',
          color: '#f472b6',
          webhook: '/api/webhooks/google-chat',
          appScheme: 'googlechat://',
          launchUrl: 'https://chat.google.com/',
          command: 'Analyze resume',
          instruction: 'Open Google Chat app directly or view the live bot output below.',
          buttonText: '🚀 Open Google Chat App',
        },
      }[platform]
    : null;

  useEffect(() => {
    if (!platform || !details) return;
    let isMounted = true;
    setIsTesting(true);

    fetch(details.webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: {
          text: details.command,
          from: { id: 'user_session_mobile', first_name: 'Candidate' },
        },
      }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (isMounted) {
          if (json.text) setTestOutput(json.text);
          else setTestOutput('Bot output generated successfully.');
        }
      })
      .catch(() => {
        if (isMounted) setTestOutput('Error fetching bot output.');
      })
      .finally(() => {
        if (isMounted) setIsTesting(false);
      });

    return () => {
      isMounted = false;
    };
  }, [platform]);

  if (!platform || !details) return null;

  const handleLaunchMobileApp = () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = details.appScheme;
      setTimeout(() => {
        window.open(details.launchUrl, '_blank');
      }, 1000);
    } else {
      window.open(details.launchUrl, '_blank');
    }
  };

  const handleCopyOutput = () => {
    if (!testOutput) return;
    navigator.clipboard.writeText(testOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
          maxWidth: '540px',
          width: '92%',
          maxHeight: '90vh',
          overflowY: 'auto',
          border: `2px solid ${details.color}`,
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: details.color, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            {details.title}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X style={{ width: 20 }} />
          </button>
        </div>

        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
          {details.instruction}
        </p>

        {/* Live Bot Output Window */}
        <div style={{ marginBottom: '16px', background: 'var(--surface-elevated)', borderRadius: '8px', border: '1px solid var(--border)', padding: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles style={{ width: 14 }} /> Bot Response Output:
            </span>
            {testOutput && (
              <button
                onClick={handleCopyOutput}
                className="btn btn-secondary"
                style={{ padding: '3px 8px', fontSize: '0.75rem', fontWeight: 700 }}
              >
                {copied ? '✓ Copied Output!' : '📋 Copy Output'}
              </button>
            )}
          </div>

          {isTesting ? (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '10px 0' }}>
              ⏳ Generating bot analysis output...
            </div>
          ) : (
            <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', maxHeight: '220px', overflowY: 'auto', background: 'var(--bg-primary)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontFamily: 'monospace' }}>
              {testOutput}
            </div>
          )}
        </div>

        <div style={{ background: 'var(--surface-elevated)', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border)', marginBottom: '20px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <div>Webhook: <code style={{ color: 'var(--accent-primary)' }}>{details.webhook}</code></div>
          <div>Trigger Command: <strong style={{ color: 'var(--text-primary)' }}>"{details.command}"</strong></div>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button
            onClick={handleLaunchMobileApp}
            className="btn btn-hero"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
          >
            <Smartphone style={{ width: 16 }} />
            {details.buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
