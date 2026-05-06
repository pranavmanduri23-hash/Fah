import React, { useEffect, useState } from 'react';
import { apiGet, apiPatch } from '../lib/api';
import ControlSelect from './ControlSelect';

const punishmentOptions = [
  { value: 'ban', label: 'Ban', description: 'Remove the executor from the server completely.' },
  { value: 'kick', label: 'Kick', description: 'Kick the executor without banning them.' },
  { value: 'removeroles', label: 'Remove roles', description: 'Strip roles when a full punish is too aggressive.' }
];

const thresholdMeta = {
  roleCreate: { label: 'Role creates', description: 'Trips when someone mass-creates roles.' },
  roleUpdate: { label: 'Role updates', description: 'Catches repeated dangerous role edits or grants.' },
  roleDelete: { label: 'Role deletes', description: 'Reacts to mass role removal or cleanup abuse.' },
  channelCreate: { label: 'Channel creates', description: 'Limits how many channels can be spawned quickly.' },
  channelUpdate: { label: 'Channel updates', description: 'Protects channel names, topics, slowmode, and other edits.' },
  channelDelete: { label: 'Channel deletes', description: 'Stops wipe attacks that remove channels rapidly.' },
  webhookCreate: { label: 'Webhook creates', description: 'Reserved for webhook spam or stealth setup attempts.' },
  webhookUpdate: { label: 'Webhook updates', description: 'Catches webhook edits or mass webhook abuse.' },
  bans: { label: 'Bans', description: 'Blocks repeated unauthorized ban actions.' },
  kicks: { label: 'Kicks', description: 'Tracks kick waves and prune-style removals.' },
  botAdd: { label: 'Bot adds', description: 'Usually keep this at 1 to block unauthorized bot invites instantly.' }
};

const responseMeta = {
  lockdown: {
    label: 'Server lockdown',
    description: 'Temporarily lock send/connect permissions when a threshold is tripped.'
  },
  removeRoles: {
    label: 'Strip roles first',
    description: 'Remove the executor’s roles before or alongside the main punishment.'
  },
  alertOnly: {
    label: 'Alert only',
    description: 'Log and notify without punishing the executor.'
  }
};

const thresholdOrder = [
  'botAdd',
  'bans',
  'kicks',
  'webhookCreate',
  'webhookUpdate',
  'channelCreate',
  'channelUpdate',
  'channelDelete',
  'roleCreate',
  'roleUpdate',
  'roleDelete'
];

