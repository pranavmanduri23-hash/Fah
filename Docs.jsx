import React from 'react';

export default function Docs({ onOpenSection }) {
  const sections = [
    {
      title: 'Command Deck',
      icon: 'fa-terminal',
      color: '#38bdf8',
      desc: 'Browse server tools, inspect command details, and jump straight into the catalog.',
      cta: { label: 'Open Command Center', target: 'commands' },
      items: [
        { name: 'Search Commands', desc: 'Filter by alias, category, or command name without leaving the page.' },
        { name: 'Inspect Details', desc: 'Open a clean modal with cooldowns, aliases, slash support, and availability.' },
        { name: 'Check Disabled State', desc: 'See which commands are blocked in the current server.' }
      ]
    },
    {
      title: 'Protection Guide',
      icon: 'fa-shield-halved',
      color: '#34d399',
      desc: 'Use the merged protection suite for automod, anti-nuke, command restrictions, and onboarding.',
      cta: { label: 'Open Protection', target: 'protection' },
      items: [
        { name: 'Auto Moderation', desc: 'Tune message filters, mention spam limits, and enforcement responses.' },
        { name: 'Anti-Nuke Controls', desc: 'Adjust thresholds, punishments, logs, and lockdown behavior.' },
        { name: 'Access Rules', desc: 'Review command restrictions and disabled channel coverage.' }
      ]
    },
    {
      title: 'Realtime Monitoring',
      icon: 'fa-wave-square',
      color: '#67e8f9',
      desc: 'Track server activity in one place with current telemetry, moderation events, and music runtime status.',
      cta: { label: 'Open Live Logs', target: 'logs' },
      items: [
        { name: 'Dashboard Events', desc: 'See command usage, automod triggers, and security activity.' },
        { name: 'Moderation Timeline', desc: 'Review recent cases and action history for the selected guild.' },
        { name: 'Music Runtime', desc: 'Watch active playback, queue state, and recent track telemetry.' }
      ]
    }
  ];

  const quickActions = [
    { label: 'Overview', icon: 'fa-chart-pie', target: 'overview' },
    { label: 'Command Center', icon: 'fa-terminal', target: 'commands' },
    { label: 'Protection', icon: 'fa-shield-halved', target: 'protection' },
    { label: 'Music', icon: 'fa-music', target: 'music' }
  ];

  return (
    <div className="docs-container animate-fade-in">
      <div className="command-hero glass-panel docs-hero">
        <div>
          <p className="command-eyebrow">Zenith Operator Guide</p>
          <h2 className="glow-text">Documentation & Help</h2>
          <p className="subtitle">Shortcuts to the parts of Zenith you actually use, plus quick explanations for what each area controls.</p>
        </div>
        <div className="docs-quick-actions">
          {quickActions.map((action) => (
            <button
              key={action.target}
              type="button"
              className="docs-action-btn"
              onClick={() => onOpenSection?.(action.target)}
            >
              <i className={`fa-solid ${action.icon}`} />
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="docs-grid">
        {sections.map((section) => (
          <div key={section.title} className="glass-panel docs-card docs-card-expanded">
            <div className="docs-card-top">
              <div className="section-title">
                <i className={`fa-solid ${section.icon}`} style={{ color: section.color }}></i>
                <h3>{section.title}</h3>
              </div>
              <button
                type="button"
                className="btn-secondary docs-inline-btn"
                onClick={() => onOpenSection?.(section.cta.target)}
              >
                {section.cta.label}
              </button>
            </div>

            <p className="subtitle">{section.desc}</p>

            <div className="docs-content">
              {section.items.map((item) => (
                <div key={item.name} className="doc-item">
                  <span className="feat-name">{item.name}</span>
                  <p className="feat-desc">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
