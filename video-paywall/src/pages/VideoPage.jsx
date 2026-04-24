import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { videos } from '../data/videos';
import VideoPlayer from '../components/VideoPlayer';
import ChapterList from '../components/ChapterList';
import PaymentModal from '../components/PaymentModal';
import { hasFullVideoAccess, hasChapterAccess, grantAccess } from '../utils/access';

export default function VideoPage() {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const video = videos.find((v) => v.id === videoId);

  // activeContent: null | { type: 'full' } | { type: 'chapter', chapter: object }
  const [activeContent, setActiveContent] = useState(null);
  // paying: null | { type: 'full' } | { type: 'chapter', chapterId: string }
  const [paying, setPaying] = useState(null);
  const [, forceRender] = useState(0);

  if (!video) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 text-lg">Video not found.</p>
          <button onClick={() => navigate('/')} className="mt-4 text-orange-400 hover:underline">
            ← Back to Library
          </button>
        </div>
      </div>
    );
  }

  const hasFull = hasFullVideoAccess(video.id);

  function handleFullVideo() {
    if (hasFull) {
      setActiveContent({ type: 'full' });
    } else {
      setPaying({ type: 'full' });
    }
  }

  function handleSelectChapter(chapterId) {
    if (hasChapterAccess(video.id, chapterId)) {
      const chapter = video.chapters.find((c) => c.id === chapterId);
      setActiveContent({ type: 'chapter', chapter });
    } else {
      setPaying({ type: 'chapter', chapterId });
    }
  }

  function handlePaymentSuccess() {
    if (paying.type === 'full') {
      grantAccess(video.id);
      setActiveContent({ type: 'full' });
    } else {
      grantAccess(video.id, paying.chapterId);
      const chapter = video.chapters.find((c) => c.id === paying.chapterId);
      setActiveContent({ type: 'chapter', chapter });
    }
    setPaying(null);
    forceRender((n) => n + 1);
  }

  // Derive player props from activeContent
  const playerStart = activeContent?.chapter?.startSeconds ?? 0;
  const playerEnd = activeContent?.chapter?.endSeconds;
  const playerKey = `${video.youtubeId}-${playerStart}-${playerEnd ?? 'full'}`;

  // Derive payment modal props from paying
  const payingAmount =
    paying?.type === 'full'
      ? video.priceFullSats
      : video.chapters.find((c) => c.id === paying?.chapterId)?.priceSats;

  const payingDescription =
    paying?.type === 'full'
      ? `Full access: ${video.title}`
      : `Chapter: ${video.chapters.find((c) => c.id === paying?.chapterId)?.title}`;

  const activeChapterId = activeContent?.type === 'chapter' ? activeContent.chapter.id : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-zinc-400 hover:text-white mb-6 transition-colors text-sm"
        >
          ← Back to Library
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left: player or locked thumbnail ── */}
          <div className="lg:col-span-2 space-y-4">
            {activeContent ? (
              <VideoPlayer
                key={playerKey}
                youtubeId={video.youtubeId}
                startSeconds={playerStart}
                endSeconds={playerEnd}
                hasFullAccess={activeContent?.type === 'full'}
              />
            ) : (
              <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-900">
                <img
                  src={`https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`}
                  alt={video.title}
                  className="w-full h-full object-cover opacity-40"
                  onError={(e) => {
                    e.target.src = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
                  }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-4xl mb-3">
                    ⚡
                  </div>
                  <p className="text-zinc-300 font-medium">Pay to unlock this video</p>
                  <p className="text-zinc-500 text-sm mt-1">
                    Buy the full video or a single chapter below
                  </p>
                </div>
              </div>
            )}

            {/* Video metadata */}
            <div>
              <h1 className="text-2xl font-bold text-white">{video.title}</h1>
              <p className="text-orange-400 text-sm mt-1">{video.creator}</p>
              <p className="text-zinc-400 mt-3 leading-relaxed">{video.description}</p>
            </div>
          </div>

          {/* ── Right: purchase options ── */}
          <div className="space-y-4">
            {/* Full video card */}
            <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white">Full Video</h3>
                  <p className="text-zinc-500 text-xs mt-0.5">
                    {video.totalDuration} · {video.chapters.length} chapters
                  </p>
                </div>
                <span className="text-orange-400 font-bold text-sm">
                  {video.priceFullSats.toLocaleString()} sats
                </span>
              </div>
              <button
                onClick={handleFullVideo}
                className={`w-full py-2.5 rounded-xl font-medium text-sm transition-colors ${
                  hasFull
                    ? 'bg-green-900/40 text-green-400 border border-green-800'
                    : 'bg-orange-500 hover:bg-orange-400 text-white'
                }`}
              >
                {hasFull ? '✓ Unlocked — Watch Now' : `Pay ${video.priceFullSats.toLocaleString()} sats`}
              </button>
            </div>

            {/* Chapter list */}
            <ChapterList
              videoId={video.id}
              chapters={video.chapters}
              onSelectChapter={handleSelectChapter}
              activeChapterId={activeChapterId}
            />
          </div>
        </div>
      </div>

      {/* Payment modal */}
      {paying && (
        <PaymentModal
          amountSats={payingAmount}
          description={payingDescription}
          onSuccess={handlePaymentSuccess}
          onClose={() => setPaying(null)}
        />
      )}
    </div>
  );
}
