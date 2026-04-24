import VideoCard from '../components/VideoCard';
import { videos } from '../data/videos';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Hero */}
      <div className="border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 text-orange-400 text-sm mb-6">
            <span>⚡</span> Powered by Lightning Network
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
            Pay to Watch.
            <br />
            <span className="text-orange-400">Own Your Access.</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-lg mx-auto">
            Buy access to full videos or individual chapters with instant Bitcoin Lightning payments.
            No subscriptions. No accounts.
          </p>
        </div>
      </div>

      {/* Video grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-xl font-semibold mb-6 text-white">Available Videos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      </div>
    </div>
  );
}
