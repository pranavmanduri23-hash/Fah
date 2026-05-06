import React, { useEffect, useState } from 'react';
import { apiGet, apiPatch } from '../lib/api';
import ControlSelect from './ControlSelect';

const automodRules = [
  { id: 'spam', title: 'Spam Velocity', icon: 'fa-gauge-high', desc: 'Stops message bursts before they flood chat.', fields: ['enabled', 'maxMessages', 'intervalMs'] },
  { id: 'massMention', title: 'Mass Mentions', icon: 'fa-at', desc: 'Blocks mention raids and everyone pings.', fields: ['enabled', 'limit', 'blockEveryone'] },
  { id: 'inviteLinks', title: 'Invite Links', icon: 'fa-link-slash', desc: 'Filters Discord invite links from chat.', fields: ['enabled'] },
  { id: 'externalLinks', title: 'External Links', icon: 'fa-globe', desc: 'Optional web-link filtering for strict servers.', fields: ['enabled'] },
  { id: 'caps', title: 'Excessive Caps', icon: 'fa-font', desc: 'Catches loud all-caps spam after a safe length.', fields: ['enabled', 'minimumLength', 'ratio'] },
  { id: 'repeatedMessages', title: 'Repeated Messages', icon: 'fa-clone', desc: 'Detects copy-paste repeat spam.', fields: ['enabled', 'windowMs', 'threshold'] }
];

const fieldLabels = {
  maxMessages: 'Max messages',
  intervalMs: 'Time window (ms)',
  limit: 'Mention limit',
  blockEveryone: 'Block @everyone',
  minimumLength: 'Minimum length',
  ratio: 'Caps ratio',
  windowMs: 'Repeat window (ms)',
  threshold: 'Repeat limit'
};

const actionOptions = [
  { value: 'delete', label: 'Delete message', description: 'Remove the message and warn briefly in chat.' },
  { value: 'timeout', label: 'Timeout member', description: 'Delete the message and temporarily mute the member.' },
  { value: 'kick', label: 'Kick member', description: 'Delete the message and remove the member from the server.' },
  { value: 'ban', label: 'Ban member', description: 'Delete the message and permanently remove the member.' }
];

