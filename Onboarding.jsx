import React, { useEffect, useState } from 'react';
import { apiGet } from '../lib/api';

export default function Onboarding({ selectedGuild }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!selectedGuild) return;
      setLoading(true);
      const data = await apiGet(`/api/guilds/${selectedGuild}/config`);
      setConfig(data.guild || {});
      setLoading(false);
    };
    load();
  }, [selectedGuild]);

  if (loading || !config) return <div className="loader">Loading Onboarding Systems...</div>;

  const workflows = [
    {
      key: 'welcome',
      title: 'Welcome Messages',
      enabled: Boolean(config.welcome?.channel || config.welcome?.content),
      details: [config.welcome?.channel ? `Channel: ${config.welcome.channel}` : 'No welcome channel', config.welcome?.content ? 'Message configured' : 'No welcome copy']
    },
    {
      key: 'autorole',
      title: 'Autorole',
      enabled: Boolean(config.autorole?.enabled),
      details: [`Bot roles: ${config.autorole?.botRoles?.length || 0}`, `Human roles: ${config.autorole?.humanRoles?.length || 0}`]
    },
    {
      key: 'tickets',
      title: 'Tickets',
      enabled: Boolean(config.tickets?.enabled),
      details: [`Category: ${config.tickets?.categoryId || 'Not set'}`, `Counter: ${config.tickets?.counter || 0}`]
    },
    {
      key: 'applications',
      title: 'Applications',
      enabled: Boolean(config.applications?.enabled),
      details: [`Panel: ${config.applications?.panelChannelId || 'Not set'}`, `${config.applications?.questions?.length || 0} questions`]
    }
  ];

  return (
    <div className="command-center animate-fade-in">
      <div className="command-hero glass-panel">
        <div><p className="command-eyebrow">Welcome Flow</p><h2 className="glow-text">Onboarding Systems</h2><p className="subtitle">Welcome messages, autoroles, ticket intake, and application workflow status.</p></div>
        <div className="command-hero-stats">
          <div className="command-stat-chip"><strong>{config.autorole?.enabled ? 'On' : 'Off'}</strong><span>Autorole</span></div>
          <div className="command-stat-chip"><strong>{config.tickets?.enabled ? 'On' : 'Off'}</strong><span>Tickets</span></div>
          <div className="command-stat-chip"><strong>{config.applications?.enabled ? 'On' : 'Off'}</strong><span>Applications</span></div>
        </div>
      </div>

      <div className="ops-card-grid">
        {workflows.map((workflow) => (
          <div key={workflow.key} className={`ops-card glass-panel ${workflow.enabled ? 'is-on' : ''}`}>
            <span className="ops-card-kicker">{workflow.enabled ? 'Enabled' : 'Inactive'}</span>
            <strong>{workflow.title}</strong>
            {workflow.details.map((detail) => <p key={detail}>{detail}</p>)}
          </div>
        ))}
      </div>
    </div>
  );
}
