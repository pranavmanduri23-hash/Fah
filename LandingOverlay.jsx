import React from 'react';

export default function LandingOverlay({ guilds, onSelectGuild }) {
  const availableGuilds = (guilds || []).filter((guild) => guild.hasBot !== false);

  return (
    <div className="modal-overlay server-picker-overlay">
      <div className="modal-card server-picker-card glass-panel pop-in">
        <h2>Welcome to Zenith</h2>
        <p className="modal-subtitle">Select a server where Monarch is already present.</p>
        
        {availableGuilds.length > 0 ? (
          <div className="landing-grid mt-4">
            {availableGuilds.map(g => (
            <div 
              key={g.id} 
              className="landing-guild-card" 
              onClick={() => onSelectGuild(g.id)}
            >
              {g.icon ? (
                <img src={g.icon} alt="Server Icon" />
              ) : (
                <div className="placeholder-icon">#</div>
              )}
              <h3>{g.name}</h3>
            </div>
            ))}
          </div>
        ) : (
          <div className="server-picker-empty">
            <div className="dashboard-empty-icon">
              <i className="fa-solid fa-robot"></i>
            </div>
            <h3>No bot servers found</h3>
            <p>Your Discord account has dashboard access, but Monarch is not present in any of those servers yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

