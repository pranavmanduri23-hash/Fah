import React, { useEffect, useState } from 'react';
import { apiGet } from '../lib/api';

export default function Overview({ selectedGuild }) {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!selectedGuild) return;
      try {
        setLoading(true);
        setOverview(await apiGet(`/api/guilds/${selectedGuild}/overview`));
      } catch (error) {
        console.error('[Monarch Overview]', error);
        setOverview(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [selectedGuild]);

  if (loading) {
    return (
      <div className="overview-loading">
        <div className="loading-spinner" />
        <p>Loading MonarchClient analytics...</p>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="overview-loading">
        <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '2rem', color: '#f59e0b', marginBottom: '12px' }} />
        <p>Unable to load server analytics. Try refreshing.</p>
      </div>
    );
  }

  const metrics = overview.metrics || {};
  const charts = overview.charts || [];
  const maxValue = Math.max(
    ...charts.flatMap((point) => [point.commands || 0, point.security || 0, point.automod || 0, point.moderation || 0]),
    1
  );
  const chartSeries = [
    ['commands', 'Commands', '#38bdf8'],
    ['automod', 'AutoMod', '#34d399'],
    ['security', 'Security', '#f97316'],
    ['moderation', 'Moderation', '#a78bfa']
  ];

  return (
    <div className="ov-container">
      <div className="ov-stats-grid">
        {[
          ['fa-terminal', 'Commands', metrics.totalCommands || 0, 'rgba(56, 189, 248, 0.12)', '#38bdf8'],
          ['fa-shield-halved', 'AutoMod Triggers', metrics.automodTriggers || 0, 'rgba(103, 232, 249, 0.12)', '#67e8f9'],
          ['fa-gavel', 'Moderation Actions', metrics.moderationActions || 0, 'rgba(245, 158, 11, 0.12)', '#f59e0b'],
          ['fa-lock', 'Security Alerts', metrics.securityAlerts || 0, 'rgba(239, 68, 68, 0.12)', '#ef4444']
        ].map(([icon, label, value, background, color]) => (
          <div key={label} className="ov-stat-card glass-panel">
            <div className="ov-stat-icon" style={{ background, color }}>
              <i className={`fa-solid ${icon}`} />
            </div>
            <div className="ov-stat-info">
              <span className="ov-stat-label">{label}</span>
              <span className="ov-stat-value">{value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="ov-charts-row">
        <div className="ov-chart-card glass-panel">
          <div className="ov-chart-header">
            <div>
              <h3>Seven Day Activity</h3>
              <p className="ov-subtitle">Commands, moderation, automod, and security trendlines</p>
            </div>
            <div className="ov-chart-badge">
              <i className="fa-solid fa-arrow-trend-up" />
              <span>7d</span>
            </div>
          </div>

          <div className="monarch-bars">
            {charts.map((point) => (
              <div key={point.label} className="monarch-bar-day">
                <div className="monarch-bar-stack">
                  {chartSeries.map(([key, label, color]) => (
                    <span
                      key={key}
                      className="monarch-bar"
                      data-label={`${point.label} ${label}: ${point[key] || 0}`}
                      style={{
                        height: `${Math.max(((point[key] || 0) / maxValue) * 100, 4)}%`,
                        '--bar-color': color
                      }}
                      title={`${point.label} ${label}: ${point[key] || 0}`}
                    />
                  ))}
                </div>
                <span>{point.label}</span>
              </div>
            ))}
          </div>

          <div className="monarch-chart-legend">
            {chartSeries.map(([key, label, color]) => (
              <span key={key} style={{ '--legend-color': color }}>
                <i />
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="ov-chart-card glass-panel">
          <div className="ov-chart-header">
            <div>
              <h3>Protection Summary</h3>
              <p className="ov-subtitle">Current activity split</p>
            </div>
          </div>
          <div className="ov-ai-footer" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
            <div className="ov-ai-footer-item"><i className="fa-solid fa-terminal" /><span>{metrics.totalCommands || 0} commands executed</span></div>
            <div className="ov-ai-footer-item"><i className="fa-solid fa-shield" /><span>{metrics.automodTriggers || 0} automod triggers</span></div>
            <div className="ov-ai-footer-item"><i className="fa-solid fa-lock" /><span>{metrics.securityAlerts || 0} security alerts</span></div>
            <div className="ov-ai-footer-item"><i className="fa-solid fa-gavel" /><span>{metrics.moderationActions || 0} moderation cases</span></div>
          </div>
        </div>
      </div>

      <div className="ov-bottom-row">
        <div className="ov-activity-card glass-panel">
          <div className="ov-chart-header">
            <h3>Recent Events</h3>
            <span className="ov-activity-count">{overview.recentEvents?.length || 0} latest</span>
          </div>
          <div className="ov-activity-list">
            {(overview.recentEvents || []).map((entry) => (
              <div key={`${entry.type}-${entry.summary}-${entry.createdAt}`} className="ov-activity-item">
                <div className="ov-activity-badge" style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8' }}>
                  <i className="fa-solid fa-bolt" />
                </div>
                <div className="ov-activity-info">
                  <div className="ov-activity-top">
                    <span className="ov-activity-action">{entry.type}</span>
                  </div>
                  <span className="ov-activity-target">{entry.summary}</span>
                  <span className="ov-activity-time">{new Date(entry.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="ov-ai-card glass-panel">
          <div className="ov-ai-header">
            <div className="ov-ai-title-row">
              <div className="ov-ai-icon-wrap">
                <i className="fa-solid fa-gavel" />
              </div>
              <div>
                <h3>Recent Moderation Cases</h3>
                <p className="ov-subtitle">MonarchClient case history</p>
              </div>
            </div>
          </div>
          <div className="ov-activity-list">
            {(overview.recentCases || []).map((entry) => (
              <div key={`${entry.caseId}-${entry.userId}`} className="ov-activity-item">
                <div className="ov-activity-badge" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
                  <i className="fa-solid fa-folder-open" />
                </div>
                <div className="ov-activity-info">
                  <div className="ov-activity-top">
                    <span className="ov-activity-action">Case #{entry.caseId}</span>
                    <span className="ov-activity-target">{entry.action}</span>
                  </div>
                  <span className="ov-activity-target">{entry.userId}</span>
                  <span className="ov-activity-time">{new Date(entry.date).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
