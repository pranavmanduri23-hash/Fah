import React, { useEffect, useState } from 'react';
import { apiGet } from '../lib/api';

function formatDuration(ms) {
  if (!ms || ms <= 0) return 'Live';
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function getElapsed(snapshot, tick) {
  const trackLength = snapshot?.currentTrack?.length || 0;
  const basePosition = Number(snapshot?.position || 0);
  const positionUpdatedAt = snapshot?.positionUpdatedAt ? new Date(snapshot.positionUpdatedAt).getTime() : null;

  if (!trackLength) return 0;
  if (snapshot?.paused || !positionUpdatedAt) {
    return Math.max(0, Math.min(basePosition, trackLength));
  }

  const livePosition = basePosition + Math.max(0, tick - positionUpdatedAt);
  return Math.max(0, Math.min(livePosition, trackLength));
}

function formatRemaining(snapshot, tick) {
  const trackLength = snapshot?.currentTrack?.length || 0;
  const elapsed = getElapsed(snapshot, tick);
  if (!trackLength) return 'Live stream';
  return `${formatDuration(Math.max(0, trackLength - elapsed))} remaining`;
}

function formatProgress(snapshot, tick) {
  const trackLength = snapshot?.currentTrack?.length || 0;
  const elapsed = getElapsed(snapshot, tick);
  if (!trackLength) return 0;
  return Math.max(0, Math.min((elapsed / trackLength) * 100, 100));
}

export default function Music({ selectedGuild }) {
  const [music, setMusic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(Date.now());

  useEffect(() => {
    let cancelled = false;

    const load = async (initial = false) => {
      if (!selectedGuild) return;

      try {
        if (initial) setLoading(true);
        const nextMusic = await apiGet(`/api/guilds/${selectedGuild}/music`, { cache: false });
        if (!cancelled) {
          setMusic(nextMusic);
        }
      } catch (error) {
        console.error('[Zenith Music]', error);
        if (initial && !cancelled) {
          setMusic(null);
        }
      } finally {
        if (initial && !cancelled) {
          setLoading(false);
        }
      }
    };

    setMusic(null);
    load(true);
    const refreshTimer = window.setInterval(() => load(false), 5000);

    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
    };
  }, [selectedGuild]);

  useEffect(() => {
    const timer = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="overview-loading">
        <div className="loading-spinner" />
        <p>Loading music telemetry...</p>
      </div>
    );
  }

  if (!music) {
    return (
      <div className="overview-loading">
        <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '2rem', color: '#f59e0b', marginBottom: '12px' }} />
        <p>Unable to load the music module right now. Try refreshing.</p>
      </div>
    );
  }

  const snapshot = music.nowPlaying;
  const track = snapshot?.currentTrack;
  const progress = formatProgress(snapshot, tick);
  const elapsed = getElapsed(snapshot, tick);
  const recentTracks = music.recentTracks || [];

  return (
    <div className="music-container">
      <section className="music-hero glass-panel">
        <div className="music-hero-art">
          {track?.thumbnail ? (
            <img src={track.thumbnail} alt={track.title || 'Track artwork'} />
          ) : (
            <div className="music-hero-fallback">
              <i className="fa-solid fa-wave-square" />
            </div>
          )}
        </div>

        <div className="music-hero-copy">
          <p className="topbar-eyebrow">Realtime playback relay</p>
          <h2>{track?.title || 'Nothing is playing right now'}</h2>
          <p className="subtitle">
            {track
              ? `${track.author || 'Unknown Artist'}${track.requester?.username ? ` • requested by ${track.requester.username}` : ''}`
              : 'When a track starts on the bot, Zenith will show the banner art, status, queue state, and playback timeline here.'}
          </p>

          <div className="music-meta-row">
            <span className={`badge ${snapshot?.status === 'playing' ? 'music-live' : ''}`}>
              <i className="fa-solid fa-signal" />
              {snapshot?.status || 'idle'}
            </span>
            <span className="badge"><i className="fa-solid fa-clock" /> {track ? formatRemaining(snapshot, tick) : 'Waiting for playback'}</span>
            <span className="badge"><i className="fa-solid fa-list" /> Queue {snapshot?.queueSize || 0}</span>
            <span className="badge"><i className="fa-solid fa-volume-high" /> {snapshot?.volume ?? 0}%</span>
            <span className="badge"><i className="fa-solid fa-repeat" /> Loop {snapshot?.loop || 'none'}</span>
            <span className="badge"><i className="fa-solid fa-broadcast-tower" /> Synced live</span>
          </div>

          <div className="music-progress-shell">
            <div className="music-progress-bar" style={{ width: `${progress}%` }} />
          </div>
          <div className="music-progress-copy">
            <span>{track ? formatDuration(elapsed) : '0:00'}</span>
            <span>{track ? formatDuration(track.length) : '0:00'}</span>
          </div>
        </div>
      </section>

      <div className="music-grid">
        <section className="music-panel glass-panel">
          <div className="panel-header">
            <div>
              <h3>Upcoming Queue</h3>
              <p className="ov-subtitle">The next tracks waiting on the current player.</p>
            </div>
            <span className="ov-chart-badge">
              <i className="fa-solid fa-forward" />
              <span>{snapshot?.upcoming?.length || 0} queued</span>
            </span>
          </div>

          <div className="music-log-list">
            {(snapshot?.upcoming || []).length ? (
              snapshot.upcoming.map((entry) => (
                <div key={`${entry.position}-${entry.title}-${entry.uri || 'track'}`} className="music-log-card">
                  <div className="music-log-art">
                    {entry.thumbnail ? <img src={entry.thumbnail} alt="" /> : <i className="fa-solid fa-music" />}
                  </div>
                  <div className="music-log-copy">
                    <strong>{entry.position}. {entry.title}</strong>
                    <span>{entry.author || 'Unknown Artist'}</span>
                  </div>
                  <span className="music-log-duration">{formatDuration(entry.length)}</span>
                </div>
              ))
            ) : (
              <div className="empty-mini">No queued tracks right now.</div>
            )}
          </div>
        </section>

        <section className="music-panel glass-panel">
          <div className="panel-header">
            <div>
              <h3>Playback Logs</h3>
              <p className="ov-subtitle">Recent music events recorded by the bot in this server.</p>
            </div>
            <span className="ov-chart-badge">
              <i className="fa-solid fa-history" />
              <span>{recentTracks.length} events</span>
            </span>
          </div>

          <div className="music-log-list">
            {recentTracks.length ? (
              recentTracks.map((entry) => {
                const details = entry.details || {};
                const loggedTrack = details.track || null;
                return (
                  <div key={`${entry.summary}-${entry.createdAt}`} className="music-log-card music-log-event">
                    <div className="music-log-art">
                      {loggedTrack?.thumbnail ? <img src={loggedTrack.thumbnail} alt="" /> : <i className="fa-solid fa-compact-disc" />}
                    </div>
                    <div className="music-log-copy">
                      <strong>{loggedTrack?.title || entry.summary}</strong>
                      <span>{loggedTrack?.author || entry.summary}</span>
                      <small>{new Date(entry.createdAt).toLocaleString()}</small>
                    </div>
                    <span className={`case-action-badge music-event-severity severity-${entry.severity || 'info'}`}>
                      {details.action || entry.severity || 'info'}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="empty-mini">No music telemetry has been recorded yet.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
