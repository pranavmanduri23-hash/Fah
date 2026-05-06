import React, { useEffect, useState } from 'react';
import { apiGet } from '../lib/api';

export default function Permissions({ selectedGuild }) {
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

  if (loading || !config) return <div className="loader">Loading Permission Map...</div>;

  const permissions = config.dashboard?.commandPermissions || {};
  const cooldowns = config.dashboard?.commandCooldowns || {};
  const disabledChannels = config.disabledChannels || [];
  const rows = [
    ['Permission rules', Object.keys(permissions).length, 'Role or user based command access rules'],
    ['Cooldown overrides', Object.keys(cooldowns).length, 'Custom command cooldown behavior'],
    ['Disabled channels', disabledChannels.length, 'Channels where commands are restricted']
  ];

  return (
    <div className="command-center animate-fade-in">
      <div className="command-hero glass-panel">
        <div><p className="command-eyebrow">MonarchClient Controls</p><h2 className="glow-text">Permission Manager</h2><p className="subtitle">Review command permissions, cooldown overrides, and channel restrictions.</p></div>
        <div className="command-hero-stats">
          <div className="command-stat-chip"><strong>{Object.keys(permissions).length}</strong><span>Permission Rules</span></div>
          <div className="command-stat-chip"><strong>{Object.keys(cooldowns).length}</strong><span>Cooldown Overrides</span></div>
          <div className="command-stat-chip"><strong>{config.disabledChannels?.length || 0}</strong><span>Disabled Channels</span></div>
        </div>
      </div>

      <div className="ops-card-grid">
        {rows.map(([label, value, desc]) => (
          <div key={label} className="ops-card glass-panel">
            <span className="ops-card-kicker">{label}</span>
            <strong>{value}</strong>
            <p>{desc}</p>
          </div>
        ))}
      </div>

      <div className="glass-panel ops-table">
        <div className="ops-table-header">
          <h3>Permission Map</h3>
          <span>Read-only view</span>
        </div>
        <div className="ops-list">
          {Object.keys(permissions).length || Object.keys(cooldowns).length || disabledChannels.length ? (
            <>
              {Object.entries(permissions).map(([command, rule]) => (
                <div key={`perm-${command}`} className="ops-list-row">
                  <span>/{command}</span>
                  <p>{JSON.stringify(rule)}</p>
                </div>
              ))}
              {Object.entries(cooldowns).map(([command, rule]) => (
                <div key={`cooldown-${command}`} className="ops-list-row">
                  <span>{command} cooldown</span>
                  <p>{JSON.stringify(rule)}</p>
                </div>
              ))}
              {disabledChannels.map((channel) => (
                <div key={channel} className="ops-list-row">
                  <span>Disabled channel</span>
                  <p>{channel}</p>
                </div>
              ))}
            </>
          ) : (
            <div className="ops-empty">No permission overrides configured for this server.</div>
          )}
        </div>
      </div>
    </div>
  );
}
