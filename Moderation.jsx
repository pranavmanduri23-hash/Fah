import React, { useEffect, useMemo, useState } from 'react';
import { apiGet } from '../lib/api';

export default function Moderation({ selectedGuild }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!selectedGuild) return;
      try {
        setLoading(true);
        const data = await apiGet(`/api/guilds/${selectedGuild}/overview`);
        setCases(data.recentCases || []);
      } catch (error) {
        console.error('[Monarch Moderation]', error);
        setCases([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [selectedGuild]);

  const filteredCases = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return cases.filter((entry) =>
      [entry.userId, entry.moderatorId, entry.action, entry.reason, String(entry.caseId)].join(' ').toLowerCase().includes(q)
    );
  }, [cases, searchTerm]);

  if (loading) return <div className="loader">Loading Moderation Records...</div>;

  return (
    <div className="moderation-container animate-fade-in">
      <div className="section-header">
        <h2 className="glow-text"><i className="fa-solid fa-gavel"></i> Server Moderation</h2>
        <p className="subtitle">Audit recent moderation cases recorded by MonarchClient.</p>
      </div>

      <div className="tabs-container">
        <button className="tab-btn active"><i className="fa-solid fa-folder-open"></i> Moderation Cases</button>
      </div>

      <div className="glass-panel search-bar-container">
        <i className="fa-solid fa-magnifying-glass"></i>
        <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} type="text" placeholder="Search cases..." className="search-input" />
      </div>

      <div className="cases-list">
        {filteredCases.length > 0 ? filteredCases.map((entry) => (
          <div key={`${entry.caseId}-${entry.userId}`} className="glass-panel case-row">
            <div className="case-id">#{entry.caseId}</div>
            <div className="case-action-badge" data-action={(entry.action || '').toUpperCase()}>{entry.action}</div>
            <div className="case-user">
              <span className="user-tag">{entry.userId}</span>
              <span className="user-id">Target ID</span>
            </div>
            <div className="case-reason">{entry.reason || 'No reason provided.'}</div>
            <div className="case-mod"><span className="mod-label">Mod:</span><span className="mod-tag">{entry.moderatorId}</span></div>
            <div className="case-date">{new Date(entry.date).toLocaleDateString()}</div>
          </div>
        )) : (
          <div className="glass-panel no-results">No moderation cases found.</div>
        )}
      </div>
    </div>
  );
}
