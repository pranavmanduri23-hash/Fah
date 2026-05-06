import React, { useEffect, useMemo, useState } from 'react';
import commandCatalog from '../data/commandCatalog';
import { apiGet } from '../lib/api';

function CommandDetailsModal({ command, disabled, onClose }) {
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!command) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card glass-panel command-modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="command-modal-header">
          <div>
            <p className="command-eyebrow">Command Details</p>
            <h2>/{command.name}</h2>
            <p className="modal-subtitle">{command.description}</p>
          </div>
          <button type="button" className="btn-icon command-modal-close" onClick={onClose} aria-label="Close command details">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="command-modal-meta">
          <div className="command-modal-stat">
            <span className="command-meta-label">Status</span>
            <strong>{disabled ? 'Disabled in this server' : 'Ready to use'}</strong>
          </div>
          <div className="command-modal-stat">
            <span className="command-meta-label">Category</span>
            <strong>{command.category || 'General'}</strong>
          </div>
          <div className="command-modal-stat">
            <span className="command-meta-label">Cooldown</span>
            <strong>{command.cooldown || 0}s</strong>
          </div>
          <div className="command-modal-stat">
            <span className="command-meta-label">Access</span>
            <strong>{command.ownerOnly ? 'Owner only' : 'Server users'}</strong>
          </div>
        </div>

        <div className="command-modal-grid">
          <div className="command-modal-panel">
            <span className="command-meta-label">Aliases</span>
            <p>{command.aliases?.length ? command.aliases.join(', ') : 'No aliases configured.'}</p>
          </div>
          <div className="command-modal-panel">
            <span className="command-meta-label">Slash Support</span>
            <p>{command.slash ? 'Available as a slash command.' : 'Text command only.'}</p>
          </div>
        </div>

        <div className="command-modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function CommandCenter({ selectedGuild }) {
  const [commands, setCommands] = useState(commandCatalog);
  const [disabledCommands, setDisabledCommands] = useState([]);
  const [disabledChannels, setDisabledChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedCommand, setSelectedCommand] = useState(null);

  useEffect(() => {
    const fetchCommands = async () => {
      try {
        setLoading(true);
        const data = selectedGuild ? await apiGet(`/api/guilds/${selectedGuild}/commands`) : null;
        setCommands(data?.commands || commandCatalog);
        setDisabledCommands(data?.disabledCommands || []);
        setDisabledChannels(data?.disabledChannels || []);
      } catch (error) {
        console.error('[Monarch Command Center]', error);
        setCommands(commandCatalog);
      } finally {
        setLoading(false);
      }
    };

    fetchCommands();
  }, [selectedGuild]);

  useEffect(() => {
    setSelectedCommand(null);
  }, [selectedGuild]);

  const categories = useMemo(
    () => ['All', ...new Set(commands.map((command) => command.category || 'General'))].sort(),
    [commands]
  );

  const filteredCommands = useMemo(() => {
    return commands.filter((command) => {
      const haystack = [
        command.name,
        command.description,
        command.category,
        ...(command.aliases || [])
      ].join(' ').toLowerCase();
      return haystack.includes(query.toLowerCase()) && (categoryFilter === 'All' || command.category === categoryFilter);
    });
  }, [commands, query, categoryFilter]);

  const isDisabled = (command) => disabledCommands.includes(command.name);
  const categoryCount = Math.max(categories.length - 1, 0);

  if (loading) return <div className="loader">Loading Command Center...</div>;

  return (
    <>
      <div className="command-center animate-fade-in">
        <div className="command-hero glass-panel">
          <div>
            <p className="command-eyebrow">MonarchClient Catalog</p>
            <h2 className="glow-text">Command Center</h2>
            <p className="subtitle">Search the full command deck, inspect aliases and cooldowns, and open a clean details view for each command.</p>
          </div>
          <div className="command-hero-stats">
            <div className="command-stat-chip"><strong>{commands.length}</strong><span>Total Commands</span></div>
            <div className="command-stat-chip"><strong>{disabledCommands.length}</strong><span>Disabled</span></div>
            <div className="command-stat-chip"><strong>{categoryCount}</strong><span>Categories</span></div>
          </div>
        </div>

        <div className="command-toolbar glass-panel">
          <div className="command-search">
            <i className="fa-solid fa-magnifying-glass" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search commands, aliases, or descriptions..."
            />
          </div>
        </div>

        <div className="glass-panel command-filter-bar">
          <div className="command-filter-buttons">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={`tab-btn command-filter-btn ${categoryFilter === category ? 'active' : ''}`}
                onClick={() => setCategoryFilter(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="command-grid">
          {filteredCommands.map((command) => (
            <button
              key={command.name}
              type="button"
              className="glass-panel command-card command-card-button"
              onClick={() => setSelectedCommand(command)}
            >
              <div className="command-card-top">
                <div>
                  <div className="command-card-name-row">
                    <h3>/{command.name}</h3>
                    <span className={`command-badge ${isDisabled(command) ? 'disabled' : 'ready'}`}>
                      {isDisabled(command) ? 'Disabled' : 'Ready'}
                    </span>
                  </div>
                  <p className="command-category">{command.category || 'General'}</p>
                </div>
                <div className="command-cooldown">{command.cooldown || 0}s</div>
              </div>
              <p className="command-description">{command.description}</p>
              <div className="command-meta-list">
                <div className="command-alias-card">
                  <span className="command-meta-label">Aliases</span>
                  <span className="command-meta-value">{command.aliases?.length ? command.aliases.slice(0, 8).join(', ') : 'No aliases'}</span>
                </div>
              </div>
              <div className="command-card-footer">
                <span className="command-inline-note">
                  <i className="fa-solid fa-arrow-up-right-from-square" />
                  Open details
                </span>
              </div>
            </button>
          ))}
        </div>

        {!filteredCommands.length && (
          <div className="glass-panel command-empty">
            <i className="fa-solid fa-magnifying-glass" />
            <p>No commands matched your current search.</p>
          </div>
        )}

        <div className="glass-panel command-empty">
          <i className="fa-solid fa-hashtag" />
          <p>{disabledChannels.length} disabled channel restriction{disabledChannels.length === 1 ? '' : 's'} are configured for this server.</p>
        </div>
      </div>

      <CommandDetailsModal
        command={selectedCommand}
        disabled={selectedCommand ? isDisabled(selectedCommand) : false}
        onClose={() => setSelectedCommand(null)}
      />
    </>
  );
}
