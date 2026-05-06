import React, { useEffect, useState } from 'react';
import { apiGet } from '../lib/api';

export default function Logs({ selectedGuild }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!selectedGuild) return;
      setLoading(true);
      const data = await apiGet(`/api/guilds/${selectedGuild}/overview`);
      const events = data.recentEvents || [];
      const cases = (data.recentCases || []).map((entry) => ({
        type: 'moderation.case',
        summary: `Case #${entry.caseId}: ${entry.action} on ${entry.userId}`,
        severity: 'warning',
        createdAt: entry.date
      }));
      setLogs([...events, ...cases].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setLoading(false);
    };
    load();
  }, [selectedGuild]);

  if (loading) return <div className="loader">Loading Live Logs...</div>;

  return (
    <div className="moderation-container animate-fade-in">
      <div className="section-header"><h2 className="glow-text"><i className="fa-solid fa-stream"></i> Live Logs</h2><p className="subtitle">Merged event stream from MonarchClient dashboard telemetry and moderation cases.</p></div>
      <div className="cases-list">
        {logs.map((entry) => (
          <div key={`${entry.type}-${entry.summary}-${entry.createdAt}`} className="glass-panel case-row">
            <div className="case-action-badge" data-action={(entry.severity || 'info').toUpperCase()}>{entry.severity || 'info'}</div>
            <div className="case-user"><span className="user-tag">{entry.type}</span><span className="user-id">{new Date(entry.createdAt).toLocaleString()}</span></div>
            <div className="case-reason">{entry.summary}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
