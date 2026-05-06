import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Overview from '../components/Overview';
import Moderation from '../components/Moderation';
import LandingOverlay from '../components/LandingOverlay';
import Docs from '../components/Docs';
import CommandCenter from '../components/CommandCenter';
import Logs from '../components/Logs';
import Protection from '../components/Protection';
import Music from '../components/Music';
import { apiGet, apiPreload } from '../lib/api';

const guildCacheKey = 'zenith_dashboard_guilds';
const userCacheKey = 'zenith_dashboard_user';

function readCachedGuilds() {
  try {
    return JSON.parse(sessionStorage.getItem(guildCacheKey) || '[]');
  } catch {
    return [];
  }
}

function readCachedUser() {
  try {
    return JSON.parse(sessionStorage.getItem(userCacheKey) || 'null');
  } catch {
    return null;
  }
}

function mapGuilds(guilds) {
  return guilds
    .filter((guild) => guild.hasBot)
    .map((guild) => ({
      id: guild.id,
      name: guild.name,
      icon: guild.iconUrl || guild.icon,
      hasBot: guild.hasBot,
      memberCount: guild.memberCount,
      onlineCount: guild.onlineCount
    }));
}

function preloadGuildDashboard(guildId) {
  if (!guildId) return;
  apiPreload(`/api/guilds/${guildId}/overview`);
  apiPreload(`/api/guilds/${guildId}/config`);
  apiPreload(`/api/guilds/${guildId}/commands`);
  apiPreload(`/api/guilds/${guildId}/music`);
}

function LoadingScreen() {
  return (
    <div className="loading-stage">
      <div className="loading-orb">
        <span>Z</span>
      </div>
      <div className="loading-copy">
        <p className="topbar-eyebrow">Zenith Control Surface</p>
        <h1>Syncing your command deck</h1>
        <p>Checking bot servers, session access, and dashboard routes.</p>
      </div>
      <div className="loading-steps">
        <span>Auth</span>
        <span>Guilds</span>
        <span>Modules</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const cachedGuilds = readCachedGuilds();
  const cachedUser = readCachedUser();
  const savedGuildId = localStorage.getItem('monarch_guild_id');
  const initialGuildId = cachedGuilds.some((guild) => guild.id === savedGuildId) ? savedGuildId : null;
  const [user, setUser] = useState({
    username: cachedUser?.username || 'Loading...',
    avatar: cachedUser?.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png',
    allowedGuilds: cachedGuilds
  });
  const [selectedGuild, setSelectedGuild] = useState(initialGuildId);
  const [activePage, setActivePage] = useState('overview');
  const [showLanding, setShowLanding] = useState(cachedGuilds.length > 0 && !initialGuildId);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(cachedGuilds.length === 0);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const data = await apiGet('/api/guilds');
        const guilds = mapGuilds(data.guilds || []);
        const profile = data.user || {};
        const nextUser = {
          id: profile.id,
          username: profile.username || 'Discord User',
          avatar: profile.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'
        };

        sessionStorage.setItem(guildCacheKey, JSON.stringify(guilds));
        sessionStorage.setItem(userCacheKey, JSON.stringify(nextUser));

        setUser({
          ...nextUser,
          allowedGuilds: guilds
        });

        const savedGuild = localStorage.getItem('monarch_guild_id');
        if (savedGuild && guilds.some((guild) => guild.id === savedGuild)) {
          setSelectedGuild(savedGuild);
          setShowLanding(false);
          preloadGuildDashboard(savedGuild);
        } else {
          localStorage.removeItem('monarch_guild_id');
          setShowLanding(true);
        }
      } catch (error) {
        console.error('[Dashboard Bootstrap]', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [navigate]);

  const handleGuildSelect = (guildId) => {
    localStorage.setItem('monarch_guild_id', guildId);
    setSelectedGuild(guildId);
    setShowLanding(false);
    preloadGuildDashboard(guildId);
  };

  const pageTitleMap = {
    overview: 'Dashboard Overview',
    moderation: 'Server Moderation',
    protection: 'Protection Center',
    music: 'Music Control',
    commands: 'Command Center',
    logs: 'Live Logs',
    docs: 'Documentation & Help'
  };

  const requiresGuild = ['overview', 'moderation', 'protection', 'music', 'logs', 'commands'].includes(activePage);
  const canRenderPage = !showLanding && (!requiresGuild || selectedGuild);

  if (loading) return <LoadingScreen />;

  return (
    <div className="app-container">
      {showLanding && <LandingOverlay guilds={user.allowedGuilds} onSelectGuild={handleGuildSelect} />}
      
      <Sidebar 
        user={user} 
        selectedGuild={selectedGuild} 
        onSelectGuild={handleGuildSelect} 
        activePage={activePage} 
        setActivePage={setActivePage} 
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button 
              className="mobile-only" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ background: 'none', border: 'none', color: '#DBDEE1', fontSize: '1.4rem', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <i className="fa-solid fa-bars"></i>
            </button>
            <div className="topbar-title-wrap">
              <p className="topbar-eyebrow">MonarchClient Control Surface</p>
              <h1 style={{ margin: 0 }}>{pageTitleMap[activePage] || 'Zenith Dashboard'}</h1>
            </div>
          </div>
          <div className="topbar-actions">
            
            {selectedGuild && user && (
              <div className="mobile-guild-selector mobile-only" onClick={() => { localStorage.removeItem('monarch_guild_id'); setShowLanding(true); }}>
                <img 
                src={user.allowedGuilds.find(g => g.id === selectedGuild)?.icon 
                    ? user.allowedGuilds.find(g => g.id === selectedGuild).icon 
                    : 'https://cdn.discordapp.com/embed/avatars/0.png'} 
                  alt="" 
                />
                <span>{user.allowedGuilds.find(g => g.id === selectedGuild)?.name || 'Server'}</span>
              </div>
            )}
            
            {requiresGuild && (
              <button
                className="btn-icon"
                onClick={() => window.location.reload()}
                title="Reload Page"
              >
                <i className="fa-solid fa-rotate-right"></i>
              </button>
            )}
            
          </div>
        </header>

        <div className="content-area">
          {canRenderPage && (
            <>
              {activePage === 'overview' && <Overview selectedGuild={selectedGuild} />}
              {activePage === 'moderation' && <Moderation selectedGuild={selectedGuild} />}
              {activePage === 'protection' && <Protection selectedGuild={selectedGuild} />}
              {activePage === 'music' && <Music selectedGuild={selectedGuild} />}
              {activePage === 'commands' && <CommandCenter selectedGuild={selectedGuild} />}
              {activePage === 'logs' && <Logs selectedGuild={selectedGuild} />}
              {activePage === 'docs' && <Docs onOpenSection={(page) => setActivePage(page)} />}
            </>
          )}

          {!showLanding && requiresGuild && !selectedGuild && (
            <div className="dashboard-empty-state glass-panel">
              <div className="dashboard-empty-icon">
                <i className="fa-solid fa-building-shield"></i>
              </div>
              <h2>Select a Server</h2>
              <p>Pick a guild to open moderation analytics, automod controls, and server-specific insights.</p>
              <button
                className="btn-primary"
                onClick={() => {
                  localStorage.removeItem('monarch_guild_id');
                  setShowLanding(true);
                }}
              >
                Choose Server
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