export default function Security({ selectedGuild }) {
  const [antiNuke, setAntiNuke] = useState(null);
  const [original, setOriginal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!selectedGuild) return;
      try {
        setLoading(true);
        const data = await apiGet(`/api/guilds/${selectedGuild}/config`);
        const next = data.antiNuke || { enabled: false };
        setAntiNuke(next);
        setOriginal(JSON.parse(JSON.stringify(next)));
        setHasChanges(false);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedGuild]);

  const update = (next) => {
    setAntiNuke(next);
    setHasChanges(JSON.stringify(next) !== JSON.stringify(original));
  };

  const save = async () => {
    const data = await apiPatch(`/api/guilds/${selectedGuild}/config`, { guild: {}, antiNuke });
    const next = data.antiNuke || antiNuke;
    setAntiNuke(next);
    setOriginal(JSON.parse(JSON.stringify(next)));
    setHasChanges(false);
  };

  if (loading || !antiNuke) return <div className="loader">Loading Security Controls...</div>;

  const thresholds = antiNuke.thresholds || {};
  const responseEntries = Object.entries(antiNuke.responses || {});
  const orderedThresholdEntries = thresholdOrder
    .filter((key) => key in thresholds)
    .map((key) => [key, thresholds[key]]);
  const extraThresholdEntries = Object.entries(thresholds).filter(([key]) => !thresholdOrder.includes(key));
  const thresholdEntries = [...orderedThresholdEntries, ...extraThresholdEntries];

  const updateThreshold = (key, value) => {
    const safeValue = Number.isFinite(value) ? Math.max(1, value) : 1;
    update({
      ...antiNuke,
      thresholds: {
        ...antiNuke.thresholds,
        [key]: safeValue
      }
    });
  };

  const updateResponse = (key, value) => {
    update({
      ...antiNuke,
      responses: {
        ...antiNuke.responses,
        [key]: value
      }
    });
  };

  const updateWhitelist = (rawValue) => {
    const whitelistusers = rawValue
      .split(/[\s,]+/)
      .map((entry) => entry.trim())
      .filter(Boolean);

    update({
      ...antiNuke,
      whitelistusers
    });
  };

  return (
    <div className="automod-container animate-fade-in">
      <div className="automod-header">
        <div className="header-info">
          <h2 className="glow-text">Security & Anti-Nuke</h2>
          <p className="subtitle">Controls are saved to the anti-nuke profile used by the bot's destructive-action listeners.</p>
          <div className="runtime-note"><i className="fa-solid fa-circle-check" /> Runtime-backed security config</div>
        </div>
        <label className="main-toggle">
          <input type="checkbox" checked={!!antiNuke.enabled} onChange={() => update({ ...antiNuke, enabled: !antiNuke.enabled })} />
          <span className="slider"></span>
        </label>
      </div>

      <div className="automod-grid">
        <div className="glass-panel mod-section">
          <div className="section-title"><i className="fa-solid fa-hammer"></i><h3>Response Policy</h3></div>
          <ControlSelect
            label="Punishment"
            value={antiNuke.punishment || 'ban'}
            options={punishmentOptions}
            onChange={(nextPunishment) => update({ ...antiNuke, punishment: nextPunishment })}
            inlineMenu
          />
          <div className="config-item">
            <label>Security log channel</label>
            <input type="text" value={antiNuke.logchannelid || ''} placeholder="Channel ID" onChange={(event) => update({ ...antiNuke, logchannelid: event.target.value })} />
          </div>
          <label className="config-item inline-check">
            <span className="label-sm">Vanity guard</span>
            <input
              type="checkbox"
              checked={!!antiNuke.antivanity}
              onChange={() => update({ ...antiNuke, antivanity: !antiNuke.antivanity })}
            />
          </label>
          <div className="runtime-note"><i className="fa-solid fa-siren-on"></i> Thresholds are counted per executor over a rolling 10 second window.</div>
        </div>

        <div className="glass-panel mod-section">
          <div className="section-title"><i className="fa-solid fa-gauge-high"></i><h3>Thresholds</h3></div>
          <div className="filter-list">
            {thresholdEntries.length === 0 && (
              <div className="empty-mini">
                <i className="fa-solid fa-shield-heart" />
                <span>Using the bot's built-in threshold defaults.</span>
              </div>
            )}
            {thresholdEntries.map(([key, value]) => (
              <div key={key} className="filter-card active">
                <div className="filter-main">
                  <i className="fa-solid fa-shield"></i>
                  <div style={{ flex: 1 }}>
                    <span>{thresholdMeta[key]?.label || key}</span>
                    <p className="ov-subtitle">{thresholdMeta[key]?.description || 'Controls how many times this action can happen before Anti-Nuke escalates.'}</p>
                  </div>
                </div>
                <div className="filter-settings">
                  <label className="config-item">
                    <span className="label-sm">Allowed actions</span>
                    <input
                      type="number"
                      min="1"
                      value={value}
                      onChange={(event) => updateThreshold(key, Number(event.target.value))}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel mod-section full-width">
          <div className="section-title"><i className="fa-solid fa-list-check"></i><h3>Response Toggles</h3></div>
          <div className="actions-grid">
            {responseEntries.length === 0 && (
              <div className="empty-mini">
                <i className="fa-solid fa-bolt" />
                <span>No custom response toggles are configured yet.</span>
              </div>
            )}
            {responseEntries.map(([key, value]) => (
              <div key={key} className="action-row">
                <div className="action-info" style={{ alignItems: 'flex-start' }}>
                  <i className="fa-solid fa-bolt"></i>
                  <div>
                    <span>{responseMeta[key]?.label || key}</span>
                    <p className="ov-subtitle" style={{ margin: '4px 0 0 0' }}>
                      {responseMeta[key]?.description || 'Toggle this Anti-Nuke response behavior.'}
                    </p>
                  </div>
                </div>
                <label className="toggle-sm">
                  <input type="checkbox" checked={!!value} onChange={() => updateResponse(key, !value)} />
                  <span className="slider"></span>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel mod-section full-width">
          <div className="section-title"><i className="fa-solid fa-user-check"></i><h3>Trust & Whitelist</h3></div>
          <div className="filter-list">
            <div className="filter-card active">
              <div className="filter-main">
                <i className="fa-solid fa-user-shield"></i>
                <div style={{ flex: 1 }}>
                  <span>Whitelisted Users</span>
                  <p className="ov-subtitle">User IDs listed here are trusted by Anti-Nuke and will not be punished. Separate IDs with commas or spaces.</p>
                </div>
              </div>
              <div className="filter-settings" style={{ gridTemplateColumns: '1fr' }}>
                <label className="config-item">
                  <span className="label-sm">Trusted user IDs</span>
                  <textarea
                    rows="4"
                    value={(antiNuke.whitelistusers || []).join(', ')}
                    placeholder="123456789012345678, 987654321098765432"
                    onChange={(event) => updateWhitelist(event.target.value)}
                  />
                </label>
              </div>
              <div className="runtime-note"><i className="fa-solid fa-circle-info"></i> {antiNuke.whitelistusers?.length || 0} trusted user(s) configured.</div>
            </div>
          </div>
        </div>
      </div>

      <div className={`save-bar-container ${hasChanges ? 'visible' : ''}`}>
        <div className="save-bar">
          <div className="save-bar-text"><i className="fa-solid fa-triangle-exclamation"></i><span>You have unsaved security changes.</span></div>
          <div className="save-bar-actions"><button className="btn-revert" onClick={() => update(JSON.parse(JSON.stringify(original)))}>Revert</button><button className="btn-save" onClick={save}>Save Changes</button></div>
        </div>
      </div>
    </div>
  );
}
