import { useState, useRef, useEffect } from 'react';
import YouTube from 'react-youtube';

function formatTime(secs) {
  const s = Math.floor(Math.max(0, secs));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function VideoPlayer({
  youtubeId,
  startSeconds = 0,
  endSeconds,
  hasFullAccess = true,
}) {
  const playerRef = useRef(null);
  const pollRef = useRef(null);
  // YouTube player states: -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
  const [playerState, setPlayerState] = useState(-1);
  const [elapsed, setElapsed] = useState(0);

  const chapterDuration = endSeconds != null ? endSeconds - startSeconds : null;

  useEffect(() => () => clearInterval(pollRef.current), []);

  function startPolling() {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      if (!playerRef.current) return;
      const ct = playerRef.current.getCurrentTime();
      setElapsed(ct - startSeconds);
      // Enforce chapter boundary even if YouTube's `end` param is ignored
      if (endSeconds != null && ct >= endSeconds) {
        playerRef.current.pauseVideo();
      }
    }, 250);
  }

  function onReady(e) {
    playerRef.current = e.target;
  }

  function onStateChange(e) {
    const state = e.data;
    setPlayerState(state);
    if (state === 1) {
      startPolling();
    } else {
      clearInterval(pollRef.current);
    }
  }

  function togglePlay() {
    if (!playerRef.current) return;
    if (playerState === 1) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  }

  const progress = chapterDuration ? Math.min(1, elapsed / chapterDuration) : 0;
  const isPlaying = playerState === 1;
  // Show the big central play prompt when video hasn't started yet
  const showPlayPrompt = playerState === -1 || playerState === 5;

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      start: Math.floor(startSeconds),
      ...(endSeconds != null ? { end: Math.floor(endSeconds) } : {}),
      rel: 0,
      modestbranding: 1,
      // Hide all native controls + keyboard shortcuts when chapter-only
      controls: hasFullAccess ? 1 : 0,
      disablekb: hasFullAccess ? 0 : 1,
    },
  };

  return (
    <div className="aspect-video w-full rounded-xl overflow-hidden bg-zinc-900 relative">
      <YouTube
        videoId={youtubeId}
        opts={opts}
        className="yt-embed w-full h-full"
        onReady={onReady}
        onStateChange={onStateChange}
      />

      {/* ── Chapter-only overlay ── */}
      {!hasFullAccess && (
        <>
          {/* Central play prompt when autoplay is blocked by browser */}
          {showPlayPrompt && (
            <div
              className="absolute inset-0 flex items-center justify-center cursor-pointer"
              onClick={togglePlay}
            >
              <div className="w-16 h-16 rounded-full bg-orange-500/90 hover:bg-orange-400 transition-colors flex items-center justify-center shadow-xl">
                <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          )}

          {/* Bottom controls bar — always visible, replaces native timeline */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-3 pb-3 pt-10">
            {/* Read-only progress bar — pointer-events-none prevents any click/drag */}
            <div className="w-full h-1.5 bg-white/20 rounded-full mb-3 pointer-events-none">
              <div
                className="h-full bg-orange-400 rounded-full transition-all duration-200"
                style={{ width: `${progress * 100}%` }}
              />
            </div>

            <div className="flex items-center gap-3">
              {/* Play / Pause */}
              <button
                onClick={togglePlay}
                className="text-white hover:text-orange-400 transition-colors shrink-0"
              >
                {isPlaying ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* Time display */}
              <span className="text-white/70 text-xs font-mono">
                {formatTime(elapsed)}
                {chapterDuration != null && ` / ${formatTime(chapterDuration)}`}
              </span>

              {/* Lock badge */}
              <div className="ml-auto flex items-center gap-1.5 bg-black/50 rounded-full px-2.5 py-1">
                <svg className="w-3 h-3 text-orange-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                </svg>
                <span className="text-orange-400 text-xs font-medium">Chapter only</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
