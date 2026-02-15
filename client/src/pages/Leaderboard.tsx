import { useLeaderboard } from "@/hooks/use-game-api";
import { Link } from "wouter";
import { ArrowLeft, Trophy } from "lucide-react";
import { format } from "date-fns";

export default function Leaderboard() {
  const { data: entries, isLoading } = useLeaderboard();

  return (
    <div className="min-h-screen bg-slate-950 text-foreground p-8 relative">
      <div className="scanlines absolute inset-0 pointer-events-none z-50 opacity-10" />
      <div className="max-w-4xl mx-auto relative z-10">
        
        <div className="flex items-center justify-between mb-12">
            <Link href="/" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors group">
                <ArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back to Base
            </Link>
            <h1 className="text-3xl font-pixel text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">
                GLOBAL RANKINGS
            </h1>
        </div>

        <div className="bg-black/40 border border-white/10 rounded-xl overflow-hidden backdrop-blur-md">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 font-pixel text-xs text-white/40 uppercase tracking-wider bg-white/5">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-4">Survivor</div>
                <div className="col-span-3 text-right">Score</div>
                <div className="col-span-2 text-center">Class</div>
                <div className="col-span-2 text-right">Date</div>
            </div>

            {/* List */}
            {isLoading ? (
                <div className="p-12 text-center text-white/30 animate-pulse font-pixel text-xs">Loading data stream...</div>
            ) : (
                <div className="divide-y divide-white/5">
                    {entries?.map((entry, index) => (
                        <div key={entry.id} className="grid grid-cols-12 gap-4 p-4 hover:bg-white/5 transition-colors items-center font-tech">
                            <div className="col-span-1 text-center font-pixel text-xs">
                                {index === 0 && <Trophy size={14} className="text-yellow-400 inline" />}
                                {index === 1 && <Trophy size={14} className="text-gray-400 inline" />}
                                {index === 2 && <Trophy size={14} className="text-amber-700 inline" />}
                                {index > 2 && <span className="text-white/30">{index + 1}</span>}
                            </div>
                            <div className="col-span-4 font-bold text-white">{entry.username || 'Unknown'}</div>
                            <div className="col-span-3 text-right font-mono text-primary">{entry.score.toLocaleString()}</div>
                            <div className="col-span-2 text-center text-xs uppercase text-white/50 border border-white/10 rounded px-1 py-0.5">{entry.characterId}</div>
                            <div className="col-span-2 text-right text-xs text-white/30">
                                {format(new Date(entry.createdAt), 'MMM d, yyyy')}
                            </div>
                        </div>
                    ))}
                    {entries?.length === 0 && (
                        <div className="p-12 text-center text-white/30">No runs recorded yet. Be the first.</div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
