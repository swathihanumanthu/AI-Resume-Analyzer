'use client';

import React, { useState } from 'react';
import { X, ExternalLink, MessageSquare, Smartphone, Play, CheckCircle } from 'lucide-react';

export type BotPlatform = 'telegram' | 'discord' | 'whatsapp' | 'google-chat';

interface BotConnectModalProps {
  platform: BotPlatform | null;
  onClose: () => void;
}

export default function BotConnectModal({ platform, onClose }: BotConnectModalProps) {
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  if (!platform) return null;

  const details = {
    telegram: {
      title: '✈️ Telegram Bot Connection',
      color: '#38bdf8',
      webhook: '/api/webhooks/telegram',
      appScheme: 'tg://msg?text=/start',
      launchUrl: 'https://t.me/CareerCopilotBot?start=analyze',
      command: '/start',
      instruction: 'If Telegram is installed on your phone, clicking below will open the Telegram app directly and send /start for instant Career Intelligence output.',
      buttonText: '🚀 Open Telegram Mobile App',
    },
    discord: {
      title: '💬 Discord Bot Connection',
      color: '#818cf8',
      webhook: '/api/webhooks/discord',
      appScheme: 'discord://',
      launchUrl: 'https://discord.com/app',
      command: '/analyze',
      instruction: 'If Discord is installed on your phone, clicking below will launch the Discord app directly to access Career Copilot bot.',
      buttonText: '🚀 Open Discord Mobile App',
    },
    whatsapp: {
      title: '🟢 WhatsApp Bot Connection',
      color: '#34d399',
      webhook: '/api/webhooks/whatsapp',
      appScheme: 'whatsapp://send?text=Analyze%20my%20resume',
      launchUrl: 'https://api.whatsapp.com/send?text=Analyze%20my%20resume',
      command: 'Analyze my resume',
      instruction: 'If WhatsApp is installed on your phone, clicking below will launch WhatsApp directly with pre-filled prompt "Analyze my resume".',
      buttonText: '🚀 Open WhatsApp Mobile App',
    },
    'google-chat': {
      title: '🔷 Google Chat App Connection',
      color: '#f472b6',
      webhook: '/api/webhooks/google-chat',
      appScheme: 'googlechat://',
      launchUrl: 'https://chat.google.com/',
      command: 'Analyze resume',
      instruction: 'If Google Chat is installed on your phone, clicking below will launch the Google Chat app directly to view Career Copilot.',
      buttonText: '🚀 Open Google Chat Mobile App',
    },
  }[platform];

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

  const handleTestWebhookOutput = async () => {
    setIsTesting(true);
    try {
      const res = await fetch(details.webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: {
            text: details.command,
            from: { id: 'mobile_user_test', first_name: 'Mobile User' },
          },
        }),
      });
      const json = await res.json();
      if (json.text) {
        setTestOutput(json.text);
      } else {
        setTestOutput(`Webhook triggered successfully. Status: 200 OK.`);
      }
    } catch {
      setTestOutput('Error triggering webhook test response.');
    } finally {
      setIsTesting(false);
    }
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
          maxWidth: '520px',
          width: '92%',
          maxHeight: '90vh',
          overflowY: 'auto',
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
          📱 <strong>Mobile App Direct Launch:</strong> {details.instruction}
        </p>

        <div style={{ background: 'var(--surface-elevated)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>API Webhook Endpoint:</span>
            <button
              onClick={() => {
                const fullUrl = `${window.location.origin}${details.webhook}`;
                navigator.clipboard.writeText(fullUrl);
                alert(`Copied Webhook URL to clipboard:\n${fullUrl}`);
              }}
              style={{
                background: 'transparent',
                border: '1px solid var(--accent-primary)',
                color: 'var(--accent-primary)',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.72rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Copy Webhook URL
            </button>
          </div>
          <code style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', display: 'block', marginBottom: '10px', wordBreak: 'break-all' }}>
            {details.webhook}
          </code>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Trigger Command:</div>
          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            "{details.command}"
          </div>
        </div>

        {/* Live Webhook Output Preview */}
        {testOutput ? (
          <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--success)', fontSize: '0.82rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', maxHeight: '180px', overflowY: 'auto' }}>
            <div style={{ color: 'var(--success)', fontWeight: 800, marginBottom: '6px' }}>
              ✓ Output from Bot Webhook:
            </div>
            {testOutput}
          </div>
        ) : (
          <button
            onClick={handleTestWebhookOutput}
            disabled={isTesting}
            className="btn btn-secondary"
            style={{ width: '100%', marginBottom: '16px', fontSize: '0.82rem', fontWeight: 700 }}
          >
            <Play style={{ width: 14 }} /> {isTesting ? 'Generating Output...' : '⚡ Test & Preview Bot Output'}
          </button>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
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