export default function AutoModeration({ selectedGuild }) {
  const [config, setConfig] = useState(null);
  const [originalConfig, setOriginalConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!selectedGuild) return;
      try {
        setLoading(true);
        const data = await apiGet(`/api/guilds/${selectedGuild}/config`);
        const automod = data.guild?.automod || { enabled: false };
        setConfig(automod);
        setOriginalConfig(JSON.parse(JSON.stringify(automod)));
        setHasChanges(false);
      } catch (error) {
        console.error('[Monarch AutoMod]', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [selectedGuild]);

  const updateConfig = (nextConfig) => {
    setConfig(nextConfig);
    setHasChanges(JSON.stringify(nextConfig) !== JSON.stringify(originalConfig));
  };

  const updateRule = (ruleId, field, value) => {
    updateConfig({
      ...config,
      [ruleId]: {
        ...(config?.[ruleId] || {}),
        [field]: value
      }
    });
  };

  const saveChanges = async () => {
    try {
      setSaving(true);
      const data = await apiPatch(`/api/guilds/${selectedGuild}/config`, {
        guild: { automod: config },
        antiNuke: {}
      });
      const automod = data.guild?.automod || config;
      setConfig(automod);
      setOriginalConfig(JSON.parse(JSON.stringify(automod)));
      setHasChanges(false);
    } catch (error) {
      console.error('[Save AutoMod]', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config) return <div className="loader">Loading Message Guard...</div>;

  return (
    <div className="automod-container animate-fade-in">
      <div className="automod-header">
        <div className="header-info">
          <h2 className="glow-text">Auto Moderation</h2>
          <p className="subtitle">These controls save into the same AutoMod config used by the bot's message listener.</p>
          <div className="runtime-note"><i className="fa-solid fa-circle-check" /> Live after save</div>
        </div>
        <label className="main-toggle">
          <input type="checkbox" checked={!!config.enabled} onChange={() => updateConfig({ ...config, enabled: !config.enabled })} />
          <span className="slider"></span>
        </label>
      </div>

      <div className="automod-grid">
        <div className="glass-panel mod-section full-width">
          <div className="section-title">
            <i className="fa-solid fa-bolt-lightning"></i>
            <h3>Defense Layers</h3>
          </div>
          <div className="filter-list">
            {automodRules.map((rule) => {
              const state = config[rule.id] || {};
              return (
                <div key={rule.id} className={`filter-card ${state.enabled !== false ? 'active' : ''}`}>
                  <div className="filter-main">
                    <i className={`fa-solid ${rule.icon}`}></i>
                    <div style={{ flex: 1 }}>
                      <span>{rule.title}</span>
                      <p className="ov-subtitle">{rule.desc}</p>
                    </div>
                    <label className="toggle-sm">
                      <input type="checkbox" checked={state.enabled !== false} onChange={() => updateRule(rule.id, 'enabled', state.enabled === false)} />
                      <span className="slider"></span>
                    </label>
                  </div>
                  <div className="filter-settings">
                    {rule.fields.filter((field) => field !== 'enabled').map((field) => {
                      const value = state[field];
                      if (typeof value === 'boolean') {
                        return (
                          <label key={field} className="config-item inline-check">
                            <span className="label-sm">{fieldLabels[field] || field}</span>
                            <input type="checkbox" checked={!!value} onChange={() => updateRule(rule.id, field, !value)} />
                          </label>
                        );
                      }

                      return (
                        <label key={field} className="config-item">
                          <span className="label-sm">{fieldLabels[field] || field}</span>
                          <input
                            type="number"
                            value={value ?? ''}
                            placeholder="Not set"
                            onChange={(event) => {
                              const raw = event.target.value;
                              updateRule(rule.id, field, raw === '' ? null : Number(raw));
                            }}
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-panel mod-section">
          <div className="section-title">
            <i className="fa-solid fa-list-check"></i>
            <h3>Exemptions</h3>
          </div>
          <div className="actions-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="action-row">
              <div className="action-info"><i className="fa-solid fa-hashtag"></i><span>Exempt Channels</span></div>
              <strong>{config.exemptChannels?.length || 0}</strong>
            </div>
            <div className="action-row">
              <div className="action-info"><i className="fa-solid fa-user-shield"></i><span>Exempt Roles</span></div>
              <strong>{config.exemptRoles?.length || 0}</strong>
            </div>
          </div>
        </div>

        <div className="glass-panel mod-section">
          <div className="section-title">
            <i className="fa-solid fa-gear"></i>
            <h3>Default Action</h3>
          </div>
          <ControlSelect
            label="Action mode"
            value={config.action || 'delete'}
            options={actionOptions}
            onChange={(nextAction) => updateConfig({ ...config, action: nextAction })}
          />
          <div className="config-item">
            <label>Timeout duration (ms)</label>
            <input type="number" value={config.timeoutDurationMs ?? 600000} onChange={(event) => updateConfig({ ...config, timeoutDurationMs: Number(event.target.value) })} />
          </div>
          <div className="config-item">
            <label>Log channel ID</label>
            <input
              type="text"
              value={config.logChannelId ?? ''}
              placeholder="Optional log channel ID"
              onChange={(event) => updateConfig({ ...config, logChannelId: event.target.value.trim() || null })}
            />
          </div>
        </div>
      </div>

      <div className={`save-bar-container ${hasChanges ? 'visible' : ''}`}>
        <div className="save-bar">
          <div className="save-bar-text"><i className="fa-solid fa-triangle-exclamation"></i><span>You have unsaved AutoMod changes.</span></div>
          <div className="save-bar-actions">
            <button className="btn-revert" onClick={() => updateConfig(JSON.parse(JSON.stringify(originalConfig)))}>Revert</button>
            <button className="btn-save" onClick={saveChanges}>{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
