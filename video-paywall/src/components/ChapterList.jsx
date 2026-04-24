import { hasChapterAccess } from '../utils/access';

export default function ChapterList({ videoId, chapters, onSelectChapter, activeChapterId }) {
  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800">
        <h3 className="font-semibold text-white">Chapters</h3>
        <p className="text-zinc-500 text-xs mt-0.5">
          Buy individual chapters or the full video above
        </p>
      </div>

      <div className="divide-y divide-zinc-800/60">
        {chapters.map((chapter, i) => {
          const unlocked = hasChapterAccess(videoId, chapter.id);
          const isActive = activeChapterId === chapter.id;

          return (
            <div
              key={chapter.id}
              className={`px-4 py-3 transition-colors ${isActive ? 'bg-orange-950/30' : 'hover:bg-zinc-800/40'}`}
            >
              <div className="flex items-center gap-3">
                {/* Chapter number / check */}
                <div
                  className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-semibold shrink-0 ${
                    unlocked
                      ? 'bg-green-900/60 text-green-400'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {unlocked ? '✓' : i + 1}
                </div>

                {/* Title + duration */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white leading-tight truncate">
                    {chapter.title}
                  </p>
                  <p className="text-zinc-600 text-xs mt-0.5">{chapter.durationLabel}</p>
                </div>

                {/* Price + action */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-orange-400 text-xs font-medium">
                    {chapter.priceSats.toLocaleString()} sats
                  </span>
                  <button
                    onClick={() => onSelectChapter(chapter.id)}
                    className={`text-xs px-3 py-1 rounded-lg transition-colors font-medium ${
                      unlocked
                        ? 'bg-green-900/50 text-green-400 hover:bg-green-900/70'
                        : 'bg-zinc-800 text-white hover:bg-orange-500'
                    }`}
                  >
                    {unlocked ? 'Watch' : 'Buy'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
