import { Link } from 'react-router-dom';
import { hasFullVideoAccess } from '../utils/access';

export default function VideoCard({ video }) {
  const unlocked = hasFullVideoAccess(video.id);
  const minPrice = Math.min(...video.chapters.map((c) => c.priceSats));

  return (
    <Link to={`/video/${video.id}`} className="group block">
      <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-orange-500/50 transition-colors">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-zinc-800">
          <img
            src={`https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`}
            alt={video.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
            }}
          />
          {!unlocked && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-2xl">
                ⚡
              </div>
            </div>
          )}
          {unlocked && (
            <div className="absolute top-2 right-2 bg-green-900/90 text-green-400 text-xs px-2 py-1 rounded-lg font-medium">
              Unlocked
            </div>
          )}
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {video.totalDuration}
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold text-white group-hover:text-orange-400 transition-colors line-clamp-2 leading-snug">
            {video.title}
          </h3>
          <p className="text-zinc-500 text-sm mt-1">{video.creator}</p>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800">
            <span className="text-zinc-500 text-xs">{video.chapters.length} chapters</span>
            <div>
              <span className="text-zinc-500 text-xs">from </span>
              <span className="text-orange-400 text-sm font-semibold">
                {minPrice.toLocaleString()} sats
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
