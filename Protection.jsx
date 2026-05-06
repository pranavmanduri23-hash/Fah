import React, { useState } from 'react';
import AutoModeration from './AutoModeration';
import Security from './Security';
import Permissions from './Permissions';
import Onboarding from './Onboarding';

const tabs = [
  { id: 'automod', label: 'Message Guard', icon: 'fa-shield-halved', desc: 'Spam, mentions, links, caps' },
  { id: 'security', label: 'Anti-Nuke', icon: 'fa-lock', desc: 'Raid response and punishment' },
  { id: 'permissions', label: 'Command Rules', icon: 'fa-sliders', desc: 'Disabled commands and channels' },
  { id: 'onboarding', label: 'Onboarding', icon: 'fa-door-open', desc: 'Welcome, roles, tickets, apps' }
];

export default function Protection({ selectedGuild }) {
  const [activeTab, setActiveTab] = useState('automod');

  return (
    <div className="protection-suite animate-fade-in">
      <div className="suite-hero glass-panel">
        <div>
          <p className="command-eyebrow">AIO Protection Suite</p>
          <h2 className="glow-text">Protection Center</h2>
          <p className="subtitle">Runtime-backed controls for message filters, anti-nuke response, command access, and member onboarding.</p>
        </div>
        <div className="suite-tab-grid">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`suite-tab ${activeTab === tab.id ? 'active' : ''}`}
              type="button"
              onClick={() => setActiveTab(tab.id)}
            >
              <i className={`fa-solid ${tab.icon}`} />
              <span>{tab.label}</span>
              <small>{tab.desc}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="suite-panel">
        {activeTab === 'automod' && <AutoModeration selectedGuild={selectedGuild} />}
        {activeTab === 'security' && <Security selectedGuild={selectedGuild} />}
        {activeTab === 'permissions' && <Permissions selectedGuild={selectedGuild} />}
        {activeTab === 'onboarding' && <Onboarding selectedGuild={selectedGuild} />}
      </div>
    </div>
  );
}
