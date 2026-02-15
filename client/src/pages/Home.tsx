import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useUnlocks, useUserStats } from "@/hooks/use-game-api";
import { PixelButton } from "@/components/ui/PixelButton";
import { CharacterCard } from "@/components/ui/CharacterCard";
import { motion } from "framer-motion";
import { User, Trophy, Coins, LogOut } from "lucide-react";
import { characters } from "@/lib/characters"; // We'll create this constant locally or fetch

export default function Home() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { data: unlocks = [] } = useUnlocks();
  const { data: stats } = useUserStats();
  
  const [selectedChar, setSelectedChar] = useState("commando");

  // Mock character data - in real app, might come from backend config
  const characterList = [
    { id: "commando", name: "Commando", description: "Reliable. Balanced. The standard for all survivors." },
    { id: "huntress", name: "Huntress", description: "Agile. Auto-aim. Strafe while shooting." },
    { id: "bandit", name: "Bandit", description: "High damage. Backstabs. Reset cooldowns on kill." },
    { id: "engineer", name: "Engineer", description: "Area control. Turrets. Strategic positioning." },
    { id: "artificer", name: "Artificer", description: "Burst damage. Hover. Elemental mastery." },
    { id: "mercenary", name: "Mercenary", description: "Melee. High mobility. I-frames." },
  ];

  // Check if character is unlocked
  const isUnlocked = (id: string) => {
    if (id === "commando") return true; // Default
    return unlocks.includes(id);
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black z-0" />
      <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-30 z-0" />
      <div className="scanlines absolute inset-0 pointer-events-none z-50 opacity-10" />

      <div className="relative z-10 container mx-auto px-4 py-8 flex flex-col min-h-screen">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
            <div>
                <h1 className="text-4xl md:text-6xl font-pixel text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-200 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                    PROTOCOL: SURVIVE
                </h1>
                <p className="text-white/50 font-tech uppercase tracking-[0.3em] mt-2 text-sm">
                    Atmospheric Roguelite Platformer
                </p>
            </div>

            <div className="flex items-center gap-6">
                {isAuthenticated ? (
                    <div className="flex items-center gap-6 bg-black/40 border border-white/10 px-6 py-3 rounded-full backdrop-blur-md">
                        <div className="flex flex-col items-end">
                            <span className="font-pixel text-xs text-primary">{user?.firstName || 'Survivor'}</span>
                            <div className="flex gap-4 text-xs text-white/60 mt-1">
                                <span className="flex items-center gap-1"><Trophy size={12} /> {stats?.totalRuns || 0} Runs</span>
                                <span className="flex items-center gap-1"><Coins size={12} /> {stats?.totalCoins || 0}</span>
                            </div>
                        </div>
                        <div className="h-8 w-px bg-white/10" />
                        <button onClick={() => logout()} className="text-white/50 hover:text-red-400 transition-colors">
                            <LogOut size={20} />
                        </button>
                    </div>
                ) : (
                    <PixelButton onClick={() => window.location.href = "/api/login"}>Login to Sync</PixelButton>
                )}
            </div>
        </header>

        {/* Main Content Grid */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-12 flex-1">
            
            {/* Left: Character Selection */}
            <div className="lg:col-span-8 flex flex-col gap-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-tech uppercase tracking-widest text-white/80 flex items-center gap-3">
                        <User className="text-primary" /> Select Survivor
                    </h2>
                    <span className="text-xs text-white/40 font-mono">
                        {unlocks.length + 1} / {characterList.length} UNLOCKED
                    </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {characterList.map((char) => (
                        <CharacterCard 
                            key={char.id}
                            {...char}
                            isUnlocked={isUnlocked(char.id)}
                            isSelected={selectedChar === char.id}
                            onSelect={() => setSelectedChar(char.id)}
                        />
                    ))}
                    {/* Placeholder slots for visuals */}
                    {Array.from({ length: 2 }).map((_, i) => (
                        <div key={`locked-${i}`} className="aspect-[3/4] border-2 border-white/5 bg-black/20 flex items-center justify-center opacity-30">
                            <span className="font-pixel text-xs text-white/20">LOCKED</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: Actions & Leaderboard Preview */}
            <div className="lg:col-span-4 flex flex-col gap-8">
                {/* Play Card */}
                <div className="bg-gradient-to-b from-slate-900 to-black border border-white/10 p-8 rounded-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] rounded-full group-hover:bg-primary/30 transition-all duration-500" />
                    
                    <h3 className="font-pixel text-xl text-white mb-2">{characterList.find(c => c.id === selectedChar)?.name}</h3>
                    <p className="text-white/60 text-sm mb-8 min-h-[40px]">
                        {characterList.find(c => c.id === selectedChar)?.description}
                    </p>

                    <PixelButton 
                        size="lg" 
                        className="w-full relative z-10"
                        onClick={() => setLocation(`/game?character=${selectedChar}`)}
                    >
                        INITIATE DROP
                    </PixelButton>

                    {!isAuthenticated && (
                        <p className="text-center text-[10px] text-white/30 mt-4">
                            Progress will not be saved unless logged in.
                        </p>
                    )}
                </div>

                {/* Mini Leaderboard */}
                <div className="flex-1 bg-black/20 border border-white/5 rounded-xl p-6 backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-pixel text-sm text-white/70">Top Survivors</h3>
                        <Link href="/leaderboard" className="text-xs text-primary hover:underline">View All</Link>
                    </div>
                    {/* Fetched data would map here */}
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between text-sm group">
                                <div className="flex items-center gap-3">
                                    <span className={`font-pixel text-xs ${i === 1 ? 'text-yellow-400' : 'text-white/30'}`}>#{i}</span>
                                    <span className="text-white/80 group-hover:text-primary transition-colors">VoidWalker{i*99}</span>
                                </div>
                                <span className="font-mono text-white/50">{(10000 - i * 500).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
      </div>
    </div>
  );
}
